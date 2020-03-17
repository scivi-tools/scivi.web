if (DATA["webSocket"]) {
    if (DATA["payload"] !== undefined) {
        OUTPUT["PhotoRes1"] = DATA["payload"]["adc"][0];
        OUTPUT["PhotoRes2"] = DATA["payload"]["adc"][1];
        OUTPUT["PhotoRes3"] = DATA["payload"]["adc"][2];
        OUTPUT["Pot"] = DATA["payload"]["adc"][3];
        OUTPUT["Orientation"] = DATA["payload"]["quat"];
        OUTPUT["Button"] = DATA["payload"]["btn"];
    }
} else {
    // DATA["payload"] = { "adc": [0, 0, 0, 0], "quat": [0, 0, 0, 1], "btn": false };
    DATA["webSocket"] = new WebSocket("ws://192.168.4.1:81/");
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
        DATA["payload"] = JSON.parse(evt.data);
        PROCESS();
    };
}
