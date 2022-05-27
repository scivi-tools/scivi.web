function parseFloatSafe(val)
{
    var result = parseFloat(val);
    return isNaN(result) ? val : result;
}

function addCmdButton(name, command)
{
    var btn = document.createElement("div");
    btn.innerHTML = name;
    btn.classList.add("scivi_button");
    btn.addEventListener("click", function (e) {
        var vrSrvIP = SETTINGS_VAL["VR Server IP"];
        if (vrSrvIP.indexOf(":") === -1)
            vrSrvIP += ":81";
        var ws = new WebSocket("ws://" + vrSrvIP + "/ue4");
        ws.onopen = function (evt) {
            ws.send(JSON.stringify(command(btn)));
            ws.close();
        }
    });
    return btn;
}

if (IN_VISUALIZATION) 
{
    //---------------- Draw text in browser ---------------
    if (!CACHE["container"]) 
    {
        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "24px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        CACHE["controller"] = false;

        toolbar.appendChild(addCmdButton("Calibrate", function (btn) { return { calibrate: true }; }));
        toolbar.appendChild(addCmdButton("Custom Caibrate", function (btn) { return { customCalibrate: true }; }));
        toolbar.appendChild(addCmdButton("Show Controller", function (btn) {
            btn.classList.toggle("pushed");
            var ctrl = !CACHE["controller"];
            CACHE["controller"] = ctrl;
            btn.innerHTML = ctrl ? "Hide Controller" : "Show Controller";
            return { setMotionControllerVisibility: ctrl };
        }));

        container.appendChild(toolbar);

        ADD_VISUAL(container);

        CACHE["container"] = true;
    }

    //--------------- set outputs -----------------
    if (CACHE["Gaze"])
    {
        OUTPUT["Gaze"] = CACHE["Gaze"];
        CACHE["Gaze"] = null;
    }
    if (CACHE["WAV"])
    {
        OUTPUT["Voice"] = CACHE["WAV"]
        console.log('set output', OUTPUT["Voice"]);
        CACHE["WAV"] = null;
    }
        
    
    if (CACHE["webSocket"]) 
    {
        console.log('web socket created')
        //------------ send image to UE4 -------------
        if (HAS_INPUT["Picture"] && 
            INPUT["Picture"] !== null && 
            CACHE["img"] !== INPUT["Picture"]) 
        {
            CACHE["img"] = INPUT["Picture"];
            CACHE["AOIs"] = INPUT["AOIs"];
            var ws = CACHE["webSocket"]
            let msg = JSON.stringify({ image: CACHE["img"], 
                                            scaleX: SETTINGS_VAL["Scale X"], scaleY: SETTINGS_VAL["Scale Y"], 
                                            AOIs: CACHE["AOIs"] });
            ws.send(msg);
        }

        //------------ send speech to UE4 -------------------
        if (HAS_INPUT["Speech"])
        {
            var ws = CACHE["webSocket"]
            var msg = JSON.stringify({Speech: INPUT["Speech"]});
            ws.send(msg)
        }
    } 
    //-------------- create websocket --------------
    else 
    {
        var vrSrvIP = SETTINGS_VAL["VR Server IP"];
        if (vrSrvIP.indexOf(":") === -1)
            vrSrvIP += ":81";
        CACHE["webSocket"] = new WebSocket("ws://" + vrSrvIP + "/ue4");
        CACHE["webSocket"].onopen = function(evt) {
            console.log("WebSocket open");
            PROCESS();
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
            if (evt.data) 
            {
                var msg = JSON.parse(evt.data);
                var need_process = false;
                if (msg["WAV"])
                {
                    CACHE["WAV"] = msg["WAV"];
                    need_process = true;
                    console.log('received wav')
                }
                if (msg["Gaze"])
                {
                    CACHE["Gaze"] = msg["Gaze"];
                    need_process = true;
                }
                    
                if (need_process)
                    PROCESS();
            }
        };
    }
} 
else 
{
    CACHE["img"] = null;
    CACHE["container"] = null;
    CACHE["controller"] = false;
    if (CACHE["webSocket"]) {
        CACHE["webSocket"].close();
        CACHE["webSocket"] = null;
        CACHE["Gaze"] = null;
    }
}
