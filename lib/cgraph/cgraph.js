if (IN_VISUALIZATION && HAS_INPUT["Data"]) {
    var graph = new CGraph();
    var states = graph.parse(INPUT["Data"]);
    var classifier = null;//graph.createClassifier(g_classifier, function (n) { return n.custom["class"]; });
    var container = $("<div>");
    container.css("height", $(window).height() + "px");
    ADD_VISUAL(container[0]);
    DATA["cgraph"] = graph.run(g_loc, states, [], null,
                               "GRAPH NAME", "GRAPH NAME",
                               classifier, container[0]);
}
