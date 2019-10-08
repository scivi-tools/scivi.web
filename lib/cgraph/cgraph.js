if (IN_VISUALIZATION && HAS_INPUT["Data"]) {
    var graph = new CGraph();
    var data = INPUT["Data"];
    if (!data)
        throw "No data to draw";

    if (SETTINGS_VAL["Merge Nodes"]) {
        for (var i1 = 0, n = data.length; i1 < n; ++i1) {
            for (var i2 = 0; i2 < n; ++i2) {
                if (i1 !== i2) {
                    for (var j1 = 0, m1 = data[i1].nodes.length; j1 < m1; ++j1) {
                        var shouldAdd = true;
                        var m2 = data[i2].nodes.length;
                        for (var j2 = 0; j2 < m2; ++j2) {
                            if (data[i1].nodes[j1].label === data[i2].nodes[j2].label) {
                                shouldAdd = false;
                                break;
                            }
                        }
                        if (shouldAdd)
                            data[i2].nodes.push({ id: m2 + 1, label: data[i1].nodes[j1].label, width: data[i1].nodes[j1].weight });
                    }
                }
            }
        }
    }

    var states;
    if (Array.isArray(data))
        states = graph.parseStates({ states: data });
    else
        states = graph.parse(data);

    if (SETTINGS_VAL["Sort Nodes"]) {
        Object.keys(states.data).forEach(function(key) {
            states.data[key].nodes.sort(function (x1, x2) {
                if (x1.label < x2.label)
                    return -1;
                else if (x1.label > x2.label)
                    return 1;
                else
                    return 0;
            });
        });
    }

    var classifier = null;//graph.createClassifier(g_classifier, function (n) { return n.custom["class"]; });
    var container = $("<div>");
    var title = SETTINGS_VAL["Title"];

    container.css("height", $(window).height() + "px");
    ADD_VISUAL(container[0]);
    CACHE["cgraph"] = graph.run(g_loc, states, [], null,
                                title, title,
                                classifier, container[0]);
}
