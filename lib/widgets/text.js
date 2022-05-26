var s = SETTINGS_VAL["SETTING_NAME"];
if (!s)
    s = "";

var row = document.createElement("div");
row.style.display = "table-row";

var lbl = document.createElement("label");
lbl.style.display = "table-cell";
lbl.style.textAlign = "right";
lbl.style.verticalAlign = "top";
lbl.innerHTML = "SETTING_NAME:&nbsp;";
row.appendChild(lbl);

var txtArea = document.createElement("textarea");
txtArea.style.display = "table-cell";
txtArea.style.width = "100px";
txtArea.value = s;
txtArea.addEventListener("input", function (e) {
    SETTINGS_VAL["SETTING_NAME"] = txtArea.value;
    SETTINGS_CHANGED["SETTING_NAME"] = true;
});
row.appendChild(txtArea);

ADD_WIDGET(row);
