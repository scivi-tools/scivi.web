
function dumpGazeTrack(gt)
{
    var result = "";
    for (var i = 0; i < gt.length; ++i)
        result += gt[i].join(";") + "\n";
    return result;
}

if (IN_VISUALIZATION) {
    if (!CACHE["gazeTrack"]) {
        CACHE["gazeTrack"] = [];
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
        rec.addEventListener("click", function (e) {
            var r = CACHE["rec"];
            if (CACHE["rec"]) {
                rec.innerHTML = "Start Recording";
                rec.classList.remove("pushed");
                CACHE["rec"] = false;
                if (CACHE["gazeTrack"]) {
                    var filename = prompt("Enter name of file to save", "eyetrack.csv");
                    if (!filename)
                        return;
                    if (!filename.includes("."))
                        filename += ".csv";
                    var content = dumpGazeTrack(CACHE["gazeTrack"]);
                    var element = document.createElement("a");
                    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
                    element.setAttribute("download", filename);
                    element.style.display = "none";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                }
            } else {
                rec.innerHTML = "Stop Recording";
                rec.classList.add("pushed");
                rec.pushed = true;
                CACHE["rec"] = true;
            }
        });
        toolbar.appendChild(rec);

        var calib = document.createElement("div");
        calib.innerHTML = "Caibrate";
        calib.classList.add("scivi_button");
        toolbar.appendChild(calib);

        container.appendChild(toolbar);

        ADD_VISUAL(container);
    }
    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] && CACHE["rec"])
            CACHE["gazeTrack"].push(INPUT["Gaze"]);
} else {
    CACHE["rec"] = false;
    CACHE["gazeTrack"] = null;
}
