if (IN_VISUALIZATION) {
    if (CACHE["PosterIndex"] === undefined) {
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

        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "24px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        var calib = document.createElement("div");
        calib.innerHTML = "Next";
        calib.classList.add("scivi_button");
        calib.addEventListener("click", function (e) {
            if (CACHE["PosterIndex"] < DATA["Image Count"]) {
                ++CACHE["PosterIndex"];
                PROCESS();
            }
        });
        toolbar.appendChild(calib);

        container.appendChild(toolbar);

        ADD_VISUAL(container);
        CACHE["PosterIndex"] = -1;

        var w = SETTINGS_VAL["Stub Width"];
        var h = SETTINGS_VAL["Stub Height"];
        var cvs = document.createElement("canvas");
        cvs.width = w;
        cvs.height = h;
        var ctx = cvs.getContext("2d");
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#000";
        ctx.arc(w / 2.0, h / 2.0, 10, 0, Math.PI * 2.0, false);
        ctx.fill();
        CACHE["Stub"] = cvs.toDataURL();
    }
    if (DATA["Images"].length === DATA["Image Count"] && CACHE["PosterIndex"] >= 0)
        // OUTPUT["Picture"] = DATA["Images"][CACHE["PosterIndex"]].data;
        OUTPUT["Picture"] = CACHE["Stub"];
} else {
    CACHE["PosterIndex"] = undefined;
    CACHE["Image Order"] = null;
    CACHE["Stub"] = null;
}
