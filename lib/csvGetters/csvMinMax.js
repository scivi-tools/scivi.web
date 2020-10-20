if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var table = INPUT["Table"];
    var minVal = undefined;
    var maxVal = undefined;
    for (var i = 1, n = table.length; i < n; ++i) {
        for (var j = 1, m = table[i].length; j < m; ++j) {
            var val = parseFloat(table[i][j]);
            if (!isNaN(val)) {
                if (minVal === undefined || val < minVal)
                    minVal = val;
                if (maxVal === undefined || val > maxVal)
                    maxVal = val;
            }
        }
    }
    OUTPUT["Min"] = minVal;
    OUTPUT["Max"] = maxVal;
    console.log(minVal + " " + maxVal);
}
