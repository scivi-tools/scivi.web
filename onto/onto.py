#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json


class Onto:
    '''
    The Onto class is a wrapper to operate with ONTOLIS ontology files (*.ont).
    '''

    def __init__(self, filename):
        '''
        Create instance of Onto.
        @param filename - name of ONTOLIS ontology file.
        '''
        with open(filename) as f:
            self.data = json.load(f)
        if not self.data:
            raise ValueError("corrupt ontology")
        if not ("nodes" in self.data):
            raise ValueError("corrupt ontology, <nodes> missing")
        if not ("relations" in self.data):
            raise ValueError("corrupt ontology, <relations> missing")

    def nodes(self):
        '''
        Get array of all nodes in the ontology.
        @return array of nodes.
        '''
        return self.data["nodes"]

    def links(self):
        '''
        Get array of all links in the ontology.
        @return array of links.
        '''
        return self.data["relations"]

    def last_id(self):
        '''
        Get last ID in the ontology.
        @return last ID.
        '''
        return self.data["last_id"]

    def get_nodes_by_name(self, name):
        '''
        Return array of nodes with the given name.
        @param name - name of the node.
        @return array of nodes.
        '''
        result = []
        for node in self.nodes():
            if node["name"] == name:
                result.append(node)
        return result

    def get_node_by_id(self, id):
        '''
        Return single node by given ID.
        @param id - ID of node.
        @return node.
        '''
        for node in self.nodes():
            if node["id"] == id:
                return node
        return None

    def get_nodes_linked_from(self, node, linkName):
        '''
        Return array of nodes, which are connected with the given one by the link with given name. 
        The direction of link is from the given node to nodes returned.
        @param node - node to find links from.
        @param linkName - name of the link.
        @return array of nodes.
        '''
        result = []
        curID = node["id"]
        for link in self.links():
            if (link["source_node_id"] == curID) and (link["name"] == linkName):
                result.append(self.get_node_by_id(link["destination_node_id"]))
        return result

    def get_nodes_linked_to(self, node, linkName):
        '''
        Return array of nodes, which are connected with the given one by the link with given name. 
        The direction of link is from nodes returned to the given node.
        @param node - node to find links to.
        @param linkName - name of the link.
        @return array of nodes.
        '''
        result = []
        curID = node["id"]
        for link in self.links():
            if (link["destination_node_id"] == curID) and (link["name"] == linkName):
                result.append(self.get_node_by_id(link["source_node_id"]))
        return result

    def write_to_file(self, filename):
        '''
        Write down ontology to the file.
        @param filename - name of file to write into.
        '''
        with open(filename, "w") as f:
            json.dump(self.data, f, sort_keys = True, indent = 4, ensure_ascii = False)

    def first(self, array):
        '''
        Safely get first element from array.
        @param array - array to get first element from.
        @return first element if any, otherwise None.
        '''
        if array and len(array) > 0:
            return array[0]
        else:
            return None

    def get_typed_nodes_linked_from(self, node, linkName, nodeType):
        '''
        Return array of nodes, which are connected with the given one by the link with given name
        and are connected by is_a to the node with given name (say, have given type).
        The direction of link is from the given node to nodes returned.
        @param node - node to find links from.
        @param linkName - name of the link.
        @param nodeType - name of the type defining node.
        @return array of nodes.
        '''
        result = []
        linked = self.get_nodes_linked_from(node, linkName)
        for lNode in linked:
            rels = self.get_nodes_linked_from(lNode, "is_a")
            for rNode in rels:
                if rNode["name"] == nodeType:
                    result.append(lNode)
                    break
        return result

    def get_typed_nodes_linked_to(self, node, linkName, nodeType):
        '''
        Return array of nodes, which are connected with the given one by the link with given name
        and are connected by is_a to the node with given name (say, have given type).
        The direction of link is from nodes returned to the given node.
        @param node - node to find links to.
        @param linkName - name of the link.
        @param nodeType - name of the type defining node.
        @return array of nodes.
        '''
        result = []
        linked = self.get_nodes_linked_to(node, linkName)
        for lNode in linked:
            rels = self.get_nodes_linked_from(lNode, "is_a")
            for rNode in rels:
                if rNode["name"] == nodeType:
                    result.append(lNode)
                    break
        return result

    def is_node_of_type(self, node, nodeType):
        '''
        Check if node has is_a connection with node of given name (say, have given type).
        @param node - node to check type of.
        @param nodeType - name of the type defining node.
        @return True if node is of given type, false otherwise.
        '''
        linked = self.get_nodes_linked_from(node, "is_a")
        for lNode in linked:
            if lNode["name"] == nodeType:
                return True
        return False

    def has_link(self, srcID, dstID, linkName):
        '''
        Check if nodes by given IDs have link of given name.
        @param srcID - source node ID.
        @param dstID - destination node ID.
        @param linkName - name of the link.
        @return True if nodes are linked, False otherwise.
        '''
        for l in self.links():
            if (l["source_node_id"] == srcID) and (l["destination_node_id"] == dstID) and (l["name"] == linkName):
                return True
        return False
