// Main Game class that coordinates all systems - 支持新道具系统
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
        this.shopSystem = new ShopSystem();
        
        // Game entities
        this.player = null;
        this.enemies = [];
        this.powerUps = [];
        
        // ===== 新道具系统扩展 =====
        // 独立实体管理
        this.soulFragments = []; // 灵魂碎片
        this.mirrorClones = []; // 分身镜像
        this.auras = []; // 光环效果
        
        // 事件总线系统
        this.eventListeners = {};
        
        // Global effects
        this.timeStopEndTime = 0;
        
        // Game settings
        this.audioEnabled = false;
        this.audioMuted = false;
        
        // Talent system
        this.allTalents = [
            {
                id: 'hp_boost',
                name: "+2 最大生命值",
                description: "增加2点最大生命值并恢复满血。",
                apply: (p) => {
                    p.maxHealth += 2;
                    p.health = p.maxHealth;
                }
            },
            {
                id: 'damage_boost',
                name: "+1 伤害",
                description: "增加1点投射物伤害。",
                apply: (p) => {
                    p.projectileDamage += 1;
                }
            },
            {
                id: 'speed_boost',
                name: "+速度",
                description: "增加移动速度和加速度。",
                apply: (p) => {
                    p.maxSpeed += 0.5;
                    p.acceleration += 0.1;
                }
            },
            {
                id: 'fire_rate',
                name: "快速射击",
                description: "减少射击冷却时间50毫秒。",
                apply: (p) => {
                    p.shotCooldown = Math.max(100, p.shotCooldown - 50);
                }
            },
            {
                id: 'dash_cooldown',
                name: "冲刺精通",
                description: "减少冲刺冷却时间500毫秒。",
                apply: (p) => {
                    p.dashCooldown = Math.max(500, p.dashCooldown - 500);
                }
            },
            // New talents
            {
                id: 'piercing_shots',
                name: "穿透射击",
                description: "投射物可穿透2个额外敌人。",
                apply: (p) => {
                    p.piercingCount = (p.piercingCount || 0) + 2;
                }
            },
            {
                id: 'spread_shot',
                name: "散射",
                description: "以散射模式发射3发子弹。",
                apply: (p) => {
                    p.spreadShot = true;
                }
            },
            {
                id: 'auto_heal',
                name: "再生",
                description: "每5秒恢复1点生命值。",
                apply: (p) => {
                    p.regenRate = 2000; // Every 2 seconds
                    p.lastRegenTime = millis();
                }
            },
            {
                id: 'shield',
                name: "能量护盾",
                description: "获得2点护盾（可叠加）。",
                apply: (p) => {
                    p.shield = (p.shield || 0) + 2;
                    p.maxShield = (p.maxShield || 0) + 2;
                }
            },
            {
                id: 'vampiric',
                name: "吸血",
                description: "击杀敌人时恢复1点生命值。",
                apply: (p) => {
                    p.vampiric = true;
                }
            },
            {
                id: 'gold_magnet',
                name: "黄金磁铁",
                description: "自动吸引附近的黄金。",
                apply: (p) => {
                    p.goldMagnet = true;
                }
            },
            {
                id: 'xp_magnet',
                name: "经验磁铁",
                description: "自动吸引附近的经验。",
                apply: (p) => {
                    p.xpMagnet = true;
                }
            }
        ];
        
        // Achievement system integration
        this.totalKills = 0;
        this.recentKills = 0;
        this.recentKillTimeWindow = 0;
        this.totalGoldCollected = 0;
        this.totalPowerUpsCollected = 0;
        this.damageFreeWaves = 0;
        this.waveTookDamage = false;
        this.inWave = false;
        this.totalPlayTime = 0;
        this.elapsedTime = 0;
        this.bossesDefeated = 0;
        this.totalShieldPoints = 0;
        this.totalExplosions = 0;
        this.totalCriticalHits = 0;
        this.totalTalentsSelected = 0;
        
        // Time events queue for delayed effects
        this.timeEvents = [];
        
        // Portal management
        this.portal = null;
        this.portalActive = false;
    }
    
    init() {
        // Set initial game state to 'start' to show start menu
        this.gameState.setState('start');
        
        // Initialize player
        this.player = new Player(width / 2, height / 2);
        
        // Reset all game systems
        this.waveManager.reset();
        this.starField = new StarField(150);
        this.environmentSystem.clear();
        
        // Clear all entity arrays
        this.enemies = [];
        this.powerUps = [];
        this.soulFragments = [];
        this.mirrorClones = [];
        this.auras = [];
        this.timeEvents = [];
        
        // Reset game statistics
        this.totalPlayTime = 0;
        this.elapsedTime = 0;
        this.totalKills = 0;
        this.recentKills = 0;
        this.recentKillTimeWindow = 0;
        this.totalGoldCollected = 0;
        this.totalPowerUpsCollected = 0;
        this.damageFreeWaves = 0;
        this.waveTookDamage = false;
        this.inWave = false;
        this.bossesDefeated = 0;
        this.totalShieldPoints = 0;
        this.totalExplosions = 0;
        this.totalCriticalHits = 0;
        this.totalTalentsSelected = 0;
        
        // Reset global effects
        this.timeStopEndTime = 0;
        
        // Reset portal
        this.portal = null;
        this.portalActive = false;
    }
    
    update(deltaTime) {
        if (this.gameState.getState() === 'playing') {
            this.updateGameplay(deltaTime);
        } else if (this.gameState.getState() === 'level_up') {
            this.updateLevelUp();
        } else if (this.gameState.getState() === 'game_over') {
            this.updateGameOver();
        } else if (this.gameState.getState() === 'shop') {
            this.updateShop();
        }
    }
    
    updateGameplay(deltaTime) {
        // Update total play time
        this.totalPlayTime += deltaTime;

        // Check if we should spawn next wave
        if (this.enemies.length === 0 && !this.waveManager.isBossActive() && this.waveManager.enemiesSpawnedThisWave > 0) {
            if (!this.portalActive) {
                this.spawnPortal();
            }
            this.portalActive = true;
        }

        // Update time events
        this.updateTimeEvents(deltaTime);

        // Update wave manager to spawn enemies
        this.waveManager.update(this.enemies, this.player);

        // Update star field
        this.starField.update();
        
        // Update player
        this.player.update();

        // Handle input
        this.handleInput();

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let enemy = this.enemies[i];

            if (this.player.tempTimeSlow <= 0) {
                enemy.update(this.player);
            }
            
            // Remove dead or off-screen enemies
            if (enemy.isDead() || enemy.isOffScreen()) {
                if (enemy.isDead()) {
                    // Give rewards
                    this.player.gainXP(enemy.xpValue);
                    this.player.gold += enemy.goldValue;
                    
                    // Track gold collection
                    this.totalGoldCollected += enemy.goldValue;
                    this.player.onGoldCollected(enemy.goldValue); // 触发金币收集事件
                    
                    // 触发击杀事件
                    this.triggerEvent('onKill', enemy);
                    this.player.onKill(enemy);
                    
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
        if (this.player.tempTimeSlow <= 0 && this.waveManager.isBossActive()) {
            let boss = this.waveManager.getBoss();
            boss.update(this.player);
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
        
        // ===== 新独立实体更新 =====
        // 更新灵魂碎片
        for (let i = this.soulFragments.length - 1; i >= 0; i--) {
            let soul = this.soulFragments[i];
            soul.update();
            
            if (!soul.active) {
                this.soulFragments.splice(i, 1);
            }
        }
        
        // 更新分身镜像
        for (let i = this.mirrorClones.length - 1; i >= 0; i--) {
            let clone = this.mirrorClones[i];
            clone.update();
            
            if (!clone.active) {
                this.mirrorClones.splice(i, 1);
            }
        }
        
        // Handle collisions
        this.handleCollisions();

        // Check environmental collisions
        if (this.player.tempTimeSlow <= 0) {
            this.environmentSystem.checkCollisions(this);
        }
        
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
        
        // Update achievement system
        this.achievementSystem.update(this);
        
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
        if (this.shopSystem && this.shopSystem.update) {
            this.shopSystem.update();
        }
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
                        hit = true;
                        break;
                    }
                }
            }
            
            // Check boss if active
            if (!hit && this.waveManager.isBossActive()) {
                let boss = this.waveManager.getBoss();
                if (checkCircleCollision(projectile, boss)) {
                    let removeProjectile = this.handleProjectileCollision(projectile, boss);
                    if (removeProjectile) {
                        hit = true;
                    }
                }
            }
            
            if (hit) {
                this.player.projectiles.splice(i, 1);
            }
        }
        
        // Enemy projectiles vs player
        for (let enemy of this.enemies) {
            if (!enemy.projectiles) continue;
            
            for (let i = enemy.projectiles.length - 1; i >= 0; i--) {
                let projectile = enemy.projectiles[i];
                
                if (checkCircleCollision(projectile, this.player)) {
                    this.handleProjectileCollision(projectile, this.player);
                    enemy.projectiles.splice(i, 1);
                }
            }
        }
        
        // Boss projectiles vs player
        if (this.waveManager.isBossActive()) {
            let boss = this.waveManager.getBoss();
            if (boss && boss.projectiles) {
                for (let i = boss.projectiles.length - 1; i >= 0; i--) {
                    let projectile = boss.projectiles[i];
                    
                    if (checkCircleCollision(projectile, this.player)) {
                        this.handleProjectileCollision(projectile, this.player);
                        boss.projectiles.splice(i, 1);
                    }
                }
            }
        }
        
        // Enemy collision vs player
        for (let enemy of this.enemies) {
            if (checkCircleCollision(enemy, this.player)) {
                this.handleEnemyCollision(enemy, this.player);
            }
        }
        
        // Boss collision vs player
        if (this.waveManager.isBossActive()) {
            let boss = this.waveManager.getBoss();
            if (boss && checkCircleCollision(boss, this.player)) {
                this.handleEnemyCollision(boss, this.player);
            }
        }

        // Portal collision vs player
        if (this.portalActive) {
            let portalX = width / 2;
            let portalY = height / 2;
            let portalRadius = 30;
            let distance = dist(portalX, portalY, this.player.x, this.player.y);
            
            if (distance < portalRadius + this.player.radius) {
                this.enterPortal();
            }
        }
    }
    
    handleProjectileCollision(projectile, target) {
        // Calculate damage
        let damage = projectile.damage;
        
        // Check for critical hit
        if (projectile.isCritical) {
            damage *= 2;
            this.totalCriticalHits++; // Track for achievements
            this.player.onCrit(target); // 触发暴击事件
        }
        
        // Apply damage
        target.takeDamage(damage);
        
        // Check if target died
        let targetDied = target.isDead();
        
        // Apply knockback
        if (projectile.knockbackForce > 0 && !targetDied) {
            let angle = atan2(target.y - projectile.y, target.x - projectile.x);
            target.x += cos(angle) * projectile.knockbackForce;
            target.y += sin(angle) * projectile.knockbackForce;
        }
        
        // Check for explosive effect
        if (projectile.explosive && targetDied) {
            this.handleExplosion(projectile.x, projectile.y, damage);
            this.totalExplosions++; // Track for achievements
        }
        
        // 触发投射物击中事件
        this.player.onProjectileHit(projectile, target);
        
        // Handle piercing
        if (projectile.pierceCount > 0) {
            projectile.pierceCount--;
            return false; // Don't remove projectile
        }
        
        return true; // Remove projectile
    }
    
    handleEnemyCollision(enemy, player) {
        // Apply damage to player
        player.takeDamage(enemy.contactDamage);
        this.waveTookDamage = true;
        
        // Check for spike damage (钉刺护体)
        if (player.hasSpikeBody) {
            enemy.takeDamage(player.spikeDamage);
        }
    }
    
    handleExplosion(x, y, baseDamage) {
        let explosionRadius = 60;
        
        // Damage enemies in range
        for (let enemy of this.enemies) {
            let distance = dist(x, y, enemy.x, enemy.y);
            if (distance <= explosionRadius) {
                let damage = Math.max(1, baseDamage - Math.floor(distance / 10));
                enemy.takeDamage(damage);
            }
        }
        
        // Damage boss if in range
        if (this.waveManager.isBossActive()) {
            let boss = this.waveManager.getBoss();
            if (boss) {
                let distance = dist(x, y, boss.x, boss.y);
                if (distance <= explosionRadius) {
                    let damage = Math.max(1, Math.floor(baseDamage * 0.5) - Math.floor(distance / 15));
                    boss.takeDamage(damage);
                }
            }
        }
        
        // Visual effect
        this.addExplosion(x, y, [255, 200, 100], 15);
    }
    
    handleInput() {
        // Handle mouse input for shooting
        if (mouseIsPressed) {
            this.player.shoot();
        }
        
        // Handle keyboard input
        if (keyIsPressed) {
            // Dash on space
            if (key === ' ') {
                this.player.attemptDash();
            }
            
            // Use active item on F
            if (key === 'f' || key === 'F') {
                this.player.useActiveItem(this);
            }
            
            // Toggle turret mode on T (if available)
            if (key === 't' || key === 'T') {
                if (this.player.hasItem && this.player.hasItem('turret_mode')) {
                    this.player.useActiveItem(this);
                }
            }
        }
    }
    
    spawnPortal() {
        this.portalActive = true;
    }

    enterPortal() {
        if (this.gameState.getState() === 'playing') {
            this.gameState.openShop();
            this.shopSystem.open(this.player, this.waveManager.getCurrentWave());
            this.portalActive = false;
        }
    }
    
    updatePortal() {
        // Portal logic handled by wave manager
    }
    
    // ===== 新道具系统方法 =====
    
    // 事件系统
    triggerEvent(eventName, ...args) {
        if (!this.eventListeners[eventName]) return;
        
        for (let callback of this.eventListeners[eventName]) {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event listener ${eventName}:`, error);
            }
        }
    }
    
    addEventListener(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }
    
    removeEventListener(eventName, callback) {
        if (!this.eventListeners[eventName]) return;
        
        let index = this.eventListeners[eventName].indexOf(callback);
        if (index > -1) {
            this.eventListeners[eventName].splice(index, 1);
        }
    }
    
    // 时间事件队列
    addTimeEvent(delay, callback) {
        this.timeEvents.push({
            executeTime: millis() + delay,
            callback: callback
        });
    }
    
    updateTimeEvents(deltaTime) {
        for (let i = this.timeEvents.length - 1; i >= 0; i--) {
            let event = this.timeEvents[i];
            if (millis() >= event.executeTime) {
                try {
                    event.callback();
                } catch (error) {
                    console.error('Error in time event:', error);
                }
                this.timeEvents.splice(i, 1);
            }
        }
    }
    
    // BOSS掉落系统
    dropBossItems(x, y) {
        this.spawnBossDropsAt(x, y);
    }

    spawnBossDropsAt(x, y) {
        if (typeof rollBossDropDefs === 'function') {
            let drops = rollBossDropDefs(this.player, this.waveManager.getCurrentWave());
            
            if (!drops || drops.length === 0) return;
            
            for (let i = 0; i < drops.length; i++) {
                let drop = drops[i];
                let itemX = x + (i === 0 ? -20 : 20);
                let itemY = y;
                this.powerUps.push(createItemPickup(itemX, itemY, drop.id));
            }
        }
    }

    spawnBossDrops(boss) {
        if (typeof rollBossDropDefs === 'function') {
            let drops = rollBossDropDefs(this.player, this.waveManager.getCurrentWave());
            
            if (!drops || drops.length === 0) return;
            
            for (let i = 0; i < drops.length; i++) {
                let drop = drops[i];
                let x = boss.x + (i === 0 ? -20 : 20);
                let y = boss.y;
                this.powerUps.push(createItemPickup(x, y, drop.id));
            }
        }
    }
    
    // 屏幕震动
    addScreenShake(intensity, duration) {
        if (this.screenShake) {
            this.screenShake.start(intensity, duration);
        }
    }
    
    // 爆炸特效
    addExplosion(x, y, color, size) {
        if (this.particleSystem) {
            this.particleSystem.addExplosion(x, y, color, size);
        }
    }
    
    // 触发等级提升
    triggerLevelUp() {
        this.gameState.setState('level_up');
        this.player.availableTalents = this.selectTalents();
    }
    
    // 选择天赋
    selectTalents() {
        let availableTalents = this.allTalents.slice();
        let selectedTalents = [];
        
        // Select 3 random talents
        for (let i = 0; i < 3; i++) {
            if (availableTalents.length === 0) break;
            
            let randomIndex = Math.floor(Math.random() * availableTalents.length);
            selectedTalents.push(availableTalents[randomIndex]);
            availableTalents.splice(randomIndex, 1);
        }
        
        return selectedTalents;
    }
    
    // 选择天赋
    chooseTalent(talentIndex) {
        if (talentIndex < 0 || talentIndex >= this.player.availableTalents.length) {
            return;
        }
        
        let talent = this.player.availableTalents[talentIndex];
        
        // Track shield points before applying talent
        let shieldBefore = this.player.shield || 0;
        
        talent.apply(this.player);
        
        // Track shield points after applying talent
        let shieldAfter = this.player.shield || 0;
        if (shieldAfter > shieldBefore) {
            this.totalShieldPoints += (shieldAfter - shieldBefore);
        }
        
        this.gameState.setState('playing');
    }
    
    // 重启游戏
    restart() {
        this.gameState.setState('playing');
        
        // Initialize player
        this.player = new Player(width / 2, height / 2);
        
        // Reset all game systems
        this.waveManager.reset();
        this.environmentSystem.clear();
        
        // Clear all entity arrays
        this.enemies = [];
        this.powerUps = [];
        this.soulFragments = [];
        this.mirrorClones = [];
        this.auras = [];
        this.timeEvents = [];
        
        // Reset game statistics
        this.totalPlayTime = 0;
        this.elapsedTime = 0;
        this.totalKills = 0;
        this.recentKills = 0;
        this.recentKillTimeWindow = 0;
        this.totalGoldCollected = 0;
        this.totalPowerUpsCollected = 0;
        this.damageFreeWaves = 0;
        this.waveTookDamage = false;
        this.inWave = false;
        this.bossesDefeated = 0;
        this.totalShieldPoints = 0;
        this.totalExplosions = 0;
        this.totalCriticalHits = 0;
        this.totalTalentsSelected = 0;
        
        // Reset global effects
        this.timeStopEndTime = 0;
        
        // Reset portal
        this.portal = null;
        this.portalActive = false;
    }
    
    display() {
        // Display background
        background(20, 25, 40);
        
        // Display star field
        this.starField.display();
        
        // Display environment effects
        this.environmentSystem.draw();
        
        // Display portal
        if (this.portalActive) {
            this.displayPortal();
        }
        
        // Display game entities based on state
        if (this.gameState.getState() === 'playing' || this.gameState.getState() === 'level_up') {
            // Display enemies
            for (let enemy of this.enemies) {
                enemy.display();
            }
            
            // Display boss if active
            if (this.waveManager.isBossActive()) {
                let boss = this.waveManager.getBoss();
                if (boss) {
                    boss.display();
                }
            }
            
            // Display player
            this.player.display();
            
            // ===== 显示独立实体 =====
            // 显示灵魂碎片
            for (let soul of this.soulFragments) {
                soul.display();
            }
            
            // 显示分身镜像
            for (let clone of this.mirrorClones) {
                clone.display();
            }
            
            // Display powerups
            for (let powerUp of this.powerUps) {
                powerUp.display();
            }
        }
        
        // Display UI
        this.uiManager.drawHUD(this.player, this.waveManager);

        // Display game state overlays
        if (this.gameState.getState() === 'start') {
            this.uiManager.drawStartScreen();
        } else if (this.gameState.getState() === 'level_up') {
            this.displayLevelUpOverlay();
        } else if (this.gameState.getState() === 'game_over') {
            this.displayGameOverOverlay();
        } else if (this.gameState.getState() === 'shop') {
            this.displayShopOverlay();
        }
    }
    
    displayPortal() {
        push();
        translate(width / 2, height / 2);
        
        let pulse = sin(millis() * 0.01) * 0.2 + 0.8;
        let size = 40 * pulse;
        
        fill(100, 150, 255, 150);
        noStroke();
        ellipse(0, 0, size + 20, size + 20);
        
        fill(150, 200, 255);
        stroke(255);
        strokeWeight(3);
        ellipse(0, 0, size, size);
        
        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(20);
        text('传送门', 0, 0);
        
        pop();
    }
    
    displayLevelUpOverlay() {
        push();
        fill(0, 0, 0, 150);
        rect(0, 0, width, height);
        
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        text('等级提升！', width / 2, height / 2 - 200);
        
        textSize(18);
        text('选择一个天赋:', width / 2, height / 2 - 150);
        
        let yStart = height / 2 - 100;
        for (let i = 0; i < this.player.availableTalents.length; i++) {
            let talent = this.player.availableTalents[i];
            let y = yStart + i * 80;
            
            fill(i === 0 ? 'yellow' : 'white');
            textSize(20);
            text(`${i + 1}. ${talent.name}`, width / 2, y);
            
            textSize(14);
            text(talent.description, width / 2, y + 20);
        }
        
        textSize(16);
        text('按 1, 2, 或 3 选择天赋', width / 2, height - 100);
        
        pop();
    }
    
    displayGameOverOverlay() {
        push();
        fill(0, 0, 0, 180);
        rect(0, 0, width, height);
        
        fill(255, 100, 100);
        textAlign(CENTER, CENTER);
        textSize(48);
        text('游戏结束', width / 2, height / 2 - 100);
        
        fill(255);
        textSize(20);
        text(`存活时间: ${Math.floor(this.totalPlayTime / 1000)} 秒`, width / 2, height / 2 - 40);
        text(`击杀数: ${this.totalKills}`, width / 2, height / 2 - 10);
        text(`收集金币: ${this.totalGoldCollected}`, width / 2, height / 2 + 20);
        text(`无伤波数: ${this.damageFreeWaves}`, width / 2, height / 2 + 50);
        
        textSize(16);
        text('按 R 重新开始', width / 2, height / 2 + 100);
        
        pop();
    }
    
    displayShopOverlay() {
        this.shopSystem.display(this);
    }
    
    keyPressed(keyValue) {
        if (this.gameState.getState() === 'start') {
            // Start the game on any key press or Enter
            if (keyValue === 'Enter' || keyValue === ' ') {
                this.startGame();
            }
        } else if (this.gameState.getState() === 'level_up') {
            if (keyValue === '1' || keyValue === '2' || keyValue === '3') {
                let talentIndex = parseInt(keyValue, 10) - 1;
                this.chooseTalent(talentIndex);
                this.totalTalentsSelected++; // Track for achievements
            }
        } else if (this.gameState.getState() === 'game_over') {
            if (keyValue === 'r' || keyValue === 'R') {
                this.restart();
            }
        } else if (this.gameState.getState() === 'shop') {
            if (keyValue === 'Escape') {
                this.gameState.setState('playing');
            } else {
                this.shopSystem.handleKeyPressed(keyValue, this.player, this.waveManager.getCurrentWave());
            }
        } else if (this.gameState.getState() === 'playing') {
            if (keyValue === 'Escape') {
                this.gameState.openShop();
                this.shopSystem.open(this.player, this.waveManager.getCurrentWave());
            }
        }
    }

    startGame() {
        this.gameState.startGame();
        // Mark the start of the wave
        this.inWave = true;
    }
    
    mousePressed() {
        if (this.gameState.getState() === 'start') {
            this.startGame();
        }
    }
}