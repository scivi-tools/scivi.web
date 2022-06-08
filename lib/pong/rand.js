function regenerate()
{
    if (IN_VISUALIZATION) {
        var from = SETTINGS_VAL["From"];
        var to = SETTINGS_VAL["To"];
        var result = Math.random() * (to - from) + from;
        CACHE["value"] = result;
        setTimeout(regenerate, SETTINGS_VAL["Interval"] * 1000);
        PROCESS();
    }
}

if (IN_VISUALIZATION) {
    var value = CACHE["value"];
    if (value === undefined)
        regenerate();
    OUTPUT["Value"] = value;
} else {
    CACHE["value"] = undefined;
}
