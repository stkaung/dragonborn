import * as THREE from "three";
import { OrbitControls } from "orbit";
import { OBJLoader } from "obj";
import { MTLLoader } from "mtl";

function createViewer(containerId, objPath, mtlPath, back = false) {
  const container = document.querySelector(`#${containerId}`);
  if (!container) {
    console.error(`Container with ID "${containerId}" not found.`);
    return;
  }

  let renderer, scene, camera, controls;

  // Add this function to reset camera position
  function resetCamera() {
    if (camera) {
      camera.position.set(0, 0, 5); // Reset to original position
      camera.lookAt(0, 0, 0);
      controls.reset(); // Reset orbit controls
    }
  }

  function initScene() {
    if (container.querySelector("canvas")) {
      console.log(
        `Canvas already exists in ${containerId}, skipping initialization.`
      );
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color("#2a2a2a");

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Load Model
    const pivot = new THREE.Object3D();
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      mtlPath,
      (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
          objPath,
          (object) => {
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center);

            object.traverse((child) => {
              if (child.isMesh) {
                child.material.transparent = false;
                child.material.opacity = 1;
                child.material.side = THREE.FrontSide;
              }
            });

            scene.add(object);
            pivot.add(object);
            if (back) {
              pivot.rotation.y = Math.PI;
            }
            scene.add(pivot);
          },
          (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`),
          (error) => console.log("An error happened while loading the model.")
        );
      },
      (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`),
      (error) => console.log("An error happened while loading materials.")
    );

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      pivot.rotation.y += 0.002;
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Find the parent carousel container
    const carouselContainer = container.closest(".carousel-container");
    if (carouselContainer) {
      // Add listener for when the section buttons are clicked
      document.querySelectorAll(".btn-secondary").forEach((button) => {
        button.addEventListener("click", () => {
          // Small delay to ensure the new scene is ready
          setTimeout(resetCamera, 100);
        });
      });
    }
  }

  // Handle resizing of the container
  function onResize() {
    if (!renderer || !camera) return;
    const newWidth = container.clientWidth || 400;
    const newHeight = container.clientHeight || 400;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  }

  // Handle visibility toggling
  function handleVisibility() {
    const canvas = container.querySelector("canvas");
    if (container.closest(".carousel-item.active")) {
      if (canvas) canvas.style.display = "block";
      onResize();
    } else {
      if (canvas) canvas.style.display = "none";
    }
  }

  // Listen to window resize events
  window.addEventListener("resize", onResize, false);

  // Find the parent carousel for this viewer
  const carouselElement = container.closest(".carousel");
  if (carouselElement) {
    // Listen to Bootstrap carousel events
    carouselElement.addEventListener("slid.bs.carousel", handleVisibility);
  }

  // Initialize scene if already active
  if (container.closest(".carousel-item.active")) {
    initScene();
  } else {
    const carouselElement = container.closest(".carousel");
    if (carouselElement) {
      carouselElement.addEventListener("slid.bs.carousel", function (event) {
        if (event.relatedTarget.contains(container)) {
          initScene();
        }
      });
    }
  }
}

function toggleUniform(viewerId, type) {
  // Get all buttons in the container
  const container =
    document.getElementById(viewerId).parentElement.parentElement;
  const buttons = container.querySelectorAll("button");

  // Remove active class from all buttons
  buttons.forEach((button) => button.classList.remove("active"));

  // Add active class to clicked button
  const clickedButton = Array.from(buttons).find(
    (button) =>
      (type.includes("head") &&
        button.textContent.toLowerCase().includes("head")) ||
      (!type.includes("head") &&
        button.textContent.toLowerCase().includes("member"))
  );
  if (clickedButton) clickedButton.classList.add("active");

  // Determine if this is a department or division based on the viewer ID
  const category = viewerId.includes("dept") ? "departments" : "divisions";

  // Update the model paths
  const objPath = `models/${category}/${type}/avatar.obj`;
  const mtlPath = `models/${category}/${type}/avatar.mtl`;

  // Clear existing model
  const viewerElement = document.getElementById(viewerId);
  const canvas = viewerElement.querySelector("canvas");
  if (canvas) {
    canvas.remove();
  }

  // Create new viewer with updated model
  createViewer(viewerId, objPath, mtlPath, true);
}

// Export toggleUniform to global scope
window.toggleUniform = toggleUniform;

// Main Group viewers
createViewer(
  "main-viewer-1",
  "models/main-group/lower-echelon/avatar.obj",
  "models/main-group/lower-echelon/avatar.mtl",
  true
);
createViewer(
  "main-viewer-2",
  "models/main-group/central-assembly/avatar.obj",
  "models/main-group/central-assembly/avatar.mtl",
  true
);
createViewer(
  "main-viewer-3",
  "models/main-group/empress/avatar.obj",
  "models/main-group/empress/avatar.mtl",
  true
);
createViewer(
  "main-viewer-4",
  "models/main-group/emperor/avatar.obj",
  "models/main-group/emperor/avatar.mtl",
  true
);

// Department viewers with toggle
createViewer(
  "dept-viewer-1",
  "models/departments/community-head/avatar.obj",
  "models/departments/community-head/avatar.mtl",
  true
);

createViewer(
  "dept-viewer-2",
  "models/departments/justice/avatar.obj",
  "models/departments/justice/avatar.mtl",
  true
);

createViewer(
  "dept-viewer-3",
  "models/departments/warfare/avatar.obj",
  "models/departments/warfare/avatar.mtl",
  true
);

createViewer(
  "dept-viewer-4",
  "models/departments/pyro/avatar.obj",
  "models/departments/pyro/avatar.mtl",
  true
);

createViewer(
  "dept-viewer-5",
  "models/departments/covert/avatar.obj",
  "models/departments/covert/avatar.mtl",
  true
);

// Division viewers with toggle
createViewer(
  "div-viewer-1",
  "models/divisions/wyvern/avatar.obj",
  "models/divisions/wyvern/avatar.mtl",
  true
);

createViewer(
  "div-viewer-2",
  "models/divisions/dragon/avatar.obj",
  "models/divisions/dragon/avatar.mtl",
  true
);
