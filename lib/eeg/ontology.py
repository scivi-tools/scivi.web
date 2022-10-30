#!/usr/bin/env false

import json
from random import random

from .jsontools import trydict

def_namespace = 'http://knova.ru/user/1490806075329'

# Ontolis node
class Node(object):
    attributes = dict()
    id = 0
    name = ""
    namespace = ""
    position_x = 0.0
    position_y = 0.0

    def __init__(self, id = -1, name = None, pos = (-1, -1)):
        self.attributes = dict()
        self.id = id
        self.name = name
        self.namespace = def_namespace
        self.position_x, self.position_y = pos

    def __str__(self):
        return "Ontology Node (name = {}, id = {}, position = ({}, {}))".format(
            self.name, self.id, self.position_x, self.position_y
        )

# Relation between two nodes
class Relation(object):
    attributes = dict()
    id = 0
    name = ""
    namespace = def_namespace
    source_node_id = 0
    destination_node_id = 0

    def __init__(self, id = -1, name = None, link = (-1, -1)):
        self.attributes = dict()
        self.id = id
        self.name = name
        self.source_node_id, self.destination_node_id = link

# Whole ontology
class Ontology(object):
    visualize_ont_path = ""
    nodes = []
    relations = []
    last_id = 0
    namespaces = dict()

    def __init__(self):
        self.visualize_ont_path = ""
        self.nodes = []
        self.relations = []
        self.last_id = 0

    def add_node(self, node):
        if (node.id == -1):
            node.id = self.last_id+1
        if (node.position_x == -1):
            node.position_x = random()*1000
        if (node.position_y == -1):
            node.position_y = random()*1000
        self.nodes.append(node)
        self.last_id = max(self.last_id, node.id)

    def add_relation(self, relation):
        if (relation.id == -1):
            relation.id = self.last_id+1
        self.relations.append(relation)
        self.last_id = max(self.last_id, relation.id)

    @staticmethod
    def load_ontology(data):
        d = json.loads(data)
        o = Ontology()

        for node in d['nodes']:
            n = Node()
            n.__dict__ = node

            n.id = int(n.id)
            n.position_x = float(n.position_x)
            n.position_y = float(n.position_y)

            o.add_node(n)
        
        for rel in d['relations']:
            r = Relation()
            r.__dict__ = rel

            r.id = int(r.id)
            r.source_node_id = int(r.source_node_id)
            r.destination_node_id = int(r.destination_node_id)

            o.add_relation(r)

        o.visualize_ont_path = d.get('visualize_ont_path', '')
        o.last_id = int(d['last_id'])
        o.namespaces = d.get('namespaces', [])

        return o

    def save_ontology(self):
        return json.dumps(self, default=trydict, indent = 4)

    def find_node_by_name(self, node_name):
        for node in self.nodes:
            if (node.name == node_name):
                return node
        return None

    def find_node_by_id(self, node_id):
        for node in self.nodes:
            if (node.id == node_id):
                return node
        return None

    def find_relations_for_node(self, node, name, directional = False, direction_from = False):
        # TODO: we don't support unidirectional search yet
        assert(directional == False)

        result = []

        for relation in self.relations:
            if (relation.name == name and (node.id == relation.source_node_id or node.id == relation.destination_node_id)):
                result.append(relation)

        return result

    def is_adjacent(self, node1, node2, relation_name = None):
        for relation in self.relations:
            if ((node1.id == relation.source_node_id and node2.id == relation.destination_node_id) or
                (node2.id == relation.source_node_id and node1.id == relation.destination_node_id)) and (
                relation_name == None or relation_name == relation.name):
                return True
        return False

    def find_children(self, node, relation_name):
        links = self.find_relations_for_node(node, relation_name)

        result = []

        for link in links:
            # TODO: direction support
            if (link.source_node_id != node.id):
                result.append(self.find_node_by_id(link.source_node_id))
            else:
                result.append(self.find_node_by_id(link.destination_node_id))

        return result

