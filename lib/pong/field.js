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
    const tPhi = (box.x2 - box.x1) / (box.y2 - box.y1);
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
    return { x: v.x - 2.0 * d * n.x, y: v.y - 2.0 * d * n.y };
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

    // Collide and move actors
    var reqAnim = false;
    for (var i = 0, n = actors.length; i < n; ++i) {
        if (actors[i].actorType === "ball") {
            const oldPos = { x: actors[i].state.x, y: actors[i].state.y };
            actors[i].state.x += actors[i].state.vx * actors[i].state.speed * delta;
            actors[i].state.y += actors[i].state.vy * actors[i].state.speed * delta;
            const bboxI = calcBBox(actors[i]);
            for (var j = 0; j < n; ++j) {
                if (i !== j) {
                    var bboxJ = calcBBox(actors[j]);
                    if (bboxIntersectsBBox(bboxI, bboxJ)) {
                        actors[i].state.x = oldPos.x;
                        actors[i].state.y = oldPos.y;
                        var normal = actors[j].actorType === "paddle" ? boxNormal(bboxJ, oldPos) : circleNormal(bboxJ, oldPos);
                        var newV = reflect({ x: actors[i].state.vx, y: actors[i].state.vy }, normal);
                        actors[i].state.vx = newV.x;
                        actors[i].state.vy = newV.y;
                    }
                }
            }
            actors[i].style.left = (actors[i].state.x - actors[i].state.width / 2.0) + "px";
            actors[i].style.top = (actors[i].state.y - actors[i].state.height / 2.0) + "px";
            if (actors[i].state.x < 0.0 || actors[i].state.x > window.innerWidth || 
                actors[i].state.y < 0.0 || actors[i].state.y > window.innerHeight)
                actors[i].state.alive = false;
            reqAnim = true;
        }
    }

    if (reqAnim)
        requestAnimationFrame(function () { PROCESS() });

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
