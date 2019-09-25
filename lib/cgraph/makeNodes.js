if (IN_VISUALIZATION && HAS_INPUT["Names"] && INPUT["Names"]) {
    var nodeID = 1;
    var result = [];
    var names = INPUT["Names"];
    var weights = HAS_INPUT["Weights"] ? INPUT["Weights"] : null;
    for (var i = 0, n = names.length; i < n; ++i) {
        for (var j = 0, m = names[i].length; j < m; ++j) {
            result.push({ "id": nodeID, "label": names[i][j], "weight": weights ? parseFloat(weights[i][j]) : 0 });
            ++nodeID;
        }
    }
    OUTPUT["Nodes"] = result;
}
