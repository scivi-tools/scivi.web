function parseFloatSafe(val)
{
    var result = parseFloat(val);
    return isNaN(result) ? val : result;
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["Picture"] && !CACHE["img"]) {
        CACHE["img"] = INPUT["Picture"];
        CACHE["AOIs"] = INPUT["AOIs"];
        var vrSrvIP = SETTINGS_VAL["VR Server IP"];
        if (vrSrvIP.indexOf(":") === -1)
            vrSrvIP += ":81";
        var ws = new WebSocket("ws://" + vrSrvIP + "/ue4");
        ws.onopen = function (evt) {
            ws.send(JSON.stringify({ image: CACHE["img"], scaleX: SETTINGS_VAL["Scale X"], scaleY: SETTINGS_VAL["Scale Y"], AOIs: CACHE["AOIs"] }));
            var interval = setInterval(function () {
                console.log(ws.bufferedAmount);
                if (ws.bufferedAmount == 0) {
                    clearInterval(interval);
                    ws.close();
                }
            }, 100);
        }
    }

    if (CACHE["webSocket"]) {
        if (CACHE["Gaze"])
            OUTPUT["Gaze"] = CACHE["Gaze"];
    } else {
        var vrSrvIP = SETTINGS_VAL["VR Server IP"];
        if (vrSrvIP.indexOf(":") === -1)
            vrSrvIP += ":81";
        CACHE["webSocket"] = new WebSocket("ws://" + vrSrvIP + "/ue4");
        CACHE["webSocket"].onopen = function(evt) {
            console.log("WebSocket open");
        };
        CACHE["webSocket"].onclose = function(evt) {
            console.log("WebSocket close");
            CACHE["webSocket"] = null;
        };
        CACHE["webSocket"].onerror = function(evt) {
            console.log(evt);
            CACHE["webSocket"] = null;
        };
        CACHE["webSocket"].onmessage = function(evt) {
            var msg = evt.data.split(" ");
            if (msg) {
                CACHE["Gaze"] = msg.map(parseFloatSafe);
                PROCESS();
            }
        };
    }
} else {
    CACHE["img"] = null;
    if (CACHE["webSocket"]) {
        CACHE["webSocket"].close();
        CACHE["webSocket"] = null;
        CACHE["Gaze"] = null;
    }
}
