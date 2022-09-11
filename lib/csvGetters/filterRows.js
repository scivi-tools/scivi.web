if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var table = INPUT["Table"];

    SETTINGS["Column"] = table[0];
    if (SETTINGS_VAL["Column"] === undefined || SETTINGS_VAL["Column"] >= table[0].length)
        SETTINGS_VAL["Column"] = 0;

    if (IN_VISUALIZATION && HAS_INPUT["Value"] && INPUT["Value"]) {
        var value = INPUT["Value"];
        var result = [ table[0] ];
        var index = SETTINGS_VAL["Column"];
        for (var i = 1, n = table.length; i < n; ++i) {
            if (table[i][index] === value)
                result.push(table[i]);
        }
        OUTPUT["Filtered Table"] = result;
    } else {
        OUTPUT["Filtered Table"] = table;
    }
}
