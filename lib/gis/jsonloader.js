if (IN_VISUALIZATION)
{
    if (SETTINGS_VAL["JSON File"]) 
    {
        if (SETTINGS_CHANGED["JSON File"]) 
        {
            SETTINGS_CHANGED["JSON File"] = false;
            var fr = new FileReader();
            fr.onload = function (res) {
                DATA["JSON"] = JSON.parse(res.target.result);
                PROCESS();
            };
            fr.readAsText(SETTINGS_VAL["JSON File"]);
        }
    }
    
    if (DATA["JSON"])
    {
        OUTPUT["JSON Dict"] = DATA["JSON"];
        DATA["JSON"] = undefined;
    }
}

