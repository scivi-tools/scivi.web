function idOfNodeByName(name, nodes)
{
    for (var i = 0, n = nodes.length; i < n; ++i) {
        if (nodes[i].label === name)
            return nodes[i].id;
    }
    return -1;
}

function nameOfNodeByID(id, nodes)
{
    for (var i = 0, n = nodes.length; i < n; ++i) {
        if (nodes[i].id === id)
            return nodes[i].label.trim();
    }
    return null;
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

function addEdges(originEdges, originNodes, edges, nodes)
{
    for (var i = 0, n = originEdges.length; i < n; ++i) {
        var srcID = idOfNodeByName(nameOfNodeByID(originEdges[i].source, originNodes), nodes);
        var dstID = idOfNodeByName(nameOfNodeByID(originEdges[i].target, originNodes), nodes);
        var e = findEdge(srcID, dstID, edges);
        if (e)
            e.weight += originEdges[i].weight;
        else
            edges.push({ source: srcID, target: dstID, weight: originEdges[i].weight, tooltip: null });
    }
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
    var index = 1;
    for (var i = 0, n = graphs.length; i < n; ++i) {
        for (var j = 0, m = graphs[i].nodes.length; j < m; ++j) {
            var name = graphs[i].nodes[j].label.trim()
            var nID = idOfNodeByName(name, nodes);
            if (nID === -1) {
                nodes.push({ id: index, label: name, weight: graphs[i].nodes[j].weight });
                ++index;
            }
        }
        addEdges(graphs[i].edges, graphs[i].nodes, edges, nodes);
        for (var j = 0, m = graphs[i].hyperEdges.length; j < m; ++j) {
            var binEdges = convertHyperToBinary(graphs[i].hyperEdges[j]);
            addEdges(binEdges, graphs[i].nodes, edges, nodes);
        }
    }

    OUTPUT["Graph Data"] = { label: "", nodes: nodes, edges: edges };
}
