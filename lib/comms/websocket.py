#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
from collections import deque
import websockets
import json


def make_messages():
    result = []
    tx = GLOB["DataWebSocket-TX"]
    n = max(map(lambda addr: len(tx[addr]), tx))
    for i in range(n):
        result.append({})
        for addr in tx:
            if len(tx[addr]) > i:
                result[i][addr] = tx[addr][i]
    return result

def ready_to_send():
    n = GLOB["DataWebSocketTXCount"]
    tx = GLOB["DataWebSocket-TX"]
    if len(tx) == n:
        for addr in tx:
            l = len(tx[addr])
            if (l == 0) or (l % n != 0):
                return False
        return True
    return False

def send_all():
    if ready_to_send():
        messages = make_messages()
        for message in messages:
            asyncio.get_event_loop().create_task(GLOB["DataWebSocket"].send(json.dumps(message)))
        GLOB["DataWebSocket-TX"] = {}

async def ws_handler(websocket):
    print(">Data WebSocket: Connection opened")
    GLOB["DataWebSocket"] = websocket
    # if we sent message before socket opened, we stack messages to queue and send it on connect completed
    send_all()
    try:
        async for message in websocket:
            d = json.loads(message)
            needProcess = False
            for addr in d:
                if d[addr] is not None:
                    if addr not in GLOB["DataWebSocket-RX"]:
                        GLOB["DataWebSocket-RX"][addr] = deque()
                    GLOB["DataWebSocket-RX"][addr].append(d[addr])
                    needProcess = True
            if needProcess:
                PROCESS()
    except websockets.exceptions.ConnectionClosedError:
        pass
    print("> DataWebSocket: Connection closed")

async def wait_for_connection():
    GLOB["DataWebServer"] = await websockets.serve(ws_handler, port = GLOB["DataServerPort"])

if MODE == "INITIALIZATION":
    if "DataWebSocketTXCount" not in GLOB:
        GLOB["DataWebSocketTXCount"] = 0
        GLOB["DataWebSocket-RX"] = {}
        GLOB["DataWebSocket-TX"] = {}
        asyncio.get_event_loop().create_task(wait_for_connection())
    if HAS_INPUT["TX"]:
        GLOB["DataWebSocketTXCount"] += 1

elif MODE == "RUNNING":
    addr = str(SETTINGS_VAL["Node Address"])

    if HAS_INPUT["TX"]:
        if addr not in GLOB["DataWebSocket-TX"]:
            GLOB["DataWebSocket-TX"][addr] = []
        GLOB["DataWebSocket-TX"][addr].append(INPUT.get("TX"))
        if "DataWebSocket" in GLOB:
            send_all()

    if (addr in GLOB["DataWebSocket-RX"]) and (len(GLOB["DataWebSocket-RX"][addr]) > 0):
        OUTPUT["RX"] = GLOB["DataWebSocket-RX"][addr].popleft()
        if len(GLOB["DataWebSocket-RX"][addr]) > 0:
            PROCESS()

if (MODE == "DESTRUCTION") and ("DataWebSocket" in GLOB) and ("DataWebServer" in GLOB):
    webserver = GLOB["DataWebServer"]
    webserver.close()
    del GLOB["DataWebSocket"]
    del GLOB["DataWebServer"]
    del GLOB["DataWebSocketTXCount"]
    del GLOB["DataWebSocket-RX"]
    del GLOB["DataWebSocket-TX"]
    print("> Data WebSocket: server at 5001 closed")
