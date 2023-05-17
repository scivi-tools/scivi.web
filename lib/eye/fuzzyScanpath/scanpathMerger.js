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

function findAOI(arr, aoiID)
{
    for (var i = 1, n = arr.length; i < n; ++i) {
        if (arr[i][0] === aoiID)
            return i;
    }
    return -1;
}

function buildMergedScanpath(fixations, size, aois)
{
    var paths = [];
    var maxScanpathLength = 0;
    for (var i = 0, n = fixations.length; i < n; ++i) {
        var mf = [];
        for (var j = 0, mx = 0, my = 0, c = 0, st = fixations[i].length > 0 ? fixations[i][0][0] : 0, m = fixations[i].length, p = fixations[i][0].length - 1; j < m; ++j) {
            mx += fixations[i][j][1];
            my += fixations[i][j][2];
            ++c;
            if (j === fixations[i].length - 1 ||
                fixations[i][j][p] !== fixations[i][j + 1][p]) {
                mf.push([ mx / c, my / c, fixations[i][j][0] - st ]);
                mx = my = c = d = 0;
                if (j < fixations[i].length - 1)
                    st = fixations[i][j + 1][0];
            }
        }

        var path = [];
        for (var j = 0, m = mf.length; j < m; ++j) {
            if (j === 0 && Math.abs(mf[j][0] - 0.5) < 0.05 && Math.abs(mf[j][1] - 0.5) < 0.05)
                continue; // Skip initial fixation in the screen center (if any)
            var pt = [ mf[j][0] * size.width, mf[j][1] * size.height ];
            for (var k = aois.length - 1; k >= 0; --k) {
                if (hitTest(pt, aois[k])) {
                    if (path.length === 0 || path[path.length - 1].aoiID !== k)
                        path.push({ aoiID: k, avU: mf[j][0], avV: mf[j][1], time: mf[j][2], cnt: 1 });
                    else {
                        var p = path.length - 1;
                        path[p].avU += mf[j][0];
                        path[p].avV += mf[j][1];
                        path[p].time += mf[j][2];
                        path[p].cnt++;
                    }
                    break;
                }
            }
        }
        paths.push(path);
        if (path.length > maxScanpathLength)
            maxScanpathLength = path.length;
    }

    var result = [];
    for (var i = 0; i < maxScanpathLength; ++i) {
        var pathStep = [ [ "AOI ID", "Value", "Average U", "Average V", "Average Fixation Time" ] ];
        for (var j = 0, n = paths.length; j < n; ++j) {
            if (paths[j].length > i) {
                var idx = findAOI(pathStep, paths[j][i].aoiID);
                if (idx >= 0) {
                    pathStep[idx][1]++;
                    pathStep[idx][2] += paths[j][i].avU / paths[j][i].cnt;
                    pathStep[idx][3] += paths[j][i].avV / paths[j][i].cnt;
                    pathStep[idx][4] += paths[j][i].time;
                } else {
                    pathStep.push([ paths[j][i].aoiID,
                                    1,
                                    paths[j][i].avU / paths[j][i].cnt,
                                    paths[j][i].avV / paths[j][i].cnt,
                                    paths[j][i].time ]);
                }
            }
        }
        for (var j = 1, n = pathStep.length; j < n; ++j) {
            pathStep[j][2] /= pathStep[j][1];
            pathStep[j][3] /= pathStep[j][1];
            pathStep[j][4] /= pathStep[j][1];
            pathStep[j][1] /= fixations.length;
        }
        result.push(pathStep);
    }

    return result;
}

if (IN_VISUALIZATION) {
    var mergedScanpath = CACHE["MergedScanpath"];
    if (!mergedScanpath) {
        if (HAS_INPUT["Scanpath Count"] && HAS_INPUT["Fixations"] && INPUT["Fixations"]) {
            var count = INPUT["Scanpath Count"];
            var fixations = CACHE["Fixations"];
            if (!fixations) {
                fixations = [];
                CACHE["Fixations"] = fixations;
            }
            if (fixations.length < count)
                fixations.push(INPUT["Fixations"]);
            if (fixations.length === count) {
                var size = CACHE["ImageSize"];
                if (size) {
                    if (HAS_INPUT["AOIs"] && INPUT["AOIs"]) {
                        mergedScanpath = buildMergedScanpath(fixations, size, INPUT["AOIs"]);
                        CACHE["MergedScanpath"] = mergedScanpath;
                    }
                } else {
                    if (HAS_INPUT["Picture"] && INPUT["Picture"] && !CACHE["ImageProcessing"]) {
                        var img = new Image();
                        img.onload = function() {
                            CACHE["ImageSize"] = { width: img.width, height: img.height };
                            PROCESS();
                        };
                        img.src = INPUT["Picture"];
                        CACHE["ImageProcessing"] = true;
                    }
                }
            }
        }
    }
    OUTPUT["Scanpath"] = mergedScanpath;
} else {
    CACHE["MergedScanpath"] = undefined;
    CACHE["Fixations"] = undefined;
    CACHE["Scanpath"] = undefined;
    CACHE["ImageSize"] = undefined;
    CACHE["ImageProcessing"] = undefined;
}
