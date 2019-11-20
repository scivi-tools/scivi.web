var s = SETTINGS_VAL["SETTING_NAME"];
if (!s)
    s = false;
ADD_WIDGET("<div style='display: table-row;'><div style='display: table-cell; text-align: right;'><input type='checkbox' " + (s ? "checked" : "") + " id='s_SETTING_ID_" + NODE_ID +
           "' onchange='editor.changeSetting(\"SETTING_NAME\", \"s_SETTING_ID_" + NODE_ID + "\", " +
           NODE_ID + ");'/></div><label style='display: table-cell;'>&nbsp;SETTING_NAME</label></div>");