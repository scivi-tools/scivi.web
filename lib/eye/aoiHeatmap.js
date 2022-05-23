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

function findValues(values, aoiID)
{
    if (values) {
        for (var i = 0, n = values.length; i < n; ++i) {
            if (values[i][0] === aoiID)
                return values[i];
        }
    }
    return null;
}

function highlightAOI(imageSpacePt, screenSpacePt)
{
    var aois = CACHE["AOIs"];
    if (!aois)
        return;
    var tooltip = CACHE["Tooltip"];
    var aoisHit = [];
    for (var i = 0; i < aois.length; ++i) {
        if (hitTest(imageSpacePt, aois[i])) {
            aoiVisible = true;
            aoisHit.push(i);
            aois[i].svgPath.setAttribute("stroke", "#BE0000");
        } else {
            aois[i].svgPath.setAttribute("stroke", "#FFF");
        }
    }
    if (aoisHit.length > 0) {
        var tooltipText = null;
        for (var i = aoisHit.length - 1; i >= 0; --i) {
            if (tooltipText)
                tooltipText += " / " + aois[aoisHit[i]].name;
            else
                tooltipText = aois[aoisHit[i]].name;
        }
        const offset = 5;
        tooltip.style.display = "inline";
        tooltip.style.left = (screenSpacePt[0] + offset) + "px";
        tooltip.style.top = (screenSpacePt[1] + offset) + "px";
        var values = CACHE["Values"];
        console.log(values);
        console.log(aoisHit);
        var aoiValues = findValues(values, aoisHit[aoisHit.length - 1]);
        if (aoiValues) {
            for (var i = 0, n = values[0].length; i < n; ++i)
                tooltipText += "<br/>" + values[0][i] + ": " + aoiValues[i];
        }
        tooltip.innerHTML = tooltipText;
    } else {
        tooltip.style.display = "none";
    }
}

function paintAreas(aois, values, minLbl, maxLbl)
{
    CACHE["Values"] = values;
}

function createContainer(pic, aois, values)
{
    var container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

    var sliderContainer = document.createElement("div");
    sliderContainer.style.width = "100%";
    sliderContainer.style.height = "30px";
    sliderContainer.style.textAlign = "center";
    sliderContainer.style.paddingTop = "10px";
    container.appendChild(sliderContainer);

    var n = values.length;

    var sliderLabel = document.createElement("span");
    sliderLabel.innerHTML = "1 / " + n;
    sliderLabel.style.width = "50px";
    sliderLabel.style.height = "30px";
    sliderLabel.style.textAlign = "left";
    sliderLabel.style.display = "inline-block";
    sliderContainer.appendChild(sliderLabel);

    var slider = document.createElement("input");
    slider.type = "range";
    slider.min = 1;
    slider.max = values.length;
    slider.value = 1;
    slider.style.width = "calc(100% - 250px)";
    slider.style.height = "30px";
    slider.style.verticalAlign = "middle";
    sliderContainer.appendChild(slider);

    var imgContainer = document.createElement("div");
    imgContainer.style.width = "100%";
    imgContainer.style.height = "calc(100% - 40px)";
    container.appendChild(imgContainer);

    var imgFrame = document.createElement("div");
    imgFrame.style.width = "800px";
    imgFrame.style.height = "512px";
    imgFrame.style.position = "relative";
    imgFrame.style.top = "50%";
    imgFrame.style.left = "50%";
    imgFrame.style.transform = "translate(-50%, -50%)";
    imgContainer.appendChild(imgFrame);
    
    var img = document.createElement("img");
    img.style.width = "100%";
    img.style.position = "absolute";
    imgFrame.appendChild(img);

    var colorScaleLegendContainer = document.createElement("div");
    colorScaleLegendContainer.style.width = "50px";
    colorScaleLegendContainer.style.position = "relative";
    colorScaleLegendContainer.style.top = "50%";
    colorScaleLegendContainer.style.left = "810px";
    colorScaleLegendContainer.style.transform = "translate(0%, -50%)";

    var colorScaleLegendMax = document.createElement("div");
    colorScaleLegendMax.style.textAlign = "center";
    colorScaleLegendContainer.appendChild(colorScaleLegendMax);

    var colorScaleLegend = document.createElement("div");
    colorScaleLegend.style.width = "50px";
    colorScaleLegend.style.height = "250px";
    colorScaleLegend.style.backgroundImage = "linear-gradient(#f00, #ff0)";
    colorScaleLegendContainer.appendChild(colorScaleLegend);

    var colorScaleLegendMin = document.createElement("div");
    colorScaleLegendMin.style.textAlign = "center";
    colorScaleLegendContainer.appendChild(colorScaleLegendMin);

    CACHE["AOIs"] = aois;

    img.addEventListener("load", function () {
        if (!CACHE["SVG"]) {
            var svg = getNode("svg");
            var scale = 800.0 / img.naturalWidth;
            svg.style.width = 800 + "px";
            svg.style.height = img.naturalHeight * scale + "px";
            svg.style.position = "absolute";
            imgFrame.appendChild(svg);
            imgFrame.appendChild(colorScaleLegendContainer);

            var aois = CACHE["AOIs"];
            var aColor = "#fff";
            if (aois) {
                for (var index = 0; index < aois.length; ++index) {
                    var path = "M " + (aois[index].path[0][0] * scale) + " " + aois[index].path[0][1] * scale + " ";
                    for (var i = 1; i < aois[index].path.length; ++i)
                        path += "L " + (aois[index].path[i][0] * scale) + " " + aois[index].path[i][1] * scale + " ";
                    path += "Z";
                    aois[index].svgPath = getNode("path", { d: path, fill: "transparent", stroke: aColor });
                    svg.appendChild(aois[index].svgPath);
                }
            }

            imgFrame.addEventListener("mousemove", function (e) {
                highlightAOI([ e.offsetX / scale, e.offsetY / scale ], [ e.clientX, e.clientY ]);
            });
            imgFrame.addEventListener("mouseleave", function (e) {
                CACHE["Tooltip"].style.display = "none";
                var aois = CACHE["AOIs"];
                if (aois) {
                    for (var i = 0; i < aois.length; ++i)
                        aois[i].svgPath.setAttribute("stroke", "#FFF");
                }
            });

            CACHE["SVG"] = svg;
            paintAreas(aois, values[0], colorScaleLegendMin, colorScaleLegendMax);
        }
    });

    img.src = pic;

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

    CACHE["Tooltip"] = tooltip;

    slider.addEventListener("input", function () {
        sliderLabel.innerHTML = slider.value + " / " + n;
        paintAreas(aois, values[slider.value - 1], colorScaleLegendMin, colorScaleLegendMax);
    });

    ADD_VISUAL(container);
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["Picture"] && INPUT["Picture"] &&
        HAS_INPUT["AOIs"] && INPUT["AOIs"] &&
        HAS_INPUT["Values"] && INPUT["Values"]) {
        if (!CACHE["AOIs"])
            createContainer(INPUT["Picture"], INPUT["AOIs"], INPUT["Values"]);
    }
} else {
    CACHE["AOIs"] = null;
    CACHE["SVG"] = null;
    CACHE["Tooltip"] = null;
    CACHE["Values"] = null;
}
