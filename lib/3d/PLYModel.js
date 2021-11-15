if (SETTINGS_VAL["PLY File"]) {
    if (SETTINGS_CHANGED["PLY File"]) {
        SETTINGS_CHANGED["PLY File"] = false;
        var reader = new FileReader();
        reader.onload = function (event) {
            var loader = new THREE.PLYLoader();
            var buf = loader.parse(event.target.result);
            var matcap = new THREE.TextureLoader().load("lib/matcap.png");
            var material = new THREE.MeshMatcapMaterial({ color: 0xffffff, morphTargets: false, side: THREE.DoubleSide, matcap: matcap });
            var object = new THREE.Mesh(buf, material);
            CACHE["object"] = object;
            PROCESS();
        };
        reader.readAsText(SETTINGS_VAL["PLY File"]);
    }
}
if (IN_VISUALIZATION)
    OUTPUT["Model"] = CACHE["object"];
