#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto
from enum import IntEnum
import math
import io
import struct
import re


class EonType(IntEnum):
    UINT8   = 0
    UINT16  = 1
    UINT32  = 2
    INT8    = 3
    INT16   = 4
    INT32   = 5
    FLOAT32 = 6
    STRING  = 7

class Eon:
    def __init__(self, onto):
        self.onto = onto

    def get_number_of_ios(self, node, type, ios):
        iosNodes = self.onto.get_nodes_linked_from(node, "has")
        index = 0
        for iosNode in iosNodes:
            if self.onto.is_node_of_type(iosNode, type):
                if iosNode == ios:
                    return index
                index += 1
        return None

    def get_io_op(self, ioInstID, type, dfdOnto):
        ioInst = dfdOnto.get_node_by_id(ioInstID)
        ioProto = dfdOnto.first(dfdOnto.get_nodes_linked_from(ioInst, "is_instance"))
        ioMother = self.onto.get_node_by_id(ioProto["attributes"]["mother"])
        ioMotherOp = self.onto.first(self.onto.get_nodes_linked_to(ioMother, "has"))
        ioNumber = self.get_number_of_ios(ioMotherOp, type, ioMother)
        ioOpInst = dfdOnto.first(dfdOnto.get_nodes_linked_to(ioInst, "has"))
        return ioOpInst, ioNumber

    def get_setting_by_name(self, node, settingName):
        sNodes = self.onto.get_nodes_linked_from(node, "has")
        for sNode in sNodes:
            if sNode["name"] == settingName:
                return sNode
        return None

    def classify_int(self, intVal):
        if intVal < 0:
            if intVal < -32767:
                return EonType.INT32
            elif intVal < -127:
                return EonType.INT16
            else:
                return EonType.INT8
        else:
            if intVal > 65535:
                return EonType.UINT32
            elif intVal > 255:
                return EonType.UINT16
            else:
                return EonType.UINT8

    def guess_type(self, value):
        try:
            intVal = int(value)
            return self.classify_int(intVal), intVal
        except ValueError:
            try:
                floatVal = float(value)
                if floatVal.is_integer():
                    intVal = int(floatVal)
                    return self.classify_int(intVal), intVal
                else:
                    return EonType.FLOAT32, floatVal
            except ValueError:
                if (len(value) == 0) or (value.startswith("'") and value.endswith("'")):
                    return EonType.STRING, value
                else:
                    raise ValueError("Cannot guess type of value <" + value + ">")

    def dump_value(self, value, type, buffer):
        if type == EonType.UINT8:
            buffer.write(struct.pack("!B", value))
        elif type == EonType.UINT16:
            buffer.write(struct.pack("!H", value))
        elif type == EonType.UINT32:
            buffer.write(struct.pack("!I", value))
        elif type == EonType.INT8:
            buffer.write(struct.pack("!b", value))
        elif type == EonType.INT16:
            buffer.write(struct.pack("!h", value))
        elif type == EonType.INT32:
            buffer.write(struct.pack("!i", value))
        elif type == EonType.FLOAT32:
            buffer.write(struct.pack("!f", value))
        elif type == EonType.STRING:
            # String values are stored as null-terminated byte sequences.
            if len(value) > 0:
                buffer.write(value[1:-1].encode())
            buffer.write(bytes([0x0]))
        else:
            raise ValueError("Cannot dump value <" + value + "> of unknown type <" + type + ">")

    def get_eon(self, dfdOnto):
        dataFlowChunk = io.BytesIO()
        settingsChunk = io.BytesIO()
        keysChunk = io.BytesIO()
        dataFlowChunkLen = 0
        keys = {}
        
        for link in dfdOnto.links():
            if link["name"] == "is_used":
                dataFlowChunkLen += 1
                oOpInst, oNumber = self.get_io_op(link["source_node_id"], "Output", dfdOnto)
                iOpInst, iNumber = self.get_io_op(link["destination_node_id"], "Input", dfdOnto)
                dataFlowChunk.write(bytes([oOpInst["attributes"]["dfd"], \
                                           ((oNumber & 0x0F) << 4) | (iNumber & 0x0F), \
                                           iOpInst["attributes"]["dfd"]]))
            elif link["name"] == "is_hosted":
                opInst = dfdOnto.get_node_by_id(link["source_node_id"])
                if not ("attributes" in opInst) or not ("settingsVal" in opInst["attributes"]):
                    continue
                settings = opInst["attributes"]["settingsVal"]
                opProto = dfdOnto.first(dfdOnto.get_nodes_linked_from(opInst, "is_instance"))
                opMother = self.onto.get_node_by_id(opProto["attributes"]["mother"])
                for s in settings:
                    sMother = self.get_setting_by_name(opMother, s)
                    sNumber = self.get_number_of_ios(opMother, "Setting", sMother)
                    sValue = settings[s]
                    sType, convertedValue = self.guess_type(sValue)
                    settingsChunk.write(bytes([opInst["attributes"]["dfd"], \
                                               ((sNumber & 0x0F) << 4) | (int(sType) & 0x0F)]))
                    self.dump_value(convertedValue, sType, settingsChunk)
                if (not ("attributes" in opMother)) or (not ("UID" in opMother["attributes"])):
                    raise ValueError("Operator <" + opMother["name"] + "> has no UID")
                opMotherUID = opMother["attributes"]["UID"]
                if opMotherUID in keys:
                    keys[opMotherUID].append(opInst["attributes"]["dfd"])
                else:
                    keys[opMotherUID] = [opInst["attributes"]["dfd"]]
        
        for k in keys:
            keysChunk.write(struct.pack("!H", int(k) & 0xFFFF))
            keysChunk.write(bytes(keys[k]))
            keysChunk.write(bytes([0x0]))
        
        #
        # The EON 2.0 blob structure is as follows:
        # ----------------------------------------------------------------------------------
        # | DataFlowChunkLen | DataFlowChunk | SetingsChunkLen | SettingsChunk | KeysChunk |
        # ----------------------------------------------------------------------------------
        # where DataFlowChunkLen (1 byte) - number of 3-byte elements in DataFlowChunk
        #       DataFlowChunk (3 * DataFlowChunkLen bytes) - chunk containing sequence of 'is_used' ontology links formed like this:
        #           --------------------------------------
        #           | OpInstA | Output | Input | OpInstB |
        #           --------------------------------------
        #           where OpInstA (1 byte), OpInstB (1 byte) - DFD IDs of the operators' instances, whereby output of OpInstA 
        #                                                      is linked to the input of OpInstB
        #                 Output (4 bits) - number of output of OpInstA
        #                 Input (4 bits) - number of input of OpInstB
        #       SettingsChunkLen (2 bytes) - length in bytes of SettingsChunk
        #       SettingsChunk (SettingsChunkLen bytes) - chunk containing sequence of settings formed like this:
        #           -----------------------------------
        #           | OpInst | Setting | Type | Value |
        #           -----------------------------------
        #           where OpInst (1 byte) - DFD ID of operator's instance having the setting
        #                 Setting (4 bits) - number of setting of OpInst
        #                 Type (4 bits) - type ID of setting (see EonTypes)
        #                 Value - encoded setting value (length depends on type, strings are NULL-terminated)
        #       KeysChunk (length is not stored) - chunk containing sequence of operators' instances formed like this:
        #           --------------------------------------------
        #           | MotherOp | OpInst1 | OpInst2 | ... | 0x0 |
        #           --------------------------------------------
        #           where MotherOp (2 bytes) - onto UID of operator (in mother ontology), which instances are used in DFD
        #                 OpInst1, OpInst2, ... (each 1 byte) - DFD IDs of MotherOp instances
        #                 0x0 (1 byte) - zero byte terminating the list of MotherOp instances
        #
        result = io.BytesIO()
        result.write(bytes([dataFlowChunkLen]))
        result.write(dataFlowChunk.getbuffer())
        result.write(struct.pack("!H", settingsChunk.getbuffer().nbytes))
        result.write(settingsChunk.getbuffer())
        result.write(keysChunk.getbuffer())

        print(result.getbuffer().nbytes)
        s = result.getvalue().hex()
        arr = (a+b for a,b in zip(s[::2], s[1::2]))
        outStr = ""
        for b in arr:
            outStr += "0x" + b + ", "
        print("{%s}" % (outStr))

        return result.getvalue(), dfdOnto
