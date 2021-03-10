var elemById = function (svg, id) {
    var keys = Object.keys(svg.all);
    for (var i = 0; i < keys.length; ++i) {
        if (svg.all[i].id === id)
            return svg.all[i];
    }
    return null;
};

const aboveColor = "#EE220C";
const belowColor = "#1DB100"
const failColor = "#929292";

if (IN_VISUALIZATION) {
    var electrodes = CACHE["Electrodes"];
    if (!electrodes) {
        electrodes = document.createElement("object");
        electrodes.data = "lib/21_electrodes_of_International_10-20_system_for_EEG.svg";
        electrodes.addEventListener("load", function() {
            CACHE["Loaded"] = true;
        }, false);
        ADD_VISUAL(electrodes);
        CACHE["Electrodes"] = electrodes;
    }
    var loaded = CACHE["Loaded"];
    if (loaded && HAS_INPUT["EEG"]) {
        var th = SETTINGS_VAL["Threshold"];
        var svg = electrodes.contentDocument;
        var eeg = INPUT["EEG"];
        for (var i = 0; i < eeg[0].length; ++i) {
            var elName = eeg[0][i];
            var elVal = eeg[1][i];
            elemById(svg, elName).style = "fill: " + (elVal < th ? (elVal > 0 ? belowColor : failColor) : aboveColor);
        }
    }
} else {
    CACHE["Electrodes"] = null;
    CACHE["Loaded"] = false;
}
