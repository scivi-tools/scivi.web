
const TIME_TH = SETTINGS_VAL["Time Threshold"]; // In ms.
const FREQ_TH = 30; // In Hz.
const DISP_TH = SETTINGS_VAL["Angular Dispersion"]; // In degrees.
const IDX_T = 0;
const IDX_HX = 3;
const IDX_HY = 4;
const IDX_HZ = 5;
const IDX_GX = 6;
const IDX_GY = 7;
const IDX_GZ = 8;

function getTimeWindow(gaze, startIdx, timeTh)
{
    var result = startIdx;
    var startTime = gaze[startIdx][IDX_T];
    while (result < gaze.length && gaze[result][IDX_T] - startTime < timeTh)
        ++result;
    --result;
    if (result <= startIdx)
        result = startIdx + 1;
    if (result === gaze.length)
        --result;
    return result;
}

function mean(gaze, startIdx, endIdx, k)
{
    var sum = 0;
    for (var i = startIdx; i <= endIdx; ++i)
        sum += gaze[i][k];
    return sum / (endIdx - startIdx + 1);
}

function ndot(x1, y1, z1, x2, y2, z2)
{
    return (x1 * x2 + y1 * y2 + z1 * z2) / (Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1) * Math.sqrt(x2 * x2 + y2 * y2 + z2* z2));
}

function freqOfPoints(gaze, startIdx, endIdx)
{
    var result = 1000000;
    for (var i = startIdx + 1; i <= endIdx; ++i)
        result = Math.min(result, 1000.0 / (gaze[i][IDX_T] - gaze[i - 1][IDX_T]));
    return result;
}

function angularDispersion(gaze, startIdx, endIdx)
{
    var result = 2;
    var mHX = mean(gaze, startIdx, endIdx, IDX_HX);
    var mHY = mean(gaze, startIdx, endIdx, IDX_HY);
    var mHZ = mean(gaze, startIdx, endIdx, IDX_HZ);
    for (var i = startIdx; i <= endIdx; ++i) {
        for (var j = startIdx; j <= endIdx; ++j) {
            if (i !== j) {
                result = Math.min(result, ndot(gaze[i][IDX_GX] - mHX, gaze[i][IDX_GY] - mHY, gaze[i][IDX_GZ] - mHZ,
                                               gaze[j][IDX_GX] - mHX, gaze[j][IDX_GY] - mHY, gaze[j][IDX_GZ] - mHZ));
            }
        }
    }
    return Math.acos(result) * 180.0 / Math.PI;
}

function extendRow(row, idx)
{
    var result = row.slice();
    result.push(idx);
    return result;
}

if (IN_VISUALIZATION) {
    if (HAS_INPUT["Gaze"] && INPUT["Gaze"]) {
        var gazeIn = INPUT["Gaze"];
        var saccades = [];
        var fixations = [];
        var saccadeIdx = 0;
        var fixationIdx = 0;
        var restartSaccade = false;

        var gaze = [];
        for (var i = 0; i < gazeIn.length; ++i) {
            if (gazeIn[i].length > 1)
                gaze.push(gazeIn[i].map(parseFloat));
        }

        for (var startIdx = 0; startIdx < gaze.length - 1;) {
            var endIdx = getTimeWindow(gaze, startIdx, TIME_TH);
            if (freqOfPoints(gaze, startIdx, endIdx) > FREQ_TH) {
                if (angularDispersion(gaze, startIdx, endIdx) <= DISP_TH) {
                    while (endIdx < gaze.length &&
                           freqOfPoints(gaze, startIdx, endIdx) > FREQ_TH &&
                           angularDispersion(gaze, startIdx, endIdx) <= DISP_TH)
                        ++endIdx;
                    saccades.push(extendRow(gaze[startIdx], saccadeIdx));
                    while (startIdx < endIdx)
                        fixations.push(extendRow(gaze[startIdx++], fixationIdx));
                    ++fixationIdx;
                    if (startIdx < gaze.length) {
                        if (saccades.length > 0)
                            ++saccadeIdx;
                        saccades.push(extendRow(gaze[startIdx - 1], saccadeIdx));
                        saccades.push(extendRow(gaze[startIdx++], saccadeIdx));
                    }
                    restartSaccade = false;
                } else {
                    if (restartSaccade) {
                        if (saccades.length > 0)
                            ++saccadeIdx;
                        restartSaccade = false;
                    }
                    saccades.push(extendRow(gaze[startIdx++], saccadeIdx));
                }
            } else {
                ++startIdx;
                restartSaccade = true;
            }
        }

        OUTPUT["Saccades"] = saccades;
        OUTPUT["Fixations"] = fixations;
        console.log(saccades);
        console.log(fixations);
        console.log("Saccades: " + saccadeIdx);
        console.log("Fixations: " + fixationIdx);
    }
}
