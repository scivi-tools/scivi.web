#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from threading import Thread, Lock
import time


class SubThread:
    def __init__(self, runner, cancelCallback):
        self.runner = runner
        self.cancel = cancelCallback

class Execer(Thread):
    def __init__(self, onto, taskOnto):
        self.onto = onto
        self.taskOnto = taskOnto
        self.mutex = Lock()
        self.active = True
        self.keepGoing = True
        self.subThreads = []
        self.glob = {}
        Thread.__init__(self)

    def run(self):
        while self.is_active() and self.keepGoing:
            self.keepGoing = False
            self.turn()
            time.sleep(0)
        for st in self.subThreads:
            st.cancel()

    def is_active(self):
        self.mutex.acquire()
        result = self.active
        self.mutex.release()
        return result

    def stop(self):
        self.mutex.acquire()
        self.active = False
        self.mutex.release()

    def process(self):
        self.keepGoing = True

    def register_subthread(self, runner, cancelCallback):
        self.subThreads.append(SubThread(runner, cancelCallback))

    def get_belonging_instance(self, instNode, protoOfBelonging):
        belongingNodes = self.taskOnto.get_nodes_linked_from(instNode, "has")
        for bNode in belongingNodes:
            if self.taskOnto.first(self.taskOnto.get_nodes_linked_from(bNode, "is_instance")) == protoOfBelonging:
                return bNode
        return None

    def gen_inputs(self, instNode, protoNode):
        inputNodes = self.taskOnto.get_typed_nodes_linked_from(protoNode, "has", "Input")
        inputs = {}
        for inputNode in inputNodes:
            inputInst = self.get_belonging_instance(instNode, inputNode)
            outputInst = self.taskOnto.first(self.taskOnto.get_nodes_linked_to(inputInst, "is_used"))
            if outputInst and (outputInst["id"] in self.buffer):
                inputs[inputNode["name"]] = self.buffer[outputInst["id"]]
        return inputs

    def store_outputs(self, instNode, protoNode, outputs):
        outputNodes = self.taskOnto.get_typed_nodes_linked_from(protoNode, "has", "Output")
        for outputNode in outputNodes:
            if outputNode["name"] in outputs:
                outputInst = self.get_belonging_instance(instNode, outputNode)
                self.buffer[outputInst["id"]] = outputs[outputNode["name"]]

    def execute_code(self, workerNode, inputs, outputs, settings):
        context = { "INPUT": inputs, "OUTPUT": outputs, "SETTINGS_VAL": settings, \
                    "GLOB": self.glob, \
                    "PROCESS": self.process, "REGISTER_SUBTHREAD": self.register_subthread }
        if "inline" in workerNode["attributes"]:
            exec(workerNode["attributes"]["inline"], context)
        elif "path" in workerNode["attributes"]:
            exec(open(workerNode["attributes"]["path"]).read(), context)

    def execute_worker(self, instNode, protoNode):
        motherNode = self.onto.get_node_by_id(protoNode["attributes"]["mother"])
        workerNode = self.onto.first(self.onto.get_typed_nodes_linked_to(motherNode, "is_instance", "ServerSideWorker"))
        inputs = self.gen_inputs(instNode, protoNode)
        outputs = {}
        self.execute_code(workerNode, inputs, outputs, instNode["attributes"]["settingsVal"])
        self.store_outputs(instNode, protoNode, outputs)

    def execute_node(self, instNode):
        protoNode = self.taskOnto.first(self.taskOnto.get_nodes_linked_from(instNode, "is_instance"))
        if not (instNode["id"] in self.executed):
            self.execute_worker(instNode, protoNode)
            self.executed.add(instNode["id"])

    def turn(self):
        self.executed = set()
        self.buffer = {}
        for node in self.taskOnto.nodes():
            if self.taskOnto.first(self.taskOnto.get_nodes_linked_from(node, "is_hosted")):
                self.execute_node(node)
