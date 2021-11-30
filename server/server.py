#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import urllib
import importlib
import datetime
from onto.onto import Onto
from enum import Enum
from server.eon import Eon
from server.dfd2onto import DFD2Onto
from server.execer import Execer


class Mode(Enum):
    '''
    The Mode enum provides basic functioning modes of SciVi.
    UNDEFINED       means no mode assigned whereby it shoudl be determined in runtime based on the domain ontology supplied.
    VISUALIZATION   means pure client-side DFD execution for the sake of in-browser visualization (and analytics).
                    Each node is executed within browser.
    IOT_PROGRAMMING means pure edge-side DFD execution for the sake of IoT programming (solving tasks decribed by DFD on the MCUs).
                    Each node is executed within Edge device.
    MIXED           means the DFD should be split up into pices each one executed on its own side: server-, client- or edge-.
                    Each node is classified by server and executed either on the server, or within browser, or within Edge device.
    '''
    UNDEFINED = 0
    VISUALIZATION = 1
    IOT_PROGRAMMING = 2
    MIXED = 3

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
    def __init__(self, onto, context):
        self.onto = onto
        self.loc = "eng"
        self.tree = ""
        self.treeID = 1
        self.treeHandlers = ""
        self.treeNodes = ""
        self.typeColors = {}
        self.ctx = context
        self.mode = Mode.UNDEFINED
        self.dependencies = {}
        self.files = {}
        self.execers = {}

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
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def download_file(self, url):
        try:
            return urllib.request.urlopen(url).read().decode("utf-8")
        except:
            print("Error by loading url: " + url)
            return ""

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
        elif "url" in node["attributes"]:
            return self.download_file(node["attributes"]["url"])
        else:
            return ""

    def get_file(self, node):
        if ("attributes" in node) and ("path" in node["attributes"]):
            with open(node["attributes"]["path"]) as f:
                return f.read()
        return None

    def guess_mime(self, filename):
        if filename.endswith(".svg"):
            return "image/svg+xml; charset=utf-8"
        return None

    def get_mime(self, node):
        if "attributes" in node:
            if "mime" in node["attributes"]:
                return node["attributes"]["mime"]
            elif "path" in node["attributes"]:
                return self.guess_mime(node["attributes"]["path"])
        return None

    def add_dependencies(self, node):
        deps = self.onto.get_typed_nodes_linked_from(node, "has", "Dependency")
        if deps:
            for d in deps:
                lang = self.get_language(d)
                if lang:
                    if not (lang in self.dependencies):
                        self.dependencies[lang] = {}
                    self.dependencies[lang][d["id"]] = self.get_code(d)
                    self.add_dependencies(d)
                else:
                    self.files[d["name"]] = { "content": self.get_file(d), "mime": self.get_mime(d) }

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
        resolvers = self.onto.get_nodes_linked_to(mask, "is_used")
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

    def resolve_default(self, node):
        t = self.onto.first(self.onto.get_typed_nodes_linked_from(node, "is_a", "Type"))
        if not t:
            return 0
        if t["name"] == "String":
            return ""
        elif t["name"] == "Date" or t["name"] == "Time":
            return int(datetime.datetime.now().timestamp() * 1000)
        else:
            return 0

    def resolve_containers(self, code, inputs, outputs, settings, viewType):
        props = re.findall(r"PROPERTY\[\"(.+?)\"\]", code)
        for p in props:
            found = False
            for i, inp in enumerate(inputs):
                if p == inp["name"]:
                    dv = None
                    if ("attributes" in inp) and ("default" in inp["attributes"]):
                        dv = inp["attributes"]["default"]
                        if isinstance(dv, str):
                            dv = "\"" + dv + "\""
                        else:
                            dv = str(dv).lower()
                    else:
                        dv = "undefined"
                    code = code.replace("PROPERTY[\"" + p + "\"]", "(inputs[" + str(i) + "].length > 0 ? (inputs[" + str(i) + "][0] !== null ? inputs[" + str(i) + "][0] : " + dv + ") : " + dv + ")")
                    found = True
                    break
            if not found:
                code = code.replace("PROPERTY[\"" + p + "\"]", "node.data.settingsVal[\"" + p + "\"]")
        if viewType:
            addVisualCall = "var ADD_VISUAL = function (con) { editor.addVisualToViewport(con, node.position, '" + viewType["attributes"]["split"] + "'); }; "
        else:
            addVisualCall = "var ADD_VISUAL = function (con) { editor.addVisualToViewport(con, node.position); }; "
        code = addVisualCall +\
               "var UPDATE_WIDGETS = function () { editor.updateWidgets(node); }; " +\
               code
        for i, inp in enumerate(inputs):
            code = code.replace("HAS_INPUT[\"" + inp["name"] + "\"]", "(inputs[" + str(i) + "].length > 0)")
            code = code.replace("INPUT[\"" + inp["name"] + "\"]", "inputs[" + str(i) + "][0]")
        for i, outp in enumerate(outputs):
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
        if w:
            masks = self.onto.get_typed_nodes_linked_from(w, "has", "Code Mask")
            code = self.process_code(self.get_code(w), masks)
            proto = self.onto.first(self.onto.get_nodes_linked_from(w, "is_instance"))
            viewType = self.onto.first(self.onto.get_typed_nodes_linked_from(proto, "is_a", "View"))
            self.add_dependencies(w)
            return "function (node, inputs, outputs) { " + self.resolve_containers(code, inputs, outputs, settings, viewType) + " }"
        else:
            code = ""
            return "function (node, inputs, outputs) { " +\
                        self.resolve_containers(code, inputs, outputs, settings, None) +\
                        "if (node.data.outputDataPool) { " +\
                            "for (var i = 0, n = Math.min(node.data.outputDataPool.length, outputs.length); i < n; ++i) " +\
                                "outputs[i] = node.data.outputDataPool[i]; " +\
                        "} " +\
                   "}"

    def gen_settings(self, settings):
        types = ""
        defs = ""
        doms = ""
        for s in settings:
            if "attributes" in s:
                dv = None
                if "default" in s["attributes"]:
                    dv = s["attributes"]["default"]
                else:
                    dv = self.resolve_default(s)
                if isinstance(dv, str):
                    dv = "\"" + dv + "\""
                else:
                    dv = str(dv).lower()
                defs = defs + "\"" + s["name"] + "\": " + dv + ", "
                if "domain" in s["attributes"]:
                    dm = s["attributes"]["domain"]
                    doms = doms + "\"" + s["name"] + "\": " + self.resolve_domain(dm, s) + ", "
            types = types + "\"" + s["name"] + "\": \"" + self.type_of_node(s)["name"] + "\", "

        initCode = "if (!node.data.cache) " +\
                   "node.data.cache = {}; " +\
                   "if (!node.data.settings) { " +\
                   "node.data.settings = {" + doms + "}; " +\
                   "node.data.settingsVal = {" + defs + "}; " +\
                   "node.data.settingsType = {" + types + "}; " +\
                   "node.data.settingsChanged = {}; " +\
                   "} "

        if len(settings) > 0:
            f = "function (node){ " +\
                initCode +\
                "if (node.data) { node.data.settingsCtrl = \"\"; node.data.inlineSettingsCtrl = \"\"; } " +\
                "if (!node.data || !node.data.settings) return; " +\
                "var ADD_WIDGET = function (code) { node.data.settingsCtrl += code; }; " +\
                "var INLINE_WIDGET = function (code) { node.data.inlineSettingsCtrl += code; }; "
            for s in settings:
                t = self.onto.first(self.onto.get_typed_nodes_linked_from(s, "is_a", "Type"))
                widgets = self.onto.get_typed_nodes_linked_to(t, "is_used", "Widget")
                widget = None
                for w in widgets:
                    if self.get_language(w) == "JavaScript":
                        widget = w
                        break
                if widget:
                    code = self.get_code(widget)
                    if ("inline" in s["attributes"]) and s["attributes"]["inline"]:
                        code = code.replace("ADD_WIDGET", "INLINE_WIDGET")
                    code = code.replace("SETTINGS_VAL", "node.data.settingsVal")
                    code = code.replace("SETTINGS_CHANGED", "node.data.settingsChanged")
                    code = code.replace("SETTINGS", "node.data.settings")
                    code = code.replace("SETTING_ID", s["id"])
                    code = code.replace("SETTING_NAME", s["name"])
                    code = code.replace("NODE_ID", "node.id")
                    f = f + "(function () { " + code + " }).call(this);"
            f = f + " }"
            return f
        return "function (node){ " + initCode + " }"

    def check_mode(self, leaf):
        if self.mode != Mode.MIXED:
            curMode = Mode.UNDEFINED
            if self.onto.first(self.onto.get_typed_nodes_linked_to(leaf, "is_instance", "ServerSideWorker")):
                curMode = Mode.MIXED
            elif self.onto.first(self.onto.get_typed_nodes_linked_to(leaf, "is_instance", "EdgeSideWorker")):
                curMode = Mode.IOT_PROGRAMMING
            elif self.onto.first(self.onto.get_typed_nodes_linked_to(leaf, "is_instance", "ClientSideWorker")):
                curMode = Mode.VISUALIZATION
            if self.mode == Mode.UNDEFINED:
                self.mode = curMode
            elif (curMode != Mode.UNDEFINED) and (self.mode != curMode):
                self.mode = Mode.MIXED

    def add_leaf(self, leaf):
        self.tree = self.tree + "<li><span id='i" + str(self.treeID) + "'>" + leaf["name"] + "</span></li>"
        inputNodes = self.onto.get_typed_nodes_linked_from(leaf, "has", "Input")
        inputNodes = sorted(inputNodes, key = lambda inp: int(inp["id"]))
        inputs = self.gen_sockets(inputNodes)
        outputNodes = self.onto.get_typed_nodes_linked_from(leaf, "has", "Output")
        outputNodes = sorted(outputNodes, key = lambda outp: int(outp["id"]))
        outputs = self.gen_sockets(outputNodes)
        settingNodes = self.onto.get_typed_nodes_linked_from(leaf, "has", "Setting")
        worker = self.gen_worker(self.onto.get_typed_nodes_linked_to(leaf, "is_instance", "ClientSideWorker"), inputNodes, outputNodes, settingNodes)
        sett = self.gen_settings(settingNodes)
        self.treeNodes = self.treeNodes +\
                         "editor.registerNode('" + leaf["name"] + "', " + inputs + ", " + outputs + ", " + worker + ", " + sett + ");"
        self.treeHandlers = self.treeHandlers +\
                            "$('#i" + str(self.treeID) +\
                            "').click(function (e){editor.createNode('" + leaf["name"] + "');});"
        self.treeID = self.treeID + 1
        self.check_mode(leaf)

    def add_tree_level(self, root, children):
        self.add_node(root)
        self.tree = self.tree + "<ul>"
        for c in children:
            subChildren = self.onto.get_nodes_linked_to(c, "is_a")
            if len(subChildren) > 0:
                self.add_tree_level(c["name"], subChildren)
            else:
                self.add_leaf(c)
        self.tree = self.tree + "</ul>"

    def gen_tree(self):
        self.tree = "<ul>"

        rootNode = self.onto.first(self.onto.get_nodes_by_name("Root"))
        categories = self.onto.get_nodes_linked_to(rootNode, "is_a")
        for category in categories:
            self.add_tree_level(category["name"], self.onto.get_nodes_linked_to(category, "is_a"))

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
        workers = self.onto.get_nodes_linked_to(mask, "is_used")
        if workers:
            for worker in workers:
                if self.onto.is_node_of_type(resolver, "ServerSideWorker") and self.get_language(resolver) == "Python":
                    return self.execute(worker)
        return None

    def task_onto_has_operations(self, taskOnto):
        for link in taskOnto.links():
            if link["name"] == "is_hosted":
                return True
        return False

    def gen_eon(self, dfd):
        dfd2onto = DFD2Onto(self.onto)
        eonOnto = dfd2onto.get_onto(dfd)
        eon = Eon(self.onto)
        bs, eonOnto = eon.get_eon(eonOnto)
        barr = []
        for b in bs:
            barr.append(b)
        return { "ont": eonOnto.data, "eon": barr }

    def gen_mixed(self, dfd):
        dfd2onto = DFD2Onto(self.onto)
        mixedOnto = dfd2onto.get_onto(dfd)
        # Server
        srvRes = mixedOnto.first(mixedOnto.get_nodes_by_name("SciVi Server"))
        serverOntoData = None
        serverOntoHash = None
        corTable = None
        if srvRes:
            hosting = mixedOnto.first(mixedOnto.get_nodes_linked_to(srvRes, "is_instance"))
            serverOnto, corTable = dfd2onto.split_onto(mixedOnto, hosting)
            if self.task_onto_has_operations(serverOnto):
                execer = Execer(self.onto, serverOnto)
                serverOntoHash = serverOnto.calc_hash()
                self.execers[serverOntoHash] = execer
                execer.start()
                serverOntoData = serverOnto.data
        # Edge
        edgeRes = mixedOnto.first(mixedOnto.get_nodes_by_name("ESP8266"))
        eonBytes = []
        if edgeRes:
            hosting = mixedOnto.first(mixedOnto.get_nodes_linked_to(edgeRes, "is_instance"))
            edgeOnto, corTable = dfd2onto.split_onto(mixedOnto, hosting)
            eon = Eon(self.onto)
            bs, eonOnto = eon.get_eon(edgeOnto)
            eonBytes = []
            for b in bs:
                eonBytes.append(b)
        return { "ont": edgeOnto.data, "cor": corTable, "eon": eonBytes }, serverOntoHash

    def stop_execer(self, serverOntoHash):
        if serverOntoHash and serverOntoHash in self.execers:
            self.execers[serverOntoHash].stop()

    def get_file_from_storage(self, filename):
        return self.files[filename]
