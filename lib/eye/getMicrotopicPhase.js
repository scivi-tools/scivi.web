function lastMeaningful(csv)
{
    for (var i = csv.length - 1; i > 0; --i) {
        if (csv[i].length === csv[0].length)
            return i;
    }
    return 0;
}

if (HAS_INPUT["Gaze"] && HAS_INPUT["Walls"]) {
    var gaze = INPUT["Gaze"];
    var walls = INPUT["Walls"];
    var readingPhaseEnd = parseInt(walls[1][0]);
    var keywordsPhaseEnd = 0;
    var n = lastMeaningful(walls);
    var microtopPhaseEnd = parseInt(walls[n][0]);
    var i = 2;
    for (; i <= n; ++i) {
        if (walls[i][1] === "DeleteWall") {
            keywordsPhaseEnd = parseInt(walls[i][0]);
            break;
        }
    }

    var start = 0;
    var end = 0;
    var wallsOut = [ walls[0] ];
    var gazeOut = [ gaze[0] ];

    switch (parseInt(SETTINGS_VAL["Phase"])) {
        case 0:
            start = 0;
            end = readingPhaseEnd;
            break;

        case 1:
            start = readingPhaseEnd;
            end = keywordsPhaseEnd;
            for (var j = 1; j <= i; ++j)
                wallsOut.push(walls[j]);
            break;

        case 2:
            start = keywordsPhaseEnd;
            end = microtopPhaseEnd;
            for (var j = i + 1; j <= n; ++j)
                wallsOut.push(walls[j]);
            break;
    }

    for (i = 1, n = lastMeaningful(gaze); i <= n; ++i) {
        var t = parseInt(gaze[i][0]);
        if (t >= end)
            break;
        else if (t >= start)
            gazeOut.push(gaze[i]);
    }

    OUTPUT["Gaze"] = gazeOut;
    OUTPUT["Walls"] = wallsOut;
    console.log(OUTPUT["Gaze"]);
    console.log(OUTPUT["Walls"]);
}
