
var TIMESTEP = 16;

function toInt(x)
{
    return typeof x === "number" ? x : parseInt(x);
}

function tick()
{
    var gaze = CACHE["gaze"];
    var slider = CACHE["playSlider"];
    var gazeIndex = toInt(slider.value);
    var gazeMax = toInt(slider.max);
    var curTime = gaze[gazeIndex][0];
    curTime += TIMESTEP;
    while (gazeIndex <= gazeMax && curTime > gaze[gazeIndex][0])
        ++gazeIndex;
    if (gazeIndex > gazeMax)
        gazeIndex = 0;
    slider.value = gazeIndex;
    CACHE["timer"] = setTimeout(tick, TIMESTEP);
    PROCESS();
}

if (IN_VISUALIZATION) {
    var gaze = CACHE["gaze"];
    if (!gaze && HAS_INPUT["Gaze Tracking Data"]) {
        gaze = INPUT["Gaze Tracking Data"];
        CACHE["gaze"] = gaze;
        CACHE["timer"] = null;

        var n = gaze.length - 1;
        while (gaze[n].length !== gaze[0].length)
            --n;

        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "20px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        var playBtn = document.createElement("div");
        playBtn.innerHTML = "▶️";
        playBtn.classList.add("scivi_button");
        playBtn.style.verticalAlign = "middle";
        playBtn.addEventListener("click", function (e) {
            if (CACHE["timer"]) {
                playBtn.innerHTML = "▶️";
                clearTimeout(CACHE["timer"]);
                CACHE["timer"] = null;
            } else {
                playBtn.innerHTML = "⏸️";
                CACHE["timer"] = setTimeout(tick, TIMESTEP);
            }
        });

        var playSliderDiv = document.createElement("div");
        playSliderDiv.style.width = "80%";
        playSliderDiv.style.display = "inline-block";
        playSliderDiv.style.verticalAlign = "middle";

        var playSlider = document.createElement("input");
        playSlider.type = "range";
        playSlider.style.width = "100%";
        playSlider.value = 0;
        playSlider.min = 0;
        playSlider.max = n;
        playSlider.addEventListener("input", function () {
            PROCESS();
        });
        CACHE["playSlider"] = playSlider;

        playSliderDiv.appendChild(playSlider);
        toolbar.appendChild(playBtn);
        toolbar.appendChild(playSliderDiv);
        container.appendChild(toolbar);

        ADD_VISUAL(container);
    }
    if (gaze)
        OUTPUT["Gaze"] = gaze[toInt(CACHE["playSlider"].value)];
} else {
    if (CACHE["timer"])
        clearTimeout(CACHE["timer"]);
    CACHE["timer"] = null;
    CACHE["gaze"] = null;
    CACHE["playSlider"] = null;
}
