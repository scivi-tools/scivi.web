const IDX_AOI_ID = 0;
const IDX_AOI_VALUE = 1;
const IDX_AOI_AVU = 2;
const IDX_AOI_AVV = 3;
const IDX_AOI_AVT = 4;

function getNode(n, v)
{
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, p, v[p]);
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

function findValuesIndex(values, aoiID)
{
    if (values) {
        for (var i = 1, n = values.length; i < n; ++i) {
            if (values[i][IDX_AOI_ID] === aoiID)
                return i;
        }
    }
    return -1;
}

function highlightAOI(imageSpacePt, screenSpacePt)
{
    var aois = CACHE["AOIs"];
    if (!aois)
        return;
    var tooltip = CACHE["Tooltip"];
    var aoisHit = [];
    var aoiValuesIndex = -1;
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
        aoiValuesIndex = findValuesIndex(values, aoisHit[aoisHit.length - 1]);
        if (aoiValuesIndex >= 0) {
            var aoiValues = values[aoiValuesIndex];
            for (var i = 0, n = values[0].length; i < n; ++i)
                tooltipText += "<br/>" + values[0][i] + ": " + (i === IDX_AOI_ID ? aoiValues[i] : aoiValues[i].toFixed(2));
        }
        tooltip.innerHTML = tooltipText;
    } else {
        tooltip.style.display = "none";
    }
    var circles = CACHE["Circles"];
    if (circles) {
        for (var i = 0, n = circles.length; i < n; ++i)
            circles[i].setAttribute("visibility", i === aoiValuesIndex - 1 ? "visible" : "hidden");
    }
}

function fillColor(value, minVal, maxVal)
{
    var t = minVal === maxVal ? 1.0 : (value - minVal) / (maxVal - minVal);
    var h = (1.0 - t) * 180.0;
    return "hsl(" + h + ", 100%, 50%, 0.5)";
}

function circleRadius(value, minVal, maxVal)
{
    var rFrom = 5;
    var rTo = 30;
    var t = minVal === maxVal ? 1.0 : (value - minVal) / (maxVal - minVal);
    return rFrom + t * (rTo - rFrom);
}

function paintAreas(aois, values, minLbl, maxLbl)
{
    CACHE["Values"] = values;
    if (values.length < 2)
        return;

    var svg = CACHE["SVG"];
    var circles = CACHE["Circles"];
    var size = CACHE["ImageSize"];
    var minVal = values[1][IDX_AOI_VALUE];
    var maxVal = values[1][IDX_AOI_VALUE];
    var minT = values[1][IDX_AOI_AVT];
    var maxT = values[1][IDX_AOI_AVT];
    if (circles) {
        for (var i = 0, n = circles.length; i < n; ++i)
            svg.removeChild(circles[i]);
    }
    circles = [];
    var total = 0.0;
    for (var i = 1, n = values.length; i < n; ++i) {
        if (values[i][IDX_AOI_VALUE] < minVal)
            minVal = values[i][IDX_AOI_VALUE];
        if (values[i][IDX_AOI_VALUE] > maxVal)
            maxVal = values[i][IDX_AOI_VALUE];
        if (values[i][IDX_AOI_AVT] < minT)
            minT = values[i][IDX_AOI_AVT];
        if (values[i][IDX_AOI_AVT] > maxT)
            maxT = values[i][IDX_AOI_AVT];
        total += values[i][IDX_AOI_VALUE];
    }
    minLbl.innerHTML = minVal.toFixed(2);
    if (total <= 1.0)
        maxLbl.innerHTML = Math.round(total * 100.0) + "%<br/>" + maxVal.toFixed(2);
    else
        maxLbl.innerHTML = maxVal.toFixed(2);
    for (var i = 1, n = values.length; i < n; ++i) {
        if (!isNaN(values[i][IDX_AOI_AVU]) && !isNaN(values[i][IDX_AOI_AVV]) && !isNaN(values[i][IDX_AOI_AVT])) {
            var c = getNode("circle", { cx: values[i][IDX_AOI_AVU] * size[0],
                                        cy: values[i][IDX_AOI_AVV] * size[1],
                                        fill: "rgba(190, 0, 0, 0.5)",
                                        stroke: "rgba(190, 0, 0, 1.0)",
                                        r: circleRadius(values[i][IDX_AOI_AVT], minT, maxT),
                                        visibility: "hidden" });
            circles.push(c);
            svg.appendChild(c);
        }
    }
    for (var i = 0, n = aois.length; i < n; ++i) {
        var idx = findValuesIndex(values, i);
        if (idx === -1)
            aois[i].svgPath.setAttribute("fill", "url(#diagonalHatch)");
        else
            aois[i].svgPath.setAttribute("fill", fillColor(values[idx][IDX_AOI_VALUE], minVal, maxVal));
    }
    CACHE["Circles"] = circles;
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

    var imgDiv = document.createElement("div");
    imgDiv.style.width = "100%";
    imgDiv.style.position = "absolute";
    imgFrame.appendChild(imgDiv);
    
    var img = document.createElement("img");
    img.style.width = "100%";
    img.style.position = "absolute";
    imgDiv.appendChild(img);

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
    colorScaleLegend.style.backgroundImage = "linear-gradient(hsl(0, 100%, 50%), hsl(32, 100%, 50%), hsl(64, 100%, 50%), hsl(128, 100%, 50%), hsl(180, 100%, 50%))";
    colorScaleLegendContainer.appendChild(colorScaleLegend);

    var colorScaleLegendMin = document.createElement("div");
    colorScaleLegendMin.style.textAlign = "center";
    colorScaleLegendContainer.appendChild(colorScaleLegendMin);

    CACHE["AOIs"] = aois;

    img.addEventListener("load", function () {
        if (!CACHE["SVG"]) {
            var svg = getNode("svg");
            var scale = 800.0 / img.naturalWidth;
            CACHE["ImageSize"] = [ img.naturalWidth * scale, img.naturalHeight * scale ];
            svg.style.width = 800 + "px";
            svg.style.height = img.naturalHeight * scale + "px";
            svg.style.position = "absolute";
            imgDiv.appendChild(svg);
            imgFrame.appendChild(colorScaleLegendContainer);

            var aois = CACHE["AOIs"];
            var aColor = "#fff";
            if (aois) {
                for (var index = 0; index < aois.length; ++index) {
                    var path = "M " + (aois[index].path[0][0] * scale) + " " + aois[index].path[0][1] * scale + " ";
                    for (var i = 1; i < aois[index].path.length; ++i)
                        path += "L " + (aois[index].path[i][0] * scale) + " " + aois[index].path[i][1] * scale + " ";
                    path += "Z";
                    aois[index].svgPath = getNode("path", { d: path, fill: "transparent", stroke: aColor, width: "100px", height: "100px" });
                    svg.appendChild(aois[index].svgPath);
                }
            }

            var defs = getNode("defs", {});
            var pattern = getNode("pattern", { id: "diagonalHatch", patternUnits: "userSpaceOnUse", width: "4", height: "4" });
            var hatch = getNode("path", { d: "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2",
                                          style: "stroke: white; stroke-width: 1" });
            pattern.appendChild(hatch);
            defs.appendChild(pattern);
            svg.appendChild(defs);

            imgDiv.addEventListener("mousemove", function (e) {
                highlightAOI([ e.offsetX / scale, e.offsetY / scale ], [ e.clientX, e.clientY ]);
            });
            imgDiv.addEventListener("mouseleave", function (e) {
                CACHE["Tooltip"].style.display = "none";
                var aois = CACHE["AOIs"];
                if (aois) {
                    for (var i = 0, n = aois.length; i < n; ++i)
                        aois[i].svgPath.setAttribute("stroke", "#FFF");
                }
                var circles = CACHE["Circles"];
                if (circles) {
                    for (var i = 0, n = circles.length; i < n; ++i)
                        circles[i].setAttribute("visibility", "hidden");
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
    CACHE["Circles"] = null;
    CACHE["ImageSize"] = null;
}
