
if (IN_VISUALIZATION)
{
    if (!CACHE["JSON_sent"])
    {
        OUTPUT["JSON Dict"] = DATA["JSON"];
        CACHE["JSON_sent"] = true;
    }
}
else
{
    if (SETTINGS_VAL["JSON File"] && SETTINGS_CHANGED["JSON File"]) 
    {
            SETTINGS_CHANGED["JSON File"] = false;
            var fr = new FileReader();
            fr.onload = (res) => {
                DATA["JSON"] = JSON.parse(res.target.result);
                PROCESS();
            };
            fr.readAsText(SETTINGS_VAL["JSON File"]);
    }
    CACHE["JSON_sent"] = false;
}

