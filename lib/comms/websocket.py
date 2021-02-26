#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import websockets
import json
from threading import Thread, Lock


async def ws(websocket, path):
    while True:
        data = GLOB["WebSocketThread"].get_message()
        if data:
            try:
                await websocket.send(data)
            except:
                break
        else:
            await asyncio.sleep(0)

class WSThread(Thread):
    def __init__(self):
        self.mutex = Lock()
        self.queue = []
        self.loop = None
        self.wsServer = None
        Thread.__init__(self)

    def run(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        wsServerWrapper = websockets.serve(ws, "127.0.0.1", 5001)
        self.wsServer = wsServerWrapper.ws_server
        asyncio.get_event_loop().run_until_complete(wsServerWrapper)
        asyncio.get_event_loop().run_forever()

    def stop_internal(self):
        self.wsServer.close()
        self.loop.stop()

    def stop(self):
        self.loop.call_soon_threadsafe(self.stop_internal)

    def put_message(self, msg):
        self.mutex.acquire()
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
    REGISTER_COROUTINE(wsThread, wsThread.stop)
    wsThread.start()

tx = INPUT["TX"]
if tx:
    wsThread.put_message({ SETTINGS_VAL["Node Address"]: tx })
