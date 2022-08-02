
function dumpGazeTrack(gt)
{
    var result = "";
    for (var i = 0; i < gt.length; ++i)
        result += gt[i].join(";") + "\n";
    return result;
}

if (IN_VISUALIZATION) {
    if (!CACHE["gaze_files"]) {
        CACHE["gaze_files"] = {};
        CACHE["rec"] = false;

        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "24px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        var rec = document.createElement("div");
        rec.innerHTML = "Start Recording";
        rec.classList.add("scivi_button");
        rec.addEventListener("click", e => 
        {
            var r = CACHE["rec"];
            if (CACHE["rec"]) 
            {
                rec.innerHTML = "Start Recording";
                rec.classList.remove("pushed");
                CACHE["rec"] = false;
                Object.keys(CACHE["gaze_files"])
                        .forEach(filename => SAVE_FILE(dumpGazeTrack(CACHE["gaze_files"][filename]), 
                                                        filename + "_eyetrack.csv", 
                                                        ".csv", "text/plain;charset=utf-8", true));
            } else {
                rec.innerHTML = "Stop Recording";
                rec.classList.add("pushed");
                rec.pushed = true;
                CACHE["rec"] = true;
            }
        });
        toolbar.appendChild(rec);
        container.appendChild(toolbar);
        ADD_VISUAL(container);
    }
    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] && CACHE["rec"])
    {
        let file_name = INPUT["Gaze"]["picture_name"];
        let data = INPUT["Gaze"]["data"];
        if (!CACHE["gaze_files"][file_name])//if no that file, then insert
        {
            const title = ["timestamp", "uv_x", "uv_y", 
                            "origin_x", "origin_y", "origin_z", 
                            "direction_x", "direction_y", "direction_z",
                            "lpdmm", "rpdmm", "cf", "AOI_index", "Action"];
            CACHE["gaze_files"][file_name] = [title];
        }
        CACHE["gaze_files"][file_name].push(data);
    }
} else {
    CACHE["rec"] = false;
    CACHE["gaze_files"] = null;
}
