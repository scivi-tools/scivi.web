if (IN_VISUALIZATION && HAS_INPUT["Destination"]) {
    var ts = CACHE["ts"];
    if (!ts)
        ts = new Date();
    const now = new Date();
    const delta = Math.min((now - ts) / 1000.0, 1.0 / 60.0);
    CACHE["ts"] = now;

    var val = CACHE["val"];
    if (val === undefined) {
        val = 0;
        CACHE["val"] = val;
    }
    var to = INPUT["Destination"];
    if (to !== CACHE["to"]) {
        CACHE["step"] = (to - val) / SETTINGS_VAL["Duration"] * delta;
        CACHE["to"] = to;
    }
    if (val !== to) {
        requestAnimationFrame(function () {
            var val = CACHE["val"];
            var to = CACHE["to"];
            var step = CACHE["step"];
            val += step;
            if (Math.sign(to - val) !== Math.sign(step)) {
                val = to;
            }
            CACHE["val"] = val;
            PROCESS();
        });
    }
    OUTPUT["Value"] = val;
} else {
    CACHE["val"] = undefined;
    CACHE["step"] = undefined;
    CACHE["to"] = undefined;
    CACHE["ts"] = undefined;
}
