function calcBBox(actor)
{
    const hw = actor.state.width / 2.0;
    const hh = actor.state.height / 2.0;
    return {
        x1: actor.state.x - hw - actor.state.border,
        y1: actor.state.y - hh - actor.state.border,
        x2: actor.state.x + hw + actor.state.border,
        y2: actor.state.y + hh + actor.state.border,
    };
}

/*function bboxIntersection(bbox1, bbox2)
{
    const result = {
        x1: Math.max(bbox1.x1, bbox2.x1),
        y1: Math.max(bbox1.y1, bbox2.y1),
        x2: Math.min(bbox1.x2, bbox2.x2),
        y2: Math.min(bbox1.y2, bbox2.y2)
    };
    return result.x2 >= result.x1 && result.y2 >= result.y1 ? result : null;
}

function lineIntersectionOnRect(rectSize, rectCenter, pt)
{
    var w = rectSize.width / 2.0;
    var h = rectSize.height / 2.0;

    var dx = pt.x - rectCenter.x;
    var dy = pt.y - rectCenter.y;

    if (dx == 0 && dy == 0)
        return { x: rectCenter.x, y: rectCenter.y };

    var tanPhi = h / w;
    var tanTheta = Math.abs(dy / dx);

    var qx = Math.sign(dx);
    var qy = Math.sign(dy);

    if (tanTheta > tanPhi) {
        xI = rectCenter.x + (h / tanTheta) * qx;
        yI = rectCenter.y + h * qy;
    } else {
        xI = rectCenter.x + w * qx;
        yI = rectCenter.y + w * tanTheta * qy;
    }

    return { x: xI, y: yI };
}*/

function bboxIntersectsBBox(bbox1, bbox2)
{
    return !(bbox1.x1 >= bbox2.x2 ||
             bbox1.x2 <= bbox2.x1 ||
             bbox1.y1 >= bbox2.y2 ||
             bbox1.y2 <= bbox2.y1);
}

function boxNormal(box, pt)
{
    const c = { x: (box.x1 + box.x2) / 2.0, y: (box.y1 + box.y2) / 2.0 };
    const tPhi = Math.abs((box.y2 - box.y1) / (box.x2 - box.x1));
    const tTheta = Math.abs((pt.y - c.y) / (pt.x - c.x));
    if (tTheta > tPhi)
        return { x: 0.0, y: 1.0 };
    else
        return { x: 1.0, y: 0.0 };
}

function circleNormal(box, pt)
{
    const c = { x: (box.x1 + box.x2) / 2.0, y: (box.y1 + box.y2) / 2.0 };
    var n = { x: pt.x - c.x, y: pt.y - c.y };
    const l = Math.sqrt(n.x * n.x + n.y * n.y);
    n.x /= l;
    n.y /= l;
    return n;
}

function reflect(v, n)
{
    const d = v.x * n.x + v.y * n.y;
    var result = { x: v.x - 2.0 * d * n.x, y: v.y - 2.0 * d * n.y };
    const l = Math.sqrt(result.x * result.x + result.y * result.y);
    result.x /= l;
    result.y /= l;
    return result;
}

if (IN_VISUALIZATION && HAS_INPUT["Actors"]) {
    var ts = CACHE["ts"];
    if (!ts)
        ts = new Date();
    const now = new Date();
    const delta = Math.min((now - ts) / 1000.0, 1.0 / 60.0);
    CACHE["ts"] = now;

    // Create root
    var container = CACHE["container"];
    if (!container) {
        container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";
        ADD_VISUAL(container);
        CACHE["container"] = container;
    }

    // Get actors
    var actors = INPUT["Actors"];
    if (!actors)
        actors = [];
    if (!Array.isArray(actors))
        actors = [ actors ];

    var colliders = actors.slice();
    if (SETTINGS_VAL["Left Wall"]) {
        colliders.push({
            actorType: "wall",
            state: {
                x: -50.0,
                y: window.innerHeight / 2.0,
                width: 100.0,
                height: window.innerHeight,
                border: 0
            }
        });
    }
    if (SETTINGS_VAL["Right Wall"]) {
        colliders.push({
            actorType: "wall",
            state: {
                x: window.innerWidth + 50,
                y: window.innerHeight / 2.0,
                width: 100.0,
                height: window.innerHeight,
                border: 0
            }
        });
    }
    if (SETTINGS_VAL["Top Wall"]) {
        colliders.push({
            actorType: "wall",
            state: {
                x: window.innerWidth / 2.0,
                y: -50,
                width: window.innerWidth,
                height: 100,
                border: 0
            }
        });
    }
    if (SETTINGS_VAL["Bottom Wall"]) {
        colliders.push({
            actorType: "wall",
            state: {
                x: window.innerWidth / 2.0,
                y: window.innerHeight + 50,
                width: window.innerWidth,
                height: 100,
                border: 0
            }
        });
    }

    // Collide and move actors
    var reqAnim = false;
    for (var i = 0, n = colliders.length; i < n; ++i) {
        if (colliders[i].actorType === "ball") {
            const oldPos = { x: colliders[i].state.x, y: colliders[i].state.y };
            colliders[i].state.x += colliders[i].state.vx * colliders[i].state.speed * delta;
            colliders[i].state.y += colliders[i].state.vy * colliders[i].state.speed * delta;
            const bboxI = calcBBox(colliders[i]);
            for (var j = 0; j < n; ++j) {
                if (i !== j) {
                    var bboxJ = calcBBox(colliders[j]);
                    if (bboxIntersectsBBox(bboxI, bboxJ)) {
                        colliders[i].state.x = oldPos.x;
                        colliders[i].state.y = oldPos.y;
                        var normal = (colliders[j].actorType === "paddle" || colliders[j].actorType === "wall") ? 
                                     boxNormal(bboxJ, oldPos) : circleNormal(bboxJ, oldPos);
                        if (colliders[j].actorType === "paddle")
                            colliders[j].state.value++;
                        var newV = reflect({ x: colliders[i].state.vx, y: colliders[i].state.vy }, normal);
                        colliders[i].state.vx = newV.x;
                        colliders[i].state.vy = newV.y;
                        colliders[i].state.x += colliders[i].state.vx * colliders[i].state.speed * delta;
                        colliders[i].state.y += colliders[i].state.vy * colliders[i].state.speed * delta;
                    }
                }
            }
            colliders[i].style.left = (colliders[i].state.x - colliders[i].state.width / 2.0) + "px";
            colliders[i].style.top = (colliders[i].state.y - colliders[i].state.height / 2.0) + "px";
            if (colliders[i].state.x < colliders[i].state.width || colliders[i].state.x > window.innerWidth + colliders[i].state.width || 
                colliders[i].state.y < colliders[i].state.height || colliders[i].state.y > window.innerHeight + colliders[i].state.height)
                colliders[i].state.alive = false;
            reqAnim = true;
        }
    }

    // if (reqAnim)
    //     requestAnimationFrame(function () { PROCESS() });

    // Sync actors
    for (var i = 0, n = actors.length; i < n; ++i) {
        if (!container.contains(actors[i]))
            container.appendChild(actors[i]);
    }
    var toRemove = [];
    for (var i = 0, n = container.children.length; i < n; ++i) {
        if (!actors.includes(container.children[i]))
            toRemove.push(container.children[i]);
    }
    for (var i = 0, n = toRemove.length; i < n; ++i)
        container.removeChild(toRemove[i]);
} else {
    CACHE["container"] = null;
    CACHE["ts"] = null;
}
