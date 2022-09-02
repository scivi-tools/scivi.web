if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var table = INPUT["Table"];

    SETTINGS["Column"] = table[0];
    if (SETTINGS_VAL["Column"] === undefined || SETTINGS_VAL["Column"] >= table[0].length)
        SETTINGS_VAL["Column"] = 0;

    if (IN_VISUALIZATION) {
        var index = SETTINGS_VAL["Column"];
        var variants = [];
        for (var i = 1, n = table.length; i < n; ++i) {
            if (table[i].length > index && variants.indexOf(table[i][index]) === -1)
                variants.push(table[i][index]);
        }
        variants.sort();
        var result = [ [ table[0][index] ] ];
        for (var i = 0, n = variants.length; i < n; ++i)
            result.push([ variants[i] ]);
        OUTPUT["Values"] = result;
    }
}
