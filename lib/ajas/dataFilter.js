
if (HAS_INPUT["In"]) {
    INPUT["In"].forEach((el) => {
        el["Filter"] = SETTINGS_VAL["Expression"];
    });
    OUTPUT["Out"] = INPUT["In"];
}
