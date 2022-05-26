var lz = function(v) {
    return v < 10 ? "0" + v : v;
};
var d = new Date(SETTINGS_VAL["SETTING_NAME"]);
var s = d.getFullYear() + "-" + lz(d.getMonth() + 1) + "-" + lz(d.getDate());

var row = document.createElement("div");
row.style.display = "table-row";

var lbl = document.createElement("label");
lbl.style.display = "table-cell";
lbl.style.textAlign = "right";
lbl.innerHTML = "SETTING_NAME:&nbsp;";
row.appendChild(lbl);

var inp = document.createElement("input");
inp.type = "date";
inp.step = "any";
inp.value = s;
inp.style.display = "table-cell";
inp.style.width = "150px";
inp.addEventListener("change", function (e) {
    SETTINGS_VAL["SETTING_NAME"] = inp.value;
    SETTINGS_CHANGED["SETTING_NAME"] = true;
});
row.appendChild(inp);

ADD_WIDGET(row);

