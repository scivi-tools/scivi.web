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
            var msg = JSON.parse(evt.data);
            if (msg["Gaze"]) {
                gaze = msg["Gaze"]
                CACHE["Gaze"] = [msg["Time"], gaze["uv"][0], gaze["uv"][1],
                                gaze["origin"][0], gaze["origin"][1], gaze["origin"][2],
                                gaze["direction"][0], gaze["direction"][1], gaze["direction"][2],
                                gaze["lpdmm"], gaze["rpdmm"], gaze["cf"],
                                gaze["AOI_index"], gaze["Action"]];
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
