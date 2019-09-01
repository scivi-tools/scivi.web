#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from onto import Onto
import sys
import math


def duplicate_id(onto1, onto2, node, prototypes):
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
    return None

def merge_attrs(node1, node2):
    attrs1 = node1["attributes"]
    attrs2 = node2["attributes"]
    for attr in attrs2:
        if (attr in attrs1) and (attrs1[attr] != attrs2[attr]):
            print("Warning: conflicting attribute <%s> of node %s, value <%s> from first onto used" % (attr, node1["name"], attrs1[attr]))
        else:
            attrs1[attr] = attrs2[attr]

########### MAIN ###########

if len(sys.argv) != 4:
    print("Usage: merge.py onto1.ont onto2.ont result.ont")
    exit(0)

onto1 = Onto(sys.argv[1])
onto2 = Onto(sys.argv[2])

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
    dID = duplicate_id(onto1, onto2, node, prototypes)
    if dID == None:
        onto1.nodes().append(node)
    else:
        node["merged_id"] = dID
        merge_attrs(onto1.get_node_by_id(dID), node)
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

onto1.write_to_file(sys.argv[3])
