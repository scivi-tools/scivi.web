#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
from collections import deque
import websockets
import json
    
async def ws_handler(websocket):
    print("> WebSocket server started")
    GLOB["DataWebSocket"] = websocket
    try:
        async for message in websocket:
            d = json.loads(message)
            need_process = False
            for addr in d:
                if not d[addr] is None:
                    CACHE['RX'].append(d[addr])
                    need_process = True
            if need_process:
                PROCESS()
    except websockets.exceptions.ConnectionClosedError:
        pass
    print("> WebSocket server stopped")

async def wait_for_connection():
    GLOB["DataWebServer"] = await websockets.serve(ws_handler, "localhost", 5001)

if MODE == "INITIALIZATION":
    CACHE["RX"] = deque()
    if "DataWebSocketStarted" not in GLOB:
        GLOB["DataWebSocketStarted"] = True
        asyncio.get_event_loop().create_task(wait_for_connection())

elif MODE == "RUNNING" and "DataWebSocket" in GLOB:
    websocket = GLOB["DataWebSocket"]
    tx = INPUT.get("TX")
    addr = SETTINGS_VAL["Node Address"]
    if tx is not None:
        asyncio.get_event_loop().create_task(websocket.send(json.dumps({addr: tx})))
    if len(CACHE["RX"]) > 0:
        OUTPUT["RX"] = CACHE["RX"].popleft()
if MODE == "DESTRUCTION" and "DataWebSocket" in GLOB:
    if "DataWebServer" in GLOB:
        print('destroy data server')
        webserver = GLOB["DataWebServer"]
        webserver.close()
        del GLOB["DataWebSocket"]
        del GLOB["DataWebServer"]
        GLOB.pop("DataWebSocketStarted")
    
