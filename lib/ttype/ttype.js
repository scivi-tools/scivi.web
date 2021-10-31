if (IN_VISUALIZATION) {
    // if (DATA["webSocket"]) {
    //     if (DATA["quat"] !== undefined)
    //         OUTPUT["Orientation"] = DATA["quat"];
    //     if (DATA["finger"] !== undefined)
    //         OUTPUT["Finger"] = DATA["finger"];
    // } else {
    //     DATA["quat"] = [0, 0, 0, 1];
    //     DATA["webSocket"] = new WebSocket("ws://glove.local:81/");
    
    // }

    if (!CACHE["webSocket"]) {
        var memo = document.createElement("textarea");
        memo.style.width = (window.innerWidth - 30) + "px";
        memo.style.height = "30%";
        memo.style.marginTop = (0.7 * window.innerHeight) + "px";
        memo.style.fontSize = "20px";
        memo.style.marginLeft = "5px";
        memo.innerHTML = SETTINGS_VAL["Typed Text"];
        ADD_VISUAL(memo);

        CACHE["webSocket"] = new WebSocket("ws://192.168.0.104:81/");
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
            console.log(evt);
            var msg = JSON.parse(evt.data);
            if (msg["btn1"]) {
                memo.scrollTop += 15;
            }
            if (msg["btn2"]) {
                memo.scrollTop -= 15;
            }
        };
    }
} else {
    if (CACHE["webSocket"]) {
        CACHE["webSocket"].close();
        CACHE["webSocket"] = null;
    }
}
