
if (HAS_INPUT["Data"]) {
    let columns = [];
    let tables = [];
    let colNames = [];
    INPUT["Data"].forEach((table) => {
        if (table["filter"] === undefined)
            tables.push({ "table": table["table"] });
        else
            tables.push({ "table": table["table"], "filter": table["filter"] });
        table["header"].forEach((col) => {
            if (col["type"] == "double") {
                columns.push(table["table"] + " :: " + col["name"]);
                colNames.push(col["name"]);
            }
        });
        if (SETTINGS_VAL["Column"] > columns.length)
            SETTINGS_VAL["Column"] = 0;
        SETTINGS["Column"] = columns;
    });
    if (IN_VISUALIZATION) {
        let request = {
            "tables": tables,
            "plot": colNames[SETTINGS_VAL["Column"]],
            "join": "obsID"
        };
        $.post("/ajashist", JSON.stringify(request), (response) => {
            let container = document.createElement("div");
            let blob = new Blob([ response["image"] ], { type: "image/svg+xml" });
            let url = URL.createObjectURL(blob);
            let image = document.createElement("img");
            image.src = url;
            image.style = "height: calc(100vh);";
            image.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
            container.appendChild(image);
            container.style = "width: 100%; text-align: center;";
            ADD_VISUAL(container);
        });
    }
}
