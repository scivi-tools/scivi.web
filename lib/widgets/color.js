var s = SETTINGS_VAL["SETTING_NAME"];
if (s === undefined)
    s = "#000";

var row = document.createElement("div");
row.style.display = "table-row";

var lbl = document.createElement("label");
lbl.style.display = "table-cell";
lbl.style.verticalAlign = "middle";
lbl.innerHTML = "SETTING_NAME:&nbsp;";
row.appendChild(lbl);

var inp = document.createElement("input");
inp.type = "color";
inp.value = s;
inp.style.display = "table-cell";
inp.style.width = "100px";
inp.addEventListener("change", function (e) {
    SETTINGS_VAL["SETTING_NAME"] = inp.value;
    SETTINGS_CHANGED["SETTING_NAME"] = true;
});
row.appendChild(inp);

ADD_WIDGET(row);
