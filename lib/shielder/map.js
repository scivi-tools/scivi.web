if (IN_VISUALIZATION && HAS_INPUT["From"] && INPUT["From"] !== undefined) {
    var inMin = SETTINGS_VAL["InMin"];
    var inMax = SETTINGS_VAL["InMax"];
    var outMin = SETTINGS_VAL["OutMin"];
    var outMax = SETTINGS_VAL["OutMax"];
    OUTPUT["To"] = outMin + (INPUT["From"] - inMin) / (inMax - inMin) * (outMax - outMin);
}
