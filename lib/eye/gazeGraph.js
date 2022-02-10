const IDX_TIM = 0;
const IDX_AOI = 11;
const IDX_TYP = 12;

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

function addEdge(edges, from, to)
{
    for (var i = 0, n = edges.length; i < n; ++i) {
        if (edges[i].source === from && edges[i].target === to) {
            edges[i].weight++;
            return;
        }
    }
    edges.push({ source: from, target: to, weight: 1 });
}

if (IN_VISUALIZATION) {
    var nodes = [];
    var edges = [];
    var classifier = [];

    if (HAS_INPUT["AOIs"] && INPUT["AOIs"]) {
        var aois = INPUT["AOIs"];
        var nodeID = 1;
        for (var i = 0; i < aois.length; ++i) {
            if (aois[i].children && aois[i].children.length > 0)
                dumpH(aois[i].name, aois[i].children, classifier);
            else {
                dumpH("/" + aois[i].name, aois[i].children, classifier);
                nodes.push({ id: nodeID++, label: aois[i].name, weight: 0, keyword: false });
            }
        }
    }

    if (HAS_INPUT["Gaze Data"] && INPUT["Gaze Data"]) {
        var gaze = INPUT["Gaze Data"];
        var prevAOI = -1;
        var precAOI = -1;
        var lastTime = 0;
        for (var i = 0, n = gaze.length; i < n; ++i) {
            if (gaze[i].length > 0) {
                if (gaze[i][IDX_TYP] === "LOOKAT") {
                    var curAOI = parseInt(gaze[i][IDX_AOI]);
                    if (curAOI !== prevAOI) {
                        if (curAOI !== -1) {
                            if (prevAOI !== -1)
                                addEdge(edges, prevAOI + 1, curAOI + 1);
                            prevAOI = curAOI;
                        }
                    } else if (curAOI !== -1 && curAOI === precAOI) {
                        nodes[curAOI].weight += parseInt(gaze[i][IDX_TIM]) - parseInt(gaze[i - 1][IDX_TIM]);
                    }
                    precAOI = curAOI;
                    lastTime = parseInt(gaze[i][IDX_TIM]);
                } else if (gaze[i][IDX_TYP] === "SELECT") {
                    var aoi = parseInt(gaze[i][IDX_AOI]);
                    if (aoi !== -1)
                        nodes[aoi].keyword = !nodes[aoi].keyword;
                }
            }
        }
        var totalTime = lastTime - parseInt(gaze[0][IDX_TIM]);
        for (var i = 0, n = nodes.length; i < n; ++i) {
            nodes[i].weight /= totalTime / 100.0;
            if (nodes[i].keyword)
                nodes[i].histColor = "#EE220C";
        }
    }

    OUTPUT["Graph"] = { label: SETTINGS_VAL["Name"], nodes: nodes, edges: edges };
    OUTPUT["Classifier"] = classifier;
}
