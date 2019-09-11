#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
from os import curdir, sep, stat

from server.server import SciViServer
from onto.onto import Onto


try:
    from io import BytesIO
except ImportError:
    from StringIO import StringIO as BytesIO

srv = None

class SciViHTTPServerRequestHandler(BaseHTTPRequestHandler):
    def choose_type(self, path):
        if path.endswith(".html") or path.endswith(".htm"):
            return "text/html"
        elif path.endswith(".css"):
            return "text/css"
        elif path.endswith(".js"):
            return "application/javascript"
        elif path.endswith(".png"):
            return "image/png"
        elif path.endswith(".gif"):
            return "image/gif"
        elif path.endswith(".jpg"):
            return "image/jpeg"
        elif path.endswith(".ico"):
            return "image/x-icon"
        elif path.endswith(".xml"):
            return "text/xml"
        elif path.endswith(".pdf"):
            return "application/pdf"
        elif path.endswith(".zip"):
            return "application/zip"
        else:
            return "application/octet-stream"

    def req(self, path = None):
        global srv
        parsed = urlparse(self.path)
        if not path:
            path = parsed.path
        if path == "/":
            path = "/index.html"
        if path == "/index.html":
            srv = SciViServer(Onto("kb/result.ont"), None)
            self.req("editor.html")
        elif path == "/scivi-editor-main.js":
            msg = srv.get_editor_js()
            self.send_response(200)
            self.send_header("Content-type", self.choose_type(path))
            self.end_headers()
            self.wfile.write(bytes(msg, "utf8"))
        elif path == "/scivi-editor-dependencies.js":
            msg = srv.get_editor_dependencies_js()
            self.send_response(200)
            self.send_header("Content-type", self.choose_type(path))
            self.end_headers()
            self.wfile.write(bytes(msg, "utf8"))
        elif path == "/css/scivi-editor-dependencies.css":
            msg = srv.get_editor_dependencies_css()
            self.send_response(200)
            self.send_header("Content-type", self.choose_type(path))
            self.end_headers()
            self.wfile.write(bytes(msg, "utf8"))
        elif path == "/scivi-sockets.css":
            msg = srv.get_editor_css()
            self.send_response(200)
            self.send_header("Content-type", self.choose_type(path))
            self.end_headers()
            self.wfile.write(bytes(msg, "utf8"))
        elif path == "/visualize.html":
            print("vis")
            print(self.rfile.read(10))
            self.send_response(200)
            self.send_header("Content-type", self.choose_type(path))
            self.send_header('Access-Control-Allow-Credentials', 'true')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(bytes("HW", "utf8"))
        elif path == "/demo.html":
            srv = SciViServer(Onto("kb/cgraph_iot/result.ont"), None)
            self.req("editor.html")
        elif path == "/for_images.html":
            srv = SciViServer(Onto("kb/cgraph_iot/for_images/result.ont"), None)
            self.req("editor.html")
        else:
            try:
                f = open(curdir + sep + "client" + sep + path, "rb")
                self.send_response(200)
                self.send_header("Content-type", self.choose_type(path))
                self.end_headers()
                self.wfile.write(f.read())
                f.close()
            except IOError:
                self.send_error(404, "File Not Found: %s" % self.path)

    def do_GET(self):
        self.req()

    def do_POST(self):
        self.send_error(404, "File Not Found: %s" % self.path)



address = ("0.0.0.0", 8000)
httpd = HTTPServer(address, SciViHTTPServerRequestHandler)
print("SciVi Web server running at %s:%d" % address)
httpd.serve_forever()
