#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import enum
import json
import sys
import traceback
from threading import Thread, Lock
from typing import Any, Callable

from onto.onto import Node, Onto, first

SendMessageFunc =  Callable[[str], None]

class ExecutionMode(enum.Enum):
    INITIALIZATION = 1
    RUNNING = 2
    DESTRUCTION = 3

class OperatorError(Exception):
    def __init__(self, name: str, path: str, line: int, message: str):
        self.name = name
        self.path = path
        self.line = line
        self.message = message

    def __str__(self):
        return "SciVi operator <%s> error in file <%s> line %d:\n%s" % (self.name, self.path, self.line, self.message)

class Execer(Thread):
    def __init__(self, onto: Onto, taskOnto: Onto, nodeStates: dict[int, dict[str, Any]],
                 send_message_func: SendMessageFunc, eventLoop: asyncio.AbstractEventLoop, dataServerPort: int = 0):
        self.onto = onto
        self.taskOnto = taskOnto
        self.processScheduled = False
        self.processMutex = Lock()
        self.isRunning = True
        self.glob = {}
        self.cache = {}
        self.nodeStates = nodeStates
        self.commandServerLoop = eventLoop
        self.processLoop = asyncio.new_event_loop()
        self.push_message_to_send = send_message_func
        self.glob["DataServerPort"] = dataServerPort # pass port to data websocket
        self.publishedFiles = []
        asyncio.set_event_loop(self.processLoop)
        Thread.__init__(self)

    def run(self):
        Thread.run(self)
        try:
            self.processLoop.run_forever()
        finally:
            self.processLoop.close()
            print('execer stopped')

    def stop(self):
        print('execer stopping')
        with self.processMutex:
           self.isRunning = False
        self.processLoop.call_soon_threadsafe(self.turn, ExecutionMode.DESTRUCTION)
        self.processLoop.call_soon_threadsafe(self.processLoop.stop)

    def process(self):
        isRunning = False
        with self.processMutex:
            isRunning = self.isRunning
        if isRunning:
            if not self.processScheduled:
                self.processLoop.call_soon_threadsafe(self.turn, ExecutionMode.RUNNING)
            self.processScheduled = True

    def publish_file(self, path):
        self.publishedFiles.append(path)

    def get_belonging_instance(self, instNode: Node, protoOfBelonging: Node):
        belongingNodes = self.taskOnto.get_nodes_linked_from(instNode, "has")
        for bNode in belongingNodes:
            if first(self.taskOnto.get_nodes_linked_from(bNode, "is_instance")) == protoOfBelonging:
                return bNode
        return None

    def gen_inputs(self, instNode: Node, protoNode: Node):
        inputNodes = self.taskOnto.get_typed_nodes_linked_from(protoNode, "has", "Input")
        inputs = {}
        hasInputs = {}
        for inputNode in inputNodes:
            inputInst = self.get_belonging_instance(instNode, inputNode)
            outputInst = first(self.taskOnto.get_nodes_linked_to(inputInst, "is_used"))
            hasInputs[inputNode.name] = outputInst is not None
            if outputInst and (outputInst.id in self.buffer):
                inputs[inputNode.name] = self.buffer[outputInst.id]
        return inputs, hasInputs

    def store_outputs(self, instNode: Node, protoNode: Node, outputs):
        outputNodes = self.taskOnto.get_typed_nodes_linked_from(protoNode, "has", "Output")
        for outputNode in outputNodes:
            if outputNode.name in outputs:
                outputInst = self.get_belonging_instance(instNode, outputNode)
                self.buffer[outputInst.id] = outputs[outputNode.name]

    def guarded_exec(self, name: str, path: str, code: str, context: dict):
        try:
            exec(code, context)
        except Exception as e:
            cl, exc, tb = sys.exc_info()
            raise OperatorError(name, path, traceback.extract_tb(tb)[-1][1], cl.__name__ + ": " + str(e))

    def execute_code(self, workerNode: Node, mode: ExecutionMode, inputs: dict, hasInputs: dict, outputs: dict,
                     settings, settingsVal, cache, node_state: dict):
        context = { "INPUT": inputs, "HAS_INPUT": hasInputs, "OUTPUT": outputs, \
                    "SETTINGS": settings, "SETTINGS_VAL": settingsVal, \
                    "CACHE": cache, "GLOB": self.glob, "STATE": node_state,\
                    "MODE": mode.name, "PROCESS": self.process, "PUBLISH_FILE": self.publish_file }
        if "inline" in workerNode.attributes:
            self.guarded_exec(workerNode.name, "inline", workerNode.attributes["inline"], context)
        elif "path" in workerNode.attributes:
            p = workerNode.attributes["path"]
            context["__name__"] = p.replace("/", ".").strip(".py")
            with open(p, encoding="utf-8") as f:
                self.guarded_exec(workerNode.name, p, f.read(), context)
        else:
            print("Error: Can't execute node. 'path' not in workerNode.attributes");

    def execute_worker(self, instNode: Node, protoNode: Node, mode: ExecutionMode):
        motherNode = self.onto.get_node_by_id(protoNode.attributes["mother"])
        workerNode = first(self.onto.get_typed_nodes_linked_to(motherNode, "is_instance", "ServerSideWorker"))
        inputs, hasInputs = self.gen_inputs(instNode, protoNode)
        outputs = {}
        if not instNode.id in self.cache:
            self.cache[instNode.id] = {}
        if not instNode.id in self.nodeStates:
            self.nodeStates[instNode.id] = {}
        self.execute_code(workerNode, mode, inputs, hasInputs, outputs,
                          instNode.attributes.get("settings"), instNode.attributes.get("settingsVal"),
                          self.cache[instNode.id], self.nodeStates[instNode.id])
        self.store_outputs(instNode, protoNode, outputs)

    def execute_node(self, instNode: Node, mode: ExecutionMode):
        protoNode = first(self.taskOnto.get_nodes_linked_from(instNode, "is_instance"))
        self.execute_worker(instNode, protoNode, mode)
        
    def turn(self, mode: ExecutionMode):
        self.buffer = {}
        self.processScheduled = False
        executed = set()
        nodes_to_execute = []
        for node in self.taskOnto.nodes:
            if len(self.taskOnto.get_nodes_linked_from(node, "is_hosted")) > 0:
                    nodes_to_execute.append(node)

        nodes_to_execute_count = len(nodes_to_execute)
        for node in self.taskOnto.nodes:
            if len(self.taskOnto.get_nodes_linked_from(node, "is_hosted")) > 0:
                self.execute_node(node, mode)
                executed.add(node.id)
                if mode == ExecutionMode.INITIALIZATION:
                    command = {"command": "wait_for_initialization",
                                    "progress": len(executed) / nodes_to_execute_count}
                    self.push_message_to_send(json.dumps(command))
                elif mode == ExecutionMode.DESTRUCTION:
                    command = {"command": "wait_for_destruction",
                                    "progress": len(executed) / nodes_to_execute_count}
                    self.push_message_to_send(json.dumps(command))
