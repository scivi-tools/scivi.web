if (HAS_INPUT["Value"]) {
    var value = INPUT["Value"];
    var minVal = DATA["minVal"];
    var maxVal = DATA["maxVal"];
    var fromVal = SETTINGS_VAL["From Value"];
    var toVal = SETTINGS_VAL["To Value"];
    if (minVal === undefined || value < minVal) {
        minVal = value;
        DATA["minVal"] = minVal;
    }
    if (maxVal === undefined || value > maxVal) {
        maxVal = value;
        DATA["maxVal"] = maxVal;
    }
    OUTPUT["Mapped Value"] = Math.abs(maxVal - minVal) < 1.0e-5 ?
                             fromVal :
                             fromVal + (value - minVal) / (maxVal - minVal) * (toVal - fromVal);
}
