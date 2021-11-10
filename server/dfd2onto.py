#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto
import copy


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

    def is_resource(self, node, onto):
        return onto.first(onto.get_nodes_linked_to(node, "is_hosted")) != None

    def instance_of_type(self, node, type, onto):
        instNode = onto.first(onto.get_nodes_linked_from(node, "is_instance"))
        return onto.is_node_of_type(instNode, type)

    def get_node_order(self, node, onto):
        if not node:
            return -1
        if ("attributes" in node) and ("order" in node["attributes"]):
            return node["attributes"]["order"]
        if self.is_prototype(node, onto) or self.is_resource(node, onto):
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
            if self.is_prototype(node, onto) or self.is_resource(node, onto):
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
        ioNodes = sorted(ioNodes, key = lambda inp: int(inp["id"]))
        index = 0
        for ioNode in ioNodes:
            if self.instance_of_type(ioNode, type, onto):
                if index == nmb:
                    return ioNode
                index += 1
        return None

    def get_number_of_io(self, node, type, io, onto):
        ioNodes = onto.get_nodes_linked_from(node, "has")
        index = 0
        for ioNode in ioNodes:
            if self.instance_of_type(ioNode, type, onto):
                if ioNode == io:
                    return index
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

    def instanciate_node(self, motherNode, hostNode, instNmb, instAttrs, dfdOnto, dfdI, dfdO):
        instanceNode = dfdOnto.add_node(self.get_instance_name(motherNode["name"], instNmb), instAttrs)
        protoNode = self.add_proto_node(motherNode, dfdOnto)
        dfdOnto.link_nodes(instanceNode, protoNode, "is_instance")
        dfdOnto.link_nodes(instanceNode, hostNode, "is_hosted")
        # Add inputs.
        motherInputs = self.onto.get_typed_nodes_linked_from(motherNode, "has", "Input")
        motherInputs = sorted(motherInputs, key = lambda inp: int(inp["id"]))
        for motherInput in motherInputs:
            instanceInput = dfdOnto.add_node(self.get_instance_name(motherInput["name"], instNmb))
            protoInput = self.add_proto_node(motherInput, dfdOnto)
            dfdOnto.link_nodes(instanceInput, protoInput, "is_instance")
            dfdOnto.link_nodes(protoInput, dfdI, "is_a")
            dfdOnto.link_nodes(protoNode, protoInput, "has")
            dfdOnto.link_nodes(instanceNode, instanceInput, "has")
        # Add outputs.
        motherOutputs = self.onto.get_typed_nodes_linked_from(motherNode, "has", "Output")
        motherOutputs = sorted(motherOutputs, key = lambda inp: int(inp["id"]))
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

    def get_hosting(self, node, dfdOnto):
        # TODO: this should be changed when we'll be able to choose hosting in the GUI for ambigous cases.
        # Ambigues case is when there are multiple workers of given node,
        # or there are multiple computing resurses linked to corresponding worker.
        workers = self.onto.get_nodes_linked_to(node, "is_instance")
        n = len(workers)
        if n == 0:
            raise ValueError("No worker for <" + node["name"] + ">")
        elif n > 1:
            raise ValueError("Ambigous worker for <" + node["name"] + ">")
        workerType = self.onto.first(self.onto.get_nodes_linked_from(workers[0], "is_a"))
        resources = self.onto.get_nodes_linked_from(workerType, "is_used")
        n = len(resources)
        if n == 0:
            raise ValueError("No computing resource can handle <" + node["name"] + ">")
        elif n > 1:
            raise ValueError("Ambigous computing resource for <" + node["name"] + ">")
        res = self.onto.first(resources)
        resProto = dfdOnto.first(dfdOnto.get_nodes_by_name(res["name"]))
        hosting = dfdOnto.first(dfdOnto.get_nodes_linked_to(resProto, "is_instance"))
        return hosting

    def get_res_address(self, resName):
        # TODO: this should be derived from GUI.
        if resName == "ESP8266":
            return "192.168.1.4:81"
        elif resName == "SciVi Web Server":
            return "127.0.0.1:81"
        return ""

    def traverse_computing_resources(self, res, dfdOnto):
        ch = self.onto.get_nodes_linked_to(res, "is_a")
        if len(ch) == 0:
            resInst = dfdOnto.add_node(res["name"] + self.INST_SUFFIX, { "address": self.get_res_address(res["name"]) })
            resProto = dfdOnto.add_node(res["name"])
            dfdOnto.link_nodes(resInst, resProto, "is_instance")
        else:
            for c in ch:
                self.traverse_computing_resources(c, dfdOnto)

    def instanciate_computing_resources(self, dfdOnto):
        # TODO: do it according to the info from GUI.
        self.traverse_computing_resources(self.onto.first(self.onto.get_nodes_by_name("ComputingResource")), dfdOnto)

    def get_onto(self, dfd):
        dfdNodes = dfd["nodes"]
        resultNodesArr = {}
        result = Onto.empty()
        resultI = result.add_node("Input")
        resultO = result.add_node("Output")
        resultInstances = {}
        self.instanciate_computing_resources(result)
        # Add all nodes from DFD.
        for dfdNodeKey in dfdNodes:
            dfdNode = dfdNodes[dfdNodeKey]
            # Add node.
            resultAttrs = {}
            motherNode = self.onto.first(self.onto.get_nodes_by_name(dfdNode["title"]))
            hostNode = self.get_hosting(motherNode, result)
            instNmb = 1
            if dfdNode["title"] in resultInstances:
                instNmb = resultInstances[dfdNode["title"]]
                instNmb += 1
                resultInstances[dfdNode["title"]] = instNmb
            else:
                resultInstances[dfdNode["title"]] = instNmb
            instanceNode = self.instanciate_node(motherNode, hostNode, instNmb, \
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

    def io_has_hosting(self, dfdOnto, ioNode, hostNode):
        opNode = dfdOnto.first(dfdOnto.get_nodes_linked_to(ioNode, "has"))
        result = dfdOnto.first(dfdOnto.get_nodes_linked_from(opNode, "is_hosted"))
        return hostNode == result

    def find_rxtx(self, dfdOnto, srcHost, dstHost):
        '''
        Find a way to pass data between two given computing resources.
        @param srcHost - source computation resource.
        @param dstHost - destinaton computation resource.
        @return operator node for the 'srcHost' computing resource that corrsponds to the data receiver/transmitter
                for the desired communication protocol.
        '''
        srcRes = dfdOnto.first(dfdOnto.get_nodes_linked_from(srcHost, "is_instance"))
        dstRes = dfdOnto.first(dfdOnto.get_nodes_linked_from(dstHost, "is_instance"))
        src = self.onto.first(self.onto.get_nodes_by_name(srcRes["name"]))
        dst = self.onto.first(self.onto.get_nodes_by_name(dstRes["name"]))
        srcWorkers = self.onto.get_nodes_linked_to(src, "is_used")
        dstWorkers = self.onto.get_nodes_linked_to(dst, "is_used")
        protocol = self.onto.first(self.onto.get_nodes_by_name("Protocol"))
        protocols = self.onto.get_nodes_linked_to(protocol, "is_a")
        commonProtocols = []
        for p in protocols:
            pImpls = self.onto.get_nodes_linked_to(p, "is_instance")
            hasSrcImpl = False
            hasDstImpl = False
            for pImpl in pImpls:
                pWorker = self.onto.first(self.onto.get_nodes_linked_from(pImpl, "is_a"))
                if pWorker in srcWorkers:
                    hasSrcImpl = True
                elif pWorker in dstWorkers:
                    hasDstImpl = True
                if hasSrcImpl and hasDstImpl:
                    commonProtocols.append(p)
                    break
        if len(commonProtocols) == 0:
            #TODO: create proxy
            raise ValueError("Common protocol not found for <" + srcHost["name"] + "> and <" + dstHost["name"] + ">")
        else:
            return commonProtocols[0]

    def remove_node(self, dfdOnto, node):
        node["attributes"] = {}
        dfdOnto.remove_node(node)

    def replace_io(self, dfdOnto, node, hostNode, rxtxNmb, dfdI, dfdO, addrCorrespondence):
        '''
        Replace a part of DFD by corresponding receiver and/or transmitter.
        This enables converting DFD of mixed session into the set of smaller DFDs for individual computation parts.
        Mixed session is a session involving multiple computation resources simultaneously, for example, server, client and edge device.
        Key point of mixed session is operator hosting. If some operator, described by the node N in the ontology, 
        is connected to the resource R by 'is_hosted' link: N -is_hosted-> R, this means, N should be executed on R. 
        Whereby R -is_instance-> ResClass -is_a-> ComputingResource.
        For example:
        Log2 Inst -is_hosted-> SciVi Web Client Inst -is_instance-> SciVi Web Client -is_a-> ComputingResource
        means that the instance of Log2 operator should be executed on the particular SciVi Web Client (called 'SciVi Web Client Inst').
        Here 'SciVi Web Client Inst' is particular computing resource, and 'SciVi Web Client' is class of computing resources.
        Note, that there can be multiple different resources of the same class, and they do not necessary have shared memory, so they need to use
        receivers/transmitters as well.
        This method helps to split up this DFD into the parts, each one containing uniform hosting (all the operators have the same hosting,
        whereby they can communicate directly, without receivers/transmitters in between).
        In other words, this method helps to create task ontology for particular computing resource.
        The border between the parts is replaced by data receivers and transmitters to ensure the seamless data flow.
        @param dfdOnto - DFD which is to be modified. It will be changed by this method, so make sure to pass here a deep copy of an original DFD.
        @param node - node that does not belong to the computing resource dfdOnto stands for.
                      This node and all its belongings (nodes linked from it by "has") will be removed from dfdOnto with
                      all the incident links.
        @param hostNode - node representing desired hosting (the actual computing resource we create task ontology for).
        @param rxtxNmb - number of rx/tx instances already added to dfdOnto.
        @param dfdI - root input node of dfdOnto.
        @param dfdO - root output node of dfdOnto.
        @param addrCorrespondence - array where to append pairs {'address':['dfdNodeID', 'isInput', 'socketNumber']}, where
                                    address - node address receiver/transmitter will use by data marshalling,
                                    dfdNodeID - ID of operator instance in DFD, which has to receive/transmit the data
                                                (this is not the operator which corresponds to address, this is the one who has connected
                                                to the addressed node),
                                    isInput - flag, determining if the socket is input (True) or output (False),
                                    socketNumber - number of socket in corresponding DFD operator.
                                    This array will help client (which has just a DFD, no onto) to handle marshalling.
        @return updated rxtxNmb.
        '''
        belongingsToRemove = dfdOnto.get_nodes_linked_from(node, "has")
        targetHost = dfdOnto.first(dfdOnto.get_nodes_linked_from(node, "is_hosted"))
        for b in belongingsToRemove:
            isInput = self.instance_of_type(b, "Input", dfdOnto)
            connected = dfdOnto.get_nodes_linked_to(b, "is_used")
            for c in connected:
                if self.io_has_hosting(dfdOnto, c, hostNode):
                    rxtx = self.find_rxtx(dfdOnto, hostNode, targetHost)
                    rxtxInst = self.instanciate_node(rxtx, hostNode, rxtxNmb, \
                                                     { "settingsVal": { "Node Address": b["id"], \
                                                                        "Target Address": targetHost["attributes"]["address"] }, \
                                                       "settingsType": { "Node Address": "Integer", \
                                                                         "Target Address": "String" }, \
                                                       "dfd": node["attributes"]["dfd"] }, \
                                                     dfdOnto, dfdI, dfdO)
                    if isInput:
                        rxtxSocketName = "Input"
                        operatorSocketType = "Output"
                    else:
                        rxtxSocketName = "Output"
                        operatorSocketType = "Input"
                    operatorNode = dfdOnto.first(dfdOnto.get_nodes_linked_to(c, "has"))
                    if b["id"] in addrCorrespondence:
                        cor = addrCorrespondence[b["id"]]
                    else:
                        cor = []
                        addrCorrespondence[b["id"]] = cor
                    cor.append([ operatorNode["attributes"]["dfd"], \
                                 not isInput, \
                                 self.get_number_of_io(operatorNode, operatorSocketType, c, dfdOnto)])
                    rxtxSocket = None
                    rxtxInstBelongings = dfdOnto.get_nodes_linked_from(rxtxInst, "has")
                    for rxtxB in rxtxInstBelongings:
                        if self.instance_of_type(rxtxB, rxtxSocketName, dfdOnto):
                            rxtxSocket = rxtxB
                            break
                    if isInput:
                        dfdOnto.link_nodes(c, rxtxSocket, "is_used")
                    else:
                        dfdOnto.link_nodes(rxtxSocket, c, "is_used")
                    rxtxNmb += 1
            self.remove_node(dfdOnto, b)
        self.remove_node(dfdOnto, node)
        return rxtxNmb

    def split_onto(self, dfdOnto, hostNode):
        result = copy.deepcopy(dfdOnto)
        rxtxNmb = 1
        dfdI = result.first(result.get_nodes_by_name("Input"))
        dfdO = result.first(result.get_nodes_by_name("Output"))
        needsRelayout = False
        corTable = {}

        # Replace I/O.
        dfdNodes = result.nodes().copy()
        for node in dfdNodes:
            aff = result.first(result.get_nodes_linked_from(node, "is_hosted"))
            if aff and (aff != hostNode):
                rxtxNmb = self.replace_io(result, node, hostNode, rxtxNmb, dfdI, dfdO, corTable)
                needsRelayout = True

        # Cleanup unusedd operators.
        dfdNodes = result.nodes().copy()
        for node in dfdNodes:
            if ("attributes" in node) and ("mother" in node["attributes"]) and \
               (len(result.get_nodes_linked_to(node, "is_instance")) == 0):
               self.remove_node(result, node)
               needsRelayout = True

        # Cleanup unused computing resources.
        dfdNodes = result.nodes().copy()
        for node in dfdNodes:
            if ("attributes" in node) and ("address" in node["attributes"]):
                if node != hostNode:
                    resProto = result.get_nodes_linked_from(node, "is_instance")
                    for rp in resProto:
                        self.remove_node(result, rp)
                    self.remove_node(result, node)
                    needsRelayout = True

        # Update layout.
        if (needsRelayout):
            self.drop_layout_onto(result)
            self.layout_onto(result)

        return result, corTable
