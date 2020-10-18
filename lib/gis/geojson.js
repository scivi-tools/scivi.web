if (HAS_INPUT["JSON Dict"] && INPUT["JSON Dict"]) {
    if (IN_VISUALIZATION) {
        if (!CACHE["GeoJSON"]) {
            var theStyle = {
                weight: 2,
                opacity: 1,
                fillColor: "#BBB",
                color: "#666",
                fillOpacity: 0.65
            };
            var highlightFeature = function (e) {
                var layer = e.target;
                layer.setStyle({
                    weight: 5,
                    color: '#111',
                    fillColor: "#777",
                    fillOpacity: 0.7
                });
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    layer.bringToFront();
                }
                var mouseOver = e.originalEvent;
                var ttip = $(".scivi_map_tooltip");
                if (ttip.length === 0) {
                    ttip = document.createElement("div");
                    ttip.className = "scivi_map_tooltip";
                    document.body.appendChild(ttip);
                    ttip = $(ttip);
                    ttip.hide(0);
                    document.body.addEventListener("mousemove", function (e) {
                        ttip.css({ top: e.clientY + 20, left: e.clientX });
                    });
                }
                ttip.html(layer["feature"]["properties"]["original_name"]);
                ttip.css({ top: mouseOver.clientY + 20, left: mouseOver.clientX });
                ttip.stop(true);
                ttip.fadeIn(100);
            };
            var resetHighlight = function (e) {
                CACHE["GeoJSON"].resetStyle(e.target);
                var ttip = $(".scivi_map_tooltip");
                ttip.stop(true);
                ttip.fadeOut(100);
            };
            var onEachFeature = function (feature, layer) {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    // click: zoomToFeature
                });
            };
            var geoJSON = L.geoJSON(INPUT["JSON Dict"], { style: theStyle, onEachFeature: onEachFeature });
            CACHE["GeoJSON"] = geoJSON;
            OUTPUT["Layer"] = [ geoJSON ];
        }
    } else {
        CACHE["GeoJSON"] = null;
    }
}
