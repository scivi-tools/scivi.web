const DOT_TIMEOUT = 3000;
const IDX_TIM = 0;
const IDX_U = 1;
const IDX_V = 2;
const IDX_TYP = 12;
const PHASE1_NAME = "Push to allow proceeding";
const PHASE2_NAME = "Ask the Informant to look at the dot for 3 sec";
const PHASE3_NAME = "Ask the Informant to click the trigger";
const PHASE4_NAME = "Push to save data";

function counter()
{
    return " (" + (CACHE["PosterIndex"] + 1) + "/" + DATA["Image Count"] + ")";
}

function storeGaze(gaze)
{
    if (!CACHE["GazeData"])
        CACHE["GazeData"] = [];
    CACHE["GazeData"].push(gaze.concat(DATA["Images"][CACHE["PosterIndex"]].name));
}

function dumpGazeTrack(gt)
{
    var result = "";
    for (var i = 0; i < gt.length; ++i)
        result += gt[i].join(";") + "\n";
    return result;
}

function saveGazeData()
{
    if (CACHE["GazeData"]) {
        var filename = prompt("Enter name of file to save", "eyetrack.csv");
        if (!filename)
            return;
        if (!filename.includes("."))
            filename += ".csv";
        var content = dumpGazeTrack(CACHE["GazeData"]);
        var element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}

function gazeInCenter(gaze)
{
    var x = gaze[IDX_U] - 0.5;
    var y = gaze[IDX_V] - 0.5;
    return x * x + y * y < 0.01;
}

var files = SETTINGS_VAL["Poster Images"];
if (files) {
    if (SETTINGS_CHANGED["Poster Images"]) {
        SETTINGS_CHANGED["Poster Images"] = false;
        var n = files.length;
        DATA["Images"] = [];
        DATA["Image Count"] = n;
        for (var i = 0; i < n; ++i) {
            (function(file, index) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    DATA["Images"].push({name: file.name, data: e.target.result, index: index});
                    if (DATA["Images"].length === DATA["Image Count"]) {
                        DATA["Images"].sort(function(a, b) {
                            return a.index < b.index ? -1 : 1;
                        });
                        PROCESS();
                    }
                }
                reader.readAsDataURL(file);
            })(files[i], i);
        }
    }
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] !== null && DATA["Images"] !== undefined && DATA["Images"].length === DATA["Image Count"]) {
        var gaze = INPUT["Gaze"];
        if (CACHE["Recording"])
            storeGaze(gaze);
        if (gaze[IDX_TYP] === "R_RELD") {
            OUTPUT["Picture"] = CACHE["Stub"];
            CACHE["Recording"] = false;
            CACHE["Button"].classList.remove("disabled");
            if (CACHE["PosterIndex"] === DATA["Image Count"] - 1)
                CACHE["Button"].innerHTML = PHASE4_NAME + counter();
            else
                CACHE["Button"].innerHTML = PHASE1_NAME + counter();
        } else if (gaze[IDX_TYP] === "IMG_UP") {
            if (CACHE["ShouldStartRec"]) {
                CACHE["ShouldStartRec"] = false;
                CACHE["Recording"] = true;
            }
        } else if (CACHE["AllowNext"] && gazeInCenter(gaze)) {
            if (!CACHE["DotEnterTS"])
                CACHE["DotEnterTS"] = gaze[IDX_TIM];
            else if (gaze[IDX_TIM] - CACHE["DotEnterTS"] > DOT_TIMEOUT && CACHE["PosterIndex"] < DATA["Image Count"] - 1) {
                ++CACHE["PosterIndex"];
                CACHE["AllowNext"] = false;
                CACHE["ShouldStartRec"] = true;
                CACHE["Button"].innerHTML = PHASE3_NAME + counter();
                OUTPUT["Picture"] = DATA["Images"][CACHE["PosterIndex"]].data;
            }
        } else {
            CACHE["DotEnterTS"] = 0;
        }
    }

    if (CACHE["PosterIndex"] === undefined) {
        CACHE["PosterIndex"] = -1;

        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "24px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        var btn = document.createElement("div");
        btn.innerHTML = PHASE1_NAME + counter();
        btn.classList.add("scivi_button");
        btn.addEventListener("click", function (e) {
            if (!btn.classList.contains("disabled")) {
                if (CACHE["PosterIndex"] === DATA["Image Count"] - 1) {
                    saveGazeData();
                    CACHE["GazeData"] = null;
                } else {
                    CACHE["AllowNext"] = true;
                    btn.innerHTML = PHASE2_NAME + counter();
                    btn.classList.add("disabled");
                }
            }
        });
        CACHE["Button"] = btn;
        toolbar.appendChild(btn);

        container.appendChild(toolbar);

        ADD_VISUAL(container);

        var w = SETTINGS_VAL["Stub Width"];
        var h = SETTINGS_VAL["Stub Height"];
        var cvs = document.createElement("canvas");
        cvs.width = w;
        cvs.height = h;
        var ctx = cvs.getContext("2d");
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#000";
        ctx.arc(w / 2.0, h / 2.0, 10, 0, Math.PI * 2.0, false);
        ctx.fill();
        CACHE["Stub"] = cvs.toDataURL();
        OUTPUT["Picture"] = CACHE["Stub"];
    }
} else {
    CACHE["PosterIndex"] = undefined;
    CACHE["Stub"] = null;
    CACHE["AllowNext"] = false;
    CACHE["ShouldStartRec"] = false;
    CACHE["Recording"] = false;
    CACHE["DotEnterTS"] = 0;
    CACHE["GazeData"] = null;
}
