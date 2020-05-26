if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var rows = INPUT["Table"];
    var columns = rows[0];
    SETTINGS["Address"] = columns;
    if (SETTINGS_VAL["Address"] === undefined || SETTINGS_VAL["Address"] >= columns.length)
        SETTINGS_VAL["Address"] = 0;
    SETTINGS["Target"] = columns;
    if (SETTINGS_VAL["Target"] === undefined || SETTINGS_VAL["Target"] >= columns.length)
        SETTINGS_VAL["Target"] = 0;

    if (IN_VISUALIZATION) {
        var rowCount = rows.length;
        if (SETTINGS_CHANGED["Address"] || SETTINGS_CHANGED["Target"] || SETTINGS_CHANGED["City"] || !CACHE["processed"]) {
            console.log("calc!");
            SETTINGS_CHANGED["Address"] = false;
            SETTINGS_CHANGED["Target"] = false;
            SETTINGS_CHANGED["City"] = false;
            var address = SETTINGS_VAL["Address"];
            var target = SETTINGS_VAL["Target"];
            var city = SETTINGS_VAL["City"];
            CACHE["processed"] = 1; // First row is skipped because it is a header.
            for (var i = 1; i < rowCount; ++i) {
                if (rows[i][target] == "") {
                    console.log(">>> resolve " + rows[i]);
                    $.ajax("https://nominatim.openstreetmap.org/search?q=" + rows[i][address] + "+" + city + "&format=geocodejson")
                     .done(function (data) {
                        rows[i][target] = data["features"][0]["geometry"]["coordinates"];
                        console.log(i + " " + rows[i][target]);
                        CACHE["processed"] = CACHE["processed"] + 1;
                        if (CACHE["processed"] == rowCount)
                            PROCESS();
                    });
                } else {
                    CACHE["processed"] = CACHE["processed"] + 1; // Already geocoded in the input data.
                }
            }
        }
        // var startCol = SETTINGS_VAL["Start Column"];
        // var endCol = SETTINGS_VAL["End Column"];
        // var startRow = SETTINGS_VAL["Start Row"];
        // var endRow = SETTINGS_VAL["End Row"];
        // var table = INPUT["Table"];
        // var result = [];
        // for (var i = startRow; i <= endRow; ++i) {
        //     var row = [];
        //     for (var j = startCol; j <= endCol; ++j) {
        //         row.push(table[i][j]);
        //     }
        //     result.push(row);
        // }
        // OUTPUT["Range"] = result;
    }
    OUTPUT["Table"] = rows;
}
