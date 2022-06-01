
function dumpCSV(csv)
{
    var result = "";
    for (var i = 0; i < csv.length; ++i)
        result += csv[i].join(";") + "\n";
    return result;
}

if (IN_VISUALIZATION) {
    if (!CACHE["csv"]) {
        CACHE["csv"] = [];
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
        rec.addEventListener("click", function (e) {
            var r = CACHE["rec"];
            if (CACHE["rec"]) {
                rec.innerHTML = "Start Recording CSV";
                rec.classList.remove("pushed");
                CACHE["rec"] = false;
                if (CACHE["csv"]) {
                    SAVE_FILE(dumpCSV(CACHE["csv"]), "table.csv", ".csv", "text/plain;charset=utf-8", true);
                }
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
    //console.log(INPUT["Table"]);
    if (HAS_INPUT["Table"] && INPUT["Table"] && CACHE["rec"])
            CACHE["csv"].push(INPUT["Table"]);
} else {
    CACHE["rec"] = false;
    CACHE["csv"] = null;
}
