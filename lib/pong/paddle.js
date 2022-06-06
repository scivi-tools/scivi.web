if (IN_VISUALIZATION && HAS_INPUT["X"] && HAS_INPUT["Y"] && HAS_INPUT["Angle"] && HAS_INPUT["Length"]) {
    var paddle = CACHE["paddle"];
    if (!paddle) {
        paddle = document.createElement("div");
        paddle.style.width = INPUT["Length"] + "px";
        paddle.style.height = "30px";
        paddle.style.background = "#D0BEB5";
        paddle.style.position = "absolute";
        paddle.style.borderRadius = "999px";
        paddle.style.border = "2mm outset #B19385";
        paddle.style.color = "#FFDD00";
        paddle.style.fontWeight = "bold";
        paddle.style.textAlign = "center";
        paddle.innerHTML = "100";
        CACHE["paddle"] = paddle;
    }
    const x = INPUT["X"] * 100;
    const y = INPUT["Y"] * 100;
    const a = INPUT["Angle"];
    const w = INPUT["Length"];
    const h = 30;
    paddle.style.left = "calc(" + x + "vw - " + (w / 2) + "px)";
    paddle.style.top = "calc(" + y + "vh - " + (h / 2) + "px)";
    OUTPUT["Object"] = paddle;
} else {
    CACHE["paddle"] = null;
}