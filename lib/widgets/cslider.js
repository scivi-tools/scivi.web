if (IN_VISUALIZATION) {
    var val = CACHE["current"];
    if (val === undefined) {
        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.textAlign = "center";

        var lbl = document.createElement("span");
        lbl.style.width = "100px";
        lbl.style.height = "30px";
        lbl.style.display = "inline-block";
        toolbar.appendChild(lbl);

        var from = SETTINGS_VAL["From Value"];
        var to = SETTINGS_VAL["To Value"];
        var step = SETTINGS_VAL["Step"];
        var start = SETTINGS_VAL["Start Value"];

        var slider = document.createElement("input");
        slider.type = "range";
        slider.min = from;
        slider.max = to;
        slider.step = step;
        slider.value = start;
        slider.style.width = "calc(100% - 120px)";
        slider.style.height = "30px";
        slider.style.verticalAlign = "middle";
        slider.addEventListener("input", function () {
            lbl.innerHTML = slider.value;
            CACHE["current"] = parseFloat(slider.value);
            PROCESS();
        });
        toolbar.appendChild(slider);

        container.appendChild(toolbar);

        ADD_VISUAL(container);

        CACHE["current"] = start;
        lbl.innerHTML = start;
        OUTPUT["Value"] = start;
    } else {
        OUTPUT["Value"] = val;
    }
} else {
    CACHE["current"] = undefined;
}
