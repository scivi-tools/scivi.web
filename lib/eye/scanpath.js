
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

function pointInPolygon(pt, poly)
{
    // By W. Randolph Franklin, https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        if (((poly[i][1] > pt[1]) != (poly[j][1] > pt[1])) &&
            (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0]))
            c = !c;
    }
    return c;
}

function pointInBBox(pt, bbox)
{
    return pt[0] >= bbox[0] && pt[1] >= bbox[1] && pt[0] <= bbox[2] && pt[1] <= bbox[3];
}

function hitTest(pt, aoi)
{
    return pointInBBox(pt, aoi.bbox) && pointInPolygon(pt, aoi.path);
}

function findEdge(edges, fromID, toID)
{
    for (var i = 0; i < edges.length; ++i) {
        if (edges[i].source === fromID && edges[i].target === toID)
            return edges[i];
    }
    return null;
}

function clamp(x, from, to)
{
    if (x < from)
        return from;
    else if (x > to)
        return to;
    return x;
}

function makeColorScale(r1, g1, b1, r2, g2, b2, t)
{
    var r = clamp(Math.floor(r1 + t * (r2 - r1)), 0, 255);
    var g = clamp(Math.floor(g1 + t * (g2 - g1)), 0, 255);
    var b = clamp(Math.floor(b1 + t * (b2 - b1)), 0, 255);
    return r << 16 | g << 8 | b;
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["AOIs"] && INPUT["AOIs"]) {
        var nodes = [];
        var edges = [];
        var classifier = [];
        var colors = [];
        var aois = INPUT["AOIs"];
        var nodeID = 1;
        var aoiNodes = [];
        for (var i = 0; i < aois.length; ++i) {
            if (aois[i].children && aois[i].children.length > 0)
                dumpH(aois[i].name, aois[i].children, classifier);
            else {
                dumpH("/" + aois[i].name, aois[i].children, classifier);
                nodes.push({ id: nodeID, label: aois[i].name, group: 0, weight: 0, fixCount: 0 });
                aoiNodes.push({ aoi: aois[i], nodeID: nodeID++ });
            }
        }
        if (HAS_INPUT["Fixations"] && INPUT["Fixations"] && HAS_INPUT["Picture"] && INPUT["Picture"]) {
            var size = CACHE["ImageSize"];
            if (size) {
                var fixations = INPUT["Fixations"];
                var fromNodeID = -1;
                var maxGroup = 0;
                var mf = [];
                for (var i = 0, mx = 0, my = 0, c = 0, st = fixations.length > 0 ? fixations[0][0] : 0; i < fixations.length; ++i) {
                    mx += fixations[i][1];
                    my += fixations[i][2];
                    ++c;
                    if (i === fixations.length - 1 || fixations[i][9] !== fixations[i + 1][9]) {
                        mf.push([ mx / c, my / c, fixations[i][0] - st ]);
                        mx = my = c = d = 0;
                        if (i < fixations.length - 1)
                            st = fixations[i + 1][0];
                    }
                }
                for (var i = 0; i < mf.length; ++i) {
                    var pt = [ mf[i][0] * size.width, mf[i][1] * size.height ];
                    for (var j = 0; j < aoiNodes.length; ++j) {
                        if (hitTest(pt, aoiNodes[j].aoi)) {
                            nodeID = aoiNodes[j].nodeID;
                            ++nodes[nodeID - 1].group;
                            nodes[nodeID - 1].fixCount = nodes[nodeID - 1].group;
                            nodes[nodeID - 1].weight += mf[i][2];
                            if (nodes[nodeID - 1].group > maxGroup)
                                maxGroup = nodes[nodeID - 1].group;
                            if (fromNodeID > 0) {
                                var e = findEdge(edges, fromNodeID, nodeID);
                                if (e)
                                    ++e.weight;
                                else
                                    edges.push({ source: fromNodeID, target: nodeID, weight: 1 });
                            }
                            fromNodeID = nodeID;
                            break;
                        }
                    }
                }
                colors.push(190 << 16 | 190 << 8 | 190);
                for (var i = 0; i < maxGroup; ++i)
                    colors.push(makeColorScale(29, 177, 0, 238, 34, 12, i / (maxGroup - 1)));
            } else {
                nodes = null;
                var img = new Image();
                img.onload = function() {
                    CACHE["ImageSize"] = { width: img.width, height: img.height };
                    PROCESS();
                };
                img.src = INPUT["Picture"];
            }
        }
        if (nodes) {
            OUTPUT["Scanpath"] = { label: "AOIs", nodes: nodes, edges: edges };
            OUTPUT["Classifier"] = classifier;
            OUTPUT["Colors"] = colors;
        }
    }
}
