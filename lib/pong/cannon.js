function shoot()
{
    var objects = CACHE["objects"];
    if (objects) {
        const a = objects[0].state.angle * Math.PI / 180.0;
        const vx = Math.cos(a);
        const vy = Math.sin(a);
        const r = Math.sqrt(objects[0].state.width * objects[0].state.width + objects[0].state.height * objects[0].state.height) / 2.0;
        var ball = document.createElement("div");
        ball.style.background = "#FF864E";
        ball.style.width = "20px";
        ball.style.height = "20px";
        ball.style.borderRadius = "100%";
        ball.style.boxShadow = "0 0 5px #FF4000, 0 0 25px #FF4000, 0 0 50px #FF4000, 0 0 100px #FF4000";
        ball.style.position = "absolute";
        ball.actorType = "ball";
        ball.state = {
            x: objects[0].state.x + (r + 20) * vx,
            y: objects[0].state.y + (r + 20) * vy,
            width: 20,
            height: 20,
            vx: vx,
            vy: vy,
            border: 0,
            speed: SETTINGS_VAL["Ball Speed"],
            alive: true
        };
        objects.push(ball);
        planShot();
        // PROCESS();
    }
}

function planShot()
{
    setTimeout(shoot, SETTINGS_VAL["Shoot Interval"] * 1000);
}

if (IN_VISUALIZATION && HAS_INPUT["X"] && HAS_INPUT["Y"] && HAS_INPUT["Angle"]) {
    var objects = CACHE["objects"];
    if (!objects) {
        var cannon = document.createElement("div");
        cannon.style.background = "conic-gradient(#d7d7d7, #c3c3c3, #cccccc, #c6c6c6, #d7d7d7, #c3c3c3, #cccccc, #c6c6c6, #d7d7d7, #c3c3c3, #cccccc, #c6c6c6, #d7d7d7, #c3c3c3, #cccccc, #c6c6c6)";
        cannon.style.position = "absolute";
        cannon.style.border = "5px outset #000";
        cannon.style.borderRadius = "999px";
        cannon.style.color = "#000";
        cannon.style.textShadow = "hsla(0,0%,40%,.5) 0 -1px 0, hsla(0,0%,100%,.6) 0 2px 1px";
        cannon.style.fontWeight = "bold";
        cannon.style.textAlign = "center";
        cannon.style.width = "80px";
        cannon.style.height = "80px";
        cannon.style.lineHeight = "60px";
        cannon.actorType = "cannon";
        cannon.state = {
            x: 0.0,
            y: 0.0,
            width: 80.0,
            height: 80.0,
            angle: 0.0,
            value: 0,
            border: 5
        };
        var barrel = document.createElement("div");
        barrel.style.background = "linear-gradient(#eee 0%, #999 100%)";
        barrel.style.width = "70px";
        barrel.style.height = "20px";
        barrel.style.lineHeight = "22px";
        barrel.style.marginLeft = "20px";
        barrel.style.marginTop = "28px";
        barrel.style.borderRadius = "999px 0px 0px 999px";
        barrel.style.border = "2px outset #aaa";
        barrel.position = "relative";
        cannon.appendChild(barrel);
        objects = [ cannon ];
        CACHE["objects"] = objects;

        planShot();
    }

    var cannon = objects[0];

    for (var i = 1; i < objects.length;) {
        if (!objects[i].state.alive) {
            objects.splice(i, 1);
            cannon.state.value++;
        } else {
            ++i;
        }
    }

    var x = INPUT["X"];
    if (x !== undefined && x !== null)
        CACHE["X"] = x;
    else
        x = CACHE["X"];
    var y = INPUT["Y"];
    if (y !== undefined && y !== null)
        CACHE["Y"] = y;
    else
        y = CACHE["Y"];
    var a = INPUT["Angle"];
    if (a !== undefined && a !== null)
        CACHE["Angle"] = a;
    else
        a = CACHE["Angle"];
    cannon.state.x = x * window.innerWidth;
    cannon.state.y = y * window.innerHeight;
    cannon.state.angle = a;
    cannon.style.left = (cannon.state.x - cannon.state.width / 2.0 - cannon.state.border) + "px";
    cannon.style.top = (cannon.state.y - cannon.state.height / 2.0 - cannon.state.border) + "px";
    cannon.style.transform = "rotate(" + a + "deg)";
    cannon.children[0].innerHTML = cannon.state.value;

    OUTPUT["Object"] = objects;
} else {
    CACHE["objects"] = null;
    CACHE["X"] = null;
    CACHE["Y"] = null;
    CACHE["Angle"] = null;
}
