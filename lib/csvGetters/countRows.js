function findEntry(arr, val, idx)
{
    for (var i = 0, n = arr.length; i < n; ++i) {
        if (arr[i][idx] === val)
            return i;
    }
    return -1;
}

if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var table = INPUT["Table"];

    SETTINGS["Column"] = table[0];
    if (SETTINGS_VAL["Column"] === undefined || SETTINGS_VAL["Column"] >= table[0].length)
        SETTINGS_VAL["Column"] = 0;

    if (IN_VISUALIZATION) {
        var index = SETTINGS_VAL["Column"];
        var result = [ [ table[0][index], "Count" ] ];
        for (var i = 1, n = table.length; i < n; ++i) {
            var j = findEntry(result, table[i][index], 0);
            if (j === -1)
                result.push([ table[i][index], 1 ]);
            else
                result[j][1]++;
        }
        OUTPUT["Counts"] = result;
    }
}
