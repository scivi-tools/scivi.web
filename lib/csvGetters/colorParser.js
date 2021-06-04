if (IN_VISUALIZATION && HAS_INPUT["Color Names"]) {
    var table = INPUT["Color Names"];
    var colors = [];
    var nodes = [];
    var hex2int = function (s) {
        if (s.length !== 7)
            return 0;
        var result = 0;
        s = s.toLowerCase();
        var zCode = "0".charCodeAt(0);
        var nCode = zCode + 9;
        var aCode = "a".charCodeAt(0);
        var fCode = aCode + 5;
        for (var i = 1; i < s.length; ++i) {
            var c = s.charCodeAt(i);
            if (c >= zCode && c <= nCode)
                c -= zCode;
            else if (c >= aCode && c <= fCode)
                c -= aCode - 10;
            else
                return 0;
            result |= c << (4 * (s.length - i - 1));
        }
        return result;
    };
    var rgb2hsv = function (rgb) {
        var result = [0, 0, 0];

        var r = rgb >> 16 & 0xFF;
        var g = rgb >> 8 & 0xFF;
        var b = rgb & 0xFF;

        r /= 255;
        g /= 255;
        b /= 255;

        var mm = Math.max(r, g, b);
        var m = Math.min(r, g, b);
        var c = mm - m;

        if (c === 0)
            result[0] = 0;
        else if (mm === r)
            result[0] = ((g - b) / c) % 6;
        else if (mm === g)
            result[0] = (b - r) / c + 2;
        else
            result[0] = (r - g) / c + 4;

        result[0] *= 60;
        if (result[0] < 0)
            result[0] += 360;

        result[2] = mm;
        if (result[2] === 0)
            result[1] = 0;
        else
            result[1] = c / result[2];

        result[1] *= 100;
        result[2] *= 100;

        return result;
    };
    for (var i = 0, n = table[0].length; i < n; ++i) {
        colors.push(hex2int(table[0][i]));
        if (colors[i] === 0xFFFFFF)
            colors[i] = 0xEEEEEE;
        nodes.push({ id: i + 1, label: table[0][i], weight: 0, group: i, hsv: rgb2hsv(colors[i]) });
    }
    OUTPUT["Colors"] = colors;
    OUTPUT["Nodes"] = nodes;
}
