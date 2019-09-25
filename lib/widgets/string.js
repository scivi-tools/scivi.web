var s = SETTINGS["SETTING_NAME"];
if (s) {
    var v = "";
    for (var i = 0; i < s.length; ++i)
        v += "<option " + (SETTINGS_VAL["SETTING_NAME"] == i ? "selected" : "") + " value='" + i + "'>" + s[i] + "</option>";
    ADD_WIDGET("<div><div style='width: 100px; text-align: right; display: inline-block;'>SETTING_NAME:</div> <select id='SETTING_ID' onchange='editor.changeSetting(\"SETTING_NAME\", SETTING_ID, " +
               NODE_ID + ");' style='width: 100px'>" + v + "</select></div>");
}
