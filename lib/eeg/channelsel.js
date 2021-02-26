
if (IN_VISUALIZATION && HAS_INPUT["EEG In"]) {
    var result = [];
    var data = INPUT["EEG In"];
    var rStr = SETTINGS_VAL["Channels Range"];
    if (!rStr || rStr.length == 0)
        result = data;
    else {
        ranges = rStr.split(",");
        for (var i = 0, n = ranges.length; i < n; ++i) {
            var subRange = ranges[i].split("-");
            var from = subRange[0];
            var to = subRange[subRange.length > 1 ? 1 : 0];
            for (var j = from; j <= to; ++j)
                result.push(data[j]);
        }
    }
    OUTPUT["EEG Out"] = result;
}
