const IDX_T = 0;
const IDX_U = 1;
const IDX_V = 2;

const MIN_R = 5;
const MAX_R = 20;

function getNode(n, v, f)
{
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, f ? p : p.replace(/[A-Z]/g, function(m, p, o, s) { return "-" + m.toLowerCase(); }), v[p]);
    }
    return n
}

function circle(svg, x, y, r)
{
    svg.appendChild(getNode("circle", { cx: x, cy: y, r: r, fill: "rgba(255, 0, 0, 0.3)", stroke: "#f00" }));
}

function marker(svg)
{
    var defs = getNode("defs", {});
    var marker = getNode("marker", { id: "arrowhead", markerWidth: 5, markerHeight: 3.5, refX: 0, refY: 1.75, orient: "auto" }, true);
    var poly = getNode("polygon", { points: "0 0, 5 1.75, 0 3.5", fill: "rgba(0, 180, 0, 0.6)" });
    marker.appendChild(poly);
    defs.appendChild(marker);
    svg.appendChild(defs);
}

function arrow(svg, path)
{
    svg.appendChild(getNode("path", { d: path, fill: "transparent", stroke: "rgba(0, 180, 0, 0.6)", strokeWidth: "2", markerEnd: "url(#arrowhead)" }));
}

function map(v, fromMin, fromMax, toMin, toMax)
{
    return toMin + (v - fromMin) / (fromMax - fromMin) * (toMax - toMin);
}

if (IN_VISUALIZATION) {
    if (!CACHE["img"]) {
        CACHE["saccades"] = HAS_INPUT["Saccades"] ? INPUT["Saccades"] : null;
        CACHE["fixations"] = HAS_INPUT["Fixations"] ? INPUT["Fixations"] : null;

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

                marker(svg);

                var fixations = CACHE["fixations"];
                if (fixations) {
                    var minLen = undefined;
                    var maxLen = undefined;
                    var startTime = undefined;
                    var avU = 0;
                    var avV = 0;
                    var avN = 0;
                    for (var i = 0, n = fixations.length, fID = -1; i < n; ++i) {
                        if (i === n - 1 || fixations[i][fixations[i].length - 1] != fID) {
                            fID = fixations[i][fixations[i].length - 1];
                            if (startTime !== undefined) {
                                var len = fixations[i][IDX_T] - startTime;
                                if (minLen === undefined || len < minLen)
                                    minLen = len;
                                if (maxLen === undefined || len > maxLen)
                                    maxLen = len;
                            }
                            startTime = fixations[i][IDX_T];
                        }
                    }
                    for (var i = 0, n = fixations.length, fID = -1; i < n; ++i) {
                        if (fixations[i][fixations[i].length - 1] !== fID) {
                            if (avN > 0) {
                                circle(svg,
                                       avU / avN * w,
                                       avV / avN * h,
                                       map(fixations[i][IDX_T] - startTime, minLen, maxLen, MIN_R, MAX_R));
                            }
                            startTime = fixations[i][IDX_T];
                            avU = fixations[i][IDX_U];
                            avV = fixations[i][IDX_V];
                            avN = 1;
                            fID = fixations[i][fixations[i].length - 1];
                        } else {
                            avU += fixations[i][IDX_U];
                            avV += fixations[i][IDX_V];
                            ++avN;
                            if (i === n - 1) {
                                circle(svg,
                                       avU / avN * w,
                                       avV / avN * h,
                                       map(fixations[i][IDX_T] - startTime, minLen, maxLen, MIN_R, MAX_R));
                            }
                        }
                    }
                    /*avN = 0;
                    var prevU = -1;
                    var prevV = -1;
                    for (var i = 0, n = fixations.length, fID = -1; i < n; ++i) {
                        if (fixations[i][fixations[i].length - 1] !== fID) {
                            if (avN > 0) {
                                var curU = avU / avN * w;
                                var curV = avV / avN * h;
                                if (prevU >= 0)
                                    arrow(svg, "M " + prevU + " " + prevV + " L " + curU + " " + curV);
                                prevU = curU;
                                prevV = curV;
                            }
                            startTime = fixations[i][IDX_T];
                            avU = fixations[i][IDX_U];
                            avV = fixations[i][IDX_V];
                            avN = 1;
                            fID = fixations[i][fixations[i].length - 1];
                        } else {
                            avU += fixations[i][IDX_U];
                            avV += fixations[i][IDX_V];
                            ++avN;
                            if (i === n - 1) {
                                var curU = avU / avN * w;
                                var curV = avV / avN * h;
                                if (prevU >= 0)
                                    arrow(svg, "M " + prevU + " " + prevV + " L " + curU + " " + curV);
                            }
                        }
                    }*/
                }

                /*var saccades = CACHE["saccades"];
                if (saccades) {
                    var path = null;
                    for (var i = 0, n = saccades.length, sID = -1; i < n; ++i) {
                        if (saccades[i][saccades[i].length - 1] != sID) {
                            if (path)
                                arrow(svg, path);
                            path = "M " + (saccades[i][IDX_U] * w) + " " + (saccades[i][IDX_V] * h) + " ";
                            sID = saccades[i][saccades[i].length - 1];
                        } else {
                            path += "L " + (saccades[i][IDX_U] * w) + " " + (saccades[i][IDX_V] * h) + " ";
                            if (i === n - 1)
                                arrow(svg, path);
                        }
                    }
                }*/

                CACHE["svg"] = svg;
            }
        });

        CACHE["img"] = img;

        ADD_VISUAL(container);
    }

    if (HAS_INPUT["Picture"] && INPUT["Picture"] && CACHE["img"].src !== INPUT["Picture"])
        CACHE["img"].src = INPUT["Picture"];
} else {
    CACHE["img"] = null;
    CACHE["svg"] = null;
    CACHE["saccades"] = null;
    CACHE["fixations"] = null;
}
