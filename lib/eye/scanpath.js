
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

if (IN_VISUALIZATION) {
    if (HAS_INPUT["AOIs"] && INPUT["AOIs"]) {
        var nodes = [];
        var edges = [];
        var classifier = [];
        var aois = INPUT["AOIs"];
        var nodeID = 1;
        var aoiNodes = [];
        for (var i = 0; i < aois.length; ++i) {
            if (aois[i].children && aois[i].children.length > 0)
                dumpH(aois[i].name, aois[i].children, classifier);
            else {
                dumpH("/" + aois[i].name, aois[i].children, classifier);
                nodes.push({ id: nodeID++, label: aois[i].name, weight: 0 });
                aoiNodes.push(aois[i]);
            }
        }
        if (HAS_INPUT["Fixations"] && INPUT["Fixations"]) {
            var fixations = INPUT["Fixations"];
            for (var i = 0; i < fixations.length; ++i) {
                var u = fixations[i][1];
                var v = fixations[i][2];
            }
        }
        OUTPUT["Scanpath"] = { label: "AOIs", nodes: nodes, edges: edges };
        OUTPUT["Classifier"] = classifier;
    }
}
