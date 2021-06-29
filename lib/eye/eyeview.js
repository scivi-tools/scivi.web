
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

function highlightAOI(imageSpacePt, screenSpacePt)
{
    const offset = 5;
    var tooltip = CACHE["tooltip"];
    var aois = CACHE["AOIs"];
    var aoiVisible = false;
    var tooltipText = null;
    if (!aois)
        return;
    for (var i = 0; i < aois.length; ++i) {
        if (hitTest(imageSpacePt, aois[i])) {
            aoiVisible = true;
            if (tooltipText)
                tooltipText += " / " + aois[i].name;
            else
                tooltipText = aois[i].name;
            aois[i].svg.setAttribute("visibility",  "visible");
        } else {
            aois[i].svg.setAttribute("visibility",  "hidden");
        }
    }
    if (aoiVisible) {
        tooltip.style.display = "inline";
        tooltip.style.left = (screenSpacePt[0] + offset) + "px";
        tooltip.style.top = (screenSpacePt[1] + offset) + "px";
        tooltip.innerHTML = tooltipText;
    } else {
        tooltip.style.display = "none";
    }
}

function dumpGazeTrack(gt)
{
    return "";
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["Picture"] && INPUT["Picture"] && !CACHE["cross"]) {
        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var imgFrame = document.createElement("div");
        imgFrame.style.width = "800px";
        imgFrame.style.position = "absolute";
        imgFrame.style.top = "50%";
        imgFrame.style.left = "50%";
        imgFrame.style.transform = "translate(-50%, -50%)";
        container.appendChild(imgFrame);
        
        var img = document.createElement("img");
        img.style.width = "100%";
        img.style.position = "absolute";
        imgFrame.appendChild(img);

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "10px 0px 0px 0px";
        toolbar.style.textAlign = "center";
        var rec = document.createElement("div");
        rec.innerHTML = "Start Recording";
        rec.classList.add("scivi_button");
        rec.addEventListener("click", function (e) {
            var r = CACHE["rec"];
            if (CACHE["rec"]) {
                rec.innerHTML = "Start Recording";
                rec.classList.remove("pushed");
                CACHE["rec"] = false;
                if (CACHE["gazeTrack"]) {
                    var filename = prompt("Enter name of file to save", "eyetrack.csv");
                    if (!filename)
                        return;
                    if (!filename.includes("."))
                        filename += ".csv";
                    var content = dumpGazeTrack(CACHE["gazeTrack"]);
                    var element = document.createElement("a");
                    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
                    element.setAttribute("download", filename);
                    element.style.display = "none";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                }
            } else {
                rec.innerHTML = "Stop Recording";
                rec.classList.add("pushed");
                rec.pushed = true;
                CACHE["rec"] = true;
            }
        });
        toolbar.appendChild(rec)
        container.appendChild(toolbar);

        CACHE["AOIs"] = INPUT["AOIs"];
        CACHE["rec"] = false;
        CACHE["gazeTrack"] = [];

        img.addEventListener("load", function () {
            var svg = getNode("svg");
            var scale = 800.0 / img.naturalWidth;
            svg.style.width = 800 + "px";
            svg.style.height = img.naturalHeight * scale + "px";
            svg.style.position = "relative";
            imgFrame.appendChild(svg);

            var aois = CACHE["AOIs"];
            if (aois) {
                for (var index = 0; index < aois.length; ++index) {
                    var path = "M " + (aois[index].path[0][0] * scale) + " " + aois[index].path[0][1] * scale + " ";
                    for (var i = 1; i < aois[index].path.length; ++i)
                        path += "L " + (aois[index].path[i][0] * scale) + " " + aois[index].path[i][1] * scale + " ";
                    path += "Z";
                    aois[index].svg = getNode("path", { d: path, fill: "transparent", stroke: "#FFF", visibility: "hidden" });
                    svg.appendChild(aois[index].svg);
                }
            }

            CACHE["imgSize"] = [ img.naturalWidth, img.naturalHeight ];

            imgFrame.addEventListener("mousemove", function (e) {
                highlightAOI([ e.offsetX / scale, e.offsetY / scale ], [ e.clientX, e.clientY ]);
            });
            imgFrame.addEventListener("mouseleave", function (e) {
                CACHE["tooltip"].style.display = "none";
                var aois = CACHE["AOIs"];
                if (aois) {
                    for (var i = 0; i < aois.length; ++i)
                        aois[i].svg.setAttribute("visibility",  "hidden");
                }
            });
        });

        img.src = INPUT["Picture"];

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
    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] && CACHE["cross"]) {
        var st = CACHE["cross"].style;
        var gaze = INPUT["Gaze"];
        st.left = ((1.0 - gaze[0]) * 100.0) + "%";
        st.top = ((1.0 - gaze[1]) * 100.0) + "%";
        if (CACHE["rec"])
            CACHE["gazeTrack"].push(gaze);
        var imgSize = CACHE["imgSize"];
        highlightAOI([ gaze[0] * imgSize[0], gaze[1] * imgSize[1] ], [ 10, 10 ]);
    }
} else {
    CACHE["AOIs"] = null;
    CACHE["rec"] = false;
    CACHE["gazeTrack"] = null;
    CACHE["cross"] = null;
    CACHE["tooltip"] = null;
    CACHE["imgSize"] = null;
}
