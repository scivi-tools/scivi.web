if (HAS_INPUT["Graph"] && INPUT["Graph"]) {
    var table = INPUT["Graph"];
    var n = table.length;
    var m = table[0].length;
    var result = [];
    for (var i = 0; i < n; ++i) {
        if (table[i].length == m) {
            result.push([]);
            for (var j = 0; j < m; ++j) {
                if (i === 0 || j === 0 || i === j)
                    result[i].push(table[i][j]);
                else {
                    var w1 = table[i].length > j ? parseFloat(table[i][j]) : NaN;
                    var w2 = table.length > j && table[j].length > i ? parseFloat(table[j][i]) : NaN;
                    result[i].push(isNaN(w1) || isNaN(w2) ? 0 : Math.max(w1 - w2, 0));
                }
            }
        }
    }
    OUTPUT["Reduced Graph"] = result;
}
