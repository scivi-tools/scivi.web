#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import urllib

from onto.onto import Node


class CodeUtils:
    def __init__(self):
        pass

    def read_file(self, path):
        if path.endswith(".png") or path.endswith(".jpg"):
            with open(path, "rb") as f:
                return f.read()
        else:
            with open(path, "r", encoding='utf-8') as f:
                return f.read()

    def download_file(self, url):
        try:
            return urllib.request.urlopen(url).read().decode("utf-8")
        except:
            print("Error by loading url: " + url)
            return ""

    def get_code(self, node: Node):
        if "inline" in node.attributes:
            return node.attributes["inline"]
        elif "path" in node.attributes:
            return self.read_file(node.attributes["path"])
        elif "url" in node.attributes:
            return self.download_file(node.attributes["url"])
        else:
            return ""

    def get_file(self, node: Node):
        if "path" in node.attributes:
            return self.read_file(node.attributes["path"])
        return None
