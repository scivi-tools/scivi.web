var v = SETTINGS_VAL["SETTING_NAME"];
if (!v) {
    v = { device: "", guid: "" };
    SETTINGS_VAL["SETTING_NAME"] = v;
}
var s = SETTINGS["SETTING_NAME"];
if (s) {
    var option = function (name, index, isSelected) {
        return "<option " + (isSelected ? "selected" : "") + " value='" + index + "'>" + name + "</option>";
    };
    var devices = "";
    for (var i = 0, n = s.devices.length; i < n; ++i)
        devices += option(s.devices[i], i, v.device == i);
    var guids = "";
    for (var i = 0, n = s.guids.length; i < n; ++i)
        guids += option(s.guids[i], i, v.guid == i);
    var addrChanged = "editor.changeOntoBusAddress(\"SETTING_NAME\", SETTING_ID, " + NODE_ID + ");";
    var ping = "editor.pingByOntoBusAddress(\"SETTING_NAME\", SETTING_ID, " + NODE_ID + ");";
    ADD_WIDGET(
        "<div style='display: table-row;'><div style='display: table-cell;'>SETTING_NAME:</div></div>" +
        "<div style='display: table-row;'><div style='display: table-cell;'>Device:</div> <select id='d_SETTING_ID_" + NODE_ID +
        "' onchange='" + addrChanged + "' style='display: table-cell; width: 100px;'>" + devices + "</select></div>" +
        "<div style='display: table-row;'><div style='display: table-cell;'>GUID:</div> <select id='g_SETTING_ID_" + NODE_ID +
        "' onchange='" + addrChanged + "' style='display: table-cell; width: 100px;'>" + guids + "</select></div>" +
        "<div style='display: table-row;'><div style='display: table-cell;'><div class='scivi_button' onclick='" + ping + "'>Ping</div></div></div>"
    );
}
