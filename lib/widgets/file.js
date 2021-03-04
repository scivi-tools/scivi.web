var v = SETTINGS_VAL["SETTING_NAME_meta"];
if (!v)
    v = "";
ADD_WIDGET("<div style='display: table-row;'><div style='display: table-cell;'><label class='ui-button ui-widget ui-corner-all' style='margin-bottom: 8px' for='f_SETTING_ID_" + NODE_ID +
           "'>SETTING_NAME</label><input type='file' id='f_SETTING_ID_" + NODE_ID +
           "'onchange='editor.uploadFile(\"SETTING_NAME\", SETTING_ID, " + NODE_ID +
           ");'/></div><div style='display: table-cell; padding-left: 5px;' id='SETTING_ID_" + NODE_ID +
           "'>" + v + "</div></div>");
