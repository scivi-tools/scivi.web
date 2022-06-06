if (IN_VISUALIZATION && HAS_INPUT["Actors"]) {
    // Create root
    var container = CACHE["container"];
    if (!container) {
        container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";
        ADD_VISUAL(container);
        CACHE["container"] = container;
    }

    // Sync actors
    var actors = INPUT["Actors"];
    if (!actors)
        actors = [];
    if (!Array.isArray(actors))
        actors = [ actors ];
    for (var i = 0, n = actors.length; i < n; ++i) {
        if (!container.contains(actors[i]))
            container.appendChild(actors[i]);
    }
    var toRemove = [];
    for (var i = 0, n = container.children.length; i < n; ++i) {
        if (!actors.includes(container.children[i]))
            toRemove.push(container.children[i]);
    }
    for (var i = 0, n = toRemove.length; i < n; ++i)
        container.removeChild(toRemove[i]);


} else {
    CACHE["container"] = null;
    CACHE["oldActors"] = null;
}
