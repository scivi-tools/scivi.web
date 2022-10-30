#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import hashlib
import json
from typing import Any, Dict, Generic, List, Optional, Sequence, TypeVar

T = TypeVar('T')
def first(array: Sequence[T]) -> T:
        '''
        Safely get first element from array.
        @param array - array to get first element from.
        @return first element if any, otherwise None.
        '''
        if array and len(array) > 0:
            return array[0]
        else:
            return None

class Node:
    attributes: Dict[str, Any]
    id: int
    name: str
    namespace: str
    position_x: int
    position_y: int
    merged_id: Optional[int]
    UID: Optional[int]

    def __init__(self,id, name, attributes, namespace, position_x, position_y):
        self.attributes = attributes
        self.id = id
        self.name = name
        self.namespace = namespace
        self.position_x = position_x
        self.position_y = position_y
        self.merged_id = None
        self.UID = None

    def __eq__(self, other):
        if (isinstance(other, Node)):
            return self.id == other.id
        else: return False


class Link(json.JSONEncoder):
    attributes: Dict[str, Any]
    destination_node_id: int
    id: int
    name: str
    namespace: str
    source_node_id: int

    def __init__(self, id, name,attributes, namespace, source_node_id, destination_node_id):
        self.id = id
        self.name = name
        self.attributes = attributes
        self.namespace = namespace
        self.source_node_id = source_node_id
        self.destination_node_id = destination_node_id

    def __eq__(self, other):
        if (isinstance(other, Link)):
            return self.id == other.id
        else: return False

class Onto:
    last_id: int
    namespaces: Dict[str,str]
    nodes: List[Node]
    links: List[Link]
    visualize_ont_path: str
    '''
    The Onto class is a wrapper to operate with ONTOLIS ontology files (*.ont).
    '''
    def __init__(self, last_id, namespaces, nodes, links, visualize_ont_path, name = None):
        '''
        Create instance of Onto.
        @param data - dict representing ontology.
        '''
        self.last_id: int = last_id
        self.namespaces = namespaces
        self.nodes = nodes
        self.links = links
        self.visualize_ont_path = visualize_ont_path
        self.name = name

    @classmethod
    def load_from_file(cls, filename: str):
        '''
        Create instance of Onto reading ontology form ONTOLIS file.
        @param filename - name of file.
        '''
        data = None
        with open(filename, encoding='utf-8') as f:
            data = json.load(f)
        if not data:
            raise ValueError("corrupt ontology")
        if not ("nodes" in data):
            raise ValueError("corrupt ontology, <nodes> missing")
        if not ("relations" in data):
            raise ValueError("corrupt ontology, <relations> missing")
        if 'last_id' not in data:
            data['last_id'] = 0
        nodes = []
        for node in data['nodes']:
            if 'attributes' not in node:
                node['attributes'] = {}
            nodes.append(Node(int(node['id']),
                                node['name'],
                                node['attributes'],
                                node['namespace'],
                                int(node['position_x']),
                                int(node['position_y'])))

        links = []
        for link in data['relations']:
            if 'attributes' not in link:
                link['attributes'] = {}
            links.append(Link(int(link['id']), 
                                link['name'],
                                link['attributes'],
                                link['namespace'],
                                int(link['source_node_id']),
                                int(link['destination_node_id'])))
        
        return cls(int(data['last_id']), 
                    data['namespaces'],
                    nodes,
                    links,
                    data['visualize_ont_path'],
                    name = filename)

    @classmethod
    def empty(cls):
        '''
        Create instance of Onto with empty ontology.
        '''
        namespaces = {
             "default": "https://scivi.tools/onto", \
                "ontolis-avis": "http://knova.ru/ontolis-avis", \
                "owl": "http://www.w3.org/2002/07/owl", \
                "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns", \
                "rdfs": "http://www.w3.org/2000/01/rdf-schema", \
                "xsd": "http://www.w3.org/2001/XMLSchema"
        }
        return cls(0, namespaces, [], [], "")

    def get_nodes_by_name(self, name) -> List[Node]:
        '''
        Return array of nodes with the given name.
        @param name - name of the node.
        @return array of nodes.
        '''
        result = []
        for node in self.nodes:
            if node.name == name:
                result.append(node)
        return result

    def get_node_by_id(self, id):
        '''
        Return single node by given ID.
        @param id - ID of node.
        @return node.
        '''
        for node in self.nodes:
            if node.id == id:
                return node
        return None

    def get_nodes_linked_from(self, node: Node, linkName) -> List[Node]:
        '''
        Return array of nodes, which are connected with the given one by the link with given name. 
        The direction of link is from the given node to nodes returned.
        @param node - node to find links from.
        @param linkName - name of the link.
        @return array of nodes.
        '''
        result = []
        curID = node.id
        for link in self.links:
            if (link.source_node_id == curID) and (link.name == linkName):
                result.append(self.get_node_by_id(link.destination_node_id))
        return result

    def get_nodes_linked_to(self, node: Node, linkName) -> List[Node]:
        '''
        Return array of nodes, which are connected with the given one by the link with given name. 
        The direction of link is from nodes returned to the given node.
        @param node - node to find links to.
        @param linkName - name of the link.
        @return array of nodes.
        '''
        result = []
        curID = node.id
        for link in self.links:
            if (link.destination_node_id == curID) and (link.name == linkName):
                result.append(self.get_node_by_id(link.source_node_id))
        return result

    def write_to_file(self, filename):
        '''
        Write down ontology to the file.
        @param filename - name of file to write into.
        '''
        with open(filename, "w", encoding='utf-8') as f:
            json.dump(self, f, sort_keys = True, indent = 4, ensure_ascii = False, cls = OntoEncoder)

    

    def get_typed_nodes_linked_from(self, node: Node, linkName, nodeType) -> List[Node]:
        '''
        Return array of nodes, which are connected with the given one or any of its is_a parents
        by the link with given name and are connected by is_a to the node with given name
        (say, have given type).
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
                if rNode.name == nodeType:
                    result.append(lNode)
                    break
        return result

    def get_typed_nodes_linked_from_inherited(self, node: Node, linkName, nodeType) -> List[Node]:
        '''
        Return array of nodes, which are connected with the given one or any of its is_a parents
        by the link with given name and are connected by is_a to the node with given name
        (say, have given type).
        The direction of link is from the given node to nodes returned.
        @param node - node to find links from.
        @param linkName - name of the link.
        @param nodeType - name of the type defining node.
        @return array of nodes.
        '''
        result = self.get_typed_nodes_linked_from(node, linkName, nodeType)
        parents = self.get_nodes_linked_from(node, "is_a")
        for p in parents:
            result += self.get_typed_nodes_linked_from_inherited(p, linkName, nodeType)
        return result

    def get_typed_nodes_linked_to(self, node: Node, linkName, nodeType) -> List[Node]:
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
                if rNode.name == nodeType:
                    result.append(lNode)
                    break
        return result

    def is_node_of_type(self, node: Node, nodeType):
        '''
        Check if node has is_a connection with node of given name (say, have given type).
        @param node - node to check type of.
        @param nodeType - name of the type defining node.
        @return True if node is of given type, false otherwise.
        '''
        linked = self.get_nodes_linked_from(node, "is_a")
        for lNode in linked:
            if lNode.name == nodeType:
                return True
        return False

    def is_subclass(self, node: Node, proto):
        '''
        Check of node is subclass of prototype given by name. The class-subclass relation is represented by is_a.
        B is a subclass of A, if there is a path of is_a links from B to A.
        @param node - node to check.
        @param proto - name of a prototype.
        @return true if node is a subclass of proto, false if not.
        '''
        supers = self.get_nodes_linked_from(node, "is_a")
        for s in supers:
            if s.name == proto or self.is_subclass(s, proto):
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

        for l in self.links:
            if (l.source_node_id == srcID) and (l.destination_node_id == dstID) and (l.name == linkName):
                return True
        return False

    def add_node(self, name, attributes: Dict[str, Any] = None) -> Node:
        '''
        Add new node to ontology.
        @param name - string name of node.
        @param attributes - dictionary of node's attributes (may be None).
        @return created node.
        '''
        if (not name) or (len(name) == 0):
            raise ValueError("name of node not specified")
        if not attributes:
            attributes = {}
        self.last_id = self.last_id + 1
        node = Node(self.last_id, name, attributes, self.namespaces['default'], 0, 0)
        self.nodes.append(node)
        return node

    def link_nodes(self, src: Node, dst: Node, linkName, attributes = None):
        '''
        Link given source node to given destination node in the ontology. No checkes for double links performed.
        @param src - source node.
        @param dat - destination node.
        @param linkName - name of link.
        @param attributes - dictionary of link's attributes (may be None).
        @return created link.
        '''
        if not src:
            raise ValueError("source node not specified")
        if not dst:
            raise ValueError("destination node not specified")
        if (not linkName) or (len(linkName) == 0):
            raise ValueError("name of link not specified")
        if not attributes:
            attributes = {}
        self.last_id = self.last_id + 1
        link = Link(self.last_id, linkName, attributes, self.namespaces['default'], src.id, dst.id)
        self.links.append(link)
        return link

    def remove_node(self, node: Node):
        '''
        Remove node from the ontology. All the incident links are removed as well.
        @param node - node to remove.
        '''
        links = self.links.copy()
        for link in links:
            if (link.source_node_id == node.id) or (link.destination_node_id == node.id):
                self.links.remove(link)
        self.nodes.remove(node)

    def __sorted_dict_str(self, data):
        if type(data) == dict:
            return { k: self.__sorted_dict_str(data[k]) for k in sorted(data.keys()) }
        elif type(data) == list:
            return [ self.__sorted_dict_str(val) for val in data ]
        else:
            return str(data)

    def calc_hash(self, hasher = hashlib.sha256):
        '''
        Calculate hash of the ontology.
        @return hash as string.
        '''
        return hasher(bytes(repr(self.__sorted_dict_str(self)), 'UTF-8')).hexdigest()

class OntoEncoder((json.JSONEncoder)):
    def default(self, obj):
        if isinstance(obj, Onto):
            return {"last_id": obj.last_id,
                    "namespaces": obj.namespaces,
                    "nodes": obj.nodes,
                    "relations": obj.links,
                    "visualize_ont_path": obj.visualize_ont_path}
        elif isinstance(obj, Node):
            return {"attributes": obj.attributes,
                    "id": obj.id,
                    "name": obj.name,
                    "namespace": obj.namespace,
                    "position_x": obj.position_x,
                    "position_y": obj.position_y}
        elif isinstance(obj, Link):
            return {"attributes": obj.attributes,
                    "id": obj.id,
                    "name": obj.name,
                    "namespace": obj.namespace,
                    "source_node_id": obj.source_node_id,
                    "destination_node_id": obj.destination_node_id}
        # Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)
