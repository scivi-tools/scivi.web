var files = SETTINGS_VAL["Array of graphs"];

if (files) {
    if (SETTINGS_CHANGED["Array of graphs"]) {
        SETTINGS_CHANGED["Array of graphs"] = false;
        var n = files.length;
        DATA["Graphs"] = [];
        DATA["Count"] = n;
        for (var i = 0; i < n; ++i) {
            var fr = new FileReader();
            fr.fileName = files[i].name;
            fr.onload = function (res) {
                var g = JSON.parse(res.target.result);
                g.label = res.target.fileName;
                DATA["Graphs"].push(g);
                if (DATA["Graphs"].length === DATA["Count"])
                    PROCESS();
            };
            fr.readAsText(files[i]);
        }
    }
}

if (IN_VISUALIZATION && DATA["Graphs"] && (DATA["Graphs"].length === DATA["Count"])) {
    OUTPUT["Graphs"] = DATA["Graphs"];
}
