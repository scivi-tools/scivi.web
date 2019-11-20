var s = SETTINGS["SETTING_NAME"];
if (s) {
    var v = "";
    for (var i = 0; i < s.length; ++i)
        v += "<option " + (SETTINGS_VAL["SETTING_NAME"] == i ? "selected" : "") + " value='" + i + "'>" + s[i] + "</option>";
    ADD_WIDGET("<div style='display: table-row;'><div style='width: 100px; text-align: right; display: table-cell;'>SETTING_NAME:</div> <select id='e_SETTING_ID_" +
               NODE_ID + "' onchange='editor.changeSetting(\"SETTING_NAME\", \"e_SETTING_ID_" + NODE_ID + "\", " +
               NODE_ID + ");' style='display: table-cell; width: 100px;'>" + v + "</select></div>");
}
