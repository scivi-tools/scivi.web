var getAssociate = function (obj, ascName) {
    for (var i = 0, n = obj.nodes.length; i < n; ++i) {
        if (obj.nodes[i].label === ascName) {
            return obj.nodes[i];
        }
    }
    var result = { id: obj.nodes.length + 1, label: ascName, weight: 0 };
    obj.nodes.push(result);
    return result;
};

var incAssociatesLink = function (obj, asc1, asc2) {
    for (var i = 0, n = obj.edges.length; i < n; ++i) {
        if (obj.edges[i].source === asc1.id && obj.edges[i].target === asc2.id) {
            obj.edges[i].weight++;
            return obj.edges[i];
        }
    }
    var result = { source: asc1.id, target: asc2.id, weight: 1 };
    obj.edges.push(result);
    return result;
};

var processAssociates = function (obj, ascStr) {
    var asc = ascStr.split("|");
    for (var i = 0, n = asc.length; i < n; ++i) {
        var a1 = getAssociate(obj, asc[i]);
        a1.weight++;
        for (var j = 0; j < n; ++j) {
            if (i !== j) {
                var a2 = getAssociate(obj, asc[j]);
                incAssociatesLink(obj, a1, a2);
            }
        }
    }
};

if (SETTINGS_VAL["Naive Maps Data"]) {
    if (SETTINGS_CHANGED["Naive Maps Data"]) {
        SETTINGS_CHANGED["Naive Maps Data"] = false;
        var files = SETTINGS_VAL["Naive Maps Data"];
        DATA["CSV"] = [];
        for (var i = 0, n = files.length; i < n; ++i) {
            Papa.parse(files[i], {
                complete: function(res) {
                    DATA["CSV"].push(res.data);
                    if (DATA["CSV"].length === SETTINGS_VAL["Naive Maps Data"].length)
                        PROCESS();
                }
            });
        }
    }
}

if (IN_VISUALIZATION && DATA["CSV"] && SETTINGS_VAL["Naive Maps Data"] && (DATA["CSV"].length === SETTINGS_VAL["Naive Maps Data"].length)) {
    var graphData = {};
    var data = DATA["CSV"];
    for (var i = 0, n = data.length; i < n; ++i) {
        var map = data[i];
        for (var j = 0, m = map.length; j < m; ++j) {
            if (map[j][4] === "Город") {
                var cityName = map[j][1];
                var city = graphData[cityName];
                if (!city) {
                    city = { label: cityName, nodes: [], edges: [] };
                    graphData[cityName] = city;
                }
                processAssociates(city, map[j][2]);
            }
        }
    }
    var graphDataArr = Object.keys(graphData).map(function (key) { return graphData[key]; });
    graphDataArr.sort(function (x1, x2) {
        if (x1.label < x2.label)
            return -1;
        else if (x1.label > x2.label)
            return 1;
        else
            return 0;
    });
    OUTPUT["Graph Data"] = graphDataArr;
}
