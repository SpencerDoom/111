// Main Game class that coordinates all systems
class Game {
    constructor() {
        // Game systems
        this.gameState = new GameState();
        this.waveManager = new WaveManager();
        this.collisionManager = new CollisionManager();
        this.uiManager = new UIManager();
        this.particleSystem = new ParticleSystem();
        this.screenShake = new ScreenShake();
        this.starField = new StarField(150);
        
        // Game entities
        this.player = null;
        this.enemies = [];
        this.powerUps = [];
        
        // Game settings
        this.audioEnabled = false;
        this.audioMuted = false;
        
        // Talent system
        this.allTalents = [
            { 
                id: 'hp_boost', 
                name: "+2 Max Health", 
                description: "Increase maximum health by 2 and heal to full.", 
                apply: (p) => { 
                    p.maxHealth += 2; 
                    p.health = p.maxHealth; 
                } 
            },
            { 
                id: 'damage_boost', 
                name: "+1 Damage", 
                description: "Increase projectile damage by 1.", 
                apply: (p) => { 
                    p.projectileDamage += 1; 
                } 
            },
            { 
                id: 'speed_boost', 
                name: "+Speed", 
                description: "Increase movement speed and acceleration.", 
                apply: (p) => { 
                    p.maxSpeed += 0.5; 
                    p.acceleration += 0.1; 
                } 
            },
            { 
                id: 'fire_rate', 
                name: "Faster Shooting", 
                description: "Reduce shooting cooldown by 50ms.", 
                apply: (p) => { 
                    p.shotCooldown = Math.max(100, p.shotCooldown - 50); 
                } 
            },
            { 
                id: 'dash_cooldown', 
                name: "Dash Mastery", 
                description: "Reduce dash cooldown by 500ms.", 
                apply: (p) => { 
                    p.dashCooldown = Math.max(500, p.dashCooldown - 500); 
                } 
            }
        ];
        
        this.availableTalents = [];
        
        // Portal system
        this.portalPosition = { x: null, y: null, active: false };
        this.portalSize = 50;
    }
    
    initialize() {
        // Initialize game state
        this.player = new Player(width / 2, height - 100);
        this.enemies = [];
        this.powerUps = [];
        this.gameState.setState('start');
        
        // Initialize audio system placeholder
        this.initializeAudio();
        
        console.log("Game initialized");
    }
    
    initializeAudio() {
        // Placeholder for audio initialization
        // In a full implementation, this would load sound files
        this.audioEnabled = true;
    }
    
    update() {
        // Update screen shake
        this.screenShake.update();
        
        // Handle different game states
        switch(this.gameState.getState()) {
            case 'playing':
                this.updatePlaying();
                break;
            case 'levelUp':
                this.updateLevelUp();
                break;
            case 'gameOver':
                this.updateGameOver();
                break;
            case 'shop':
                this.updateShop();
                break;
        }
        
        // Always update visual systems
        this.starField.update();
        this.particleSystem.update();
    }
    
    updatePlaying() {
        // Update player
        this.player.update();
        
        // Check if player is dead
        if (this.player.isDead()) {
            this.gameState.gameOver();
            return;
        }
        
        // Update wave manager and enemies
        this.waveManager.update(this.enemies, this.player);
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];
            enemy.update(this.player);
            
            // Remove dead or off-screen enemies
            if (enemy.isDead() || enemy.isOffScreen()) {
                if (enemy.isDead()) {
                    // Give rewards
                    this.player.gainXP(enemy.xpValue);
                    this.player.gold += enemy.goldValue;
                    
                    // Chance to drop powerup
                    if (random() < 0.15) { // 15% chance
                        this.powerUps.push(createRandomPowerUp(enemy.x, enemy.y));
                    }
                    
                    // Create death effect
                    this.addExplosion(enemy.x, enemy.y, [255, 100, 100], 5);
                    this.waveManager.onEnemyDefeated();
                }
                this.enemies.splice(i, 1);
            }
        }
        
        // Update boss if active
        if (this.waveManager.isBossActive()) {
            let boss = this.waveManager.getBoss();
            boss.update(this.player);
            
            if (boss.isDead()) {
                // Boss defeated - handled by wave manager
                this.player.gainXP(boss.xpValue);
                this.player.gold += boss.goldValue;
                this.addExplosion(boss.x, boss.y, [255, 255, 0], 20);
                this.addScreenShake(15, 30);
            }
        }
        
        // Update powerups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            let powerUp = this.powerUps[i];
            powerUp.update(this.player);
            
            if (powerUp.collected || powerUp.isExpired()) {
                this.powerUps.splice(i, 1);
            }
        }
        
        // Handle collisions
        this.handleCollisions();
        
        // Update portal
        this.updatePortal();
    }
    
    updateLevelUp() {
        // Handle talent selection in input handling
        // This state just waits for player input
    }
    
    updateGameOver() {
        // Handle restart in input handling
    }
    
    updateShop() {
        // Handle shop interactions
    }
    
    handleCollisions() {
        // Player projectiles vs enemies
        for (let i = this.player.projectiles.length - 1; i >= 0; i--) {
            let projectile = this.player.projectiles[i];
            let hit = false;
            
            // Check regular enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                let enemy = this.enemies[j];
                if (checkCircleCollision(projectile, enemy)) {
                    enemy.takeDamage(projectile.damage);
                    this.player.projectiles.splice(i, 1);
                    hit = true;
                    break;
                }
            }
            
            // Check boss and minions
            if (!hit && this.waveManager.isBossActive()) {
                let boss = this.waveManager.getBoss();
                
                // Check boss
                if (checkCircleCollision(projectile, boss)) {
                    boss.takeDamage(projectile.damage);
                    this.player.projectiles.splice(i, 1);
                    hit = true;
                } else {
                    // Check minions
                    for (let k = boss.minions.length - 1; k >= 0; k--) {
                        let minion = boss.minions[k];
                        if (checkCircleCollision(projectile, minion)) {
                            minion.takeDamage(projectile.damage);
                            this.player.projectiles.splice(i, 1);
                            hit = true;
                            
                            if (minion.isDead()) {
                                boss.minions.splice(k, 1);
                            }
                            break;
                        }
                    }
                }
            }
        }
        
        // Enemy projectiles vs player (handled in enemy update methods)
        // PowerUps vs player (handled in powerup update methods)
    }
    
    updatePortal() {
        if (this.portalPosition.active) {
            // Check if player enters portal
            let distance = dist(this.player.x, this.player.y, this.portalPosition.x, this.portalPosition.y);
            if (distance < this.portalSize/2 + this.player.size/2) {
                this.gameState.openShop();
                this.portalPosition.active = false;
            }
        }
    }
    
    draw() {
        // Clear screen
        background(this.uiManager.colorScheme.background);
        
        // Draw starfield background
        this.starField.display();
        
        // Apply screen shake
        let shakeOffset = this.screenShake.getOffset();
        push();
        translate(shakeOffset.x, shakeOffset.y);
        
        // Handle different game states
        switch(this.gameState.getState()) {
            case 'start':
                this.drawStart();
                break;
            case 'playing':
                this.drawPlaying();
                break;
            case 'levelUp':
                this.drawLevelUp();
                break;
            case 'gameOver':
                this.drawGameOver();
                break;
            case 'shop':
                this.drawShop();
                break;
        }
        
        pop();
        
        // Draw particles (not affected by screen shake)
        this.particleSystem.display();
    }
    
    drawStart() {
        this.uiManager.drawStartScreen();
    }
    
    drawPlaying() {
        // Draw game entities
        this.player.display();
        
        // Draw enemies
        for (let enemy of this.enemies) {
            enemy.display();
        }
        
        // Draw boss if active
        if (this.waveManager.isBossActive()) {
            let boss = this.waveManager.getBoss();
            // Pass player reference for beam drawing
            if (boss.isFiringBeam) {
                boss.drawBeam(this.player);
            }
            boss.display();
        }
        
        // Draw powerups
        for (let powerUp of this.powerUps) {
            powerUp.display();
        }
        
        // Draw portal
        if (this.portalPosition.active) {
            this.drawPortal();
        }
        
        // Draw HUD (not affected by screen shake)
        push();
        translate(-this.screenShake.x, -this.screenShake.y);
        this.uiManager.drawHUD(this.player, this.waveManager);
        
        // Draw boss health bar if boss is active
        if (this.waveManager.isBossActive()) {
            this.uiManager.drawBossHealthBar(this.waveManager.getBoss());
        }
        pop();
    }
    
    drawLevelUp() {
        // Draw game in background (dimmed)
        this.drawPlaying();
        
        // Draw level up screen over it
        push();
        translate(-this.screenShake.x, -this.screenShake.y);
        this.uiManager.drawLevelUpScreen(this.availableTalents);
        pop();
    }
    
    drawGameOver() {
        // Draw game in background (dimmed)
        this.drawPlaying();
        
        // Draw game over screen
        push();
        translate(-this.screenShake.x, -this.screenShake.y);
        this.uiManager.drawGameOverScreen(this.player, this.waveManager);
        pop();
    }
    
    drawShop() {
        // Draw shop screen
        push();
        translate(-this.screenShake.x, -this.screenShake.y);
        this.uiManager.drawShopScreen(this.player);
        pop();
    }
    
    drawPortal() {
        push();
        translate(this.portalPosition.x, this.portalPosition.y);
        
        // Portal animation
        let pulseSize = this.portalSize + sin(millis() * 0.01) * 10;
        
        // Outer glow
        fill(100, 200, 255, 100);
        noStroke();
        ellipse(0, 0, pulseSize + 20, pulseSize + 20);
        
        // Main portal
        fill(50, 150, 255);
        stroke(255);
        strokeWeight(3);
        ellipse(0, 0, pulseSize, pulseSize);
        
        // Portal emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.portalSize * 0.6);
        text("🌀", 0, 0);
        
        pop();
    }
    
    // Input handling
    handleMousePressed() {
        switch(this.gameState.getState()) {
            case 'start':
                this.startGame();
                break;
            case 'playing':
                this.player.shoot();
                break;
            case 'gameOver':
                this.restartGame();
                break;
        }
    }
    
    handleMousePressed2() { // Right click
        if (this.gameState.isState('playing')) {
            this.player.attemptDash();
        }
    }
    
    handleKeyPressed() {
        if (this.gameState.isState('levelUp')) {
            this.handleTalentSelection();
        } else if (this.gameState.isState('shop')) {
            if (key === 'Escape') {
                this.gameState.continuePlaying();
            }
        }
    }
    
    handleTalentSelection() {
        let selection = -1;
        if (key === '1') selection = 0;
        else if (key === '2') selection = 1;
        else if (key === '3') selection = 2;
        
        if (selection >= 0 && selection < this.availableTalents.length) {
            let selectedTalent = this.availableTalents[selection];
            selectedTalent.apply(this.player);
            console.log(`Applied talent: ${selectedTalent.name}`);
            
            this.gameState.continuePlaying();
        }
    }
    
    startGame() {
        this.initialize();
        this.gameState.startGame();
        console.log("Game started!");
    }
    
    restartGame() {
        this.initialize();
        this.gameState.startGame();
        console.log("Game restarted!");
    }
    
    triggerLevelUp() {
        // Generate 3 random talents
        this.availableTalents = [];
        let shuffledTalents = [...this.allTalents].sort(() => 0.5 - Math.random());
        for (let i = 0; i < Math.min(3, shuffledTalents.length); i++) {
            this.availableTalents.push(shuffledTalents[i]);
        }
        
        this.gameState.triggerLevelUp();
    }
    
    // Utility methods
    addExplosion(x, y, color, particleCount = 10) {
        let particles = createExplosion(x, y, color, particleCount);
        for (let particle of particles) {
            this.particleSystem.addParticle(particle);
        }
    }
    
    addScreenShake(intensity, duration) {
        this.screenShake.start(intensity, duration);
    }
    
    playSound(soundName) {
        if (!this.audioEnabled || this.audioMuted) return;
        
        // Placeholder for audio system
        console.log(`Playing sound: ${soundName}`);
    }
    
    createPortal(x, y) {
        this.portalPosition.x = x;
        this.portalPosition.y = y;
        this.portalPosition.active = true;
        console.log("Portal created!");
    }
}

// Global functions for compatibility with existing code
function createExplosion(x, y, color, particleCount = 10) {
    return Array.from({length: particleCount}, () => 
        new ExplosionParticle(x, y, color, random(3, 8), 1)
    );
}

function addScreenShake(intensity, duration) {
    if (typeof game !== 'undefined') {
        game.addScreenShake(intensity, duration);
    }
}

function playSound(soundName) {
    if (typeof game !== 'undefined') {
        game.playSound(soundName);
    }
}