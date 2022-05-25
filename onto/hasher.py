#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto


class OntoHasher:
    '''
    The OntoHasher class assigns to each node a semantic UID that depends on the semantic structure.
    This UID is not changed by merging ontologies (like the reguar ID does), so it can be used as
    a consistent identifier of node accross different use-cases of corresponding small ontology
    (when this small ontology is merged into different über-ontologies).
    '''

    def __init__(self, onto):
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
        self.prototypes = self.onto.get_nodes_by_name("Input")
        self.prototypes.extend(self.onto.get_nodes_by_name("Output"))
        self.prototypes.extend(self.onto.get_nodes_by_name("Setting"))
        for node in self.onto.nodes():
            uid = self.calc_uid(node)
            clash = self.get_node(uid)
            if clash:
                print("WARNING: UID <%d> duplication for nodes <%s> and <%s>" % (uid, node["name"], clash["name"]))
            node["UID"] = uid

    def calc_uid(self, node):
        '''
        Calculate UID for given node.
        @param node - node to calculate UID for.
        @return UID of node.
        '''
        protos = self.onto.get_nodes_linked_from(node, "is_a")
        keyName = node["name"]
        for proto in protos:
            if proto in self.prototypes:
                owners = self.onto.get_nodes_linked_to(node, "has")
                for owner in owners:
                    keyName += owner["name"]
                keyName += proto["name"]
                break
        return self.hash_key(keyName)

    def get_node(self, uid):
        '''
        Get node by UID.
        @param uid - UID of node.
        @return node having this UID or None if node is not found.
        '''
        for node in self.onto.nodes():
            if ("UID" in node) and (node["UID"] == uid):
                return node
        return None

    def hash_key(self, key):
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
