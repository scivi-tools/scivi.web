if (HAS_INPUT["Table"] && INPUT["Table"]) {
    var table = INPUT["Table"];
    var result = [];
    for (var i = 0, n = table.length; i < n; ++i) {
        for (var j = 0, m = table[i].length; j < m; ++j) {
            while (result.length <= j)
                result.push([]);
            while (result[j].length <= i)
                result[j].push([]);
            result[j][i] = table[i][j];
        }
    }
    OUTPUT["Transposed Table"] = result;
}
