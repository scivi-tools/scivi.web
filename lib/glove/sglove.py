#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import websockets
import json
from threading import Thread, Lock

class GloveThread(Thread):
    def __init__(self):
        self.mutex = Lock()
        self.loop = None
        self.wsRunning = False
        Thread.__init__(self)

    async def ws(self):
        uri = "ws://192.168.4.1:81"
        self.set_ws_running(True)
        async with websockets.connect(uri, ping_interval = None) as websocket:
            print("> WebSocket opened")
            while self.get_ws_running():
                try:
                    msg = await websocket.recv()
                except:
                    break
                await asyncio.sleep(0)
        self.set_ws_running(False)
        print("> WebSocket closed")

    async def ws_run(self):
        await self.ws()

    def run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self.ws_run())

    def stop(self):
        self.set_ws_running(False)
        self.join()

    def set_ws_running(self, running):
        self.mutex.acquire()
        self.wsRunning = running
        self.mutex.release()

    def get_ws_running(self):
        self.mutex.acquire()
        result = self.wsRunning
        self.mutex.release()
        return result

    def get_orientation(self):
        return 0

    def get_finger(self):
        return 0


if "GloveThread" in GLOB:
    gloveThread = GLOB["GloveThread"]
else:
    gloveThread = GloveThread()
    GLOB["GloveThread"] = gloveThread
    REGISTER_SUBTHREAD(gloveThread, gloveThread.stop)
    gloveThread.start()

OUTPUT["Orientation"] = gloveThread.get_orientation()
OUTPUT["Finger"] = gloveThread.get_finger()
PROCESS()
