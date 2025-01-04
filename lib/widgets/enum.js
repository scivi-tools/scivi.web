var s = SETTINGS["SETTING_NAME"];
if (s) {
    var row = document.createElement("div");
    row.style.display = "table-row";

    var cell = document.createElement("div");
    cell.style.display = "table-cell";
    cell.innerHTML = "SETTING_NAME:&nbsp;";
    row.appendChild(cell);

    var sel = document.createElement("select");
    sel.style.display = "table-cell";
    //sel.style.width = "100px";

    for (var i = 0, n = s.length; i < n; ++i) {
        var op = document.createElement("option");
        op.value = i;
        op.innerHTML = s[i];
        sel.appendChild(op);
    }

    sel.value = SETTINGS_VAL["SETTING_NAME"];
    sel.addEventListener("change", function (e) {
        SETTINGS_VAL["SETTING_NAME"] = sel.value;
        SETTINGS_CHANGED["SETTING_NAME"] = true;
        PROCESS();
    });

    row.appendChild(sel);

    ADD_WIDGET(row);
}
