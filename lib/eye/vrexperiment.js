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

function SetNullPhase()
{
    CACHE["CurrentPhaseIndex"] = 0;//reset phase of experiment
    CACHE["webSocket"].send(JSON.stringify({setExperimentStep: "NullStep"})); //launch null step of experiment
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
            const phases_count = CACHE["experiment_phases"].length;
            if (!CACHE["CurrentImage"] ||
            CACHE["CurrentPhaseIndex"] + 1 == phases_count) return null; 
            let index = ++CACHE["CurrentPhaseIndex"];
            return {setExperimentStep: CACHE["experiment_phases"][index]};
        }));
        toolbar.appendChild(addCmdButton("Reset experiment", "Reset", (btn) => 
        {
            if (CACHE["CurrentImage"])
            {
                CACHE["newImageToSend"] = CACHE["CurrentImage"];
                CACHE["CurrentImage"] = undefined;
                CACHE["RestTimeBeforeSendImage"] = DOT_TIMEOUT;//set timer
            }
            CACHE["CurrentPhaseIndex"] = 0;
            return {setExperimentStep: CACHE["experiment_phases"][0]};
        }));

        let ManuallyVoiceRecognizerPanel = document.createElement('div');

        let RecognizedVoice_TextBox = document.createElement('input');
        RecognizedVoice_TextBox.setAttribute('type', 'text');
        RecognizedVoice_TextBox.id = "Voice";
        let RecognizeVoice_Btn = addCmdButton("Recognize Voice", "RecognizeVoiceBtn", (btn) => {
            let cmd = {Speech: RecognizedVoice_TextBox.value};
            input.value = "";
            return cmd;
        });
        ManuallyVoiceRecognizerPanel.appendChild(RecognizedVoice_TextBox);
        ManuallyVoiceRecognizerPanel.appendChild(RecognizeVoice_Btn);
        toolbar.appendChild(ManuallyVoiceRecognizerPanel);
        
        let GazeInfoPanel = document.createElement('div');
        GazeInfoPanel.id = "GazeInfoPanel";
        toolbar.appendChild(GazeInfoPanel);

        container.appendChild(toolbar);

        ADD_VISUAL(container);

        CACHE["container"] = true;
        CACHE['experiment_phases'] = ["NullStep"];//default step
        if (SETTINGS_VAL["ExperimentPhases"])
            CACHE['experiment_phases'] = CACHE['experiment_phases'].concat(SETTINGS_VAL["ExperimentPhases"].split('\n'));

        OUTPUT["Gaze CSV Meta"] = {"Title": "GazeLog", 
                                    "Header": ["Timestamp", "Origin_x", "Origin_y", "Origin_z", "Direction_x", "Direction_y", "Direction_z", "lpdmm", "rpdmm", "AOI"]};
        OUTPUT["Action Log Meta"] = {"Title": "ActionLog", 
                                    "Header": ["Timestamp", "Action", "AOI", "DropLocation"]};
    }

    //--------------- set outputs -----------------
    if (CACHE["Gaze"])
    {
        OUTPUT["Gaze(new version)"] = CACHE["Gaze"];
        CACHE["Gaze"] = undefined;
    }
    if (CACHE["WAV"])
    {
        OUTPUT["Voice"] = CACHE["WAV"];
        CACHE["WAV"] = undefined;
    }
    if (CACHE["ControllerLog"])
    {
        OUTPUT["Action Log"] = CACHE["ControllerLog"];
        CACHE["ControllerLog"] = undefined;
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
    if (!CACHE["WebSocketCreated"])
    {
        var vrSrvIP = SETTINGS_VAL["VR Server IP"];
        if (vrSrvIP.indexOf(":") === -1)
            vrSrvIP += ":81";
        CACHE["SetNULLPhase"] = true;
        websocket = new WebSocket("ws://" + vrSrvIP + "/ue4");
        websocket.onopen = (evt) => {
            console.log("UE4 WebSocket open");
            CACHE["webSocket"] = websocket;
            if (CACHE["SetNULLPhase"]) SetNullPhase();
            CACHE["SetNULLPhase"] = undefined;
            PROCESS();
        };
        
        websocket.onclose = (evt) => {
            console.log("UE4 WebSocket close");
            CACHE["webSocket"] = undefined;
            CACHE["WebSocketCreated"] = false;
        };
        websocket.onerror = (evt) => {
            console.log(evt);
            CACHE["webSocket"] = undefined;
            CACHE["WebSocketCreated"] = false;
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
                }
                if (msg["GazeLog"])
                {
                    gaze = msg["GazeLog"]
                    CACHE["Gaze"] = [msg["Time"], 
                                    gaze["origin"][0], gaze["origin"][1], gaze["origin"][2], 
                                    gaze["direction"][0], gaze["direction"][1], gaze["direction"][2],
                                    gaze["lpdmm"], gaze["rpdmm"],
                                    gaze["AOI"]];
                    need_process = true;
                }
                if (msg["ControllerLog"])
                {                   
                    log = msg["ControllerLog"]
                    CACHE["ControllerLog"] = [msg["Time"], log["Action"], log["AOI"]]
                    if (log["DropPosition"])
                    {
                        CACHE["ControllerLog"].push(log["DropPosition"][0], log["DropPosition"][1], log["DropPosition"][2]);
                    }
                    need_process = true;
                }
                    
                if (need_process)
                    PROCESS();
            }
        };
        CACHE["WebSocketCreated"] = true;
    }
}
else 
{
    CACHE["container"] = undefined;
    CACHE['experiment_phases'] = undefined;
    if (CACHE["webSocket"]) 
    {
        CACHE["webSocket"].close();
        CACHE["webSocket"] = undefined;
        CACHE["WebSocketCreated"] = undefined;
        CACHE["Gaze"] = undefined;
    }
}
