var s = SETTINGS_VAL["SETTING_NAME"];
if (!s)
    s = "";
ADD_WIDGET("<div style='display: table-row;'><label style='display: table-cell;'>SETTING_NAME:&nbsp;</label><input type='text' value='" + s + "' id='s_SETTING_ID_" + NODE_ID +
           "' onchange='editor.changeSetting(\"SETTING_NAME\", \"s_SETTING_ID_" + NODE_ID + "\", " +
           NODE_ID + ");' style='display: table-cell; width: 100px;'/></div>");
