function dumpH(path, children, classifier)
{
    if (children && children.length > 0) {
        var p = path + "/";
        for (var i = 0; i < children.length; ++i)
            dumpH(p + children[i].name, children[i].children, classifier);
    } else {
        classifier.push([ path ]);
    }
}

if (IN_VISUALIZATION && HAS_INPUT["AOIs"] && INPUT["AOIs"]) {
    var nodes = [];
    var edges = [];
    var classifier = [];
    var aois = INPUT["AOIs"];
    var nodeID = 1;
    for (var i = 0; i < aois.length; ++i) {
        if (aois[i].children && aois[i].children.length > 0)
            dumpH(aois[i].name, aois[i].children, classifier);
        else {
            dumpH("/" + aois[i].name, aois[i].children, classifier);
            nodes.push({ id: nodeID++, label: aois[i].name, weight: 0 });
        }
    }
    console.log(classifier);
    OUTPUT["Graph"] = { label: "AOIs", nodes: nodes, edges: edges };
    OUTPUT["Classifier"] = classifier;
}
