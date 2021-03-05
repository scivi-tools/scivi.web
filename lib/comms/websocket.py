#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import websockets
import json
from threading import Thread, Lock


class WSThread(Thread):
    def __init__(self):
        self.mutex = Lock()
        self.queue = []
        self.loop = None
        self.stopper = None
        self.wsRunning = False
        Thread.__init__(self)

    async def ws(self, websocket, path):
        print("> WebSocket server started")
        self.set_ws_running(True)
        while True:
            data = GLOB["WebSocketThread"].get_message()
            if data:
                try:
                    await websocket.send(data)
                except:
                    print("> WebSocket closed")
                    break
            else:
                await asyncio.sleep(0)
        self.set_ws_running(False)
        print("> WebSocket server stopped")

    async def ws_run(self, stop):
        async with websockets.serve(self.ws, "127.0.0.1", 5001):
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

    def put_message(self, msg):
        self.mutex.acquire()
        if self.wsRunning:
            self.queue.append(msg)
        self.mutex.release()

    def get_message(self):
        self.mutex.acquire()
        if len(self.queue) > 0:
            result = json.dumps(self.queue)
            self.queue = []
        else:
            result = None
        self.mutex.release()
        return result


if "WebSocketThread" in GLOB:
    wsThread = GLOB["WebSocketThread"]
else:
    wsThread = WSThread()
    GLOB["WebSocketThread"] = wsThread
    REGISTER_SUBTHREAD(wsThread, wsThread.stop)
    wsThread.start()

tx = INPUT["TX"]
if tx:
    # TODO: do not append to queue if ws is dead
    wsThread.put_message({ SETTINGS_VAL["Node Address"]: tx })
