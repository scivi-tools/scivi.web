if (!CACHE["cgraph"]) {
    var graph = new CGraph();
    var states = graph.parseStates(g_data);
    var colors = [ 0xdd1111, 0x489CA0 ];
    var classifier = graph.createClassifier(g_classifier, function (n) { return n.custom["class"]; });
    var container = $("<div>");
    ADD_VISUAL(container[0]);
    CACHE["cgraph"] = graph.run(g_loc, states, null, colors,
                                "Psychological Parameters", "Psychological Parameters",
                                classifier, container[0]);
}
if (HAS_INPUT["Data Filter"]) {
    var nodeName = INPUT["Data Filter"];
    if (nodeName) {
        var graphNodes = CACHE["cgraph"].currentData().nodes;
        for (var i = 0, n = graphNodes.length; i < n; ++i) {
            if (nodeName === graphNodes[i].label) {
                if (CACHE["selectedNodeName"] !== nodeName) {
                    CACHE["cgraph"].selectNode(graphNodes[i]);
                    CACHE["selectedNodeName"] = nodeName;
                }
                break;
            }
        }
    }
}
