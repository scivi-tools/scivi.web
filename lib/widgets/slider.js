if (IN_VISUALIZATION) {
    if (HAS_INPUT["Variants"]) {
        if (!CACHE["variants"]) {
            var variants = INPUT["Variants"];
            CACHE["variants"] = variants;

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
            lbl.style.margin = "0px 20px 0px 0px";
            lbl.style.verticalAlign = "middle";
            toolbar.appendChild(lbl);

            var slider = document.createElement("input");
            slider.type = "range";
            slider.min = 0;
            slider.max = variants.length - 2;
            slider.value = 0;
            slider.style.width = "calc(100% - 120px)";
            slider.style.height = "30px";
            slider.style.verticalAlign = "middle";
            slider.addEventListener("input", function () {
                var s = CACHE["variants"][parseInt(slider.value) + 1][0];
                lbl.innerHTML = s;
                CACHE["selected"] = s;
                PROCESS();
            });
            toolbar.appendChild(slider);

            container.appendChild(toolbar);

            ADD_VISUAL(container);

            CACHE["selected"] = variants[1][0];
            lbl.innerHTML = variants[1][0];
        }
    }
    var s = CACHE["selected"];
    if (s !== undefined)
        OUTPUT["Selected Variant"] = s;
} else {
    CACHE["variants"] = undefined;
    CACHE["selected"] = undefined;
}
