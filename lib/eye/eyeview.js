
function getNode(n, v)
{
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, p.replace(/[A-Z]/g, function(m, p, o, s) { return "-" + m.toLowerCase(); }), v[p]);
    }
    return n
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["Picture"] && INPUT["Picture"] && !CACHE["cross"]) {
        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";

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

        CACHE["AOIs"] = INPUT["AOIs"];

        img.addEventListener("load", function () {
            var svg = getNode("svg");
            var scale = 800.0 / img.naturalWidth;
            svg.style.width = 800 + "px";
            svg.style.height = img.naturalHeight * scale + "px";
            svg.style.position = "relative";
            imgFrame.appendChild(svg);

            var aois = CACHE["AOIs"];
            for (var index = 0; index < aois.length; ++index) {
                var path = "M " + (aois[index].path[0][0] * scale) + " " + aois[index].path[0][1] * scale + " ";
                for (var i = 1; i < aois[index].path.length; ++i)
                    path += "L " + (aois[index].path[i][0] * scale) + " " + aois[index].path[i][1] * scale + " ";
                path += "Z";
                aois.svg = getNode("path", { d: path, fill: "transparent", stroke: "#FFF" });
                svg.appendChild(aois.svg);
            }
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

        CACHE["cross"] = cross;
        ADD_VISUAL(container);
    }
    if (HAS_INPUT["Gaze"] && INPUT["Gaze"] && CACHE["cross"]) {
        var st = CACHE["cross"].style;
        var gaze = INPUT["Gaze"];
        st.left = (gaze[0] * 100.0) + "%";
        st.top = ((1.0 - gaze[1]) * 100.0) + "%";
    }
} else {
    CACHE["cross"] = null;
}
