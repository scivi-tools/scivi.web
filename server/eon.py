#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto
import math
import io
import struct


class Eon:
    def __init__(self, onto):
        self.onto = onto

    def get_attrs(self, node, data):
        if ("attributes" in node) and ("eval" in node["attributes"]):
            code = node["attributes"]["eval"]
            code = self.resolve_settings(code, data)
            return { "eval": code }
        else:
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
        self.normalize_onto(onto)
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

    def rpn(self, tokens):
        return tokens

    def dump_attrs(self, node, onto):
        result = io.BytesIO()
        tokens = []
        curToken = ""
        delimeters = [" ", ",", "(", ")"]
        funcs = { "dw": 0, "osc": 1 }
        for ch in node["attributes"]["eval"]:
            if ch in delimeters:
                if len(curToken) > 0:
                    tokens.append(curToken)
                    curToken = ""
                continue
            curToken += ch
        if len(curToken) > 0:
            tokens.append(curToken)
        linked = self.get_all_linked_nodes(node, onto)
        tokens = self.rpn(tokens)
        for token in tokens:
            if token in funcs:
                # Function ID is stored like this: 1 0 X X X X X X,
                # where X are bits of ID number.
                result.write(bytes([funcs[token] | 0x80]))
            else:
                linkedNode = None
                for ln in linked:
                    if ln["name"] == token:
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
                                result.write(struct.pack("!BH", 1 | 0x40, invVal))
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

    def get_ont(self, dfd):
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
            resultNode = result.add_node(dfdNode["title"], self.get_attrs(ontoNode, dfdNode["data"]))
            resultNodesArr[dfdNode["id"]] = resultNode
            # Add inputs.
            ontoInputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Input")
            for ontoInput in ontoInputs:
                resultInput = result.add_node(ontoInput["name"], self.get_attrs(ontoInput, dfdNode["data"]))
                result.link_nodes(resultNode, resultInput, "has")
                result.link_nodes(resultInput, resultI, "is_a")
            # Add outputs.
            ontoOutputs = self.onto.get_typed_nodes_linked_from(ontoNode, "has", "Output")
            for ontoOutput in ontoOutputs:
                resultOutput = result.add_node(ontoOutput["name"], self.get_attrs(ontoOutput, dfdNode["data"]))
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

    def get_eon16(self, eonOnto):
        if len(eonOnto.nodes()) > 64:
            raise ValueError("Cannot compose EON16 stream: too many nodes in ontology (" + str(len(eonOnto.nodes())) + ")")

        result = io.BytesIO()
        # Links chunk
        linksChunk = io.BytesIO()
        for link in eonOnto.links():
            if link["name"] == "use_for":
                # Format 16 bit: 6 (SRC) 4 (LNK) 6 (DST).
                linksChunk.write(bytes([link["source_node_id"] << 2]))
                linksChunk.write(bytes([link["destination_node_id"]]))
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
        print(' '.join(a+b for a,b in zip(s[::2], s[1::2])))
        return result

