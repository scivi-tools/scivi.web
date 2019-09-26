if (IN_VISUALIZATION && HAS_INPUT["Data"]) {
    var graph = new CGraph();
    var states = graph.parse(INPUT["Data"]);
    var classifier = null;//graph.createClassifier(g_classifier, function (n) { return n.custom["class"]; });
    var container = $("<div>");
    var title = SETTINGS_VAL["Title"];
    container.css("height", $(window).height() + "px");
    ADD_VISUAL(container[0]);
    CACHE["cgraph"] = graph.run(g_loc, states, [], null,
                                title, title,
                                classifier, container[0]);
}
