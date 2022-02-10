var rgb2hsv = function(rgb) {
    var result = [0, 0, 0];

    var r = rgb[0];
    var g = rgb[1];
    var b = rgb[2];

    r /= 255;
    g /= 255;
    b /= 255;

    var mm = Math.max(r, g, b);
    var m = Math.min(r, g, b);
    var c = mm - m;

    if (c === 0)
        result[0] = 0;
    else if (mm === r)
        result[0] = ((g - b) / c) % 6;
    else if (mm === g)
        result[0] = (b - r) / c + 2;
    else
        result[0] = (r - g) / c + 4;

    result[0] *= 60;
    if (result[0] < 0)
        result[0] += 360;

    result[2] = mm;
    if (result[2] === 0)
        result[1] = 0;
    else
        result[1] = c / result[2];

    result[1] *= 100;
    result[2] *= 100;

    return result;
};

var hsv2rgb = function(hsv) {
    if (hsv[0] < 0)
        hsv[0] = 0;
    if (hsv[1] < 0)
        hsv[1] = 0;
    if (hsv[2] < 0)
        hsv[2] = 0;

    if (hsv[0] >= 360)
        hsv[0] = 359;
    if (hsv[1] > 100)
        hsv[1] = 100;
    if (hsv[2] > 100)
        hsv[2] = 100;

    hsv[0] /= 60;
    hsv[1] /= 100;
    hsv[2] /= 100;

    var c = hsv[1] * hsv[2];
    var x = c * (1 - Math.abs(hsv[0] % 2 - 1));
    var r = 0;
    var g = 0;
    var b = 0;

    if (hsv[0] >= 0 && hsv[0] < 1) {
        r = c;
        g = x;
    } else if (hsv[0] >= 1 && hsv[0] < 2) {
        r = x;
        g = c;
    } else if (hsv[0] >= 2 && hsv[0] < 3) {
        g = c;
        b = x;
    } else if (hsv[0] >= 3 && hsv[0] < 4) {
        g = x;
        b = c;
    } else if (hsv[0] >= 4 && hsv[0] < 5) {
        r = x;
        b = c;
    } else {
        r = c;
        b = x;
    }

    var m = hsv[2] - c;
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return [ r, g, b ];
};

var color2hex = function (color) {
    var toHex = function (v) {
        var result = v.toString(16);
        if (result.length === 1)
            result = "0" + result;
        return result;
    };
    return "#" + toHex(color[0]) + toHex(color[1]) + toHex(color[2]);
};

var hex2color = function (color) {
    var result = [ 0, 0, 0 ];
    if (color.length === 7) {
        color = color.toLowerCase();
        var zCode = "0".charCodeAt(0);
        var nCode = zCode + 9;
        var aCode = "a".charCodeAt(0);
        var fCode = aCode + 5;
        var channelH = 0;
        for (var i = 1, j = 0; i < color.length; ++i) {
            var c = color.charCodeAt(i);
            if (c >= zCode && c <= nCode)
                c -= zCode;
            else if (c >= aCode && c <= fCode)
                c -= aCode - 10;
            else
                return [ 0, 0, 0 ];
            if (i % 2 === 0)
                result[j++] = (channelH << 4) | c;
            else
                channelH = c;
        }
    }
    return result;
}

var dim = function (color, dimValue) {
    hsv = rgb2hsv(color);
    hsv[2] -= dimValue;
    if (hsv[2] < 0)
        hsv[2] = 0
    return hsv2rgb(hsv);
};

if (HAS_INPUT["Layer"] && INPUT["Layer"] && IN_VISUALIZATION) {
    var getStyle = function (feature) {
        var name = feature.properties.original_name;
        var hl = feature.isHighlighted;
        var sel = feature.isSelected;
        var val = NaN;
        if (HAS_INPUT["Values"] && INPUT["Values"] &&
            HAS_INPUT["Min"] && (INPUT["Min"] !== undefined) &&
            HAS_INPUT["Max"] && (INPUT["Max"] !== undefined)) {
            var values = INPUT["Values"];
            if (values.length > 1) {
                for (var i = 0, n = values[1].length; i < n; ++i) {
                    if (values[0][i] === name) {
                        val = parseFloat(values[1][i]);
                        break;
                    }
                }
            }
        }
        var color = [ 187, 187, 187 ];
        if (isNaN(val)) {
            feature.tooltip = feature.properties.original_name;
        } else {
            feature.tooltip = feature.properties.original_name + " (" + val + ")";
            var colorFrom = [ 0, 0, 0 ];
            var colorTo = [ 0, 0, 0 ];
            var minVal = INPUT["Min"];
            var maxVal = INPUT["Max"];
            if (minVal < 0 && maxVal > 0) {
                if (val < 0) {
                    maxVal = -minVal;
                    minVal = 0;
                    val = -val;
                    colorFrom = rgb2hsv(hex2color(SETTINGS_VAL["Negative From Color"]));
                    colorTo = rgb2hsv(hex2color(SETTINGS_VAL["Negative To Color"]));
                } else {
                    minVal = 0;
                    colorFrom = rgb2hsv(hex2color(SETTINGS_VAL["Positive From Color"]));
                    colorTo = rgb2hsv(hex2color(SETTINGS_VAL["Positive To Color"]));
                }
            } else if (minVal < 0 && maxVal < 0) {
                var tmp = -minVal;
                minVal = -maxVal;
                maxVal = tmp;
                val = -val;
                colorFrom = rgb2hsv(hex2color(SETTINGS_VAL["Negative From Color"]));
                colorTo = rgb2hsv(hex2color(SETTINGS_VAL["Negative To Color"]));
            } else {
                colorFrom = rgb2hsv(hex2color(SETTINGS_VAL["Positive From Color"]));
                colorTo = rgb2hsv(hex2color(SETTINGS_VAL["Positive To Color"]));
            }
            var t = maxVal !== minVal ? (val - minVal) / (maxVal - minVal) : 0;
            var hsv = [ 0, 0, 0 ];
            for (var i = 0; i < 3; ++i)
                hsv[i] = Math.round(colorFrom[i] + t * (colorTo[i] - colorFrom[i]));
            color = hsv2rgb(hsv);
        }
        if (feature.updateTooltip)
            feature.updateTooltip(feature);
        return {
            weight: (hl || sel) ? 5 : 2,
            opacity: 1,
            fillColor: hl ? color2hex(dim(color, 30)) : color2hex(color),
            color: sel ? "#000" : (hl ? "#111" : "#666"),
            fillOpacity: hl ? 0.7 : 0.65
        };
    }
    var layer = INPUT["Layer"];
    if (layer) {
        for (var i = 0, n = layer.length; i < n; ++i) {
            if (layer[i].options && layer[i].eachLayer) {
                layer[i].options.style = getStyle;
                layer[i].eachLayer(function (l) {
                    layer[i].resetStyle(l);
                });
            }
        }
    }
    var isLegendVisible = HAS_INPUT["Min"] && (INPUT["Min"] !== undefined) && HAS_INPUT["Max"] && (INPUT["Max"] !== undefined);
    var legend = CACHE["Legend"];
    if (!legend) {
        var legendControl = L.control({ position: "bottomright" });
        legend = L.DomUtil.create("div", "scivi_map_info scivi_map_legend");
        legendControl.onAdd = function (map) {
            return legend;
        };
        layer.push(legendControl);
        CACHE["Legend"] = legend;
    }
    if (isLegendVisible) {
        legend.hidden = false;
        legend.innerHTML = "<div>" + INPUT["Max"] + "</div><div style='background: linear-gradient(to top, " +
                           SETTINGS_VAL["Negative To Color"] + ", " + SETTINGS_VAL["Negative From Color"] + ", " +
                           SETTINGS_VAL["Positive From Color"] + ", " + SETTINGS_VAL["Positive To Color"] +
                           "); width: 30px; height: 80px; border: 1px solid #666; border-radius: 5px; display: inline-block;'></div><div>" +
                           INPUT["Min"] + "</div>";
    } else {
        legend.hidden = true;
    }
    OUTPUT["Layer"] = layer;
} else {
    CACHE["Legend"] = null;
}
