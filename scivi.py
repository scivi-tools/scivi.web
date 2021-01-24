#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, send_from_directory, request, jsonify

from server.server import SciViServer, Mode
from onto.merge import OntoMerger


app = Flask(__name__, static_url_path = "")
srvDict = {}

def getEditor(name):
    global srvDict
    if name in srvDict:
        del srvDict[name]
    res = send_from_directory("client", "editor.html")
    res.set_cookie("srv", value = name, samesite = "Lax")
    if name in srvDict:
        del srvDict[name]
    return res, 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/")
@app.route("/index.html")
@app.route("/csv")
def csv_page():
    return getEditor("csv")

@app.route("/es")
def es_page():
    return getEditor("es")

@app.route("/shielder")
def shielder_page():
    return getEditor("shielder")

@app.route("/glove")
def glove_page():
    return getEditor("glove")

@app.route("/soc")
def soc_page():
    return getEditor("soc")

@app.route("/mxd")
def mxd_page():
    return getEditor("mxd")

def getSrv():
    global srvDict
    srvKey = request.cookies.get("srv")
    if not srvKey:
        raise "Server task not running, visit root page first"
    if not (srvKey in srvDict):
        srvDict[srvKey] = SciViServer(OntoMerger("kb/" + srvKey).onto, None)
    return srvDict[srvKey]

@app.route("/scivi-editor-main.js")
def editor_main():
    return getSrv().get_editor_js(), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/scivi-editor-dependencies.js")
def editor_deps():
    return getSrv().get_editor_dependencies_js(), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/css/scivi-editor-dependencies.css")
def editor_deps_css():
    return getSrv().get_editor_dependencies_css(), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/scivi-sockets.css")
def editor_sockets_css():
    return getSrv().get_editor_css(), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/css/<path:filename>")
def editor_css(filename):
    return send_from_directory("client/css", filename), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/lib/<path:filename>")
def editor_lib(filename):
    return send_from_directory("client/lib", filename), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

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
    dfd = request.get_json(force = True)
    res = None
    try:
        res = getSrv().gen_eon(dfd)
    except ValueError as err:
        res = { "error": str(err) }
    resp = jsonify(res)
    resp.status_code = 200
    return resp

@app.route("/gen_mixed", methods = ['POST'])
def gen_mixed():
    dfd = request.get_json(force = True)
    oldExeKey = request.cookies.get("exe")
    try:
        srv = getSrv()
        srv.stop_execer(oldExeKey)
        res, exeKey = srv.gen_mixed(dfd)
    except ValueError as err:
        res = { "error": str(err) }
    resp = jsonify(res)
    resp.status_code = 200
    resp.set_cookie("exe", value = exeKey, samesite = "Lax")
    return resp

@app.after_request
def add_header(response):
    response.cache_control.max_age = 0
    response.no_cache = True
    return response
