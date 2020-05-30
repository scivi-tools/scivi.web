#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto
import math
import io
import struct
import re


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
        return (not (op in self.operations)) and (op != "(") and (op != ")")

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

    def convertToFloat(self, x):
        fx = None
        try:
            fx = float(x)
        except ValueError:
            pass
        return fx

    def opAdd(self, token):
        y = self.pop()
        x = self.pop()
        fx = self.convertToFloat(x)
        fy = self.convertToFloat(y)
        if (fx != None) and (fy != None):
            self.push(str(fx + fy))
        elif (fx == None) and (fy == 0.0):
            self.push(x)
        elif (fx == 0.0) and (fy == None):
            self.push(y)
        else:
            self.push(x)
            self.push(y)
            self.push(token)

    def opSub(self, token):
        y = self.pop()
        x = self.pop()
        fx = self.convertToFloat(x)
        fy = self.convertToFloat(y)
        if (fx != None) and (fy != None):
            self.push(str(fx - fy))
        elif (fx == None) and (fy == 0.0):
            self.push(x)
        else:
            self.push(x)
            self.push(y)
            self.push(token)

    def opMul(self, token):
        y = self.pop()
        x = self.pop()
        fx = self.convertToFloat(x)
        fy = self.convertToFloat(y)
        if (fx != None) and (fy != None):
            self.push(str(fx * fy))
        elif (fx == 0.0) or (fy == 0.0):
            self.push("0")
        else:
            self.push(x)
            self.push(y)
            self.push(token)

    def opDiv(self, token):
        y = self.pop()
        x = self.pop()
        fx = self.convertToFloat(x)
        fy = self.convertToFloat(y)
        if (fx != None) and (fy != None):
            self.push(str(fx / fy))
        elif fx == 0.0:
            self.push("0")
        else:
            self.push(x)
            self.push(y)
            self.push(token)

    def precalc(self):
        self.top = -1
        self.array = []
        ops = { \
                "+": self.opAdd, \
                "-": self.opSub, \
                "*": self.opMul, \
                "/": self.opDiv
              }
        for token in self.output:
            if token in ops:
                ops[token](token)
            else:
                self.push(token)
        return self.array

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
        return self.precalc()

class Eon:
    def __init__(self, onto):
        self.onto = onto
        self.operations = { \
            "+":                  { "prec": 1, "opcode": 0 }, \
            "-":                  { "prec": 1, "opcode": 1 }, \
            "*":                  { "prec": 2, "opcode": 2 }, \
            "/":                  { "prec": 2, "opcode": 3 }, \
            ">":                  { "prec": 0, "opcode": 4 }, \
            "<":                  { "prec": 0, "opcode": 5 }, \
            ">=":                 { "prec": 0, "opcode": 6 }, \
            "<=":                 { "prec": 0, "opcode": 7 }, \
            "==":                 { "prec": 0, "opcode": 8 }, \
            "dw":                 { "prec": 1, "opcode": 9 }, \
            "osc":                { "prec": 1, "opcode": 10 }, \
            "wifiAP" :            { "prec": 1, "opcode": 11 }, \
            "wifiAPClientsCount": { "prec": 1, "opcode": 12 }, \
            "adc":                { "prec": 1, "opcode": 13 }, \
            "tone":               { "prec": 1, "opcode": 14 }, \
            "mpu6050Gyro":        { "prec": 1, "opcode": 15 }, \
            "mpu6050Accel":       { "prec": 1, "opcode": 16 }, \
            "madjwick":           { "prec": 1, "opcode": 17 }, \
            "quat2json":          { "prec": 1, "opcode": 18 }, \
            "wifi":               { "prec": 1, "opcode": 19 }, \
            "wsBroadcast":        { "prec": 1, "opcode": 20 },
        }
        self.INST_SUFFIX = " Inst"

    def get_attrs(self, node, data):
        if ("attributes" in node) and ("eval" in node["attributes"]):
            code = node["attributes"]["eval"]
            code = self.resolve_settings(code, data)
            return { "eval": code }
        else:
            return None

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

    def instance_of_type(self, node, type, onto):
        instNode = onto.first(onto.get_nodes_linked_from(node, "instance_of"))
        return onto.is_node_of_type(instNode, type)

    def get_corresponding_instance(self, instNmb, motherNode, onto):
        instances = onto.get_nodes_linked_to(motherNode, "instance_of")
        for inst in instances:
            if self.get_instance_number(inst) == instNmb:
                return inst
        return None

    def get_node_order(self, node, onto):
        if not node:
            return -1
        instNmb = self.get_instance_number(node)
        if instNmb == 0:
            return onto.last_id()
        if self.instance_of_type(node, "Input", onto):
            return self.get_node_order(onto.first(onto.get_nodes_linked_to(node, "use_for")), onto) + 1
        motherNode = onto.first(onto.get_nodes_linked_from(node, "instance_of"))
        if self.instance_of_type(node, "Output", onto):
            motherSuperNode = onto.first(onto.get_nodes_linked_to(motherNode, "has"))
            superNode = self.get_corresponding_instance(instNmb, motherSuperNode, onto)
            return self.get_node_order(superNode, onto) + 1
        result = 0
        motherInputs = onto.get_typed_nodes_linked_from(motherNode, "has", "Input")
        for motherInput in motherInputs:
            nodeInput = self.get_corresponding_instance(instNmb, motherInput, onto)
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
            if self.get_instance_number(node) == 0:
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

    def get_corresponding_instance_io(self, node, type, nmb, onto):
        motherNode = onto.first(onto.get_nodes_linked_from(node, "instance_of"))
        motherIOs = onto.get_typed_nodes_linked_from(motherNode, "has", type)
        instNmb = self.get_instance_number(node)
        return self.get_corresponding_instance(instNmb, motherIOs[nmb], onto)

    def link(self, src, srcOutputNumber, dst, dstInputNumber, onto):
        instOutput = self.get_corresponding_instance_io(src, "Output", srcOutputNumber, onto)
        instInput = self.get_corresponding_instance_io(dst, "Input", dstInputNumber, onto)
        if instOutput and instInput:
            onto.link_nodes(instOutput, instInput, "use_for")

    def resolve_settings(self, code, data):
        settings = data["settingsVal"]
        types = data["settingsType"]
        for s in settings:
            if types[s] == "String":
                code = code.replace(s, "'" + str(settings[s]) + "'")
            elif types[s] == "Bool":
                if settings[s]:
                    code = code.replace(s, "1")
                else:
                    code = code.replace(s, "0")
            else:
                code = code.replace(s, str(settings[s]))
        return code

    def get_related_nodes(self, node, onto):
        motherNode = onto.first(onto.get_nodes_linked_from(node, "instance_of"))
        result = onto.get_nodes_linked_from(motherNode, "has")
        motherSuperNode = onto.first(onto.get_nodes_linked_to(motherNode, "has"))
        if motherSuperNode:
            result += onto.get_nodes_linked_from(motherSuperNode, "has")
        return result

    def dump_int(self, intVal, result):
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
        related = self.get_related_nodes(node, onto)
        tokens = RPN(self.operations).convert(tokens)
        instNmb = self.get_instance_number(node)
        for token in tokens:
            if token in self.operations:
                # Function ID is stored like this: 1 0 X X X X X X,
                # where X are bits of ID number.
                result.write(bytes([self.operations[token]["opcode"] | 0x80]))
            else:
                relatedNode = None
                for ln in related:
                    if ln["name"] == token:
                        relatedNode = self.get_corresponding_instance(instNmb, ln, onto)
                        break
                if relatedNode:
                    # Node address is stored like this: 0 0 X X X X X X,
                    # where X are bits of ID number.
                    result.write(bytes([relatedNode["id"]]))
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
                    # 7 - string
                    try:
                        intVal = int(token) # integer?
                        self.dump_int(intVal, result)
                    except ValueError:
                        try:
                            floatVal = float(token) # float?
                            if floatVal.is_integer(): # really float?
                                self.dump_int(int(floatVal), result)
                            else:
                                result.write(struct.pack("!Bf", 6 | 0x40, floatVal))
                        except ValueError:
                            if token.startswith("'") and token.endswith("'"): # String?
                                # String values are stored as null-terminated byte sequences.
                                result.write(bytes([7 | 0x40]))
                                result.write(token[1:-1].encode())
                                result.write(bytes([0x0]))
                            else:
                                raise ValueError("Undefined token in eval attribute of <" + node["name"] + ">: " + token)
        return result.getbuffer()

    def dump_len(self, chunk):
        return struct.pack("!H", chunk.getbuffer().nbytes)

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

    def get_ont(self, dfd):
        dfdNodes = dfd["nodes"]
        resultNodesArr = {}
        result = Onto.empty()
        resultI = result.add_node("Input")
        resultO = result.add_node("Output")
        resultInstances = {}
        motherNode = None
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
                                         self.get_attrs(ontoNode, dfdNode["data"]))
            motherNode = self.add_mother_node(dfdNode["title"], ontoNode["id"], result)
            result.link_nodes(resultNode, motherNode, "instance_of")
            resultNodesArr[dfdNode["id"]] = resultNode
            # Add inputs.
            ontoInputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Input")
            for ontoInput in ontoInputs:
                resultInput = result.add_node(self.get_instance_name(ontoInput["name"], instNmb), \
                                              self.get_attrs(ontoInput, dfdNode["data"]))
                motherInput = self.add_mother_node(ontoInput["name"], ontoInput["id"], result)
                result.link_nodes(resultInput, motherInput, "instance_of")
                result.link_nodes(motherInput, resultI, "is_a")
                result.link_nodes(motherNode, motherInput, "has")
            # Add outputs.
            ontoOutputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Output")
            for ontoOutput in ontoOutputs:
                resultOutput = result.add_node(self.get_instance_name(ontoOutput["name"], instNmb), \
                                               self.get_attrs(ontoOutput, dfdNode["data"]))
                motherOutput = self.add_mother_node(ontoOutput["name"], ontoOutput["id"], result)
                result.link_nodes(resultOutput, motherOutput, "instance_of")
                result.link_nodes(motherOutput, resultO, "is_a")
                result.link_nodes(motherNode, motherOutput, "has")
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
                # Node is not trimmed, if it is a part of use_for link having mother prototype
                # OR it has an eval action
                if (eonOnto.first(eonOnto.get_nodes_linked_from(srcNode, "use_for")) or \
                    eonOnto.first(eonOnto.get_nodes_linked_to(srcNode, "use_for")) or \
                    (("attributes" in srcNode) and ("eval" in srcNode["attributes"]))) and \
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

