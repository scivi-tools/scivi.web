if (IN_VISUALIZATION && HAS_INPUT["X"] && HAS_INPUT["Y"]) {
    var paddle = CACHE["paddle"];
    if (!paddle) {
        paddle = document.createElement("div");
        paddle.style.background = "linear-gradient(#eee 0%, #999 100%)";
        paddle.style.position = "absolute";
        paddle.style.border = "5px outset #000";
        paddle.style.borderRadius = "999px";
        paddle.style.color = "#000";
        paddle.style.textShadow = "hsla(0,0%,40%,.5) 0 -1px 0, hsla(0,0%,100%,.6) 0 2px 1px";
        paddle.style.fontWeight = "bold";
        paddle.style.textAlign = "center";
        paddle.actorType = "paddle";
        paddle.state = {
            x: 0.0,
            y: 0.0,
            width: 0.0,
            height: 30.0,
            value: 0,
            border: 5
        };
        CACHE["paddle"] = paddle;
    }
    
    const x = INPUT["X"];
    const y = INPUT["Y"];
    const w = PROPERTY["Width"];
    const h = PROPERTY["Height"];
    paddle.state.x = x * window.innerWidth;
    paddle.state.y = y * window.innerHeight;
    paddle.state.width = w;
    paddle.state.height = h;
    paddle.style.width = w + "px";
    paddle.style.height = h + "px";
    paddle.style.lineHeight = h + "px";
    paddle.style.left = (paddle.state.x - paddle.state.width / 2.0) + "px";
    paddle.style.top = (paddle.state.y - paddle.state.height / 2.0) + "px";
    paddle.innerHTML = paddle.state.value;

    OUTPUT["Object"] = paddle;
} else {
    CACHE["paddle"] = null;
}
