#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto.onto import Onto
import sys
import math
import os


class OntoMerger:
    '''
    The OntoMerger class provides methods to merge multiple pieces of domain ontology into an über-one.
    '''

    def __init__(self, dirPath):
        '''
        Create instance of OntoMerger.
        @param dirPath - path to directory where are the ontology pieces to merge.
        '''
        self.onto = None
        for (path, dirNames, fileNames) in os.walk(dirPath):
            for f in fileNames:
                if f.lower().endswith(".ont"):
                    p = os.path.join(path, f)
                    if self.onto == None:
                        self.onto = Onto.load_from_file(p)
                    else:
                        self.onto = self.merge(self.onto, Onto.load_from_file(p))

    def duplicate_id(self, onto1, onto2, node, prototypes):
        '''
        Find duplicates of given nodes.
        @param onto1 - first ontology to merge.
        @param onto2 - second ontology to merge.
        @param node - ontology node from onto1 to find duplicates in the onto2.
        @param prototypes - array of node1 prototypes building its context.
        @return ID of a duplicate or None if no duplicates found.
        '''
        dupli = onto1.get_nodes_by_name(node["name"])
        if len(dupli) == 1:
            isaNodes = onto1.get_nodes_linked_from(dupli[0], "is_a")
            for isaNode in isaNodes:
                if isaNode in prototypes:
                    return None
            isaNodes = onto2.get_nodes_linked_from(node, "is_a")
            for isaNode in isaNodes:
                if isaNode in prototypes:
                    return None
            return dupli[0]["id"]
        if len(dupli) > 1:
            print("WARNING: Ontology have %d nodes with same name `%s`" % (len(dupli), node["name"]))
        return None

    def merge_attrs(self, node1, node2):
        '''
        Merge attributes of two ontology nodes.
        @param node1 - first node to merge attributes of.
        @param node2 - second node to merge attributes of.
        '''
        attrs1 = node1["attributes"]
        attrs2 = node2["attributes"]
        for attr in attrs2:
            if (attr in attrs1) and (attrs1[attr] != attrs2[attr]):
                print("Warning: conflicting attribute <%s> of node %s, value <%s> from first onto used" % (attr, node1["name"], attrs1[attr]))
            else:
                attrs1[attr] = attrs2[attr]

    def merge(self, onto1, onto2):
        '''
        Perform the merge.
        @param onto1 - first ontology to merge.
        @param onto2 - second ontoogy to merge.
        @return merged ontology.
        '''
        lastID = int(onto1.last_id())
        for node in onto2.nodes():
            node["id"] = str(int(node["id"]) + lastID)
        for link in onto2.links():
            link["id"] = str(int(link["id"]) + lastID)
            link["source_node_id"] = str(int(link["source_node_id"]) + lastID)
            link["destination_node_id"] = str(int(link["destination_node_id"]) + lastID)

        prototypes = onto1.get_nodes_by_name("Input")
        prototypes.extend(onto1.get_nodes_by_name("Output"))
        prototypes.extend(onto1.get_nodes_by_name("Setting"))
        prototypes.extend(onto2.get_nodes_by_name("Input"))
        prototypes.extend(onto2.get_nodes_by_name("Output"))
        prototypes.extend(onto2.get_nodes_by_name("Setting"))

        for node in onto2.nodes():
            dID = self.duplicate_id(onto1, onto2, node, prototypes)
            if dID == None:
                onto1.nodes().append(node)
            else:
                node["merged_id"] = dID
                self.merge_attrs(onto1.get_node_by_id(dID), node)
        for link in onto2.links():
            srcNode = onto2.get_node_by_id(link["source_node_id"])
            dstNode = onto2.get_node_by_id(link["destination_node_id"])
            mSrc = "merged_id" in srcNode
            mDst = "merged_id" in dstNode
            if mSrc:
                link["source_node_id"] = srcNode["merged_id"]
            if mDst:
                link["destination_node_id"] = dstNode["merged_id"]
            if mSrc and mDst and onto1.has_link(srcNode["merged_id"], dstNode["merged_id"], link["name"]):
                continue
            onto1.links().append(link)

        onto1.data["last_id"] = str(int(onto1.data["last_id"]) + int(onto2.data["last_id"]))

        n = int(math.sqrt(len(onto1.nodes())))
        i = 0
        j = 0
        x = -300
        y = -300
        w = 100
        h = 30
        for node in onto1.nodes():
            node["position_x"] = x + i * w
            node["position_y"] = y + j * h
            i = i + 1
            if i == n:
                i = 0
                j = j + 1

        return onto1
