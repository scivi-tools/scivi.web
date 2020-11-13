if (IN_VISUALIZATION && HAS_INPUT["Color Transitions"] && INPUT["Color Transitions"]) {
    var table = INPUT["Color Transitions"];
    var colors = [];
    var nodes = [];
    var edges = [];
    var addColor = function (c, colors) {
        var n = colors.length;
        for (var i = 0; i < n; ++i) {
            if (c === colors[i])
                return i;
        }
        colors.push(c);
        return n;
    };
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
    for (var i = 0, n = table.length; i < n; ++i) {
        var colorTrans = table[i][1].split(" -> ");
        if (colorTrans.length == 2) {
            var from = addColor(colorTrans[0], colors);
            var to = addColor(colorTrans[1], colors);
            var w = parseFloat(table[i][0]);
            if (!isNaN(w) && w > 0)
                edges.push({ "source": from, "target": to, "weight": w });
        }
    }
    for (var i = 0, n = colors.length; i < n; ++i) {
        var lbl = null;
        var colorLbl = colors[i];
        if (colorLbl.length === 0) {
            colors[i] = 0x000000;
            lbl = "E";
        } else if (colorLbl.startsWith("#")) {
            colors[i] = hex2int(colors[i]);
            lbl = "■";
        } else if (colorLbl === "start") {
            colors[i] = 0x000000;
            lbl = "S";
        }
        nodes.push({ id: i, label: lbl, weight: 0, group: i, info: colorLbl });
    }
    OUTPUT["Graph Data"] = { label: SETTINGS_VAL["Name"], nodes: nodes, edges: edges };
    OUTPUT["Colors"] = colors;
}
