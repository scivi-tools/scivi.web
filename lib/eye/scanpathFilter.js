const IDX_AOI_ID = 0;
const IDX_AOI_VALUE = 1;
const IDX_AOI_AVU = 2;
const IDX_AOI_AVV = 3;
const IDX_AOI_AVT = 4;

function totalInfPercent(fixations)
{
    var result = 0.0;
    for (var i = 1, n = fixations.length; i < n; ++i)
        result += fixations[i][IDX_AOI_VALUE];
    return result * 100.0;
}

function findMostValuable(fixations, th)
{
    var maxVal = 0.0;
    for (var i = 1, n = fixations.length; i < n; ++i) {
        if (fixations[i][IDX_AOI_VALUE] > maxVal)
            maxVal = fixations[i][IDX_AOI_VALUE];
    }
    var result = [ fixations[0] ];
    for (var i = 1, n = fixations.length; i < n; ++i) {
        if (Math.abs(fixations[i][IDX_AOI_VALUE] - maxVal) <= th)
            result.push(fixations[i]);
    }
    return result;
}

function graphNodesFromAOIs(aois)
{
    var result = [];
    for (var i = 0, n = aois.length; i < n; ++i)
        result.push({ label: aois[i].name, weight: 0, id: i + 1 });
    return result;
}

function findEdge(src, dst, edges)
{
    for (var i = 0, n = edges.length; i < n; ++i) {
        if (edges[i].source === src && edges[i].target === dst)
            return edges[i];
    }
    return null;
}

if (IN_VISUALIZATION && HAS_INPUT["Scanpath"] && INPUT["Scanpath"] && HAS_INPUT["AOIs"] && INPUT["AOIs"]) {
    var scanpath = INPUT["Scanpath"];
    var aois = INPUT["AOIs"];
    var nodes = graphNodesFromAOIs(aois);
    var edges = [];
    var prevFixations = [];
    var diffThreshold = SETTINGS_VAL["Difference Threshold"];
    var percThreshold = SETTINGS_VAL["Minimal Informants Percent"];
    var result = [];
    var table = [ [ "From", "To" ] ];
    for (var i = 0, n = scanpath.length; i < n; ++i) {
        if (totalInfPercent(scanpath[i]) >= percThreshold) {
            var fixations = findMostValuable(scanpath[i], diffThreshold);
            for (var j = 1, m = fixations.length; j < m; ++j) {
                var aoiID = fixations[j][IDX_AOI_ID];
                for (var k = 1, p = prevFixations.length; k < p; ++k) {
                    var e = findEdge(prevFixations[k][IDX_AOI_ID] + 1, aoiID + 1, edges);
                    if (e)
                        ++e.weight;
                    else {
                        e = { source: prevFixations[k][IDX_AOI_ID] + 1, target: aoiID + 1, weight: 1, tooltip: "" };
                        edges.push(e);
                    }
                    e.tooltip +=  (i) + " → " + (i + 1) + "<br/>";
                    table.push([ aois[prevFixations[k][IDX_AOI_ID]].name, aois[aoiID].name ]);
                }
            }
            prevFixations = fixations;
            result.push(fixations);
        }
    }

    for (var i = 0, n = edges.length; i < n; ++i)
        edges[i].tooltip += "weight: " + edges[i].weight;

    OUTPUT["Scanpath"] = result;
    OUTPUT["Graph"] = { label: "", nodes: nodes, edges: edges };
    OUTPUT["Table"] = table;
}
