// Global variables
let scene, camera, renderer, controls;
let earth, sun, asteroidObjects = [];
let animationId;
let isPaused = false;
let timeSpeed = 1;
let trackedAsteroid = null;

// NASA API configuration
const NASA_API_KEY = 'mKf1ClWGQWN9aLPobvr4WFyBAEh1crKFTfK6gcOO'; // Your NASA API key
const NEO_URL = 'https://api.nasa.gov/neo/rest/v1/feed';

// Scale factors for visualization
const DISTANCE_SCALE = 0.00001; // Scale down distances
const SIZE_SCALE = 5; // Scale up asteroid sizes for visibility (reduced from 100)
const EARTH_DISTANCE = 150; // Earth distance from sun in scaled units

// Initialize the 3D scene
function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 100, 300);

    // Create renderer
    const canvas = document.getElementById('visualizer-canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 1000;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 1, 1000);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    // Create celestial objects
    createSun();
    createEarth();
    createStarField();

    // Add event listeners
    addEventListeners();

    // Start animation loop
    animate();
}

// Create the Sun
function createSun() {
    const sunGeometry = new THREE.SphereGeometry(8, 32, 32); // Slightly larger for visibility
    const sunMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5,
        roughness: 1.0,
        metalness: 0.0
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0);
    scene.add(sun);

    // Add sun glow effect
    const glowGeometry = new THREE.SphereGeometry(12, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.3
    });
    const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(sunGlow);
}

// Create Earth
function createEarth() {
    const earthGeometry = new THREE.SphereGeometry(2, 32, 32); // Slightly smaller relative to sun
    const earthMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4444ff,
        shininess: 100
    });
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(EARTH_DISTANCE, 0, 0);
    earth.castShadow = true;
    earth.receiveShadow = true;
    scene.add(earth);

    // Create Earth's orbit
    createOrbit(EARTH_DISTANCE, 0x4444ff);
}

// Create orbital path
function createOrbit(radius, color = 0xffffff) {
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        ));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const orbit = new THREE.Line(geometry, material);
    scene.add(orbit);
    return orbit;
}

// Create star field background
function createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });

    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Create asteroid object
function createAsteroid(asteroidData) {
    const size = parseFloat(asteroidData.estimated_diameter.kilometers.estimated_diameter_max);
    const distance = parseFloat(asteroidData.close_approach_data[0].miss_distance.kilometers) * DISTANCE_SCALE;
    const velocity = parseFloat(asteroidData.close_approach_data[0].relative_velocity.kilometers_per_second);

    // Determine asteroid color based on size
    let color;
    if (size < 0.1) {
        color = 0x00ff00; // Green for small asteroids
    } else if (size < 0.5) {
        color = 0x0088ff; // Blue for medium asteroids
    } else {
        color = 0xff0000; // Red for large asteroids
    }

    // Create asteroid geometry and material with more realistic scaling
    // Use logarithmic scaling to handle the vast size differences
    const asteroidRadius = Math.max(size * SIZE_SCALE, 0.2); // Minimum visibility of 0.2 units
    
    // For very small asteroids, use a slightly larger minimum to ensure visibility
    const finalRadius = size < 0.01 ? Math.max(asteroidRadius, 0.5) : asteroidRadius;
    
    const asteroidGeometry = new THREE.SphereGeometry(finalRadius, 16, 16);
    const asteroidMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30
    });

    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    
    // Position asteroid
    const angle = Math.random() * Math.PI * 2;
    const orbitRadius = Math.max(distance, EARTH_DISTANCE + 20); // Ensure it's outside Earth's orbit
    asteroid.position.set(
        Math.cos(angle) * orbitRadius,
        (Math.random() - 0.5) * 20, // Add some vertical variation
        Math.sin(angle) * orbitRadius
    );

    // Store asteroid data
    asteroid.userData = {
        ...asteroidData,
        orbitRadius: orbitRadius,
        angle: angle,
        angularVelocity: 0.001 / Math.sqrt(orbitRadius), // Kepler's laws approximation
        size: size,
        velocity: velocity
    };

    asteroid.castShadow = true;
    asteroid.receiveShadow = true;

    // Create orbit only for larger asteroids to reduce visual clutter
    if (size > 0.05) {
        createOrbit(orbitRadius, color);
    }

    scene.add(asteroid);
    asteroidObjects.push(asteroid);

    return asteroid;
}

// Fetch asteroid data from NASA API
async function fetchAsteroidData(startDate, endDate) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const statusElement = document.getElementById('status');
    
    loadingOverlay.style.display = 'flex';
    statusElement.textContent = 'Fetching data from NASA API...';

    try {
        const url = `${NEO_URL}?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`;
        console.log('Fetching from URL:', url); // Debug log
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        console.log('Response status:', response.status); // Debug log
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('API key invalid or rate limit exceeded');
            } else if (response.status === 400) {
                throw new Error('Invalid date range. Please check your dates.');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        const nearEarthObjects = data.near_earth_objects;
        
        // Flatten the asteroid data
        let allAsteroids = [];
        for (const date in nearEarthObjects) {
            allAsteroids = allAsteroids.concat(nearEarthObjects[date]);
        }
        
        console.log(`Found ${allAsteroids.length} asteroids`); // Debug log
        statusElement.textContent = `Found ${allAsteroids.length} asteroids`;
        return allAsteroids;
        
    } catch (error) {
        console.error('Error fetching asteroid data:', error);
        
        // More specific error handling
        if (error.message.includes('CORS')) {
            statusElement.textContent = 'CORS error - try running from a local server. Using demo data.';
        } else if (error.message.includes('API key')) {
            statusElement.textContent = 'API key issue. Using demo data.';
        } else if (error.message.includes('rate limit')) {
            statusElement.textContent = 'Rate limit exceeded. Using demo data.';
        } else {
            statusElement.textContent = `Error: ${error.message}. Using demo data.`;
        }
        
        return generateDemoData();
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// Generate demo data for testing
function generateDemoData() {
    const demoAsteroids = [];
    for (let i = 0; i < 20; i++) {
        demoAsteroids.push({
            name: `Demo Asteroid ${i + 1}`,
            estimated_diameter: {
                kilometers: {
                    estimated_diameter_max: Math.random() * 2
                }
            },
            close_approach_data: [{
                miss_distance: {
                    kilometers: (200 + Math.random() * 500).toString()
                },
                relative_velocity: {
                    kilometers_per_second: (10 + Math.random() * 20).toString()
                },
                close_approach_date: '2024-01-01'
            }],
            is_potentially_hazardous_asteroid: Math.random() > 0.8
        });
    }
    return demoAsteroids;
}

// Filter asteroids by size
function filterAsteroids(asteroids, minSize, maxSize) {
    if (!minSize && !maxSize) return asteroids;
    
    return asteroids.filter(asteroid => {
        const size = parseFloat(asteroid.estimated_diameter.kilometers.estimated_diameter_max) * 1000; // Convert to meters
        return (!minSize || size >= minSize) && (!maxSize || size <= maxSize);
    });
}

// Visualize asteroids
function visualizeAsteroids(asteroids) {
    // Clear existing asteroids
    clearAsteroids();
    
    const statusElement = document.getElementById('status');
    statusElement.textContent = `Visualizing ${asteroids.length} asteroids...`;
    
    // Create asteroid objects
    asteroids.forEach(asteroidData => {
        createAsteroid(asteroidData);
    });
    
    // Update search results
    updateSearchResults();
    
    statusElement.textContent = `${asteroids.length} asteroids loaded`;
}

// Clear existing asteroids
function clearAsteroids() {
    asteroidObjects.forEach(asteroid => {
        scene.remove(asteroid);
        if (asteroid.geometry) asteroid.geometry.dispose();
        if (asteroid.material) asteroid.material.dispose();
    });
    asteroidObjects = [];
    trackedAsteroid = null;
}

// Animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (!isPaused) {
        // Rotate Earth around Sun
        const earthAngle = Date.now() * 0.0001 * timeSpeed;
        earth.position.x = Math.cos(earthAngle) * EARTH_DISTANCE;
        earth.position.z = Math.sin(earthAngle) * EARTH_DISTANCE;
        earth.rotation.y += 0.01 * timeSpeed;
        
        // Animate asteroids
        asteroidObjects.forEach(asteroid => {
            asteroid.userData.angle += asteroid.userData.angularVelocity * timeSpeed;
            asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.userData.orbitRadius;
            asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.userData.orbitRadius;
            asteroid.rotation.y += 0.02 * timeSpeed;
        });
        
        // Update tracked asteroid camera
        if (trackedAsteroid) {
            const offset = new THREE.Vector3(20, 10, 20);
            camera.position.copy(trackedAsteroid.position).add(offset);
            camera.lookAt(trackedAsteroid.position);
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle mouse clicks for asteroid selection
function onMouseClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(asteroidObjects);
    
    if (intersects.length > 0) {
        const selectedAsteroid = intersects[0].object;
        showAsteroidInfo(selectedAsteroid);
        trackAsteroid(selectedAsteroid);
    }
}

// Show asteroid information
function showAsteroidInfo(asteroid) {
    const infoPanel = document.getElementById('info-panel');
    const data = asteroid.userData;
    
    document.getElementById('asteroid-name').textContent = data.name;
    document.getElementById('asteroid-size').textContent = `${(data.size * 1000).toFixed(2)} meters`;
    document.getElementById('asteroid-distance').textContent = `${(data.orbitRadius / DISTANCE_SCALE).toFixed(0)} km`;
    document.getElementById('asteroid-velocity').textContent = `${data.velocity.toFixed(2)} km/s`;
    document.getElementById('asteroid-approach').textContent = data.close_approach_data[0].close_approach_date;
    
    infoPanel.style.display = 'block';
    infoPanel.classList.add('fade-in');
}

// Track asteroid with camera
function trackAsteroid(asteroid) {
    trackedAsteroid = asteroid;
    controls.target.copy(asteroid.position);
}

// Update search results
function updateSearchResults() {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    
    asteroidObjects.slice(0, 10).forEach(asteroid => { // Show first 10 results
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = asteroid.userData.name;
        item.onclick = () => {
            showAsteroidInfo(asteroid);
            trackAsteroid(asteroid);
        };
        searchResults.appendChild(item);
    });
}

// Search functionality
function searchAsteroids(searchTerm) {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    
    if (!searchTerm) {
        updateSearchResults();
        return;
    }
    
    const filteredAsteroids = asteroidObjects.filter(asteroid =>
        asteroid.userData.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    filteredAsteroids.slice(0, 10).forEach(asteroid => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.textContent = asteroid.userData.name;
        item.onclick = () => {
            showAsteroidInfo(asteroid);
            trackAsteroid(asteroid);
        };
        searchResults.appendChild(item);
    });
}

// Add event listeners
function addEventListeners() {
    // Fetch asteroids button
    document.getElementById('fetch-asteroids').addEventListener('click', async () => {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }
        
        const asteroids = await fetchAsteroidData(startDate, endDate);
        
        // Apply size filter if enabled
        let filteredAsteroids = asteroids;
        if (document.getElementById('enable-filter').checked) {
            const minSize = parseFloat(document.getElementById('min-size').value) || 0;
            const maxSize = parseFloat(document.getElementById('max-size').value) || Infinity;
            filteredAsteroids = filterAsteroids(asteroids, minSize, maxSize);
        }
        
        visualizeAsteroids(filteredAsteroids);
    });
    
    // Filter toggle
    document.getElementById('enable-filter').addEventListener('change', (e) => {
        document.getElementById('size-filter').style.display = e.target.checked ? 'block' : 'none';
    });
    
    // Animation controls
    document.getElementById('pause-resume').addEventListener('click', () => {
        isPaused = !isPaused;
        document.getElementById('pause-resume').textContent = isPaused ? 'Resume' : 'Pause';
    });
    
    document.getElementById('speed-up').addEventListener('click', () => {
        timeSpeed *= 1.5;
    });
    
    document.getElementById('slow-down').addEventListener('click', () => {
        timeSpeed /= 1.5;
    });
    
    document.getElementById('reset-view').addEventListener('click', () => {
        trackedAsteroid = null;
        camera.position.set(0, 100, 300);
        controls.target.set(0, 0, 0);
        controls.reset();
    });
    
    // Info panel close button
    document.getElementById('close-info').addEventListener('click', () => {
        document.getElementById('info-panel').style.display = 'none';
    });
    
    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchAsteroids(e.target.value);
    });
    
    // Mouse click for asteroid selection
    renderer.domElement.addEventListener('click', onMouseClick);
    
    // Window resize handler
    window.addEventListener('resize', onWindowResize);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initScene();
    
    // Set default dates
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    document.getElementById('start-date').value = today.toISOString().split('T')[0];
    document.getElementById('end-date').value = nextWeek.toISOString().split('T')[0];
});
