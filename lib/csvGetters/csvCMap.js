if (SETTINGS_VAL["CSV File"]) {
    if (SETTINGS_CHANGED["CSV File"]) {
        SETTINGS_CHANGED["CSV File"] = false;
        Papa.parse(SETTINGS_VAL["CSV File"], {
            complete: function(res) {
                DATA["CSV"] = res.data;
                PROCESS();
            }
        });
    }
}
if (DATA["CSV"] && IN_VISUALIZATION) {
    var data = DATA["CSV"];
    var nodes = [];
    var edges = [];
    var n = data[0].length;
    var m = data.length;
    for (var i = 1; i < n; ++i) {
        if (data[0][i].length > 0)
            nodes.push({ id: i, label: data[0][i], weight: 0 });
    }
    for (var j = 1; j < m; ++j) {
        if (data[j][0].length > 0)
            nodes.push({ id: j + n, label: data[j][0], weight: 0 });
    }
    for (var j = 0; j < m; ++j) {
        for (var i = 0; i < n; ++i) {
            var w = parseFloat(data[j][i]);
            if (!isNaN(w)) {
                edges.push({ "source": i, "target": j + n, "weight": w });
                edges.push({ "source": j + n, "target": i, "weight": w });
            }
        }
    }
    OUTPUT["Graph Data"] = { label: SETTINGS_VAL["Name"], nodes: nodes, edges: edges };
}
