if (IN_VISUALIZATION && HAS_INPUT["Incidence Matrix"] && INPUT["Incidence Matrix"]) {
    var nodes = [];
    var edges = [];
    var table = INPUT["Incidence Matrix"];
    var n = table.length;
    var m = table[0].length;
    for (var i = 1; i < n; ++i) {
        if (table[i].length == m)
            nodes.push({ id: i, label: table[i][0], weight: 0 });
    }
    for (var i = 1; i < n; ++i) {
        for (var j = 1; j < m; ++j) {
            if (table[i].length > j) {
                var w = parseFloat(table[i][j]);
                if (!isNaN(w) && w > 0)
                    edges.push({ "source": i, "target": j, "weight": w });
            }
        }
    }
    OUTPUT["Graph Data"] = { label: SETTINGS_VAL["Name"], nodes: nodes, edges: edges };
}
