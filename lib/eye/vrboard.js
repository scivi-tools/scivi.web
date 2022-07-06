function parseFloatSafe(val)
{
    var result = parseFloat(val);
    return isNaN(result) ? val : result;
}

function addCmdButton(name, id, command)
{
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

        toolbar.appendChild(addCmdButton("Calibrate", "CalibrateBtn", (btn) => {return { calibrate: true };} ));
        //toolbar.appendChild(addCmdButton("Custom Caibrate", "CustomCalibrateBtn", (btn) => {return { customCalibrate: true };} ));
        toolbar.appendChild(addCmdButton("Next Experiment Phase", "NextExperimentPhaseBtn", (btn) => 
        {
            let index = ++CACHE["current_phase_index"];
            if (index < CACHE["experiment_phases"].length)
                return {setExperimentStep: CACHE["experiment_phases"][index]};
            else return null;//nothing will send
        }));
        toolbar.appendChild(addCmdButton("To initial phase", "ToInitialPhaseBtn", (btn) => 
        {
            CACHE["current_phase_index"] = 0;
            return {setExperimentStep: CACHE["experiment_phases"][0]};
        }));

        let SetWallNamePanel = document.createElement('div');

        let wallname_TextBox = document.createElement('input');
        wallname_TextBox.setAttribute('type', 'text');
        wallname_TextBox.id = "WallName";
        let wallname_Btn = addCmdButton("SetWallName", "SetWallNameBtn", (btn) => {
            let input = document.getElementById("WallName");
            let cmd = {Speech: input.value};
            input.value = "";
            return cmd;
        });
        SetWallNamePanel.appendChild(wallname_TextBox);
        SetWallNamePanel.appendChild(wallname_Btn);
        toolbar.appendChild(SetWallNamePanel);
        

        container.appendChild(toolbar);

        ADD_VISUAL(container);

        CACHE["container"] = true;
    }

    if (!CACHE['experiment_phases'])
    {
        CACHE['experiment_phases'] = ["NullStep"];
        if (SETTINGS_VAL["ExperimentPhases"])
            CACHE['experiment_phases'] = CACHE['experiment_phases'].concat(SETTINGS_VAL["ExperimentPhases"].split('\n'));
    }

    //--------------- set outputs -----------------
    if (CACHE["Gaze"])
    {
        OUTPUT["Gaze"] = CACHE["Gaze"];
        CACHE["Gaze"] = null;
    }
    if (CACHE["WAV"])
    {
        OUTPUT["Voice"] = CACHE["WAV"];
        if (CACHE["WAV"] == "End")
            console.log("VRBoard: Send End");
        CACHE["WAV"] = null;
    }
    if (CACHE["WallLog"])
    {
        OUTPUT["Wall Log"] = CACHE["WallLog"];
        CACHE["WallLog"] = null;
    }
        
    

    //------------ send image to UE4 -------------
    if (HAS_INPUT["Picture"] && 
        INPUT["Picture"] !== null && 
        CACHE["img"] !== INPUT["Picture"]) 
    {
        CACHE["img"] = INPUT["Picture"];
        CACHE["AOIs"] = INPUT["AOIs"];
        let msg = JSON.stringify({ image: CACHE["img"], 
                        scaleX: SETTINGS_VAL["Scale X"], scaleY: SETTINGS_VAL["Scale Y"], 
                        AOIs: CACHE["AOIs"] });
        if (CACHE["webSocket"])
        {
            var ws = CACHE["webSocket"]
            ws.send(msg);
            CACHE["current_phase_index"] = 0;//reset phase of experiment
            ws.send(JSON.stringify({setExperimentStep: "NullStep"})); //launch null step of experiment
        }
        else CACHE["newImageToSend"] = msg;
    }

    //------------ send speech to UE4 -------------------
    if (HAS_INPUT["Speech"] && INPUT["Speech"] && INPUT["Speech"].length > 0 && CACHE["webSocket"])
    {
        var ws = CACHE["webSocket"]
        CACHE["LastSpeech"] = INPUT["Speech"]
        var msg = JSON.stringify({"Speech": INPUT["Speech"]});
        ws.send(msg)
    }
    //-------------- create websocket --------------
    else if (!CACHE["webSocket created"])
    {
        var vrSrvIP = SETTINGS_VAL["VR Server IP"];
        if (vrSrvIP.indexOf(":") === -1)
            vrSrvIP += ":81";
        websocket = new WebSocket("ws://" + vrSrvIP + "/ue4");
        websocket.onopen = (evt) => {
            console.log("WebSocket open");
            CACHE["webSocket"] = websocket;
            if (CACHE["newImageToSend"])
                websocket.send(CACHE["newImageToSend"]);

            CACHE["webSocket"].send(JSON.stringify({setExperimentStep: "NullStep"})); //launch null step of experiment
            CACHE["current_phase_index"] = 0;
            PROCESS();
        };
        
        websocket.onclose = (evt) => {
            console.log("WebSocket close");
            CACHE["webSocket"] = null;
            CACHE["webSocket created"] = false;
        };
        websocket.onerror = (evt) => {
            console.log(evt);
            CACHE["webSocket"] = null;
            CACHE["webSocket created"] = false;
        };
        websocket.onmessage = (evt) => {
            if (evt.data) 
            {
                var msg = JSON.parse(evt.data);
                var need_process = false;
                if (msg["WAV"])
                {
                    CACHE["WAV"] = msg["WAV"];
                    need_process = true;
                    if (msg["WAV"] == "End")
                        console.log("VRBOARD: Received ENd");
                }
                if (msg["Gaze"])
                {
                    gaze = msg["Gaze"]
                    CACHE["Gaze"] = [msg["Time"], gaze["uv"][0], gaze["uv"][1], 
                                    gaze["origin"][0], gaze["origin"][1], gaze["origin"][2], 
                                    gaze["direction"][0], gaze["direction"][1], gaze["direction"][2],
                                    gaze["lpdmm"], gaze["rpdmm"], gaze["cf"],
                                    gaze["AOI_index"], gaze["Action"]];
                    need_process = true;
                }
                if (msg["WallLog"])
                {                   
                    log = msg["WallLog"]
                    CACHE["WallLog"] = [msg["Time"], log["Action"], log["Wall"]]
                    if (log["AOI"])
                    {
                        CACHE["WallLog"].push(log["AOI"]);
                    }
                    need_process = true;
                }
                    
                if (need_process)
                    PROCESS();
            }
        };
        CACHE["webSocket created"] = true;
    }
} 
else 
{
    CACHE["img"] = null;
    CACHE["container"] = null;
    CACHE['experiment_phases'] = null;
    if (CACHE["webSocket"]) {
        CACHE["webSocket"].close();
        CACHE["webSocket"] = null;
        CACHE["webSocket created"] = null;
        CACHE["Gaze"] = null;
    }
}
