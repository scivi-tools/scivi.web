var lz = function(v) {
    return v < 10 ? "0" + v : v;
};
var d = new Date(SETTINGS_VAL["SETTING_NAME"]);
console.log(d);
var s = lz(d.getHours()) + ":" + lz(d.getMinutes());

var row = document.createElement("div");
row.style.display = "table-row";

var lbl = document.createElement("label");
lbl.style.display = "table-cell";
lbl.style.textAlign = "right";
lbl.innerHTML = "SETTING_NAME:&nbsp;";
row.appendChild(lbl);

var inp = document.createElement("input");
inp.type = "time";
inp.step = "any";
inp.value = s;
inp.style.display = "table-cell";
inp.style.width = "150px";
inp.addEventListener("change", function (e) {
    SETTINGS_VAL["SETTING_NAME"] = (new Date()).toDateString() + ' ' + inp.value;
    SETTINGS_CHANGED["SETTING_NAME"] = true;
});
row.appendChild(inp);

ADD_WIDGET(row);
