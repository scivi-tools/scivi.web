const IDX_U = 1;
const IDX_V = 2;
const IDX_TYP = 12;
const RADIUS = 15;

function drawEye(ctx, x, y)
{
    var radgrad = ctx.createRadialGradient(x, y, 0, x, y, RADIUS);
    var d = RADIUS * 2;
    radgrad.addColorStop(0, "rgba(228,0,0,.3)");
    radgrad.addColorStop(1, "rgba(228,0,0,0)");  
    ctx.fillStyle = radgrad;
    ctx.fillRect(x - d, y - d, x + d, y + d);
}

if (IN_VISUALIZATION && HAS_INPUT["Picture"] && INPUT["Picture"] && HAS_INPUT["Gaze"] && INPUT["Gaze"]) {
    var gaze = INPUT["Gaze"]["data"];

    var container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

    var imgFrame = document.createElement("div");
    imgFrame.style.width = "800px";
    imgFrame.style.position = "relative";
    imgFrame.style.top = "50%";
    imgFrame.style.left = "50%";
    imgFrame.style.transform = "translate(-50%, -50%)";
    container.appendChild(imgFrame);
    
    var img = document.createElement("img");
    img.style.width = "100%";
    img.style.position = "absolute";
    imgFrame.appendChild(img);

    img.addEventListener("load", function () {
        var cvs = document.createElement("canvas");
        cvs.width = img.naturalWidth;
        cvs.height = img.naturalHeight;
        cvs.style.position = "relative";
        // cvs.style.top = "50%";
        // cvs.style.left = "50%";
        // cvs.style.transform = "translate(-50%, -50%)";
        cvs.style.width = "100%";
        imgFrame.appendChild(cvs);
        var ctx = cvs.getContext("2d");
        for (var i = 0, n = gaze.length; i < n; ++i) {
            if (gaze[i][IDX_TYP] == "LOOKAT")
                drawEye(ctx, parseFloat(gaze[i][IDX_U]) * img.naturalWidth, parseFloat(gaze[i][IDX_V]) * img.naturalHeight);
        }
    });

    img.src = INPUT["Picture"];

    ADD_VISUAL(container);
}
