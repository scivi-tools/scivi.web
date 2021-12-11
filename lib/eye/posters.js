if (IN_VISUALIZATION) {
    if (CACHE["PosterIndex"] === undefined) {
        var files = SETTINGS_VAL["Poster Images"];
        if (files) {
            if (SETTINGS_CHANGED["Poster Images"]) {
                SETTINGS_CHANGED["Poster Images"] = false;
                var n = files.length;
                DATA["Images"] = [];
                DATA["Image Names"] = [];
                DATA["Image Count"] = n;
                for (var i = 0; i < n; ++i) {
                    DATA["Image Names"].push(files[i].name);
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        console.log(e.target.result);
                        DATA["Images"].push(e.target.result);
                        if (DATA["Images"].length === DATA["Image Count"])
                            PROCESS();
                    }
                    reader.readAsDataURL(files[i]);
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
    }
    if (DATA["Images"].length === DATA["Image Count"] && CACHE["PosterIndex"] >= 0)
        OUTPUT["Picture"] = DATA["Images"][CACHE["PosterIndex"]];
} else {
    CACHE["PosterIndex"] = undefined;
}
