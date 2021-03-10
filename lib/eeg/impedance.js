var elemById = function (svg, id) {
    var keys = Object.keys(svg.all);
    for (var i = 0; i < keys.length; ++i) {
        if (svg.all[i].id === id)
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
        electrodes = document.createElement("object");
        electrodes.data = "storage/21_10-20.svg";
        electrodes.addEventListener("load", function() {
            CACHE["Loaded"] = true;
        }, false);
        ADD_VISUAL(electrodes);
        CACHE["Electrodes"] = electrodes;
    }
    var loaded = CACHE["Loaded"];
    if (loaded && HAS_INPUT["EEG"]) {
        var th = SETTINGS_VAL["Threshold"];
        var cap = th * 2;
        var svg = electrodes.contentDocument;
        var eeg = INPUT["EEG"];
        for (var i = 0; i < eeg[0].length; ++i) {
            var elName = eeg[0][i];
            var elVal = eeg[1][i];
            elemById(svg, elName).style = elVal < 0 ? "fill: #929292" : "fill: hsl(" + lerp(104, 0, th, cap, elVal) + ", " + lerp(75, 100, th, cap, elVal) + "%, 50%)";
        }
    }
} else {
    CACHE["Electrodes"] = null;
    CACHE["Loaded"] = false;
}
