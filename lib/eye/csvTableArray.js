var files = SETTINGS_VAL["CSV Files"];

if (files) {
    if (SETTINGS_CHANGED["CSV Files"]) {
        SETTINGS_CHANGED["CSV Files"] = false;
        var n = files.length;
        DATA["CSV"] = [];
        DATA["CSV Names"] = [];
        DATA["CSV Count"] = n;
        for (var i = 0; i < n; ++i) {
            Papa.parse(files[i], {
                complete: function(res, f) {
                    DATA["CSV"].push(res.data);
                    DATA["CSV Names"].push(f.name);
                    if (DATA["CSV"].length === DATA["CSV Count"])
                        PROCESS();
                }
            });
        }
    }
}

if (DATA["CSV"] && (DATA["CSV"].length === DATA["CSV Count"])) {
    var index = CACHE["Index"];
    if (index === undefined)
        index = 0;
    var data = DATA["CSV"];
    OUTPUT["Table"] = data[index];
    OUTPUT["Table Index"] = index;
    OUTPUT["Table Count"] = data.length;
    if (IN_VISUALIZATION) {
        if (index < data.length) {
            ++index;
            CACHE["Index"] = index;
            PROCESS();
        }
    } else {
        CACHE["Index"] = undefined;
    }
}
