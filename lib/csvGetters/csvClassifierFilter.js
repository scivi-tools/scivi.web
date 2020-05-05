if (HAS_INPUT["CSV Column"] && INPUT["CSV Column"]) {
    var cl = INPUT["CSV Column"];
    var result = [];
    for (var i = 0, n = cl.length; i < n; ++i) {
        var isLeaf = true;
        for (var j = 0; j < n; ++j) {
            if (i !== j && cl[j][0].startsWith(cl[i])) {
                isLeaf = false;
                break;
            }
        }
        if (isLeaf)
            result.push(cl[i]);
    }
    OUTPUT["Classifier"] = result;
}
