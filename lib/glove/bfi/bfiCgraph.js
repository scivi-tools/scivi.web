if (!DATA["cgraph"]) {
    var graph = new CGraph();
    var states = graph.parseStates(g_data);
    var colors = [ 0xdd1111, 0x489CA0 ];
    var classifier = graph.createClassifier(g_classifier, function (n) { return n.custom["class"]; });
    var container = $("<div>");
    ADD_VISUAL(container[0]);
    DATA["cgraph"] = graph.run(g_loc_en, states, null, colors,
                               "Psychological Parameters", "Psychological Parameters",
                               classifier, container[0]);
}
if (HAS_INPUT["Data Filter"]) {
    var nodeName = INPUT["Data Filter"];
    if (nodeName) {
        var graphNodes = DATA["cgraph"].currentData().nodes;
        for (var i = 0, n = graphNodes.length; i < n; ++i) {
            if (nodeName === graphNodes[i].label) {
                if (DATA["selectedNodeName"] !== nodeName) {
                    DATA["cgraph"].selectNode(graphNodes[i]);
                    DATA["selectedNodeName"] = nodeName;
                }
                break;
            }
        }
    }
}
