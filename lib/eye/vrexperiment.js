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

const SCENE_RESOLUTION = 2048;

/**
 * 
 * @param {CanvasRenderingContext2D} drawContext
 * @param {Object} styles 
 * @param {Object} actors - dictionary of actors to draw
 * @param {Object} informant 
 */
function renderScene(drawContext, aoi_polygons, informant_look_vector, focused_aoi_name, triggered_aoi_name)
{
    drawContext.lineWidth = 3.0;
    drawContext.fillStyle = "white";
    drawContext.fillRect(0, 0, SCENE_RESOLUTION, SCENE_RESOLUTION);
    const scene_size = 1500;
    const transformPoint = (x,y) => {
        const viewported_x = (x / scene_size) + 0.5;
        const viewported_y = (-y / scene_size) + 0.5;
        return [viewported_x * SCENE_RESOLUTION, 
                 viewported_y * SCENE_RESOLUTION];
    };

    function drawPolygon(ctx, polygon)
    {
        const start_point = transformPoint(polygon[0][0], polygon[0][1]);
        ctx.moveTo(start_point[0], start_point[1]);
        for(var i = 1; i < polygon.length; ++i)
        {
            const p = transformPoint(polygon[i][0], polygon[i][1]);
            ctx.lineTo(p[0], p[1]);
        }
        ctx.lineTo(start_point[0], start_point[1]);
    }
    drawContext.beginPath();
    drawContext.fillStyle = "black";
    drawContext.strokeStyle = "black";
    const center = transformPoint(0, 0);
    drawContext.fillRect(center[0] - 5, center[1] - 5, 10, 10);
    
    //draw AOIs
    Object.keys(aoi_polygons)
    .filter(aoi => aoi != focused_aoi_name && aoi != triggered_aoi_name)
    .forEach(aoi => drawPolygon(drawContext, aoi_polygons[aoi]));
    drawContext.stroke();

    drawContext.beginPath()
    drawContext.strokeStyle = "green";
    if (triggered_aoi_name)
        drawPolygon(drawContext, aoi_polygons[triggered_aoi_name]);
    drawContext.stroke();

    drawContext.beginPath();
    drawContext.fillStyle = "red";
    drawContext.strokeStyle = "red";
    drawContext.lineWidth = 5.0;
    if (focused_aoi_name)
        drawPolygon(drawContext, aoi_polygons[focused_aoi_name]);
    // Draw informant
    {
        var pos = informant_look_vector[0];
        var direction = informant_look_vector[1];
        direction = transformPoint(pos[0] + direction[0] * 25.0, pos[1] + direction[1] * 25.0);
        pos = transformPoint(pos[0], pos[1]);
        drawContext.fillRect(pos[0] - 10.0, pos[1] - 10.0, 20.0, 20.0);
        drawContext.moveTo(pos[0], pos[1]);
        drawContext.lineTo(direction[0], direction[1]);
    }
    drawContext.stroke();
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
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.height = '100%';

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "24px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        toolbar.appendChild(addCmdButton("Calibrate", "CalibrateBtn", (btn) => {return { calibrate: true };} ));
        //toolbar.appendChild(addCmdButton("Custom Caibrate", "CustomCalibrateBtn", (btn) => {return { customCalibrate: true };} ));
        toolbar.appendChild(addCmdButton("Next Experiment Phase", "NextExperimentPhaseBtn", (btn) => 
        {
            const phases_count = CACHE["experiment_phases"].length;
            if (CACHE["CurrentPhaseIndex"] + 1 < phases_count){
                let index = ++CACHE["CurrentPhaseIndex"];
                return {setExperimentStep: CACHE["experiment_phases"][index]};
            }
            else return null;
            
        }));
        toolbar.appendChild(addCmdButton("Reset experiment", "Reset", (btn) => 
        {
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

        const canvas = document.createElement('canvas');
        canvas.width = SCENE_RESOLUTION;
        canvas.height = SCENE_RESOLUTION;
        canvas.style.border = '1px solid black';
        canvas.style.display='block';
        canvas.style.flex = '1 1 auto';
        canvas.style.width = '60%';
        canvas.style.height = '500px';
        canvas.style.padding = '0';
        canvas.style.margin = 'auto';
        canvas.style.marginTop = '1rem';
        canvas.style.marginBottom = '1rem';
        container.appendChild(canvas);
        ADD_VISUAL(container);
        
        CACHE["container"] = true;
        if (SETTINGS_VAL["ExperimentPhases"])
            CACHE['experiment_phases'] = SETTINGS_VAL["ExperimentPhases"].split('\n');
        CACHE["CurrentPhaseIndex"] = -1;
        OUTPUT["Gaze CSV Meta"] = {"Title": "GazeLog", 
        "Header": ["Timestamp", "Origin_x", "Origin_y", "Origin_z", "Direction_x", "Direction_y", "Direction_z", "lpdmm", "rpdmm", "AOI", "AOI_Component"]};
        OUTPUT["Action Log Meta"] = {"Title": "ActionLog", 
        "Header": ["Timestamp", "Action", "AOI", "DropLocation"]};
        CACHE["AOIRects"] = {};
        CACHE["DrawContext"] = canvas.getContext('2d', {alpha: false});
        CACHE["InformantLookVector"] = [[0, 0], [0, 1]];
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
    if (CACHE["ExperimentLog"])
	{
		OUTPUT["Action Log"] = CACHE["ExperimentLog"];
        CACHE["ExperimentLog"] = undefined;
	}

    if (CACHE["NeedRenderScene"])
    {
        renderScene(CACHE["DrawContext"], CACHE["AOIRects"], CACHE["InformantLookVector"], CACHE["FocusedAOI"], CACHE["TriggeredAOI"]);
        CACHE["NeedRenderScene"] = false;
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
        CACHE["AOIRects"] = {};
        websocket.onopen = (evt) => {
            console.log("UE4 WebSocket open");
            CACHE["webSocket"] = websocket;
            PROCESS();
        };
        
        websocket.onclose = (evt) => {
            console.log("UE4 WebSocket close");
			alert("UE4 отключился от SciVi");
            CACHE["webSocket"] = undefined;
            CACHE["WebSocketCreated"] = false;
        };
        websocket.onerror = (evt) => {
            console.log(evt);
			alert("Не удалось подключиться к серверу. Более подробно написано в консоли браузера");
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
                                    gaze["AOI"], gaze["AOI_Component"]];
                    const pos = gaze["origin"];
                    const dir = gaze["direction"];
                    const len = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1]);

                    CACHE["InformantLookVector"] = [[pos[0], pos[1]], [dir[0] / len, dir[1] / len]];
                    CACHE["FocusedAOI"] = gaze["AOI"];
                    CACHE["NeedRenderScene"] = true;
                    need_process = true;
                }
				if (msg["ExperimentLog"])
				{
					const log = msg["ExperimentLog"];
					CACHE["ExperimentLog"] = [msg["Time"], log["Action"]];
					if (log["AOI"])
                    {
						CACHE["ExperimentLog"].push(log["AOI"]);
                        if (log["Action"] == "TriggerPressed")
                        {
                            CACHE["TriggeredAOI"] = log["AOI"];
                            CACHE["NeedRenderScene"] = true;
                        }
                    }
					if (log["DropPosition"])
                        CACHE["ExperimentLog"].push(log["DropPosition"][0], log["DropPosition"][1], log["DropPosition"][2]);

                    
                    
					need_process = true;
				}
                if (msg["NewAOIRect"])
                {
                    const info = msg["NewAOIRect"];
                    const actor_name = info["AOI"];
                    const rect = info["BoundingRect"];
                    CACHE["AOIRects"][actor_name] = rect;
                    CACHE["NeedRenderScene"] = true;
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
    CACHE["AOIRects"] = undefined;
    CACHE["InformantLookVector"] = undefined;
    CACHE["NeedRenderScene"] = false;
    CACHE["FocusedAOI"] = undefined;
    CACHE["TriggeredAOI"] = undefined;
    if (CACHE["webSocket"]) 
    {
        CACHE["webSocket"].close();
        CACHE["webSocket"] = undefined;
        CACHE["WebSocketCreated"] = undefined;
        CACHE["Gaze"] = undefined;
		CACHE["ExperimentLog"] == undefined;
    }
}
