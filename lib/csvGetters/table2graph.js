function nodeID(name, nodes)
{
    for (var i = 0, n = nodes.length; i < n; ++i) {
        if (nodes[i].label === name)
            return nodes[i].id;
    }
    return -1;
}

if (IN_VISUALIZATION && HAS_INPUT["Table"]) {
    var table = INPUT["Table"];
    var nodes = [];
    var edges = [];
    var index = 1;
    for (var i = 1, n = table.length; i < n; ++i) {
        if (table[i].length === 3) {
            var src = nodeID(table[i][0], nodes);
            if (src === -1) {
                src = index;
                nodes.push({ id: src, label: table[i][0], weight: 0 });
                ++index;
            }
            var dst = nodeID(table[i][1], nodes);
            if (dst === -1) {
                dst = index;
                nodes.push({ id: dst, label: table[i][1], weight: 0 });
                ++index;
            }
            edges.push({ "source": src, "target": dst, "weight": parseFloat(table[i][2]) });
        }
    }
    OUTPUT["Graph Data"] = { label: "", nodes: nodes, edges: edges };
}
