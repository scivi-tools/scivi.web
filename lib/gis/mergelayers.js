var a = HAS_INPUT["Layer A"] ? INPUT["Layer A"] : null;
var b = HAS_INPUT["Layer B"] ? INPUT["Layer B"] : null;
OUTPUT["A + B"] = !a ? b : !b ? a : a.concat(b);
