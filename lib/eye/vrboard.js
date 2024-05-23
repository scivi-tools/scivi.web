const DOT_TIMEOUT = 2000.0;// in milliseconds

function addCmdButton(name, id, command) {
    var btn = document.createElement("div");
    btn.innerHTML = name;
    btn.classList.add("scivi_button");
    btn.id = id;
    btn.addEventListener("click", (evt) => {
        let cmd_json = command(btn);
        if (CACHE["webSocket"] && cmd_json)
            CACHE["webSocket"].send(JSON.stringify(cmd_json));
    });
    return btn;
}

if (IN_VISUALIZATION) {
    //---------------- Draw text in browser ---------------
    if (!CACHE["container"]) {
        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "24px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        toolbar.appendChild(addCmdButton("Calibrate", "CalibrateBtn", (btn) => { return { calibrate: true }; }));
        //toolbar.appendChild(addCmdButton("Custom Caibrate", "CustomCalibrateBtn", (btn) => {return { customCalibrate: true };} ));
        toolbar.appendChild(addCmdButton("Next Experiment Phase", "NextExperimentPhaseBtn", (btn) => { return { nextExperimentStep: true }; }));
        toolbar.appendChild(addCmdButton("Reset experiment", "Reset", (btn) => {
            CACHE["newImageToSend"] = CACHE["CurrentImage"];
            CACHE["CurrentImage"] = null;
            CACHE["RestTimeBeforeSendImage"] = DOT_TIMEOUT;//set timer
            if (ws && CACHE["newImageToSend"])
                ws.send(JSON.stringify({ "NextImage": 0 }))
            return { resetExperimentStep: true };
        }));

        let SetWallNamePanel = document.createElement('div');

        let wallname_TextBox = document.createElement('input');
        wallname_TextBox.setAttribute('type', 'text');
        wallname_TextBox.id = "WallName";
        let wallname_Btn = addCmdButton("SetWallName", "SetWallNameBtn", (btn) => {
            let input = document.getElementById("WallName");
            let cmd = { Speech: input.value };
            input.value = "";
            return cmd;
        });
        SetWallNamePanel.appendChild(wallname_TextBox);
        SetWallNamePanel.appendChild(wallname_Btn);
        toolbar.appendChild(SetWallNamePanel);

        let f = document.createElement('div');
        f.id = "GazeCoords";
        toolbar.appendChild(f);

        container.appendChild(toolbar);

        ADD_VISUAL(container);

        CACHE["container"] = true;
        CACHE["LastTimestamp"] = Date.now();
    }

    //--------------- set outputs -----------------
    if (CACHE["Gaze"]) {
        if (CACHE["newImageToSend"]) {
            if (CACHE["RestTimeBeforeSendImage"] > 0.0) {
                console.log('process timer before send image');
                let timestamp = Date.now();
                let time_passed = timestamp - CACHE["LastTimestamp"];
                CACHE["LastTimestamp"] = timestamp;
                let x = CACHE["Gaze"][1] - 0.5;
                let y = CACHE["Gaze"][2] - 0.5;
                if (x * x + y * y <= 0.01)//is in dot
                    CACHE["RestTimeBeforeSendImage"] -= time_passed;
                else
                    CACHE["RestTimeBeforeSendImage"] = DOT_TIMEOUT;

                if (CACHE["RestTimeBeforeSendImage"] <= 0.0) {
                    CACHE["CurrentImage"] = CACHE["newImageToSend"];
                    OUTPUT["Gaze_PicName"] = CACHE["CurrentImage"].title;
                    OUTPUT["WallLog Meta"] = {
                        "Title": CACHE["CurrentImage"].title,
                        "Header": ["timestamp", "Action", "Wall", "AOI_index", "AOI_name"]
                    };
                    CACHE["webSocket"].send(JSON.stringify(CACHE["CurrentImage"]))
                    CACHE["newImageToSend"] = null;
                }
            }
        }
        if (CACHE["CurrentImage"])
            OUTPUT["Gaze"] = CACHE["Gaze"];
        document.getElementById("GazeCoords").innerText = `x: ${CACHE["Gaze"][1]} y: ${CACHE["Gaze"][2]}`;
        CACHE["Gaze"] = null;
    }
    if (CACHE["WAV"]) {
        OUTPUT["Voice"] = CACHE["WAV"];
        CACHE["WAV"] = null;
    }
    if (CACHE["ActionLog"]) {
        OUTPUT["Wall Log"] = CACHE["ActionLog"];
        CACHE["ActionLog"] = null;
    }



    //------------ got image, start timer to send it to UE4 -------------
    if (HAS_INPUT["Picture"] &&
        INPUT["Picture"] != null && !CACHE["newImageToSend"] &&
        (!CACHE["CurrentImage"] || CACHE["CurrentImage"].image !== INPUT["Picture"])) {
        CACHE["newImageToSend"] = {
            title: INPUT["Title"],
            image: INPUT["Picture"],
            scaleX: SETTINGS_VAL["Scale X"], scaleY: SETTINGS_VAL["Scale Y"],
            AOIs: INPUT["AOIs"]
        };
        var ws = CACHE["webSocket"]
        if (ws)
            ws.send(JSON.stringify({ "NextImage": 0 }))
        CACHE["RestTimeBeforeSendImage"] = DOT_TIMEOUT;//set timer
    }

    //------------ send speech to UE4 -------------------
    if (HAS_INPUT["Speech"] && INPUT["Speech"] && INPUT["Speech"].length > 0 && CACHE["webSocket"]) {
        var ws = CACHE["webSocket"]
        CACHE["LastSpeech"] = INPUT["Speech"]
        var msg = JSON.stringify({ "Speech": INPUT["Speech"] });
        ws.send(msg)
    }

    //-------------- create websocket --------------
    else if (!CACHE["WebSocketCreated"]) {
        var vrSrvIP = SETTINGS_VAL["VR Server IP"];
        if (vrSrvIP.indexOf(":") === -1)
            vrSrvIP += ":81";
        websocket = new WebSocket("ws://" + vrSrvIP + "/ue4");
        websocket.onopen = (evt) => {
            console.log("UE4 WebSocket open");
            CACHE["webSocket"] = websocket;
            PROCESS();
        };

        websocket.onclose = (evt) => {
            console.log("UE4 WebSocket close");
            alert("UE4 отключился от SciVi");
            CACHE["webSocket"] = null;
            CACHE["WebSocketCreated"] = false;
        };
        websocket.onerror = (evt) => {
            console.log(evt);
            alert("Не удалось подключиться к серверу. Более подробно написано в консоли браузера");
            CACHE["webSocket"] = null;
            CACHE["WebSocketCreated"] = false;
        };
        websocket.onmessage = (evt) => {
            if (evt.data) {
                try {
                    var msg = JSON.parse(evt.data);
                }
                catch (err) {
                    console.log(err, evt.data);
                }
                var need_process = false;
                if (msg["WAV"]) {
                    CACHE["WAV"] = msg["WAV"];
                    need_process = true;
                }
                if (msg["Gaze"]) {
                    gaze = msg["Gaze"];
                    CACHE["Gaze"] = [msg["Time"], gaze["uv"][0], gaze["uv"][1],
                    gaze["origin"][0], gaze["origin"][1], gaze["origin"][2],
                    gaze["target"][0], gaze["target"][1], gaze["target"][2],
                    gaze["lpdmm"], gaze["rpdmm"], gaze["cf"],
                    gaze["AOI_index"], gaze["Action"]];
                    need_process = true;
                }
                else {
                    var log_keys = Object.keys(msg);
                    if (log_keys.length > 2 || log_keys[0] != "Time") {
                        console.log("Incorrect format for ActionLog. There must be 2 keys: timestamp and action", msg);
                    }
                    var action = msg[log_keys[1]];
                    var action_string = '';
                    for (let i = 1; i < log_keys.length; ++i)
                        action_string += log_keys[i] + ';' + msg[log_keys[i]] + ';';
                    action_string = action_string.slice(0, -1); // remove last ;
                    CACHE["ActionLog"] = [msg["Time"], action_string];
                    console.log("New action", action_string);
                    need_process = true;
                }

                if (need_process)
                    PROCESS();
            }
        };
        CACHE["WebSocketCreated"] = true;
    }
}
else {
    CACHE["CurrentImage"] = undefined;
    CACHE["newImageToSend"] = undefined;
    CACHE["container"] = undefined;
    if (CACHE["webSocket"]) {
        CACHE["webSocket"].close();
        CACHE["webSocket"] = undefined;
        CACHE["WebSocketCreated"] = undefined;
        CACHE["Gaze"] = undefined;
    }
}
