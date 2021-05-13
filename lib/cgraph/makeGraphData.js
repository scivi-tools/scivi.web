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
                    var w = parseFloat(weights[i][j]);
                    if (!isNaN(w))
                        edges.push({ "source": from[i].id, "target": to[j].id, "weight": w });
                }
            }
        }
    } else {
        nodes = from.slice();
        var n = from.length;
        var m = to.length;
        var nodeID = n + 1;
        for (var i = 0; i < m; ++i) {
            nodes.push({ "id": nodeID, "label": to[i]["label"], "weight": to[i]["weight"], "group": to[i]["group"], "hsv": to[i]["hsv"] });
            ++nodeID;
        }
        for (var i = 0; i < n; ++i) {
            for (var j = 0; j < m; ++j) {
                if (weights.length > i && weights[i].length > j) {
                    var w = parseFloat(weights[i][j]);
                    if (!isNaN(w)) {
                        edges.push({ "source": from[i].id, "target": to[j].id + n, "weight": w });
                        edges.push({ "source": to[j].id + n, "target": from[i].id, "weight": w });
                    }
                }
            }
        }
    }
    OUTPUT["Graph Data"] = { label: SETTINGS_VAL["Name"], nodes: nodes, edges: edges };
}
