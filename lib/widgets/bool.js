var s = SETTINGS_VAL["SETTING_NAME"];
if (!s)
    s = false;
ADD_WIDGET("<div><input type='checkbox' " + (s ? "checked" : "") + " id='s_SETTING_ID_" + NODE_ID +
           "' onchange='editor.changeSetting(\"SETTING_NAME\", \"s_SETTING_ID_" + NODE_ID + "\", " +
           NODE_ID + ");'/><label>&nbsp;SETTING_NAME</label></div>");