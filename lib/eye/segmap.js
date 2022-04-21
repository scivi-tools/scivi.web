function approximateCubicBezierCurve(sx, sy, c1x, c1y, c2x, c2y, ex, ey, epsilon, result)
{
    var p1 = [sx, sy];
    var p2 = [c1x, c1y];
    var p3 = [c2x, c2y];
    var p4 = [ex, ey];
    var l = distance(p1, p2) + distance(p2, p3) + distance(p3, p4);
    var N = Math.floor(l / epsilon);
    for (var i = 0; i < N; ++i) {
        var t = i / (N - 1);
        var t2 = t * t;
        var t3 = t2 * t;
        var nt = 1.0 - t;
        var nt2 = nt * nt;
        var nt3 = nt2 * nt;
        result.push(nt3 * sx + 3 * nt2 * t * c1x + 3 * nt * t2 * c2x + t3 * ex);
        result.push(nt3 * sy + 3 * nt2 * t * c1y + 3 * nt * t2 * c2y + t3 * ey);
    }
    return result;
}

function approximateQuadraticBezierCurve(sx, sy, cx, cy, ex, ey, epsilon, result)
{
    var p1 = [sx, sy];
    var p2 = [cx, cy];
    var p3 = [ex, ey];
    var l = distance(p1, p2) + distance(p2, p3);
    var N = Math.floor(l / epsilon);
    for (var i = 0; i < N; ++i) {
        var t = i / (N - 1);
        var t2 = t * t;
        var nt = 1.0 - t;
        var nt2 = nt * nt;
        result.push(nt2 * sx + 2 * nt * t * cx + t2 * ex);
        result.push(nt2 * sy + 2 * nt * t * cy + t2 * ey);
    }
    return result;
}

function parsePath(path)
{
    let types = ["L", "Q", "C"];
    let parsed = [];
    path.split(/M/).map(simplePath => {
        if (simplePath.trim() !== "") {
            let parsedPath = {};
            let curves = simplePath.split(/ [LQC] /);
            parsedPath.mCoo = {x: +curves[0].split(",")[0], y: +curves[0].split(",")[1]};
            parsedPath.curves = [];
            curves.splice(0, 1);

            curves.map(curve => {
                let parsedCurve = {};
                parsedCurve.command = types[curve.trim().split(" ").length - 1];
                parsedCurve.points = [];

                let points = curve.trim().split(" ");
                points.map(point => parsedCurve.points.push({x: +point.split(",")[0], y: +point.split(",")[1]}));
                parsedPath.curves.push(parsedCurve);
                return undefined;
            });
            parsed.push(parsedPath);
        }
        return undefined;
    });
    return parsed;
}

function pathToString(parsed)
{
    let path = "";
    parsed.map(simplePath => {
        path += `M ${simplePath.mCoo.x},${simplePath.mCoo.y} `;
        simplePath.curves.map(curve => {
            path += `${curve.command} `;
            curve.points.map(point => path += `${point.x},${point.y} `);
            return undefined;
        });
        return undefined;
    });
    return path.trim();
}

function transformPath(path, xShift, yShift, xScale, yScale)
{
    if (path === "") {
        return "";
    }
    let parsed = parsePath(path);
    parsed.map((simplePath, i) => {
        parsed[i].mCoo = {x: (parsed[i].mCoo.x + xShift) * xScale, y: (parsed[i].mCoo.y + yShift) * yScale};
        simplePath.curves.map((curve, j) =>
            curve.points.map((point, k) =>
                parsed[i].curves[j].points[k] = {x: (point.x + xShift) * xScale, y: (point.y + yShift) * yScale})
        );
        return undefined;
    });

    return pathToString(parsed);
}

function approximateLinearly(path)
{
    if (path === "") {
        return [];
    }
    let result = [];

    let parsedPath = parsePath(path);
    let firstSegmentPoint = parsedPath[0].mCoo;

    const EPSILON = 5;

    let curves = parsedPath[0].curves;
    for (let i = 0; i < curves.length; i++) {
        let points = [];
        if (curves[i].command === "Q") {
            points = approximateQuadraticBezierCurve(
                firstSegmentPoint.x,
                firstSegmentPoint.y,
                curves[i].points[0].x,
                curves[i].points[0].y,
                curves[i].points[1].x,
                curves[i].points[1].y,
                EPSILON,
                []
            );
            firstSegmentPoint = {x: curves[i].points[1].x, y: curves[i].points[1].y};
        } else if (curves[i].command === "C") {
            points = approximateCubicBezierCurve(
                firstSegmentPoint.x,
                firstSegmentPoint.y,
                curves[i].points[0].x,
                curves[i].points[0].y,
                curves[i].points[1].x,
                curves[i].points[1].y,
                curves[i].points[2].x,
                curves[i].points[2].y,
                EPSILON,
                []
            );
            firstSegmentPoint = {x: curves[i].points[2].x, y: curves[i].points[2].y};
        } else if (curves[i].command === "L") {
            points = [
                firstSegmentPoint.x,
                firstSegmentPoint.y,
                curves[i].points[0].x,
                curves[i].points[0].y
            ];
            firstSegmentPoint = {x: curves[i].points[0].x, y: curves[i].points[0].y};
        }
        result = result.concat(i === 0 ? points : points.slice(2));
    }
    return result;
}

function convertStudioMapToSciViFormat(jsonMap)
{
    let result = {
        image: jsonMap.menu.backgroundImage || "",
        contours: []
    };

    let figures = jsonMap.main.figures;
    Object.keys(figures).map((uuid, i) => {
        let figure = figures[uuid];
        if (figure.points) {
            /*transformPath из библиотеки студии, поэтому здесь есть параметры масштаба, но нам они не нужны, поэтому стандартные (1) указал.
            Если в визуализаторе нужно будет другой масштаб, можно для контуров поставить другие значения*/
            let approximatedPath = approximateLinearly(transformPath(figure.points, figure.x, figure.y, 1, 1));
            let approximatedPathWithGroupedPoints = [];
            for (let i = 0; i < approximatedPath.length; i += 2) {
                approximatedPathWithGroupedPoints.push([approximatedPath[i], approximatedPath[i + 1]]);
            }

            result.contours.push({
                name: figure.name,
                path: approximatedPathWithGroupedPoints
            });
        }
        return undefined;
    })
    return result;
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

/**
 * Bounding box is formatted as [ x1, y1, x2, y2 ].
 */
function bbox(poly)
{
    var result = null;
    for (var i = 0; i < poly.length; ++i) {
        if (isNaN(poly[i][0]) || isNaN(poly[i][1]))
            return null;
        if (!result)
            result = [ poly[i][0], poly[i][1], poly[i][0], poly[i][1] ];
        else {
            if (poly[i][0] < result[0])
                result[0] = poly[i][0];
            if (poly[i][1] < result[1])
                result[1] = poly[i][1];
            if (poly[i][0] > result[2])
                result[2] = poly[i][0];
            if (poly[i][1] > result[3])
                result[3] = poly[i][1];
        }
    }
    return result;
}

function bboxUnion(bbA, bbB)
{
    return [ Math.min(bbA[0], bbB[0]), Math.min(bbA[1], bbB[1]), Math.max(bbA[2], bbB[2]), Math.max(bbA[3], bbB[3]) ];
}

function bboxIntersection(bbA, bbB)
{
    return !(bbA[0] >= bbB[2] || bbA[2] <= bbB[0] || bbA[1] >= bbB[3] || bbA[3] <= bbB[1]);
}

function fakeArea(c)
{
    return (c.bbox[2] - c.bbox[0]) * (c.bbox[3] - c.bbox[1]);
}

/**
 * Vertor is formatted as [ x, y ].
 */
function normalize(v)
{
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    v[0] /= l;
    v[1] /= l;
}

function distance(ptA, ptB)
{
    var vx = ptB[0] - ptA[0];
    var vy = ptB[1] - ptA[1];
    return Math.sqrt(vx * vx + vy * vy);
}

function combine(ptA, ptB)
{
    return [ (ptA[0] + ptB[0]) / 2.0, (ptA[1] + ptB[1]) / 2.0 ];
}

function rmDoubles(poly, epsilon)
{
    var result = [];
    if (poly.length > 0) {
        var curPt = poly[0];
        for (var i = 1; i < poly.length; ++i) {
            if (distance(curPt, poly[i]) < epsilon)
                curPt = combine(curPt, poly[i]);
            else {
                result.push(curPt);
                curPt = poly[i];
            }
        }
        result.push(curPt);
    }
    return result;
}

function erode(poly, epsilon)
{
    if (poly.length < 2)
        return poly;
    var result = [];
    for (var i = 0; i < poly.length; ++i) {
        var tg = null;
        if (i == 0 || i == poly.length - 1)
            tg = [ poly[1][0] - poly[poly.length - 2][0], poly[1][1] - poly[poly.length - 2][1] ];
        else
            tg = [ poly[i + 1][0] - poly[i - 1][0], poly[i + 1][1] - poly[i - 1][1] ];
        var n = [ -tg[1], tg[0] ];
        normalize(n);
        n[0] *= epsilon;
        n[1] *= epsilon;
        var pt = [ poly[i][0] + n[0], poly[i][1] + n[1] ];
        if (!pointInPolygon(pt, poly)) {
            pt[0] = poly[i][0] - n[0];
            pt[1] = poly[i][1] - n[1];
            if (!pointInPolygon(pt, poly))
                continue;
        }
        result.push(pt);
    }
    return result;
}

function isParent(cA, cB)
{
    if (!cA.children)
        return false;
    for (var i = 0; i < cA.children.length; ++i) {
        if (cA.children[i] === cB || isParent(cA.children[i], cB))
            return true;
    }
    return false;
}

function encloses(cA, cB, epsilon)
{
    if (isParent(cB, cA) || fakeArea(cA) < fakeArea(cB) || !bboxIntersection(cA.bbox, cB.bbox))
        return false;
    if (!cB.erodedPath)
        cB.erodedPath = rmDoubles(erode(cB.path, epsilon * 2), epsilon);
    for (var i = 0; i < cB.erodedPath.length; ++i) {
        if (!pointInPolygon(cB.erodedPath[i], cA.path))
            return false;
    }
    return true;
}

function makeHierarchy(contours)
{
    var totalBBox = null;
    for (var i = 0; i < contours.length;) {
        contours[i].bbox = bbox(contours[i].path);
        if (!contours[i].name || contours[i].name.length === 0 || !contours[i].bbox) {
            console.log("Delete malformed contour " + i);
            contours.splice(i, 1);
        } else {
            if (totalBBox)
                totalBBox = bboxUnion(totalBBox, contours[i].bbox);
            else
                totalBBox = contours[i].bbox;
            ++i;
        }
    }
    const EPSILON = 0.01;
    var epsilon = EPSILON * Math.min(totalBBox[2] - totalBBox[0], totalBBox[3] - totalBBox[1]);
    var e = epsilon / 3.0;
    for (var i = 0; i < contours.length; ++i)
        contours[i].path = rmDoubles(contours[i].path, e);
    for (var i = 0; i < contours.length; ++i) {
        for (var j = 0; j < contours.length; ++j) {
            if (i !== j && encloses(contours[i], contours[j], epsilon)) {
                if (!contours[i].children)
                    contours[i].children = [];
                contours[i].children.push(contours[j]);
            }
        }
    }
    contours.sort(function (cA, cB) {
        if (isParent(cA, cB))
            return -1;
        else if (cA.children && !cB.children)
            return -1;
        else if (!cA.children && cB.children)
            return 1;
        else if (!cA.children && !cB.children)
            return 0;
        else
            return cA.children.length > cB.children.length ? -1 : 1;
    });
}

if (SETTINGS_VAL["Map File"]) {
    if (SETTINGS_CHANGED["Map File"]) {
        SETTINGS_CHANGED["Map File"] = false;
        var f = SETTINGS_VAL["Map File"];
        var reader = new FileReader();
        reader.onload = function (evt) {
            var json = JSON.parse(reader.result);
            var map = convertStudioMapToSciViFormat(json);
            DATA["map"] = map;
            makeHierarchy(map.contours);
            console.log(DATA["map"]);
            PROCESS();
        };
        reader.readAsText(f);
    }
}
if (DATA["map"]) {
    OUTPUT["Picture"] = DATA["map"].image;
    OUTPUT["AOIs"] = DATA["map"].contours;
    DATA["map"] = undefined;
}
