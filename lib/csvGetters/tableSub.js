function sub(a, b)
{
    if (a.length === 0 && b.length === 0)
        return "";
    var fA = Number(a);
    var fB = Number(b);
    return !isNaN(fA) && !isNaN(fB) ? fA - fB : a;
}

if (HAS_INPUT["Table A"] && INPUT["Table A"] && HAS_INPUT["Table B"] && INPUT["Table B"]) {
    var tA = INPUT["Table A"];
    var tB = INPUT["Table B"];
    var tR = [];
    for (var i = 0, n = tA.length; i < n; ++i) {
        if (tA[i].length === tA[0].length && i < tB.length) {
            tR.push([]);
            for (var j = 0, m = tA[i].length; j < m; ++j) {
                if (j < tB[i].length)
                    tR[i].push(sub(tA[i][j], tB[i][j]));
            }
        }
    }
    OUTPUT["Table A - B"] = tR;
}
