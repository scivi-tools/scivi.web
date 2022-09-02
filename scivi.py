#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
from typing import Dict
from flask import Flask, Response, send_from_directory, request, jsonify

from server.server import SciViServer
from threading import Lock, Thread
import traceback

app = Flask(__name__, static_url_path = "")
event_loop = asyncio.new_event_loop() # event loop for command servers
def event_loop_main():
    global event_loop
    asyncio.set_event_loop(event_loop)
    try:
        event_loop.run_forever()
    finally:
        event_loop.close()
event_loop_thread = Thread(target=event_loop_main)
event_loop_thread.start()

servers: Dict[str, SciViServer] = {}
disposed_servers = []
mutex = Lock()

def disposeServer(server_id: str, force: bool = False):
    if server_id in servers and (force or server_id in disposed_servers):
        print('Disposing Server Instance')
        servers[server_id].release()
        server = servers.pop(server_id)
        del server

def markServerAsUnused(server_id: str):
    global event_loop
    if server_id in servers:
        disposed_servers.append(server_id)
        event_loop.call_later(300, disposeServer, server_id)

def markServerAsUsed(server_id: str):
    if server_id in disposed_servers:
        disposed_servers.remove(server_id)
    
def getServerInst() -> SciViServer:
    global mutex
    server_id = request.remote_addr
    with mutex:
        markServerAsUsed(server_id)
        return servers[server_id]

def poolServerInst(server_id, path_to_onto):
    global mutex
    with mutex:
        if server_id not in servers:
            servers[server_id] = SciViServer(server_id, event_loop, None)
            servers[server_id].server_become_unused_event = markServerAsUnused
        server = servers[server_id]
        server.setOnto(path_to_onto) # reset ontology
        server.gen_tree() # generate js & css code for page
        markServerAsUsed(server_id)
        return server

def LoadEditorPage(onto_name) -> Response:
    global event_loop
    path_to_onto = "kb/" + onto_name
    server_id = request.remote_addr
    server = poolServerInst(server_id, path_to_onto)
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(server.command_server_port))
    return res


@app.route("/")
@app.route("/index.html")
@app.route("/csv")
def csv_page():
    return LoadEditorPage('csv'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/es")
def es_page():
    return LoadEditorPage('es'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/eon")
def eon_page():
    return LoadEditorPage('eon'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/shielder")
def shielder_page():
    return LoadEditorPage('shielder'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/glove")
def glove_page():
    return LoadEditorPage('glove'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/soc")
def soc_page():
    return LoadEditorPage('soc'),200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/eeg")
def mxd_page():
    return LoadEditorPage('eeg'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/mmaps")
def mmaps_page():
    return LoadEditorPage('mmaps'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/eye")
def eye_page():
    return LoadEditorPage('eye'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/locw")
def locw_page():
    return LoadEditorPage('locw'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/paleo")
def paleo_page():
    return LoadEditorPage('paleo'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/ttype")
def ttype_page():
    return LoadEditorPage('ttype'), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/scivi-editor-main.js")
def editor_main():
    return getServerInst().get_editor_js(), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/scivi-editor-dependencies.js")
def editor_deps():
    return getServerInst().get_editor_dependencies_js(), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/css/scivi-editor-dependencies.css")
def editor_deps_css():
    return getServerInst().get_editor_dependencies_css(), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/scivi-sockets.css")
def editor_sockets_css():
    return getServerInst().get_editor_css(), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/css/<path:filename>")
def editor_css(filename):
    return send_from_directory("client/css", filename), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/lib/<path:filename>")
def editor_lib(filename):
    return send_from_directory("client/lib", filename), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/storage/<path:filename>")
def editor_storage(filename):
    f = getServerInst().get_file_from_storage(filename)
    if f:
        return f["content"], 200, {'Content-Type': f["mime"]}
    else:
        return "Not found", 404

@app.route("/preset/<path:filename>")
def editor_preset(filename):
    return send_from_directory("client/preset", filename + ".gz"), \
                               200, \
                               {"Content-Type": "application/json; charset=utf-8", \
                                "Content-Encoding": "gzip"}

@app.route("/exec/<nodeID>")
def srv_exec(nodeID):
    # nodeID = request.args.get("nodeID")
    # instanceID = request.args.get("instanceID")
    # print(str(nodeID) + " " + str(instanceID))
    print(nodeID)
    return "OK"

@app.route("/gen_eon", methods = ['POST'])
def gen_eon():
    dfd = request.get_json(force = True)
    res = None
    try:
        res = getServerInst().gen_eon(dfd)
    except ValueError as err:
        res = { "error": str(err) }
    resp = jsonify(res)
    resp.status_code = 200
    return resp

@app.route("/gen_mixed", methods = ['POST'])
def gen_mixed():
    dfd = request.get_json(force = True)
    oldExeKey = request.cookies.get("exe")
    exeKey = None
    dataServerPort = None
    #TODO: send message to browser about initialization
    try:
        srv = getServerInst()
        srv.stop_execer(oldExeKey)
        res, exeKey, dataServerPort = srv.gen_mixed(dfd)
    except Exception as err:
        res = { "error": str(err) }
    res["srvAddr"] = request.host.split(":")[0]
    resp = jsonify(res)
    resp.status_code = 200
    if dataServerPort:
        resp.set_cookie("DataServerPort", value = str(dataServerPort), samesite = "Lax")
    if exeKey:
        resp.set_cookie("exe", value = exeKey, samesite = "Lax")
    return resp

@app.route("/stop_execer", methods = ['POST'])
def stop_execer():
    oldExeKey = request.cookies.get("exe")
    try:
        srv = getServerInst()
        srv.stop_execer(oldExeKey)
        res = {}
    except ValueError as err:
        res = { "error": str(err) }
    resp = jsonify(res)
    resp.status_code = 200
    resp.set_cookie("exe", value = "", samesite = "Lax")
    return resp

@app.route("/fwgen/<domain>/<elementName>")
def fwgen(domain, elementName):
    srv = poolServerInst(request.remote_addr, 'kb/' + domain)
    f = srv.gen_firmware(elementName)
    if f:
        return f["content"], 200, {'Content-Type': f["mime"], "Content-Disposition": "attachment; filename=\"%s.zip\"" % elementName}
    else:
        return "Not found", 404

@app.route("/scan_ssdp")
def scan_ssdp():
    try:
        res = getSrv().scan_ssdp()
    except Exception as e:
        print(traceback.format_exc())
        res = None
    if res is not None:
        resp = jsonify(res)
        resp.status_code = 200
        return resp
    else:
        return "Not found", 404

@app.after_request
def add_header(response):
    response.cache_control.max_age = 0
    response.no_cache = True
    return response

@app.get('/shutdown')
def shutdown():
    global event_loop
    event_loop.call_soon_threadsafe(event_loop.stop)
    event_loop_thread.join()
    return 'Server shutting down...'


