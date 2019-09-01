if (SETTINGS_VAL["CSV File"]) {
    if (SETTINGS_CHANGED["CSV File"]) {
        SETTINGS_CHANGED["CSV File"] = false;
        Papa.parse(SETTINGS_VAL["CSV File"], {
            complete: function(res) {
                console.log(res.data);
                DATA["CSV"] = res.data;
                PROCESS();
            }
        });
    }
}
if (DATA["CSV"])
    OUTPUT["Table"] = DATA["CSV"];
