#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto
from server.dfd2onto import DFD2Onto
import math
import io
import struct
import re
import copy


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
            "meander":            { "prec": 1, "opcode": 10 }, \
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

    def extract_assignment(self, evalCode, targetName):
        g = re.search(targetName + " *?=(.*?)(?:;|$)", evalCode)
        if g:
            return g.group(1).strip()
        else:
            return None

    def get_code(self, worker, targetName, settings, types):
        if ("attributes" in worker) and ("eval" in worker["attributes"]):
            code = self.extract_assignment(worker["attributes"]["eval"], targetName)
            code = self.resolve_settings(code, settings, types)
            return code
        else:
            return None

    def resolve_settings(self, code, settings, types):
        if code and settings and types:
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
        result = onto.get_nodes_linked_from(node, "has")
        superNode = onto.first(onto.get_nodes_linked_to(node, "has"))
        if superNode:
            result += onto.get_nodes_linked_from(superNode, "has")
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
        for token in tokens:
            if token in self.operations:
                # Function ID is stored like this: 1 0 X X X X X X,
                # where X are bits of ID number.
                result.write(bytes([self.operations[token]["opcode"] | 0x80]))
            else:
                relatedNode = None
                for ln in related:
                    lnMother = onto.first(onto.get_nodes_linked_from(ln, "is_instance"))
                    if lnMother["name"] == token:
                        relatedNode = ln
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

    def process_onto(self, dfdOnto):
        result = copy.deepcopy(dfdOnto)
        dfdNodes = result.nodes().copy()
        dfd2onto = DFD2Onto(self.onto)
        rx = self.onto.first(self.onto.get_nodes_by_name("Seamless Receiver"))
        tx = self.onto.first(self.onto.get_nodes_by_name("Seamless Transmitter"))
        rxNmb = 1
        txNmb = 1
        dfdI = result.first(result.get_nodes_by_name("Input"))
        dfdO = result.first(result.get_nodes_by_name("Output"))
        needsRelayout = False

        for node in dfdNodes:
            if ("attributes" in node) and ("mother" in node["attributes"]) and \
               (not result.is_node_of_type(node, "Input")) and \
               (not result.is_node_of_type(node, "Output")):
                motherNode = self.onto.get_node_by_id(node["attributes"]["mother"])
                ontoWorker = self.onto.first(self.onto.get_typed_nodes_linked_to(motherNode, "is_instance", "EdgeSideWorker"))
                if not ontoWorker:
                    rxNmb, txNmb = dfd2onto.replace_io(result, node, rx, tx, "EdgeSideWorker", rxNmb, txNmb, dfdI, dfdO)
                    needsRelayout = True

        if (needsRelayout):
            dfd2onto.drop_layout_onto(result)
            dfd2onto.layout_onto(result)

        dfdNodes = result.nodes()
        for node in dfdNodes:
            if ("attributes" in node) and ("mother" in node["attributes"]) and \
               (not result.is_node_of_type(node, "Input")) and \
               (not result.is_node_of_type(node, "Output")):
                motherNode = self.onto.get_node_by_id(node["attributes"]["mother"])
                ontoWorker = self.onto.first(self.onto.get_typed_nodes_linked_to(motherNode, "is_instance", "EdgeSideWorker"))
                insNodes = result.get_nodes_linked_to(node, "is_instance")
                for insNode in insNodes:
                    settings = None
                    if ("attributes" in insNode) and ("settingsVal" in insNode["attributes"]):
                        settings = insNode["attributes"]["settingsVal"]
                    types = None
                    if ("attributes" in insNode) and ("settingsType" in insNode["attributes"]):
                        types = insNode["attributes"]["settingsType"]
                    code = self.get_code(ontoWorker, node["name"], settings, types)
                    if code:
                        insNode["attributes"]["eval"] = code
                    ioNodes = result.get_nodes_linked_from(insNode, "has")
                    for ioNode in ioNodes:
                        ioProto = result.first(result.get_nodes_linked_from(ioNode, "is_instance"))
                        code = self.get_code(ontoWorker, ioProto["name"], settings, types)
                        if code:
                            ioNode["attributes"]["eval"] = code

        return result

    def get_eon(self, dfdOnto):
        eonOnto = self.process_onto(dfdOnto)

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
            # is_used:     SSSSSS 0000 DDDDDD          // src and dst are tIDs
            # is_instance: SSSSSS 10 DDDDDDDD          // src is tID, dst is mID, dst <= 256
            # is_instance: SSSSSS 11 DDDDDDDD DDDDDDDD // src is tID, dst is mID, 256 < dst <= 65536
            if link["name"] == "is_used":
                linksChunk.write(bytes([link["source_node_id"] << 2]))
                linksChunk.write(bytes([link["destination_node_id"]]))
            elif link["name"] == "is_instance":
                srcNode = eonOnto.get_node_by_id(link["source_node_id"])
                dstNode = eonOnto.get_node_by_id(link["destination_node_id"])
                # Node is not trimmed, if it is a part of is_used link having mother prototype
                # OR it has an eval action
                if (eonOnto.first(eonOnto.get_nodes_linked_from(srcNode, "is_used")) or \
                    eonOnto.first(eonOnto.get_nodes_linked_to(srcNode, "is_used")) or \
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
        
        return result.getvalue(), eonOnto

