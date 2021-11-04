if (IN_VISUALIZATION) {
    var words = SETTINGS_VAL["Words List"];
    if (words !== undefined && words.length > 0) {
        words = words.split("\n");
        var nodes = [];
        for (var i = 0, n = words.length; i < n; ++i) {
            nodes.push({id: i + 1, label: words[i], weight: 0});
        }
        OUTPUT["Graph Data"] = { label: "", nodes: nodes, edges: [] };
    }
}
