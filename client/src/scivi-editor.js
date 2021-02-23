
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
}

SciViEditor.prototype.run = function (mode)
{
    var _this = this;
    var container = $("#scivi_node_editor")[0];
    var components = $.map(this.components, function(value, key) { return value });
    var editor = new D3NE.NodeEditor("SciViNodeEditor@0.1.0", container, components);
    var engine = new D3NE.Engine("SciViNodeEditor@0.1.0", components);
    var viewPortVisible = false;
    var processingAllowed = true;

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
        if (_this.selectedNode)
            setTimeout(function() { _this.selectNode(_this.selectedNode); }, 1);
    });

    editor.eventListener.on("nodecreate noderemove connectioncreate connectionremove", async function () {
        if (processingAllowed) {
            await engine.abort();
            await engine.process(editor.toJSON());
        }
    });

    $("#scivi_btn_rmnode").click(function () {
        var nodes = editor.selected.getNodes();
        if (nodes.length > 0)
            editor.removeNode(nodes[0]);
    });

    $("#scivi_btn_visualize").click(function () {
        viewPortVisible = !viewPortVisible;
        _this.inVisualization = viewPortVisible;
        _this.clearViewport();
        _this.process();
        if (!viewPortVisible) {
            $(".scivi_slide").css({"transform": "translateX(0%)"});
            $("#scivi_btn_visualize").html(_this.runButtonName(mode));
            $("#scivi_btn_visualize").css({"padding-left": "15px", "padding-right": "10px"});
            $(".scivi_menu").css({"margin-left": "calc(100vw - 120px)"});
            if (mode == MIXED_MODE) {
                _this.cleanupComms();
            }
        } else {
            $(".scivi_slide").css({"transform": "translateX(-100%)"});
            $("#scivi_btn_visualize").html("◀");
            $("#scivi_btn_visualize").css({"padding-left": "10px", "padding-right": "10px"});
            $(".scivi_menu").css({"margin-left": "20px"});
            if (mode == IOT_PROGRAMMING_MODE) {
                _this.uploadEON();
            } else if (mode == MIXED_MODE) {
                _this.runMixed();
            }
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
                await editor.fromJSON(JSON.parse(e.target.result));
                processingAllowed = true;
            };
            reader.readAsText(element.files[0]);
        }, false);
        element.click();
    });

    this.editor = editor;
    this.engine = engine;

    this.visuals = [];

    var urlParams = new URLSearchParams(window.location.search);
    var preset = urlParams.get("preset");
    if (preset) {
        $(".loader").show();
        $.getJSON("preset/" + preset, async function (data) {
            $(".loader").hide();
            await editor.fromJSON(data);
        });
    }
}

SciViEditor.prototype.uploadEON = function ()
{
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
        // var eon = data["eon"];

        var upEonDiv = $("<div class='scivi_upload_eon'>");
        var ontoDiv = $("<div style='display: table-row;'>");
        var ontoLbl = $("<div style='display: table-cell;'>").html("Task ontology: " + ont["nodes"].length + " nodes, " + ont["relations"].length + " edges");
        var dlOntoBtn = $("<button class='ui-widget scivi_button' style='display: table-cell;'>").html("Download");
        // var eonDiv = $("<div style='display: table-row;'>").html("EON blob: " + eon.length + " bytes");
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

        // uploadBtn.click(function () {
        //     console.log(targetAddressTxt.val());
        //     var webSocket = new WebSocket("ws://" + targetAddressTxt.val());
        //     webSocket.onopen = function(evt) {
        //         console.log("WebSocket open");
        //         console.log(eon);
        //         webSocket.send(Uint8Array.from(eon));
        //         webSocket.close();
        //     };
        //     webSocket.onclose = function(evt) { console.log("WebSocket close"); };
        //     webSocket.onerror = function(evt) { console.log(evt); };
        //     webSocket.onmessage = function(evt) { console.log(evt); };
        // });

        ontoDiv.append(ontoLbl);
        ontoDiv.append(dlOntoBtn);

        uplAddr.append(targetAddressLbl);
        uplAddr.append(targetAddressTxt);

        uplDiv.append(uplAddr);
        uplDiv.append(uploadBtn);

        upEonDiv.append(ontoDiv);
        // upEonDiv.append(eonDiv);
        upEonDiv.append(uplDiv);

        $("#scivi_viewport").empty();
        $("#scivi_viewport").append(upEonDiv);

        _this.startComm("ws://127.0.0.1:5001/", cor); // FIXME: address should be given by server, moreover, there may be multiple comms required.
    });
}

SciViEditor.prototype.registerNode = function (nodeID, name, inputs, outputs, workerFunc, settingsFunc)
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
            node.addControl(new D3NE.Control("<input type='text'>", function (element, control) { }));
            return node;
        },
        worker(node, inputs, outputs) {
            try {
                workerFunc(node, inputs, outputs);
                settingsFunc(node);
            } catch(err) {
                _this.showError(err);
            }
        }
    });
    node.syncSettings = settingsFunc;
    this.components[nodeID] = node;
}

SciViEditor.prototype.createNode = function (nodeID)
{
    var nodeProto = this.components[nodeID];
    var node = nodeProto.builder(nodeProto.newNode());
    var container = $("#scivi_node_editor")[0];
    node.position = [(container.clientWidth / 2 - this.editor.view.transform.x) / this.editor.view.transform.k,
                     (container.clientHeight / 2 - this.editor.view.transform.y) / this.editor.view.transform.k];
    node.syncSettings = nodeProto.syncSettings;
    node.data.nodeID = nodeID;
    this.editor.addNode(node);
    this.editor.view.update();
}

SciViEditor.prototype.selectNode = function (node)
{
    if (node) {
        if (!node.syncSettings) {
            var nodeProto = this.components[node.data.nodeID];
            node.syncSettings = nodeProto.syncSettings;
        }
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

SciViEditor.prototype.process = function ()
{
    this.engine.process(this.editor.toJSON());
}

SciViEditor.prototype.viewportContainer = function ()
{
    return document.getElementById("scivi_viewport");
}

SciViEditor.prototype.placeVisual = function (desiredDepth, currentDepth, rootContainer, visualContainers, conID)
{
    var d1, d2;
    var id1 = "_" + conID + "_1";
    var id2 = "_" + conID + "_2";
    conID[0]++;
    if (currentDepth % 2 === 0) {
        d1 = $("<div class='split split-vertical' id='" + id1 + "'>");
        d2 = $("<div class='split split-vertical' id='" + id2 + "'>");
    } else {
        d1 = $("<div class='split split-horizontal' id='" + id1 + "'>");
        d2 = $("<div class='split split-horizontal' id='" + id2 + "'>");
    }

    rootContainer.appendChild(d1[0]);
    rootContainer.appendChild(d2[0]);

    Split(["#" + id1, "#" + id2], {
        gutterSize: 8,
        sizes: [50, 50],
        minSize: 0,
        direction: currentDepth % 2 === 0 ? "vertical" : "horizontal",
        onDrag: function () { window.dispatchEvent(new Event("resize")); }
    });

    if (desiredDepth == currentDepth) {
        visualContainers.push(d1[0]);
        visualContainers.push(d2[0]);
    } else {
        this.placeVisual(desiredDepth, currentDepth + 1, d1[0], visualContainers, conID);
        this.placeVisual(desiredDepth, currentDepth + 1, d2[0], visualContainers, conID);
    }
}

SciViEditor.prototype.addVisualToViewport = function (el)
{
    var vp = this.viewportContainer();
    while (vp.firstChild)
        vp.removeChild(vp.firstChild);
    this.visuals.push(el);
    if (this.visuals.length == 1)
        vp.appendChild(el);
    else
    {
        var visualContainers = [];
        this.placeVisual(Math.ceil(Math.log(this.visuals.length) / Math.log(2)), 1, vp, visualContainers, [0]);
        for (var i = 0, n = this.visuals.length; i < n; ++i)
            visualContainers[i].appendChild(this.visuals[i]);
    }
    window.dispatchEvent(new Event("resize"));
}

SciViEditor.prototype.clearViewport = function ()
{
    var vp = this.viewportContainer();
    while (vp.firstChild)
        vp.removeChild(vp.firstChild);
    this.visuals = [];
}

SciViEditor.prototype.getNodeByID = function (nodeID)
{
    return this.editor.nodes.find(function (node) { return node.id === nodeID; });
}

SciViEditor.prototype.changeSetting = function (settingName, settingID, nodeID)
{
    var el = $("#" + settingID.toString());
    var value = el.is(":checkbox") ? el.is(":checked") : el.val();
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

SciViEditor.prototype.startComm = function (address, addressCorrespondences)
{
    var ws = new WebSocket(address);
    var _this = this;
    this.comms[address] = ws;
    if (this.commsReconnects[address] === undefined)
        this.commsReconnects[address] = 10;
    ws.onopen = function(evt) {
        console.log("WebSocket open on " + address);
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
            setTimeout(function () { _this.startComm(address, addressCorrespondences); }, 100);
        }
    };
    ws.onmessage = function(evt) {
        // console.log(evt);
        var msg = JSON.parse(evt.data);
        for (var i = 0, n = msg.length; i < n; ++i) {
            Object.keys(msg[i]).forEach(function (key) {
                var cor = addressCorrespondences[key];
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
            });
        }
        _this.process();
    };
}

SciViEditor.prototype.cleanupComms = function ()
{
    Object.keys(this.comms).forEach(function (key) {
        this.comms[key].stop();
    });
    this.comms = {};
    this.commsReconnects = {};
}
