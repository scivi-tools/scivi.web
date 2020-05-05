var object = CACHE["object"];
var color = PROPERTY["Surface Color"];
var rotation = PROPERTY["Rotation"];
if (!object) {
    var geo = new THREE.CubeGeometry(1.0, 1.0, 1.0);
    var mat = new THREE.MeshPhongMaterial({color: color});
    object = new THREE.Mesh(geo, mat);
    object.position.y = 0.5;
    object.castShadow = true;
    object.receiveShadow = true;
    CACHE["object"] = object;
}
object.material.color.set(color);
var q = new THREE.Quaternion(rotation[1], rotation[3], -rotation[2], rotation[0]);
q.normalize();
object.quaternion.copy(q);
OUTPUT["Cube Object"] = object;
