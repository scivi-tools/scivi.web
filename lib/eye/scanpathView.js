const IDX_AOI_ID = 0;
const IDX_AOI_VALUE = 1;
const IDX_AOI_AVU = 2;
const IDX_AOI_AVV = 3;
const IDX_AOI_AVT = 4;

function getNode(n, v, f)
{
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, f ? p : p.replace(/[A-Z]/g, function(m, p, o, s) { return "-" + m.toLowerCase(); }), v[p]);
    }
    return n
}

function circle(svg, x, y, r, name)
{
    var c = getNode("circle", { cx: x, cy: y, r: r, fill: "rgba(255, 0, 0, 0.3)", stroke: "#f00" });
    var t = getNode("text", { x: x, y: y, textAnchor: "middle", fill: "#fff", dy: ".3em" });
    t.innerHTML = name;
    svg.appendChild(c);
    svg.appendChild(t);
}

function center(bbox, index, radius)
{
    /**
     Caviar positioning algorithm.
     bbox - area in wich center to place the caviar.
     index - number of caviar egg to place (staring with 1).
     radius - caviar egg radius.
     Idea:
     If index == 1, return center of bbox.
     Else place the egg on the ring with radius R around the center of bbox, and all the eggs should be placed tight together.
     How many eggs there are on the ring with radius R = i * 2 * radius?
     n = 2 * pi * i * 2 * radius / (2 * radius) = pi * 2 * i ~ 6 * i
     How many eggs fit in the ring with radius R = n * 2 * radius? This is the n-th ring.
     1 + sum(i = 1, i = n, 6 * i) = [using a sum of arythmetic progression] = 1 + (6 + 6 * n) / 2 * n = 1 + 3 * n + 3 * n * n
     Now for given index, let's find with n we need to suite the ring:
     index = 1 + 3 * n + 3 * n * n => n = ((9 - 12 * (1 - index)) - 3) / 6
     Now we know the desired radius where to place index-th egg:
     R = n * 2 * radius
     We only need to find out angle phi now to place the egg on this ring. This will be quite trivial now.
    **/
    var c = { x: (bbox[0] + bbox[2]) / 2.0, y: (bbox[1] + bbox[3]) / 2.0 };
    var ringNum = Math.ceil((Math.sqrt(9 - 12 * (1 - index)) - 3) / 6);
    if (ringNum === 0)
        return c;
    var maxPoints = 1 + 3 * ringNum * (ringNum + 1);
    var pointsAtLastRing = 6 * ringNum;
    var i = pointsAtLastRing - (maxPoints - index);
    var r = ringNum * 2 * radius;
    var phi = 2 * Math.PI / pointsAtLastRing * i;
    return { x: c.x + r * Math.cos(phi), y: c.y + r * Math.sin(phi) };
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["Scanpath"] && HAS_INPUT["AOIs"] && INPUT["Scanpath"]) {
        if (!CACHE["img"]) {
            CACHE["scanpath"] = INPUT["Scanpath"];
            CACHE["aois"] = INPUT["AOIs"];

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
                if (!CACHE["svg"]) {
                    var w = 800;
                    var scale = w / img.naturalWidth;
                    var h = img.naturalHeight * scale;
                    var svg = getNode("svg");
                    svg.style.width = w + "px";
                    svg.style.height = h + "px";
                    svg.style.position = "relative";
                    imgFrame.appendChild(svg);

                    var scanpath = CACHE["scanpath"];
                    if (scanpath) {
                        var aois = CACHE["aois"];
                        var aoisFill = {};
                        for (var i = 0, n = scanpath.length; i < n; ++i) {
                            for (var j = 0, m = scanpath[i].length; j < m; ++j) {
                                var aoiID = scanpath[i][j][IDX_AOI_ID];
                                if (aoisFill[aoiID] === undefined)
                                    aoisFill[aoiID] = 1;
                                else
                                    ++aoisFill[aoiID];
                                var pt = center(aois[aoiID].bbox, aoisFill[aoiID], 20);
                                circle(svg, pt.x * scale, pt.y * scale, 20 * scale, i + 1);
                            }
                        }
                    }

                    CACHE["svg"] = svg;
                }
            });

            CACHE["img"] = img;

            ADD_VISUAL(container);
        }

        if (HAS_INPUT["Picture"] && INPUT["Picture"] && CACHE["img"].src !== INPUT["Picture"])
            CACHE["img"].src = INPUT["Picture"];
    }
} else {
    CACHE["img"] = null;
    CACHE["svg"] = null;
    CACHE["scanpath"] = null;
    CACHE["aois"] = null;
}
