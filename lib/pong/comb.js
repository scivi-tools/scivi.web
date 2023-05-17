if (IN_VISUALIZATION) {
	var a = HAS_INPUT["Object A"] ? INPUT["Object A"] : null;
	var b = HAS_INPUT["Object B"] ? INPUT["Object B"] : null;
	if (!a)
		OUTPUT["A U B"] = b;
	else if (!b)
		OUTPUT["A U B"] = a;
	else {
		if (!Array.isArray(a))
			a = [ a ];
		if (!Array.isArray(b))
			b = [ b ];
		OUTPUT["A U B"] = a.concat(b);
	}
}
