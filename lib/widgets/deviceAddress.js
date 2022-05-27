function startProgress(key)
{
    function progress(progressKey, progressVal)
    {
        var val = progressVal;
        CACHE[progressKey].style.background = "linear-gradient(90deg, #8399ff 0%, #8399ff " + val + "%, #f6f6f6 " + val + "%, #f6f6f6 100%)";
        if (val < 50)
            val += 3;
        else
            val += (100.0 - val) / 16.0;
        CACHE[progressKey + "t"] = setTimeout(progress, 100, progressKey, val);
    }
    CACHE[key].classList.add("ui-state-disabled");
    progress(key, 0);
}

function endProgress(key, success)
{
    if (CACHE[key + "t"])
        clearTimeout(CACHE[key + "t"]);
    CACHE[key].style.background = success ? "#0f0" : "#f00";
    setTimeout(function () {
        var el = CACHE[key]
        el.style.background = "";
        el.classList.remove("ui-state-disabled");
    }, 100);
}

function fillSel()
{
    var sel = CACHE["list"];
    while (sel.firstChild)
        sel.removeChild(sel.lastChild);
    var s = SETTINGS["SETTING_NAME"];
    if (s) {
        for (var i = 0, n = s.length; i < n; ++i) {
            var op = document.createElement("option");
            op.value = i;
            op.innerHTML = s[i];
            sel.appendChild(op);
        }
    }
}

function rescan()
{
    CACHE["scanning"] = true;
    startProgress("btnRescan");
    $.getJSON("/scan_ssdp", function (data) {
        CACHE["scanning"] = false;
        endProgress("btnRescan", true);
        SETTINGS["SETTING_NAME"] = data;
        fillSel();
    }).fail(function (err) {
        CACHE["scanning"] = false;
        endProgress("btnRescan", false);
    });
}

var scanning = CACHE["scanning"];

var row = document.createElement("div");
row.style.display = "table-row";

var cell = document.createElement("div");
cell.style.display = "table-cell";
cell.innerHTML = "SETTING_NAME:&nbsp;";
row.appendChild(cell);

var sel = document.createElement("select");
sel.style.display = "table-cell";
sel.style.width = "120px";
sel.value = SETTINGS_VAL["SETTING_NAME"];
sel.addEventListener("change", function (e) {
    SETTINGS_VAL["SETTING_NAME"] = sel.value;
    SETTINGS_CHANGED["SETTING_NAME"] = true;
});
row.appendChild(sel);
CACHE["list"] = sel;

var sep = document.createElement("div");
sep.style.display = "table-cell";
sep.innerHTML = "&nbsp;";
row.appendChild(sep);

var btnPing = document.createElement("div");
btnPing.classList.add("ui-button");
btnPing.classList.add("ui-widget");
btnPing.classList.add("ui-corner-all");
btnPing.style.padding = "0px 8px 0px 8px";
btnPing.style.display = "table-cell";
btnPing.innerHTML = "Ping";
// btnRescan.addEventListener("click", function (e) {
//     rescan(sel);
// });
row.appendChild(btnPing);

var btnRescan = document.createElement("div");
btnRescan.classList.add("ui-button");
btnRescan.classList.add("ui-widget");
btnRescan.classList.add("ui-corner-all");
if (scanning)
    btnRescan.classList.add("ui-state-disabled");
btnRescan.style.padding = "0px 8px 0px 8px";
btnRescan.style.display = "table-cell";
btnRescan.innerHTML = "Rescan";
btnRescan.addEventListener("click", function (e) {
    rescan();
});
row.appendChild(btnRescan);
CACHE["btnRescan"] = btnRescan;

ADD_WIDGET(row);

var s = SETTINGS["SETTING_NAME"];
if ((s === undefined || s.length === 0) && !scanning)
    rescan();
