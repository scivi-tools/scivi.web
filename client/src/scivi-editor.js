
window.$ = require("jquery");
window.jQuery = $;
require("jquery-ui/ui/version");
require("jquery-ui/ui/ie");
require("jquery-ui/ui/data");
require("jquery-ui/ui/plugin");
require("jquery-ui/ui/focusable");
require("jquery-ui/ui/keycode");
require("jquery-ui/ui/position");
require("jquery-ui/ui/safe-active-element");
require("jquery-ui/ui/safe-blur");
require("jquery-ui/ui/scroll-parent");
require("jquery-ui/ui/disable-selection");
require("jquery-ui/ui/tabbable");
require("jquery-ui/ui/unique-id");
require("jquery-ui/ui/widget");
require("jquery-ui/ui/widgets/button");
require("jquery-ui/ui/widgets/mouse");
require("jquery-ui/ui/widgets/draggable");
require("jquery-ui/ui/widgets/resizable");
require("jquery-ui/ui/widgets/dialog");
require("jquery-ui/ui/widgets/slider");
require("jquery-ui/ui/widgets/tabs");
require("jquery-contextmenu");
var Split = require("split.js");
var D3NE = require("d3-node-editor");

const VISUALIZATION_MODE = 1;
const IOT_PROGRAMMING_MODE = 2;
const MIXED_MODE = 3;

module.exports = SciViEditor;

function SciViEditor()
{
    SciViEditor.prototype.components = {};
    SciViEditor.prototype.sockets = {};
    SciViEditor.prototype.editor = null;
    SciViEditor.prototype.engine = null;
    SciViEditor.prototype.inVisualization = false;
    SciViEditor.prototype.visuals = null;
    SciViEditor.prototype.comms = {};
    SciViEditor.prototype.commsReconnects = {};
    SciViEditor.prototype.mode = null;
}

SciViEditor.prototype.run = function (mode)
{
    var _this = this;
    var container = $("#scivi_node_editor")[0];
    var components = $.map(this.components, function(value, key) { return value });
    var editor = new D3NE.NodeEditor("SciViNodeEditor@0.1.0", container, components);
    var engine = new D3NE.Engine("SciViNodeEditor@0.1.0", components);
    var processingAllowed = true;

    this.mode = mode;
    this.selectedNode = null;

    Split(["#scivi_editor_left", "#scivi_editor_right"], {
        gutterSize: 8,
        sizes: [12, 88],
        minSize: 0,
        onDrag: function () { editor.view.resize(); }
    });
    Split(["#scivi_editor_top", "#scivi_editor_bottom"], {
        gutterSize: 8,
        direction: 'vertical',
        sizes: [85, 15],
        minSize: 0,
        onDrag: function () { editor.view.resize(); }
    });

    $("#scivi_btn_visualize").html(this.runButtonName(mode));

    editor.view.resize();

    editor.view.areaClick = function () {
        if (editor.view.pickedOutput !== null)
            editor.view.pickedOutput = null;
        else {
            editor.selected.clear();
            _this.selectNode(null);
        }
        editor.view.update();
    };

    editor.eventListener.on("nodeselect", function (node) {
        _this.selectedNode = node;
        _this.selectNode(node);
    });

    editor.eventListener.on("noderemove", function (node) {
        _this.selectedNode = null;
        _this.selectNode(null);
    });

    editor.eventListener.on("connectioncreate connectionremove", function () {
        if (processingAllowed) {
            setTimeout(function () {
                _this.process();
                if (_this.selectedNode)
                    _this.selectNode(_this.selectedNode);
            }, 1);
        }
    });

    editor.eventListener.on("nodecreate noderemove", function () {
        if (processingAllowed) {
            setTimeout(function() {
                _this.process();
            }, 1);
        }
    });

    $("#scivi_btn_rmnode").click(function () {
        var nodes = editor.selected.getNodes();
        if (nodes.length > 0)
            editor.removeNode(nodes[0]);
    });

    $("#scivi_btn_visualize").click(function (e) {
        if (_this.inVisualization && e.shiftKey) {
            var filename = prompt("Enter name of file to save", "task.ont");
            if (!filename)
                return;
            if (!filename.includes("."))
                filename += ".ont";
            var element = document.createElement("a");
            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(_this.taskOnto)));
            element.setAttribute("download", filename);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } else {
            _this.startVisualization();
        }
    });

    $("#scivi_btn_save").click(function() {
        var filename = prompt("Enter name of file to save", "dataflow.json");
        if (!filename)
            return;
        if (!filename.includes("."))
            filename += ".json";
        var content = JSON.stringify(editor.toJSON(), function(key, value) {
            return key === "cache" ? undefined : value;
        });
        var element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });

    $("#scivi_btn_load").click(function() {
        processingAllowed = false;
        var element = document.createElement("input");
        element.setAttribute("type", "file");
        element.addEventListener("change", function () {
            var reader = new FileReader();
            reader.onload = async function (e) {
                if (_this.selectedNode) {
                    _this.selectedNode = null;
                    _this.selectNode(null);
                }
                await editor.fromJSON(JSON.parse(e.target.result));
                _this.extendNodes();
                processingAllowed = true;
            };
            reader.readAsText(element.files[0]);
        }, false);
        element.click();
    });

    $("#scivi_btn_fs").click(function() {
        if (document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement) {
            if (document.exitFullscreen)
                document.exitFullscreen();
            else if (document.mozCancelFullScreen)
                document.mozCancelFullScreen();
            else if (document.webkitExitFullscreen)
                document.webkitExitFullscreen();
            else if (document.msExitFullscreen)
                document.msExitFullscreen();
        } else {
            var element = document.getElementById("embrace");
            if (element.requestFullscreen)
                element.requestFullscreen();
            else if (element.mozRequestFullScreen)
                element.mozRequestFullScreen();
            else if (element.webkitRequestFullscreen)
                element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            else if (element.msRequestFullscreen)
                element.msRequestFullscreen();
        }
    });

    this.editor = editor;
    this.engine = engine;

    this.visuals = [];

    var urlParams = new URLSearchParams(window.location.search);
    var preset = urlParams.get("preset");
    var autorun = urlParams.get("start");
    if (preset) {
        $(".loader").show();
        $.getJSON("preset/" + preset, async function (data) {
            $(".loader").hide();
            await editor.fromJSON(data);
            _this.extendNodes();
            if (autorun)
                _this.startVisualization();
        });
    }
}

SciViEditor.prototype.startVisualization = function ()
{
    this.inVisualization = !this.inVisualization;
    this.clearViewport();
    this.process();
    if (this.inVisualization) {
        $(".scivi_slide").css({"transform": "translateX(-100%)"});
        $("#scivi_btn_visualize").html("◀");
        $("#scivi_btn_visualize").css({"padding-left": "10px", "padding-right": "10px"});
        $(".scivi_menu").css({"margin-left": "20px"});
        if (this.mode == IOT_PROGRAMMING_MODE) {
            this.uploadEON();
        } else if (this.mode == MIXED_MODE) {
            this.runMixed();
        }
    } else {
        $(".scivi_slide").css({"transform": "translateX(0%)"});
        $("#scivi_btn_visualize").html(this.runButtonName(this.mode));
        $("#scivi_btn_visualize").css({"padding-left": "15px", "padding-right": "10px"});
        $(".scivi_menu").css({"margin-left": "calc(100vw - 120px)"});
        if (this.mode == MIXED_MODE) {
            this.stopMixed();
        }
    }
}

SciViEditor.prototype.uploadEON = function ()
{
    // FIXME: this mode is deprecated.
    var content = JSON.stringify(this.editor.toJSON(), function(key, value) {
        return key === "cache" ? undefined : value;
    });
    var _this = this;
    $.post("/gen_eon", content, function (data) {
        if (data["error"]) {
            _this.showError(data["error"]);
            return;
        }

        var ont = data["ont"];
        var eon = data["eon"];

        var upEonDiv = $("<div class='scivi_upload_eon'>");
        var ontoDiv = $("<div style='display: table-row;'>");
        var ontoLbl = $("<div style='display: table-cell;'>").html("Task ontology: " + ont["nodes"].length + " nodes, " + ont["relations"].length + " edges");
        var dlOntoBtn = $("<button class='ui-widget scivi_button' style='display: table-cell;'>").html("Download");
        var eonDiv = $("<div style='display: table-row;'>").html("EON blob: " + eon.length + " bytes");
        var uplDiv = $("<div style='display: table-row;'>");
        var uplAddr = $("<div style='display: table-cell;'>");
        var targetAddressLbl = $("<label>").html("Device address: ");
        var targetAddressTxt = $("<input class='ui-widget' type='text' value='192.168.4.1:81' style='margin-right: 5px;'>");
        var uploadBtn = $("<button class='ui-widget scivi_button' style='display=table-cell;'>").html("Upload");

        dlOntoBtn.click(function () {
            var filename = prompt("Enter name of file to save", "task.ont");
            if (!filename)
                return;
            if (!filename.includes("."))
                filename += ".ont";
            var element = document.createElement("a");
            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(ont)));
            element.setAttribute("download", filename);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        });

        uploadBtn.click(function () {
            console.log(targetAddressTxt.val());
            var webSocket = new WebSocket("ws://" + targetAddressTxt.val());
            webSocket.onopen = function(evt) {
                console.log("WebSocket open");
                console.log(eon);
                webSocket.send(Uint8Array.from(eon));
                webSocket.close();
            };
            webSocket.onclose = function(evt) { console.log("WebSocket close"); };
            webSocket.onerror = function(evt) { console.log(evt); };
            webSocket.onmessage = function(evt) { console.log(evt); };
        });

        ontoDiv.append(ontoLbl);
        ontoDiv.append(dlOntoBtn);

        uplAddr.append(targetAddressLbl);
        uplAddr.append(targetAddressTxt);

        uplDiv.append(uplAddr);
        uplDiv.append(uploadBtn);

        upEonDiv.append(ontoDiv);
        upEonDiv.append(eonDiv);
        upEonDiv.append(uplDiv);

        $("#scivi_viewport").empty();
        $("#scivi_viewport").append(upEonDiv);
    });
}

SciViEditor.prototype.runMixed = function ()
{
    var content = JSON.stringify(this.editor.toJSON(), function(key, value) {
        return key === "cache" ? undefined : value;
    });
    var _this = this;
    $.post("/gen_mixed", content, function (data) {
        if (data["error"]) {
            _this.showError(data["error"]);
            return;
        }

        var ont = data["ont"];
        var cor = data["cor"];
        var eon = data["eon"];

        _this.taskOnto = ont;

        if (Object.keys(cor).length > 0) {
            // FIXME: address should be given by server, moreover, there may be multiple comms required.
            if (eon.length > 0)
                _this.startComm("ws://192.168.4.1:81/", cor, eon);
            else
                _this.startComm("ws://127.0.0.1:5001/", cor);
        }
    });
}

SciViEditor.prototype.stopMixed = function ()
{
    var _this = this;
    this.cleanupComms();
    $.post("/stop_execer", {}, function (data) {
        if (data["error"])
            _this.showError(data["error"]);
    });
}

SciViEditor.prototype.changeSubTitle = function (nodeID)
{
    var el = $("#t" + nodeID);
    var node = this.getNodeByID(nodeID);
    node.data.subTitle = el.val();
}

SciViEditor.prototype.createControl = function (node)
{
    if (node.data.inlineSettingsCtrl !== undefined)
        return node.data.inlineSettingsCtrl;
    else // FIXME: subtitles are deprecated, remove them.
        return "<input id='t" + node.id + "' type='text' onchange='editor.changeSubTitle(" + node.id + ");' style='display:none;'>";
}

SciViEditor.prototype.registerNode = function (name, inputs, outputs, workerFunc, settingsFunc)
{
    var _this = this;
    var sockets = this.sockets;
    var node = new D3NE.Component(name,
    {
        builder(node) {
            inputs.forEach(function (item) {
                if (sockets[item["type"]] === undefined)
                    sockets[item["type"]] = new D3NE.Socket(item["type"], item["type"], "");
                node.addInput(new D3NE.Input(item["name"], sockets[item["type"]]));
            });
            outputs.forEach(function (item) {
                if (sockets[item["type"]] === undefined)
                    sockets[item["type"]] = new D3NE.Socket(item["type"], item["type"], "");
                node.addOutput(new D3NE.Output(item["name"], sockets[item["type"]]));
            });
            settingsFunc(node);
            node.addControl(new D3NE.Control(_this.createControl(node), function (element, control) { }));
            return node;
        },
        worker(node, inputs, outputs) {
            try {
                workerFunc(node, inputs, outputs);
            } catch(err) {
                _this.showError(err);
            }
        }
    });
    node.syncSettings = settingsFunc;
    this.components[name] = node;
}

SciViEditor.prototype.createNode = function (name)
{
    var nodeProto = this.components[name];
    var node = nodeProto.builder(nodeProto.newNode());
    var container = $("#scivi_node_editor")[0];
    node.position = [(container.clientWidth / 2 - this.editor.view.transform.x) / this.editor.view.transform.k,
                     (container.clientHeight / 2 - this.editor.view.transform.y) / this.editor.view.transform.k];
    node.syncSettings = nodeProto.syncSettings;
    this.editor.addNode(node);
    this.editor.view.update();
}

SciViEditor.prototype.selectNode = function (node)
{
    if (node) {
        $("#scivi_settings_title").html(node.title);
        $("#scivi_settings_title").show();
        $("#scivi_btn_rmnode").show();
        node.syncSettings(node);
        if (node.data.settingsCtrl)
            $("#scivi_settings_content").html(node.data.settingsCtrl);
        else
            $("#scivi_settings_content").html("");
    } else {
        $("#scivi_settings_title").hide();
        $("#scivi_btn_rmnode").hide();
        $("#scivi_settings_content").html("");
    }
}

SciViEditor.prototype.extendNodes = function ()
{
    var _this = this;
    this.editor.nodes.forEach(function (node) {
        if (!node.syncSettings) {
            var nodeProto = _this.components[node.title];
            node.syncSettings = nodeProto.syncSettings;
        }
        if (node.data.subTitle) { // FIXME: this is deprecated!!!
            $("#t" + node.id).val(node.data.subTitle);
            $("#t" + node.id).show();
        }
    });
}

SciViEditor.prototype.process = function ()
{
    function dumpToArray(nodes)
    {
        var result = [];
        for (key in nodes) {
            if (nodes.hasOwnProperty(key))
                result.push(nodes[key]);
        }
        return result;
    }

    function getSourceNodes(nodes, node, remRec)
    {
        var result = [];
        for (var i = 0, n = node.inputs.length; i < n; ++i) {
            if (node.inputs[i].connections.length > 0) {
                var src = nodes[node.inputs[i].connections[0].node];
                if (!remRec || src.position[0] < node.position[0] || (src.position[0] === node.position[0] && src.position[1] < node.position[1]))
                    result.push(src);
            }
        }
        return result;
    }

    function getMaxRank(nodes)
    {
        var result = -1;
        for (var i = 0, n = nodes.length; i < n; ++i) {
            if (nodes[i].rank === undefined)
                return undefined;
            else if (nodes[i].rank > result)
                result = nodes[i].rank;
        }
        return result;
    }

    var dfd = this.editor.toJSON();
    var nodes = dumpToArray(dfd.nodes);
    var rankedNodes = 0;
    var n = nodes.length;
    var removeRecursives = false;
    while (rankedNodes < n) {
        var hasCycle = true;
        for (var i = 0; i < n; ++i) {
            if (nodes[i].rank !== undefined)
                continue;
            var srcNodes = getSourceNodes(dfd.nodes, nodes[i], removeRecursives);
            if (srcNodes.length === 0) {
                nodes[i].rank = 0;
                ++rankedNodes;
                hasCycle = false;
            } else {
                var mr = getMaxRank(srcNodes);
                if (mr !== undefined) {
                    nodes[i].rank = mr + 1;
                    ++rankedNodes;
                    hasCycle = false;
                }
            }
        }
        removeRecursives = hasCycle;
    }

    nodes.sort(function (a, b) {
        return a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0;
    });

    for (var i = 0; i < n; ++i) {
        var node = this.getNodeByID(nodes[i].id);
        var inputs = [];
        for (var j = 0, m = nodes[i].inputs.length; j < m; ++j) {
            if (nodes[i].inputs[j].connections.length > 0) {
                var srcNodeID = nodes[i].inputs[j].connections[0].node;
                var srcOutputID = nodes[i].inputs[j].connections[0].output;
                var srcNode = this.getNodeByID(srcNodeID);
                if (srcNode.outputData)
                    inputs.push([srcNode.outputData[srcOutputID]])
                else
                    inputs.push([null]);
            } else {
                inputs.push([]);
            }
        }
        var outputs = [];
        for (var j = 0, m = nodes[i].outputs.length; j < m; ++j)
            outputs.push(null);
        this.components[nodes[i].title].worker(node, inputs, outputs);
        node.outputData = outputs;
    }
}

SciViEditor.prototype.viewportContainer = function ()
{
    return document.getElementById("scivi_viewport");
}

SciViEditor.prototype.placeVisual = function (desiredDepth, currentDepth, rootContainer, visualContainers, conID, forceDir)
{
    var dir = forceDir === undefined ? (currentDepth % 2 === 0 ? "vertical" : "horizontal") : forceDir;
    var d1, d2;
    var id1 = "_" + conID + "_1";
    var id2 = "_" + conID + "_2";
    conID[0]++;
    d1 = $("<div class='split split-" + dir + "' id='" + id1 + "'>");
    d2 = $("<div class='split split-" + dir + "' id='" + id2 + "'>");

    rootContainer.appendChild(d1[0]);
    rootContainer.appendChild(d2[0]);

    Split(["#" + id1, "#" + id2], {
        gutterSize: 8,
        sizes: [50, 50],
        minSize: 0,
        direction: dir,
        onDrag: function () { window.dispatchEvent(new Event("resize")); }
    });

    if (desiredDepth == currentDepth) {
        visualContainers.push(d1[0]);
        visualContainers.push(d2[0]);
    } else {
        this.placeVisual(desiredDepth, currentDepth + 1, d1[0], visualContainers, conID, forceDir);
        this.placeVisual(desiredDepth, currentDepth + 1, d2[0], visualContainers, conID, forceDir);
    }
}

SciViEditor.prototype.addVisualToViewport = function (el, pos, forceDir)
{
    var vp = this.viewportContainer();
    while (vp.firstChild)
        vp.removeChild(vp.firstChild);
    el.splitIndex = pos[1];
    this.visuals.push(el);
    this.visuals.sort(function (e1, e2) { return e1.splitIndex > e2.splitIndex ? 1 : -1; });
    if (forceDir === "vertical" || (forceDir === undefined && this.forceDir === "vertical")) {
        for (var i = 0, n = this.visuals.length; i < n; ++i)
            vp.appendChild(this.visuals[i]);
        var h = 0;
        for (var i = 0, n = this.visuals.length; i < n; ++i) {
            if (!this.visuals[i].style.height)
                h += $(this.visuals[i].firstChild).outerHeight(true);
        }
        for (var i = 0, n = this.visuals.length; i < n; ++i) {
            if (this.visuals[i].style.height)
                this.visuals[i].style.height = "calc(100% - " + h + "px)";
        }
    } else {
        if (this.visuals.length == 1)
            vp.appendChild(el);
        else
        {
            var visualContainers = [];
            this.placeVisual(Math.ceil(Math.log(this.visuals.length) / Math.log(2)), 1, vp, visualContainers, [0], forceDir);
            for (var i = 0, n = this.visuals.length; i < n; ++i)
                visualContainers[i].appendChild(this.visuals[i]);
        }
    }
    if (forceDir !== undefined)
        this.forceDir = forceDir;
    window.dispatchEvent(new Event("resize"));
}

SciViEditor.prototype.clearViewport = function ()
{
    var vp = this.viewportContainer();
    while (vp.firstChild)
        vp.removeChild(vp.firstChild);
    this.visuals = [];
    this.forceDir = undefined;
}

SciViEditor.prototype.getNodeByID = function (nodeID)
{
    return this.editor.nodes.find(function (node) { return node.id === nodeID; });
}

SciViEditor.prototype.changeSetting = function (settingName, settingID, nodeID)
{
    var el = $("#" + settingID.toString())
    var value = 0;
    if (el.is(":checkbox"))
        value = el.is(":checked");
    else {
         value = el.get(0).valueAsNumber;
         if (isNaN(value))
            value = el.val();
    }
    var node = this.getNodeByID(nodeID);
    node.data.settingsVal[settingName] = value;
    node.data.settingsChanged[settingName] = true;
}

SciViEditor.prototype.getHumanReadableSize = function (size)
{
    var suffixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    var p = Math.floor(Math.log(size) / Math.log(1024.0));
    var rem = size / Math.pow(1024, p);
    var v = +(rem).toFixed(2);
    return v + " " + suffixes[p];
}

SciViEditor.prototype.uploadFile = function (settingName, settingID, nodeID)
{
    var sid = settingID + "_" + nodeID;
    var f = $("#f_" + sid)[0].files[0];
    var node = this.getNodeByID(nodeID);
    var meta = f.name + " (" + this.getHumanReadableSize(f.size) + ")";
    $("#" + sid).html(meta);
    node.data.settingsVal[settingName] = f;
    node.data.settingsVal[settingName + "_meta"] = meta;
    node.data.settingsChanged[settingName] = true;
    this.process();
}

SciViEditor.prototype.uploadFiles = function (settingName, settingID, nodeID)
{
    var sid = settingID + "_" + nodeID;
    var f = $("#f_" + sid)[0].files;
    var node = this.getNodeByID(nodeID);
    var meta = "</br>";
    for (var i = 0, n = f.length; i < n; ++i)
        meta += f[i].name + " (" + this.getHumanReadableSize(f[i].size) + ")</br>";
    $("#" + sid).html(meta);
    node.data.settingsVal[settingName] = f;
    node.data.settingsVal[settingName + "_meta"] = meta;
    node.data.settingsChanged[settingName] = true;
    this.process();
}

SciViEditor.prototype.updateWidgets = function (node)
{
    if (this.selectedNode && node.id === this.selectedNode.id)
        this.selectNode(this.selectedNode);
}

SciViEditor.prototype.runButtonName = function (mode)
{
    switch (mode) {
        case VISUALIZATION_MODE:
            return "Visualize ▶";

        case IOT_PROGRAMMING_MODE:
            return "Upload ▶";

        case MIXED_MODE:
            return "Run ▶";
    }
    return "Visualize ▶";
}

SciViEditor.prototype.escapeHTML = function (text)
{
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

SciViEditor.prototype.showError = function (err)
{
    console.log(err);
    $("#scivi_error_text").html(this.escapeHTML(err));
    var dlg = $("#scivi_error").dialog({
        modal: true,
        buttons: {
            Ok: function() {
                $(this).dialog("close");
            }
        }
    });
    var dp = dlg.parent();
    dp.css("background", "#FBDAC9").css("border", "1px solid #3F3F3F");
    dp.find(".ui-dialog-buttonpane").css("background", "#FBDAC9").css("border-top", "1px solid #3F3F3F");
    dp.find(".ui-dialog-titlebar").css("background", "#FF4D00").css("color", "#FFFFFF");
    dp.find(".ui-button").css("border", "1px solid #3F3F3F");
}

SciViEditor.prototype.startComm = function (address, addressCorrespondences, eon = null)
{
    var ws = new WebSocket(address);
    var _this = this;
    this.comms[address] = ws;
    if (this.commsReconnects[address] === undefined)
        this.commsReconnects[address] = 10;
    ws.onopen = function(evt) {
        console.log("WebSocket open on " + address);
        if (eon) {
            ws.send(Uint8Array.from(eon));
        }
    };
    ws.onclose = function(evt) {
        console.log("WebSocket close on " + address);
        delete _this.comms[address];
    };
    ws.onerror = function(evt) {
        console.log(evt);
        var rc = _this.commsReconnects[address];
        if (rc > 0) {
            --rc;
            _this.commsReconnects[address] = rc;
            setTimeout(function () { _this.startComm(address, addressCorrespondences, eon); }, 100);
        }
    };
    ws.onmessage = function(evt) {
        var msg = JSON.parse(evt.data);
        for (var i = 0, n = msg.length; i < n; ++i) {
            Object.keys(msg[i]).forEach(function (key) {
                var cor = addressCorrespondences[key];
                if (cor) {
                    for (var j = 0, n = cor.length; j < n; ++j) {
                        var dfdNodeID = cor[j][0];
                        var isInput = cor[j][1];
                        var socketNmb = cor[j][2];
                        var dfdNode = _this.getNodeByID(dfdNodeID);
                        if (isInput) {
                            if (!dfdNode.data.inputDataPool)
                                dfdNode.data.inputDataPool = [];
                            for (var k = dfdNode.data.inputDataPool.length; k <= socketNmb; ++k)
                                dfdNode.data.inputDataPool.push(null);
                            dfdNode.data.inputDataPool[socketNmb] = msg[key];
                        } else {
                            if (!dfdNode.data.outputDataPool)
                                dfdNode.data.outputDataPool = [];
                            for (var k = dfdNode.data.outputDataPool.length; k <= socketNmb; ++k)
                                dfdNode.data.outputDataPool.push(null);
                            dfdNode.data.outputDataPool[socketNmb] = msg[i][key];
                        }
                    }
                }
            });
        }
        _this.process();
    };
}

SciViEditor.prototype.cleanupComms = function ()
{
    var _this = this;
    Object.keys(this.comms).forEach(function (key) {
        _this.comms[key].close();
    });
    this.comms = {};
    this.commsReconnects = {};
    this.editor.nodes.forEach(function (node) {
        node.data.inputDataPool = [];
        node.data.outputDataPool = [];
    });
}
