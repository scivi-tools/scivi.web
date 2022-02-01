if (IN_VISUALIZATION) {
    var scene = CACHE["scene"];
    var object = CACHE["object"];
    if (!scene) {
        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(0, 10, 10);
        camera.lookAt(0, 0, 0);

        scene = new THREE.Scene();

        var gridHelper = new THREE.GridHelper(10, 10);
        scene.add(gridHelper);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        var light = new THREE.DirectionalLight(0xffffff, 2);
        light.castShadow = true;
        light.position.set(0, 5, 0);
        scene.add(light);

        var light2 = new THREE.DirectionalLight(0xffffff, 0.7);
        light2.position.set(0, 5, 5);
        scene.add(light2);

        var geometry = new THREE.CubeGeometry(30, 0.2, 30);
        var material = new THREE.ShadowMaterial();
        material.opacity = 0.2;
        var ground = new THREE.Mesh( geometry, material );
        ground.receiveShadow = true;
        scene.add(ground);

        var renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setClearColor(0xffffff);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        var controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.minDistance = 0.5;
        controls.maxDistance = 100;

        var reshape = function() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", reshape, false);

        var draw = function () {
            renderer.render(scene, camera);
            if (IN_VISUALIZATION)
                requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);

        ADD_VISUAL(renderer.domElement);

        CACHE["scene"] = scene;
    }
    var newObject = HAS_INPUT["Object"] ? INPUT["Object"] : null;
    if (newObject) {
        if (object != newObject) {
            if (object)
                scene.remove(object);
            scene.add(newObject);
        }
    } else if (object) {
        scene.remove(object);
    }
    CACHE["object"] = newObject;
} else {
    CACHE["scene"] = null;
    CACHE["object"] = null;
}
