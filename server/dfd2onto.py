#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto


class DFD2Onto:
    def __init__(self, onto):
        self.onto = onto
        self.INST_SUFFIX = " Inst"

    def get_instance_name(self, name, nmb):
        if nmb > 1:
            return name + self.INST_SUFFIX + "_" + str(nmb)
        else:
            return name + self.INST_SUFFIX

    def get_instance_number(self, node):
        m = re.match(".+" + self.INST_SUFFIX + "_(\d+)", node["name"])
        if m and len(m.groups()) > 0:
            return int(m.groups()[0])
        elif node["name"].endswith(self.INST_SUFFIX):
            return 1
        else:
            return 0

    def is_prototype(self, node, onto):
        return onto.first(onto.get_nodes_linked_from(node, "is_instance")) == None

    def instance_of_type(self, node, type, onto):
        instNode = onto.first(onto.get_nodes_linked_from(node, "is_instance"))
        return onto.is_node_of_type(instNode, type)

    def get_node_order(self, node, onto):
        if not node:
            return -1
        if ("attributes" in node) and ("order" in node["attributes"]):
            return node["attributes"]["order"]
        if self.is_prototype(node, onto):
            return onto.last_id()
        if self.instance_of_type(node, "Input", onto):
            return self.get_node_order(onto.first(onto.get_nodes_linked_to(node, "is_used")), onto) + 1
        if self.instance_of_type(node, "Output", onto):
            return self.get_node_order(onto.first(onto.get_nodes_linked_to(node, "has")), onto) + 1
        result = 0
        belongings = onto.get_nodes_linked_from(node, "has")
        for b in belongings:
            if self.instance_of_type(b, "Input", onto):
                result = max(result, self.get_node_order(b, onto) + 1)
        return result

    def get_link_order(self, link, onto):
        srcNode = link["source_node_id"]
        index = 0
        for node in onto.nodes():
            if node["id"] == srcNode:
                break
            index += 1
        return index

    def normalize_onto(self, onto):
        transNodes = {}
        index = 1
        for node in onto.nodes():
            transNodes[node["id"]] = index
            node["id"] = index
            index += 1
        for link in onto.links():
            link["id"] = index
            link["source_node_id"] = transNodes[link["source_node_id"]]
            link["destination_node_id"] = transNodes[link["destination_node_id"]]
            index += 1

    def layout_nodes(self, onto):
        for node in onto.nodes():
            if not ("attributes" in node):
                node["attributes"] = {}
            node["attributes"]["order"] = self.get_node_order(node, onto)
        onto.data["nodes"] = sorted(onto.nodes(), key = lambda node: node["attributes"]["order"])
        onto.data["relations"] = sorted(onto.links(), key = lambda link: self.get_link_order(link, onto))
        self.normalize_onto(onto)
        w = 100
        h = 30
        prevOrder = -2
        y = 0
        ny = -h * 2
        maxWidth = 0
        processedNodes = []
        for node in onto.nodes():
            if self.is_prototype(node, onto):
                instNode = onto.first(onto.get_nodes_linked_to(node, "is_instance"))
                if instNode:
                    node["position_x"] = instNode["position_x"]
                    node["position_y"] = instNode["position_y"] - h
                else:
                    node["position_x"] = maxWidth / 2
                    node["position_y"] = ny
                    ny = ny - h
                continue
            order = self.get_node_order(node, onto)
            if order == prevOrder:
                y = y + h * 2
            else:
                y = 0
            prevOrder = order
            node["position_x"] = w * order
            node["position_y"] = y
            maxWidth = max(maxWidth, w * order)

    def get_io_of_number(self, node, type, nmb, onto):
        ioNodes = onto.get_nodes_linked_from(node, "has")
        index = 0
        for ioNode in ioNodes:
            if self.instance_of_type(ioNode, type, onto):
                if index == nmb:
                    return ioNode
                index += 1
        return None

    def link(self, src, srcOutputNumber, dst, dstInputNumber, onto):
        instOutput = self.get_io_of_number(src, "Output", srcOutputNumber, onto)
        instInput = self.get_io_of_number(dst, "Input", dstInputNumber, onto)
        if instOutput and instInput:
            onto.link_nodes(instOutput, instInput, "is_used")

    def add_mother_node(self, nodeName, motherID, onto):
        result = None
        motherNodes = onto.get_nodes_by_name(nodeName)
        if motherNodes:
            for m in motherNodes:
                if ("attributes" in m) and ("mother" in m["attributes"]) and (m["attributes"]["mother"] == motherID):
                    result = m
                    break
        if not result:
            result = onto.add_node(nodeName, { "mother": motherID })
        return result

    def get_onto(self, dfd):
        dfdNodes = dfd["nodes"]
        resultNodesArr = {}
        result = Onto.empty()
        resultI = result.add_node("Input")
        resultO = result.add_node("Output")
        resultInstances = {}
        # Add all nodes from DFD.
        for dfdNodeKey in dfdNodes:
            dfdNode = dfdNodes[dfdNodeKey]
            # Add node.
            resultAttrs = {}
            ontoNode = self.onto.first(self.onto.get_nodes_by_name(dfdNode["title"]))
            instNmb = 1
            if dfdNode["title"] in resultInstances:
                instNmb = resultInstances[dfdNode["title"]]
                instNmb += 1
                resultInstances[dfdNode["title"]] = instNmb
            else:
                resultInstances[dfdNode["title"]] = instNmb
            resultNode = result.add_node(self.get_instance_name(dfdNode["title"], instNmb), \
                                         { "settingsVal": dfdNode["data"]["settingsVal"], "settingsType": dfdNode["data"]["settingsType"] })
            motherNode = self.add_mother_node(dfdNode["title"], ontoNode["id"], result)
            result.link_nodes(resultNode, motherNode, "is_instance")
            resultNodesArr[dfdNode["id"]] = resultNode
            # Add inputs.
            ontoInputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Input")
            for ontoInput in ontoInputs:
                resultInput = result.add_node(self.get_instance_name(ontoInput["name"], instNmb))
                motherInput = self.add_mother_node(ontoInput["name"], ontoInput["id"], result)
                result.link_nodes(resultInput, motherInput, "is_instance")
                result.link_nodes(motherInput, resultI, "is_a")
                result.link_nodes(motherNode, motherInput, "has")
                result.link_nodes(resultNode, resultInput, "has")
            # Add outputs.
            ontoOutputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Output")
            for ontoOutput in ontoOutputs:
                resultOutput = result.add_node(self.get_instance_name(ontoOutput["name"], instNmb))
                motherOutput = self.add_mother_node(ontoOutput["name"], ontoOutput["id"], result)
                result.link_nodes(resultOutput, motherOutput, "is_instance")
                result.link_nodes(motherOutput, resultO, "is_a")
                result.link_nodes(motherNode, motherOutput, "has")
                result.link_nodes(resultNode, resultOutput, "has")
        # Add data connection from DFD as is_used links.
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

