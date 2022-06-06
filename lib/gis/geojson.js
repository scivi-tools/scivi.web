if (HAS_INPUT["JSON Dict"] && INPUT["JSON Dict"]) {
    if (IN_VISUALIZATION) {
        if (!CACHE["GeoJSON"]) {
            var theStyle = function (feature) {
                var hl = feature.isHighlighted;
                var sbt = SETTINGS_VAL["Selected Border Thickness"] !== undefined ? SETTINGS_VAL["Selected Border Thickness"] : 5;
                var bt = SETTINGS_VAL["Border Thickness"] !== undefined ? SETTINGS_VAL["Border Thickness"] : 2;
                var sfc = SETTINGS_VAL["Selected Fill Color"] !== undefined ? SETTINGS_VAL["Selected Fill Color"] : "#777";
                var fc = SETTINGS_VAL["Fill Color"] !== undefined ? SETTINGS_VAL["Fill Color"] : "#BBB";
                var sbc = SETTINGS_VAL["Selected Border Color"] !== undefined ? SETTINGS_VAL["Selected Border Color"] : "#111";
                var bc = SETTINGS_VAL["Border Color"] !== undefined ? SETTINGS_VAL["Border Color"] : "#666";
                var sfo = SETTINGS_VAL["Selected Fill Opacity"] !== undefined ? SETTINGS_VAL["Selected Fill Opacity"] : 0.7;
                var fo = SETTINGS_VAL["Fill Opacity"] !== undefined ? SETTINGS_VAL["Fill Opacity"] : 0.65;
                return {
                    weight: hl ? sbt : bt,
                    opacity: 1,
                    fillColor: hl ? sfc : fc,
                    color: hl ? sbc : bc,
                    fillOpacity: hl ? sfo : fo
                };
            };
            var highlightFeature = function (e) {
                var layer = e.target;
                layer.feature.isHighlighted = true;
                CACHE["GeoJSON"].resetStyle(layer);
                var selection = CACHE["Selection"];
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    layer.bringToFront();
                    if (selection)
                        selection.bringToFront();
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
                layer.feature.isSelected = true;
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge)
                    layer.bringToFront();
                var selection = CACHE["Selection"];
                if (selection && selection != layer)
                    selection.feature.isSelected = false;
                CACHE["Selection"] = layer;
                PROCESS();
            };
            var deselectFeature = function () {
                var layer = CACHE["Selection"];
                if (layer)
                    layer.feature.isSelected = false;
                CACHE["Selection"] = null;
                PROCESS();
            };
            var onEachFeature = function (feature, layer) {
                if (!SETTINGS_VAL["Static"]) {
                    layer.on({
                        mouseover: highlightFeature,
                        mouseout: resetHighlight,
                        click: selectFeature
                    });
                }
                feature.updateTooltip = updateTooltip;
                feature.isSelected = false;
                feature.isHighlighted = false;
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
        OUTPUT["Selection"] = selection.feature.properties.original_name;
    var layer = CACHE["Layer"];
    if (layer)
        OUTPUT["Layer"] = layer;
}
