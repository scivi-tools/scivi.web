function approximateCubicBezierCurve(sx, sy, c1x, c1y, c2x, c2y, ex, ey, epsilon, result)
{
    if (!lineContainsPoint(sx, sy, ex, ey, epsilon, c1x, c1y) ||
        !lineContainsPoint(sx, sy, ex, ey, epsilon, c2x, c2y)
    ) {
        const a1x = (sx + c1x) / 2;
        const a1y = (sy + c1y) / 2;
        const a2x = (c1x + c2x) / 2;
        const a2y = (c1y + c2y) / 2;
        const a3x = (c2x + ex) / 2;
        const a3y = (c2y + ey) / 2;

        const vx = (a1x + a2x) / 2;
        const vy = (a1y + a2y) / 2;
        const wx = (a2x + a3x) / 2;
        const wy = (a2y + a3y) / 2;
        const mx = (vx + wx) / 2;
        const my = (vy + wy) / 2;

        approximateCubicBezierCurve(sx, sy, a1x, a1y, vx, vy, mx, my, epsilon, result);
        approximateCubicBezierCurve(mx, my, wx, wy, a3x, a3y, ex, ey, epsilon, result);
    } else {
        if (result.length === 0) {
            result.push(sx);
            result.push(sy);
        }
        result.push(ex);
        result.push(ey);
    }
    return result;
}

function lineContainsPoint(ax, ay, bx, by, fuzz, px, py)
{
    if (fuzz <= 0) {
        fuzz = 0.000001;
    }
    let maxx = 0;
    let minx = 0;
    let maxy = 0;
    let miny = 0;
    if (ax < bx) {
        minx = ax;
        maxx = bx;
    } else {
        minx = bx;
        maxx = ax;
    }
    if (ay < by) {
        miny = ay;
        maxy = by;
    } else {
        miny = by;
        maxy = ay;
    }

    if (ax === bx) {
        return (miny <= py && py <= maxy && ax - fuzz <= px && px <= ax + fuzz);
    }
    if (ay === by) {
        return (minx <= px && px <= maxx && ay - fuzz <= py && py <= ay + fuzz);
    }

    const xrangeHigh = maxx + fuzz;
    const xrangeLow = minx - fuzz;
    if (xrangeLow <= px && px <= xrangeHigh) {

        const yrangeHigh = maxy + fuzz;
        const yrangeLow = miny - fuzz;
        if (yrangeLow <= py && py <= yrangeHigh) {
            if (xrangeHigh - xrangeLow > yrangeHigh - yrangeLow) {
                if (ax - bx > fuzz || bx - ax > fuzz) {
                    const slope = (by - ay) / (bx - ax);
                    const guessY = (slope * (px - ax) + ay);

                    if ((guessY - fuzz <= py) && (py <= guessY + fuzz)) {
                        return true;
                    }
                } else {
                    return true;
                }
            } else {
                if (ay - by > fuzz || by - ay > fuzz) {
                    const slope = (bx - ax) / (by - ay);
                    const guessX = (slope * (py - ay) + ax);

                    if ((guessX - fuzz <= px) && (px <= guessX + fuzz)) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }
    }
    return false;
}

function approximateQuadraticBezierCurve(sx, sy, cx, cy, ex, ey, epsilon, result)
{
    if (!lineContainsPoint(sx, sy, ex, ey, epsilon, cx, cy)) {
        const a1x = (sx + cx) / 2;
        const a1y = (sy + cy) / 2;
        const a2x = (cx + ex) / 2;
        const a2y = (cy + ey) / 2;

        const mx = (a1x + a2x) / 2;
        const my = (a1y + a2y) / 2;

        approximateQuadraticBezierCurve(sx, sy, a1x, a1y, mx, my, epsilon, result);
        approximateQuadraticBezierCurve(mx, my, a2x, a2y, ex, ey, epsilon, result);
    } else {
        if (result.length === 0) {
            result.push(sx);
            result.push(sy);
        }
        result.push(ex);
        result.push(ey);
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

    const EPSILON = 2;

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
    return Math.sqrt(vx * vx + vy & vy);
}

function combine(ptA, ptB)
{
    return [ (ptA[0] + ptB[0]) / 2.0, (ptA[1] + ptB[1]) / 2.0 ];
}

function rmDoubles(poly)
{
    var result = [];
    for (var i = 0; i < poly.length; ++i) {
        if (i < poly.length - 1) {
            if (distance(poly[i], poly[i + 1]) < 3.0) {
                result.push(combine(poly[i], poly[i + 1]));
                ++i;
            } else {
                result.push(poly[i]);
            }
        }
    }
    return result;
}

function dilate(poly, epsilon)
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
        if (pointInPolygon(pt, poly)) {
            pt[0] = poly[i][0] - n[0];
            pt[1] = poly[i][1] - n[1];
            if (pointInPolygon(pt, poly))
                pt = poly[i];
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
    if (!cA.dilatedPath)
        cA.dilatedPath = dilate(cA.path, epsilon);
    for (var i = 0; i < cB.path.length; ++i) {
        if (!pointInPolygon(cB.path[i], cA.dilatedPath))
            return false;
    }
    return true;
}

function makeHierarchy(contours)
{
    var totalBBox = null;
    for (var i = 0; i < contours.length; ++i) {
        contours[i].bbox = bbox(contours[i].path);
        if (totalBBox)
            totalBBox = bboxUnion(totalBBox, contours[i].bbox);
        else
            totalBBox = contours[i].bbox;
    }
    for (var i = 0; i < contours.length; ++i)
        contours[i].path = rmDoubles(contours[i].path);
    const EPSILON = 0.01;
    var epsilon = EPSILON * Math.min(totalBBox[2] - totalBBox[0], totalBBox[3] - totalBBox[1]);
    for (var i = 0; i < contours.length; ++i) {
        for (var j = 0; j < contours.length; ++j) {
            if (i !== j && encloses(contours[i], contours[j], epsilon)) {
                if (!contours[i].children)
                    contours[i].children = [];
                contours[i].children.push(contours[j]);
            }
        }
    }
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
}
