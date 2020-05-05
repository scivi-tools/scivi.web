if (HAS_INPUT["Hue"] && HAS_INPUT["Saturation"] && HAS_INPUT["Value"]) {
    var h = INPUT["Hue"];
    var s = INPUT["Saturation"];
    var v = INPUT["Value"];
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
    var r, g, b;
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    var toHex = function (x) { return ((x >> 4) & 0xF).toString(16) + (x & 0xF).toString(16); };
    OUTPUT["Color Value"] = "#" + toHex(r * 255) + toHex(g * 255) + toHex(b * 255);
}
