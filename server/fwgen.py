#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import shutil
import io
from typing import List
import zipfile
from zipfile import ZipFile
from onto.onto import Node, Onto, first
from server.utils import CodeUtils


class FWGen:
    def __init__(self, onto: Onto):
        self.onto = onto
        self.codeUtils = CodeUtils()
        self.guid = os.urandom(4)

    def subclass(self, className, superClassName):
        cls = self.onto.get_nodes_by_name(className)
        return first(list(filter(lambda obj: self.onto.is_subclass(obj, superClassName), cls)))

    def typed_instance(self, classOfInstance, instanceType):
        its = self.onto.get_nodes_linked_to(classOfInstance, "is_instance")
        return first(list(filter(lambda obj: self.onto.is_node_of_type(obj, instanceType), its)))

    def dump_file(self, content, name, path):
        if content:
            with open(os.path.join(path, name), "w", encoding='utf-8') as f:
                f.write(content)

    def get_dependencies(self, worker: Node) -> List[Node]:
        result = []
        deps = self.onto.get_typed_nodes_linked_from(worker, "has", "Dependency")
        for d in deps:
            result.append(d)
            result += self.get_dependencies(d)
        return result

    def var_name(self, var: Node):
        return "g_" + var.name.replace(" ", "_")

    def declare_output(self, output: Node):
        varType = first(self.onto.get_typed_nodes_linked_from(output, "is_a", "Type"))
        varName = self.var_name(output)
        decl = ""
        send = ""
        if varType.name == "Bool":
            decl = "bool %s = false;\n" % varName
            send = "g_1w.send(%s);\n" % varName
        elif varType.name == "Number":
            decl = "int %s = 0;\n" % varName
            send = "g_1w.send((%s >> 24) & 0xFF);\ng_1w.send((%s >> 16) & 0xFF);\ng_1w.send((%s >> 8) & 0xFF);\ng_1w.send(%s & 0xFF);\n" % \
                   (varName, varName, varName, varName)
        return decl, send

    def resolve_masks(self, node: Node, code):
        # %<ROM>
        nodeID = node.UID
        code = code.replace("%<ROM>", "{ 0x%x, 0x%x, 0x%x, 0x%x, 0x%x, 0x%x, 0x%x, 0x%x }" % \
                            (0xE0, \
                             nodeID >> 8 & 0xFF, nodeID & 0xFF, \
                             self.guid[0], self.guid[1], self.guid[2], self.guid[3], \
                             0xFF))
        # %<OUTPUTS> && %<SEND>
        outputs = self.onto.get_typed_nodes_linked_from(node, "has", "Output")
        outputDelcls = ""
        outputSends = ""
        for output in outputs:
            decl, send = self.declare_output(output)
            outputDelcls += decl
            outputSends += send
        code = code.replace("%<OUTPUTS>", outputDelcls)
        code = code.replace("%<SEND>", outputSends)
        return code

    def process_code(self, node: Node, code):
        outputs = self.onto.get_typed_nodes_linked_from(node, "has", "Output")
        for output in outputs:
            code = code.replace("OUTPUT[\"%s\"]" % output.name, self.var_name(output))
        return code

    def generate(self, elementName, path):
        if os.path.exists(path):
            shutil.rmtree(path)
        os.mkdir(path)

        element = self.subclass(elementName, "Root")
        if not element:
            return None

        worker = self.typed_instance(element, "MCUWorker")
        self.dump_file(self.process_code(element, self.codeUtils.get_code(worker)), "worker.h", path)

        deps = self.get_dependencies(worker)
        firstDep = True
        for d in deps:
            if "path" in d.attributes:
                code = self.codeUtils.read_file(d.attributes["path"])
                code = self.resolve_masks(element, code)
                name = os.path.basename(d.attributes["path"])
                if firstDep:
                    name = elementName + ".ino"
                    firstDep = False
                self.dump_file(code, name, path)

        buf = io.BytesIO()
        with ZipFile(buf, "a", zipfile.ZIP_DEFLATED, False) as zipObj:
            for dirName, subDirs, fileNames in os.walk(path):
                for fileName in fileNames:
                    filePath = os.path.join(dirName, fileName)
                    zipObj.write(filePath, os.path.basename(filePath))

        return { "content": buf.getvalue(), "mime": "application/zip" }
