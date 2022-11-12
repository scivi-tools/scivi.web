
function mapVal(val, valMin, valMax, resMin, resMax)
{
    return resMin + (val - valMin) / (valMax - valMin) * (resMax - resMin);
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["Values"] && INPUT["Values"]) {
        var ctx = CACHE["ctx"];
        if (!ctx) {
            var canvas = document.createElement("canvas");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx = canvas.getContext("2d");
            CACHE["ctx"] = ctx;
            ADD_VISUAL(canvas);
        }
        var values = INPUT["Values"].split(" ");
        var angle = parseFloat(values[0]) * Math.PI / 180.0;
        var distance = parseFloat(values[1]);
        var prevAngle = CACHE["prevAngle"];
        var forward = prevAngle !== null && angle > prevAngle;
        var r = window.innerHeight - 50;
        var x = window.innerWidth / 2.0;
        var y = window.innerHeight;
        CACHE["prevAngle"] = angle;
        if (prevAngle === null)
            prevAngle = 0;
        ctx.fillStyle = forward ? "#56C1FF" : "#36789E";
        ctx.strokeStyle = "#FFF";
        ctx.beginPath();
        ctx.moveTo(x, y);
        if (forward)
            ctx.arc(x, y, r, prevAngle - Math.PI, angle - Math.PI);
        else
            ctx.arc(x, y, r, angle - Math.PI, prevAngle - Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (distance > 0 && distance < 100) {
            distance = mapVal(distance, 0, 100, 0, r);
            angle = (angle + prevAngle) / 2.0;
            ctx.beginPath();
            ctx.fillStyle = "#B51700";
            ctx.arc(x - Math.cos(angle) * distance, y - Math.sin(angle) * distance, 5, 0, 2.0 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }
    }
} else {
    CACHE["ctx"] = null;
    CACHE["prevAngle"] = null;
}
