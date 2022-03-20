#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import urllib


class CodeUtils:
    def __init__(self):
        pass

    def read_file(self, path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def download_file(self, url):
        try:
            return urllib.request.urlopen(url).read().decode("utf-8")
        except:
            print("Error by loading url: " + url)
            return ""

    def get_code(self, node):
        if "inline" in node["attributes"]:
            return node["attributes"]["inline"]
        elif "path" in node["attributes"]:
            return self.read_file(node["attributes"]["path"])
        elif "url" in node["attributes"]:
            return self.download_file(node["attributes"]["url"])
        else:
            return ""

    def get_file(self, node):
        if ("attributes" in node) and ("path" in node["attributes"]):
            path = node["attributes"]["path"]
            mode = "r"
            if path.endswith(".png"):
                mode += "b"
            with open(node["attributes"]["path"], mode) as f:
                return f.read()
        return None
