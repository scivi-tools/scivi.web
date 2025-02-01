
if (HAS_INPUT["In"]) {
    INPUT["In"].forEach((el) => {
        el["filter"] = SETTINGS_VAL["Expression"];
    });
    OUTPUT["Out"] = INPUT["In"];
}
