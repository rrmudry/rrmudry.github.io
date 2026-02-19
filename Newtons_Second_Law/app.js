document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const massInput = document.getElementById('mass-input');
    const addEngineBtn = document.getElementById('add-engine-btn');
    const removeEngineBtn = document.getElementById('remove-engine-btn');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const airResistanceToggle = document.getElementById('air-resistance-toggle');

    const forceDisplay = document.getElementById('force-display');
    const massDisplay = document.getElementById('mass-display');
    const accelerationDisplay = document.getElementById('acceleration-display');
    const velocityDisplay = document.getElementById('velocity-display');
    const positionDisplay = document.getElementById('position-display');

    const canvas = document.getElementById('simulation-canvas');
    const ctx = canvas.getContext('2d');

    const velocityChartCtx = document.getElementById('velocity-chart').getContext('2d');
    const distanceChartCtx = document.getElementById('distance-chart').getContext('2d');

    // --- Parallax Background --- //
    class Layer {
        constructor(image, speedModifier) {
            this.x = 0;
            this.y = 0;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = image.width;
            this.height = image.height;
        }
        update(position) {
            this.x = -(position * this.speedModifier) % this.width;
        }
        draw(ctx) {
            ctx.drawImage(this.image, this.x, this.y, this.width, canvas.height);
            ctx.drawImage(this.image, this.x + this.width, this.y, this.width, canvas.height);
        }
    }

    let layers = [];
    const layerPaths = [
        'parallax_mountain_pack/parallax_mountain_pack/layers/parallax-mountain-bg.png',
        'parallax_mountain_pack/parallax_mountain_pack/layers/parallax-mountain-montain-far.png',
        'parallax_mountain_pack/parallax_mountain_pack/layers/parallax-mountain-mountains.png',
        'parallax_mountain_pack/parallax_mountain_pack/layers/parallax-mountain-trees.png',
        'parallax_mountain_pack/parallax_mountain_pack/layers/parallax-mountain-foreground-trees.png'
    ];
    const speedModifiers = [0, 0.1, 0.2, 0.4, 0.6];

    // --- Simulation State --- //
    let mass = 10;
    let numEngines = 0;
    const forcePerEngine = 100; // Increased force for better visualization
    let netForce = 0;
    let acceleration = 0;
    let velocity = 0;
    let position = 0;
    let simulationTime = 0;
    let animationFrameId = null;
    let lastTimestamp = 0;
    const dragCoefficient = 0.1;

    // Box properties
    const boxWidth = 50;
    const boxHeight = 50;
    let boxX = 50;
    const boxY = canvas.height - boxHeight - 50; // 50px from the bottom

    // Sprite properties
    const rocketSprite = new Image();
    rocketSprite.src = 'rocket_fire.png';
    let spriteFrame = 0;
    const numSpriteFrames = 4;
    const spriteWidth = 64;
    const spriteHeight = 32;
    let frameCounter = 0;
    const frameSpeed = 5; // bigger number = slower animation

    // Chart data
    let timeData = [];
    let velocityData = [];
    let distanceData = [];

    function createChart(ctx, label, data) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: false
                }]
            },
            options: {
                animation: { duration: 0 },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time (s)'
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 20
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: label
                        }
                    }
                }
            }
        });
    }

    let velocityChart = createChart(velocityChartCtx, 'Velocity (m/s)', velocityData);
    let distanceChart = createChart(distanceChartCtx, 'Distance (m)', distanceData);

    function updateDisplays() {
        let thrust = numEngines * forcePerEngine;
        let dragForce = 0;
        if (airResistanceToggle.checked) {
            dragForce = dragCoefficient * velocity * Math.abs(velocity);
        }
        netForce = thrust - dragForce;
        mass = parseFloat(massInput.value);
        acceleration = netForce / mass;

        forceDisplay.textContent = netForce.toFixed(2);
        massDisplay.textContent = mass.toFixed(2);
        accelerationDisplay.textContent = acceleration.toFixed(2);
        velocityDisplay.textContent = velocity.toFixed(2);
        positionDisplay.textContent = position.toFixed(2);
    }

    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw parallax layers
        layers.forEach(layer => layer.draw(ctx));

        // Draw box
        ctx.fillStyle = 'blue';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw engines
        if (numEngines > 0 && rocketSprite.complete) {
            for (let i = 0; i < numEngines; i++) {
                ctx.drawImage(
                    rocketSprite,
                    0,
                    spriteFrame * spriteHeight,
                    spriteWidth,
                    spriteHeight,
                    boxX - spriteWidth,
                    boxY + (boxHeight / 2) - (spriteHeight / 2) - (numEngines * 10) + (i * 20),
                    spriteWidth,
                    spriteHeight
                );
            }
        }
    }

    function simulationLoop(timestamp) {
        if (!lastTimestamp) {
            lastTimestamp = timestamp;
        }

        const deltaTime = (timestamp - lastTimestamp) / 1000; // in seconds
        simulationTime += deltaTime;

        // Update physics
        updateDisplays();
        velocity += acceleration * deltaTime;
        position += velocity * deltaTime;

        // Update parallax layers
        layers.forEach(layer => layer.update(position));

        // Animate sprite
        frameCounter++;
        if (frameCounter >= frameSpeed) {
            frameCounter = 0;
            spriteFrame = (spriteFrame + 1) % numSpriteFrames;
        }

        // Update charts
        if (frameCounter % 10 === 0) {
            timeData.push(simulationTime.toFixed(2));
            velocityData.push(velocity.toFixed(2));
            distanceData.push(position.toFixed(2));
            velocityChart.update();
            distanceChart.update();
        }

        draw();

        lastTimestamp = timestamp;
        animationFrameId = requestAnimationFrame(simulationLoop);
    }

    // --- Event Listeners --- //
    massInput.addEventListener('input', () => {
        mass = parseFloat(massInput.value);
        updateDisplays();
    });

    addEngineBtn.addEventListener('click', () => {
        if (numEngines < 8) {
            numEngines++;
            updateDisplays();
            draw();
        }
    });

    removeEngineBtn.addEventListener('click', () => {
        if (numEngines > 0) {
            numEngines--;
            updateDisplays();
            draw();
        }
    });

    startBtn.addEventListener('click', () => {
        if (!animationFrameId) {
            lastTimestamp = 0;
            animationFrameId = requestAnimationFrame(simulationLoop);
        }
    });

    pauseBtn.addEventListener('click', () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    });

    resetBtn.addEventListener('click', () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        // Reset state
        numEngines = 0;
        velocity = 0;
        position = 0;
        simulationTime = 0;
        lastTimestamp = 0;

        // Reset charts
        timeData.length = 0;
        velocityData.length = 0;
        distanceData.length = 0;
        velocityChart.update();
        distanceChart.update();

        layers.forEach(layer => layer.update(position));
        updateDisplays();
        draw();
    });

    // --- Initial Setup --- //
    function loadImages(paths) {
        return Promise.all(paths.map(path => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = path;
        })));
    }

    addEngineBtn.disabled = true;
    startBtn.disabled = true;

    const allImagePaths = [rocketSprite.src, ...layerPaths];

    loadImages(allImagePaths).then(([loadedRocketSprite, ...loadedLayers]) => {
        layers = loadedLayers.map((img, i) => new Layer(img, speedModifiers[i]));
        
        addEngineBtn.disabled = false;
        startBtn.disabled = false;
        updateDisplays();
        draw();
    }).catch(err => {
        console.error("Failed to load images", err);
        alert("Failed to load one or more images. Please check the console for details.");
    });
});