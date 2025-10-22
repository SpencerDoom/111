let player;
let enemies = [];
let powerUps = [];
const ENEMY_SPAWN_INTERVAL = 2000;
let lastEnemySpawnTime = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'talentSelection', 'shop'

// Audio system
let audioEnabled = false;
let audioMuted = false;
let bgMusic;
let shootSound;
let explosionSound;
let pickupSound;
let hitSound;

// Visual feedback systems
let particles = [];
let screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
let backgroundOffset = 0;

// Color schemes
const colorScheme = {
    background: [20, 25, 40],
    accent: [100, 200, 255],
    warning: [255, 100, 100],
    success: [100, 255, 100],
    gold: [255, 215, 0]
};

// Portal
let portalPosition = { x: null, y: null, active: false };
const PORTAL_SIZE = 50;
let shopOfferItem = null;

// Wave management
let currentWave = 1;
let enemiesPerWave = 5;
let enemiesSpawnedThisWave = 0;
let enemiesDefeatedThisWave = 0;

// Boss management
let isBossBattleActive = false;
const BOSS_APPEARS_WAVE = 3;
let currentBoss = null;

// Talent System
const allTalents = [
    { id: 'hp_boost', name: "+2 最大生命值", description: "最大生命值增加2.", apply: (p) => { p.maxHealth += 2; p.health += 2; } },
    { id: 'speed_boost', name: "+0.5 速度", description: "提高移动速度.", apply: (p) => { p.speed += 0.5; } },
    { id: 'firerate_boost', name: "-20% 射速", description: "提高射击速度（减少延迟）.", apply: (p) => { p.fireRate *= 0.8; } },
    { id: 'damage_boost', name: "+1 子弹伤害", description: "你的子弹造成更多伤害.", apply: (p) => { p.projectileDamage += 1; } },
    { id: 'dash_cooldown', name: "-20% 冲刺冷却", description: "减少冲刺冷却时间.", apply: (p) => { p.dashCooldown *= 0.8; } },
    { id: 'shield_capacity', name: "+2 最大护盾", description: "增加护盾容量.", apply: (p) => { p.maxShields += 2; p.shields += 2; } },
    { id: 'magnet_range', name: "磁力收集", description: "增加能量球吸引范围.", apply: (p) => { /* Handled in PowerUp class */ console.log("Magnet range increased!"); } },
    { id: 'powerup_boost', name: "能量强化", description: "能量球效果提升50%.", apply: (p) => { p.powerUpBonus = (p.powerUpBonus || 1) * 1.5; } },
    { id: 'gold_bonus', name: "黄金收集", description: "敌人掉落更多金币.", apply: (p) => { p.goldMultiplier = (p.goldMultiplier || 1) * 1.5; } },
    { id: 'xp_boost', name: "经验提升", description: "获得经验+25%.", apply: (p) => { p.xpMultiplier = (p.xpMultiplier || 1) * 1.25; } }
];
let offeredTalents = [];
let talentButtonHeight = 50;
let talentButtonSpacing = 20;

// Shop UI Button Dimenstions (Example Values)
const shopButtonWidth = 200;
const shopButtonHeight = 50;
const shopButtonSpacing = 20;
let takeItemButton = { x: 0, y: 0, width: shopButtonWidth, height: shopButtonHeight, text: "Take Item (Free)" };
let refreshItemsButton = { x: 0, y: 0, width: shopButtonWidth, height: shopButtonHeight, text: "Refresh Items (10G)" };
let nextWaveButton = { x: 0, y: 0, width: shopButtonWidth, height: shopButtonHeight, text: "Next Wave" };
let shopInventory = [];
const MAX_SHOP_ITEMS = 3; // Number of items to display for purchase
let buyItemButtons = []; // To store dynamic buy buttons
const REFRESH_COST = 10;

// Item System
class Item {
    constructor(id, name, description, applyEffect, rarity) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.applyEffect = applyEffect; // This will be a function
        this.rarity = rarity; // 'common', 'rare', 'legendary'
    }
}

const allItems = [
    new Item('health_potion', 'Health Potion', 'Restores 5 HP.', (player) => { player.health = min(player.maxHealth, player.health + 5); }, 'common'),
    new Item('damage_shard', 'Damage Shard', 'Increases projectile damage by 1.', (player) => { player.projectileDamage += 1; }, 'rare'),
    new Item('speed_crystal', 'Speed Crystal', 'Increases player speed by 0.5.', (player) => { player.speed += 0.5; }, 'rare'),
    new Item('gold_magnet', 'Gold Magnet', 'Increases gold from enemies (NYI).', (player) => { /* player.goldBonus += 0.1; */ console.log("Gold Magnet effect (NYI)"); }, 'legendary')
    // NYI: Not Yet Implemented for gold bonus part.
];

// Power-up System
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 25;
        this.bobOffset = random(0, TWO_PI);
        this.magnetRange = 60;
        this.collected = false;
        this.lifespan = 30000; // 30 seconds before disappearing
        this.spawnTime = millis();
        
        // Visual effects
        this.glowIntensity = 0;
        this.glowDirection = 1;
    }
    
    update(player) {
        // Bob up and down
        this.bobOffset += 0.05;
        
        // Glow effect
        this.glowIntensity += this.glowDirection * 3;
        if (this.glowIntensity > 100 || this.glowIntensity < 0) {
            this.glowDirection *= -1;
        }
        
        // Magnetic attraction to player
        let distanceToPlayer = dist(this.x, this.y, player.x, player.y);
        if (distanceToPlayer < this.magnetRange) {
            let pullForce = map(distanceToPlayer, 0, this.magnetRange, 8, 0);
            let angle = atan2(player.y - this.y, player.x - this.x);
            this.x += cos(angle) * pullForce;
            this.y += sin(angle) * pullForce;
        }
        
        // Collection check
        if (distanceToPlayer < this.size/2 + player.size/2) {
            this.applyEffect(player);
            this.collected = true;
            playSound('pickup');
            createExplosion(this.x, this.y, this.getColor(), 8);
        }
    }
    
    display() {
        push();
        translate(this.x + screenShake.x, this.y + screenShake.y + sin(this.bobOffset) * 3);
        
        // Outer glow
        let glowColor = this.getColor();
        fill(glowColor[0], glowColor[1], glowColor[2], this.glowIntensity);
        noStroke();
        ellipse(0, 0, this.size + 15, this.size + 15);
        
        // Main body
        fill(glowColor[0], glowColor[1], glowColor[2], 200);
        stroke(255);
        strokeWeight(2);
        ellipse(0, 0, this.size, this.size);
        
        // Emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.7);
        text(this.getEmoji(), 0, 0);
        
        pop();
    }
    
    applyEffect(player) {
        let bonus = player.powerUpBonus || 1;
        
        switch(this.type) {
            case 'health':
                let healthRestore = ceil(3 * bonus);
                player.health = min(player.maxHealth, player.health + healthRestore);
                console.log("Health restored! Amount: " + healthRestore + ", Current: " + player.health);
                break;
            case 'shield':
                let shieldGain = ceil(2 * bonus);
                player.shields = min(player.maxShields, player.shields + shieldGain);
                console.log("Shield gained! Amount: " + shieldGain + ", Current: " + player.shields);
                break;
            case 'damage':
                let damageBoost = bonus;
                player.tempDamageBoost = (player.tempDamageBoost || 0) + damageBoost;
                player.tempDamageBoostTime = millis() + 15000; // 15 seconds
                console.log("Damage boost! Bonus: " + damageBoost + ", Total: " + player.tempDamageBoost);
                break;
            case 'speed':
                let speedBoost = 0.5 * bonus;
                player.tempSpeedBoost = (player.tempSpeedBoost || 0) + speedBoost;
                player.tempSpeedBoostTime = millis() + 12000; // 12 seconds
                console.log("Speed boost! Bonus: " + speedBoost + ", Total: " + player.tempSpeedBoost);
                break;
            case 'xp':
                let xpGain = ceil(8 * bonus * (player.xpMultiplier || 1));
                player.gainXP(xpGain);
                console.log("XP boost gained! Amount: " + xpGain);
                break;
            case 'gold':
                let goldGain = ceil(random(3, 8) * bonus);
                player.gold += goldGain;
                console.log("Gold found! Amount: " + goldGain + ", Current: " + player.gold);
                break;
        }
    }
    
    getEmoji() {
        switch(this.type) {
            case 'health': return '❤️';
            case 'shield': return '🛡️';
            case 'damage': return '💎';
            case 'speed': return '⭐';
            case 'xp': return '🔋';
            case 'gold': return '💰';
            default: return '❓';
        }
    }
    
    getColor() {
        switch(this.type) {
            case 'health': return [255, 100, 100];
            case 'shield': return [100, 200, 255];
            case 'damage': return [255, 100, 255];
            case 'speed': return [255, 255, 100];
            case 'xp': return [100, 255, 100];
            case 'gold': return [255, 215, 0];
            default: return [255, 255, 255];
        }
    }
    
    isExpired() {
        return millis() - this.spawnTime > this.lifespan;
    }
}

// Power-up drop chances and types
const POWER_UP_TYPES = ['health', 'shield', 'damage', 'speed', 'xp', 'gold'];
const POWER_UP_DROP_CHANCE = 0.25; // 25% chance per enemy

// Audio initialization
function initAudio() {
    try {
        if (typeof p5 !== 'undefined' && p5.prototype && p5.prototype.loadSound) {
            audioEnabled = true;
            // Create simple oscillator-based sounds since we don't have audio files
            shootSound = new p5.Oscillator('sine');
            explosionSound = new p5.Oscillator('sawtooth');
            pickupSound = new p5.Oscillator('triangle');
            hitSound = new p5.Oscillator('square');
            
            // We'll trigger these sounds manually in playSound function
            shootSound.amp(0);
            explosionSound.amp(0);
            pickupSound.amp(0);
            hitSound.amp(0);
            
            shootSound.start();
            explosionSound.start();
            pickupSound.start();
            hitSound.start();
            
            console.log("Audio system initialized");
        }
    } catch (e) {
        console.log("Audio initialization failed:", e);
        audioEnabled = false;
    }
}

// Play sound effects
function playSound(soundType) {
    if (!audioEnabled || audioMuted) return;
    
    try {
        switch (soundType) {
            case 'shoot':
                shootSound.freq(800);
                shootSound.amp(0.1, 0);
                shootSound.amp(0, 0.1);
                break;
            case 'explosion':
                explosionSound.freq(150);
                explosionSound.amp(0.2, 0);
                explosionSound.amp(0, 0.3);
                break;
            case 'pickup':
                pickupSound.freq(600);
                pickupSound.amp(0.15, 0);
                pickupSound.amp(0, 0.2);
                break;
            case 'hit':
                hitSound.freq(200);
                hitSound.amp(0.1, 0);
                hitSound.amp(0, 0.15);
                break;
        }
    } catch (e) {
        console.log("Sound playback failed:", e);
    }
}

// Particle system
class Particle {
    constructor(x, y, color = [255, 255, 255], size = 5) {
        this.x = x;
        this.y = y;
        this.vx = random(-3, 3);
        this.vy = random(-3, 3);
        this.life = 255;
        this.maxLife = 255;
        this.color = color;
        this.size = size;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= 5;
        this.size *= 0.99;
    }
    
    display() {
        push();
        translate(this.x + screenShake.x, this.y + screenShake.y);
        fill(this.color[0], this.color[1], this.color[2], this.life);
        noStroke();
        ellipse(0, 0, this.size);
        pop();
    }
    
    isDead() {
        return this.life <= 0 || this.size <= 0.5;
    }
}

// Create explosion particles
function createExplosion(x, y, color = [255, 100, 50], particleCount = 12) {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, color, random(3, 8)));
    }
}

// Screen shake effect
function addScreenShake(intensity, duration) {
    screenShake.intensity = intensity;
    screenShake.duration = duration;
}

// Update screen shake
function updateScreenShake() {
    if (screenShake.duration > 0) {
        screenShake.x = random(-screenShake.intensity, screenShake.intensity);
        screenShake.y = random(-screenShake.intensity, screenShake.intensity);
        screenShake.duration--;
        if (screenShake.duration <= 0) {
            screenShake.x = 0;
            screenShake.y = 0;
        }
    }
}

function setup() {
    createCanvas(800, 600);
    player = new Player(width / 2, height / 2); // Player must be created before resetGame
    resetGame();
    
    // Initialize audio after user interaction (will be called on first click)
    setTimeout(() => {
        try {
            initAudio();
        } catch (e) {
            console.log("Audio init deferred");
        }
    }, 100);
}

function resetGame() {
    // Player stats that can be modified by talents
    player.speed = 3;
    player.fireRate = 250; // ms per shot
    player.projectileDamage = 1;
    player.maxHealth = 10;
    player.dashCooldown = 1000;
    // Other player stats from constructor (not directly talent modified but reset for consistency)
    player.dashSpeed = 10;
    player.dashDuration = 150;

    // Core player state
    player.health = player.maxHealth;
    player.shields = 0;
    player.x = width / 2;
    player.y = height / 2;
    player.projectiles = [];
    player.level = 1;
    player.xp = 0;
    player.xpToNextLevel = 10;
    player.lastShotTime = 0;
    player.inventory = []; // Clear inventory
    player.gold = 0;       // Reset gold
    
    // Reset temporary boosts
    player.tempDamageBoost = 0;
    player.tempDamageBoostTime = 0;
    player.tempSpeedBoost = 0;
    player.tempSpeedBoostTime = 0;
    
    // Reset talent multipliers
    player.powerUpBonus = 1;
    player.goldMultiplier = 1;
    player.xpMultiplier = 1;

    shopInventory = [];    // Clear shop inventory on reset
    buyItemButtons = [];   // Clear buy buttons

    enemies = [];
    powerUps = [];         // Clear power-ups on reset
    currentWave = 1;
    enemiesPerWave = 5;
    enemiesSpawnedThisWave = 0;
    enemiesDefeatedThisWave = 0;
    lastEnemySpawnTime = millis();

    isBossBattleActive = false;
    currentBoss = null;
    if (currentBoss && currentBoss.projectiles) currentBoss.projectiles = []; // Clear boss projectiles if any linger

    portalPosition.active = false; // Deactivate portal on reset
    shopOfferItem = null; // Clear shop offer

    offeredTalents = []; // Clear any talents from previous game
    
    // Reset visual systems
    particles = [];
    screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    backgroundOffset = 0;
    
    // gameState = 'start'; // This is usually set by the caller of resetGame
}

// Draw animated background
function drawBackground() {
    // Dynamic background color based on game state
    let bgColor = colorScheme.background;
    if (gameState === 'playing') {
        if (isBossBattleActive) {
            bgColor = [40, 20, 20]; // Darker red for boss battles
        } else {
            bgColor = [20, 25, 40]; // Default dark blue
        }
    }
    
    background(bgColor[0], bgColor[1], bgColor[2]);
    
    // Scrolling background pattern
    if (gameState === 'playing') {
        backgroundOffset += 0.5;
        if (backgroundOffset > 40) backgroundOffset = 0;
        
        stroke(bgColor[0] + 10, bgColor[1] + 10, bgColor[2] + 10);
        strokeWeight(1);
        
        // Vertical scrolling lines
        for (let i = -40; i < width + 40; i += 40) {
            line(i, -backgroundOffset, i, height);
        }
        
        // Horizontal lines
        for (let j = -40; j < height + 40; j += 40) {
            line(0, j - backgroundOffset, width, j - backgroundOffset);
        }
        
        noStroke();
    }
}

function draw() {
    // Update visual systems
    updateScreenShake();
    
    // Draw background
    drawBackground();

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        runGame();
    } else if (gameState === 'gameOver') {
        drawGameOverScreen();
    } else if (gameState === 'talentSelection') {
        drawTalentSelectionScreen();
    } else if (gameState === 'shop') {
        drawShopScreen();
    }
    
    // Update and draw particles (in all game states for smooth transitions)
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
}

function drawStartScreen() {
    // Title with emoji
    textAlign(CENTER, CENTER);
    fill(colorScheme.accent);
    textSize(56);
    text("🚀 肉鸽射击 🎯", width / 2, height / 4);
    
    // Subtitle
    fill(255);
    textSize(20);
    text("Roguelike Space Shooter", width / 2, height / 4 + 50);
    
    // Instructions
    textSize(16);
    fill(200);
    let instructions = [
        "🎮 控制：",
        "WASD - 移动",
        "鼠标 - 瞄准和射击",
        "空格 - 冲刺",
        "",
        "🎯 目标：",
        "消灭敌人，升级，选择天赋",
        "在Boss战中生存！",
        "",
        "🔊 音频：" + (audioEnabled ? "已启用" : "将在第一次点击后启用")
    ];
    
    let startY = height / 2 - 20;
    for (let i = 0; i < instructions.length; i++) {
        text(instructions[i], width / 2, startY + i * 20);
    }
    
    // Start button
    fill(colorScheme.success);
    textSize(28);
    text("🎮 点击开始 🎮", width / 2, height - 100);
    
    // Audio toggle hint
    if (audioEnabled) {
        fill(100);
        textSize(14);
        text("按 M 键静音/取消静音", width / 2, height - 30);
    }
}

function runGame() {
    player.display(); // Player display first
    player.update(enemies, currentBoss); // Player update handles its movement and projectile logic

    // Update and display power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].update(player);
        powerUps[i].display();
        
        if (powerUps[i].collected || powerUps[i].isExpired()) {
            powerUps.splice(i, 1);
        }
    }

    if (isBossBattleActive) {
        if (currentBoss) {
            currentBoss.update(player);
            currentBoss.display();

            if (currentBoss.health <= 0) {
                player.gainXP(currentBoss.xpValue);
                // Boss defeat gold handled in Boss.takeDamage
                portalPosition.x = currentBoss.x; // Store boss death location
                portalPosition.y = currentBoss.y;
                portalPosition.active = true;
                shopOfferItem = currentBoss.getDroppedItem(); // Determine item for the shop
                populateShopItems(); // Populate general shop items when portal opens

                isBossBattleActive = false;
                // currentBoss = null; // Keep currentBoss for its position until portal is used or next wave starts
                // Don't immediately advance wave or clear boss until portal is handled or new wave starts explicitly
                console.log("Boss defeated! Portal appears. Item offered: " + (shopOfferItem ? shopOfferItem.name : "None"));
                // Wave advancement will now happen after shop or if portal is ignored.
            }
        }
    } else if (portalPosition.active) { // If portal is active, don't spawn/manage other enemies
        // Player can move towards portal
    }
    else { // Regular wave logic (No boss, no portal)
        // Enemy Spawning Logic
        if (enemiesSpawnedThisWave < enemiesPerWave && millis() - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
            spawnEnemy();
        }

        // Update and display regular enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(player); // Enemy update handles its movement, attacks, and projectile logic
            enemies[i].display();

            // Player-Enemy direct collision (melee)
            if (dist(player.x, player.y, enemies[i].x, enemies[i].y) < player.size / 2 + enemies[i].size / 2) {
                player.takeDamage(1); // Player takes 1 melee damage
                enemies[i].health = 0; // Enemy destroyed on collision
            }

            // Enemy defeat gold handled in Enemy.takeDamage
            if (enemies[i].health <= 0) {
                // player.gainXP(enemies[i].xpValue); // XP gain is now in Enemy.takeDamage
                enemies.splice(i, 1);
                enemiesDefeatedThisWave++;
            }
        }

        // Wave Transition Logic / Boss Trigger
        if (enemiesSpawnedThisWave >= enemiesPerWave && enemiesDefeatedThisWave >= enemiesPerWave && enemies.length === 0) {
            if ((currentWave % BOSS_APPEARS_WAVE) === 0) { // Boss every 3 waves
                isBossBattleActive = true;
                enemiesSpawnedThisWave = 0;
                enemiesDefeatedThisWave = 0;
                
                // Choose random boss variant
                let bossVariants = ['standard', 'sweeper', 'summoner', 'beamer'];
                let chosenVariant = random(bossVariants);
                currentBoss = new Boss(width / 2, 120, chosenVariant);
                console.log("BOSS INCOMING! Type: " + chosenVariant);
                enemies = [];
            } else {
                currentWave++;
                enemiesPerWave += 2;
                enemiesSpawnedThisWave = 0;
                enemiesDefeatedThisWave = 0;
                lastEnemySpawnTime = millis();
                console.log("Starting Wave: " + currentWave);
                 // Potentially offer talents between normal waves too if desired
                // player.levelUp(); // For testing talent screen
            }
        }
    }

    // Portal Display with enhanced effects
    if (portalPosition.active) {
        push();
        translate(portalPosition.x + screenShake.x, portalPosition.y + screenShake.y);
        
        // Animated portal with pulsing effect
        let pulseSize = PORTAL_SIZE + sin(millis() / 200) * 10;
        
        // Outer glow
        fill(150, 0, 255, 80);
        ellipse(0, 0, pulseSize + 20, pulseSize + 20);
        
        // Main portal
        fill(150, 0, 255, 150);
        ellipse(0, 0, pulseSize, pulseSize);
        
        // Inner core
        fill(255, 255, 255, 200);
        ellipse(0, 0, pulseSize * 0.6, pulseSize * 0.6);
        
        // Portal emoji and text
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(20);
        text("🌀", 0, -10);
        textSize(14);
        text("Shop", 0, 10);
        
        // Add swirling particles around portal
        if (random() < 0.5) {
            let angle = millis() / 100;
            let radius = pulseSize * 0.8;
            let px = cos(angle) * radius;
            let py = sin(angle) * radius;
            particles.push(new Particle(portalPosition.x + px, portalPosition.y + py, [150, 0, 255], 3));
        }
        
        pop();
    }

    // Enhanced HUD Display with emoji styling
    push();
    translate(screenShake.x, screenShake.y);
    
    // HUD background
    fill(0, 0, 0, 120);
    noStroke();
    rect(5, 5, 200, 95);
    rect(width - 155, 5, 150, 55);
    
    // Health display with emoji
    fill(colorScheme.warning);
    textSize(16);
    textAlign(LEFT, TOP);
    text("❤️ " + player.health + "/" + player.maxHealth, 15, 15);
    
    // Shield display
    if (player.shields > 0) {
        fill(100, 200, 255);
        text("🛡️ " + player.shields + "/" + player.maxShields, 15, 35);
        
        // Level display moved down if shields are shown
        fill(colorScheme.accent);
        text("⭐ " + player.level, 15, 55);
    } else {
        // Level display in normal position
        fill(colorScheme.accent);
        text("⭐ " + player.level, 15, 35);
    }
    
    // XP Bar with better styling
    let xpBarWidth = 120;
    let xpBarHeight = 12;
    let xpBarY = player.shields > 0 ? 75 : 55; // Adjust position based on shield display
    
    fill(50);
    stroke(100);
    rect(15, xpBarY, xpBarWidth, xpBarHeight);
    
    fill(colorScheme.success);
    noStroke();
    let xpProgress = constrain(map(player.xp, 0, player.xpToNextLevel, 0, xpBarWidth), 0, xpBarWidth);
    rect(15, xpBarY, xpProgress, xpBarHeight);
    
    fill(255);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(player.xp + "/" + player.xpToNextLevel, 15 + xpBarWidth/2, xpBarY + xpBarHeight/2 + 1);
    
    // Gold display with emoji
    fill(colorScheme.gold);
    textSize(16);
    textAlign(LEFT, TOP);
    let goldY = player.shields > 0 ? 95 : 75;
    text("💰 " + player.gold, 15, goldY);
    
    // Wave/Boss info on the right
    fill(255);
    textAlign(RIGHT, TOP);
    if (!isBossBattleActive) {
        text("🌊 波次 " + currentWave, width - 15, 15);
        text("👹 敌人 " + (enemiesPerWave - enemiesDefeatedThisWave), width - 15, 35);
    } else if (currentBoss) {
        fill(colorScheme.warning);
        textSize(18);
        text("💀 BOSS 战！", width - 15, 15);
        
        // Boss health bar
        if (currentBoss.health > 0) {
            let bossHealthPercent = currentBoss.health / currentBoss.maxHealth;
            fill(50);
            stroke(100);
            rect(width - 155, 35, 140, 8);
            fill(colorScheme.warning);
            noStroke();
            rect(width - 155, 35, 140 * bossHealthPercent, 8);
        }
    }
    
    // Audio mute indicator
    if (audioEnabled && audioMuted) {
        fill(colorScheme.warning);
        textSize(12);
        textAlign(RIGHT, TOP);
        text("🔇", width - 15, height - 25);
    }
    
    pop();

    // Check for game over state from player health
    if (player.health <= 0 && gameState !== 'gameOver') {
        gameState = 'gameOver';
    }

    // Player-Portal Interaction
    if (portalPosition.active && dist(player.x, player.y, portalPosition.x, portalPosition.y) < player.size / 2 + PORTAL_SIZE / 2) {
        gameState = 'shop';
        portalPosition.active = false;
        // populateShopItems(); // Moved to when portal opens, so items are ready before shop screen draws
        // currentBoss = null;
        console.log("Entering shop...");
    }
}


function populateShopItems() {
    shopInventory = [];
    buyItemButtons = []; // Clear old buttons

    let availableForShop = allItems.filter(item => item.rarity !== 'legendary'); // Exclude legendary, or make very rare & expensive
    if (shopOfferItem) { // Temporarily exclude the free offer item from being re-rolled in general shop
        availableForShop = availableForShop.filter(item => item.id !== shopOfferItem.id);
    }


    for (let i = 0; i < MAX_SHOP_ITEMS; i++) {
        if (availableForShop.length === 0) break;

        let randomIndex = floor(random(availableForShop.length));
        let templateItem = availableForShop[randomIndex];

        // Create a new object to avoid modifying allItems directly with cost
        let shopItemInstance = { ...templateItem };

        // Assign cost based on rarity (example costs)
        if (shopItemInstance.rarity === 'common') {
            shopItemInstance.cost = floor(random(5, 11)); // e.g. 5-10 gold
        } else if (shopItemInstance.rarity === 'rare') {
            shopItemInstance.cost = floor(random(15, 26)); // e.g. 15-25 gold
        } else { // Should not happen if legendary are filtered
            shopItemInstance.cost = 50;
        }

        shopInventory.push(shopItemInstance);
        availableForShop.splice(randomIndex, 1); // Remove to avoid duplicates in the same shop roll

        // Prepare button structure (positions will be set in drawShopScreen)
        buyItemButtons.push({
            itemIndex: i, // To link button to shopInventory item
            x: 0, y: 0, width: shopButtonWidth * 0.6, height: shopButtonHeight * 0.8,
            text: "Buy (" + shopItemInstance.cost + "G)"
        });
    }
    console.log("Shop populated with " + shopInventory.length + " items.");
}

function generateOfferedTalents() {
    offeredTalents = [];
    let availableTalents = [...allTalents];
    for (let i = 0; i < 3; i++) {
        if (availableTalents.length === 0) break;
        let randomIndex = floor(random(availableTalents.length));
        offeredTalents.push(availableTalents[randomIndex]);
        availableTalents.splice(randomIndex, 1);
    }
}

function drawTalentSelectionScreen() {
    // Title with celebration emoji
    textAlign(CENTER, CENTER);
    fill(colorScheme.gold);
    textSize(40);
    text("🎉 升级！🎉", width / 2, height / 5);
    
    fill(colorScheme.accent);
    textSize(24);
    text("选择一个天赋：", width / 2, height / 5 + 45);

    // Talent selection buttons with emoji
    for (let i = 0; i < offeredTalents.length; i++) {
        let talent = offeredTalents[i];
        let yPos = height / 2 + i * (talentButtonHeight + talentButtonSpacing) - (talentButtonHeight + talentButtonSpacing);

        // Button background with hover effect
        let isHovered = mouseX > width * 0.2 && mouseX < width * 0.8 && 
                       mouseY > yPos - talentButtonHeight/2 && mouseY < yPos + talentButtonHeight/2;
        
        fill(isHovered ? 230 : 200);
        stroke(isHovered ? colorScheme.accent : [100, 100, 100]);
        strokeWeight(isHovered ? 3 : 1);
        rectMode(CENTER);
        rect(width / 2, yPos, width * 0.6, talentButtonHeight);

        // Talent emoji based on type
        let emoji = "⚡";
        if (talent.id.includes('hp')) emoji = "❤️";
        else if (talent.id.includes('speed')) emoji = "💨";
        else if (talent.id.includes('fire')) emoji = "🔫";
        else if (talent.id.includes('damage')) emoji = "💥";
        else if (talent.id.includes('dash')) emoji = "🏃";
        else if (talent.id.includes('shield')) emoji = "🛡️";
        else if (talent.id.includes('magnet')) emoji = "🧲";
        else if (talent.id.includes('powerup')) emoji = "💎";
        else if (talent.id.includes('gold')) emoji = "💰";
        else if (talent.id.includes('xp')) emoji = "🔋";

        fill(0);
        noStroke();
        textSize(20);
        text(emoji + " " + talent.name, width / 2, yPos - 12);
        textSize(14);
        fill(80);
        text(talent.description, width/2, yPos + 8);
    }
    rectMode(CORNER); // Reset rectMode
}

function drawShopScreen() {
    // Gradient background for shop
    for (let i = 0; i < height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(color(150, 180, 255), color(200, 220, 255), inter);
        stroke(c);
        line(0, i, width, i);
    }
    noStroke();
    
    textAlign(CENTER, CENTER);

    // Title with shop emoji
    textSize(48);
    fill(colorScheme.gold);
    text("🏪 Item Shop 🏪", width / 2, 70);

    // Gold Display with emoji
    textSize(24);
    fill(colorScheme.gold);
    textAlign(RIGHT, TOP);
    text("💰 " + player.gold, width - 20, 20);
    textAlign(CENTER, CENTER); // Reset alignment

    let currentY = 150;

    // Display Offered Item (from Boss)
    if (shopOfferItem) {
        fill(255);
        stroke(0);
        rectMode(CENTER);
        rect(width / 2, currentY, width * 0.7, 100); // Item display box

        fill(0);
        noStroke();
        textSize(22);
        text(shopOfferItem.name + " (" + shopOfferItem.rarity + ")", width / 2, currentY - 25);
        textSize(16);
        text(shopOfferItem.description, width / 2, currentY + 5);

        // "Take Item" Button
        takeItemButton.x = width / 2;
        takeItemButton.y = currentY + 75;
        fill(180, 255, 180); // Light green
        stroke(0);
        rectMode(CENTER);
        rect(takeItemButton.x, takeItemButton.y, takeItemButton.width, takeItemButton.height);
        fill(0);
        noStroke();
        textSize(18);
        text(takeItemButton.text, takeItemButton.x, takeItemButton.y);
        currentY += 100 + shopButtonSpacing + shopButtonHeight; // Move Y for next section
    } else {
        textSize(20);
        fill(100);
        text("The special item has been taken.", width / 2, currentY + 50);
        currentY += 100 + shopButtonSpacing;
    }


    // General Shop Items Area
    currentY += shopButtonSpacing; // Add some space before general items

    for (let i = 0; i < shopInventory.length; i++) {
        let item = shopInventory[i];
        if (!item) continue; // Should not happen if populated correctly and not "sold" by nulling

        let itemBoxY = currentY + 60;
        fill(240, 240, 240); // Light grey box for each item
        stroke(100);
        rectMode(CENTER);
        rect(width / 2, itemBoxY, width * 0.75, 80);

        fill(0);
        noStroke();
        textSize(18);
        textAlign(LEFT, CENTER);
        text(item.name + " (" + item.rarity + ")", width / 2 - width * 0.35, itemBoxY - 15);
        textSize(14);
        text(item.description, width / 2 - width * 0.35, itemBoxY + 10);
        textAlign(CENTER, CENTER); // Reset

        // Buy Button for this item
        let btn = buyItemButtons[i];
        btn.x = width / 2 + width * 0.25; // Position button to the right of item info
        btn.y = itemBoxY;

        fill(180, 220, 255); // Light blue for buy buttons
        stroke(0);
        rectMode(CENTER);
        rect(btn.x, btn.y, btn.width, btn.height);
        fill(0);
        noStroke();
        textSize(16);
        text(btn.text, btn.x, btn.y);

        currentY += 80 + shopButtonSpacing; // Increment Y for next item
    }
    if (shopInventory.length === 0 && !shopOfferItem) { // Only if no free item and no purchasable items
        textSize(20);
        fill(100);
        text("Shop is currently empty. Try refreshing!", width / 2, currentY + 50);
         currentY += 80 + shopButtonSpacing;
    }


    // Bottom Buttons
    // "Refresh Items" Button
    refreshItemsButton.x = width / 2 - shopButtonWidth / 2 - shopButtonSpacing / 2;
    refreshItemsButton.y = height - 80;
    fill(200, 200, 255); // Light purple
    stroke(0);
    rectMode(CENTER);
    rect(refreshItemsButton.x, refreshItemsButton.y, refreshItemsButton.width, refreshItemsButton.height);
    fill(0);
    noStroke();
    textSize(18);
    text(refreshItemsButton.text, refreshItemsButton.x, refreshItemsButton.y);

    // "Next Wave" Button
    nextWaveButton.x = width / 2 + shopButtonWidth / 2 + shopButtonSpacing / 2;
    nextWaveButton.y = height - 80;
    fill(255, 200, 200); // Light red
    stroke(0);
    rectMode(CENTER);
    rect(nextWaveButton.x, nextWaveButton.y, nextWaveButton.width, nextWaveButton.height);
    fill(0);
    noStroke();
    textSize(18);
    text(nextWaveButton.text, nextWaveButton.x, nextWaveButton.y);

    rectMode(CORNER); // Reset rectMode
}


function drawGameOverScreen() {
    // Dark overlay
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    
    textAlign(CENTER, CENTER);
    
    // Game Over title with skull emoji
    fill(colorScheme.warning);
    textSize(56);
    text("💀 游戏结束 💀", width / 2, height / 3);
    
    // Stats section
    fill(255);
    textSize(24);
    let message = "你到达了 ";
    if (isBossBattleActive || currentWave >= BOSS_APPEARS_WAVE) {
        message += "🏆 Boss 波次 " + (BOSS_APPEARS_WAVE -1) +"!";
    } else {
        message += "🌊 波次 " + currentWave;
    }
    text(message, width/2, height/2 - 20);
    
    text("⭐ 最终等级: " + player.level, width/2, height/2 + 10);
    text("💰 收集金币: " + player.gold, width/2, height/2 + 40);
    
    // Restart prompt
    fill(colorScheme.success);
    textSize(28);
    text("🎮 点击重新开始 🎮", width / 2, height / 2 + 100);
    
    // Achievement-style messages based on performance
    fill(colorScheme.accent);
    textSize(16);
    if (currentWave >= BOSS_APPEARS_WAVE) {
        text("🏅 恭喜达到Boss战！", width / 2, height - 80);
    } else if (currentWave >= 5) {
        text("🎯 不错的表现！", width / 2, height - 80);
    } else {
        text("💪 下次会更好！", width / 2, height - 80);
    }
}

function mousePressed() {
    // Initialize audio on first user interaction
    if (!audioEnabled) {
        initAudio();
    }
    
    if (gameState === 'start') {
        resetGame();
        gameState = 'playing';
    } else if (gameState === 'playing') {
        if (mouseButton === LEFT) {
            player.shoot();
        }
    } else if (gameState === 'gameOver') {
        resetGame();
        gameState = 'start';
    } else if (gameState === 'talentSelection') {
        for (let i = 0; i < offeredTalents.length; i++) {
            let talent = offeredTalents[i];
            let btnY = height / 2 + i * (talentButtonHeight + talentButtonSpacing) - (talentButtonHeight + talentButtonSpacing);
            let btnX = width / 2;
            let btnWidth = width * 0.6;

            if (mouseX > btnX - btnWidth / 2 && mouseX < btnX + btnWidth / 2 &&
                mouseY > btnY - talentButtonHeight / 2 && mouseY < btnY + talentButtonHeight / 2) {
                talent.apply(player);
                console.log("Talent selected: " + talent.name);
                offeredTalents = []; // Clear offers
                gameState = 'playing';
                break;
            }
        }
    } else if (gameState === 'shop') {
        // "Take Item" Button
        if (shopOfferItem && mouseX > takeItemButton.x - takeItemButton.width / 2 && mouseX < takeItemButton.x + takeItemButton.width / 2 &&
            mouseY > takeItemButton.y - takeItemButton.height / 2 && mouseY < takeItemButton.y + takeItemButton.height / 2) {
            player.addItem(shopOfferItem);
            shopOfferItem = null; // Item taken
            console.log("Took boss item.");
            return; // Prevent other button clicks in same press
        }

        // "Refresh Items" Button
        if (mouseX > refreshItemsButton.x - refreshItemsButton.width / 2 && mouseX < refreshItemsButton.x + refreshItemsButton.width / 2 &&
            mouseY > refreshItemsButton.y - refreshItemsButton.height / 2 && mouseY < refreshItemsButton.y + refreshItemsButton.height / 2) {
            if (player.gold >= REFRESH_COST) {
                player.gold -= REFRESH_COST;
                populateShopItems();
                console.log("Items refreshed. Gold: " + player.gold);
            } else {
                console.log("Not enough gold to refresh!");
                // TODO: Display message on screen
            }
            return;
        }

        // "Next Wave" Button
        if (mouseX > nextWaveButton.x - nextWaveButton.width / 2 && mouseX < nextWaveButton.x + nextWaveButton.width / 2 &&
            mouseY > nextWaveButton.y - nextWaveButton.height / 2 && mouseY < nextWaveButton.y + nextWaveButton.height / 2) {

            currentBoss = null;
            currentWave++;
            enemiesPerWave += 3;
            enemiesSpawnedThisWave = 0;
            enemiesDefeatedThisWave = 0;
            lastEnemySpawnTime = millis();
            gameState = 'playing';
            shopInventory = []; // Clear shop inventory
            buyItemButtons = []; // Clear buy buttons
            // shopOfferItem is already null or handled by "Take Item"
            console.log("Exiting shop. Proceeding to wave " + currentWave);
            return;
        }

        // Buy Item Buttons for shopInventory
        for (let i = 0; i < buyItemButtons.length; i++) {
            let btn = buyItemButtons[i];
            let item = shopInventory[i]; // shopInventory items might be marked sold (e.g. set to null)

            if (item && mouseX > btn.x - btn.width / 2 && mouseX < btn.x + btn.width / 2 &&
                mouseY > btn.y - btn.height / 2 && mouseY < btn.y + btn.height / 2) {

                if (player.gold >= item.cost) {
                    player.gold -= item.cost;
                    player.addItem(item); // Add the actual item object
                    console.log("Bought: " + item.name + " for " + item.cost + " gold. Player gold: " + player.gold);
                    shopInventory.splice(i, 1); // Remove item from shop
                    buyItemButtons.splice(i, 1); // Remove corresponding button
                    // Adjust itemIndex for subsequent buttons if needed, or simply re-evaluate buttons in draw
                } else {
                    console.log("Not enough gold to buy " + item.name);
                    // TODO: Display message on screen
                }
                return; // Process one click at a time
            }
        }
    }
}

function keyPressed() {
    // M key to toggle mute
    if (keyCode === 77 || key === 'm' || key === 'M') {
        if (audioEnabled) {
            audioMuted = !audioMuted;
            console.log("Audio " + (audioMuted ? "muted" : "unmuted"));
        }
    }
    
    if (gameState === 'playing') {
        if (keyCode === 32) { // Spacebar for Dash
            player.attemptDash();
        }
        if (keyCode === 73) { // 'I' key for testing item add
            if (allItems.length > 0) {
                let randomItem = random(allItems);
                player.addItem(randomItem);
            }
        }
    }
    // Removed 'C' key logic for shop, now handled by mousePressed on "Next Wave" button
}

function spawnEnemy() {
    if (enemiesSpawnedThisWave >= enemiesPerWave || isBossBattleActive) return;

    let edge = floor(random(4));
    let x, y;
    let size = random(20,35);
    if (edge === 0) { x = random(width); y = 0 - size / 2; }
    else if (edge === 1) { x = random(width); y = height + size / 2; }
    else if (edge === 2) { x = 0 - size / 2; y = random(height); }
    else { x = width + size / 2; y = random(height); }

    enemies.push(new Enemy(x, y, currentWave));
    enemiesSpawnedThisWave++;
    lastEnemySpawnTime = millis();
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        // Stats that will be reset by resetGame and potentially modified by talents
        this.speed = 3;
        this.fireRate = 250; // ms per shot
        this.projectileDamage = 1;
        this.maxHealth = 10;
        this.dashCooldown = 1000;
        this.dashSpeed = 10;
        this.dashDuration = 150;

        // Core state
        this.health = this.maxHealth;
        this.shields = 0;
        this.maxShields = 5;
        this.projectiles = [];
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 10;
        this.lastShotTime = 0;
        this.isDashing = false;
        this.lastDashTime = -this.dashCooldown;
        this.dashEndTime = 0;

        // Temporary boosts
        this.tempDamageBoost = 0;
        this.tempDamageBoostTime = 0;
        this.tempSpeedBoost = 0;
        this.tempSpeedBoostTime = 0;
        
        // Talent multipliers
        this.powerUpBonus = 1;
        this.goldMultiplier = 1;
        this.xpMultiplier = 1;

        // Item related
        this.inventory = [];
        this.gold = 0;
        
        // Visual feedback
        this.hitFlashTime = 0;
    }

    addItem(item) {
        if (this.inventory.length < 10) { // Max 10 items for example
            this.inventory.push(item);
            item.applyEffect(this); // Apply effect immediately
            console.log("Picked up: " + item.name);
            
            // Pickup effects
            playSound('pickup');
            createExplosion(this.x, this.y, colorScheme.success, 8);
        } else {
            console.log("Inventory full!");
        }
    }

    gainXP(amount) {
        this.xp += amount;
        console.log("Gained " + amount + " XP. Total XP: " + this.xp);
        
        // Subtle XP gain effect
        createExplosion(this.x, this.y, colorScheme.accent, 3);
        
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel; // Carry over excess XP
        if (this.xp < 0) this.xp = 0;
        this.xpToNextLevel = floor(this.xpToNextLevel * 1.5); // Increase XP for next level
        console.log("Level Up! Level: " + this.level + ", XP to next: " + this.xpToNextLevel);
        generateOfferedTalents();
        gameState = 'talentSelection';
    }

    takeDamage(amount) {
        if (this.shields > 0) {
            // Shields absorb damage first
            let shieldDamage = min(amount, this.shields);
            this.shields -= shieldDamage;
            amount -= shieldDamage;
            
            // Shield break effect
            if (shieldDamage > 0) {
                createExplosion(this.x, this.y, [100, 200, 255], 4);
                console.log("Shield absorbed " + shieldDamage + " damage. Shields remaining: " + this.shields);
            }
        }
        
        if (amount > 0) {
            this.health -= amount;
            if (this.health < 0) this.health = 0;
            
            // Add visual and audio feedback for taking health damage
            playSound('hit');
            addScreenShake(5, 10);
            createExplosion(this.x, this.y, [255, 100, 100], 6);
            this.hitFlashTime = millis() + 200; // Flash for 200ms
        }
        
        // Could add invulnerability frames here
    }

    shoot() {
        if (millis() - this.lastShotTime > this.fireRate) {
            let angle = atan2(mouseY - this.y, mouseX - this.x);
            let totalDamage = this.projectileDamage + (this.tempDamageBoost || 0);
            // type 'player', damage, color, speed, size
            this.projectiles.push(new Projectile(this.x, this.y, angle, 'player', totalDamage, color(0, 150, 255), 7, 5));
            this.lastShotTime = millis();
            
            // Play shoot sound
            playSound('shoot');
        }
    }

    update(currentEnemies, boss) {
        // Handle temporary boosts expiration
        if (this.tempDamageBoostTime > 0 && millis() > this.tempDamageBoostTime) {
            this.tempDamageBoost = 0;
            this.tempDamageBoostTime = 0;
            console.log("Damage boost expired");
        }
        
        if (this.tempSpeedBoostTime > 0 && millis() > this.tempSpeedBoostTime) {
            this.tempSpeedBoost = 0;
            this.tempSpeedBoostTime = 0;
            console.log("Speed boost expired");
        }
        
        if (this.isDashing) {
            if (millis() > this.dashEndTime) this.isDashing = false;
        } else {
            this.move();
        }
        this.aim();

        // Player Projectile Logic
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            p.display();
            let projectileHit = false;

            if (boss && isBossBattleActive) {
               if (dist(p.x, p.y, boss.x, boss.y) < p.size / 2 + boss.size / 2) {
                   boss.takeDamage(p.damage);
                   this.projectiles.splice(i, 1);
                   projectileHit = true;
               }
               
               // Check collision with minions
               if (!projectileHit) {
                   for (let k = boss.minions.length - 1; k >= 0; k--) {
                       let minion = boss.minions[k];
                       if (dist(p.x, p.y, minion.x, minion.y) < p.size / 2 + minion.size / 2) {
                           minion.takeDamage(p.damage);
                           this.projectiles.splice(i, 1);
                           projectileHit = true;
                           
                           if (minion.health <= 0) {
                               boss.minions.splice(k, 1);
                           }
                           break;
                       }
                   }
               }
            } else if (!isBossBattleActive) {
                for (let j = currentEnemies.length - 1; j >= 0; j--) {
                    let enemy = currentEnemies[j];
                    if (dist(p.x, p.y, enemy.x, enemy.y) < p.size / 2 + enemy.size / 2) {
                        enemy.takeDamage(p.damage);
                        this.projectiles.splice(i, 1);
                        projectileHit = true;
                        break;
                    }
                }
            }

            if (!projectileHit && p.isOffScreen()) {
                this.projectiles.splice(i, 1);
            }
        }
    }


    move() {
        let currentSpeed = this.speed + (this.tempSpeedBoost || 0);
        if (keyIsDown(87)) { this.y -= currentSpeed; } // W
        if (keyIsDown(83)) { this.y += currentSpeed; } // S
        if (keyIsDown(65)) { this.x -= currentSpeed; } // A
        if (keyIsDown(68)) { this.x += currentSpeed; } // D
        this.x = constrain(this.x, this.size / 2, width - this.size / 2);
        this.y = constrain(this.y, this.size / 2, height - this.size / 2);
    }

    aim() { /* Implicit via mouse */ }

    attemptDash() {
        if (millis() - this.lastDashTime > this.dashCooldown && !this.isDashing) {
            this.isDashing = true;
            this.lastDashTime = millis();
            this.dashEndTime = millis() + this.dashDuration;
            let angle = atan2(mouseY - this.y, mouseX - this.x);
            let dashDistance = this.dashSpeed * 5;
            this.x += cos(angle) * dashDistance;
            this.y += sin(angle) * dashDistance;
            this.x = constrain(this.x, this.size / 2, width - this.size / 2);
            this.y = constrain(this.y, this.size / 2, height - this.size / 2);
        }
    }

    display() {
        push();
        translate(this.x + screenShake.x, this.y + screenShake.y);
        
        // Hit flash effect
        if (millis() < this.hitFlashTime) {
            fill(255, 100, 100); // Red flash when hit
        } else {
            fill(50, 150, 250); // Normal blue color
        }
        
        noStroke();
        ellipse(0, 0, this.size, this.size);
        
        // Player direction indicator (gun barrel)
        let angle = atan2(mouseY - this.y, mouseX - this.x);
        rotate(angle);
        stroke(255);
        strokeWeight(3);
        line(0, 0, this.size / 2 + 10, 0);
        
        // Add emoji face
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(16);
        text("🚀", 0, 0);
        
        pop();
    }
}

class Projectile {
    constructor(x, y, angle, type, damage, pColor, speed, size) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.type = type; // 'player', 'enemy', 'boss'
        this.damage = damage;
        this.pColor = pColor;
        this.speed = speed;
        this.size = size;
    }
    update() {
        this.x += cos(this.angle) * this.speed;
        this.y += sin(this.angle) * this.speed;
    }
    display() {
        push();
        translate(this.x + screenShake.x, this.y + screenShake.y);
        
        // Projectile glow effect
        fill(this.pColor);
        noStroke();
        ellipse(0, 0, this.size + 2, this.size + 2);
        
        // Inner bright core
        fill(255, 200);
        ellipse(0, 0, this.size * 0.6, this.size * 0.6);
        
        // Add trail particles occasionally
        if (random() < 0.3) {
            let trailColor = [red(this.pColor), green(this.pColor), blue(this.pColor)];
            particles.push(new Particle(this.x, this.y, trailColor, this.size * 0.5));
        }
        
        pop();
    }
    isOffScreen() {
        return (this.x < -this.size || this.x > width + this.size || this.y < -this.size || this.y > height + this.size);
    }
}

class Enemy {
    constructor(x, y, wave = 1) {
        this.x = x;
        this.y = y;
        this.size = random(20, 35);

        this.speed = random(0.5, 1.2) + (wave-1) * 0.05; // Slight increase per wave
        this.health = floor(random(2, 4)) + floor((wave-1) * 0.5); // Slight increase per wave
        this.xpValue = 5 + (wave-1); // More XP for later wave enemies
        this.goldValue = floor(random(1, 3)) + floor(wave / 2); // e.g. 1-2 base, +1 every 2 waves

        this.attackCooldown = 2500 - (wave-1)*50; // Attack slightly faster in later waves
        if (this.attackCooldown < 1000) this.attackCooldown = 1000;
        this.lastAttackTime = millis() + random(-500, 500); // Stagger initial attacks
        this.projectileDamage = 1 + floor((wave-1)*0.2);

        this.projectiles = [];

        let r = map(this.health, 2, 6, 100, 200);
        let g = map(this.speed, 0.5, 2, 200, 50);
        let b = map(this.size, 20, 35, 50, 150);
        this.color = color(r, g, b, 220);
    }

    shootAttack(player) {
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        // type 'enemy', damage, color, speed, size
        this.projectiles.push(new Projectile(this.x, this.y, angleToPlayer, 'enemy', this.projectileDamage, color(255,200,0), 3, 8));
    }

    update(player) {
        this.moveTowardsPlayer(player);

        if (millis() - this.lastAttackTime > this.attackCooldown) {
            this.shootAttack(player);
            this.lastAttackTime = millis();
        }

        // Enemy Projectile Logic
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            p.display();
            if (dist(player.x, player.y, p.x, p.y) < player.size / 2 + p.size / 2) {
                player.takeDamage(p.damage);
                this.projectiles.splice(i, 1);
                // No direct game over check here, runGame loop handles it
            } else if (p.isOffScreen()) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    moveTowardsPlayer(player) {
        let angle = atan2(player.y - this.y, player.x - this.x);
        this.x += cos(angle) * this.speed;
        this.y += sin(angle) * this.speed;
    }
    display() {
        push();
        translate(this.x + screenShake.x, this.y + screenShake.y);
        
        // Enemy body
        fill(this.color);
        stroke(0);
        strokeWeight(2);
        ellipse(0, 0, this.size, this.size);
        
        // Enemy face emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.6);
        text("👹", 0, 0);
        
        pop();
    }
    takeDamage(amount) { // Called by player projectiles
        this.health -= amount;
        
        // Hit effects
        createExplosion(this.x, this.y, [255, 150, 50], 4);
        
        if (this.health <= 0) {
            let xpGain = ceil(this.xpValue * (player.xpMultiplier || 1));
            let goldGain = ceil(this.goldValue * (player.goldMultiplier || 1));
            
            player.gainXP(xpGain); // Grant XP from here  
            player.gold += goldGain;
            console.log("Enemy defeated. XP: +" + xpGain + ", Gold: +" + goldGain + ", Total gold: " + player.gold);
            
            // Power-up drop chance
            if (random() < POWER_UP_DROP_CHANCE) {
                let powerUpType = random(POWER_UP_TYPES);
                powerUps.push(new PowerUp(this.x, this.y, powerUpType));
                console.log("Power-up dropped: " + powerUpType);
            }
            
            // Death explosion
            createExplosion(this.x, this.y, [255, 100, 50], 12);
            playSound('explosion');
            addScreenShake(3, 8);
            
            // The enemy object will be spliced from enemies array in runGame loop
        }
    }
}

class Boss {
    constructor(x, y, variant = 'standard') {
        this.x = x;
        this.y = y;
        this.size = 70;
        this.speed = 0.6;
        this.health = 60 + (currentWave - (BOSS_APPEARS_WAVE -1)) * 10; // Scale health if re-appears
        this.maxHealth = this.health;
        this.color = color(80, 0, 120);
        this.variant = variant;
        this.phase = 1;
        this.maxPhases = 3;

        this.attackCooldown = 1500;
        this.lastAttackTime = millis();
        this.projectiles = []; // Renamed from bossProjectiles for consistency
        this.minions = [];
        this.xpValue = 50;
        this.projectileDamage = 2 + floor((currentWave - (BOSS_APPEARS_WAVE -1))*0.5);
        this.goldValue = 25 + floor((currentWave - (BOSS_APPEARS_WAVE -1))*5); // e.g. 25 base, +5 per boss cycle
        
        // Pattern-specific variables
        this.sweepAngle = 0;
        this.beamChargeTime = 0;
        this.beamDuration = 0;
        this.isChargingBeam = false;
        this.isFiringBeam = false;
        this.lastMinionSpawn = 0;
        this.minionSpawnCooldown = 8000; // 8 seconds
    }

    getDroppedItem() {
        const rareItems = allItems.filter(item => item.rarity === 'rare' || item.rarity === 'legendary');
        if (rareItems.length > 0) {
            return random(rareItems);
        }
        return null; // Should not happen if allItems is populated correctly
    }

    update(player) {
        // Update phase based on health
        let healthPercent = this.health / this.maxHealth;
        if (healthPercent > 0.66) {
            this.phase = 1;
        } else if (healthPercent > 0.33) {
            this.phase = 2;
        } else {
            this.phase = 3;
        }
        
        this.move(player);
        
        // Different attack patterns based on variant and phase
        this.handleAttackPattern(player);
        
        // Update minions
        for (let i = this.minions.length - 1; i >= 0; i--) {
            this.minions[i].update(player);
            if (this.minions[i].health <= 0) {
                // Minion death effects
                createExplosion(this.minions[i].x, this.minions[i].y, [255, 100, 50], 8);
                this.minions.splice(i, 1);
            }
        }

        // Boss Projectile Logic
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            p.display();

            if (dist(player.x, player.y, p.x, p.y) < player.size/2 + p.size/2) {
                player.takeDamage(p.damage);
                this.projectiles.splice(i,1);
            } else if (p.isOffScreen()) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Handle beam attack
        if (this.isFiringBeam) {
            this.drawBeam(player);
            this.beamDuration -= 16; // Approximate frame time
            if (this.beamDuration <= 0) {
                this.isFiringBeam = false;
            }
            
            // Beam damage detection
            if (this.beamHitsPlayer(player)) {
                player.takeDamage(this.projectileDamage * 2); // Beam does double damage
            }
        }
    }

    move(player) {
        let targetX = player.x;
        if (abs(this.x - targetX) > 50) {
             if (this.x < targetX) this.x += this.speed;
             if (this.x > targetX) this.x -= this.speed;
        }
        this.y += sin(millis() / 500) * 0.3;
        this.x = constrain(this.x, this.size/2, width - this.size/2);
        this.y = constrain(this.y, this.size/2, height/2);
    }

    handleAttackPattern(player) {
        switch(this.variant) {
            case 'sweeper':
                this.handleSweeperPattern(player);
                break;
            case 'summoner':
                this.handleSummonerPattern(player);
                break;
            case 'beamer':
                this.handleBeamerPattern(player);
                break;
            default:
                this.handleStandardPattern(player);
        }
    }
    
    handleStandardPattern(player) {
        if (millis() - this.lastAttackTime > this.attackCooldown) {
            this.shootAttack(player);
            this.lastAttackTime = millis();
        }
    }
    
    handleSweeperPattern(player) {
        if (millis() - this.lastAttackTime > this.attackCooldown / 2) { // Faster attacks
            this.sweepAttack(player);
            this.lastAttackTime = millis();
        }
    }
    
    handleSummonerPattern(player) {
        if (millis() - this.lastAttackTime > this.attackCooldown) {
            this.shootAttack(player);
            this.lastAttackTime = millis();
        }
        
        // Spawn minions
        if (millis() - this.lastMinionSpawn > this.minionSpawnCooldown && this.minions.length < this.phase + 1) {
            this.spawnMinion();
            this.lastMinionSpawn = millis();
        }
    }
    
    handleBeamerPattern(player) {
        if (!this.isChargingBeam && !this.isFiringBeam && millis() - this.lastAttackTime > this.attackCooldown) {
            if (random() < 0.3) { // 30% chance for beam attack
                this.startBeamAttack();
            } else {
                this.shootAttack(player);
            }
            this.lastAttackTime = millis();
        }
        
        if (this.isChargingBeam) {
            this.beamChargeTime -= 16;
            if (this.beamChargeTime <= 0) {
                this.isChargingBeam = false;
                this.isFiringBeam = true;
                this.beamDuration = 2000; // 2 second beam
            }
        }
    }

    shootAttack(player) {
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        let bulletCount = this.phase + 2; // More bullets per phase
        for (let i = 0; i < bulletCount; i++) {
            let spreadAngle = (i - bulletCount/2) * PI / 12;
            let currentAngle = angleToPlayer + spreadAngle;
            // type 'boss', damage, color, speed, size
            this.projectiles.push(new Projectile(this.x, this.y, currentAngle, 'boss', this.projectileDamage, color(255, 100, 0), 4, 10));
        }
    }
    
    sweepAttack(player) {
        let bulletCount = 5 + this.phase; // More bullets in higher phases
        for (let i = 0; i < bulletCount; i++) {
            let angle = this.sweepAngle + (i * PI / bulletCount);
            this.projectiles.push(new Projectile(this.x, this.y, angle, 'boss', this.projectileDamage, color(255, 150, 0), 3, 8));
        }
        this.sweepAngle += PI / 8; // Rotate sweep pattern
    }
    
    spawnMinion() {
        let spawnX = this.x + random(-100, 100);
        let spawnY = this.y + random(50, 100);
        spawnX = constrain(spawnX, 50, width - 50);
        spawnY = constrain(spawnY, 50, height - 50);
        
        this.minions.push(new BossMinion(spawnX, spawnY));
        console.log("Boss spawned a minion!");
    }
    
    startBeamAttack() {
        this.isChargingBeam = true;
        this.beamChargeTime = 1500; // 1.5 second charge time
        console.log("Boss charging beam attack!");
    }
    
    drawBeam(player) {
        push();
        stroke(255, 0, 0, 200);
        strokeWeight(15);
        line(this.x, this.y, player.x, player.y);
        
        // Beam core
        stroke(255, 255, 255, 255);
        strokeWeight(5);
        line(this.x, this.y, player.x, player.y);
        pop();
        
        // Beam particles
        for (let i = 0; i < 3; i++) {
            let t = i / 3;
            let beamX = lerp(this.x, player.x, t) + random(-10, 10);
            let beamY = lerp(this.y, player.y, t) + random(-10, 10);
            particles.push(new Particle(beamX, beamY, [255, 100, 100], 8));
        }
    }
    
    beamHitsPlayer(player) {
        // Simple distance check for beam collision
        let d = dist(this.x, this.y, player.x, player.y);
        if (d < 300) { // Beam range
            return true;
        }
        return false;
    }

    takeDamage(amount) { // Called by player projectiles
        this.health -= amount;
        
        // Boss hit effects - more intense than regular enemies
        createExplosion(this.x, this.y, [255, 50, 50], 8);
        addScreenShake(7, 12);
        
        if (this.health <= 0) {
            // XP is granted in runGame for boss, gold can be granted here or there.
            // For consistency with Enemy, let's add it here.
            player.gold += this.goldValue;
            console.log("Boss defeated. Player gold: " + player.gold);
            
            // Epic boss death explosion
            createExplosion(this.x, this.y, [255, 255, 0], 25);
            playSound('explosion');
            addScreenShake(15, 30);
            
            // Other boss defeat logic (portal, etc.) is in runGame
        }
    }

    display() {
        push();
        translate(this.x + screenShake.x, this.y + screenShake.y);
        
        // Boss charging effect
        if (this.isChargingBeam) {
            let chargeIntensity = map(1500 - this.beamChargeTime, 0, 1500, 0, 100);
            fill(255, 0, 0, chargeIntensity);
            noStroke();
            ellipse(0, 0, this.size + 30, this.size + 30);
        }
        
        // Boss body with variant colors
        let bossColor = this.getBossColor();
        fill(bossColor);
        stroke(0);
        strokeWeight(3);
        rectMode(CENTER);
        rect(0, 0, this.size, this.size);
        
        // Boss face emoji based on variant
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.8);
        text(this.getBossEmoji(), 0, 0);
        
        pop();
        
        // Display minions
        for (let minion of this.minions) {
            minion.display();
        }
        
        // Health bar (not affected by screen shake)
        this.drawHealthBar();
        rectMode(CORNER);
    }
    
    getBossColor() {
        switch(this.variant) {
            case 'sweeper': return color(255, 100, 0); // Orange
            case 'summoner': return color(150, 0, 255); // Purple
            case 'beamer': return color(255, 0, 100); // Red-pink
            default: return color(80, 0, 120); // Dark purple
        }
    }
    
    getBossEmoji() {
        switch(this.variant) {
            case 'sweeper': return '🌀';
            case 'summoner': return '👑';
            case 'beamer': return '👁️';
            default: return '💀';
        }
    }

    drawHealthBar() {
        rectMode(CORNER);
        let barWidth = this.size * 1.5;
        let barHeight = 12;
        let xPos = this.x - barWidth / 2;
        let yPos = this.y - this.size / 2 - barHeight - 8;

        fill(50);
        rect(xPos, yPos, barWidth, barHeight);

        let currentHealthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);
        if (currentHealthWidth < 0) currentHealthWidth = 0;
        fill(255,0,0);
        rect(xPos, yPos, currentHealthWidth, barHeight);

        noFill();
        stroke(0);
        rect(xPos, yPos, barWidth, barHeight);
    }
}

// Boss Minion class
class BossMinion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 25;
        this.speed = 1.2;
        this.health = 3;
        this.maxHealth = 3;
        this.color = color(150, 100, 200);
        this.projectiles = [];
        this.attackCooldown = 3000;
        this.lastAttackTime = millis() + random(-1000, 1000);
        this.projectileDamage = 1;
    }
    
    update(player) {
        // Move towards player
        let angle = atan2(player.y - this.y, player.x - this.x);
        this.x += cos(angle) * this.speed;
        this.y += sin(angle) * this.speed;
        
        // Attack player
        if (millis() - this.lastAttackTime > this.attackCooldown) {
            this.shootAttack(player);
            this.lastAttackTime = millis();
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            p.display();
            
            if (dist(player.x, player.y, p.x, p.y) < player.size/2 + p.size/2) {
                player.takeDamage(p.damage);
                this.projectiles.splice(i, 1);
            } else if (p.isOffScreen()) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    shootAttack(player) {
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        this.projectiles.push(new Projectile(this.x, this.y, angleToPlayer, 'enemy', this.projectileDamage, color(200, 100, 255), 2, 6));
    }
    
    takeDamage(amount) {
        this.health -= amount;
        createExplosion(this.x, this.y, [200, 100, 255], 3);
        
        if (this.health <= 0) {
            // Small XP and gold reward
            player.gainXP(2);
            player.gold += 1;
        }
    }
    
    display() {
        push();
        translate(this.x + screenShake.x, this.y + screenShake.y);
        
        fill(this.color);
        stroke(0);
        strokeWeight(1);
        ellipse(0, 0, this.size, this.size);
        
        // Minion emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.6);
        text("👻", 0, 0);
        
        pop();
    }
}
