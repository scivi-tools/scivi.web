#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import websockets


async def ws(websocket, path):
    while True:
        data = await GLOB["WebSocketQueue"].get()
        try:
            await websocket.send(data)
        except:
            break


if "WebSocketQueue" in GLOB:
    wsQueue = GLOB["WebSocketQueue"]
else:
    wsQueue = asyncio.Queue()
    GLOB["WebSocketQueue"] = wsQueue
    wsServer = websockets.serve(time, "127.0.0.1", 5001)
    REGISTER_CORUTINE(wsServer, wsServer.close)
    asyncio.get_event_loop().run_until_complete(wsServer)
    asyncio.get_event_loop().run_forever()

tx = INPUT["TX"]
if tx:
    wsQueue.put(tx)
