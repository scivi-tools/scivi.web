
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
var Split = require("split.js");
var D3NE = require("d3-node-editor");
var JQ = window.$;

module.exports = SciViEditor;

function SciViEditor()
{
    SciViEditor.prototype.components = {};
    SciViEditor.prototype.sockets = {};
    SciViEditor.prototype.editor = null;
    SciViEditor.prototype.inVisualization = false;
}

SciViEditor.prototype.run = function ()
{
    window.jQuery = JQ;
    window.$ = JQ;

    var _this = this;
    var container = $("#scivi_node_editor")[0];
    var components = $.map(this.components, function(value, key) { return value });
    var editor = new D3NE.NodeEditor("SciViNodeEditor@0.1.0", container, components);
    var engine = new D3NE.Engine("SciViNodeEditor@0.1.0", components);
    var selectedNode = null;
    var viewPortVisible = false;
    var processingAllowed = true;

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
        selectedNode = node;
        _this.selectNode(node);
    });

    editor.eventListener.on("noderemove", function (node) {
        selectedNode = null;
        _this.selectNode(null);
    });

    editor.eventListener.on("connectioncreate connectionremove", function () {
        if (selectedNode)
            setTimeout(function() { _this.selectNode(selectedNode); }, 1);
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
        _this.process();
        if (!viewPortVisible) {
            $(".scivi_slide").css({"transform": "translateX(0%)"});
            $("#scivi_btn_visualize").html("Visualize ▶");
            $("#scivi_btn_visualize").css({"padding-left": "15px", "padding-right": "10px"});
            $(".scivi_menu").css({"margin-left": "calc(100vw - 120px)"});
        } else {
            $(".scivi_slide").css({"transform": "translateX(-100%)"});
            $("#scivi_btn_visualize").html("◀");
            $("#scivi_btn_visualize").css({"padding-left": "10px", "padding-right": "10px"});
            $(".scivi_menu").css({"margin-left": "20px"});
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
}

SciViEditor.prototype.registerNode = function (name, inputs, outputs, workerFunc, settingsFunc)
{
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
            return node;
        },
        worker(node, inputs, outputs) {
            try {
                workerFunc(node, inputs, outputs);
                settingsFunc(node);
            } catch(err) {
                $("#scivi_error_text").html(err);
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
        if (!node.syncSettings) {
            var nodeProto = this.components[node.title];
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

SciViEditor.prototype.getNodeByID = function (nodeID)
{
    return this.editor.nodes.find(function (node) { return node.id === nodeID; });
}

SciViEditor.prototype.changeSetting = function (settingName, settingID, nodeID)
{
    var value = $("#" + settingID.toString()).val();
    var node = this.getNodeByID(nodeID);
    node.data.settingsVal[settingName] = value;
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
