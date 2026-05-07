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

    def __init__(self, name, type, default):
        '''
        Create annotation with name and type.

        @param name - annotation's name.
        @param type - annotation's type.
        @param default - annotation's default.
        '''
        self.name = name
        self.type = type
        self.default = default

def get_op_annotation(line, annotation):
    '''
    Try to parse operator's annotation from the source code line.

    @param line - source code line.
    @param annotation - annotation name.
    @param name annotation if any, or None.
    '''
    r = re.match(f".*@{annotation} (?:\"(.+)\"|([^ ]+)) *: *(?:\"(.+)\"|([^ ]+))(?: *: *(?:\"(.+)\"|([^ ]+)))?", line)
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
        if r.group(5) == None:
            default = r.group(6)
        else:
            default = r.group(5)
        return Annotation(name, type, default)

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
            if item.default == None:
                bDefault = None
            else:
                bDefault = { "default": item.default }
            bNode = onto.add_node(item.name, bDefault)
            tNode = first(onto.get_nodes_by_name(item.type))
            if tNode == None:
                tNode = onto.add_node(item.type)
            onto.link_nodes(bNode, kNode, "is_a")
            onto.link_nodes(bNode, tNode, "is_a")
            onto.link_nodes(opNode, bNode, "has")

def gen_python(srcFilePath, onto):
    '''
    Generate operator's ontology for an operator written in Python.

    @param srcFilePath - path to the source code file.
    @param onto - empty ontology to fill.
    @return name of the operator extracted from the file.
    '''
    op = None
    opSettings = []
    opInputs = []
    opOutputs = []
    with open(srcFilePath, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("#"):
                opName = get_op_annotation(line, "operator")
                opSetting = get_op_annotation(line, "setting")
                opInput = get_op_annotation(line, "input")
                opOutput = get_op_annotation(line, "output")
                if opName != None and op == None:
                    op = opName
                if opSetting != None:
                    opSettings.append(opSetting)
                if opInput != None:
                    opInputs.append(opInput)
                if opOutput != None:
                    opOutputs.append(opOutput)
    opNode = onto.add_node(op.name)
    opType = onto.add_node(op.type)
    onto.link_nodes(opNode, opType, "is_a")
    opWorker = onto.add_node(f"{op.name} Worker", { "path": srcFilePath })
    onto.link_nodes(opWorker, opNode, "is_instance")
    serverSideWorker = onto.add_node("ServerSideWorker")
    onto.link_nodes(opWorker, serverSideWorker, "is_a")
    pythonLang = onto.add_node("Python")
    onto.link_nodes(opWorker, pythonLang, "language")
    add_belongings(opNode, opSettings, "Setting", onto)
    add_belongings(opNode, opInputs, "Input", onto)
    add_belongings(opNode, opOutputs, "Output", onto)
    return op.name

def gen_javascript(srcFileName, onto):
    pass

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
