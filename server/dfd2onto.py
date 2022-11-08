#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from collections import deque
import re
from typing import Any, List, Tuple

from onto.onto import Link, Node, Onto, first
import copy


class DFD2Onto:
    def __init__(self, onto: Onto):
        self.onto = onto
        self.INST_SUFFIX = " Inst"

    def get_instance_name(self, name, nmb):
        if nmb > 1:
            return name + self.INST_SUFFIX + "_" + str(nmb)
        else:
            return name + self.INST_SUFFIX

    def get_instance_number(self, node: Node):
        m = re.match(".+" + self.INST_SUFFIX + "_(\d+)", node.name)
        if m and len(m.groups()) > 0:
            return int(m.groups()[0])
        elif node.name.endswith(self.INST_SUFFIX):
            return 1
        else:
            return 0

    def is_prototype(self, node: Node, onto: Onto):
        return len(onto.get_nodes_linked_from(node, "is_instance")) == 0

    def is_resource(self, node: Node, onto: Onto):
        return len(onto.get_nodes_linked_to(node, "is_hosted")) > 0

    def instance_of_type(self, node, type, onto: Onto):
        instNode = first(onto.get_nodes_linked_from(node, "is_instance"))
        return onto.is_node_of_type(instNode, type)

    def get_node_order(self, node: Node, onto: Onto, visited_nodes : List[Node] = []):
        if not node:
            return -1
        
        if "order" in node.attributes:
            return node.attributes["order"]
        if self.is_prototype(node, onto) or self.is_resource(node, onto):
            return onto.last_id

        new_visited_nodes = [n for n in visited_nodes]
        new_visited_nodes.append(node)
        if self.instance_of_type(node, "Input", onto) and node not in visited_nodes:
            prev_output = first(onto.get_nodes_linked_to(node, "is_used"))
            return self.get_node_order(prev_output, onto, new_visited_nodes) + 1
        if self.instance_of_type(node, "Output", onto) and node not in visited_nodes:
            owner = first(onto.get_nodes_linked_to(node, "has"))
            return self.get_node_order(owner, onto, new_visited_nodes) + 1
        
        result = 0
        belongings = onto.get_nodes_linked_from(node, "has")
        for b in belongings:
            if self.instance_of_type(b, "Input", onto) and node not in visited_nodes:
                result = max(result, self.get_node_order(b, onto, new_visited_nodes) + 1)
        return result

    def get_link_order(self, link: Link, onto: Onto):
        srcNode = link.source_node_id
        index = 0
        for node in onto.nodes:
            if node.id == srcNode:
                break
            index += 1
        return index

    def normalize_onto(self, onto: Onto):
        transNodes = {}
        index = 1
        for node in onto.nodes:
            transNodes[node.id] = index
            node.id = index
            index += 1
        for link in onto.links:
            link.id = index
            link.source_node_id = transNodes[link.source_node_id]
            link.destination_node_id = transNodes[link.destination_node_id]
            index += 1

    def layout_onto(self, onto: Onto):
        for node in onto.nodes:
            node.attributes["order"] = self.get_node_order(node, onto)

        onto.nodes = sorted(onto.nodes, key = lambda node: node.attributes["order"])
        onto.links = sorted(onto.links, key = lambda link: self.get_link_order(link, onto))
        self.normalize_onto(onto)
        w = 100
        h = 30
        prevOrder = -2
        y = 0
        ny = -h * 2
        maxWidth = 0
        processedNodes = []
        for node in onto.nodes:
            if self.is_prototype(node, onto) or self.is_resource(node, onto):
                instNode = first(onto.get_nodes_linked_to(node, "is_instance"))
                if instNode:
                    node.position_x = instNode.position_x
                    node.position_y = instNode.position_y - h
                else:
                    node.position_x = maxWidth / 2
                    node.position_y = ny
                    ny = ny - h
                continue
            order = self.get_node_order(node, onto)
            if order == prevOrder:
                y = y + h * 2
            else:
                y = 0
            prevOrder = order
            node.position_x = w * order
            node.position_y = y
            maxWidth = max(maxWidth, w * order)

    def drop_layout_onto(self, onto: Onto):
        for node in onto.nodes:
            if "order" in node.attributes:
                del node.attributes["order"]

    def get_io_of_number(self, node: Node, type, nmb, onto: Onto):
        ioNodes = onto.get_nodes_linked_from(node, "has")
        ioNodes = sorted(ioNodes, key = lambda inp: inp.id)
        index = 0
        for ioNode in ioNodes:
            if self.instance_of_type(ioNode, type, onto):
                if index == nmb:
                    return ioNode
                index += 1
        return None

    def get_number_of_io(self, node: Node, type, io, onto: Onto):
        ioNodes = onto.get_nodes_linked_from(node, "has")
        index = 0
        for ioNode in ioNodes:
            if self.instance_of_type(ioNode, type, onto):
                if ioNode == io:
                    return index
                index += 1
        return None

    def link(self, src: Node, srcOutputNumber, dst: Node, dstInputNumber, onto: Onto):
        instOutput = self.get_io_of_number(src, "Output", srcOutputNumber, onto)
        instInput = self.get_io_of_number(dst, "Input", dstInputNumber, onto)
        if instOutput and instInput:
            onto.link_nodes(instOutput, instInput, "is_used")

    def add_proto_node(self, motherNode: Node, dfdOnto: Onto):
        result = None
        protoNodes = dfdOnto.get_nodes_by_name(motherNode.name)
        if protoNodes:
            for p in protoNodes:
                if ("mother" in p.attributes) and (p.attributes["mother"] == motherNode.id):
                    result = p
                    break
        if not result:
            result = dfdOnto.add_node(motherNode.name, { "mother": motherNode.id })
        return result

    def instanciate_node(self, motherNode: Node, hostNode: Node, instNmb, instAttrs, dfdOnto: Onto, dfdI: Node, dfdO: Node):
        instanceNode = dfdOnto.add_node(self.get_instance_name(motherNode.name, instNmb), instAttrs)
        protoNode = self.add_proto_node(motherNode, dfdOnto)
        dfdOnto.link_nodes(instanceNode, protoNode, "is_instance")
        dfdOnto.link_nodes(instanceNode, hostNode, "is_hosted")
        # Add inputs.
        motherInputs = self.onto.get_typed_nodes_linked_from(motherNode, "has", "Input")
        motherInputs = sorted(motherInputs, key = lambda inp: inp.id)
        for motherInput in motherInputs:
            instanceInput = dfdOnto.add_node(self.get_instance_name(motherInput.name, instNmb))
            protoInput = self.add_proto_node(motherInput, dfdOnto)
            dfdOnto.link_nodes(instanceInput, protoInput, "is_instance")
            dfdOnto.link_nodes(protoInput, dfdI, "is_a")
            dfdOnto.link_nodes(protoNode, protoInput, "has")
            dfdOnto.link_nodes(instanceNode, instanceInput, "has")
        # Add outputs.
        motherOutputs = self.onto.get_typed_nodes_linked_from(motherNode, "has", "Output")
        motherOutputs = sorted(motherOutputs, key = lambda inp: inp.id)
        for motherOutput in motherOutputs:
            instanceOutput = dfdOnto.add_node(self.get_instance_name(motherOutput.name, instNmb))
            protoOutput = self.add_proto_node(motherOutput, dfdOnto)
            dfdOnto.link_nodes(instanceOutput, protoOutput, "is_instance")
            dfdOnto.link_nodes(protoOutput, dfdO, "is_a")
            dfdOnto.link_nodes(protoNode, protoOutput, "has")
            dfdOnto.link_nodes(instanceNode, instanceOutput, "has")
        return instanceNode

    def get_dfd_data(self, dfdNode: dict, key: str):
        if ("data" in dfdNode) and (key in dfdNode["data"]):
            return dfdNode["data"][key]
        return {}

    def get_res_address(self, res: Node, dfdNode: dict):
        if res.name == "SciVi Web Server":
            return "127.0.0.1:81" # TODO: real server IP should be substituted here
        else:
            try:
                addresses = dfdNode["data"]["settings"]["Address"]
                addressIdx = dfdNode["data"]["settingsVal"]["Address"]
                return addresses[int(addressIdx)] + ":81"
            except KeyError:
                pass
        return ""

    def get_hosting(self, node: Node, dfdNode: dict, dfdOnto: Onto):
        '''
        Get the computing resource instance associated with the given node.
        If there is an instance in the task ontology, it is returned. Otherwise, it is created and appended to the task ontology.
        @param node - node to get hosting for.
        @param dfdNode - corresponding node from the DFD.
        @param dfdOnto - task ontology.
        @return the computing rource instance for given node.
        '''
        workers = self.onto.get_nodes_linked_to(node, "is_instance")
        n = len(workers)
        if n == 0:
            raise ValueError("No worker for <" + node.name + ">")
        elif n > 1:
            raise ValueError("Ambigous worker for <" + node.name + ">")
        workerType = first(self.onto.get_nodes_linked_from(workers[0], "is_a"))
        resources = self.onto.get_nodes_linked_from(workerType, "is_used")
        n = len(resources)
        if n == 0:
            raise ValueError("No computing resource can handle <" + node.name + ">")
        elif n > 1:
            raise ValueError("Ambigous computing resource for <" + node.name + ">")
        res = first(resources)
        resProto = first(dfdOnto.get_nodes_by_name(res.name))
        if not resProto:
            resProto = dfdOnto.add_node(res.name)
        resAddress = self.get_res_address(resProto, dfdNode)
        resInstName = resProto.name + "@" + resAddress
        hosting = first(dfdOnto.get_nodes_by_name(resInstName))
        if not hosting:
            hosting = dfdOnto.add_node(resInstName, { "address": resAddress })
            dfdOnto.link_nodes(hosting, resProto, "is_instance")
        return hosting

    def get_onto(self, dfdJSON) -> Onto:
        dfdNodes = dfdJSON["nodes"]
        resultNodesArr: dict[Node] = {}
        result = Onto.empty()
        resultI = result.add_node("Input")
        resultO = result.add_node("Output")
        resultInstances = {}
        # Add all nodes from DFD.
        for dfdNodeKey in dfdNodes:
            dfdNode = dfdNodes[dfdNodeKey]
            # Add node.
            resultAttrs = {}
            motherNode = first(self.onto.get_nodes_by_name(dfdNode["title"]))
            hostNode = self.get_hosting(motherNode, dfdNode, result)
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
                                                   "settings": self.get_dfd_data(dfdNode, "settings"), \
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

    def io_has_hosting(self, dfdOnto: Onto, ioNode: Node, hostNode):
        opNode = first(dfdOnto.get_nodes_linked_to(ioNode, "has"))
        result = first(dfdOnto.get_nodes_linked_from(opNode, "is_hosted"))
        return hostNode == result

    def find_rxtx(self, dfdOnto: Onto, srcHost: Node, dstHost: Node):
        '''
        Find a way to pass data between two given computing resources.
        @param srcHost - source computation resource.
        @param dstHost - destinaton computation resource.
        @return operator node for the 'srcHost' computing resource that corrsponds to the data receiver/transmitter
                for the desired communication protocol.
        '''
        srcRes = first(dfdOnto.get_nodes_linked_from(srcHost, "is_instance"))
        dstRes = first(dfdOnto.get_nodes_linked_from(dstHost, "is_instance"))
        src = first(self.onto.get_nodes_by_name(srcRes.name))
        dst = first(self.onto.get_nodes_by_name(dstRes.name))
        srcWorkers = self.onto.get_nodes_linked_to(src, "is_used")
        dstWorkers = self.onto.get_nodes_linked_to(dst, "is_used")
        protocol = first(self.onto.get_nodes_by_name("Protocol"))
        protocols = self.onto.get_nodes_linked_to(protocol, "is_a")
        commonProtocols = []
        for p in protocols:
            pImpls = self.onto.get_nodes_linked_to(p, "is_instance")
            hasSrcImpl = False
            hasDstImpl = False
            for pImpl in pImpls:
                pWorker = first(self.onto.get_nodes_linked_from(pImpl, "is_a"))
                if pWorker in srcWorkers:
                    hasSrcImpl = True
                elif pWorker in dstWorkers:
                    hasDstImpl = True
                if hasSrcImpl and hasDstImpl:
                    commonProtocols.append(p)
                    break
        if len(commonProtocols) == 0:
            #TODO: create proxy
            raise ValueError("Common protocol not found for <" + srcHost.name + "> and <" + dstHost.name + ">")
        else:
            return commonProtocols[0]

    def remove_node(self, onto: Onto, node: Node):
        node.attributes = {}
        onto.remove_node(node)

    def replace_io(self, dfdOnto: Onto, node: Node, hostNode: Node, rxtxNmb, dfdI: Node, dfdO: Node, addrCorrespondence):
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
        @param dfdOnto - ontology which is to be modified. It will be changed by this method, so make sure to pass here a deep copy of an original ontology.
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
        targetHost = first(dfdOnto.get_nodes_linked_from(node, "is_hosted"))
        for b in belongingsToRemove:
            isInput = self.instance_of_type(b, "Input", dfdOnto)
            if isInput:
                connected = dfdOnto.get_nodes_linked_to(b, "is_used")
            else:
                connected = dfdOnto.get_nodes_linked_from(b, "is_used")
            for c in connected:
                if self.io_has_hosting(dfdOnto, c, hostNode):
                    rxtx = self.find_rxtx(dfdOnto, hostNode, targetHost)
                    rxtxInst = self.instanciate_node(rxtx, hostNode, rxtxNmb, \
                                                     { "settingsVal": { "Node Address": b.id, \
                                                                        "Target Address": targetHost.attributes["address"] }, \
                                                       "settingsType": { "Node Address": "Integer", \
                                                                         "Target Address": "String" }, \
                                                       "dfd": node.attributes["dfd"] }, \
                                                     dfdOnto, dfdI, dfdO)
                    if isInput:
                        rxtxSocketName = "Input"
                        operatorSocketType = "Output"
                    else:
                        rxtxSocketName = "Output"
                        operatorSocketType = "Input"
                    operatorNode = first(dfdOnto.get_nodes_linked_to(c, "has"))
                    if b.id in addrCorrespondence:
                        cor = addrCorrespondence[b.id]
                    else:
                        cor = []
                        addrCorrespondence[b.id] = cor
                    cor.append([ operatorNode.attributes["dfd"], \
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

    def split_onto(self, dfdOnto: Onto, hostNode: Node) -> Tuple[Onto, Any]: 
        result = copy.deepcopy(dfdOnto)
        rxtxNmb = 1
        dfdI = first(result.get_nodes_by_name("Input"))
        dfdO = first(result.get_nodes_by_name("Output"))
        needsRelayout = False
        corTable = {}
        
        # Replace I/O.
        dfdNodes = result.nodes.copy()
        for node in dfdNodes:
            aff = first(result.get_nodes_linked_from(node, "is_hosted"))
            if aff and (aff.id != hostNode.id):
                rxtxNmb = self.replace_io(result, node, hostNode, rxtxNmb, dfdI, dfdO, corTable)
                needsRelayout = True
        
        # Cleanup unusedd operators.
        dfdNodes = result.nodes.copy()
        for node in dfdNodes:
            if ("mother" in node.attributes) and \
               (len(result.get_nodes_linked_to(node, "is_instance")) == 0):
               self.remove_node(result, node)
               needsRelayout = True
        # Cleanup unused computing resources.
        dfdNodes = result.nodes.copy()
        for node in dfdNodes:
            if "address" in node.attributes:
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
