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
    for (var i = 1; i < n; ++i)
        nodes.push({ id: i, label: data[0][i], weight: 0 });
    for (var i = 1; i < n; ++i) {
        for (var j = 1; j < n; ++j) {
            if (data.length > i && data[i].length > j) {
                var w = parseFloat(data[i][j]);
                if (!isNaN(w))
                    edges.push({ "source": i, "target": j, "weight": w });
            }
        }
    }
    OUTPUT["Graph Data"] = { label: SETTINGS_VAL["Name"], nodes: nodes, edges: edges };
}
