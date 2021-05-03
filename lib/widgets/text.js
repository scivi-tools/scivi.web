var s = SETTINGS_VAL["SETTING_NAME"];
if (!s)
    s = "";
ADD_WIDGET("<div style='display: table-row;'><label style='display: table-cell; text-align: right; vertical-align: top;'>SETTING_NAME:&nbsp;</label><textarea id='s_SETTING_ID_" + NODE_ID +
           "' oninput='editor.changeSetting(\"SETTING_NAME\", \"s_SETTING_ID_" + NODE_ID + "\", " +
           NODE_ID + ");' style='display: table-cell; width: 100px;'>" + s + "</textarea></div>");