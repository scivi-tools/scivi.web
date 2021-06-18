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
                10,
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
                10,
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

if (SETTINGS_VAL["Map File"]) {
    if (SETTINGS_CHANGED["Map File"]) {
        SETTINGS_CHANGED["Map File"] = false;
        var f = SETTINGS_VAL["Map File"];
        var reader = new FileReader();
        reader.onload = function (evt) {
            var json = JSON.parse(reader.result);
            DATA["map"] = convertStudioMapToSciViFormat(json);
            console.log(DATA["map"]);
            PROCESS();
        };
        reader.readAsText(f);
    }
}
if (DATA["map"]) {
    OUTPUT["Picture"] = DATA["map"].image;
}
