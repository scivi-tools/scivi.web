const IDX_AOI_ID = 0;
const IDX_AOI_AVT = 4;

if (IN_VISUALIZATION && HAS_INPUT["Scanpath"]) {
    var scanpath = INPUT["Scanpath"];
    if (scanpath) {
        var result = [ ["AOI ID", "Total fixation time"] ];
        var maxAOIID = 0;
        for (var i = 0, n = scanpath.length; i < n; ++i) {
            for (var j = 1, m = scanpath[i].length; j < m; ++j) {
                if (scanpath[i][j][IDX_AOI_ID] > maxAOIID)
                    maxAOIID = scanpath[i][j][IDX_AOI_ID];
            }
        }
        for (var i = 0, n = maxAOIID; i <= n; ++i) {
            result.push([ i, 0 ]);
        }
        for (var i = 0, n = scanpath.length; i < n; ++i) {
            for (var j = 1, m = scanpath[i].length; j < m; ++j) {
                result[scanpath[i][j][IDX_AOI_ID] + 1][1] += scanpath[i][j][IDX_AOI_AVT];
            }
        }
        if (SETTINGS_VAL["append to scanpath"])
            OUTPUT["Values"] = [...scanpath, result]
        else
            OUTPUT["Values"] = [ result ];
    }
}
