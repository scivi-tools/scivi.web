function semDist(mt1, mt2)
{
    var tl = mt1.elements.length + mt2.elements.length;
    if (tl === 0)
        return 0;
    var matchCount = 0;
    for (var i = 0, n = mt1.elements.length; i < n; ++i) {
        for (var j = 0, m = mt2.elements.length; j < m; ++j) {
            if (mt1.elements[i] === mt2.elements[j]) {
                ++matchCount;
                break;
            }
        }
    }
    return 2 * matchCount * Math.log2(2 * matchCount) / tl;
}

function graphDist(g1, g2, th)
{
    var result = 0;
    for (var i = 0, n = g1.mtops.length; i < n; ++i) {
        for (var j = 0, m = g2.mtops.length; j < m; ++j) {
            var s = semDist(g1.mtops[i], g2.mtops[j]);
            if (s > th)
                result += s;
        }
    }
    return result;
}

if (IN_VISUALIZATION && HAS_INPUT["Graphs"] && INPUT["Graphs"]) {
    var graphs = INPUT["Graphs"];
    for (var i = 0, n = graphs.length; i < n; ++i) {
        graphs[i].mtops = [];
        for (var j = 0, m = graphs[i].edges.lenth; j < m; ++j) {
            if (graphs[i].edges[j].deathTS === undefined && graphs[i].edges[j].source !== graphs[i].edges[j].target) {
                graphs[i].mtops.push({
                    name: graphs[i].edges[j].tooltip,
                    elements: [ graphs[i].edges[j].source, graphs[i].edges[j].target ]
                });
            }
        }
        for (var j = 0, m = graphs[i].hyperEdges.length; j < m; ++j) {
            if (graphs[i].hyperEdges[j].deathTS === undefined) {
                graphs[i].mtops.push({
                    name: graphs[i].hyperEdges[j].tooltip,
                    elements: graphs[i].hyperEdges[j].nodes
                });
            }
        }
    }
    var th = SETTINGS_VAL["Threshold"];
    var nodes = [];
    var edges = [];
    for (var i = 0, n = graphs.length; i < n; ++i) {
        nodes.push({ id: i + 1, label: graphs[i].label, weight: 0 });
        for (var j = i + 1; j < n; ++j) {
            var d = graphDist(graphs[i], graphs[j], th);
            if (d > 0) {
                edges.push({ source: i + 1, target: j + 1, weight: d, tooltip: null });
                edges.push({ source: j + 1, target: i + 1, weight: d, tooltip: null });
            }
        }
    }
    OUTPUT["Graph of Distances"] = { label: "", nodes: nodes, edges: edges };
}
