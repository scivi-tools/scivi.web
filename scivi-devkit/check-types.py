#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import os
import subprocess

from onto.merge import OntoMerger
from tsdgenerator import generate_leaf_typing, get_typing_path, save_typing
from dataflow import get_operator_implementation, get_operator_implementation_path

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: check-types.py ../kb/csv 'Parse Colors'")
        exit(1)
    kb = sys.argv[1]
    operatorName = sys.argv[2]
    mergedOnto = OntoMerger(kb).onto
    typings = generate_leaf_typing(
        mergedOnto,
        operatorName
    )
    operatorImpl = get_operator_implementation(mergedOnto, operatorName, "JavaScript")
    operatorPath = get_operator_implementation_path(operatorImpl)
    typingPath = get_typing_path(operatorImpl)
    save_typing(typings, typingPath)
    subprocess.run([
        'npx',
        'tsc',
        operatorPath,
        typingPath,
        '--allowJs',
        '--checkJs',
        '--noEmit',
        '--strict',
        '--noImplicitAny',
        '--skipLibCheck',
        ],
        cwd=os.path.join(os.path.dirname(__file__), '..')
    )
