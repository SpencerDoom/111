// Main sketch.js for the modular emoji roguelike shooter
// This file coordinates all game systems and handles the p5.js lifecycle

// Global game instance
let game;

function setup() {
    createCanvas(800, 600);
    
    // Initialize the main game
    game = new Game();
    game.init();
    
    console.log("Emoji Roguelike Shooter initialized!");
}

function draw() {
    // Calculate delta time (default to ~60fps)
    let dt = 16;
    
    // Update and draw the game
    game.update(dt);
    game.display();
}

// Input handling
function mousePressed() {
    // Mouse input handled in game.handleInput()
    return false; // Prevent context menu for right click
}

function keyPressed() {
    game.keyPressed(key);
}

// Prevent right-click context menu
document.addEventListener('contextmenu', event => event.preventDefault());

// Handle window resize
function windowResized() {
    resizeCanvas(800, 600);
}