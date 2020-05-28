if (DATA["webSocket"]) {
    if (DATA["quat"] !== undefined)
        OUTPUT["Orientation"] = DATA["quat"];
    if (DATA["finger"] !== undefined)
        OUTPUT["Finger"] = DATA["finger"];
} else {
    DATA["quat"] = [0, 0, 0, 1];
    DATA["webSocket"] = new WebSocket("ws://glove.local:81/");
    DATA["webSocket"].onopen = function(evt) {
        console.log("WebSocket open");
    };
    DATA["webSocket"].onclose = function(evt) {
        console.log("WebSocket close");
        DATA["webSocket"] = null;
    };
    DATA["webSocket"].onerror = function(evt) {
        console.log(evt);
        DATA["webSocket"] = null;
    };
    DATA["webSocket"].onmessage = function(evt) {
        // console.log(evt);
        var msg = JSON.parse(evt.data);
        if (msg["b"])
            DATA["calibrated"] = true;
        if (DATA["calibrated"]) {
            var q = [msg["q"][0], msg["q"][1], msg["q"][2], msg["q"][3]];
            var l = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
            q[0] /= l;
            q[1] /= l;
            q[2] /= l;
            q[3] /= l;
            DATA["quat"] = q;
            DATA["finger"] = msg["f"];
            PROCESS();
        }
    };
}
