if (HAS_INPUT["Graph"] && HAS_INPUT["Node IDs"]) {
    var graph = INPUT["Graph"];
    var nodeIDs = INPUT["Node IDs"];
    if (graph !== undefined && graph !== null &&
        nodeIDs !== undefined && nodeIDs !== null) {
        for (var i = 1, n = nodeIDs.length; i < n; ++i) {
            var nodeID = parseInt(nodeIDs[i][0]);
            if (nodeID < graph.nodes.length) {
                graph.nodes[nodeID].keyword = true;
                graph.nodes[nodeID].histColor = "#EE220C";
            }
        }
        OUTPUT["Graph"] = graph;
    }
}
