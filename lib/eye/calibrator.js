const IDX_U = 1;
const IDX_V = 2;
const IDX_CALPHA = 9;
const IDX_CBETA = 10;
const IDX_TYP = 12;

const WIDTH = 1600;
const HEIGHT = 1024;

function genImageWithDot(u, v, ctx)
{
    ctx.moveTo(u * WIDTH, v * HEIGHT);
    ctx.arc(u * WIDTH, v * HEIGHT, 10, 0, Math.PI * 2.0, false);
    ctx.fill();
}

function storeGaze(u1, v1, u2, v2)
{
    var u = CACHE["realU"];
    var v = CACHE["realV"];
    CACHE["data"].push([u, v, u1, v1, u2, v2]);
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
    if (CACHE["data"]) {
        var filename = prompt("Enter name of file to save", "deltas.csv");
        if (!filename)
            return;
        if (!filename.includes("."))
            filename += ".csv";
        var content = dumpGazeTrack(CACHE["data"]);
        var element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}

function updateView(gazeMode)
{
    /*if (CACHE["freeMode"]) {
        const n = 3;
        var idx = CACHE["pointIndex"];
        if (idx === n * n) {
            // idx = 0;
            CACHE["realU"] = Math.random();
            CACHE["realV"] = Math.random();
        } else {
            var u = (idx % n) * 0.9 / (n - 1) + 0.05;
            var v = Math.floor(idx / n) * 0.9 / (n - 1) + 0.05;
            ++idx;
            CACHE["pointIndex"] = idx;
            CACHE["realU"] = u;
            CACHE["realV"] = v;
            // CACHE["realU"] = Math.random();
            // CACHE["realV"] = Math.random();
        }
    } else {
        const points = [
            [0.05, 0.05], [0.5, 0.05], [0.95, 0.05],
            [0.05, 0.5], [0.5, 0.5], [0.95, 0.5],
            [0.05, 0.95], [0.5, 0.95], [0.95, 0.95]
        ];
        var idx = CACHE["pointIndex"];
        if (idx < points.length) {
            CACHE["realU"] = points[idx][0];
            CACHE["realV"] = points[idx][1];
            CACHE["pointIndex"] = idx + 1;
        } else {
            CACHE["freeMode"] = true;
            CACHE["realU"] = Math.random();
            CACHE["realV"] = Math.random();

            var ws = new WebSocket("ws://192.168.171.79:81/calib");
            ws.onopen = function (evt) {
                ws.send(JSON.stringify({data: CACHE["data"]}));
                var interval = setInterval(function () {
                    console.log(ws.bufferedAmount);
                    if (ws.bufferedAmount == 0) {
                        clearInterval(interval);
                        ws.close();
                    }
                }, 100);
            }
        }
    }
    OUTPUT["Picture"] = genImageWithDot(CACHE["realU"], CACHE["realV"]);*/

    var cvs = document.createElement("canvas");
    cvs.width = WIDTH;
    cvs.height = HEIGHT;
    var ctx = cvs.getContext("2d");
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#000";

    if (CACHE["fullGrid"] || gazeMode) {
        const n = 5;
        if (SETTINGS_VAL["Free Mode"]) {
            for (var idx = 0; idx < n * n; ++idx) {
                var u = (idx % n) * 0.9 / (n - 1) + 0.05;
                var v = Math.floor(idx / n) * 0.9 / (n - 1) + 0.05;
                genImageWithDot(u, v, ctx);
            }
            genImageWithDot(0.5, 0.5, ctx);
        } else {
            var idx = CACHE["pointIndex"];
            var u = (idx % n) * 0.9 / (n - 1) + 0.05;
            var v = Math.floor(idx / n) * 0.9 / (n - 1) + 0.05;
            ++idx;
            CACHE["pointIndex"] = idx % (n * n);
            CACHE["realU"] = u;
            CACHE["realV"] = v;
            genImageWithDot(u, v, ctx);
        }
    } else {
        const points = [
            [0.05, 0.05], [0.5, 0.05], [0.95, 0.05],
            [0.275, 0.275], [0.725, 0.275],
            [0.05, 0.5], [0.5, 0.5], [0.95, 0.5],
            [0.275, 0.725], [0.725, 0.725],
            [0.05, 0.95], [0.5, 0.95], [0.95, 0.95]
        ];
        for (var i = 0; i < points.length; ++i)
            genImageWithDot(points[i][0], points[i][1], ctx);
    }

    OUTPUT["Picture"] = cvs.toDataURL();
}

if (IN_VISUALIZATION) {
    if (!CACHE["data"]) {
        CACHE["data"] = [];
        CACHE["pointIndex"] = 0;

        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "24px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        var btn = document.createElement("div");
        btn.innerHTML = "Save Data";
        btn.classList.add("scivi_button");
        btn.addEventListener("click", function (e) {
            saveGazeData();
        });
        toolbar.appendChild(btn);

        container.appendChild(toolbar);

        ADD_VISUAL(container);

        updateView(false);
        CACHE["oldFullGrid"] = CACHE["fullGrid"];
        if (CACHE["fullGrid"] === undefined)
            CACHE["fullGrid"] = true;
        else
            CACHE["fullGrid"] = !CACHE["fullGrid"];
    }

    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] !== null && !SETTINGS_VAL["Free Mode"] && CACHE["oldFullGrid"]) {
        var gaze = INPUT["Gaze"];
        if (gaze[IDX_TYP] === "R_RELD") {
            storeGaze(gaze[IDX_U], gaze[IDX_V], gaze[IDX_CALPHA], gaze[IDX_CBETA]);
            updateView(true);
        }
    }
} else {
    CACHE["realU"] = undefined;
    CACHE["realV"] = undefined;
    CACHE["data"] = undefined;
    CACHE["pointIndex"] = undefined;
    // CACHE["fullGrid"] = undefined;
}
