var v = SETTINGS_VAL["SETTING_NAME_meta"];
if (!v)
    v = "";
ADD_WIDGET("<div><label class='ui-button ui-widget ui-corner-all' style='margin-bottom: 8px' for='f_SETTING_ID_" + NODE_ID +
           "'>SETTING_NAME</label><input type='file' multiple id='f_SETTING_ID_" + NODE_ID +
           "'onchange='editor.uploadFiles(\"SETTING_NAME\", SETTING_ID, " + NODE_ID +
           ");'/><span style='margin: 0px 0px 0px 10px' id='SETTING_ID_" + NODE_ID +
           "'>" + v + "</span></div>");
