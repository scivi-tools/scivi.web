var elemById = function (svg, id) {
    var keys = Object.keys(svg.all);
    for (var i = 0; i < keys.length; ++i) {
        if (svg.all[i].id.toLowerCase() === id.toLowerCase())
            return svg.all[i];
    }
    return null;
};

var lerp = function (dstMin, dstMax, srcMin, srcMax, src) {
    var result = dstMin + ((src - srcMin) / (srcMax - srcMin)) * (dstMax - dstMin);
    if (dstMin < dstMax) {
        if (result > dstMax)
            result = dstMax;
        else if (result < dstMin)
            result = dstMin;
    } else {
        if (result < dstMax)
            result = dstMax;
        else if (result > dstMin)
            result = dstMin;
    }
    return result;
}

if (IN_VISUALIZATION) {
    var electrodes = CACHE["Electrodes"];
    if (!electrodes) {
        var container = $("<div/>");

        electrodes = document.createElement("object");
        electrodes.data = "storage/21_10-20.svg";
        electrodes.style = "display: inline-block";
        electrodes.addEventListener("load", function() {
            CACHE["Loaded"] = true;
        }, false);
        container.append(electrodes);

        var tooltip = $("<div/>", {
            id: "impedance-ttip",
            css: {
                position: "absolute",
                background: "#fefeff",
                opacity: 0.9,
                borderRadius: "5px",
                border: "1px solid #333333",
                padding: "3px",
                pointerEvents: "none",
                zIndex: 10000,
                display: "none"
            }
        });
        container.append(tooltip);

        var legend = $("<div/>", {
            css: {
                display: "inline-block",
                textAlign: "center"
            }
        });
        var minVal = $("<div/>", {
            id: "impedance-min",
            text: SETTINGS_VAL["Threshold"] + " kΩ",
        });
        var maxVal = $("<div/>", {
            id: "impedance-max",
            text: "∞"
        });
        var zBlock = $("<div/>", {
            id: "impedance-zblock",
            css: {
                background: "#929292",
                border: "1px solid #666",
                borderRadius: "5px",
                width: "30px",
                height: "15px",
                display: "inherit"
            }
        });
        var zVal = $("<div/>", {
            id: "impedance-z",
            text: "Z"
        });
        var sBlock = $("<div/>", {
            id: "impedance-sblock",
            css: {
                background: "#ff00ff",
                border: "1px solid #666",
                borderRadius: "5px",
                width: "30px",
                height: "15px",
                display: "inherit"
            }
        });
        var sVal = $("<div/>", {
            id: "impedance-s",
            text: "0 kΩ"
        });
        var scale = $("<div/>", {
            id: "impedance-scale",
            css: {
                background: "linear-gradient(to top, hsl(104, 75%, 50%), hsl(0, 100%, 50%))",
                width: "30px",
                border: "1px solid #666",
                borderRadius: "5px",
                display: "inherit"
            }
        });
        legend.append(zVal);
        legend.append(zBlock);
        legend.append(maxVal);
        legend.append(scale);
        legend.append(minVal);
        legend.append(sBlock);
        legend.append(sVal);
        container.append(legend);

        ADD_VISUAL(container[0]);
        CACHE["Electrodes"] = electrodes;
        CACHE["EventListeners"] = {};
        CACHE["Tooltip"] = tooltip;
        CACHE["Values"] = {};
    }

    var loaded = CACHE["Loaded"];
    if (loaded && HAS_INPUT["EEG"]) {
        var th = SETTINGS_VAL["Threshold"];
        var cap = th * 2;
        var svg = electrodes.contentDocument;
        var eeg = INPUT["EEG"];
        var vals = CACHE["Values"];
        if ($("#impedance-scale").height() === 0) {
            $("#impedance-scale").height(svg.documentElement.clientHeight - 
                                         $("#impedance-min").height() -
                                         $("#impedance-max").height() -
                                         $("#impedance-zblock").height() -
                                         $("#impedance-z").height() -
                                         $("#impedance-sblock").height() -
                                         $("#impedance-s").height());
        }
        for (var i = 0; i < eeg[0].length; ++i) {
            var elName = eeg[0][i];
            var elVal = eeg[1][i];
            var el = elemById(svg, elName);
            const offset = 5;
            if (el) {
                el.style = elVal < 0 ? 
                           "fill: #929292" : 
                           elVal < 1 ?
                           "fill: #ff00ff" :
                           "fill: hsl(" + lerp(104, 0, th, cap, elVal) + ", " + lerp(75, 100, th, cap, elVal) + "%, 50%)";
                vals[elName.toLowerCase()] = elVal;
                var tt = CACHE["Tooltip"];
                if (tt[0]["host"] && tt[0]["host"].id.toLowerCase() === elName.toLowerCase())
                    tt.html(elVal + " kΩ");
                if (!CACHE["EventListeners"][elName]) {
                    var p = el.parentElement;
                    p["mainEl"] = el;
                    p.addEventListener("mouseover", function (e) {
                        var tt = CACHE["Tooltip"];
                        var mainEl = e.currentTarget["mainEl"];
                        var elVal = CACHE["Values"][mainEl.id.toLowerCase()];
                        tt.html(elVal < 0 ? "Z" : elVal + " kΩ");
                        tt.css({top: e.clientY + offset, left: e.clientX + offset});
                        tt.stop(true);
                        tt.fadeIn(100);
                        tt[0]["host"] = mainEl;
                    });
                    p.addEventListener("mousemove", function (e) {
                        var tt = CACHE["Tooltip"];
                        tt.css({top: e.clientY + offset, left: e.clientX + offset});
                    });
                    p.parentElement.addEventListener("mouseout", function (e) {
                        var tt = CACHE["Tooltip"];
                        tt.stop(true);
                        tt.fadeOut(100);
                    });
                    CACHE["EventListeners"][elName] = true;
                }
            }
        }
    }
} else {
    CACHE["Electrodes"] = null;
    CACHE["Loaded"] = false;
    CACHE["EventListeners"] = null;
    CACHE["Tooltip"] = null;
    CACHE["Values"] = null;
}
