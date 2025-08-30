// Global variables
let scene, camera, renderer, controls;
let earth, sun, asteroidObjects = [];
let isPaused = false;
let timeSpeed = 1;
let trackedAsteroid = null;

// NASA API configuration
const NASA_API_KEY = 'mKf1ClWGQWN9aLPobvr4WFyBAEh1crKFTfK6gcOO'; // Replace with your key
const NEO_URL = 'https://api.nasa.gov/neo/rest/v1/feed';

// Scale factors
const DISTANCE_SCALE = 0.00001;
const SIZE_SCALE = 5;
const EARTH_DISTANCE = 150;

// --- Core 3D Scene Setup (Unchanged) ---
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 100, 300);
    const canvas = document.getElementById('visualizer-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    const sunLight = new THREE.PointLight(0xffffff, 1.2, 2000);
    scene.add(sunLight);
    createSun();
    createEarth();
    createStarField();
    controls.target.copy(earth.position);
    camera.position.copy(earth.position).add(new THREE.Vector3(0, 50, 150));
    addEventListeners();
    animate();
}

function createSun() { /* ... function is unchanged ... */  const sunGeometry = new THREE.SphereGeometry(8, 32, 32); const sunMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffaa00, emissiveIntensity: 0.5 }); sun = new THREE.Mesh(sunGeometry, sunMaterial); scene.add(sun); const glowGeometry = new THREE.SphereGeometry(12, 32, 32); const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 }); sun.add(new THREE.Mesh(glowGeometry, glowMaterial)); }
function createEarth() {
    const earthGeometry = new THREE.SphereGeometry(4, 32, 32);

    const earthMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x20C2A8 
    });

    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(EARTH_DISTANCE, 0, 0);
    scene.add(earth);

    createOrbit(EARTH_DISTANCE, 0xFFE5B4);
}
function createOrbit(radius, color = 0xffffff) { /* ... function is unchanged ... */ const points = []; const segments = 128; for (let i = 0; i <= segments; i++) { const angle = (i / segments) * Math.PI * 2; points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)); } const geometry = new THREE.BufferGeometry().setFromPoints(points); const material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.3 }); scene.add(new THREE.Line(geometry, material)); }
function createStarField() { /* ... function is unchanged ... */ const starsGeometry = new THREE.BufferGeometry(); const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 }); const starsVertices = []; for (let i = 0; i < 1000; i++) { starsVertices.push((Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000); } starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3)); scene.add(new THREE.Points(starsGeometry, starsMaterial)); }
// NEW HELPER FUNCTION: To create an orbit around a specific object (like Earth)
// MODIFIED: Added a 'verticalOffset' parameter
function createOrbitAroundObject(targetObject, radius, color = 0xffffff, verticalOffset = 0) {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            verticalOffset, // Use the passed-in vertical offset for the Y-axis
            Math.sin(angle) * radius
        ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.15 
    });
    const orbit = new THREE.Line(geometry, material);
    
    // The orbit is correctly attached to the target object (Earth)
    targetObject.add(orbit); 
    
    return orbit;
}


// MODIFIED createAsteroid function
function createAsteroid(asteroidData) {
    const size = parseFloat(asteroidData.estimated_diameter.kilometers.estimated_diameter_max);
    const orbitRadius = parseFloat(asteroidData.close_approach_data[0].miss_distance.kilometers) * DISTANCE_SCALE;
    const velocity = parseFloat(asteroidData.close_approach_data[0].relative_velocity.kilometers_per_second);

    let color = size < 0.1 ? 0x00ff00 : (size < 0.5 ? 0x0088ff : 0xff0000);
    const asteroidRadius3D = Math.max(size * SIZE_SCALE, 0.2);
    
    const asteroidGeometry = new THREE.SphereGeometry(asteroidRadius3D, 16, 16);
    const asteroidMaterial = new THREE.MeshPhongMaterial({ color: color, shininess: 30 });
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    
    const angle = Math.random() * Math.PI * 2;
    
    // MODIFIED: Store the random vertical offset in a variable
    const verticalOffset = (Math.random() - 0.5) * 20;

    // Use the variable to set the asteroid's initial Y position
    asteroid.position.set(
        earth.position.x + Math.cos(angle) * orbitRadius,
        verticalOffset, 
        earth.position.z + Math.sin(angle) * orbitRadius
    );

    asteroid.userData = {
        ...asteroidData,
        orbitRadius: orbitRadius,
        angle: angle,
        angularVelocity: 0.005, 
        size: size,
        velocity: velocity,
        verticalOffset: verticalOffset // Store it for potential future use
    };

    scene.add(asteroid);
    asteroidObjects.push(asteroid);

    if (size > 0.05) { 
        // MODIFIED: Pass the 'verticalOffset' to the orbit creation function
        asteroid.userData.orbitLine = createOrbitAroundObject(earth, orbitRadius, color, verticalOffset); 
    }

    return asteroid;
}

// --- Data & Animation ---
async function fetchAsteroidData(startDate, endDate) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const statusElement = document.getElementById('status-display');
    loadingOverlay.classList.add('visible');
    statusElement.textContent = 'Fetching data...';
    try {
        const url = `${NEO_URL}?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        const allAsteroids = Object.values(data.near_earth_objects).flat();
        statusElement.textContent = `${allAsteroids.length} asteroids found`;
        return allAsteroids;
    } catch (error) {
        console.error('Fetch Error:', error);
        statusElement.textContent = `Error. Using demo data.`;
        return generateDemoData();
    } finally {
        loadingOverlay.classList.remove('visible');
    }
}
function generateDemoData() { const demoAsteroids = []; for (let i = 0; i < 20; i++) { demoAsteroids.push({ id: `demo_${i}`, name: `Demo Asteroid ${i + 1}`, estimated_diameter: { kilometers: { estimated_diameter_max: Math.random() * 2 } }, close_approach_data: [{ miss_distance: { kilometers: (20000000 + Math.random() * 50000000).toString() }, relative_velocity: { kilometers_per_second: (10 + Math.random() * 20).toString() }, close_approach_date: '2025-08-30' }], is_potentially_hazardous_asteroid: Math.random() > 0.8 }); } return demoAsteroids; }
function visualizeAsteroids(asteroids) {
    clearAsteroids();
    const statusElement = document.getElementById('status-display');
    statusElement.textContent = `Visualizing ${asteroids.length} asteroids`;
    asteroids.forEach(createAsteroid);
    populateSearchResults(asteroidObjects);
}
function clearAsteroids() {
    asteroidObjects.forEach(a => { scene.remove(a); a.geometry.dispose(); a.material.dispose(); });
    asteroidObjects = [];
    trackedAsteroid = null;
    document.getElementById('search-results').innerHTML = '';
}
function animate() {
    requestAnimationFrame(animate);
    if (!isPaused) {
        // Earth continues to orbit the Sun
        const timeDelta = 0.0001 * timeSpeed;
        earth.position.x = Math.cos(Date.now() * timeDelta) * EARTH_DISTANCE;
        earth.position.z = Math.sin(Date.now() * timeDelta) * EARTH_DISTANCE;
        
        // Animate asteroids
        asteroidObjects.forEach(a => {
            a.userData.angle += a.userData.angularVelocity * timeSpeed;

            // CHANGE: Calculate the asteroid's position as an offset from the Earth's current position.
            // This makes the asteroid orbit the Earth.
            const offsetX = Math.cos(a.userData.angle) * a.userData.orbitRadius;
            const offsetZ = Math.sin(a.userData.angle) * a.userData.orbitRadius;
            
            a.position.x = earth.position.x + offsetX;
            a.position.z = earth.position.z + offsetZ;
            // You can add vertical oscillation if you like:
            // a.position.y = Math.sin(a.userData.angle * 2) * 5; 
        });

        // Camera targeting logic remains the same
        if (trackedAsteroid) {
            const offset = new THREE.Vector3(20, 10, 20);
            camera.position.copy(trackedAsteroid.position).add(offset);
            controls.target.copy(trackedAsteroid.position);
        } else {
            controls.target.copy(earth.position);
        }
    }
    controls.update();
    renderer.render(scene, camera);
}

// --- UI Interaction & DOM ---
function onMouseClick(event) {
    const mouse = new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(asteroidObjects);
    if (intersects.length > 0) {
        selectAsteroid(intersects[0].object);
    }
}
function selectAsteroid(asteroid) {
    showAsteroidInfo(asteroid);
    trackedAsteroid = asteroid;

    document.querySelectorAll('.search-result-item.selected').forEach(el => el.classList.remove('selected'));
    const newItem = document.querySelector(`.search-result-item[data-asteroid-id="${asteroid.userData.id}"]`);
    if (newItem) {
        newItem.classList.add('selected');
        newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    // Close drawer after selection for a cleaner experience
    document.getElementById('search-drawer').classList.remove('open');
}
function showAsteroidInfo(asteroid) {
    const infoPanel = document.getElementById('info-panel');
    const data = asteroid.userData;
    document.getElementById('asteroid-name').textContent = data.name;
    document.getElementById('asteroid-size').textContent = `${(data.size * 1000).toFixed(2)} m`;
    document.getElementById('asteroid-distance').textContent = `${parseFloat(data.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km`;
    document.getElementById('asteroid-velocity').textContent = `${parseFloat(data.close_approach_data[0].relative_velocity.kilometers_per_second).toFixed(2)} km/s`;
    document.getElementById('asteroid-approach').textContent = data.close_approach_data[0].close_approach_date;
    infoPanel.classList.add('visible');
}
function populateSearchResults(asteroids) {
    const container = document.getElementById('search-results');
    container.innerHTML = '';
    asteroids.forEach(asteroid => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.asteroidId = asteroid.userData.id;
        item.innerHTML = `<span class="asteroid-name">${asteroid.userData.name}</span><span class="asteroid-details">Size: ~${(asteroid.userData.size * 1000).toFixed(0)}m</span>`;
        item.addEventListener('click', () => selectAsteroid(asteroid));
        container.appendChild(item);
    });
}
function searchAsteroids(searchTerm) {
    const filtered = asteroidObjects.filter(a => a.userData.name.toLowerCase().includes(searchTerm.toLowerCase()));
    populateSearchResults(filtered);
}
function addEventListeners() {
    document.getElementById('fetch-asteroids').addEventListener('click', async () => {
        const asteroids = await fetchAsteroidData(
            document.getElementById('start-date').value,
            document.getElementById('end-date').value
        );
        visualizeAsteroids(asteroids);
    });
    document.getElementById('pause-resume').addEventListener('click', e => { isPaused = !isPaused; e.target.textContent = isPaused ? 'Resume' : 'Pause'; });
    document.getElementById('speed-up').addEventListener('click', () => timeSpeed *= 1.5);
    document.getElementById('slow-down').addEventListener('click', () => timeSpeed /= 1.5);
    document.getElementById('reset-view').addEventListener('click', () => { trackedAsteroid = null; ccamera.position.copy(earth.position).add(new THREE.Vector3(0, 50, 150)); });
    document.getElementById('close-info').addEventListener('click', () => document.getElementById('info-panel').classList.remove('visible'));
    document.getElementById('search-input').addEventListener('input', e => searchAsteroids(e.target.value));
    
    // Drawer listeners
    const searchDrawer = document.getElementById('search-drawer');
    document.getElementById('search-toggle-btn').addEventListener('click', () => searchDrawer.classList.add('open'));
    document.getElementById('drawer-close-btn').addEventListener('click', () => searchDrawer.classList.remove('open'));
    document.addEventListener('keydown', (e) => { if (e.key === "Escape") searchDrawer.classList.remove('open'); });

    renderer.domElement.addEventListener('click', onMouseClick);
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
}
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    document.getElementById('start-date').value = today.toISOString().split('T')[0];
    today.setDate(today.getDate() + 7);
    document.getElementById('end-date').value = today.toISOString().split('T')[0];
    initScene();
});