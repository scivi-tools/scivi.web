function createWidget(deviceList, activeDeviceIdx)
{
    var v = "";
    for (var i = 0; i < deviceList.length; ++i)
        v += "<option " + (activeDeviceIdx === i ? "selected" : "") + " value='" + i + "'>" + deviceList[i] + "</option>";
    ADD_WIDGET("<div style='display: table-row;'><div style='display: table-cell;'>SETTING_NAME:</div> <select id='e_SETTING_ID_" +
               NODE_ID + "' onchange='editor.changeSetting(\"SETTING_NAME\", \"e_SETTING_ID_" + NODE_ID + "\", " +
               NODE_ID + ");' style='display: table-cell; width: 100px;'>" + v + 
               "</select><div class='scivi_button' onclick='editor.pingEdgeDevice(\"SETTING_NAME\", " +
                NODE_ID + ");'>Ping</div></div>");
}

var s = SETTINGS["SETTING_NAME"];
if (s)
    createWidget(s, SETTINGS_VAL["SETTING_NAME"]);
else {
    editor.getEdgeDevices(function (deviceList) {
        SETTINGS["SETTING_NAME"] = deviceList;
        SETTINGS_VAL["SETTING_NAME"] = 0;
        createWidget(deviceList, 0);
    });
}
