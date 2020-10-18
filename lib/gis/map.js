if (IN_VISUALIZATION) {
    if (!CACHE["map"]) {
        var container = document.createElement("div");
        container.setAttribute("id", "map");
        var reshape = function() {
            container.style.width = window.innerWidth + "px";
            container.style.height = window.innerHeight + "px";
        };
        window.addEventListener("resize", reshape, false);
        reshape();
        ADD_VISUAL(container);
        var map = L.map("map").setView([58.014965, 56.246723], 13);
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
