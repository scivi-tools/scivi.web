var s = SETTINGS_VAL["SETTING_NAME"];
if (!s)
    s = false;

var row = document.createElement("div");
row.style.display = "table-row";

var cell = document.createElement("div");
cell.style.display = "table-cell";
cell.style.textAlign = "right";
row.appendChild(cell);

var inp = document.createElement("input");
inp.type = "checkbox";
inp.checked = s;
inp.addEventListener("change", function (e) {
    SETTINGS_VAL["SETTING_NAME"] = inp.checked;
    SETTINGS_CHANGED["SETTING_NAME"] = true;
});
cell.appendChild(inp);

var lbl = document.createElement("label");
lbl.style.display = "table-cell";
lbl.innerHTML = "SETTING_NAME";
row.appendChild(lbl);

ADD_WIDGET(row);
