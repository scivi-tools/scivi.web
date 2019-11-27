#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto
import math


class Eon:
    def __init__(self, onto):
        self.onto = onto

    def get_code(self, node):
        instances = self.onto.get_nodes_linked_to(node, "instance_of")
        for inst in instances:
            if ("attributes" in inst) and ("inline" in inst["attributes"]):
                return inst["attributes"]["inline"]
        return None

    def layout_nodes(self, onto):
        n = int(math.sqrt(len(onto.nodes())))
        i = 0
        j = 0
        x = -300
        y = -300
        w = 100
        h = 30
        for node in onto.nodes():
            node["position_x"] = x + i * w
            node["position_y"] = y + j * h
            i = i + 1
            if i == n:
                i = 0
                j = j + 1

    def link(self, src, srcOutputNumber, dst, dstInputNumber, onto):
        outputs = onto.get_typed_nodes_linked_from(src, "has", "Output")
        inputs = onto.get_typed_nodes_linked_from(dst, "has", "Input")
        onto.link_nodes(outputs[srcOutputNumber], inputs[dstInputNumber], "use_for")

    def generate(self, dfd):
        dfdNodes = dfd["nodes"]
        resultNodesArr = {}
        result = Onto.empty()
        resultI = result.add_node("Input")
        resultO = result.add_node("Output")
        # Add all nodes from DFD.
        for dfdNodeKey in dfdNodes:
            dfdNode = dfdNodes[dfdNodeKey]
            # Add node.
            resultAttrs = {}
            ontoNode = self.onto.first(self.onto.get_nodes_by_name(dfdNode["title"]))
            resultCode = self.get_code(ontoNode)
            if resultCode:
                resultAttrs["inline"] = resultCode
            resultNode = result.add_node(dfdNode["title"], resultAttrs)
            resultNodesArr[dfdNode["id"]] = resultNode
            # Add inputs.
            ontoInputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Input")
            for ontoInput in ontoInputs:
                resultInput = result.add_node(ontoInput["name"])
                result.link_nodes(resultNode, resultInput, "has")
                result.link_nodes(resultInput, resultI, "is_a")
            # Add outputs.
            ontoOutputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Output")
            for ontoOutput in ontoOutputs:
                resultOutput = result.add_node(ontoOutput["name"])
                result.link_nodes(resultNode, resultOutput, "has")
                result.link_nodes(resultOutput, resultO, "is_a")
        # Add data connection from DFD as use_for links.
        for dfdNodeKey in dfdNodes:
            dfdNode = dfdNodes[dfdNodeKey]
            for dfdOutputNumber in range(0, len(dfdNode["outputs"])):
                dfdOutput = dfdNode["outputs"][dfdOutputNumber]
                for dfdConnection in dfdOutput["connections"]:
                    self.link(resultNodesArr[dfdNode["id"]], dfdOutputNumber, \
                              resultNodesArr[dfdConnection["node"]], dfdConnection["input"], \
                              result)
        self.layout_nodes(result)
        result.write_to_file("test.ont")

