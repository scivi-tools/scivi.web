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
if (DATA["CSV"]) {
    var data = DATA["CSV"];
    var n = data.length;
    while ((data[n - 1].length !== data[0].length) && n > 0)
        --n;
    var weigtCols = data[0].slice(n);
    SETTINGS["Weight Column"] = weigtCols;
    if (SETTINGS_VAL["Weight Column"] === undefined || SETTINGS_VAL["Weight Column"] >= weigtCols.length)
        SETTINGS_VAL["Weight Column"] = 0;
    UPDATE_WIDGETS();
    if (IN_VISUALIZATION) {
        var nodes = [];
        var edges = [];
        var wi = parseInt(SETTINGS_VAL["Weight Column"]) + n;
        for (var i = 1; i < n; ++i) {
            var w = parseFloat(data[i][wi]);
            nodes.push({ id: i, label: data[i][0].trimStart().trim(), weight: isNaN(w) ? 0 : w });
        }
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
} else {
    SETTINGS["Weight Column"] = [];
}
