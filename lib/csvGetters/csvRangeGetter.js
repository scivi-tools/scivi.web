if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var columns = INPUT["Table"][0];
    var rows = [];
    for (var i = 0, n = INPUT["Table"].length; i < n; ++i) {
        rows.push(INPUT["Table"][i][0]);
    }
    SETTINGS["Start Column"] = columns;
    SETTINGS_VAL["Start Column"] = 0;
    SETTINGS["End Column"] = columns;
    SETTINGS_VAL["End Column"] = 0;
    SETTINGS["Start Row"] = rows;
    SETTINGS_VAL["Start Row"] = 0;
    SETTINGS["End Row"] = rows;
    SETTINGS_VAL["End Row"] = 0;
}
