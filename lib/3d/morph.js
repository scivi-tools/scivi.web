if (IN_VISUALIZATION) {
    var morphedModel = CACHE["mm"];
    if (!morphedModel) {
        var objFrom = PROPERTY["From Model"];
        var objTo = PROPERTY["To Model"];
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
    if (morphedModel) {
        morphedModel.morphTargetInfluences[0] = PROPERTY["t"];
        var s = PROPERTY["Scale"];
        morphedModel.scale.set(s, s, s);
    }
    OUTPUT["Morphed Model"] = morphedModel;
}
