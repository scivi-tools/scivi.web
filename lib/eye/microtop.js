
const IDX_TIM = 0;
const IDX_TYP = 13;
const IDX_AOI = 12;

function findKeywordID(kw, aois)
{
    kw = kw.split("_");
    var word = kw[0];
    var wordNum = kw.length > 1 ? parseInt(kw[1]) : 0;
    for (var i = 0, j = 0, n = aois.length; i < n; ++i) {
        if (aois[i].name === word) {
            if (j === wordNum)
                return i + 1;
            else
                ++j;
        }
    }
    return -1;
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

function isKeyword(nodeID, keywords)
{
    for (var i = 0, n = keywords.length; i < n; ++i) {
        if (nodeID === keywords[i])
            return true;
    }
    return false;
}

function assembleEdges(startIndex, endTime, nodes, edges, gaze)
{
    var prevAOI = -1;
    var precAOI = -1;
    var i = startIndex;
    for (var n = gaze.length; i < n && parseInt(gaze[i][IDX_TIM]) < endTime; ++i) {
        if (gaze[i].length > 0 && gaze[i][IDX_TYP] === "LOOKAT") {
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
        }
    }
    var totalTime = endTime - parseInt(gaze[startIndex][IDX_TIM]);
    for (var j = 0, n = nodes.length; j < n; ++j)
        nodes[j].weight /= totalTime / 100.0;
    return i;
}

function lastMeaningful(csv)
{
    for (var i = csv.length - 1; i > 0; --i) {
        if (csv[i].length === csv[0].length)
            return i;
    }
    return 0;
}

function scaleItemIDByName(scale, name)
{
    for (var i = 0, n = scale.length; i < n; ++i) {
        if (scale[i].names[0] === name)
            return i;
    }
    return -1;
}

function assembleScale(walls, aois)
{
    const colors = [ 0xe87461, 0x87cbac, 0x73628a, 0x8de4ff, 0x8ac4ff ];
    const textColors = [ 0xffffff, 0x000000, 0xffffff, 0x000000, 0x000000 ];
    var scale = [];
    for (var i = 0, n = walls.length; i < n; ++i) {
        if (walls[i][1] === "NewWall") {
            var foo = function (node) {
                return this.getValue.ids.indexOf(node.id) === -1 ? 1 : 0;
            };
            foo.ids = [];
            scale.push({ steps: [ 1, 2 ],
                         colors: [ colors[scale.length % colors.length], 0xffffff ],
                         textColors: [ textColors[scale.length % textColors.length], 0xffffff ],
                         names: [ walls[i][2], "" ],
                         fn: foo });
        } else if (walls[i][1] === "DeleteWall") {
            var scaleItemID = scaleItemIDByName(scale, walls[i][2]);
            if (scaleItemID >= 0) 
                scale.splice(scaleItemID, 1);
        } else if (walls[i][1] === "AddAOI") {
            var scaleItemID = scaleItemIDByName(scale, walls[i][2]);
            var aoiID = findKeywordID(walls[i][3], aois);
            if (scaleItemID >= 0 && aoiID >= 0 && scale[scaleItemID].fn.ids.indexOf(aoiID) === -1)
                scale[scaleItemID].fn.ids.push(aoiID);
        } else if (walls[i][1] === "DeleteAOI") {
            var scaleItemID = scaleItemIDByName(scale, walls[i][2]);
            var aoiID = findKeywordID(walls[i][3], aois);
            if (scaleItemID >= 0 && aoiID >= 0) {
                var stepID = scale[scaleItemID].fn.ids.indexOf(aoiID);
                if (stepID !== -1)
                    scale[scaleItemID].fn.ids.splice(stepID, 1);
            }
        }
    }
    return scale;
}

if (IN_VISUALIZATION && HAS_INPUT["Gaze"] && HAS_INPUT["Walls"] && HAS_INPUT["AOIs"]) {
    var gaze = INPUT["Gaze"];
    var walls = INPUT["Walls"];
    var aois = INPUT["AOIs"];
    var readingPhaseEnd = parseInt(walls[0][0]);
    var keywordsPhaseEnd = 0;
    var microtopPhaseEnd = parseInt(walls[lastMeaningful(walls)][0]);
    var keywords = [];
    for (var i = 1, n = walls.length; i < n; ++i) {
        if (walls[i][1] === "DeleteWall") {
            keywordsPhaseEnd = parseInt(walls[i][0]);
            break;
        } else {
            keywords.push(findKeywordID(walls[i][3], aois));
        }
    }
    
    var nodesReading = [];
    var edgesReading = [];
    var nodesKeywords = [];
    var edgesKeywords = [];
    var nodesMicrotop = [];
    var edgesMicrotop = [];

    for (var i = 0; i < aois.length; ++i) {
        var nodeID = i + 1;
        if (isKeyword(nodeID, keywords)) {
            nodesReading.push({ id: nodeID, label: aois[i].name, weight: 0, keyword: true, histColor: "#EE220C" });
            nodesKeywords.push({ id: nodeID, label: aois[i].name, weight: 0, keyword: true, histColor: "#EE220C" });
            nodesMicrotop.push({ id: nodeID, label: aois[i].name, weight: 0, keyword: true, histColor: "#EE220C" });
        } else {
            nodesReading.push({ id: nodeID, label: aois[i].name, weight: 0, keyword: false });
            nodesKeywords.push({ id: nodeID, label: aois[i].name, weight: 0, keyword: false });
            nodesMicrotop.push({ id: nodeID, label: aois[i].name, weight: 0, keyword: false });
        }
    }

    var index = assembleEdges(0, readingPhaseEnd, nodesReading, edgesReading, gaze);
    index = assembleEdges(index, keywordsPhaseEnd, nodesKeywords, edgesKeywords, gaze);
    assembleEdges(index, microtopPhaseEnd, nodesMicrotop, edgesMicrotop, gaze);

    OUTPUT["Graph"] = [ { label: "Reading Phase", nodes: nodesReading, edges: edgesReading },
                        { label: "Keywords Phase", nodes: nodesKeywords, edges: edgesKeywords },
                        { label: "Microtopics Phase", nodes: nodesMicrotop, edges: edgesMicrotop } ];
    OUTPUT["Scale"] = assembleScale(walls, aois);
}
