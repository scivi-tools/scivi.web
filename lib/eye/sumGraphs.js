function deepCopy(obj)
{
    return JSON.parse(JSON.stringify(obj))
}

function findEdge(edges, edge)
{
    for (var i = 0, n = edges.length; i < n; ++i) {
        if (edges[i].source === edge.source && edges[i].target === edge.target)
            return edges[i];
    }
    return null;
}

if (HAS_INPUT["Graph"] && HAS_INPUT["Index"] && HAS_INPUT["Count"]) {
    var graph = INPUT["Graph"];
    var index = INPUT["Index"];
    var count = INPUT["Count"];
    if (graph !== undefined && graph !== null &&
        index !== undefined && index !== null &&
        count !== undefined && count !== null) {
        var graphSum = CACHE["Graph"];

        if (!graphSum) {
            graphSum = deepCopy(graph);
            CACHE["Graph"] = graphSum;
        } else {
            for (var i = 0, n = graph.nodes.length; i < n; ++i)
                graphSum.nodes[i].weight += graph.nodes[i].weight;
            for (var i = 0, n = graph.edges.length; i < n; ++i) {
                var e = findEdge(graphSum.edges, graph.edges[i]);
                if (e)
                    e.weight += graph.edges[i].weight;
                else
                    graphSum.edges.push(deepCopy(graph.edges[i]));
            }
        }

        if (IN_VISUALIZATION) {
            if (index == count - 1 && IN_VISUALIZATION) {
                OUTPUT["Graph"] = graphSum;
            }
        } else {
            CACHE["Graph"] = null;
        }
    }
}
