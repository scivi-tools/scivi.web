if (IN_VISUALIZATION) {
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
                CACHE["Gaze"] = msg.map(parseFloat);
                PROCESS();
            }
        };
    }
} else {
    if (CACHE["webSocket"]) {
        CACHE["webSocket"].close();
        CACHE["webSocket"] = null;
        CACHE["Gaze"] = null;
    }
}
