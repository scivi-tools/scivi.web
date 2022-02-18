var tableA = HAS_INPUT["Table A"] ? INPUT["Table A"] : null;
var tableB = HAS_INPUT["Table B"] ? INPUT["Table B"] : null;
if (tableA && tableB)
    OUTPUT["Table A∪B"] = tableA.concat(tableB);
else if (tableA)
    OUTPUT["Table A∪B"] = tableA;
else
    OUTPUT["Table A∪B"] = tableB;
