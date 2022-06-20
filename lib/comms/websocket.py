#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
from collections import deque
import websockets
import json
    
async def ws_handler(websocket):
    print(">Data WebSocket: Connection opened")
    GLOB["DataWebSocket"] = websocket
     #clear queue for send
    addr = SETTINGS_VAL["Node Address"]
    # if we send message before socket opened, we stack messages to queue and send it on connect completed
    while len(CACHE["TX"]) > 0:
        tx = CACHE["TX"].popleft()
        print('sent', tx)
        asyncio.get_event_loop().create_task(websocket.send(json.dumps({addr: tx})))
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
    print("> DataWebSocket: Connection closed")

async def wait_for_connection():
    GLOB["DataWebServer"] = await websockets.serve(ws_handler, "localhost", 5001)

if MODE == "INITIALIZATION":
    CACHE["RX"] = deque()
    CACHE["TX"] = deque()
    if "DataWebSocketStarted" not in GLOB:
        GLOB["DataWebSocketStarted"] = True
        asyncio.get_event_loop().create_task(wait_for_connection())

elif MODE == "RUNNING":
    tx = INPUT.get("TX")

    if tx is not None:
        if "DataWebSocket" in GLOB:
            print('sent', tx)
            websocket = GLOB["DataWebSocket"]
            addr = SETTINGS_VAL["Node Address"]
            asyncio.get_event_loop().create_task(websocket.send(json.dumps({addr: tx})))
        else:
            CACHE["TX"].append(tx)

    if len(CACHE["RX"]) > 0:
        OUTPUT["RX"] = CACHE["RX"].popleft()
        if len(CACHE["RX"]) > 0:
            PROCESS()

if MODE == "DESTRUCTION" and "DataWebSocket" in GLOB:
    if "DataWebServer" in GLOB:
        webserver = GLOB["DataWebServer"]
        webserver.close()
        del GLOB["DataWebSocket"]
        del GLOB["DataWebServer"]
        GLOB.pop("DataWebSocketStarted")
        print('> Data WebSocket: server at 5001 closed')
    
