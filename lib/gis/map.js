var map = CACHE["map"];
if (IN_VISUALIZATION) {
    if (!map) {
        var container = document.createElement("div");
        container.setAttribute("id", "map");
        var reshape = function() {
            container.style.width = window.innerWidth + "px";
            container.style.height = window.innerHeight + "px";
        };
        window.addEventListener("resize", reshape, false);
        reshape();
        ADD_VISUAL(container);
        map = L.map("map").setView([58.014965, 56.246723], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        CACHE["map"] = map;
    }
}
if (map) {
    if (HAS_INPUT["Layer"]) {
        var layer = INPUT["Layer"];
        if (layer) {
            for (var i = 0, n = layer.length; i < n; ++i) {
                layer[i].addTo(map);
            }
        }
    }
}
