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

    def get_node_order(self, node, onto):
        if not node:
            return -1
        if (node["name"] == "Input") or (node["name"] == "Output"):
            return onto.last_id()
        if onto.is_node_of_type(node, "Input"):
            return self.get_node_order(onto.first(onto.get_nodes_linked_to(node, "use_for")), onto) + 1
        if onto.is_node_of_type(node, "Output"):
            return self.get_node_order(onto.first(onto.get_nodes_linked_to(node, "has")), onto) + 1
        result = 0
        nodeInputs = onto.get_typed_nodes_linked_from(node, "has", "Input")
        for nodeInput in nodeInputs:
            result = max(result, self.get_node_order(nodeInput, onto) + 1)
        return result

    def layout_nodes(self, onto):
        onto.data["nodes"] = sorted(onto.nodes(), key = lambda node: self.get_node_order(node, onto))
        w = 100
        h = 30
        prevOrder = -2
        y = 0
        maxHeight = 0
        maxWidth = 0
        for node in onto.nodes():
            order = self.get_node_order(node, onto)
            if order == prevOrder:
                y = y + h
                if order != onto.last_id():
                    maxHeight = max(maxHeight, y)
            else:
                y = 0
            prevOrder = order
            if order == onto.last_id():
                node["position_x"] = maxWidth / 2
                node["position_y"] = y + maxHeight + h * 3
            else:
                node["position_x"] = w * order
                node["position_y"] = y
                maxWidth = max(maxWidth, w * order)

    def link(self, src, srcOutputNumber, dst, dstInputNumber, onto):
        outputs = onto.get_typed_nodes_linked_from(src, "has", "Output")
        inputs = onto.get_typed_nodes_linked_from(dst, "has", "Input")
        onto.link_nodes(outputs[srcOutputNumber], inputs[dstInputNumber], "use_for")

    def resolve_settings(self, code, data):
        settings = data["settingsVal"]
        for s in settings:
            code = code.replace(s, str(settings[s]))
        return code

    def generate(self, dfd):
        dfdNodes = dfd["nodes"]
        resultNodesArr = {}
        result = Onto.empty()
        resultI = result.add_node("Input")
        resultO = result.add_node("Output")
        # resultL = result.add_node("Loop")
        # Add all nodes from DFD.
        for dfdNodeKey in dfdNodes:
            dfdNode = dfdNodes[dfdNodeKey]
            # Add node.
            resultAttrs = {}
            ontoNode = self.onto.first(self.onto.get_nodes_by_name(dfdNode["title"]))
            resultCode = self.get_code(ontoNode)
            if resultCode:
                resultAttrs["inline"] = self.resolve_settings(resultCode, dfdNode["data"])
            resultNode = result.add_node(dfdNode["title"], resultAttrs)
            # if self.onto.is_node_of_type(ontoNode, "Loop"):
            #     result.link_nodes(resultNode, resultL, "is_a")
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
        # Layout onto.
        self.layout_nodes(result)
        return result

    def convert_to_stream(self, eonOnto):
        pass

