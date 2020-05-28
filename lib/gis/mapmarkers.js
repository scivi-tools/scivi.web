if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var rows = INPUT["Table"];
    var columns = rows[0];
    SETTINGS["Coordinates"] = columns;
    if (SETTINGS_VAL["Coordinates"] === undefined || SETTINGS_VAL["Coordinates"] >= columns.length)
        SETTINGS_VAL["Coordinates"] = 0;
    SETTINGS["Tooltip"] = columns;
    if (SETTINGS_VAL["Tooltip"] === undefined || SETTINGS_VAL["Tooltip"] >= columns.length)
        SETTINGS_VAL["Tooltip"] = 0;

    if (IN_VISUALIZATION) {
        var layer = [];
        var coords = SETTINGS_VAL["Coordinates"];
        var ttip = SETTINGS_VAL["Tooltip"];
        for (var i = 1, n = rows.length; i < n; ++i) {
            if (rows[i].length > coords) {
                var gc = rows[i][coords].split(";");
                if (gc.length == 2) {
                    var lat = parseFloat(gc[0].trim());
                    var lng = parseFloat(gc[1].trim());
                    if (!Number.isNaN(lat) && !Number.isNaN(lng))
                        layer.push(L.circle([lat, lng], {radius: 20, color: "#FF6B00"}).bindTooltip(rows[i][ttip]));
                }
            }
        }
        OUTPUT["Layer"] = layer;
    }
}
