#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio, websockets
from wsgiref.util import request_uri
import re
import socket
from typing import Any, Dict
from flask import Flask, send_from_directory, request, jsonify

from server.server import SciViServer, Mode
from onto.merge import OntoMerger
from threading import Lock, Thread

app = Flask(__name__, static_url_path = "")
event_loop = asyncio.new_event_loop() # event loop for command servers
def event_loop_main():
    global event_loop
    asyncio.set_event_loop(event_loop)
    event_loop.run_forever()
event_loop_thread = Thread(target=event_loop_main)
event_loop_thread.start()
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


class Session:
    def __init__(self, name):
        global event_loop
        self.__event_loop__ = event_loop
        self.name = name
        self.serverInst = SciViServer(OntoMerger("kb/" + self.name).onto, 
                                    self.push_message_to_send, event_loop, None)
        # start command server
        self.__server__ = None
        self.__websocket__ = None
        self.command_server_port = get_unused_port()
        asyncio.run_coroutine_threadsafe(self.wait_for_connection(), self.__event_loop__)
        
    def __del__(self):
        self.__websocket__.close()
        self.__server__.close()

    async def wait_for_connection(self):
        while self.__event_loop__.is_running():
            self.__server__ = await websockets.serve(self.client_handler, 'localhost', self.command_server_port)
         
    async def client_handler(self, websocket):
        print('Client connected to command server')
        self.__websocket__ = websocket
        try:
            async for message in websocket:
                print('message received', message)
        except:
            pass
        print('Connection with command server was closed')

    def push_message_to_send(self, message : str):
        self.__event_loop__.create_task(self.__websocket__.send(message))

    def stop_execers(self):
        self.serverInst.stop_all_execers()

sessions : Dict[str, Session] = {}
mutex = Lock()

def getSession(remote_addr, name):
    global sessions
    global mutex
    print("get sessions")
    #mutex.acquire()
    if remote_addr not in sessions:
        sessions[remote_addr] = Session(name)
    elif sessions[remote_addr].name != name:
        del sessions[remote_addr]
        print('session with', remote_addr, 'closed')
        sessions[remote_addr] = Session(name)
    sessions[remote_addr].stop_execers()
    return sessions[remote_addr]


@app.route("/")
@app.route("/index.html")
@app.route("/csv")
def csv_page():
    session = getSession(request.remote_addr, 'csv')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/es")
def es_page():
    session = getSession(request.remote_addr, 'es')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/eon")
def eon_page():
    session = getSession(request.remote_addr, 'eon')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/shielder")
def shielder_page():
    session = getSession(request.remote_addr, 'shielder')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/glove")
def glove_page():
    session = getSession(request.remote_addr, 'glove')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/soc")
def soc_page():
    session = getSession(request.remote_addr, 'soc')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/eeg")
def mxd_page():
    session = getSession(request.remote_addr, 'eeg')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/mmaps")
def mmaps_page():
    session = getSession(request.remote_addr, 'mmaps')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/eye")
def eye_page():
    session = getSession(request.remote_addr, 'eye')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/locw")
def locw_page():
    session = getSession(request.remote_addr, 'locw')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/paleo")
def paleo_page():
    session = getSession(request.remote_addr, 'paleo')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/ttype")
def ttype_page():
    session = getSession(request.remote_addr, 'ttype')
    res = send_from_directory("client", "editor.html")
    res.set_cookie("CommandServerPort", str(session.command_server_port))
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

def getServerInst(remote_addr) -> SciViServer:
    print("get server")
    global sessions
    global mutex
    #mutex.acquire()
    result = sessions[remote_addr].serverInst
    #mutex.release()
    return result

@app.route("/scivi-editor-main.js")
def editor_main():
    return getServerInst(request.remote_addr).get_editor_js(), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/scivi-editor-dependencies.js")
def editor_deps():
    return getServerInst(request.remote_addr).get_editor_dependencies_js(), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/css/scivi-editor-dependencies.css")
def editor_deps_css():
    return getServerInst(request.remote_addr).get_editor_dependencies_css(), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/scivi-sockets.css")
def editor_sockets_css():
    return getServerInst(request.remote_addr).get_editor_css(), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/css/<path:filename>")
def editor_css(filename):
    return send_from_directory("client/css", filename), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/lib/<path:filename>")
def editor_lib(filename):
    return send_from_directory("client/lib", filename), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/storage/<path:filename>")
def editor_storage(filename):
    f = getServerInst(request.remote_addr).get_file_from_storage(filename)
    if f:
        return f["content"], 200, {'Content-Type': f["mime"]}
    else:
        return "Not found", 404

@app.route("/preset/<path:filename>")
def editor_preset(filename):
    return send_from_directory("client/preset", filename), 200, {'Content-Type': 'application/json; charset=utf-8'}

@app.route("/exec/<nodeID>")
def srv_exec(nodeID):
    # nodeID = request.args.get("nodeID")
    # instanceID = request.args.get("instanceID")
    # print(str(nodeID) + " " + str(instanceID))
    print(nodeID)
    return "OK"

@app.route("/gen_eon", methods = ['POST'])
def gen_eon():
    global event_loop
    asyncio.set_event_loop(event_loop)
    dfd = request.get_json(force = True)
    res = None
    try:
        res = getServerInst(request.remote_addr).gen_eon(dfd)
    except ValueError as err:
        res = { "error": str(err) }
    resp = jsonify(res)
    resp.status_code = 200
    return resp

@app.route("/gen_mixed", methods = ['POST'])
def gen_mixed():
    global event_loop
    asyncio.set_event_loop(event_loop)
    dfd = request.get_json(force = True)
    oldExeKey = request.cookies.get("exe")
    exeKey = None
    #TODO: send message to browser about initialization
    try:
        srv = getServerInst(request.remote_addr)
        srv.stop_execer(oldExeKey)
        res, exeKey = srv.gen_mixed(dfd)
    except ValueError as err:
        res = { "error": str(err) }
    res["srvAddr"] = request.host.split(":")[0]
    resp = jsonify(res)
    resp.status_code = 200
    if exeKey:
        resp.set_cookie("exe", value = exeKey, samesite = "Lax")
    return resp

@app.route("/stop_execer", methods = ['POST'])
def stop_execer():
    global event_loop
    asyncio.set_event_loop(event_loop)
    oldExeKey = request.cookies.get("exe")
    try:
        srv = getServerInst(request.remote_addr)
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
    global event_loop
    asyncio.set_event_loop(event_loop)
    srv = SciViServer(OntoMerger("kb/" + domain).onto, None)
    f = srv.gen_firmware(elementName)
    if f:
        return f["content"], 200, {'Content-Type': f["mime"], "Content-Disposition": "attachment; filename=\"%s.zip\"" % elementName}
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


