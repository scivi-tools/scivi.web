
function getNode(n, v)
{
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, p.replace(/[A-Z]/g, function(m, p, o, s) { return "-" + m.toLowerCase(); }), v[p]);
    }
    return n
}

function pointInPolygon(pt, poly)
{
    // By W. Randolph Franklin, https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        if (((poly[i][1] > pt[1]) != (poly[j][1] > pt[1])) &&
            (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]))
            c = !c;
    }
    return c;
}

function pointInBBox(pt, bbox)
{
    return pt[0] >= bbox[0] && pt[1] >= bbox[1] && pt[0] <= bbox[2] && pt[1] <= bbox[3];
}

function hitTest(pt, aoi)
{
    return pointInBBox(pt, aoi.bbox) && pointInPolygon(pt, aoi.path);
}

function isParent(cA, cB)
{
    if (!cA.children)
        return false;
    for (var i = 0; i < cA.children.length; ++i) {
        if (cA.children[i] === cB || isParent(cA.children[i], cB))
            return true;
    }
    return false;
}

function highlightAOI(imageSpacePt, screenSpacePt)
{
    var aois = CACHE["AOIs"];
    if (!aois)
        return;
    var tooltip = CACHE["tooltip"];
    var aoisHit = [];
    for (var i = 0; i < aois.length; ++i) {
        if (hitTest(imageSpacePt, aois[i])) {
            aoiVisible = true;
            aoisHit.push(aois[i]);
            aois[i].activeSVG.setAttribute("visibility", "visible");
        } else {
            aois[i].activeSVG.setAttribute("visibility", "hidden");
        }
    }
    if (aoisHit.length > 0) {
        aoisHit.sort(function(cA, cB) {
            return isParent(cA, cB) ? -1 : 1;
        });
        var tooltipText = null;
        for (var i = 0; i < aoisHit.length; ++i) {
            if (tooltipText)
                tooltipText += " / " + aoisHit[i].name;
            else
                tooltipText = aoisHit[i].name;
        }
        const offset = 5;
        tooltip.style.display = "inline";
        tooltip.style.left = (screenSpacePt[0] + offset) + "px";
        tooltip.style.top = (screenSpacePt[1] + offset) + "px";
        tooltip.innerHTML = tooltipText;
    } else {
        tooltip.style.display = "none";
    }
}

function toggleAOI(index)
{
    var aois = CACHE["AOIs"];
    if (index < aois.length) {
        aois[index].selectedSVG.setAttribute("visibility",
                                             aois[index].selectedSVG.getAttribute("visibility") === "visible" ?
                                             "hidden" : "visible");
    }
}

if (IN_VISUALIZATION) {
    if (!CACHE["cross"]) {
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

        CACHE["AOIs"] = INPUT["AOIs"];

        img.addEventListener("load", function () {
            CACHE["imgSize"] = [ img.naturalWidth, img.naturalHeight ];

            if (!CACHE["svg"]) {
                var svg = getNode("svg");
                var scale = 800.0 / img.naturalWidth;
                svg.style.width = 800 + "px";
                svg.style.height = img.naturalHeight * scale + "px";
                svg.style.position = "relative";
                imgFrame.appendChild(svg);

                var aois = CACHE["AOIs"];
                var aColor = SETTINGS_VAL["Active AOI stroke color"];
                var sColor = SETTINGS_VAL["Selected AOI stroke color"];
                if (aois) {
                    for (var index = 0; index < aois.length; ++index) {
                        var path = "M " + (aois[index].path[0][0] * scale) + " " + aois[index].path[0][1] * scale + " ";
                        for (var i = 1; i < aois[index].path.length; ++i)
                            path += "L " + (aois[index].path[i][0] * scale) + " " + aois[index].path[i][1] * scale + " ";
                        path += "Z";
                        aois[index].activeSVG = getNode("path", { d: path, fill: "transparent", stroke: aColor, visibility: "hidden" });
                        aois[index].selectedSVG = getNode("path", { d: path, fill: "transparent", stroke: sColor, visibility: "hidden" });
                        svg.appendChild(aois[index].activeSVG);
                        svg.appendChild(aois[index].selectedSVG);
                    }
                }

                imgFrame.addEventListener("mousemove", function (e) {
                    highlightAOI([ e.offsetX / scale, e.offsetY / scale ], [ e.clientX, e.clientY ]);
                });
                imgFrame.addEventListener("mouseleave", function (e) {
                    CACHE["tooltip"].style.display = "none";
                    var aois = CACHE["AOIs"];
                    if (aois) {
                        for (var i = 0; i < aois.length; ++i)
                            aois[i].activeSVG.setAttribute("visibility", "hidden");
                    }
                });

                CACHE["svg"] = svg;
            }
        });

        CACHE["img"] = img;

        var cross = document.createElement("div");
        cross.style.width = "10px";
        cross.style.height = "10px";
        cross.style.background = "radial-gradient(#FFF, #00ABFF, #000)";
        cross.style.borderRadius = "50%";
        cross.style.border = "#FFF solid 1px";
        cross.style.position = "absolute";
        cross.style.top = "50%";
        cross.style.left = "50%";
        cross.style.transform = "translate(-50%, -50%)";
        imgFrame.appendChild(cross);

        var tooltip = document.createElement("div");
        tooltip.style.position = "absolute";
        tooltip.style.background = "#fefeff";
        tooltip.style.opacity = "0.9";
        tooltip.style.borderRadius = "5px";
        tooltip.style.border = "1px solid #333333";
        tooltip.style.padding = "3px";
        tooltip.style.pointerEvents = "none";
        tooltip.style.zIndex = "10000";
        tooltip.style.display = "none";
        container.appendChild(tooltip);

        CACHE["cross"] = cross;
        CACHE["tooltip"] = tooltip;

        ADD_VISUAL(container);
    }
    if (HAS_INPUT["Picture"] && INPUT["Picture"] && CACHE["img"].src !== INPUT["Picture"])
        CACHE["img"].src = INPUT["Picture"];
    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] && CACHE["cross"]) {
        var st = CACHE["cross"].style;
        var gaze = INPUT["Gaze"];
        st.left = (gaze[1] * 100.0) + "%";
        st.top = (gaze[2] * 100.0) + "%";
        var imgSize = CACHE["imgSize"];
        if (imgSize)
            highlightAOI([ gaze[1] * imgSize[0], gaze[2] * imgSize[1] ], [ 100, 100 ]);
        if (gaze[gaze.length - 1] === "SELECT")
            toggleAOI(gaze[gaze.length - 2]);
    }
} else {
    CACHE["AOIs"] = null;
    CACHE["cross"] = null;
    CACHE["tooltip"] = null;
    CACHE["imgSize"] = null;
    CACHE["img"] = null;
    CACHE["svg"] = null;
}
