#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import json
import re
import importlib
import datetime
import socket
from turtle import done
from typing import Dict, List, Tuple, Optional
from xmlrpc import server

from threading import Thread

import websockets
from onto.merge import OntoMerger
from onto.onto import Node, Onto, OntoEncoder, first
from enum import Enum
import uuid
import socket
from server.eon import Eon
from server.dfd2onto import DFD2Onto
from server.execer import Execer, ExecutionMode, SendMessageFunc
from server.utils import CodeUtils
from server.fwgen import FWGen

def get_unused_port():

    """
    Get an empty port for the Pyro nameservr by opening a socket on random port,
    getting port number, and closing it [not atomic, so race condition is possible...]
    Might be better to open with port 0 (random) and then figure out what port it used.
    """
    so = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    so.bind(('localhost', 0))
    _, port = so.getsockname()
    so.close()
    return port 

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
    def __init__(self, id, path_to_onto: str, event_loop : asyncio.AbstractEventLoop, context):
        self.id = id
        self.path_to_onto = path_to_onto
        self.onto = OntoMerger(path_to_onto).onto
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
        self.execers: Dict[str, Execer] = {}
        self.codeUtils = CodeUtils()
        self.gen_tree()
        self.node_states = {} #global storate for each node
        for node in self.onto.nodes:
            self.node_states[node.id] = {}
        self.__cmd_server_loop__ = event_loop
         # start command server
        self.__server__ = None
        self.server_become_unused_event = None
        self.__websockets__ = []
        self.command_server_port = get_unused_port()
        asyncio.run_coroutine_threadsafe(self.wait_for_connection(), self.__cmd_server_loop__)

    def release(self):
        self.stop_all_execers()
        self.__server__.close()

    async def wait_for_connection(self):
        self.__server__ = await websockets.serve(self.client_handler, 'localhost', self.command_server_port)
         
    async def client_handler(self, websocket):
        print('Client connected to command server')
        self.__websockets__.append(websocket)
        try:
            async for message in websocket:
                print('message received', message)
        finally:
            self.__websockets__.remove(websocket)
            print('Connection with command server was closed')
            if len(self.__websockets__) == 0 and not self.server_become_unused_event is None:
                self.server_become_unused_event(self.id)


    def broadcast(self, message : str):
        for socket in self.__websockets__:
            self.__cmd_server_loop__.create_task(socket.send(message))

    def add_node(self, node: Node):
        self.tree = self.tree +\
                    "<li><input type='checkbox' id='i" +\
                    str(self.treeID) +\
                    "'/><label for='i" +\
                    str(self.treeID) +\
                    "'>" + node + "</label>"
        self.treeID = self.treeID + 1

    def gen_sockets(self, sockets: List[Node]):
        result = "["
        for s in sockets:
            t = first(self.onto.get_typed_nodes_linked_from(s, "base_type", "Type"))
            if not t:
                t = first(self.onto.get_typed_nodes_linked_from(s, "is_a", "Type"))
            if not t:
                print("WARNING: Ignoring socket with no type <" + s.name + ">")
            if "color" in t.attributes:
                self.typeColors[t.name] = t.attributes["color"]
            else:
                self.typeColors[t.name] = "#000000"
            result = result +\
                     "{ 'name': '" + s.name +\
                     "', 'type': '" + t.name +\
                     "' },"
        return result + "]"

    def get_language(self, node: Node):
        result = first(self.onto.get_nodes_linked_from(node, "language"))
        if result:
            return result.name
        else:
            return ""

    def guess_mime(self, filename):
        if filename.endswith(".svg"):
            return "image/svg+xml; charset=utf-8"
        elif filename.endswith(".png"):
            return "image/png"
        return None

    def get_mime(self, node: Node):
        if "mime" in node.attributes:
            return node.attributes["mime"]
        elif "path" in node.attributes:
            return self.guess_mime(node.attributes["path"])
        return None

    def add_dependencies(self, node: Node):
        deps = self.onto.get_typed_nodes_linked_from(node, "has", "Dependency")
        if deps:
            for d in deps:
                lang = self.get_language(d)
                if lang:
                    if not (lang in self.dependencies):
                        self.dependencies[lang] = {}
                    self.dependencies[lang][d.id] = self.codeUtils.get_code(d)
                    self.add_dependencies(d)
                else:
                    self.files[d.name] = { "content": self.codeUtils.get_file(d), "mime": self.get_mime(d) }

    def execute(self, node: Node):
        if "inline" in node.attributes:
            return eval(node.attributes["inline"])
        elif "path" in node.attributes:
            _, package = node.attributes["path"].rsplit(".", 1)
            worker = importlib.import_module(node.attributes["path"] + "." + package)
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

    def type_of_node(self, node: Node):
        protos = self.onto.get_nodes_linked_from(node, "is_a")
        for p in protos:
            if self.onto.is_node_of_type(p, "Type"):
                return p
        return None

    def resolve_default(self, node: Node):
        t = first(self.onto.get_typed_nodes_linked_from(node, "is_a", "Type"))
        if not t:
            return 0
        if t.name == "String":
            return ""
        elif t.name == "Date" or t.name == "Time":
            return int(datetime.datetime.now().timestamp() * 1000)
        else:
            return 0

    def resolve_containers(self, code, inputs: List[Node], outputs : List[Node], settings : List[Node], viewType: Node):
        props = re.findall(r"PROPERTY\[\"(.+?)\"\]", code)
        for p in props:
            found = False
            for i, inp in enumerate(inputs):
                if p == inp.name:
                    dv = None
                    if "default" in inp.attributes:
                        dv = inp.attributes["default"]
                        if isinstance(dv, str):
                            dv = "\"" + dv + "\""
                        else:
                            dv = str(dv).lower()
                    else:
                        dv = "undefined"
                    code = code.replace("PROPERTY[\"" + p + "\"]", "(inputs[" + str(i) + "].length > 0 ? (inputs[" + str(i) + "][0] !== null ? inputs[" + str(i) + "][0]: " + dv + "): " + dv + ")")
                    found = True
                    break
            if not found:
                code = code.replace("PROPERTY[\"" + p + "\"]", "node.data.settingsVal[\"" + p + "\"]")
        if viewType:
            addVisualCall = "var ADD_VISUAL = function (con) { editor.addVisualToViewport(con, node.position, '" + viewType.attributes["split"] + "'); }; "
        else:
            addVisualCall = "var ADD_VISUAL = function (con) { editor.addVisualToViewport(con, node.position); }; "
        code = addVisualCall +\
               "var UPDATE_WIDGETS = function () { editor.updateWidgets(node); }; " +\
               code
        # TODO: Fix replaces
        for i, inp in enumerate(inputs):
            code = code.replace("HAS_INPUT[\"" + inp.name + "\"]", "(inputs[" + str(i) + "].length > 0)")
            code = code.replace("INPUT[\"" + inp.name + "\"]", "inputs[" + str(i) + "][0]")
            #code = re.sub("(INPUT|input)((\[[\"\'](" + inp["name"] + ")[\"\']\])|\." + inp["name"] + ")", "inputs[" + str(i) + "][0]", code);
        for i, outp in enumerate(outputs):
            code = code.replace("OUTPUT[\"" + outp.name + "\"]", "outputs[" + str(i) + "]")
            
        code = code.replace("DATA", "node.data")
        code = code.replace("CACHE", "node.data.cache")
        code = code.replace("PROCESS", "editor.process")
        code = code.replace("IN_VISUALIZATION", "editor.inVisualization")
        code = code.replace("SETTINGS_VAL", "node.data.settingsVal")
        code = code.replace("SETTINGS_CHANGED", "node.data.settingsChanged")
        code = code.replace("SETTINGS", "node.data.settings")
        return code

    def gen_worker(self, workers, inputs, outputs, settings):
        w = first(workers)
        if w:
            masks = self.onto.get_typed_nodes_linked_from(w, "has", "Code Mask")
            code = self.process_code(self.codeUtils.get_code(w), masks)
            proto = first(self.onto.get_nodes_linked_from(w, "is_instance"))
            viewType = first(self.onto.get_typed_nodes_linked_from(proto, "is_a", "View"))
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
                        "if (node.data.txAddress) { " +\
                            "for (var i = 0, n = inputs.length; i < n; ++i) " +\
                                "editor.transmitInput(node.data.txAddress, node.id, i, inputs[i][0]); " +\
                        "} " +\
                   "}"

    def gen_settings(self, settings: List[Node]):
        types = ""
        defs = ""
        doms = ""
        for s in settings:
            dv = None
            if "default" in s.attributes:
                dv = s.attributes["default"]
            else:
                dv = self.resolve_default(s)
            if isinstance(dv, str):
                dv = "\"" + dv + "\""
            else:
                dv = str(dv).lower()
            defs = defs + "\"" + s.name + "\": " + dv + ", "
            if "domain" in s.attributes:
                dm = s.attributes["domain"]
                doms = doms + "\"" + s.name + "\": " + self.resolve_domain(dm, s) + ", "
            types = types + "\"" + s.name + "\": \"" + self.type_of_node(s).name + "\", "

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
                t = first(self.onto.get_typed_nodes_linked_from(s, "is_a", "Type"))
                widgets = self.onto.get_typed_nodes_linked_to(t, "is_used", "Widget")
                widget = None
                for w in widgets:
                    if self.get_language(w) == "JavaScript":
                        widget = w
                        break
                if widget:
                    code = self.codeUtils.get_code(widget)
                    if ("inline" in s.attributes) and s.attributes["inline"]:
                        code = code.replace("ADD_WIDGET", "INLINE_WIDGET")
                    code = code.replace("SETTINGS_VAL", "node.data.settingsVal")
                    code = code.replace("SETTINGS_CHANGED", "node.data.settingsChanged")
                    code = code.replace("SETTINGS", "node.data.settings")
                    code = code.replace("SETTING_ID", str(s.id))
                    code = code.replace("SETTING_NAME", s.name)
                    code = code.replace("NODE_ID", "node.id")
                    f = f + "(function () { " + code + " }).call(this);"
            f = f + " }"
            return f
        return "function (node){ " + initCode + " }"

    def check_mode(self, leaf):
        if self.mode != Mode.MIXED:
            curMode = Mode.UNDEFINED
            if first(self.onto.get_typed_nodes_linked_to(leaf, "is_instance", "ServerSideWorker")):
                curMode = Mode.MIXED
            elif first(self.onto.get_typed_nodes_linked_to(leaf, "is_instance", "EdgeSideWorker")):
                curMode = Mode.IOT_PROGRAMMING
            elif first(self.onto.get_typed_nodes_linked_to(leaf, "is_instance", "ClientSideWorker")):
                curMode = Mode.VISUALIZATION
            if self.mode == Mode.UNDEFINED:
                self.mode = curMode
            elif (curMode != Mode.UNDEFINED) and (self.mode != curMode):
                self.mode = Mode.MIXED

    def add_leaf(self, leaf: Node):
        self.tree = self.tree + "<li><span id='i" + str(self.treeID) + "'>" + leaf.name + "</span></li>"
        inputNodes = self.onto.get_typed_nodes_linked_from(leaf, "has", "Input")
        inputNodes = sorted(inputNodes, key = lambda inp: inp.id)
        inputs = self.gen_sockets(inputNodes)
        outputNodes = self.onto.get_typed_nodes_linked_from(leaf, "has", "Output")
        outputNodes = sorted(outputNodes, key = lambda outp: outp.id)
        outputs = self.gen_sockets(outputNodes)
        settingNodes = self.onto.get_typed_nodes_linked_from_inherited(leaf, "has", "Setting")
        worker = self.gen_worker(self.onto.get_typed_nodes_linked_to(leaf, "is_instance", "ClientSideWorker"), inputNodes, outputNodes, settingNodes)
        sett = self.gen_settings(settingNodes)
        self.treeNodes = self.treeNodes +\
                         "editor.registerNode('" + leaf.name+ "', " + str(leaf.UID) + ", " + inputs + ", " + outputs + ", " + worker + ", " + sett + ");"
        self.treeHandlers = self.treeHandlers +\
                            "$('#i" + str(self.treeID) +\
                            "').click(function (e){editor.createNode('" + leaf.name + "');});"
        self.treeID = self.treeID + 1
        self.check_mode(leaf)

    def add_tree_level(self, root: Node, children: List[Node]):
        self.add_node(root)
        self.tree = self.tree + "<ul>"
        for c in children:
            subChildren = self.onto.get_nodes_linked_to(c, "is_a")
            if len(subChildren) > 0:
                self.add_tree_level(c.name, subChildren)
            else:
                self.add_leaf(c)
        self.tree = self.tree + "</ul>"

    def gen_tree(self):
        self.tree = "<ul>"

        rootNode = first(self.onto.get_nodes_by_name("Root"))
        categories = self.onto.get_nodes_linked_to(rootNode, "is_a")
        for category in categories:
            self.add_tree_level(category.name, self.onto.get_nodes_linked_to(category, "is_a"))

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

    def task_onto_has_operations(self, taskOnto: Onto):
        for link in taskOnto.links:
            if link.name == "is_hosted":
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

    def gen_mixed(self, dfd) -> Tuple[Dict, Optional[str]]:
        dfd2onto = DFD2Onto(self.onto) #load ontology
        mixedOnto = dfd2onto.get_onto(dfd) # get ontology for dfd
        # Server
        srvRes = first(mixedOnto.get_nodes_by_name("SciVi Server"))
        serverTaskHash = None
        corTable = None
        if srvRes:
            hosting = first(mixedOnto.get_nodes_linked_to(srvRes, "is_instance")) # get all plugins
            serverOnto, corTable = dfd2onto.split_onto(mixedOnto, hosting)
            if self.task_onto_has_operations(serverOnto): 
                execer = Execer(self.onto, serverOnto, self.node_states, self.broadcast, self.__cmd_server_loop__)
                serverTaskHash = str(uuid.uuid4())
                self.execers[serverTaskHash] = execer
                execer.turn(ExecutionMode.INITIALIZATION)
                execer.start()
        # Edge
        edgeRes = first(mixedOnto.get_nodes_by_name("ESP8266"))
        eonBytes = []
        if edgeRes:
            hosting = first(mixedOnto.get_nodes_linked_to(edgeRes, "is_instance"))
            edgeOnto, corTableEdge = dfd2onto.split_onto(mixedOnto, hosting)
            if corTable:
                corTable.update(corTableEdge)
            else:
                corTable = corTableEdge
            eon = Eon(self.onto)
            bs, eonOnto = eon.get_eon(edgeOnto)
            eonBytes = []
            for b in bs:
                eonBytes.append(b)
        return { "ont": json.dumps(edgeOnto, cls = OntoEncoder), 
                    "cor": corTable, "eon": eonBytes }, serverTaskHash

    def stop_execer(self, serverTaskHash):
        if serverTaskHash and serverTaskHash in self.execers:
            self.execers[serverTaskHash].stop()
            self.execers[serverTaskHash].join()
            del self.execers[serverTaskHash]

    def stop_all_execers(self):
        for execerTaskHash in self.execers:
            self.execers[execerTaskHash].stop()
            self.execers[execerTaskHash].join()
        self.execers = {}

    def get_file_from_storage(self, filename):
        return self.files[filename]

    def gen_firmware(self, elementName):
        fwGen = FWGen(self.onto)
        return fwGen.generate(elementName, "/tmp/" + elementName)

    def get_devices_list(self, st_val: str = "upnp:rootdevice", timeout: int = 3):
        """Find devices in the network with SSDP protocol using specified ST header.

        :param st_val:  ST header value. Please check UPnP documentation
                        or use 'upnp:rootdevice' value to find all devices
                        in network.
        :param timeout: the time interval during which devices must respond
                        (preferably from 1 to 5).

        :returns:       set of ip addresses of the devices
                        satisfying the search condition (ST header).
        """

        ssdp_addr = "239.255.255.250"
        ssdp_port = 1900
        ssdp_mx = timeout

        ssdp_request = ("M-SEARCH * HTTP/1.1\r\n"
                        + "HOST: %s:%d\r\n" % (ssdp_addr, ssdp_port)
                        + "MAN: \"ssdp:discover\"\r\n"
                        + "MX: %d\r\n" % (ssdp_mx, )
                        + "ST: %s\r\n" % (st_val, ) + "\r\n")
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 5)
        sock.bind(('', 19011))

        sock.settimeout(timeout * 1.1)
        sock.sendto(ssdp_request.encode(), (ssdp_addr, ssdp_port))
        ip_set = set()
        while True:
            try:
                data, addr = sock.recvfrom(10240)
            except socket.timeout:
                break
            ip_set.add(addr[0])
        sock.close()
        return list(ip_set)

    def scan_ssdp(self):
        return self.get_devices_list("urn:edge-scivi:device:eon-esp8266:2.0")
