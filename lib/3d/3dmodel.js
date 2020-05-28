var object = CACHE["object"];
var rotation = PROPERTY["Rotation"];
if (SETTINGS_VAL["Model File"]) {
    if (SETTINGS_CHANGED["Model File"]) {
        SETTINGS_CHANGED["Model File"] = false;
        var reader = new FileReader();
        reader.onload = function (event) {
            var loader = new THREE.OBJLoader();
            object = new THREE.Object3D();
            var obj = loader.parse(event.target.result);
            var matcap = new THREE.TextureLoader().load("lib/matcap.png");
            var material = new THREE.MeshMatcapMaterial({ color: 0xffffff, morphTargets: false, side: THREE.DoubleSide, matcap: matcap });
            obj.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = material;
                }
            });
            obj.rotation.y = 1.57;
            obj.scale.x = 0.5;
            obj.scale.y = 0.5;
            obj.scale.z = 0.5;
            object.add(obj);
            CACHE["object"] = object;
            PROCESS();
        };
        reader.readAsText(SETTINGS_VAL["Model File"]);
    }
}
if (object) {
    var q = new THREE.Quaternion(-rotation[1], rotation[2], -rotation[0], rotation[3]);
    q.normalize();
    object.quaternion.copy(q);
    OUTPUT["Model"] = object;
}
