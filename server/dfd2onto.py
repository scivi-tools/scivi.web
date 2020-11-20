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

    def layout_onto(self, onto):
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

    def drop_layout_onto(self, onto):
        for node in onto.nodes():
            if ("attributes" in node) and ("order" in node["attributes"]):
                del node["attributes"]["order"]

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

    def add_proto_node(self, motherNode, dfdOnto):
        result = None
        protoNodes = dfdOnto.get_nodes_by_name(motherNode["name"])
        if protoNodes:
            for p in protoNodes:
                if ("attributes" in p) and ("mother" in p["attributes"]) and (p["attributes"]["mother"] == motherNode["id"]):
                    result = p
                    break
        if not result:
            result = dfdOnto.add_node(motherNode["name"], { "mother": motherNode["id"] })
        return result

    def instanciate_node(self, motherNode, instNmb, instAttrs, dfdOnto, dfdI, dfdO):
        instanceNode = dfdOnto.add_node(self.get_instance_name(motherNode["name"], instNmb), instAttrs)
        protoNode = self.add_proto_node(motherNode, dfdOnto)
        dfdOnto.link_nodes(instanceNode, protoNode, "is_instance")
        # Add inputs.
        motherInputs = self.onto.get_typed_nodes_linked_from(motherNode, "has", "Input")
        for motherInput in motherInputs:
            instanceInput = dfdOnto.add_node(self.get_instance_name(motherInput["name"], instNmb))
            protoInput = self.add_proto_node(motherInput, dfdOnto)
            dfdOnto.link_nodes(instanceInput, protoInput, "is_instance")
            dfdOnto.link_nodes(protoInput, dfdI, "is_a")
            dfdOnto.link_nodes(protoNode, protoInput, "has")
            dfdOnto.link_nodes(instanceNode, instanceInput, "has")
        # Add outputs.
        motherOutputs = self.onto.get_typed_nodes_linked_from(motherNode, "has", "Output")
        for motherOutput in motherOutputs:
            instanceOutput = dfdOnto.add_node(self.get_instance_name(motherOutput["name"], instNmb))
            protoOutput = self.add_proto_node(motherOutput, dfdOnto)
            dfdOnto.link_nodes(instanceOutput, protoOutput, "is_instance")
            dfdOnto.link_nodes(protoOutput, dfdO, "is_a")
            dfdOnto.link_nodes(protoNode, protoOutput, "has")
            dfdOnto.link_nodes(instanceNode, instanceOutput, "has")
        return instanceNode

    def get_dfd_data(self, dfdNode, key):
        if ("data" in dfdNode) and (key in dfdNode["data"]):
            return dfdNode["data"][key]
        return {}

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
            motherNode = self.onto.first(self.onto.get_nodes_by_name(dfdNode["title"]))
            instNmb = 1
            if dfdNode["title"] in resultInstances:
                instNmb = resultInstances[dfdNode["title"]]
                instNmb += 1
                resultInstances[dfdNode["title"]] = instNmb
            else:
                resultInstances[dfdNode["title"]] = instNmb
            instanceNode = self.instanciate_node(motherNode, \
                                                 instNmb, \
                                                 { "settingsVal": self.get_dfd_data(dfdNode, "settingsVal"), \
                                                   "settingsType": self.get_dfd_data(dfdNode, "settingsType"), \
                                                   "dfd": dfdNode["id"] }, \
                                                 result, resultI, resultO)
            resultNodesArr[dfdNode["id"]] = instanceNode
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
        self.layout_onto(result)
        return result

    def io_has_worker(self, dfdOnto, ioNode, workerName):
        hostNode = dfdOnto.first(dfdOnto.get_nodes_linked_to(ioNode, "has"))
        protoNode = dfdOnto.first(dfdOnto.get_nodes_linked_from(hostNode, "is_instance"))
        if ("attributes" in protoNode) and ("mother" in protoNode["attributes"]):
            motherNode = self.onto.get_node_by_id(protoNode["attributes"]["mother"])
            return self.onto.first(self.onto.get_typed_nodes_linked_to(motherNode, "is_instance", workerName))
        return False

    def replace_io(self, dfdOnto, node, rx, tx, workerName, rxNmb, txNmb, dfdI, dfdO):
        '''
        Replace a part of DFD by given receiver and/or transmitter.
        This enables converting DFD of mixed session into the set of smaller DFDs for individual computation parts.
        Mixed session is a session involving multiple computation resources simultaneously, for example, server, client and edge device.
        The DFD of a mixed session contains different kinds workers: ClientSideWorker, ServerSideWorker, EdgeSideWorker.
        This method helps to split up this DFD into the parts, each one containing just one kind of workers.
        The border between the parts is replaced by data receivers and transmitters to ensure the seamless data flow.
        @param dfdOnto - DFD which is to be modified. It will be changed by this method, so make sure to pass here a deep copy of an original DFD.
        @param node - node that does not belong to the computation resource dfdOnto stands for.
                      This node, all its instances (nodes linked to it by "is_instance"), all its belongings (nodes linked from it by "has"),
                      and all instances of its belongings (nodes linked to its belongings by "is_instance") will be removed from dfdOnto with
                      all the incident links.
        @param rx - receiver (the node with a single output) that instances should replace all the outputs of <node>, which are connected
                    with the nodes of computation resource dfdOnto stands for.
        @param tx - transmitter (the node with a single input) that instances should replace all the inputs of <node>, which are connected
                    with the nodes of computation resource dfdOnto stands for.
        @param workerName - name of the worker indicating the computation resource.
        @param rxNmb - number of rx instances already added to dfdOnto.
        @param txNmb - number of tx instances already added to dfdOnto.
        @param dfdI - root input node of dfdOnto.
        @param dfdO - root output node of dfdOnto.
        @return tuple with updated rxNmb and txNmb.
        '''
        instancesToRemove = dfdOnto.get_nodes_linked_to(node, "is_instance")
        belongingsToRemove = dfdOnto.get_nodes_linked_from(node, "has")
        for b in belongingsToRemove:
            instancesOfBelongings = dfdOnto.get_nodes_linked_to(b, "is_instance")
            for ib in instancesOfBelongings: # inctances of inputs and outputs of node
                if dfdOnto.is_node_of_type(b, "Input"):
                    connectedOutputs = dfdOnto.get_nodes_linked_to(ib, "is_used")
                    for co in connectedOutputs:
                        if self.io_has_worker(dfdOnto, co, "EdgeSideWorker"):
                            txInstance = self.instanciate_node(tx, txNmb, \
                                                               { "settingsVal": { "Input Address": ib["id"] }, \
                                                                 "settingsType": { "Input Address": "Integer" } }, \
                                                               dfdOnto, dfdI, dfdO)
                            txInstanceInput = dfdOnto.first(dfdOnto.get_nodes_linked_from(txInstance, "has"))
                            dfdOnto.link_nodes(co, txInstanceInput, "is_used")
                            txNmb += 1
                elif dfdOnto.is_node_of_type(b, "Output"):
                    connectedInputs = dfdOnto.get_nodes_linked_from(ib, "is_used")
                    for ci in connectedInputs:
                        if self.io_has_worker(dfdOnto, ci, "EdgeSideWorker"):
                            rxInstance = self.instanciate_node(rx, rxNmb, \
                                                               { "settingsVal": { "Input Address": ib["id"] }, \
                                                                 "settingsType": { "Input Address": "Integer" } }, \
                                                               dfdOnto, dfdI, dfdO)
                            rxInstanceOutput = dfdOnto.first(dfdOnto.get_nodes_linked_from(rxInstance, "has"))
                            dfdOnto.link_nodes(rxInstanceOutput, ci, "is_used")
                            rxNmb += 1
                dfdOnto.remove_node(ib)
                ib["attributes"] = {}
            dfdOnto.remove_node(b)
            b["attributes"] = {}
        for i in instancesToRemove:
            dfdOnto.remove_node(i)
            i["attributes"] = {}
        dfdOnto.remove_node(node)
        node["attributes"] = {}
        return rxNmb, txNmb
