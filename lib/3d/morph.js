if (IN_VISUALIZATION) {
    var morphedModel = CACHE["mm"];
    if (!morphedModel) {
        var objFrom = HAS_INPUT["From Model"] ? INPUT["From Model"] : null;
        var objTo = HAS_INPUT["To Model"] ? INPUT["To Model"] : null;
        if (objFrom || objTo) {
            if (objFrom && !objTo)
                morphedModel = objFrom;
            else if (!objFrom && objTo)
                morphedModel = objTo;
            else {
                if (!objFrom.geometry.morphAttributes.position)
                    objFrom.geometry.morphAttributes.position = [];
                objFrom.geometry.morphAttributes.position[0] = objTo.geometry.getAttribute("position");
                var mat = objFrom.material.clone();
                mat.morphTargets = true; // FIXME: This seems to be removed in the new Three.js version, so you can use material as is without cloning.
                morphedModel = new THREE.Mesh(objFrom.geometry, mat);
            }
        }
        CACHE["mm"] = morphedModel;
    }
    if (morphedModel)
        morphedModel.morphTargetInfluences[0] = HAS_INPUT["t"] ? INPUT["t"] : 0;
    OUTPUT["Morphed Model"] = morphedModel;
}
