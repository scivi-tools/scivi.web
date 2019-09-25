if (IN_VISUALIZATION && 
    HAS_INPUT["From Nodes"] && INPUT["From Nodes"] && 
    HAS_INPUT["To Nodes"] && INPUT["To Nodes"] &&
    HAS_INPUT["Edge Weights"] && INPUT["Edge Weights"]) {
    var nodes = null;
    var edges = [];
    var from = INPUT["From Nodes"];
    var to = INPUT["To Nodes"];
    var weights = INPUT["Edge Weights"];
    if (from === to) {
        nodes = from;
        var n = from.length;
        for (var i = 0; i < n; ++i) {
            for (var j = 0; j < n; ++j) {
                if (weights.length > i && weights[i].length > j) {
                    edges.push({ "source": from[i].id, "target": to[j].id, "weight": parseFloat(weights[i][j]) });
                }
            }
        }
    } else {
    }
    OUTPUT["Graph Data"] = { nodes: nodes, edges: edges };
}
