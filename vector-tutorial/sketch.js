// Global variables for UI elements
let v1xInput, v1yInput, v2xInput, v2yInput;
let addBtn;
let resultDisplay;

// p5.js vectors
let vec1, vec2, resultVec;

// State variables
let draggedVector = null; // 'A', 'B', or null
let isPanning = false;
let showResult = false;
const grabRadius = 15;

// Panning and view variables
let viewOffset;

function setup() {
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    canvas.parent('canvas-container');

    viewOffset = createVector(0, 0);

    // Get UI elements
    v1xInput = document.getElementById('v1x');
    v1yInput = document.getElementById('v1y');
    v2xInput = document.getElementById('v2x');
    v2yInput = document.getElementById('v2y');
    addBtn = document.getElementById('add-btn');
    resultDisplay = document.getElementById('result-display');

    // Initialize vectors from input fields
    vec1 = createVector(Number(v1xInput.value), Number(v1yInput.value));
    vec2 = createVector(Number(v2xInput.value), Number(v2yInput.value));

    // Event Listeners
    addBtn.addEventListener('click', () => {
        showResult = true;
    });

    [v1xInput, v1yInput, v2xInput, v2yInput].forEach(input => {
        input.addEventListener('input', updateVectorsFromInputs);
    });
}

function draw() {
    // Update vectors from input fields
    vec1.set(Number(v1xInput.value), Number(v1yInput.value));
    vec2.set(Number(v2xInput.value), Number(v2yInput.value));
    resultVec = p5.Vector.add(vec1, vec2);

    // Drawing
    background(255);

    // Apply the view offset
    push();
    translate(width / 2 + viewOffset.x, height / 2 + viewOffset.y);

    drawGrid();
    drawAxes();

    if (showResult) {
        // Draw vectors
        drawVector(vec1, color(0, 102, 255, 50)); // Faded A
        drawVector(vec2, color(220, 53, 69, 50)); // Faded B
        drawVector(vec1, color(0, 102, 255));     // Solid A
        
        // Draw translated B for head-to-tail
        push();
        translate(vec1.x, -vec1.y);
        drawVectorFromOrigin(vec2, color(220, 53, 69));
        pop();

        // Draw resultant
        drawVector(resultVec, color(111, 66, 193));
        
        // Update result display text
        resultDisplay.innerHTML = `
            <p class="mb-1"><b>A + B = R</b></p>
            <p class="mb-0">(${vec1.x.toFixed(0)}, ${vec1.y.toFixed(0)}) + (${vec2.x.toFixed(0)}, ${vec2.y.toFixed(0)}) = (${resultVec.x.toFixed(0)}, ${resultVec.y.toFixed(0)})</p>
        `;
    } else {
        // Draw just the two main vectors
        drawVector(vec1, color(0, 102, 255));
        drawVector(vec2, color(220, 53, 69));
    }
    
    pop(); // Restore from view offset translation

    updateCursor();
}

function mousePressed() {
    let worldMouse = screenToWorld(mouseX, mouseY);
    if (dist(worldMouse.x, worldMouse.y, vec1.x, vec1.y) < grabRadius) {
        draggedVector = 'A';
    } else if (dist(worldMouse.x, worldMouse.y, vec2.x, vec2.y) < grabRadius) {
        draggedVector = 'B';
    } else {
        isPanning = true;
    }
}

function mouseDragged() {
    if (draggedVector) {
        let worldMouse = screenToWorld(mouseX, mouseY);
        if (draggedVector === 'A') {
            v1xInput.value = worldMouse.x.toFixed(0);
            v1yInput.value = worldMouse.y.toFixed(0);
        } else if (draggedVector === 'B') {
            v2xInput.value = worldMouse.x.toFixed(0);
            v2yInput.value = worldMouse.y.toFixed(0);
        }
    } else if (isPanning) {
        viewOffset.x += mouseX - pmouseX;
        viewOffset.y += mouseY - pmouseY;
    }
}

function mouseReleased() {
    isPanning = false;
    draggedVector = null;
}

// --- Coordinate & UI Helpers ---

function screenToWorld(mx, my) {
    let originX = width / 2 + viewOffset.x;
    let originY = height / 2 + viewOffset.y;
    return createVector(mx - originX, -(my - originY));
}

function updateVectorsFromInputs() {
    vec1.set(Number(v1xInput.value), Number(v1yInput.value));
    vec2.set(Number(v2xInput.value), Number(v2yInput.value));
    if (!showResult) {
        resultDisplay.innerHTML = '<p class="mb-0">Click "Add" to see the result.</p>';
    }
}

function updateCursor() {
    let worldMouse = screenToWorld(mouseX, mouseY);
    if (draggedVector || isPanning) {
        cursor('grabbing');
    } else if (dist(worldMouse.x, worldMouse.y, vec1.x, vec1.y) < grabRadius ||
               dist(worldMouse.x, worldMouse.y, vec2.x, vec2.y) < grabRadius) {
        cursor('grab');
    } else {
        cursor(ARROW);
    }
}

// --- Drawing Helpers ---

function drawMagnitudeText(vec, textColor = 0) {
    const mag = vec.mag();
    if (mag < 30) return; // Don't draw if vector is too small

    const midPoint = createVector(vec.x / 2, -vec.y / 2);
    const angle = atan2(-vec.y, vec.x);

    push();
    // Move the origin to the vector's midpoint
    translate(midPoint.x, midPoint.y);
    // Rotate the coordinate system to match the vector's angle
    rotate(angle);

    fill(textColor);
    noStroke();
    textSize(14);

    // Check if the vector is pointing left, which would make the text upside-down
    if (vec.x < 0) {
        rotate(PI); // Flip the text 180 degrees
        textAlign(CENTER, TOP);
        text(mag.toFixed(1), 0, 5); // Place it on the other side of the line
    } else {
        textAlign(CENTER, BOTTOM);
        text(mag.toFixed(1), 0, -5); // Place it "above" the line
    }
    
    pop();
}

function drawVector(vec, col) {
    push();
    stroke(col);
    strokeWeight(3);
    fill(col);
    line(0, 0, vec.x, -vec.y);
    
    push();
    translate(vec.x, -vec.y);
    let angle = atan2(-vec.y, vec.x);
    rotate(angle - HALF_PI);
    triangle(-6, 0, 6, 0, 0, 10);
    pop();
    
    pop();

    // Draw the magnitude label
    drawMagnitudeText(vec, col);
}

function drawVectorFromOrigin(vec, col) {
    push();
    stroke(col);
    strokeWeight(3);
    fill(col);
    line(0, 0, vec.x, -vec.y);

    push();
    translate(vec.x, -vec.y);
    let angle = atan2(-vec.y, vec.x);
    rotate(angle - HALF_PI);
    triangle(-6, 0, 6, 0, 0, 10);
    pop();

    pop();
    
    // Draw the magnitude label for the translated vector
    drawMagnitudeText(vec, col);
}

function drawGrid() {
    let worldTopLeft = screenToWorld(0, 0);
    let worldBottomRight = screenToWorld(width, height);

    stroke(230);
    strokeWeight(1);

    for (let x = floor(worldTopLeft.x / 20) * 20; x < worldBottomRight.x; x += 20) {
        line(x, worldTopLeft.y, x, worldBottomRight.y);
    }
    for (let y = floor(worldBottomRight.y / 20) * 20; y < worldTopLeft.y; y += 20) {
        line(worldTopLeft.x, y, worldBottomRight.x, y);
    }
}

function drawAxes() {
    let worldTopLeft = screenToWorld(0, 0);
    let worldBottomRight = screenToWorld(width, height);

    stroke(0);
    strokeWeight(2);
    line(worldTopLeft.x, 0, worldBottomRight.x, 0);
    line(0, worldTopLeft.y, 0, worldBottomRight.y);
}

function windowResized() {
    const canvasContainer = document.getElementById('canvas-container');
    resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
}
