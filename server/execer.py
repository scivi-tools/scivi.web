#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import enum
import json
from threading import Thread
from typing import Callable

from onto.onto import Node, Onto, first

SendMessageFunc =  Callable[[str], None]

class ExecutionMode(enum.Enum):
    INITIALIZATION = 1
    RUNNING = 2
    DESTRUCTION = 3


class Execer(Thread):
    def __init__(self, onto: Onto, taskOnto: Onto, node_states: dict[int, dict],
                    send_message_func: SendMessageFunc, event_loop: asyncio.AbstractEventLoop, data_server_port: int = 0):
        self.onto = onto
        self.taskOnto = taskOnto
        self.process_scheduled = False
        self.glob = {}
        self.cache = {}
        self.node_states = node_states
        self.__cmd_server_loop__ = event_loop
        self.process_loop = asyncio.new_event_loop()
        self.push_message_to_send = send_message_func
        self.glob["DataServerPort"] = data_server_port # pass port to data websocket
        asyncio.set_event_loop(self.process_loop)
        Thread.__init__(self)

    def run(self):
        Thread.run(self)
        try:
            self.process_loop.run_forever()
        finally:
            self.process_loop.close()
            print('execer stopped')

    def stop(self):
        print('execer stopping')
        self.turn(ExecutionMode.DESTRUCTION)
        self.process_loop.call_soon_threadsafe(self.process_loop.stop)

    def process(self):
        if not self.process_scheduled: 
            self.process_loop.call_soon_threadsafe(self.turn, ExecutionMode.RUNNING)
        self.process_scheduled = True

    def get_belonging_instance(self, instNode: Node, protoOfBelonging: Node):
        belongingNodes = self.taskOnto.get_nodes_linked_from(instNode, "has")
        for bNode in belongingNodes:
            if first(self.taskOnto.get_nodes_linked_from(bNode, "is_instance")) == protoOfBelonging:
                return bNode
        return None

    def gen_inputs(self, instNode: Node, protoNode: Node):
        inputNodes = self.taskOnto.get_typed_nodes_linked_from(protoNode, "has", "Input")
        inputs = {}
        for inputNode in inputNodes:
            inputInst = self.get_belonging_instance(instNode, inputNode)
            outputInst = first(self.taskOnto.get_nodes_linked_to(inputInst, "is_used"))
            if outputInst and (outputInst.id in self.buffer):
                inputs[inputNode.name] = self.buffer[outputInst.id]
        return inputs

    def store_outputs(self, instNode: Node, protoNode: Node, outputs):
        outputNodes = self.taskOnto.get_typed_nodes_linked_from(protoNode, "has", "Output")
        for outputNode in outputNodes:
            if outputNode.name in outputs:
                outputInst = self.get_belonging_instance(instNode, outputNode)
                self.buffer[outputInst.id] = outputs[outputNode.name]

    def execute_code(self, workerNode: Node, mode: ExecutionMode, inputs: dict, outputs: dict, settings, cache, node_state: dict):
        context = { "INPUT": inputs, "OUTPUT": outputs, "SETTINGS_VAL": settings, \
                    "CACHE": cache, "GLOB": self.glob, "STATE": node_state,\
                    "MODE": mode.name, "PROCESS": self.process }
        if "inline" in workerNode.attributes:
            exec(workerNode.attributes["inline"], context)
        elif "path" in workerNode.attributes:
            p = workerNode.attributes["path"]
            context["__name__"] = p.replace("/", ".").strip(".py")
            with open(p, encoding="utf-8") as f:
                #print('exec', p)
                exec(f.read(), context)
        else:
            print("Error: Can't execute node. 'path' not in workerNode.attributes");

    def execute_worker(self, instNode: Node, protoNode: Node, mode: ExecutionMode):
        motherNode = self.onto.get_node_by_id(protoNode.attributes["mother"])
        workerNode = first(self.onto.get_typed_nodes_linked_to(motherNode, "is_instance", "ServerSideWorker"))
        inputs = self.gen_inputs(instNode, protoNode)
        outputs = {}
        if not instNode.id in self.cache:
            self.cache[instNode.id] = {}
        #print('execute', workerNode.name, workerNode.id)
        self.execute_code(workerNode, mode, inputs, outputs, instNode.attributes["settingsVal"], 
        self.cache[instNode.id], self.node_states[instNode.id])
        self.store_outputs(instNode, protoNode, outputs)

    def execute_node(self, instNode: Node, mode: ExecutionMode):
        protoNode = first(self.taskOnto.get_nodes_linked_from(instNode, "is_instance"))
        self.execute_worker(instNode, protoNode, mode)
        
    def turn(self, mode: ExecutionMode):
        self.buffer = {}
        self.process_scheduled = False
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