#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import gzip
import json

class DFDBuilder:
    def __init__(self, preset, modify):
        self.preset = preset
        self.modify = modify

    def get_nodes_by_title(self, dfd, title):
        result = []
        if "nodes" in dfd:
            nodes = dfd["nodes"]
            for nodeID in nodes:
                if ("title" in nodes[nodeID]) and (nodes[nodeID]["title"] == title):
                    result.append(nodes[nodeID])
        return result

    def mod_node(self, node, mod):
        if ("data" in mod) and ("data" in node):
            for dataKey in mod["data"]:
                if dataKey in node["data"]:
                    node["data"][dataKey] = mod["data"][dataKey]

    def apply_mod(self, dfd, mod):
        if "title" in mod:
            nodesToModify = self.get_nodes_by_title(dfd, mod["title"])
        for node in nodesToModify:
            self.mod_node(node, mod)

    def build(self):
        with gzip.open(self.preset, "rb") as f:
            dfd = json.load(f)
        for mod in self.modify:
            self.apply_mod(dfd, mod)
        return dfd
