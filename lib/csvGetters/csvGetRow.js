if (HAS_INPUT["Row Name"] && INPUT["Row Name"] !== undefined && HAS_INPUT["Table"] && INPUT["Table"]) {
    var name = INPUT["Row Name"];
    var table = INPUT["Table"];
    var result = [ table[0] ]; // Title row
    for (var i = 1, n = table.length; i < n; ++i) {
        if (table[i][0] === name)
            result.push(table[i]);
    }
    OUTPUT["Row"] = result;
}
