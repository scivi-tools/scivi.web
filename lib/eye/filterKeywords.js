if (IN_VISUALIZATION && HAS_INPUT["Keywords"] && HAS_INPUT["Index"] && HAS_INPUT["Count"]) {
    var keywords = INPUT["Keywords"];
    var index = INPUT["Index"];
    var count = INPUT["Count"];
    if (SCIVI.nonNull(keywords, index, count)) {
        var kw = CACHE["kw"];
        if (!kw) {
            kw = {};
            CACHE["kw"] = kw;
        }
        for (var i = 2, n = keywords.length; i < n; ++i) {
            if (keywords[i].length > 3) {
                if (kw[keywords[i][3]] === undefined)
                    kw[keywords[i][3]] = 1;
                else
                    kw[keywords[i][3]]++;
            }
        }
        if (index === count - 1) {
            var out = [ [ "ID" ] ];
            var th = SETTINGS_VAL["Threshold"];
            Object.keys(kw).forEach((key) => {
                if (kw[key] / count >= th)
                    out.push([ key ]);
            });
            OUTPUT["Keyword IDs"] = out;
        }
    }
} else {
    CACHE["kw"] = null;
}
