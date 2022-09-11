
function dumpCSV(csv)
{
    var result = "";
    for (var i = 0; i < csv.length; ++i)
        result += csv[i].join(";") + "\n";
    return result;
}

if (IN_VISUALIZATION) {
    if (!CACHE["csv_files"]) 
    {
        CACHE["csv_files"] = {};
        CACHE["rec"] = false;

        var container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "auto;";
        container.style.font = "14px Helvetica Neue, Helvetica, Arial, sans-serif";

        var toolbar = document.createElement("div");
        toolbar.style.position = "relative";
        toolbar.style.margin = "24px 0px 0px 0px";
        toolbar.style.textAlign = "center";

        var rec = document.createElement("div");
        rec.innerHTML = "Start Recording CSV";
        rec.classList.add("scivi_button");
        rec.addEventListener("click", e => {
            var r = CACHE["rec"];
            if (CACHE["rec"]) {
                rec.innerHTML = "Start Recording CSV";
                rec.classList.remove("pushed");
                CACHE["rec"] = false;
                Object.keys(CACHE["csv_files"])
                    .forEach(filename => SAVE_FILE(dumpCSV(CACHE["csv_files"][filename]),
                                                            filename + "_table.csv",
                                                            ".csv", "text/plain;charset=utf-8", true));
            } else {
                rec.innerHTML = "Stop Recording CSV";
                rec.classList.add("pushed");
                rec.pushed = true;
                CACHE["rec"] = true;
            }
        });
        toolbar.appendChild(rec);

        container.appendChild(toolbar);

        ADD_VISUAL(container);
    }
    
    if (HAS_INPUT["Meta"] && INPUT["Meta"])
    {
        let file_name = INPUT["Meta"]["Title"] || "untitled";
        let header = INPUT["Meta"]["Header"] || [];
        if (!CACHE["csv_files"][file_name])//if no that file, then insert
            CACHE["csv_files"][file_name] = [header];
        CACHE["CurrentFile"] = file_name;
    }

    if (HAS_INPUT["Row"] && INPUT["Row"] && CACHE["rec"])
    {
        const file_name = CACHE["CurrentFile"] || "untitled";
        if (!CACHE["csv_files"][file_name])
        CACHE["csv_files"][file_name] = [];
        CACHE["csv_files"][file_name].push(INPUT["Row"]);
    }
} else {
    CACHE["rec"] = undefined;
    CACHE["csv_files"] = undefined;
    CACHE["CurrentFile"] = undefined;
}
