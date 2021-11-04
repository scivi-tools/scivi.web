function normalizeName(name)
{
    return name.substr(0, name.lastIndexOf('.'));
}

var files = SETTINGS_VAL["CSV Files"];

if (files) {
    if (SETTINGS_CHANGED["CSV Files"]) {
        SETTINGS_CHANGED["CSV Files"] = false;
        DATA["CSV"] = [];
        for (var i = 0, n = files.length; i < n; ++i) {
            Papa.parse(files[i], {
                complete: function(res) {
                    DATA["CSV"].push(res.data);
                    if (DATA["CSV"].length === files.length)
                        PROCESS();
                }
            });
        }
    }
}

if (IN_VISUALIZATION && DATA["CSV"] && files && (DATA["CSV"].length === files.length)) {
    var data = DATA["CSV"];
    var graphData = [];
    for (var i = 0, n = data.length; i < n; ++i) {
        var nodes = [];
        var edges = [];
        var m = data[i].length - 1;
        for (var j = 1; j < m; ++j) {
            var w = parseFloat(data[i][j][data[i][j].length - 1]);
            nodes.push({ id: j, label: data[i][j][0], weight: isNaN(w) ? 0 : w });
        }
        for (var j = 1; j < m; ++j) {
            for (var k = 1; k < m; ++k) {
                if (data[i].length > j && data[i][j].length > k) {
                    var w = parseFloat(data[i][j][k]);
                    if (!isNaN(w))
                        edges.push({ source: j, target: k, weight: w });
                }
            }
        }
        graphData.push({ label: normalizeName(files[i].name), nodes: nodes, edges: edges });
    }
    OUTPUT["Graph Data"] = n == 1 ? graphData[0] : graphData;
}
