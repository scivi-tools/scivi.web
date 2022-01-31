#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

from onto.merge import OntoMerger
from dataflow import get_operator_implementation, get_operator_implementation_path

def onto_type_to_language_type(onto, typeNode):
    # Find X -> is_instance -> typeNode
    # X -> language -> TypeScript
    implementationTypes = onto.get_nodes_linked_to(typeNode, "is_instance")
    for implType in implementationTypes:
        implLanguage = onto.first(onto.get_nodes_linked_from(implType, "language"))
        if implLanguage and implLanguage["name"] == "TypeScript":
            return implType["name"]
    print("WARNING: Could not find corresponding type for `%s`" % (typeNode["name"]))
    return None

def onto_node_to_language_type(onto, node):
    # Get type of current node (input, output or setting)
    nodeType = onto.first(onto.get_typed_nodes_linked_from(node, "is_a", "Type"))
    typeName = nodeType["name"]
    # Check is generic (e.g. array)
    baseType = onto.first(onto.get_typed_nodes_linked_from(node, "base_type", "Type"))
    if baseType is None:
        return onto_type_to_language_type(onto, nodeType)
    else:
        # Recursive call for base type
        tsType = onto_type_to_language_type(onto, baseType)
        # TODO: Remove hardcoded container when semantic of base_type changed
        return "Array<" + tsType + ">"

def generate_field_name(name, is_read_only=False):
    result = '["' + name + '"]'
    if is_read_only:
        return '    readonly ' + result
    return '    ' + result

def generate_field(name_desc, type_name):
    return '    ' + name_desc + ': ' + type_name

def generate_fields(onto, nodes, is_read_only):
    result = ''
    # Input, output or setting node
    for n in nodes:
        result += generate_field(
                    generate_field_name(n["name"], is_read_only),
                    onto_node_to_language_type(onto, n)
                  ) + ';\n'
    return result

def generate_typings(onto, leaf):
    settingNodes = onto.get_typed_nodes_linked_from(leaf, "has", "Setting")
    inputNodes = onto.get_typed_nodes_linked_from(leaf, "has", "Input")
    outputNodes = onto.get_typed_nodes_linked_from(leaf, "has", "Output")

    result = ''
    result += open(os.path.join(os.path.dirname(__file__), 'types.d.ts')).read() + '\n'
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

def get_typing_path(implementationNode):
    operatorPath = get_operator_implementation_path(implementationNode)
    return operatorPath.replace('.js', '.d.ts')

def save_typing(typing, path):
    with open(os.path.join(os.path.dirname(__file__), '..', path), 'w') as f:
        f.write(typing)

if __name__ == '__main__':
    kb = sys.argv[1]
    operatorName = sys.argv[2]
    mergedOnto = OntoMerger(kb).onto
    typings = generate_leaf_typing(
        mergedOnto,
        operatorName
    )
    operatorImpl = get_operator_implementation(mergedOnto, operatorName, "JavaScript")
    typingPath = get_typing_path(operatorImpl)
    save_typing(typings, typingPath)
