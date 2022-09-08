// import {
// 	BoxGeometry,
// 	Mesh,
// 	MeshBasicMaterial,
// 	PerspectiveCamera,
// 	Scene,
// 	WebGLRenderer
// } from 'three';
import * as THREE from 'three'
import {
	GUI
}
from 'three/examples/jsm/libs/lil-gui.module.min.js';

import {
	OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js';
import {
	TransformControls
} from 'three/examples/jsm/controls/TransformControls.js';
import {
	CSS2DRenderer,
	CSS2DObject,
}
from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import {
	MTLLoader
} from 'three/examples/jsm/loaders/mtlLoader.js';
import {
	FBXLoader
} from 'three/examples/jsm/loaders/FBXLoader.js';
import {
	OBJLoader
}
from 'three/examples/jsm/loaders/objLoader.js';
import saveFile from "easy-file-saver";

(function () {
	var script = document.createElement('script');
	script.onload = function () {
		var stats = new Stats();
		document.body.appendChild(stats.dom);
		requestAnimationFrame(function loop() {
			stats.update();
			requestAnimationFrame(loop)
		});
	};
	script.src = '//mrdoob.github.io/stats.js/build/stats.min.js';
	document.head.appendChild(script);
})()
let camera, scene, renderer, controls, labelRenderer, control, objLoader, floor, hemiLight, dirLight;
//all the gui vars 
let folderLocal, scale, information, gui, controllers, guiRooms;
let xPos, yPos, zPos, xScale, yScale, zScale, tagText, nameGUI;

const rooms = {
	Spawn2x2: function () {
		SpawnFBXRoom(colorYellow, 0, 0, 0, "https://google.com", "Name me", "sq_2x2.fbx");
	},
	Spawn3x1: function () {
		SpawnFBXRoom(colorYellow, 0, 0, 0, "https://google.com", "Name me", "rec_3x1.5.fbx");
	},
	Spawn4x2: function () {
		SpawnFBXRoom(colorYellow, 0, 0, 0, "https://google.com", "Name me", "rec_4x2.fbx");
	},
	Spawn4x3: function () {
		SpawnFBXRoom(colorYellow, 0, 0, 0, "https://google.com", "Name me", "rec_4x3.fbx");
	},
	Spawn5x3: function () {
		SpawnFBXRoom(colorYellow, 0, 0, 0, "https://google.com", "Name me", "rec_5x3.fbx");
	},
	Spawn6x4: function () {
		SpawnFBXRoom(colorYellow, 0, 0, 0, "https://google.com", "Name me", "rec_6x4.fbx");
	},
	SaveScene: function () {
		// removeObject3D(floor);
		// removeObject3D(hemiLight);
		// removeObject3D(dirLight);
		saveFile({
			data: scene.toJSON(),
			debug: true,
			filename: "scene.json"
		});
	},
};
const colorYellow = new THREE.Color("rgb(229, 192, 123)");
const colorRed = new THREE.Color("rgb(224, 99, 92)");
const colorBlue = new THREE.Color("rgb(66, 160, 239)");

class App {
	init() {

		{ //scene loaders
			scene = new THREE.Scene();
			fetch("assets/scene(11).json")
				.then((response) => response.json())
				.then((json) => createScene(json));

			function createScene(json) {
				scene = new THREE.ObjectLoader().parse(json);
				//alle tags terug gaan toevoegen
				//gaan nakijken welke meshes een userData.TAGNAME hebben
				for (let i = 0; i < scene.children.length; i++) {
					if (scene.children[i].userData.TAGNAME !== undefined) {
						for (let j = 0; j < scene.children[i].children.length; j++) {
							if (scene.children[i].children[j].name === "tag") {
								removeObject3D(scene.children[i].children[j]);
							} else {
								//textlabel
								addTag(scene.children[i].userData.TAGNAME, scene.children[i]);
							}
						}
					}
				}
				// scene.traverse(function (child) {
				// 	if (child.isMesh) {
				// 		console.log("Giving shadow");
				// 		child.castShadow = true;
				// 		child.receiveShadow = true;
				// 		child.position.y = 0;
				// 	}
				// });
			}
		}

		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.z = 100;
		camera.position.y = 90;

		renderer = new THREE.WebGLRenderer({
			alpha: true
		}); // init like this
		renderer.shadowMap.enabled = true;
		renderer.setClearColor(0xffffff, 0); // second param is opacity, 0 => transparent
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.getElementById('container').appendChild(renderer.domElement);


		{ //gui gaan declareren
			gui = new GUI();
			guiRooms = new GUI();
			information = gui.addFolder('General information');
			folderLocal = gui.addFolder('Room information');
			scale = folderLocal.addFolder('Scale');
			guiRooms.add(rooms, 'Spawn2x2');
			guiRooms.add(rooms, 'Spawn3x1');
			guiRooms.add(rooms, 'Spawn4x2');
			guiRooms.add(rooms, 'Spawn4x3');
			guiRooms.add(rooms, 'Spawn5x3');
			guiRooms.add(rooms, 'Spawn6x4');
			guiRooms.add(rooms, 'SaveScene');
		} { //panningcontrol and transformcontrols
			control = new TransformControls(camera, renderer.domElement);
			control.showY = false;
			control.setRotationSnap(45 * Math.PI / 180);
			// control.setTranslationSnap(5);
			controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = 1.5;
			controls.enableZoom = true;
			controls.enablePan = true;
			// controls.enableKeys = true;
			controls.enableZoom = true;
			controls.minDistance = 5;
			controls.maxDistance = 100;
		}

		{ //label rendering
			labelRenderer = new CSS2DRenderer();
			labelRenderer.setSize(window.innerWidth, window.innerHeight);
			labelRenderer.domElement.style.position = 'absolute';
			labelRenderer.domElement.style.top = '0px';
			labelRenderer.domElement.style.pointerEvents = 'none';
			document.getElementById('container').appendChild(labelRenderer.domElement);
		} { //object loading
			var mtlLoader = new MTLLoader();
			objLoader = new OBJLoader();
			// mtlLoader.setTexturePath('assets/');
			mtlLoader.setPath('assets/');
			objLoader.setPath('assets/');
			// mtlLoader.load('emptyroom.mtl', function (materials) {
			// materials.preload();
			// objLoader.setMaterials(materials);
		}

		const pointer = new THREE.Vector2();
		const raycaster = new THREE.Raycaster();
		let INTERSECTED;
		let previousIntersection;

		const onMouseMove = (event) => {
			// calculate pointer position in normalized device coordinates
			// (-1 to +1) for both components
			// var rect = renderer.domElement.getBoundingClientRect();
			// pointer.x = ((event.clientX - rect.left) / (rect.width - rect.left)) * 2 - 1;
			// pointer.y = -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;
			pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
			pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
			// console.log('x:', pointer.x, "y:", pointer.y);
			raycaster.setFromCamera(pointer, camera);
			const intersects = raycaster.intersectObjects(scene.children, true);
			if (intersects.length > 0) {

				if (INTERSECTED != intersects[0].object && intersects[0].object.material.emissive !== undefined) {

					if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex); {
						INTERSECTED = intersects[0].object;
						INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();

						var objectGroup = intersects[0].object.parent;

						if (!objectGroup.isScene) {
							{ //editing of objects in the scene
								//de parent van het object zoeken en dan alle kinderen aanspreken
								controllers = gui.controllersRecursive();
								for (let j = 0; j < controllers.length; j++) {
									controllers[j].destroy();
								}
								
								nameGUI = information.add(objectGroup.children[0], 'name');
								information.add(objectGroup, 'id');
								console.log(objectGroup);
								for (let j = 0; j < objectGroup.children.length; j++) {
									if (objectGroup.children[j].type === 'Mesh') {
										let color = {
											colorObject: {
												r: objectGroup.children[j].material.color.r,
												g: objectGroup.children[j].material.color.g,
												b: objectGroup.children[j].material.color.b
											}
										};
										information.addColor(color, 'colorObject').onChange(function (value) {
											console.log('changing color', value);
											objectGroup.children[j].material.color.setRGB(value.r, value.g, value.b);
										});
									}
								}

								let url = information.add(objectGroup.userData, 'URL');

								//position of the room
								xPos = folderLocal.add(objectGroup.position, 'x').listen();
								zPos = folderLocal.add(objectGroup.position, 'z').listen();
								xScale = scale.add(objectGroup.scale, 'x');
								zScale = scale.add(objectGroup.scale, 'z');
							}

							for (let j = 0; j < objectGroup.children.length; j++) {
								// console.log(objectGroup.children[j].type);
								if (objectGroup.children[j].type === 'Mesh') {
									objectGroup.children[j].material.emissive.setHex(0x808080);
								}
								if (objectGroup.children[j].name === 'tag') {
									objectGroup.children[j].visible = true;
									// console.log('deselecting tag', objectGroup.children[j]);
									//editing the text of tags 
									tagText = information.add(objectGroup.children[j].element, 'textContent').onChange(function (value) {
										objectGroup.userData.TAGNAME = value;
									});
								}
								// adding drag controleerStp// transform gizmo
								control.attach(objectGroup)
								scene.add(control)
							}
						}
					}
				}
			}
			if (INTERSECTED !== undefined && INTERSECTED !== null) {
				// console.log(previousIntersection)
				if (previousIntersection !== INTERSECTED.parent) {
					if (previousIntersection !== undefined) {
						// console.log(previousIntersection);
						for (let j = 0; j < previousIntersection.children.length; j++) {
							if (previousIntersection.children[j].type === 'Mesh') {
								previousIntersection.children[j].material.emissive.setHex(INTERSECTED.currentHex);
								// console.log("removing color from the previous ones", previousIntersection.parent.children[j].type);
							} else if (previousIntersection.children[j].name === 'tag') {
								previousIntersection.children[j].visible = false;
								// console.log('deselecting tag', objectGroup.children[j]);
							}
						}
						control.detach();
					}
					previousIntersection = INTERSECTED.parent;
					INTERSECTED = null;
				}
			}
		}

		const onMouseDown = (event) => {
			// calculate pointer position in normalized device coordinates
			// (-1 to +1) for both components
			pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
			pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
			raycaster.setFromCamera(pointer, camera);
			const intersects = raycaster.intersectObjects(scene.children, true);
			if (intersects.length > 0) {
				console.log(intersects[0].object);
				if (intersects[0].object.parent.userData.URL && intersects[0].object.parent.name === "room") {

					// console.log(intersects[0].point);
					// console.log(intersects[0].object.parent.userData.URL);
					// console.log(scene.toJSON());
					// window.open(intersects[0].object.parent.userData.URL, '_blank');
				}
			}
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mousedown', onMouseDown);
		window.addEventListener('resize', onWindowResize, false);
		control.addEventListener('mouseDown', function () {
			controls.enabled = false;
		})
		control.addEventListener('mouseUp', function () {
			controls.enabled = true;
		})

		window.addEventListener('keydown', function (event) {
			switch (event.code) {
				case 'KeyB':
					controls.enabled = !controls.enabled;
					console.log("Movement is now: " + controls.enabled);
					break;
				case 'KeyR':
					spawnCostumRoom(5, 0, 5, 5, 6, 7, "hall");
					break;
				case 'KeyT':
					spawnRoom(colorYellow, 0, 0, 0, "https://spatial.io/s/Brainstorming-Room-61e96723c2ff6c0001207dfa?share=640962037014139923&utm_source=%2Fspaces", "Board room");
					break;
				case 'KeyA':
					control.mode = 'rotate';
					control.showY = true;
					control.showX = false;
					control.showZ = false;
					break;
				case 'KeyC':
					control.mode = 'translate';
					control.showY = false;
					control.showX = true;
					control.showZ = true;
					break;
			}

		})

		//floor 
		const planeSize = 150;

		const loader = new THREE.TextureLoader();
		const texture = loader.load(
			"https://r105.threejsfundamentals.org/threejs/resources/images/checker.png"
		);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		const repeats = planeSize / 2;
		texture.repeat.set(repeats, repeats);

		const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize / 2);
		const planeMat = new THREE.MeshPhongMaterial({
			map: texture,
			side: THREE.DoubleSide,
		});
		const mesh = new THREE.Mesh(planeGeo, planeMat);
		mesh.receiveShadow = true;
		mesh.castShadow = true;
		mesh.rotation.x = Math.PI * -0.5;
		mesh.name = "floor";
		scene.add(mesh);
		floor = mesh;


		{ // LIGHTS
			hemiLight = new THREE.HemisphereLight(0xffffe0, 0xffffe0, 0.6);
			hemiLight.color.setHSL(0.6, 1, 0.6);
			hemiLight.groundColor.setHSL(0.095, 1, 0.75);
			hemiLight.position.set(0, 50, 0);
			scene.add(hemiLight);

			// const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
			// scene.add(hemiLightHelper);

			dirLight = new THREE.DirectionalLight(0xffffe0, 1);
			dirLight.color.setHSL(0.1, 1, 0.95);
			dirLight.position.set(-1, 1.75, 1);
			dirLight.position.multiplyScalar(30);
			scene.add(dirLight);

			dirLight.castShadow = true;

			dirLight.shadow.mapSize.width = 2048;
			dirLight.shadow.mapSize.height = 2048;

			const d = 50;

			dirLight.shadow.camera.left = -d;
			dirLight.shadow.camera.right = d;
			dirLight.shadow.camera.top = d;
			dirLight.shadow.camera.bottom = -d;

			dirLight.shadow.camera.far = 3500;
			dirLight.shadow.bias = -0.0001;

			// const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
			// scene.add(dirLightHelper);

		}
		animate();
	}

}
var animate = function () {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
	labelRenderer.render(scene, camera);
}; //spawns a room
function spawnRoom(color, x, y, z, url, name) {
	objLoader.load('emptyroom.obj', function (object) {
		scene.add(object);

		addTag(name, object);

		//getting the size of the room
		let cubeBoundingBox = new THREE.Box3().setFromObject(object);
		let boxSize = new THREE.Vector3();
		cubeBoundingBox.getSize(boxSize);
		// console.log("BoxSize.x: " + boxSize.x);
		mesh.receiveShadow = true;
		mesh.castShadow = true;
		object.position.set(x, y, z)
		object.name = "room";
		object.traverse(function (obj) {
			if (obj.isMesh) {
				obj.material.color.set(color);
			}
		});
		object.userData = {
			URL: url,
			TAGNAME: name
		};
	});
}

function addTag(tagName, object) {
	//textlabel
	const text = document.createElement('div');
	text.className = 'label';
	text.textContent = tagName;
	const label = new CSS2DObject(text);
	label.position.copy(object.position);
	label.visible = false;
	label.name = "tag";
	object.add(label);
}

function SpawnFBXRoom(color, x, y, z, url, name, room) {
	const fbxLoader = new FBXLoader()
	fbxLoader.load(
		'assets/' + room,
		(object) => {
			object.scale.set(.05, .05, .05);
			mesh.receiveShadow = true;
			mesh.castShadow = true;
			addTag(name, object);
			object.position.set(x, y, z)
			object.name = "room";
			object.traverse(function (obj) {
				if (obj.isMesh) {
					obj.material.color.set(color);
				}
			});
			object.userData = {
				URL: url,
				TAGNAME: name
			};
			scene.add(object)
		},
		(xhr) => {
			console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
		},
		(error) => {
			console.log(error)
		}
	)
}

function spawnCostumRoom(x, y, z, width, height, length, name) { //spawns costum room
	const cubeGeo = new THREE.BoxBufferGeometry(
		width,
		height,
		length
	);
	const cubeGeoParent = new THREE.BoxBufferGeometry(
		0.5,
		0.5,
		0.5
	);
	const cubeMat = new THREE.MeshPhongMaterial({
		color: colorYellow
	});
	const mesh = new THREE.Mesh(cubeGeo, cubeMat.clone());
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	// mesh.position.set(x, height / 2, z);
	mesh.name = "CostumRoom";

	//creating parent object 
	const CostumRoomParent = new THREE.Mesh(cubeGeoParent, cubeMat);
	// CostumRoomParent.material.visible = false;
	CostumRoomParent.position.set(x, height / 2, z);
	CostumRoomParent.name = "CostumRoomParent";
	CostumRoomParent.userData = {
		URL: "http://stackoverflow.com",
		TAGNAME: name
	};
	scene.add(CostumRoomParent);
	CostumRoomParent.add(mesh);
	addTag(name, CostumRoomParent)
	CostumRoomParent.add(label);
}

function onWindowResize() { //resizes window
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function removeObject3D(object3D) {
	if (!(object3D instanceof THREE.Object3D)) return false;

	// for better memory management and performance
	if (object3D.geometry) object3D.geometry.dispose();

	if (object3D.material) {
		if (object3D.material instanceof Array) {
			// for better memory management and performance
			object3D.material.forEach(material => material.dispose());
		} else {
			// for better memory management and performance
			object3D.material.dispose();
		}
	}
	object3D.removeFromParent(); // the parent might be the scene or another Object3D, but it is sure to be removed this way
	return true;
}


export default App;