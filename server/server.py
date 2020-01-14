#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import importlib
from onto.onto import Onto
from enum import Enum
from server.eon import Eon


class Mode(Enum):
    VISUALIZATION = 1
    IOT_PROGRAMMING = 2

class Localizer:
    ENG = {
        "Data Sources": "Data Sources",
        "Filters": "Filters",
        "Visual Objects": "Visual Objects"
    }
    RUS = {
        "Data Sources": "Источники данных",
        "Filters": "Фильтры",
        "Visual Objects": "Визуальные объекты"
    }
    STRINGS = {
        "eng": ENG,
        "rus": RUS
    }

    @classmethod
    def localize(klass, string, loc):
        if (loc in klass.STRINGS) and (string in klass.STRINGS[loc]):
            return klass.STRINGS[loc][string]
        else:
            return string

class SciViServer:
    def __init__(self, onto, context, mode):
        self.onto = onto
        self.loc = "eng"
        self.tree = ""
        self.treeID = 1
        self.treeHandlers = ""
        self.treeNodes = ""
        self.typeColors = {}
        self.ctx = context
        self.mode = mode
        self.dependencies = {}

        self.gen_tree()

    def add_node(self, node):
        self.tree = self.tree +\
                    "<li><input type='checkbox' id='i" +\
                    str(self.treeID) +\
                    "'/><label for='i" +\
                    str(self.treeID) +\
                    "'>" + node + "</label>"
        self.treeID = self.treeID + 1

    def gen_sockets(self, sockets):
        result = "["
        for s in sockets:
            t = self.onto.first(self.onto.get_typed_nodes_linked_from(s, "base_type", "Type"))
            if not t:
                t = self.onto.first(self.onto.get_typed_nodes_linked_from(s, "is_a", "Type"))
            if not t:
                print("WARNING: Ignoring socket with no type <" + s["name"] + ">")
            if ("attributes" in t) and ("color" in t["attributes"]):
                self.typeColors[t["name"]] = t["attributes"]["color"]
            else:
                self.typeColors[t["name"]] = "#000000"
            result = result +\
                     "{ 'name': '" + s["name"] +\
                     "', 'type': '" + t["name"] +\
                     "' },"
        return result + "]"

    def read_file(self, path):
        with open(path, "r") as f:
            return f.read()

    def get_language(self, node):
        result = self.onto.first(self.onto.get_nodes_linked_from(node, "language"))
        if result:
            return result["name"]
        else:
            return ""

    def get_code(self, node):
        if "inline" in node["attributes"]:
            return node["attributes"]["inline"]
        elif "path" in node["attributes"]:
            return self.read_file(node["attributes"]["path"])
        else:
            return ""

    def add_dependencies(self, node):
        deps = self.onto.get_typed_nodes_linked_from(node, "has", "Dependency")
        if deps:
            for d in deps:
                lang = self.get_language(d)
                if not (lang in self.dependencies):
                    self.dependencies[lang] = {}
                self.dependencies[lang][d["id"]] = self.get_code(d)
                self.add_dependencies(d)

    def execute(self, node):
        if "inline" in node["attributes"]:
            return eval(node["attributes"]["inline"])
        elif "path" in node["attributes"]:
            _, package = node["attributes"]["path"].rsplit(".", 1)
            worker = importlib.import_module(node["attributes"]["path"] + "." + package)
            return worker.run(self.ctx)
        else:
            return ""

    def resolve_mask(self, mask):
        resolvers = self.onto.get_nodes_linked_to(mask, "use_for")
        if resolvers:
            for resolver in resolvers:
                if self.onto.is_node_of_type(resolver, "ServerSideWorker") and self.get_language(resolver) == "Python":
                    return self.execute(resolver)
        return ""

    def process_code(self, code, masks):
        if masks:
            for mask in masks:
                res = self.resolve_mask(mask)
                code = code.replace("%<" + mask["name"] + ">", res)
        return code

    def resolve_domain(self, dom, s):
        if "," in dom:
            vals = dom.split(",")
            result = ""
            for v in vals:
                result = result + "\"" + v.strip() + "\","
            return "[" + result + "]"
        print("WARNING: malformed domain for <" + s["name"] + ">")
        return ""

    def type_of_node(self, node):
        protos = self.onto.get_nodes_linked_from(node, "is_a")
        for p in protos:
            if self.onto.is_node_of_type(p, "Type"):
                return p
        return None

    def resolve_containers(self, code, inputs, outputs, settings):
        ins = sorted(inputs, key = lambda inp: int(inp["id"]))
        outs = sorted(outputs, key = lambda outp: int(outp["id"]))
        types = ""
        defs = ""
        doms = ""
        for s in settings:
            if "attributes" in s:
                if "default" in s["attributes"]:
                    dv = s["attributes"]["default"]
                    if isinstance(dv, str):
                        dv = "\"" + dv + "\""
                    else:
                        dv = str(dv).lower()
                    defs = defs + "\"" + s["name"] + "\": " + dv + ", "
                if "domain" in s["attributes"]:
                    dm = s["attributes"]["domain"]
                    doms = doms + "\"" + s["name"] + "\": " + self.resolve_domain(dm, s) + ", "
            types = types + "\"" + s["name"] + "\": \"" + self.type_of_node(s)["name"] + "\", "
            print(types)
        code = "if (!node.data.cache) " +\
               "node.data.cache = {}; " +\
               "if (!node.data.settings) { " +\
               "node.data.settings = {" + doms + "}; " +\
               "node.data.settingsVal = {" + defs + "}; " +\
               "node.data.settingsType = {" + types + "}; " +\
               "node.data.settingsChanged = {}; " +\
               "} " +\
               "var ADD_VISUAL = function (con) { " +\
               "while (editor.viewportContainer().firstChild) editor.viewportContainer().removeChild(editor.viewportContainer().firstChild); " +\
               "editor.viewportContainer().appendChild(con); " +\
               "}; " +\
               "var UPDATE_WIDGETS = function () { editor.updateWidgets(node); }; " +\
               code
        for i, inp in enumerate(ins):
            code = code.replace("HAS_INPUT[\"" + inp["name"] + "\"]", "(inputs[" + str(i) + "].length > 0)")
            code = code.replace("INPUT[\"" + inp["name"] + "\"]", "inputs[" + str(i) + "][0]")
        for i, outp in enumerate(outs):
            code = code.replace("OUTPUT[\"" + outp["name"] + "\"]", "outputs[" + str(i) + "]")
        code = code.replace("DATA", "node.data")
        code = code.replace("CACHE", "node.data.cache")
        code = code.replace("PROCESS", "editor.process")
        code = code.replace("IN_VISUALIZATION", "editor.inVisualization")
        code = code.replace("SETTINGS_VAL", "node.data.settingsVal")
        code = code.replace("SETTINGS_CHANGED", "node.data.settingsChanged")
        code = code.replace("SETTINGS", "node.data.settings")
        return code

    def gen_worker(self, workers, inputs, outputs, settings):
        w = self.onto.first(workers)
        code = ""
        if w:
            masks = self.onto.get_typed_nodes_linked_from(w, "has", "Code Mask")
            code = self.process_code(self.get_code(w), masks)
            self.add_dependencies(w)
        return "function (node, inputs, outputs) { " + self.resolve_containers(code, inputs, outputs, settings) + " }"

    def gen_settings(self, settings):
        if len(settings) > 0:
            f = "function (node){ if (node.data) node.data.settingsCtrl = \"\"; if (!node.data || !node.data.settings) return; var ADD_WIDGET = function (code) { node.data.settingsCtrl += code; }; "
            for s in settings:
                t = self.onto.first(self.onto.get_typed_nodes_linked_from(s, "is_a", "Type"))
                widgets = self.onto.get_typed_nodes_linked_to(t, "use_for", "Widget")
                widget = None
                for w in widgets:
                    if self.get_language(w) == "JavaScript":
                        widget = w
                        break
                if widget:
                    code = self.get_code(widget)
                    code = code.replace("SETTINGS_VAL", "node.data.settingsVal")
                    code = code.replace("SETTINGS_CHANGED", "node.data.settingsChanged")
                    code = code.replace("SETTINGS", "node.data.settings")
                    code = code.replace("SETTING_ID", s["id"])
                    code = code.replace("SETTING_NAME", s["name"])
                    code = code.replace("NODE_ID", "node.id")
                    f = f + "(function () { " + code + " }).call(this);"
            f = f + " }"
            return f
        return "function (node){}"


    def add_leaf(self, leaf):
        self.tree = self.tree + "<li><span id='i" + str(self.treeID) + "'>" + leaf["name"] + "</span></li>"
        inputNodes = self.onto.get_typed_nodes_linked_from(leaf, "has", "Input")
        inputs = self.gen_sockets(inputNodes)
        outputNodes = self.onto.get_typed_nodes_linked_from(leaf, "has", "Output")
        outputs = self.gen_sockets(outputNodes)
        settingNodes = self.onto.get_typed_nodes_linked_from(leaf, "has", "Setting")
        worker = self.gen_worker(self.onto.get_typed_nodes_linked_to(leaf, "instance_of", "ClientSideWorker"), inputNodes, outputNodes, settingNodes)
        sett = self.gen_settings(settingNodes)
        self.treeNodes = self.treeNodes +\
                         "editor.registerNode('" + leaf["name"] + "', " + inputs + ", " + outputs + ", " + worker + ", " + sett + ");"
        self.treeHandlers = self.treeHandlers +\
                            "$('#i" + str(self.treeID) +\
                            "').click(function (e){editor.createNode('" + leaf["name"] + "');});"
        self.treeID = self.treeID + 1

    def add_tree_level(self, root, leafs):
        self.add_node(root)
        self.tree = self.tree + "<ul>"
        for l in leafs:
            self.add_leaf(l)
        self.tree = self.tree + "</ul>"

    def gen_tree(self):
        self.tree = "<ul>"

        rootNode = self.onto.first(self.onto.get_nodes_by_name("Root"))
        categories = self.onto.get_nodes_linked_to(rootNode, "is_a")
        for category in categories:
            leafs = self.onto.get_nodes_linked_to(category, "is_a")
            self.add_tree_level(category["name"], leafs)

        self.tree = self.tree + "</ul>"

    def get_editor_js(self):
        return "var editor; function main(){" +\
               "$('#scivi_treeview').html(\"" + self.tree + "\");" +\
               "editor = new SciViEditor();" +\
               self.treeNodes +\
               self.treeHandlers +\
               "editor.run(" + str(self.mode.value) + ");" +\
               "}"

    def get_editor_dependencies(self, lang):
        result = ""
        if lang in self.dependencies:
            dps = self.dependencies[lang]
            for d in dps:
                result = result + dps[d];
        return result

    def get_editor_dependencies_js(self):
        return self.get_editor_dependencies("JavaScript")

    def get_editor_dependencies_css(self):
        return self.get_editor_dependencies("CSS")

    def get_editor_css(self):
        result = ""
        for t in self.typeColors:
            result = result + ".connections .connection.output-" + t.lower() +\
                     " { stroke: " + self.typeColors[t] + "; }\n" +\
                     ".socket." + t.lower() +\
                     " { background: " + self.typeColors[t] + "; border-color: #434343 !important; }\n"
        return result

    def execute_serverside(self, nodeID, instanceID):
        node = self.onto.get_node_by_id(nodeID)
        if not node:
            return None
        workers = self.onto.get_nodes_linked_to(mask, "use_for")
        if workers:
            for worker in workers:
                if self.onto.is_node_of_type(resolver, "ServerSideWorker") and self.get_language(resolver) == "Python":
                    return self.execute(worker)
        return None

    def gen_eon(self, dfd):
        eon = Eon(self.onto)
        eonOnto = eon.get_ont(dfd)
        bs = eon.get_eon(eonOnto)
        barr = []
        for b in bs:
            barr.append(b)
        return { "ont": eonOnto.data, "eon": barr }
