if (HAS_INPUT["JSON Dict"] && INPUT["JSON Dict"]) {
    if (IN_VISUALIZATION) {
        if (!CACHE["GeoJSON"]) {
            var theStyle = function (feature) {
                var hl = feature.isHighlighted;
                return {
                    weight: hl ? 5 : 2,
                    opacity: 1,
                    fillColor: hl ? "#777" : "#BBB",
                    color: hl ? "#111" : "#666",
                    fillOpacity: hl ? 0.7 : 0.65
                };
            };
            var highlightFeature = function (e) {
                var layer = e.target;
                layer.feature.isHighlighted = true;
                CACHE["GeoJSON"].resetStyle(layer);
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
                ttip.html(layer.feature.tooltip ? layer.feature.tooltip : layer.feature.properties.original_name);
                ttip.css({ top: mouseOver.clientY + 20, left: mouseOver.clientX });
                ttip.stop(true);
                ttip.fadeIn(100);
            };
            var updateTooltip = function (feature) {
                if (feature.isHighlighted)
                    $(".scivi_map_tooltip").html(feature.tooltip ? feature.tooltip : feature.properties.original_name);
            }
            var resetHighlight = function (e) {
                var layer = e.target;
                layer.feature.isHighlighted = false;
                CACHE["GeoJSON"].resetStyle(layer);
                var ttip = $(".scivi_map_tooltip");
                ttip.stop(true);
                ttip.fadeOut(100);
            };
            var selectFeature = function (e) {
                L.DomEvent.stopPropagation(e);
                var layer = e.target;
                CACHE["Selection"] = layer.feature.properties.original_name;
                PROCESS();
            };
            var deselectFeature = function () {
                CACHE["Selection"] = null;
                PROCESS();
            };
            var onEachFeature = function (feature, layer) {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: selectFeature
                });
                feature.updateTooltip = updateTooltip;
            };
            var geoJSON = L.geoJSON(INPUT["JSON Dict"], { style: theStyle, onEachFeature: onEachFeature });
            var deselectLayer = {
                addTo: function (map) {
                    map.on("click", deselectFeature);
                }
            };
            CACHE["GeoJSON"] = geoJSON;
            CACHE["Layer"] = [ geoJSON, deselectLayer ];
        }
    } else {
        CACHE["GeoJSON"] = null;
    }
    var selection = CACHE["Selection"];
    if (selection)
        OUTPUT["Selection"] = selection;
    var layer = CACHE["Layer"];
    if (layer)
        OUTPUT["Layer"] = layer;
}
