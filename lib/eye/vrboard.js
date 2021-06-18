if (HAS_INPUT["Picture"] && DATA["img"] !== INPUT["Picture"]) {
    DATA["img"] = INPUT["Picture"];
}

if (IN_VISUALIZATION) {
    if (DATA["img"] && !CACHE["img"]) {
        CACHE["img"] = true;
        var vrSrvIP = SETTINGS_VAL["VR Server IP"];
        if (vrSrvIP.indexOf(":") === -1)
            vrSrvIP += ":81";
        var ws = new WebSocket("ws://" + vrSrvIP + "/ue4");
        ws.onopen = function (evt) {
            console.log("send");
            ws.send(DATA["img"]);
            var interval = setInterval(function () {
                console.log(ws.bufferedAmount);
                if (ws.bufferedAmount == 0) {
                    clearInterval(interval);
                    ws.close();
                }
            }, 100);
        }
    }
} else {
    CACHE["img"] = false;
}
