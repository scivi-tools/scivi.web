function idOfNodeByName(name, nodes)
{
    for (var i = 0, n = nodes.length; i < n; ++i) {
        if (nodes[i].label === name)
            return nodes[i].id;
    }
    return -1;
}

function convertHyperToBinary(hyper)
{
    var result = [];
    for (var i = 0, n = hyper.nodes.length; i < n; ++i) {
        for (let j = 0; j < n; ++j) {
            if (i !== j)
                result.push({ source: hyper.nodes[i], target: hyper.nodes[j], weight: hyper.weight, tooltip: null });
        }
    }
    return result;
}

function findEdge(source, target, edges)
{
    for (var i = 0, n = edges.length; i < n; ++i) {
        if (edges[i].source === source && edges[i].target === target)
            return edges[i];
    }
    return null;
}

var files = SETTINGS_VAL["Array of graphs"];

if (files) {
    if (SETTINGS_CHANGED["Array of graphs"]) {
        SETTINGS_CHANGED["Array of graphs"] = false;
        var n = files.length;
        DATA["Graphs"] = [];
        DATA["Count"] = n;
        for (var i = 0; i < n; ++i) {
            var fr = new FileReader();
            fr.onload = function (res) {
                DATA["Graphs"].push(JSON.parse(res.target.result));
                if (DATA["Graphs"].length === DATA["Count"])
                    PROCESS();
            };
            fr.readAsText(files[i]);
        }
    }
}

if (IN_VISUALIZATION && DATA["Graphs"] && (DATA["Graphs"].length === DATA["Count"])) {
    var graphs = DATA["Graphs"];
    var nodes = [];
    var edges = [];
    // var index = 1;
    for (var i = 0, n = graphs.length; i < n; ++i) {
        if (i === 0) {
            for (var j = 0, m = graphs[i].nodes.length; j < m; ++j) {
                nodes.push(graphs[i].nodes[j]);
                // if (!nodes.includes(graphs[i].nodes[j])) {
                    // nodes.push({ id: index, label: graphs[i].nodes[j].label, weight: graphs[i].nodes[j].weight });
                    // ++index;
                // }
            }
        }
        for (var j = 0, m = graphs[i].edges.length; j < m; ++j) {
            var e = findEdge(graphs[i].edges[j].source, graphs[i].edges[j].target, edges);
            if (e)
                e.weight += graphs[i].edges[j].weight;
            else
                edges.push({ source: graphs[i].edges[j].source, target: graphs[i].edges[j].target, weight: graphs[i].edges[j].weight, tooltip: null });
        }
        for (var j = 0, m = graphs[i].hyperEdges.length; j < m; ++j) {
            var binEdges = convertHyperToBinary(graphs[i].hyperEdges[j]);
            console.log(binEdges);
            for (var k = 0, p = binEdges.length; k < p; ++k) {
                var e = findEdge(binEdges[k].source, binEdges[k].target, edges);
                if (e)
                    e.weight += binEdges[k].weight;
                else
                    edges.push({ source: binEdges[k].source, target: binEdges[k].target, weight: binEdges[k].weight, tooltip: null });
            }
        }
    }

    OUTPUT["Graph Data"] = { label: "", nodes: nodes, edges: edges };
}
