if (IN_VISUALIZATION && 
    HAS_INPUT["Graph Data 1"] && INPUT["Graph Data 1"] && 
    HAS_INPUT["Graph Data 2"] && INPUT["Graph Data 2"]) {
    var d1 = INPUT["Graph Data 1"];
    var d2 = INPUT["Graph Data 2"];
    var result;
    if (Array.isArray(d1))
        result = d1;
    else
        result = [ d1 ];
    if (Array.isArray(d2))
        result = result.concat(d2);
    else
        result.push(d2);
    OUTPUT["Graph Data"] = result;
}
