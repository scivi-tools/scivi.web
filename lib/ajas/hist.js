
if (HAS_INPUT["Data"]) {
    var columns = [];
    INPUT["Data"].forEach((table) => {
        table["header"].forEach((col) => {
            if (col["type"] == "double")
                columns.push(table["table"] + " :: " + col["name"]);
        });
        if (SETTINGS_VAL["Column"] > columns.length)
            SETTINGS_VAL["Column"] = 0;
        SETTINGS["Column"] = columns;
    });
}
