if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var columns = INPUT["Table"][0];
    var rows = [];
    for (var i = 0, n = INPUT["Table"].length; i < n; ++i) {
        rows.push(INPUT["Table"][i][0]);
    }
    SETTINGS["Start Column"] = columns;
    if (SETTINGS_VAL["Start Column"] === undefined || SETTINGS_VAL["Start Column"] >= columns.length)
        SETTINGS_VAL["Start Column"] = 0;
    SETTINGS["End Column"] = columns;
    if (SETTINGS_VAL["End Column"] === undefined || SETTINGS_VAL["End Column"] >= columns.length)
        SETTINGS_VAL["End Column"] = 0;
    SETTINGS["Start Row"] = rows;
    if (SETTINGS_VAL["Start Row"] === undefined || SETTINGS_VAL["Start Row"] >= rows.length)
        SETTINGS_VAL["Start Row"] = 0;
    SETTINGS["End Row"] = rows;
    if (SETTINGS_VAL["End Row"] === undefined || SETTINGS_VAL["End Row"] >= rows.length)
        SETTINGS_VAL["End Row"] = 0;

    if (IN_VISUALIZATION) {
        var startCol = SETTINGS["Start Column"];
        var endCol = SETTINGS["End Column"];
        var startRow = SETTINGS["Start Row"];
        var endRow = SETTINGS["End Row"];
        var table = INPUT["Table"];
        var result = [];
        for (var i = startRow; i <= endCol; ++i) {
            var row = [];
            for (var j = startCol; j <= endCol; ++j) {
                row.push(table[i][j]);
            }
            result.push(row);
        }
        OUTPUT["Range"] = result;
    }
}
