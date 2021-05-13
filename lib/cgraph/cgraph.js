if (IN_VISUALIZATION && (HAS_INPUT["Data"] || HAS_INPUT["Classifier"])) {
    var graph = CACHE["cgraph"];
    if (!graph) {
        graph = new CGraph();
        var data = INPUT["Data"];
        var cl = HAS_INPUT["Classifier"] && INPUT["Classifier"] && INPUT["Classifier"].length > 0 ? INPUT["Classifier"] : null;
        var dataIsArray = false;

        if (!data && !cl)
            throw "No data to draw";

        if (data) {
            dataIsArray = Array.isArray(data);

            if (SETTINGS_VAL["Merge Nodes"] && dataIsArray) {
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
                                    data[i2].nodes.push({ id: m2 + 1, label: data[i1].nodes[j1].label, weight: data[i1].nodes[j1].weight });
                            }
                        }
                    }
                }
            }
        } else {
            data = { label: "", nodes: [], edges: [] };
            for (var i = 0, n = cl.length; i < n; ++i) {
                var branch = cl[i][0].split("/");
                data.nodes.push({ "id": i, "label": branch[branch.length - 1], "weight": 0 });
            }
        }

        var tree = null;
        if (cl) {
            tree = {};
            var k = 1;
            var getKnot = function (root, branch, depth) {
                if (depth === branch.length - 1)
                    return root;
                if (root.children === undefined) {
                    var knot = { name: branch[depth] };
                    root.children = [];
                    root.children.push(knot);
                    return getKnot(knot, branch, depth + 1);
                }
                for (var i = 0, n = root.children.length; i < n; ++i) {
                    if (root.children[i].name === branch[depth])
                        return getKnot(root.children[i], branch, depth + 1);
                }
                var knot = { name: branch[depth] };
                root.children.push(knot);
                return getKnot(knot, branch, depth + 1);
            };
            var setClassForNodesArray = function (nodes, nodeName, k) {
                for (var j = 0, m = nodes.length; j < m; ++j) {
                    if (nodes[j].label === nodeName)
                        nodes[j]["class"] = k;
                }
            };
            var setNodeClass = function (nodeName, k) {
                if (dataIsArray) {
                    for (var i = 0, n = data.length; i < n; ++i)
                        setClassForNodesArray(data[i].nodes, nodeName, k)
                } else {
                    setClassForNodesArray(data.nodes, nodeName, k);
                }
            };
            var clCompare = function (cl1, cl2) {
                var b1 = cl1[0].split("/");
                var b2 = cl2[0].split("/");
                var n1 = b1.length;
                var n2 = b2.length;
                var n = Math.min(n1, n2) - 1;
                for (var i = 0; i < n; ++i) {
                    if (b1[i] < b2[i])
                        return -1;
                    else if (b1[i] > b2[i])
                        return 1;
                }
                if (n1 < n2)
                    return -1;
                else if (n1 > n2)
                    return 1;
                else if (b1[n] < b2[n])
                    return -1;
                else if (b1[n] > b2[n])
                    return 1;
                return 0;
            };
            var prevKnot = null;
            cl.sort(clCompare);
            for (var i = 0, n = cl.length; i < n; ++i) {
                var branch = cl[i][0].split("/");
                if (branch.length == 1)
                    continue;
                var knot = getKnot(tree, branch, 0);
                if (!prevKnot)
                    prevKnot = knot.name;
                else if (knot.name !== prevKnot) {
                    ++k;
                    prevKnot = knot.name;
                }
                knot.klass = k;
                setNodeClass(branch[branch.length - 1], k);
            }
            var removeEdgesOfNode = function (edges, nodeID) {
                var i = 0;
                while (i < edges.length) {
                    if (edges[i].source === nodeID || edges[i].target === nodeID)
                        edges.splice(i, 1);
                    else
                        ++i;
                }
            }
            var removeClasslessNodes = function (nodes, edges) {
                var i = 0;
                while (i < nodes.length) {
                    if (nodes[i]["class"] === undefined) {
                        var victim = nodes.splice(i, 1);
                        removeEdgesOfNode(edges, victim[0].id);
                    } else {
                        ++i;
                    }
                }
            }
            if (dataIsArray)
            {
                for (var i = 0, n = data.length; i < n; ++i)
                    removeClasslessNodes(data[i].nodes, data[i].edges);
            } else {
                removeClasslessNodes(data.nodes, data.edges);
            }
        }

        var states;
        if (dataIsArray)
            states = graph.parseStates({ states: data });
        else
            states = graph.parse(data);

        if (SETTINGS_VAL["Sort Nodes"] && !tree) {
            Object.keys(states.data).forEach(function (key) {
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

        if (SETTINGS_VAL["Sort Nodes By Hue"] && !tree) {
            Object.keys(states.data).forEach(function (key) {
                states.data[key].nodes.sort(function (x1, x2) {
                    if (x1.custom["hsv"] === undefined || x2.custom["hsv"] === undefined)
                        return 0;
                    if (x1.custom["hsv"][0] < x2.custom["hsv"][0])
                        return -1;
                    else if (x1.custom["hsv"][0] > x2.custom["hsv"][0])
                        return 1;
                    else {
                        if (x1.custom["hsv"][1] < x2.custom["hsv"][1])
                            return -1;
                        else if (x1.custom["hsv"][1] > x2.custom["hsv"][1])
                            return 1;
                        else {
                            if (x1.custom["hsv"][2] < x2.custom["hsv"][2])
                                return -1;
                            else (x1.custom["hsv"][2] > x2.custom["hsv"][2])
                                return 1;
                        }
                        return 0;
                    }
                });
            });
        }

        if (SETTINGS_VAL["Is Directed"]) {
            Object.keys(states.data).forEach(function (key) {
                states.data[key].edges.forEach(function (edge) {
                    edge.isDirected = true;
                });
            });
        }

        if (SETTINGS_VAL["Set of Filters"]) {
            if (SETTINGS_CHANGED["Set of Filters"]) {
                SETTINGS_CHANGED["Set of Filters"] = false;
                var reader = new FileReader();
                reader.onload = function (e) {
                    var filters = JSON.parse(e.target.result)
                    DATA["Filters"] = filters;
                    CACHE["cgraph"].loadFilterSet(filters);
                };
                reader.readAsText(SETTINGS_VAL["Set of Filters"]);
            }
        }

        var classifier = tree ? graph.createClassifier(tree, function (n) { return n.custom["class"]; }) : null;
        var container = $("<div>");
        var title = SETTINGS_VAL["Title"];

        var colors = HAS_INPUT["Colors"] ? INPUT["Colors"] : null;

        var reshape = function() {
            graph.reshape();
        };
        window.addEventListener("resize", reshape, false);

        container.css("height", $(window).height() + "px");
        ADD_VISUAL(container[0]);
        CACHE["cgraph"] = graph.run(g_loc, states, [], colors,
                                    title, title,
                                    classifier, container[0]);

        var filters = DATA["Filters"];
        if (filters)
            graph.loadFilterSet(filters);
    } else {
        if (HAS_INPUT["Select State"] && INPUT["Select State"]) {
            graph.selectGraphState(INPUT["Select State"]);
        }
    }
} else {
    CACHE["cgraph"] = null;
}
