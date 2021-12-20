const IDX_U = 1;
const IDX_V = 2;
const IDX_CALPHA = 9;
const IDX_CBETA = 10;
const IDX_TYP = 12;

const WIDTH = 1600;
const HEIGHT = 1024;

function genImageWithDot(u, v)
{
    var cvs = document.createElement("canvas");
    cvs.width = WIDTH;
    cvs.height = HEIGHT;
    var ctx = cvs.getContext("2d");
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#000";
    ctx.arc(u * WIDTH, v * HEIGHT, 10, 0, Math.PI * 2.0, false);
    ctx.fill();
    return cvs.toDataURL();
}

function storeGaze(du, dv, ca, cb)
{
    CACHE["data"].push([ca, du, cb, dv]);
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

function updateView()
{
    CACHE["realU"] = Math.random();
    CACHE["realV"] = Math.random();
    OUTPUT["Picture"] = genImageWithDot(CACHE["realU"], CACHE["realV"]);
}

if (IN_VISUALIZATION) {
    if (!CACHE["data"]) {
        CACHE["data"] = [];

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

        updateView();
    }

    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] !== null) {
        var gaze = INPUT["Gaze"];
        if (gaze[IDX_TYP] === "R_RELD") {
            storeGaze(gaze[IDX_U] - CACHE["realU"], gaze[IDX_V] - CACHE["realV"], gaze[IDX_CALPHA], gaze[IDX_CBETA]);
            updateView();
        }
    }
} else {
    CACHE["realU"] = undefined;
    CACHE["realV"] = undefined;
    CACHE["data"] = undefined;
}
