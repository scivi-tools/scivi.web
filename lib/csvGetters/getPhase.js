if (HAS_INPUT["Gaze Data"] && INPUT["Gaze Data"]) {
    var phase = SETTINGS_VAL["Phase Number"] - 1;
    var data = INPUT["Gaze Data"];
    var result = [];
    var curPhase = 0;
    for (var i = 0, n = data.length; i < n; ++i) {
        if (data[i].length > 12 && data[i][12] === "CPHASE") {
            ++curPhase;
            if (curPhase > phase)
                break;
        } else if (curPhase === phase) {
            result.push(data[i]);
        }
    }
    OUTPUT["Phased Gaze Data"] = result;
}
