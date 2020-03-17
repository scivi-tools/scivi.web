var object = CACHE["object"];
if (!object) {
    var geo = new THREE.CubeGeometry(1.0, 1.0, 1.0);
    var mat = new THREE.MeshPhongMaterial({color: 0x00BAE3});
    object = new THREE.Mesh(geo, mat);
    object.position.y = 0.5;
    object.castShadow = true;
    object.receiveShadow = true;
    CACHE["object"] = object;
}
if (HAS_INPUT["Rotation"] && INPUT["Rotation"]) {
    var r = INPUT["Rotation"];
    var q = new THREE.Quaternion(r[0], r[1], r[2], r[3]);
    q.normalize();
    object.quaternion.copy(q);
}
OUTPUT["Cube Object"] = object;
