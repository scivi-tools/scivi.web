#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto
import math
import io
import struct


class RPN:
    def __init__(self, operations):
        self.top = -1
        self.array = []
        self.output = []
        self.operations = operations
        self.expression = None

    def empty(self):
        return self.top == -1

    def peek(self):
        return self.array[-1]

    def pop(self):
        if not self.empty():
            self.top -= 1
            return self.array.pop()
        else:
            raise ValueError("Incorrect expression " + str(self.expression))

    def push(self, op):
        self.top += 1
        self.array.append(op)

    def operand(self, op):
        return not (op in self.operations)

    def less_priority(self, op):
        try:
            p1 = self.operations[op]["prec"]
            p2 = self.operations[self.peek()]["prec"]
            return p1 <= p2
        except KeyError:
            return False

    def append(self, op):
        if (op != "(") and (op != ")"):
            self.output.append(op)

    def convert(self, expression):
        self.expression = expression
        for token in expression:
            if self.operand(token):
                self.append(token)
            elif token == "(":
                self.push(token)
            elif token == ")":
                while (not self.empty()) and (self.peek() != "("):
                    op = self.pop()
                    self.append(op)
                if (not self.empty()) and (self.peek() != "("):
                    raise ValueError("Incorrect expression " + str(self.expression))
                else:
                    self.pop()
            else:
                while (not self.empty()) and self.less_priority(token):
                    self.append(self.pop())
                self.push(token)
        while not self.empty():
            self.append(self.pop())
        return self.output

class Eon:
    def __init__(self, onto):
        self.onto = onto
        self.operations = {\
            "dw":  { "prec": 1, "opcode": 0 }, \
            "osc": { "prec": 1, "opcode": 1 }, \
        }
        self.INST_SUFFIX = " Inst"

    def get_attrs(self, node, data):
        if ("attributes" in node) and ("eval" in node["attributes"]):
            code = node["attributes"]["eval"]
            code = self.resolve_settings(code, data)
            return { "eval": code }
        else:
            return None

    def instance_of_type(self, node, type, onto):
        instNode = onto.first(onto.get_nodes_linked_from(node, "instance_of"))
        return onto.is_node_of_type(instNode, type)

    def instances_of_type(self, node, type, onto):
        hasNodes = onto.get_nodes_linked_from(node, "has")
        result = []
        for hasNode in hasNodes:
            motherNode = onto.first(onto.get_nodes_linked_from(hasNode, "instance_of"))
            if motherNode and onto.is_node_of_type(motherNode, type):
                result.append(hasNode)
        return result

    def get_node_order(self, node, onto):
        if not node:
            return -1
        if not node["name"].endswith(self.INST_SUFFIX):
            return onto.last_id()
        if self.instance_of_type(node, "Input", onto):
            return self.get_node_order(onto.first(onto.get_nodes_linked_to(node, "use_for")), onto) + 1
        if self.instance_of_type(node, "Output", onto):
            return self.get_node_order(onto.first(onto.get_nodes_linked_to(node, "has")), onto) + 1
        result = 0
        nodeInputs = self.instances_of_type(node, "Input", onto)
        for nodeInput in nodeInputs:
            result = max(result, self.get_node_order(nodeInput, onto) + 1)
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
        onto.data["nodes"] = sorted(onto.nodes(), key = lambda node: self.get_node_order(node, onto))
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
            if not node["name"].endswith(self.INST_SUFFIX):
                instNode = onto.first(onto.get_nodes_linked_to(node, "instance_of"))
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

    def link(self, src, srcOutputNumber, dst, dstInputNumber, onto):
        motherSrc = onto.first(onto.get_nodes_linked_from(src, "instance_of"))
        motherDst = onto.first(onto.get_nodes_linked_from(dst, "instance_of"))
        outputs = onto.get_typed_nodes_linked_from(motherSrc, "has", "Output")
        inputs = onto.get_typed_nodes_linked_from(motherDst, "has", "Input")
        motherOutput = outputs[srcOutputNumber]
        motherInput = inputs[dstInputNumber]
        srcComps = onto.get_nodes_linked_from(src, "has")
        dstComps = onto.get_nodes_linked_from(dst, "has")
        instOutput = None
        for c in srcComps:
            if onto.first(onto.get_nodes_linked_from(c, "instance_of")) == motherOutput:
                instOutput = c
                break
        instInput = None
        for c in dstComps:
            if onto.first(onto.get_nodes_linked_from(c, "instance_of")) == motherInput:
                instInput = c
                break
        if instOutput and instInput:
            onto.link_nodes(instOutput, instInput, "use_for")

    def resolve_settings(self, code, data):
        settings = data["settingsVal"]
        for s in settings:
            code = code.replace(s, str(settings[s]))
        return code

    def get_all_linked_nodes(self, node, onto):
        result = []
        for link in onto.links():
            linked = onto.get_nodes_linked_from(node, link["name"])
            if linked and len(linked) > 0:
                result += linked
            linked = onto.get_nodes_linked_to(node, link["name"])
            if linked and len(linked) > 0:
                result += linked
        return result

    def dump_attrs(self, node, onto):
        result = io.BytesIO()
        tokens = []
        curToken = ""
        delimeters = [" ", ",", "(", ")"]
        for ch in node["attributes"]["eval"]:
            if ch in delimeters:
                if len(curToken) > 0:
                    tokens.append(curToken)
                    curToken = ""
                    if (ch == "(") or (ch == ")"):
                        tokens.append(ch)
                continue
            curToken += ch
        if len(curToken) > 0:
            tokens.append(curToken)
        linked = self.get_all_linked_nodes(node, onto)
        tokens = RPN(self.operations).convert(tokens)
        for token in tokens:
            if token in self.operations:
                # Function ID is stored like this: 1 0 X X X X X X,
                # where X are bits of ID number.
                result.write(bytes([self.operations[token]["opcode"] | 0x80]))
            else:
                linkedNode = None
                for ln in linked:
                    if ln["name"] == token + self.INST_SUFFIX:
                        linkedNode = ln
                        break
                if linkedNode:
                    # Node address is stored like this: 0 0 X X X X X X,
                    # where X are bits of ID number.
                    result.write(bytes([linkedNode["id"]]))
                else:
                    # Numeric value is stored like this: 0 1 T T T T T T,
                    # where T are bits of type ID; afterwards goes the value, which length may vary
                    # according to the type.
                    # The values are stored in the network byte order (big endian).
                    # Supported types:
                    # 0 - uint8
                    # 1 - uint16
                    # 2 - uint32
                    # 3 - int8
                    # 4 - int16
                    # 5 - int32
                    # 6 - float32
                    try:
                        intVal = int(token) # integer?
                        # 8, 16 and 32 bit signed and unsigned integers are supported.
                        # Let's guess which one we have and store accordingly.
                        if intVal < 0: # signed
                            if intVal < -32767: # int32
                                result.write(struct.pack("!Bi", 5 | 0x40, intVal))
                            elif intVal < -127: # int16
                                result.write(struct.pack("!Bh", 4 | 0x40, intVal))
                            else: # int8
                                result.write(struct.pack("!Bb", 3 | 0x40, intVal))
                        else: # unsigned
                            if intVal > 65535: # uint32
                                result.write(struct.pack("!BI", 2 | 0x40, intVal))
                            elif intVal > 255: # uint16
                                result.write(struct.pack("!BH", 1 | 0x40, intVal))
                            else: #uint8
                                result.write(struct.pack("!BB", 0 | 0x40, intVal))
                    except ValueError:
                        try:
                            floatVal = float(token) # float?
                            result.write(struct.pack("!Bf", 6 | 0x40, floatVal))
                        except ValueError:
                            raise ValueError("Undefined token in eval attribute of <" + node["name"] + ">: " + token)
        return result.getbuffer()

    def dump_len(self, chunk):
        return struct.pack("!H", chunk.getbuffer().nbytes)

    def add_mother_node(self, nodeName, motherID, onto):
        result = None
        motherNodes = onto.get_nodes_by_name(nodeName)
        if motherNodes:
            for m in motherNodes:
                if ("attributes" in m) and ("mother" in m["attributes"]):
                    result = m
                    break
        if not result:
            result = onto.add_node(nodeName, { "mother": motherID })
        return result

    def get_ont(self, dfd):
        dfdNodes = dfd["nodes"]
        resultNodesArr = {}
        result = Onto.empty()
        resultI = result.add_node("Input")
        resultO = result.add_node("Output")
        motherNode = None
        # Add all nodes from DFD.
        for dfdNodeKey in dfdNodes:
            dfdNode = dfdNodes[dfdNodeKey]
            # Add node.
            resultAttrs = {}
            ontoNode = self.onto.first(self.onto.get_nodes_by_name(dfdNode["title"]))
            resultNode = result.add_node(dfdNode["title"] + self.INST_SUFFIX, self.get_attrs(ontoNode, dfdNode["data"]))
            motherNode = self.add_mother_node(dfdNode["title"], ontoNode["id"], result)
            result.link_nodes(resultNode, motherNode, "instance_of")
            resultNodesArr[dfdNode["id"]] = resultNode
            # Add inputs.
            ontoInputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Input")
            for ontoInput in ontoInputs:
                resultInput = result.add_node(ontoInput["name"] + self.INST_SUFFIX, self.get_attrs(ontoInput, dfdNode["data"]))
                motherInput = self.add_mother_node(ontoInput["name"], ontoInput["id"], result)
                result.link_nodes(resultInput, motherInput, "instance_of")
                result.link_nodes(motherInput, resultI, "is_a")
                result.link_nodes(motherNode, motherInput, "has")
                result.link_nodes(resultNode, resultInput, "has")
            # Add outputs.
            ontoOutputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Output")
            for ontoOutput in ontoOutputs:
                resultOutput = result.add_node(ontoOutput["name"] + self.INST_SUFFIX, self.get_attrs(ontoOutput, dfdNode["data"]))
                motherOutput = self.add_mother_node(ontoOutput["name"], ontoOutput["id"], result)
                result.link_nodes(resultOutput, motherOutput, "instance_of")
                result.link_nodes(motherOutput, resultO, "is_a")
                result.link_nodes(motherNode, motherOutput, "has")
                result.link_nodes(resultNode, resultOutput, "has")
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

    def get_eon(self, eonOnto):
        if len(eonOnto.nodes()) > 64:
            raise ValueError("Cannot compose EON16 stream: too many nodes in ontology (" + str(len(eonOnto.nodes())) + ")")

        result = io.BytesIO()
        # Links chunk
        linksChunk = io.BytesIO()
        usedNodes = {}
        for link in eonOnto.links():
            # Format 16 bit (task onto is limited to 64 nodes)
            # S - src node ID
            # D - dst node ID
            # tID - internal task onto ID
            # mID - external mother onto ID
            # use_for:     SSSSSS 0000 DDDDDD          // src and dst are tIDs
            # instance_of: SSSSSS 10 DDDDDDDD          // src is tID, dst is mID, dst <= 256
            # instance_of: SSSSSS 11 DDDDDDDD DDDDDDDD // src is tID, dst is mID, 256 < dst <= 65536
            if link["name"] == "use_for":
                linksChunk.write(bytes([link["source_node_id"] << 2]))
                linksChunk.write(bytes([link["destination_node_id"]]))
            elif link["name"] == "instance_of":
                srcNode = eonOnto.get_node_by_id(link["source_node_id"])
                dstNode = eonOnto.get_node_by_id(link["destination_node_id"])
                if (eonOnto.first(eonOnto.get_nodes_linked_from(srcNode, "use_for")) or \
                    eonOnto.first(eonOnto.get_nodes_linked_to(srcNode, "use_for"))) and \
                    ("attributes" in dstNode) and ("mother" in dstNode["attributes"]):
                    motherID = int(dstNode["attributes"]["mother"])
                    if motherID <= 256:
                        linksChunk.write(bytes([link["source_node_id"] << 2 | 0x2]))
                        linksChunk.write(bytes([motherID]))
                    elif motherID <= 65536:
                        linksChunk.write(bytes([link["source_node_id"] << 2 | 0x3]))
                        linksChunk.write(bytes([motherID >> 8, motherID & 0xFF]))

        # Attributes chunk
        attrsChunk = io.BytesIO()
        for node in eonOnto.nodes():
            if ("attributes" in node) and ("eval" in node["attributes"]):
                # ID of node with attributes is stored like this: 1 1 X X X X X X,
                # where X are bits of ID number.
                attrsChunk.write(bytes([node["id"] | 0xC0]))
                attrsChunk.write(self.dump_attrs(node, eonOnto))

        # Compose stream
        result.write(self.dump_len(linksChunk))
        result.write(linksChunk.getbuffer())
        result.write(self.dump_len(attrsChunk))
        result.write(attrsChunk.getbuffer())

        print(result.getbuffer().nbytes)
        s = result.getvalue().hex()
        arr = (a+b for a,b in zip(s[::2], s[1::2]))
        outStr = ""
        for b in arr:
            outStr += "0x" + b + ", "
        print("{%s}" % (outStr))
        
        return result.getvalue()

