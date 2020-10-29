#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, send_from_directory, request, jsonify

from server.server import SciViServer, Mode
from onto.merge import OntoMerger


app = Flask(__name__, static_url_path="")
srv = None

@app.route("/")
@app.route("/index.html")
@app.route("/csv")
def csv_page():
    global srv
    srv = SciViServer(OntoMerger("kb/csv").onto, None, Mode.VISUALIZATION)
    return send_from_directory("client", "editor.html"), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/es")
def es_page():
    global srv
    srv = SciViServer(OntoMerger("kb/es").onto, None, Mode.IOT_PROGRAMMING)
    return send_from_directory("client", "editor.html"), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/shielder")
def shielder_page():
    global srv
    srv = SciViServer(OntoMerger("kb/shielder").onto, None, Mode.VISUALIZATION)
    return send_from_directory("client", "editor.html"), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/glove")
def glove_page():
    global srv
    srv = SciViServer(OntoMerger("kb/glove").onto, None, Mode.VISUALIZATION)
    return send_from_directory("client", "editor.html"), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/soc")
def soc_page():
    global srv
    srv = SciViServer(OntoMerger("kb/soc").onto, None, Mode.VISUALIZATION)
    return send_from_directory("client", "editor.html"), 200, {'Content-Type': 'text/html; charset=utf-8'}

@app.route("/scivi-editor-main.js")
def editor_main():
    global srv
    if not srv:
        return "Server task not running, visit <a href='/csv'>root</a> page first", 500
    else:
        return srv.get_editor_js(), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/scivi-editor-dependencies.js")
def editor_deps():
    global srv
    if not srv:
        return "Server task not running, visit <a href='/csv'>root</a> page first", 500
    else:
        return srv.get_editor_dependencies_js(), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/css/scivi-editor-dependencies.css")
def editor_deps_css():
    global srv
    if not srv:
        return "Server task not running, visit <a href='/csv'>root</a> page first", 500
    else:
        return srv.get_editor_dependencies_css(), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/scivi-sockets.css")
def editor_sockets_css():
    global srv
    if not srv:
        return "Server task not running, visit <a href='/csv'>root</a> page first", 500
    else:
        return srv.get_editor_css(), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/css/<path:filename>")
def editor_css(filename):
    return send_from_directory("client/css", filename), 200, {'Content-Type': 'text/css; charset=utf-8'}

@app.route("/lib/<path:filename>")
def editor_lib(filename):
    return send_from_directory("client/lib", filename), 200, {'Content-Type': 'text/javascript; charset=utf-8'}

@app.route("/exec/<nodeID>")
def srv_exec(nodeID):
    # nodeID = request.args.get("nodeID")
    # instanceID = request.args.get("instanceID")
    # print(str(nodeID) + " " + str(instanceID))
    print(nodeID)
    return "OK"

@app.route("/gen_eon", methods = ['POST'])
def gen_eon():
    global srv
    dfd = request.get_json(force = True)
    res = srv.gen_eon(dfd)
    resp = jsonify(res)
    resp.status_code = 200
    return resp

@app.after_request
def add_header(response):
    response.cache_control.max_age = 0
    response.no_cache = True
    return response
