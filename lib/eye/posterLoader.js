
var files = SETTINGS_VAL["Poster Images"];
if (files) {
    if (SETTINGS_CHANGED["Poster Images"]) {
        SETTINGS_CHANGED["Poster Images"] = false;
        var n = files.length;
        DATA["Images"] = [];
        DATA["Image Count"] = n;
        for (var i = 0; i < n; ++i) {
            (function(file, index) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    DATA["Images"].push({name: file.name, data: e.target.result, index: index});
                    if (DATA["Images"].length === DATA["Image Count"]) {
                        DATA["Images"].sort(function(a, b) {
                            return a.index < b.index ? -1 : 1;
                        });
                        PROCESS();
                    }
                }
                reader.readAsDataURL(file);
            })(files[i], i);
        }
    }
}

if (DATA["Images"] !== undefined && DATA["Images"].length === DATA["Image Count"]) {
    SETTINGS["Poster To Show"] = DATA["Images"].map(function (img) { return img.name; });
    if (SETTINGS_VAL["Poster To Show"] === undefined || SETTINGS_VAL["Poster To Show"] >= DATA["Images"].length)
        SETTINGS_VAL["Poster To Show"] = 0;
}

if (DATA["Images"] !== undefined && SETTINGS_VAL["Poster To Show"] !== undefined && SETTINGS_VAL["Poster To Show"] < DATA["Images"].length) {
    OUTPUT["Picture"] = DATA["Images"][SETTINGS_VAL["Poster To Show"]].data;
}
