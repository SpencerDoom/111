// Main sketch.js for the modular emoji roguelike shooter
// This file coordinates all game systems and handles the p5.js lifecycle

// Global game instance
let game;

function setup() {
    createCanvas(800, 600);
    
    // Initialize the main game
    game = new Game();
    game.initialize();
    
    console.log("Emoji Roguelike Shooter initialized!");
}

function draw() {
    // Update and draw the game
    game.update();
    game.draw();
}

// Input handling
function mousePressed() {
    if (mouseButton === LEFT) {
        game.handleMousePressed();
    } else if (mouseButton === RIGHT) {
        game.handleMousePressed2();
        return false; // Prevent context menu
    }
}

function keyPressed() {
    game.handleKeyPressed();
}

// Prevent right-click context menu
document.addEventListener('contextmenu', event => event.preventDefault());

// Handle window resize
function windowResized() {
    resizeCanvas(800, 600);
}