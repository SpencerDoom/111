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
        this.achievementSystem = new AchievementSystem();
        this.environmentSystem = new EnvironmentSystem();
        
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
            },
            // New talents
            { 
                id: 'piercing_shots', 
                name: "Piercing Shots", 
                description: "Projectiles pierce through 2 additional enemies.", 
                apply: (p) => { 
                    p.piercingCount = (p.piercingCount || 0) + 2; 
                } 
            },
            { 
                id: 'spread_shot', 
                name: "Spread Shot", 
                description: "Shoot 3 bullets in a spread pattern.", 
                apply: (p) => { 
                    p.spreadShot = true; 
                } 
            },
            { 
                id: 'auto_heal', 
                name: "Regeneration", 
                description: "Regenerate 1 health every 5 seconds.", 
                apply: (p) => { 
                    p.regenRate = 2000; // Every 2 seconds
                    p.lastRegenTime = millis();
                } 
            },
            { 
                id: 'shield', 
                name: "Energy Shield", 
                description: "Gain a shield that blocks 3 hits.", 
                apply: (p) => { 
                    p.shield = (p.shield || 0) + 3; 
                    p.maxShield = p.shield; 
                } 
            },
            { 
                id: 'explosive_rounds', 
                name: "Explosive Rounds", 
                description: "Projectiles explode on hit, dealing area damage.", 
                apply: (p) => { 
                    p.explosiveShots = true; 
                } 
            },
            { 
                id: 'multi_shot', 
                name: "Multi Shot", 
                description: "Shoot 2 additional projectiles.", 
                apply: (p) => { 
                    p.projectileCount = (p.projectileCount || 1) + 2; 
                } 
            },
            { 
                id: 'vampirism', 
                name: "Vampirism", 
                description: "Heal 1 health for each enemy defeated.", 
                apply: (p) => { 
                    p.vampiric = true; 
                } 
            },
            { 
                id: 'gold_magnet', 
                name: "Gold Magnet", 
                description: "Attract gold automatically.", 
                apply: (p) => { 
                    p.goldMagnet = true; 
                } 
            },
            { 
                id: 'double_jump', 
                name: "Double Dash", 
                description: "Dash distance doubled and faster recharge.", 
                apply: (p) => { 
                    p.dashDistance *= 2; 
                    p.dashCooldown = Math.max(300, p.dashCooldown - 200); 
                } 
            },
            { 
                id: 'crit_chance', 
                name: "Critical Strike", 
                description: "20% chance to deal double damage.", 
                apply: (p) => { 
                    p.critChance = (p.critChance || 0) + 0.2; 
                } 
            },
            { 
                id: 'size_reduction', 
                name: "Agility Training", 
                description: "Reduce hitbox size by 20%.", 
                apply: (p) => { 
                    p.size *= 0.8; 
                } 
            },
            { 
                id: 'poison_resistance', 
                name: "Poison Resistance", 
                description: "Immune to poison damage.", 
                apply: (p) => { 
                    p.poisonImmune = true; 
                } 
            },
            { 
                id: 'knockback', 
                name: "Knockback Force", 
                description: "Projectiles push enemies back.", 
                apply: (p) => { 
                    p.knockbackForce = (p.knockbackForce || 0) + 5; 
                } 
            }
        ];
        
        this.availableTalents = [];
        
        // Portal system
        this.portalPosition = { x: null, y: null, active: false };
        this.portalSize = 50;
        
        // Game statistics for achievements and progression
        this.totalKills = 0;
        this.totalPowerUpsCollected = 0;
        this.totalGoldCollected = 0;
        this.totalShieldPoints = 0;
        this.totalExplosions = 0;
        this.totalCriticalHits = 0;
        this.totalTalentsSelected = 0;
        this.bossesDefeated = 0;
        this.damageFreeWaves = 0;
        this.elapsedTime = 0;
        this.recentKills = 0;
        this.recentKillTimeWindow = 0;
        this.lastKillTime = 0;
        this.waveStartTime = 0;
        this.waveTookDamage = false;
        this.inWave = false;
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
        // Update elapsed time
        if (this.gameState.getState() === 'playing') {
            this.elapsedTime += deltaTime;
        }
        
        // Update screen shake
        this.screenShake.update();
        
        // Update achievement system
        this.achievementSystem.update(this);
        
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
        // Track wave start for achievements
        if (!this.inWave && this.waveManager.getCurrentWave() > 0) {
            this.inWave = true;
            this.waveStartTime = millis();
            this.waveTookDamage = false;
        }
        
        // Update player
        this.player.update();
        
        // Check if player is dead
        if (this.player.isDead()) {
            this.gameState.gameOver();
            return;
        }
        
        // Update wave manager and enemies
        this.waveManager.update(this.enemies, this.player);
        
        // Update environment system
        this.environmentSystem.update(this);
        
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
                    
                    // Track gold collection
                    this.totalGoldCollected += enemy.goldValue;
                    
                    // Chance to drop powerup
                    if (random() < 0.15) { // 15% chance
                        this.powerUps.push(createRandomPowerUp(enemy.x, enemy.y));
                    }
                    
                    // Track achievements
                    this.totalKills++;
                    this.recentKills++;
                    this.lastKillTime = millis();
                    
                    // Check if recent kill window should reset
                    if (this.recentKillTimeWindow <= 0) {
                        this.recentKillTimeWindow = 30000; // 30 seconds
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
                this.totalKills++;
                this.bossesDefeated++;
                this.addExplosion(boss.x, boss.y, [255, 255, 0], 20);
                this.addScreenShake(15, 30);
            }
        }
        
        // Update powerups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            let powerUp = this.powerUps[i];
            powerUp.update(this.player);
            
            if (powerUp.collected || powerUp.isExpired()) {
                if (powerUp.collected) {
                    this.totalPowerUpsCollected++;
                }
                this.powerUps.splice(i, 1);
            }
        }
        
        // Handle collisions
        this.handleCollisions();
        
        // Check environmental collisions
        this.environmentSystem.checkCollisions(this);
        
        // Update recent kills timer
        if (this.recentKillTimeWindow > 0) {
            this.recentKillTimeWindow -= deltaTime;
            if (this.recentKillTimeWindow <= 0) {
                this.recentKills = 0;
            }
        }
        
        // Check for damage-free wave completion
        if (this.inWave && this.waveManager.isWaveComplete(this.enemies)) {
            if (!this.waveTookDamage) {
                this.damageFreeWaves++;
            }
            this.inWave = false;
        }
        
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
                    let removeProjectile = this.handleProjectileCollision(projectile, enemy);
                    if (removeProjectile) {
                        this.player.projectiles.splice(i, 1);
                    }
                    hit = true;
                    break;
                }
            }
            
            // Check boss and minions
            if (!hit && this.waveManager.isBossActive()) {
                let boss = this.waveManager.getBoss();
                
                // Check boss
                if (checkCircleCollision(projectile, boss)) {
                    let removeProjectile = this.handleProjectileCollision(projectile, boss);
                    if (removeProjectile) {
                        this.player.projectiles.splice(i, 1);
                    }
                    hit = true;
                } else {
                    // Check minions
                    for (let k = boss.minions.length - 1; k >= 0; k--) {
                        let minion = boss.minions[k];
                        if (checkCircleCollision(projectile, minion)) {
                            let removeProjectile = this.handleProjectileCollision(projectile, minion);
                            if (removeProjectile) {
                                this.player.projectiles.splice(i, 1);
                            }
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
    
    handleProjectileCollision(projectile, target) {
        // Calculate damage with critical hits
        let actualDamage = projectile.damage;
        if (projectile.isCritical) {
            actualDamage *= 2; // Double damage on crit
        }
        
        // Apply damage to target
        target.takeDamage(actualDamage);
        
        // Apply knockback if projectile has knockback force
        if (projectile.knockbackForce && projectile.knockbackForce > 0) {
            let angle = atan2(target.y - projectile.y, target.x - projectile.x);
            target.x += cos(angle) * projectile.knockbackForce;
            target.y += sin(angle) * projectile.knockbackForce;
        }
        
        // Handle special projectile effects
        if (projectile.type === 'player') {
            // Player projectile hit enemy
            if (target.poisonEffect && !this.player.poisonImmune) {
                // Apply poison effect
                target.poisoned = true;
                target.poisonEndTime = millis() + 3000; // 3 seconds
                target.poisonDamage = 1;
            }
            
            if (projectile.slowEffect) {
                // Apply slow effect
                target.slowed = true;
                target.slowEndTime = millis() + 2000; // 2 seconds
                target.originalSpeed = target.speed;
                target.speed *= 0.5; // 50% speed reduction
            }
            
            // Vampiric effect - heal player on kill
            if (this.player.vampiric || this.player.tempVampiric > 0) {
                if (target.isDead()) {
                    this.player.heal(1);
                }
            }
            
            // Explosive effect
            if (this.player.explosiveShots && !projectile.exploded) {
                projectile.exploded = true;
                this.addExplosion(projectile.x, projectile.y, [255, 150, 0], 10);
                
                // Damage enemies in explosion radius
                let explosionRadius = 60;
                let explosionDamage = Math.floor(actualDamage * 0.5);
                
                // Damage regular enemies
                for (let enemy of this.enemies) {
                    if (enemy !== target) {
                        let distance = dist(projectile.x, projectile.y, enemy.x, enemy.y);
                        if (distance < explosionRadius) {
                            enemy.takeDamage(explosionDamage);
                        }
                    }
                }
                
                // Damage boss
                if (this.waveManager.isBossActive()) {
                    let boss = this.waveManager.getBoss();
                    if (boss !== target) {
                        let distance = dist(projectile.x, projectile.y, boss.x, boss.y);
                        if (distance < explosionRadius) {
                            boss.takeDamage(explosionDamage);
                        }
                    }
                }
                
                this.addScreenShake(8, 15);
            }
            
            // Handle piercing
            if (projectile.pierceCount > 0) {
                projectile.pierceCount--;
                return false; // Don't remove projectile
            }
            
            return true; // Remove projectile on hit
        } else {
            // Enemy projectile hit player
            if (projectile.poisonEffect) {
                this.player.poisoned = true;
                this.player.poisonEndTime = millis() + 3000;
                this.player.poisonDamage = projectile.damage;
            }
            return true; // Remove enemy projectile on hit
        }
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
            case 'achievements':
                this.achievementSystem.drawAchievementsMenu();
                break;
        }
        
        pop();
        
        // Draw particles (not affected by screen shake)
        this.particleSystem.display();
        
        // Draw achievement notifications (not affected by screen shake)
        this.achievementSystem.draw();
    }
    
    drawStart() {
        this.uiManager.drawStartScreen();
    }
    
    drawPlaying() {
        // Draw environment effects first
        this.environmentSystem.draw();
        
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
            this.totalTalentsSelected++; // Track achievements
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