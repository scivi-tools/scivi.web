if (IN_VISUALIZATION) {
    if (!CACHE["map"]) {
        var style = document.createElement("style");
        style.type = "text/css";
        if (style.styleSheet)
            style.styleSheet.cssText = ".leaflet-right { position: absolute; }";
        else
            style.appendChild(document.createTextNode(".leaflet-right { position: absolute; }"));
        document.getElementsByTagName("head")[0].appendChild(style);

        var container = document.createElement("div");
        container.setAttribute("id", "map");
        container.style.width = "100%";
        container.style.height = "100%";
        ADD_VISUAL(container);
        var map = L.map("map").setView([58.014965, 56.246723], 13);
        map.zoomControl.setPosition("bottomleft");
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            noWrap: true
        }).addTo(map);
        if (HAS_INPUT["Layer"]) {
            var layer = INPUT["Layer"];
            if (layer) {
                for (var i = 0, n = layer.length; i < n; ++i) {
                    layer[i].addTo(map);
                }
            }
        }
        if (SETTINGS_VAL["FocusRegion"] && SETTINGS_VAL["FocusRegion"].length > 0) {
            var name = SETTINGS_VAL["FocusRegion"].replace(" ", "+");
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() { 
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    var result = JSON.parse(xmlHttp.responseText);
                    var bbox = result["features"][0]["bbox"];
                    map.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]]);
                }
            }
            xmlHttp.open("GET", "https://nominatim.openstreetmap.org/search?q=" + name + "&format=geojson", true);
            xmlHttp.send(null);
        }
        CACHE["map"] = map;
    }
} else {
    CACHE["map"] = null;
}
