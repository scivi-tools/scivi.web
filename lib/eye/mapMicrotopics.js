function addEdge(edges, from, to)
{
    for (var i = 0, n = edges.length; i < n; ++i) {
        if (edges[i].source === from && edges[i].target === to) {
            edges[i].weight++;
            return;
        }
    }
    edges.push({ source: from, target: to, weight: 1 });
}

function addEdges(edges, mt)
{
    if (mt) {
        for (var i = 0, n = mt.length; i < n; ++i) {
            for (var j = 0; j < n; ++j) {
                if (i !== j)
                    addEdge(edges, mt[i] + 1, mt[j] + 1);
            }
        }
    }
}

if (IN_VISUALIZATION && HAS_INPUT["Walls"] && HAS_INPUT["AOIs"] && HAS_INPUT["Index"] && HAS_INPUT["Count"]) {
    var walls = INPUT["Walls"];
    var aois = INPUT["AOIs"];
    var index = INPUT["Index"];
    var count = INPUT["Count"];
    if (SCIVI.nonNull(walls, aois, index, count)) {
        var graph = CACHE["graph"];
        if (!graph) {
            graph = { label: "microtopics", nodes: [], edges: [] };
            CACHE["graph"] = graph;
            for (var i = 0, n = aois.length; i < n; ++i)
                graph.nodes.push({ id: i + 1, label: aois[i].name, weight: 0 });
        }
        var mt = {};
        for (var i = 1, n = walls.length; i < n; ++i) {
            if (walls[i][1] == "AddAOI") {
                if (!mt[walls[i][2]])
                    mt[walls[i][2]] = [];
                mt[walls[i][2]].push(parseInt(walls[i][3]));
            }
        }
        Object.keys(mt).forEach((key) => {
            addEdges(graph.edges, mt[key]);
        });
        if (index === count  - 1)
            OUTPUT["Graph"] = graph;
    }
} else {
    CACHE["graph"] = null;
}
