var files = SETTINGS_VAL["Tables"];

if (files) {
    if (SETTINGS_CHANGED["Tables"]) {
        SETTINGS_CHANGED["Tables"] = false;
        var n = files.length;
        if (n % 2 !== 0)
            throw "Non-odd number of files";
        DATA["CSV"] = [];
        DATA["CSV Count"] = n;
        for (var i = 0; i < n; ++i) {
            Papa.parse(files[i], {
                complete: function(res, f) {
                    var data = DATA["CSV"];
                    data.push({ name: f.name, data: res.data });
                    if (data.length === DATA["CSV Count"]) {
                        data.sort((a, b) => { return a.name < b.name ? -1 : 1; });
                        PROCESS();
                    }
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
    var count = data.length / 2;
    var i = index * 2;
    OUTPUT["Table 1"] = data[i].name.endsWith(SETTINGS_VAL["Suffix 1"]) ? data[i].data : data[i + 1].data;
    OUTPUT["Table 2"] = data[i].name.endsWith(SETTINGS_VAL["Suffix 2"]) ? data[i].data : data[i + 1].data;
    OUTPUT["Index"] = index;
    OUTPUT["Count"] = count;
    if (IN_VISUALIZATION) {
        if (index < count - 1) {
            ++index;
            CACHE["Index"] = index;
            PROCESS();
        }
    } else {
        CACHE["Index"] = undefined;
    }
}
