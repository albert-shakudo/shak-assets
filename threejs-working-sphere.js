<script src="https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/SVGLoader.js"></script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const scene = new THREE.Scene();
    const particleBg = document.querySelector('.particle-bg');
    const width = particleBg.offsetWidth;
    const height = particleBg.offsetHeight;
    scene.fog = new THREE.FogExp2( 0x141414, 0.001 );

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    particleBg.appendChild(renderer.domElement);

    const sphereGeometry = new THREE.SphereGeometry(50, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, visible: false });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);
  
    sphere.rotation.x = Math.PI; // Rotate 180 degrees around the X axis
  
    const light = new THREE.PointLight( 0xffffff, 3, 150 );
    light.position.set( -50, 0, 100 );
    scene.add( light );

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const loader = new THREE.SVGLoader();
    const images = document.querySelectorAll('.integration-sphere .collection-int .scrolling-icons');
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    images.forEach((img, index) => {
        loader.load(img.src, function(data) {
            const paths = data.paths;
            for (let i = 0; i < paths.length; i++) {
                const path = paths[i];
                const shapes = THREE.SVGLoader.createShapes(path);
                for (let j = 0; j < shapes.length; j++) {
                    const shape = shapes[j];
                    const extrudeSettings = {
                      steps: 2,
                      depth: 5,
                      bevelSize: 1,
                      bevelSegments: 2
                    };
                    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    const material = new THREE.MeshStandardMaterial({
                        color: path.color,
                        metalness: 0.7,
                        roughness: 0.6,
                        side: THREE.DoubleSide
                    });
                    const mesh = new THREE.Mesh(geometry, material);

                    // Improved distribution
                    const phi = Math.acos(-1 + (2 * index + 1) / images.length);
                    const theta = goldenAngle * index;

                    mesh.position.x = 50 * Math.sin(phi) * Math.cos(theta);
                    mesh.position.y = 50 * Math.sin(phi) * Math.sin(theta);
                    mesh.position.z = 50 * Math.cos(phi);

                    mesh.scale.multiplyScalar(0.1);
                    mesh.lookAt(sphere.position);

                    sphere.add(mesh);
                }
            }
        });
    });

    let isDragging = false;
    let interactionStarted = false;
    let startTouchPosition = { x: 0, y: 0 };
    let previousMousePosition = { x: 0, y: 0 };
    let verticalScrollEnabled = false; // New variable to track if vertical scrolling is enabled

    function handleInteractionStart(event) {
        if (event.type === 'touchstart') {
            interactionStarted = true;
            startTouchPosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            previousMousePosition = startTouchPosition;
        } else { // For mouse events, enable dragging immediately
            isDragging = true;
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }

    function handleInteractionMove(event) {
        const currentX = event.clientX || (event.touches ? event.touches[0].clientX : 0);
        const currentY = event.clientY || (event.touches ? event.touches[0].clientY : 0);

        if (interactionStarted) {
            const dx = Math.abs(currentX - startTouchPosition.x);
            const dy = Math.abs(currentY - startTouchPosition.y);
            if (!isDragging) {
                if (dy > dx && dy > 10) { // Adjust threshold for vertical movement to enable scrolling
                    verticalScrollEnabled = true; // Enable scrolling
                    return; // Allow default behavior (scrolling)
                } else if (dx > dy && dx > 10) { // Adjust threshold for horizontal movement to start rotating
                    isDragging = true;
                    verticalScrollEnabled = false; // Disable vertical scrolling
                }
            }
        }

        if (isDragging && !verticalScrollEnabled) {
            let deltaMove = {
                x: currentX - previousMousePosition.x,
                y: currentY - previousMousePosition.y
            };

            let deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    toRadians(deltaMove.y * 1),
                    toRadians(deltaMove.x * 1),
                    0,
                    'XYZ'
                ));

            sphere.quaternion.multiplyQuaternions(deltaRotationQuaternion, sphere.quaternion);

            previousMousePosition = { x: currentX, y: currentY };

            event.preventDefault(); // Prevent scrolling when dragging for rotation
        }
    }

    function handleInteractionEnd() {
        isDragging = false;
        interactionStarted = false;
        verticalScrollEnabled = false; // Reset scrolling flag
    }
    
    particleBg.addEventListener('mousedown', handleInteractionStart);
    window.addEventListener('mousemove', handleInteractionMove);
    window.addEventListener('mouseup', handleInteractionEnd);

    // Touch event listeners
    particleBg.addEventListener('touchstart', handleInteractionStart);
    window.addEventListener('touchmove', handleInteractionMove, { passive: false });
    window.addEventListener('touchend', handleInteractionEnd);

    function toRadians(angle) {
        return angle * (Math.PI / 180);
    }

    let autoRotateSpeed = 0.002;

    function animate() {
        requestAnimationFrame(animate);

        if (!isDragging) {
            sphere.rotation.y += autoRotateSpeed;
        }

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', function() {
        camera.aspect = particleBg.offsetWidth / particleBg.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(particleBg.offsetWidth, particleBg.offsetHeight);
    });
});
</script>
