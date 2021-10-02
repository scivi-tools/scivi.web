#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

from onto.onto import Onto
from onto.merge import OntoMerger

def onto_type_to_typescript_type(onto, t):
    typeName = t["name"]
    if typeName == "String":
        return 'string'
    if typeName == "Bool":
        return "boolean"
    if typeName == "Array": # TODO: Generate typed array from ontology
        return "Array<any>"
    if typeName == "Quaternion":
        return "Quaternion";
    if typeName == "Grid":
        return "Grid";
    return "any"

def generate_field_name(name, is_read_only=False):
    result = '["' + name + '"]'
    if is_read_only:
        return '    readonly ' + result
    return '    ' + result

def generate_field(name_desc, type_name):
    return '    ' + name_desc + ': ' + type_name

def generate_fields(onto, nodes, is_read_only):
    result = ''
    for n in nodes:
        t = onto.first(onto.get_typed_nodes_linked_from(n, "is_a", "Type"))
        result += generate_field(generate_field_name(n["name"], is_read_only), onto_type_to_typescript_type(onto, t)) + ';\n'
    return result

def generate_typings(onto, leaf):
    settingNodes = onto.get_typed_nodes_linked_from(leaf, "has", "Setting")
    inputNodes = onto.get_typed_nodes_linked_from(leaf, "has", "Input")
    outputNodes = onto.get_typed_nodes_linked_from(leaf, "has", "Output")

    result = ''
    result += open('./types.d.ts').read() + '\n'
    result += 'declare type Settings = {\n'
    result += generate_fields(onto, settingNodes, False)
    result += '};\n\n'

    result += 'declare type ROSettings = {\n'
    result += generate_fields(onto, settingNodes, True)
    result += '};\n\n'

    result += 'declare type Inputs = {\n'
    result += generate_fields(onto, inputNodes, True)
    result += '};\n\n'

    result += 'declare type HasInputs = {\n'
    for i in inputNodes:
        t = onto.first(onto.get_typed_nodes_linked_from(i, "is_a", "Type"))
        result += generate_field(generate_field_name(i["name"], False), 'boolean') + ';\n'
    result += '};\n\n'

    result += 'declare type Outputs = {\n'
    result += generate_fields(onto, outputNodes, False)
    result += '};\n\n'

    result += 'declare type SettingsChanged = {\n'
    for s in settingNodes:
        t = onto.first(onto.get_typed_nodes_linked_from(s, "is_a", "Type"))
        result += generate_field(generate_field_name(s["name"], False), 'boolean') + ';\n'
    result += '};\n\n'

    result += 'declare var SETTINGS: ROSettings;\n'
    result += 'declare var SETTINGS_VAL: Settings;\n'
    result += 'declare var SETTINGS_CHANGED: SettingsChanged;\n'
    result += 'declare var INPUT: Inputs;\n'
    result += 'declare var HAS_INPUT: HasInputs;\n'
    result += 'declare var OUTPUT: Outputs;\n'

    return result

def generate_leaf_typing(onto, leaf_name):
    leaf = onto.first(onto.get_nodes_by_name(leaf_name))
    if leaf is None:
        return None
    return generate_typings(onto, leaf)

def save_typing(typing, out_dir):
    with open(os.path.join(out_dir, 'index.d.ts'), 'w') as f:
        f.write(typing)

if __name__ == '__main__':
    kb = sys.argv[1]
    filterName = sys.argv[2]
    implementationPath = sys.argv[3]
    typings = generate_leaf_typing(
        OntoMerger(kb).onto,
        filterName
    )
    save_typing(typings, implementationPath)
