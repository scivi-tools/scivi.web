if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var rows = INPUT["Table"];
    var columns = rows[0];
    SETTINGS["Coordinates"] = columns;
    if (SETTINGS_VAL["Coordinates"] === undefined || SETTINGS_VAL["Coordinates"] >= columns.length)
        SETTINGS_VAL["Coordinates"] = 0;
    SETTINGS["Tooltip"] = columns;
    if (SETTINGS_VAL["Tooltip"] === undefined || SETTINGS_VAL["Tooltip"] >= columns.length)
        SETTINGS_VAL["Tooltip"] = 0;
    SETTINGS["Selection Prop"] = columns;
    if (SETTINGS_VAL["Selection Prop"] === undefined || SETTINGS_VAL["Selection Prop"] >= columns.length)
        SETTINGS_VAL["Selection Prop"] = 0;

    if (IN_VISUALIZATION) {
        if (!CACHE["markers"]) {
            var layer = [];
            var coords = SETTINGS_VAL["Coordinates"];
            var ttip = SETTINGS_VAL["Tooltip"];
            var sel = SETTINGS_VAL["Selection Prop"];
            for (var i = 1, n = rows.length; i < n; ++i) {
                if (rows[i].length > coords) {
                    var gc = rows[i][coords].split(";");
                    if (gc.length == 2) {
                        var lat = parseFloat(gc[0].trim());
                        var lng = parseFloat(gc[1].trim());
                        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
                            var name = rows[i][ttip];
                            var marker = L.circle([lat, lng], {radius: 20, color: "#0067FF"})
                                          .bindTooltip(name);
                                          // .bindPopup(name);
                            marker.selectionProp = rows[i][sel].trim();
                            marker.on("click", function (ev) {
                                CACHE["Selection"] = ev.target.selectionProp;
                                var mArr = OUTPUT["Layer"];
                                for (var i = 0, n = mArr.length; i < n; ++i) {
                                    if (mArr[i].selectionProp === ev.target.selectionProp) {
                                        mArr[i].setStyle({ color: "#FF0000"});
                                    } else {
                                        mArr[i].setStyle({ color: "#0067FF"});
                                    }
                                }
                                PROCESS();
                            });
                            layer.push(marker);
                        }
                    }
                }
            }
            OUTPUT["Layer"] = layer;
            CACHE["markers"] = true;
        } else {
            var selection = CACHE["Selection"];
            if (selection)
                OUTPUT["Selection"] = selection;
        }
    }
}
