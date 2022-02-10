function createObject(data)
{
    var loader = new THREE.PLYLoader();
    var buf = loader.parse(data);
    var matcap = new THREE.TextureLoader().load("lib/matcap.png");
    var material = new THREE.MeshMatcapMaterial({ color: 0xffffff, morphTargets: false, side: THREE.DoubleSide, matcap: matcap });
    return new THREE.Mesh(buf, material);
}

if (SETTINGS_VAL["PLY File"]) {
    if (SETTINGS_CHANGED["PLY File"]) {
        SETTINGS_CHANGED["PLY File"] = false;
        DATA["PLY File"] = null;
        var reader = new FileReader();
        reader.onload = function (event) {
            DATA["PLY File"] = event.target.result;
            CACHE["object"] = createObject(event.target.result);
            PROCESS();
        };
        reader.readAsText(SETTINGS_VAL["PLY File"]);
    }
    if (DATA["PLY File"] && !CACHE["object"])
        CACHE["object"] = createObject(DATA["PLY File"]);
}
if (IN_VISUALIZATION)
    OUTPUT["Model"] = CACHE["object"];
