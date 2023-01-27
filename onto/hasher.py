#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Node, Onto
from typing import List


class OntoHasher:
    '''
    The OntoHasher class assigns to nodes, which represent operators, semantic UIDs,
    which depend on operators' signatures.
    These UIDs are not changed by merging ontologies (like the reguar IDs do), so they can be used as
    consistent identifiers of operators accross different use-cases of corresponding small ontology
    (when this small ontology is merged into different über-ontologies).
    '''

    def __init__(self, onto: Onto):
        '''
        Create instance of OntoHasher.
        @param onto - ontology to process.
        '''
        self.table = [ \
            29,  186, 180, 162, 184, 218, 3,   141, 55,  0,   72,  98,  226, 108, 220, \
            158, 231, 248, 247, 251, 130, 46,  174, 135, 170, 127, 163, 109, 229, 36,  \
            45,  145, 79,  137, 122, 12,  182, 117, 17,  198, 204, 212, 39,  189, 52,  \
            200, 102, 149, 15,  124, 233, 64,  88,  225, 105, 183, 131, 114, 187, 197, \
            165, 48,  56,  214, 227, 41,  95,  4,   93,  243, 239, 38,  61,  116, 51,  \
            90,  236, 89,  18,  196, 213, 42,  96,  104, 27,  11,  21,  203, 250, 194, \
            57,  85,  54,  211, 32,  25,  140, 121, 147, 171, 6,   115, 234, 206, 101, \
            8,   7,   33,  112, 159, 28,  240, 238, 92,  249, 22,  129, 208, 118, 125, \
            179, 24,  178, 143, 156, 63,  207, 164, 103, 172, 71,  157, 185, 199, 128, \
            181, 175, 193, 154, 152, 176, 26,  9,   132, 62,  151, 2,   97,  205, 120, \
            77,  190, 150, 146, 50,  23,  155, 47,  126, 119, 254, 40,  241, 192, 144, \
            83,  138, 49,  113, 160, 74,  70,  253, 217, 110, 58,  5,   228, 136, 87,  \
            215, 169, 14,  168, 73,  219, 167, 10,  148, 173, 100, 35,  222, 76,  221, \
            139, 235, 16,  69,  166, 133, 210, 67,  30,  84,  43,  202, 161, 195, 223, \
            53,  34,  232, 245, 237, 230, 59,  80,  191, 91,  66,  209, 75,  78,  44,  \
            65,  1,   188, 252, 107, 86,  177, 242, 134, 13,  246, 99,  20,  81,  111, \
            68,  153, 37,  123, 216, 224, 19,  31,  82,  106, 201, 244, 60,  142, 94,  \
            255                                                                        \
        ]
        self.onto = onto
        for node in self.onto.nodes:
            if self.is_operator(node):
                uid = self.calc_uid(node)
                clash = self.get_node(uid)
                if clash:
                    print("WARNING: UID <%d> duplication for nodes <%s> and <%s>" % (uid, node.name, clash.name))
                node.UID = uid

    def calc_uid(self, node: Node) -> int:
        '''
        Calculate UID for given node.
        @param node - node to calculate UID for.
        @return UID of node.
        '''
        return self.hash_key(self.get_op_signature(node))

    def is_operator(self, node: Node) -> bool:
        '''
        Check if given node is an operator.
        @param node - node to check.
        @return true if operator, false if not.
        '''
        protos = self.onto.get_nodes_linked_from(node, "is_a")
        result = False
        for proto in protos:
            if proto.name == "Root": # FIXME: this should be "Operator", not "Root", but for now the engine and knowledge base are not yet refactored.
                result = True
            else:
                result = self.is_operator(proto)
            if result:
                break
        return result

    def get_op_signature(self, node: Node) -> str:
        '''
        Assemble signature of operator.
        @param node - node representing operator.
        @return operator's signature as string.
        '''
        return node.name + \
               self.dump_signature_part(node, "Input", "@I") + \
               self.dump_signature_part(node, "Setting", "@S") + \
               self.dump_signature_part(node, "Output", "@O")

    def dump_signature_part(self, node: Node, partName: str, partID: str) -> str:
        '''
        Dump part of operator's signature to string.
        @param node - node representing operator.
        @param partName - name of signature part (Input, Setting, or Output).
        @param partID - ID of signature part (@I, @S, @O).
        @return string representation of the corresponding signature part.
        '''
        result = ""
        part = self.onto.get_typed_nodes_linked_from(node, "has", partName)
        if len(part) > 0:
            partTypes = []
            for p in part:
                partType = self.get_type(p)
                if partType:
                    partTypes.append(partType)
            if len(partTypes) > 0:
                result += partID + ":".join(sorted(partTypes))
        return result

    def get_type(self, node: Node) -> str:
        '''
        Get type of given node.
        @param node - node representing Input, Setting, or Output.
        @return string representation of type of given node or None if no type presented in ontology.
        '''
        result = []
        protos = self.onto.get_nodes_linked_from(node, "is_a")
        for proto in protos:
            result += self.get_type_taxonomy(proto)
        bases = self.onto.get_nodes_linked_from(node, "base_type")
        for base in bases:
            result += self.get_type_taxonomy(base)
        return ">".join(result)

    def get_type_taxonomy(self, node: Node) -> List[str]:
        '''
        Return full taxonomy of types for given type.
        @param node - node representing type.
        @return array of nodes' names building the type hierarchy, starting with the given node and up to the deepest type.
                If given node does not represent a type, empty array is returned.
        '''
        result = []
        protos = self.onto.get_nodes_linked_from(node, "is_a")
        for proto in protos:
            if proto.name == "Type":
                return [ node.name ]
            else:
                result += self.get_type_taxonomy(proto)
        if len(result) > 0:
            result = [ node.name ] + result
        return result

    def get_node(self, uid) -> Node:
        '''
        Get node by UID.
        @param uid - UID of node.
        @return node having this UID or None if node is not found.
        '''
        for node in self.onto.nodes:
            if (node.UID is not None) and (node.UID == uid):
                return node
        return None

    def hash_key(self, key) -> int:
        '''
        Calculate hash of given string.
        @param key - string to hash.
        @return hash of string.
        '''
        hashLen = 2
        result = 0
        for j in range(hashLen):
            h = self.table[(ord(key[0]) + j) % 256]
            for i in range(1, len(key)):
                h = self.table[(h ^ ord(key[i])) % 256]
            h = self.table[(h ^ len(key)) % 256]
            result = (result << 8) | h
        return result
