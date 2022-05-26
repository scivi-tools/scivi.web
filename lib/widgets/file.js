function getHumanReadableSize(size)
{
    var suffixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    var p = Math.floor(Math.log(size) / Math.log(1024.0));
    var rem = size / Math.pow(1024, p);
    var v = +(rem).toFixed(2);
    return v + " " + suffixes[p];
}

var v = SETTINGS_VAL["SETTING_NAME_meta"];
if (!v)
    v = "";

var elID = "f_SETTING_ID_" + NODE_ID;

var row = document.createElement("div");
row.style.display = "table-row";

var cell = document.createElement("div");
cell.style.display = "table-cell";
row.appendChild(cell);

var lbl = document.createElement("label");
lbl.classList.add("ui-button");
lbl.classList.add("ui-widget");
lbl.classList.add("ui-corner-all");
lbl.style.marignBottom = "8px";
lbl.htmlFor = elID;
lbl.innerHTML = "SETTING_NAME";
cell.appendChild(lbl);

var inp = document.createElement("input");
inp.type = "file";
inp.id = elID;
cell.appendChild(inp);

var lst = document.createElement("div");
lst.style.display = "table-cell";
lst.style.paddingLeft = "5px";
lst.innerHTML = v;
row.appendChild(lst);

inp.addEventListener("change", function (e) {
    var f = inp.files[0];
    var meta = f.name + " (" + getHumanReadableSize(f.size) + ")";
    lst.innerHTML = meta;
    SETTINGS_VAL["SETTING_NAME"] = f;
    SETTINGS_VAL["SETTING_NAME_meta"] = meta;
    SETTINGS_CHANGED["SETTING_NAME"] = true;
    PROCESS();
});

ADD_WIDGET(row);
