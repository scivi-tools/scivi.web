#!/usr/bin/env python3
# -*- coding: utf-8 -*-


import sys
import os
import re
import math

from onto.onto import Node, Onto, OntoEncoder, first


class Annotation:
    '''
    The Annotation class provides storage for annotation pairs.
    '''

    def __init__(self, name, type, domain, default):
        '''
        Create annotation with name and type.

        @param name - annotation's name.
        @param type - annotation's type.
        @param domain - annotation's domain.
        @param default - annotation's default.
        '''
        self.name = name
        self.type = type
        self.domain = domain
        self.default = default

def get_op_annotation(line, annotation):
    '''
    Try to parse operator's annotation from the source code line.

    @param line - source code line.
    @param annotation - annotation name.
    @param annotation if any, or `None`.
    '''
    r = re.match(f".*@{annotation} (?:\"(.+?)\"|([^ ]+)) *: *(?:\"(.+?)\"|([^ ^{{]+))(?: *{{(.*)}})?(?: *: *(?:\"(.+?)\"|([^ ]+)))?", line)
    if r == None:
        return None
    else:
        if r.group(1) == None:
            name = r.group(2)
        else:
            name = r.group(1)
        if r.group(3) == None:
            type = r.group(4)
        else:
            type = r.group(3)
        domain = r.group(5)
        if r.group(6) == None:
            default = r.group(7)
        else:
            default = r.group(6)
        return Annotation(name, type, domain, default)

def get_op_directive(line, directive):
    '''
    Try to parse operator's directive from the source code line.

    @param line - source code line.
    @param directive - directive name.
    @param directive if any, or `None`.
    '''
    r = re.match(f".*@{directive} (?:\"(.+?)\"|([^ ]+))", line)
    if r == None:
        return None
    else:
        if r.group(1) == None:
            return r.group(2)
        else:
            return r.group(1)

def add_belongings(opNode, opBelongings, belongingsKind, onto):
    '''
    Add belongings (settings, inputs, or outputs) to the operator.

    @param opNode - operator's node.
    @param opBelongings - array of belongings.
    @param belongingsKind - string name of belongings kind ("Setting", "Input", or "Output").
    @param onto - ontology.
    '''
    if len(opBelongings) > 0:
        kNode = first(onto.get_nodes_by_name(belongingsKind))
        if kNode == None:
            kNode = onto.add_node(belongingsKind)
        for item in opBelongings:
            bAttrs = {}
            if item.domain != None:
                bAttrs["domain"] = item.domain
            if item.default != None:
                bAttrs["default"] = item.default
            bNode = onto.add_node(item.name, bAttrs)
            tNode = first(onto.get_nodes_by_name(item.type))
            if tNode == None:
                tNode = onto.add_node(item.type)
            onto.link_nodes(bNode, kNode, "is_a")
            onto.link_nodes(bNode, tNode, "is_a")
            onto.link_nodes(opNode, bNode, "has")

def add_view(opNode, opView, onto):
    '''
    Add view modifier to the operator.

    @param opNode - operator's node.
    @param opView - name of the view modifier.
    @param onto - ontology.
    '''
    if opView != None:
        viewRoot = first(onto.get_nodes_by_name("View"))
        if viewRoot == None:
            viewRoot = onto.add_node("View")
        view = first(onto.get_nodes_by_name(opView))
        if view == None:
            view = onto.add_node(opView)
        onto,link_nodes(view, viewRoot, "is_a")
        onto.link_nodes(opNode, view, "is_a")

def detect_dependency_language(depName):
    '''
    Try to figure out language of dependency file by name.

    @param depName - dependency file name.
    @return language name if detected, `None` if not.
    '''
    if depName.endswith(".js"):
        return "JavaScript"
    elif depName.endswith(".css"):
        return "CSS"
    else:
        return None

def add_dependencies(opWorker, opDependencies, onto):
    '''
    Add dependencies of the operator.

    @param opWorker - operator's worker node.
    @param opDependencies - array of dependencies.
    @param onto - ontology.
    '''
    if len(opDependencies) > 0:
        depRoot = first(onto.get_nodes_by_name("Dependency"))
        if depRoot == None:
            depRoot = onto.add_node("Dependency")
        for item in opDependencies:
            dName = os.path.basename(item)
            opDep = onto.add_node(dName, { "path": item })
            onto.link_nodes(opDep, depRoot, "is_a")
            onto.link_nodes(opWorker, opDep, "has")
            dLang = detect_dependency_language(dName)
            if dLang != None:
                opDepLang = first(onto.get_nodes_by_name(dLang))
                if opDepLang == None:
                    opDepLang = onto.add_node(dLang)
                onto.link_nodes(opDep, opDepLang, "language")

def gen_skeleton(srcFilePath, comment, worker, language, onto):
    '''
    Generate the skeleton of an operator's ontology for an operator written in the given language.

    @param srcFilePath - path to the source code file.
    @param comment - sbstring indicating comments in the target language.
    @param worker - name of the worker type.
    @param language - name of the language.
    @param onto - empty ontology to fill.
    @return name of the operator extracted from the file.
    '''
    op = None
    opSettings = []
    opInputs = []
    opOutputs = []
    opView = None
    opDependencies = []
    with open(srcFilePath, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(comment):
                opName = get_op_annotation(line, "operator")
                opSetting = get_op_annotation(line, "setting")
                opInput = get_op_annotation(line, "input")
                opOutput = get_op_annotation(line, "output")
                opView = get_op_directive(line, "view")
                opDep = get_op_directive(line, "dependency")
                if opName != None and op == None:
                    op = opName
                if opSetting != None:
                    opSettings.append(opSetting)
                if opInput != None:
                    opInputs.append(opInput)
                if opOutput != None:
                    opOutputs.append(opOutput)
                if opDep != None:
                    opDependencies.append(opDep)
    opNode = onto.add_node(op.name)
    opType = onto.add_node(op.type)
    onto.link_nodes(opNode, opType, "is_a")
    opWorker = onto.add_node(f"{op.name} Worker", { "path": srcFilePath })
    onto.link_nodes(opWorker, opNode, "is_instance")
    serverSideWorker = onto.add_node(worker)
    onto.link_nodes(opWorker, serverSideWorker, "is_a")
    opLang = onto.add_node(language)
    onto.link_nodes(opWorker, opLang, "language")
    add_belongings(opNode, opSettings, "Setting", onto)
    add_belongings(opNode, opInputs, "Input", onto)
    add_belongings(opNode, opOutputs, "Output", onto)
    add_view(opNode, opView, onto)
    add_dependencies(opWorker, opDependencies, onto)
    return op.name

def gen_python(srcFilePath, onto):
    '''
    Generate operator's ontology for an operator written in Python.

    @param srcFilePath - path to the source code file.
    @param onto - empty ontology to fill.
    @return name of the operator extracted from the file.
    '''
    return gen_skeleton(srcFilePath, "#", "ServerSideWorker", "Python", onto)

def gen_javascript(srcFilePath, onto):
    '''
    Generate operator's ontology for an operator written in JavaScript.

    @param srcFilePath - path to the source code file.
    @param onto - empty ontology to fill.
    @return name of the operator extracted from the file.
    '''
    return gen_skeleton(srcFilePath, "//", "ClientSideWorker", "JavaScript", onto)

def arrange_nodes(onto):
    '''
    Arrange the nodes of the ontology.

    @param onto - ontology to arrange nodes of.
    '''
    n = int(math.sqrt(len(onto.nodes)))
    i = 0
    j = 0
    x = -300
    y = -300
    w = 100
    h = 30
    for node in onto.nodes:
        node.position_x = x + i * w
        node.position_y = y + j * h
        i = i + 1
        if i == n:
            i = 0
            j = j + 1

LANGS = {
    ".py": gen_python,
    ".js": gen_javascript
}

NAMESPACES = {
    "default": "https://scivi.tools/",
    "owl": "http://www.w3.org/2002/07/owl",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema",
    "xsd": "http://www.w3.org/2001/XMLSchema"
}

if len(sys.argv) != 3:
    print("This tool generates the operator's ontology by analysing the (annotated) source code of the operator.")
    print("Usage: ./addoperator.py <path-to-operator> <path-to-knowledge-base>")
    exit(-1)

opPath = sys.argv[1]
kbPath = sys.argv[2]

opFileName, opFileExt = os.path.splitext(os.path.basename(opPath))

opOnto = Onto(0, NAMESPACES, [], [], "", name = opFileName)
opName = LANGS[opFileExt](opPath, opOnto)
opOntoFileName = os.path.join(kbPath, opFileName + ".ont")
arrange_nodes(opOnto)
opOnto.write_to_file(opOntoFileName)

print(f"Operator's ontology of <{opName}> is written to <{opOntoFileName}>")
