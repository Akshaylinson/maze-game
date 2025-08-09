
// Enhanced Particle Maze Game
Math.minmax = (value, limit) => Math.max(Math.min(value, limit), -limit);

const distance2D = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
const getAngle = (p1, p2) => {
    let angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x));
    if (p2.x - p1.x < 0) angle += Math.PI;
    return angle;
};

const closestItCanBe = (cap, ball) => {
    let angle = getAngle(cap, ball);
    const deltaX = Math.cos(angle) * (wallW / 2 + ballSize / 2);
    const deltaY = Math.sin(angle) * (wallW / 2 + ballSize / 2);
    return { x: cap.x + deltaX, y: cap.y + deltaY };
};

const rollAroundCap = (cap, ball) => {
    let impactAngle = getAngle(ball, cap);
    let heading = getAngle({ x: 0, y: 0 }, { x: ball.velocityX, y: ball.velocityY });
    let impactHeadingAngle = impactAngle - heading;
    const velocityMagnitude = distance2D({ x: 0, y: 0 }, { x: ball.velocityX, y: ball.velocityY });
    const velocityMagnitudeDiagonalToTheImpact = Math.sin(impactHeadingAngle) * velocityMagnitude;
    const closestDistance = wallW / 2 + ballSize / 2;
    const rotationAngle = Math.atan(velocityMagnitudeDiagonalToTheImpact / closestDistance);
    
    const deltaFromCap = {
        x: Math.cos(impactAngle + Math.PI - rotationAngle) * closestDistance,
        y: Math.sin(impactAngle + Math.PI - rotationAngle) * closestDistance
    };
    
    return {
        x: ball.x,
        y: ball.y,
        velocityX: ball.x - (cap.x + deltaFromCap.x),
        velocityY: ball.y - (cap.y + deltaFromCap.y),
        nextX: ball.x + (ball.x - (cap.x + deltaFromCap.x)),
        nextY: ball.y + (ball.y - (cap.y + deltaFromCap.y))
    };
};

const slow = (number, difference) => {
    if (Math.abs(number) <= difference) return 0;
    return number > difference ? number - difference : number + difference;
};

// DOM Elements
const mazeElement = document.getElementById("maze");
const joystickHeadElement = document.getElementById("joystick-head");
const noteElement = document.getElementById("note");
const particleCountElement = document.getElementById("particle-count");
const gameModeElement = document.getElementById("game-mode");

// Game Constants
const pathW = 25;
const wallW = 10;
const ballSize = 10;
const holeSize = 18;
const particleColors = ['particle-1', 'particle-2', 'particle-3', 'particle-4'];
const particleNames = ['Alpha', 'Beta', 'Gamma', 'Delta'];

// Game State
let hardMode = false;
let previousTimestamp;
let gameInProgress = false;
let mouseStartX, mouseStartY;
let accelerationX, accelerationY, frictionX, frictionY;

let balls = [];
let ballElements = [];
let holeElements = [];

// Initialize Game
resetGame();

// Create Walls
const walls = [
    // Border
    { column: 0, row: 0, horizontal: true, length: 10 },
    { column: 0, row: 0, horizontal: false, length: 9 },
    { column: 0, row: 9, horizontal: true, length: 10 },
    { column: 10, row: 0, horizontal: false, length: 9 },
    // Horizontal walls
    { column: 0, row: 6, horizontal: true, length: 1 },
    { column: 0, row: 8, horizontal: true, length: 1 },
    { column: 1, row: 1, horizontal: true, length: 2 },
    { column: 1, row: 7, horizontal: true, length: 1 },
    { column: 2, row: 2, horizontal: true, length: 2 },
    { column: 2, row: 4, horizontal: true, length: 1 },
    { column: 2, row: 5, horizontal: true, length: 1 },
    { column: 2, row: 6, horizontal: true, length: 1 },
    { column: 3, row: 3, horizontal: true, length: 1 },
    { column: 3, row: 8, horizontal: true, length: 3 },
    { column: 4, row: 6, horizontal: true, length: 1 },
    { column: 5, row: 2, horizontal: true, length: 2 },
    { column: 5, row: 7, horizontal: true, length: 1 },
    { column: 6, row: 1, horizontal: true, length: 1 },
    { column: 6, row: 6, horizontal: true, length: 2 },
    { column: 7, row: 3, horizontal: true, length: 2 },
    { column: 7, row: 7, horizontal: true, length: 2 },
    { column: 8, row: 1, horizontal: true, length: 1 },
    { column: 8, row: 2, horizontal: true, length: 1 },
    { column: 8, row: 3, horizontal: true, length: 1 },
    { column: 8, row: 4, horizontal: true, length: 2 },
    { column: 8, row: 8, horizontal: true, length: 2 },
    // Vertical walls
    { column: 1, row: 1, horizontal: false, length: 2 },
    { column: 1, row: 4, horizontal: false, length: 2 },
    { column: 2, row: 2, horizontal: false, length: 2 },
    { column: 2, row: 5, horizontal: false, length: 1 },
    { column: 2, row: 7, horizontal: false, length: 2 },
    { column: 3, row: 0, horizontal: false, length: 1 },
    { column: 3, row: 4, horizontal: false, length: 1 },
    { column: 3, row: 6, horizontal: false, length: 2 },
    { column: 4, row: 1, horizontal: false, length: 2 },
    { column: 4, row: 6, horizontal: false, length: 1 },
    { column: 5, row: 0, horizontal: false, length: 2 },
    { column: 5, row: 6, horizontal: false, length: 1 },
    { column: 5, row: 8, horizontal: false, length: 1 },
    { column: 6, row: 4, horizontal: false, length: 1 },
    { column: 6, row: 6, horizontal: false, length: 1 },
    { column: 7, row: 1, horizontal: false, length: 4 },
    { column: 7, row: 7, horizontal: false, length: 2 },
    { column: 8, row: 2, horizontal: false, length: 1 },
    { column: 8, row: 4, horizontal: false, length: 2 },
    { column: 9, row: 1, horizontal: false, length: 1 },
    { column: 9, row: 5, horizontal: false, length: 2 }
].map(wall => ({
    x: wall.column * (pathW + wallW),
    y: wall.row * (pathW + wallW),
    horizontal: wall.horizontal,
    length: wall.length * (pathW + wallW)
}));

// Draw Walls
walls.forEach(({ x, y, horizontal, length }) => {
    const wall = document.createElement("div");
    wall.className = "wall absolute";
    wall.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${wallW}px;
        height: ${length}px;
        transform: rotate(${horizontal ? -90 : 0}deg);
    `;
    
    // Add rounded ends
    const startCap = document.createElement("div");
    startCap.className = "absolute -top-1 -left-1 w-3 h-3 rounded-full wall";
    const endCap = document.createElement("div");
    endCap.className = "absolute -bottom-1 -left-1 w-3 h-3 rounded-full wall";
    
    wall.append(startCap, endCap);
    mazeElement.appendChild(wall);
});

// Black Holes
const holes = [
    { column: 0, row: 5 },
    { column: 2, row: 0 },
    { column: 2, row: 4 },
    { column: 4, row: 6 },
    { column: 6, row: 2 },
    { column: 6, row: 8 },
    { column: 8, row: 1 },
    { column: 8, row: 2 }
].map(hole => ({
    x: hole.column * (wallW + pathW) + (wallW / 2 + pathW / 2),
    y: hole.row * (wallW + pathW) + (wallW / 2 + pathW / 2)
}));

// Event Listeners
joystickHeadElement.addEventListener("mousedown", (e) => {
    if (!gameInProgress) {
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
        gameInProgress = true;
        window.requestAnimationFrame(main);
        noteElement.style.opacity = 0;
        joystickHeadElement.classList.add("cursor-grabbing");
    }
});

window.addEventListener("mousemove", (e) => {
    if (gameInProgress) {
        const mouseDeltaX = -Math.minmax(mouseStartX - e.clientX, 15);
        const mouseDeltaY = -Math.minmax(mouseStartY - e.clientY, 15);
        
        joystickHeadElement.style.transform = `translate(${mouseDeltaX}px, ${mouseDeltaY}px)`;
        joystickHeadElement.classList.add("cursor-grabbing");

        const rotationY = mouseDeltaX * 0.8;
        const rotationX = mouseDeltaY * 0.8;
        
        mazeElement.style.transform = `rotateY(${rotationY}deg) rotateX(${-rotationX}deg)`;

        const gravity = 2;
        const friction = 0.01;
        accelerationX = gravity * Math.sin((rotationY / 180) * Math.PI);
        accelerationY = gravity * Math.sin((rotationX / 180) * Math.PI);
        frictionX = gravity * Math.cos((rotationY / 180) * Math.PI) * friction;
        frictionY = gravity * Math.cos((rotationX / 180) * Math.PI) * friction;
    }
});

window.addEventListener("keydown", (e) => {
    if (e.key === " ") {
        e.preventDefault();
        resetGame();
    } else if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        toggleHardMode();
    }
});

// Game Functions
function resetGame() {
    previousTimestamp = undefined;
    gameInProgress = false;
    
    mazeElement.style.transform = "rotateY(0deg) rotateX(0deg)";
    joystickHeadElement.style.transform = "translate(0, 0)";
    joystickHeadElement.classList.remove("cursor-grabbing");
    
    // Update UI
    if (hardMode) {
        noteElement.innerHTML = `Click the joystick to start!
            <p class="text-cyan-300 mt-1">Hard mode: Avoid black holes! Press H to switch</p>`;
        gameModeElement.textContent = "Hard";
        gameModeElement.className = "text-2xl font-bold text-pink-500";
    } else {
        noteElement.innerHTML = `Click the joystick to start!
            <p class="text-cyan-300 mt-1">Move all particles to the center. Press H for hard mode</p>`;
        gameModeElement.textContent = "Normal";
        gameModeElement.className = "text-2xl font-bold text-cyan-400";
    }
    noteElement.style.opacity = 1;
    particleCountElement.textContent = "4";

    // Reset balls
    balls = [
        { column: 0, row: 0 },
        { column: 9, row: 0 },
        { column: 0, row: 8 },
        { column: 9, row: 8 }
    ].map((ball, i) => ({
        x: ball.column * (wallW + pathW) + (wallW / 2 + pathW / 2),
        y: ball.row * (wallW + pathW) + (wallW / 2 + pathW / 2),
        velocityX: 0,
        velocityY: 0,
        color: particleColors[i],
        name: particleNames[i]
    }));

    // Create or update ball elements
    if (ballElements.length === 0) {
        balls.forEach((ball, i) => {
            const ballElement = document.createElement("div");
            ballElement.className = `absolute rounded-full w-2.5 h-2.5 ${ball.color}`;
            ballElement.style.cssText = `left: ${ball.x}px; top: ${ball.y}px;`;
            mazeElement.appendChild(ballElement);
            ballElements.push(ballElement);
        });
    } else {
        balls.forEach((ball, i) => {
            ballElements[i].className = `absolute rounded-full w-2.5 h-2.5 ${ball.color}`;
            ballElements[i].style.cssText = `left: ${ball.x}px; top: ${ball.y}px;`;
        });
    }

    // Handle black holes
    holeElements.forEach(hole => mazeElement.removeChild(hole));
    holeElements = [];
    
    if (hardMode) {
        holes.forEach(hole => {
            const holeElement = document.createElement("div");
            holeElement.className = "black-hole absolute rounded-full w-4.5 h-4.5 bg-black";
            holeElement.style.cssText = `left: ${hole.x}px; top: ${hole.y}px;`;
            mazeElement.appendChild(holeElement);
            holeElements.push(holeElement);
        });
    }
}

function toggleHardMode() {
    hardMode = !hardMode;
    resetGame();
}

function main(timestamp) {
    if (!gameInProgress) return;
    if (!previousTimestamp) {
        previousTimestamp = timestamp;
        window.requestAnimationFrame(main);
        return;
    }

    const timeElapsed = (timestamp - previousTimestamp) / 16;
    const maxVelocity = 1.5;

    try {
        if (accelerationX !== undefined && accelerationY !== undefined) {
            const velocityChangeX = accelerationX * timeElapsed;
            const velocityChangeY = accelerationY * timeElapsed;
            const frictionDeltaX = frictionX * timeElapsed;
            const frictionDeltaY = frictionY * timeElapsed;

            balls.forEach((ball, i) => {
                // Apply physics
                if (velocityChangeX === 0) {
                    ball.velocityX = slow(ball.velocityX, frictionDeltaX);
                } else {
                    ball.velocityX = Math.minmax(ball.velocityX + velocityChangeX, maxVelocity);
                    ball.velocityX -= Math.sign(velocityChangeX) * frictionDeltaX;
                }

                if (velocityChangeY === 0) {
                    ball.velocityY = slow(ball.velocityY, frictionDeltaY);
                } else {
                    ball.velocityY = Math.minmax(ball.velocityY + velocityChangeY, maxVelocity);
                    ball.velocityY -= Math.sign(velocityChangeY) * frictionDeltaY;
                }

                ball.nextX = ball.x + ball.velocityX;
                ball.nextY = ball.y + ball.velocityY;

                // Wall collisions
                walls.forEach(wall => {
                    if (wall.horizontal) {
                        handleHorizontalWallCollision(ball, wall);
                    } else {
                        handleVerticalWallCollision(ball, wall);
                    }
                });

                // Black hole collisions
                if (hardMode) {
                    holes.forEach((hole, hi) => {
                        if (distance2D(hole, { x: ball.nextX, y: ball.nextY }) <= holeSize / 2) {
                            holeElements[hi].classList.add("animate-pulse");
                            throw new Error("Particle lost in singularity");
                        }
                    });
                }

                // Update position
                ball.x += ball.velocityX;
                ball.y += ball.velocityY;
                ballElements[i].style.transform = `translate(${ball.velocityX * 2}px, ${ball.velocityY * 2}px)`;
                ballElements[i].style.left = `${ball.x}px`;
                ballElements[i].style.top = `${ball.y}px`;
            });
        }

        // Win condition
        if (balls.every(ball => distance2D(ball, { x: 350/2, y: 315/2 }) < 65/2)) {
            noteElement.innerHTML = `
                <span class="text-green-400 font-bold">PARTICLE ALIGNMENT ACHIEVED!</span>
                ${!hardMode ? "<p class='text-cyan-300 mt-2'>Press H for quantum challenge</p>" : ""}
            `;
            noteElement.style.opacity = 1;
            gameInProgress = false;
            
            // Celebration effect
            ballElements.forEach(ball => {
                ball.classList.add("animate-pulse");
            });
        } else {
            previousTimestamp = timestamp;
            window.requestAnimationFrame(main);
        }
    } catch (error) {
        if (error.message === "Particle lost in singularity") {
            noteElement.innerHTML = `
                <span class="text-red-400 font-bold">PARTICLE LOST IN SINGULARITY!</span>
                <p class="text-cyan-300 mt-2">Press space to reset the simulation</p>
            `;
            noteElement.style.opacity = 1;
            gameInProgress = false;
        }
    }
}

function handleHorizontalWallCollision(ball, wall) {
    if (ball.nextY + ballSize/2 >= wall.y - wallW/2 && ball.nextY - ballSize/2 <= wall.y + wallW/2) {
        const wallStart = { x: wall.x, y: wall.y };
        const wallEnd = { x: wall.x + wall.length, y: wall.y };

        // Check wall caps
        if (ball.nextX + ballSize/2 >= wallStart.x - wallW/2 && ball.nextX < wallStart.x) {
            if (distance2D(wallStart, { x: ball.nextX, y: ball.nextY }) < ballSize/2 + wallW/2) {
                Object.assign(ball, rollAroundCap(wallStart, ball));
            }
        }

        if (ball.nextX - ballSize/2 <= wallEnd.x + wallW/2 && ball.nextX > wallEnd.x) {
            if (distance2D(wallEnd, { x: ball.nextX, y: ball.nextY }) < ballSize/2 + wallW/2) {
                Object.assign(ball, rollAroundCap(wallEnd, ball));
            }
        }

        // Check wall body
        if (ball.nextX >= wallStart.x && ball.nextX <= wallEnd.x) {
            if (ball.nextY < wall.y) {
                ball.nextY = wall.y - wallW/2 - ballSize/2;
            } else {
                ball.nextY = wall.y + wallW/2 + ballSize/2;
            }
            ball.y = ball.nextY;
            ball.velocityY = -ball.velocityY / 3;
        }
    }
}

function handleVerticalWallCollision(ball, wall) {
    if (ball.nextX + ballSize/2 >= wall.x - wallW/2 && ball.nextX - ballSize/2 <= wall.x + wallW/2) {
        const wallStart = { x: wall.x, y: wall.y };
        const wallEnd = { x: wall.x, y: wall.y + wall.length };

        // Check wall caps
        if (ball.nextY + ballSize/2 >= wallStart.y - wallW/2 && ball.nextY < wallStart.y) {
            if (distance2D(wallStart, { x: ball.nextX, y: ball.nextY }) < ballSize/2 + wallW/2) {
                Object.assign(ball, rollAroundCap(wallStart, ball));
            }
        }

        if (ball.nextY - ballSize/2 <= wallEnd.y + wallW/2 && ball.nextY > wallEnd.y) {
            if (distance2D(wallEnd, { x: ball.nextX, y: ball.nextY }) < ballSize/2 + wallW/2) {
                Object.assign(ball, rollAroundCap(wallEnd, ball));
            }
        }

        // Check wall body
        if (ball.nextY >= wallStart.y && ball.nextY <= wallEnd.y) {
            if (ball.nextX < wall.x) {
                ball.nextX = wall.x - wallW/2 - ballSize/2;
            } else {
                ball.nextX = wall.x + wallW/2 + ballSize/2;
            }
            ball.x = ball.nextX;
            ball.velocityX = -ball.velocityX / 3;
        }
    }
}
