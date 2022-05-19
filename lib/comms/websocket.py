#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import websockets
import json
from threading import Thread, Lock


class WSThread(Thread):
    def __init__(self):
        self.mutex = Lock()
        self.queueIn = []
        self.queueOut = []
        self.loop = None
        self.stopper = None
        self.wsRunning = False
        Thread.__init__(self)

    async def ws(self, websocket, path):
        print("> WebSocket server started")
        self.set_ws_running(True)
        while True:
            wst = GLOB["WebSocketThread"]
            data = wst.get_message_in()
            if data:
                try:
                    await websocket.send(data)
                except:
                    print("> WebSocket closed")
                    break
            else:
                try:
                    msg = await asyncio.wait_for(websocket.recv(), timeout = 0.01)
                    wst.put_message_out(json.loads(msg))
                    PROCESS()
                except asyncio.TimeoutError:
                    pass
        self.set_ws_running(False)
        print("> WebSocket server stopped")

    async def ws_run(self, stop):
        async with websockets.serve(self.ws, "0.0.0.0", 5001):
            await stop

    def run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.stopper = self.loop.create_future()
        self.loop.run_until_complete(self.ws_run(self.stopper))

    def stop_internal(self):
        self.stopper.set_result(None)

    def stop(self):
        self.loop.call_soon_threadsafe(self.stop_internal)
        self.join()

    def set_ws_running(self, running):
        self.mutex.acquire()
        self.wsRunning = running
        self.mutex.release()

    def put_message_in(self, msg):
        self.mutex.acquire()
        if self.wsRunning:
            self.queueIn.append(msg)
        self.mutex.release()

    def get_message_in(self):
        self.mutex.acquire()
        if len(self.queueIn) > 0:
            result = json.dumps(self.queueIn)
            self.queueIn = []
        else:
            result = None
        self.mutex.release()
        return result

    def put_message_out(self, msg):
        self.mutex.acquire()
        self.queueOut.append(msg)
        self.mutex.release()

    def get_message_out(self, addr):
        self.mutex.acquire()
        result = None
        if self.wsRunning:
            for msg in self.queueOut:
                if addr in msg:
                    result = msg[addr]
                    self.queueOut.remove(msg)
                    break
        self.mutex.release()
        return result

if "WebSocketThread" in GLOB:
    wsThread = GLOB["WebSocketThread"]
else:
    wsThread = WSThread()
    GLOB["WebSocketThread"] = wsThread
    REGISTER_SUBTHREAD(wsThread, wsThread.stop)
    wsThread.start()

tx = INPUT.get("TX")
addr = SETTINGS_VAL["Node Address"]
if tx is not None:
    wsThread.put_message_in({ addr: tx })
OUTPUT["RX"] = wsThread.get_message_out(str(addr))
