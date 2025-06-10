let player;
let enemies = [];
const ENEMY_SPAWN_INTERVAL = 2000;
let lastEnemySpawnTime = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'talentSelection'

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
    { id: 'dash_cooldown', name: "-20% 冲刺冷却", description: "减少冲刺冷却时间.", apply: (p) => { p.dashCooldown *= 0.8; } }
];
let offeredTalents = [];
let talentButtonHeight = 50;
let talentButtonSpacing = 20;


function setup() {
    createCanvas(800, 600);
    player = new Player(width / 2, height / 2); // Player must be created before resetGame
    resetGame();
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
    player.x = width / 2;
    player.y = height / 2;
    player.projectiles = [];
    player.level = 1;
    player.xp = 0;
    player.xpToNextLevel = 10;
    player.lastShotTime = 0;

    enemies = [];
    currentWave = 1;
    enemiesPerWave = 5;
    enemiesSpawnedThisWave = 0;
    enemiesDefeatedThisWave = 0;
    lastEnemySpawnTime = millis();

    isBossBattleActive = false;
    currentBoss = null;
    if (currentBoss && currentBoss.projectiles) currentBoss.projectiles = []; // Clear boss projectiles if any linger

    offeredTalents = []; // Clear any talents from previous game
    // gameState = 'start'; // This is usually set by the caller of resetGame
}

function draw() {
    background(220);

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        runGame();
    } else if (gameState === 'gameOver') {
        drawGameOverScreen();
    } else if (gameState === 'talentSelection') {
        drawTalentSelectionScreen();
    }
}

function drawStartScreen() {
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(0);
    text("肉鸽射击", width / 2, height / 3);
    textSize(24);
    text("点击开始", width / 2, height / 2);
}

function runGame() {
    player.display(); // Player display first
    player.update(enemies, currentBoss); // Player update handles its movement and projectile logic

    if (isBossBattleActive) {
        if (currentBoss) {
            currentBoss.update(player);
            currentBoss.display();

            if (currentBoss.health <= 0) {
                player.gainXP(currentBoss.xpValue);
                isBossBattleActive = false;
                currentBoss = null;
                currentWave++;
                enemiesPerWave += 3;
                enemiesSpawnedThisWave = 0;
                enemiesDefeatedThisWave = 0;
                lastEnemySpawnTime = millis();
                console.log("Boss defeated! Proceeding to wave " + currentWave);
            }
        }
    } else { // Regular wave logic
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

            if (enemies[i].health <= 0) {
                player.gainXP(enemies[i].xpValue);
                enemies.splice(i, 1);
                enemiesDefeatedThisWave++;
            }
        }

        // Wave Transition Logic / Boss Trigger
        if (enemiesSpawnedThisWave >= enemiesPerWave && enemiesDefeatedThisWave >= enemiesPerWave && enemies.length === 0) {
            if (currentWave === BOSS_APPEARS_WAVE - 1) {
                isBossBattleActive = true;
                enemiesSpawnedThisWave = 0;
                enemiesDefeatedThisWave = 0;
                currentBoss = new Boss(width / 2, 120);
                console.log("BOSS INCOMING!");
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

    // HUD Display
    fill(0); textSize(16); textAlign(LEFT, TOP);
    text("生命值: " + player.health + "/" + player.maxHealth, 10, 10);
    text("等级: " + player.level, 10, 30);
    let xpBarWidth = 100;
    fill(150); rect(10, 50, xpBarWidth, 10);
    fill(0,255,0); rect(10, 50, constrain(map(player.xp, 0, player.xpToNextLevel, 0, xpBarWidth),0,xpBarWidth), 10);
    text("经验值: " + player.xp + "/" + player.xpToNextLevel, 10 + xpBarWidth + 5, 50 + 5);

    if (!isBossBattleActive) {
        text("波次: " + currentWave, width - 150, 10);
        text("敌人: " + (enemiesPerWave - enemiesDefeatedThisWave), width - 150, 30);
    } else if (currentBoss) {
        text("BOSS 战！", width - 150, 10);
    }

    // Check for game over state from player health
    if (player.health <= 0 && gameState !== 'gameOver') {
        gameState = 'gameOver';
    }
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
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(0);
    text("升级！选择一个天赋：", width / 2, height / 4);

    for (let i = 0; i < offeredTalents.length; i++) {
        let talent = offeredTalents[i];
        let yPos = height / 2 + i * (talentButtonHeight + talentButtonSpacing) - (talentButtonHeight + talentButtonSpacing);

        fill(200);
        stroke(0);
        rectMode(CENTER);
        rect(width / 2, yPos, width * 0.6, talentButtonHeight);

        fill(0);
        noStroke();
        textSize(18);
        text(talent.name, width / 2, yPos - 10);
        textSize(14);
        text(talent.description, width/2, yPos + 10);
    }
    rectMode(CORNER); // Reset rectMode
}


function drawGameOverScreen() {
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(255, 0, 0);
    text("游戏结束", width / 2, height / 3);
    textSize(24);
    fill(0);
    let message = "你到达了 ";
    if (isBossBattleActive || currentWave >= BOSS_APPEARS_WAVE) { // Adjusted logic slightly
        message += "Boss 波次 " + (BOSS_APPEARS_WAVE -1) +"!";
    } else {
        message += "波次 " + currentWave +".";
    }
    text(message, width/2, height/2);
    text("最终等级: " + player.level, width/2, height/2 + 30);
    text("点击重新开始", width / 2, height / 2 + 70);
}

function mousePressed() {
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
    }
}

function keyPressed() {
    if (gameState === 'playing') {
        if (keyCode === 32) { // Spacebar for Dash
            player.attemptDash();
        }
    }
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
        this.projectiles = [];
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 10;
        this.lastShotTime = 0;
        this.isDashing = false;
        this.lastDashTime = -this.dashCooldown;
        this.dashEndTime = 0;
    }

    gainXP(amount) {
        this.xp += amount;
        console.log("Gained " + amount + " XP. Total XP: " + this.xp);
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
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        // Could add invulnerability frames here
    }

    shoot() {
        if (millis() - this.lastShotTime > this.fireRate) {
            let angle = atan2(mouseY - this.y, mouseX - this.x);
            // type 'player', damage, color, speed, size
            this.projectiles.push(new Projectile(this.x, this.y, angle, 'player', this.projectileDamage, color(0, 150, 255), 7, 5));
            this.lastShotTime = millis();
        }
    }

    update(currentEnemies, boss) {
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
        if (keyIsDown(87)) { this.y -= this.speed; } // W
        if (keyIsDown(83)) { this.y += this.speed; } // S
        if (keyIsDown(65)) { this.x -= this.speed; } // A
        if (keyIsDown(68)) { this.x += this.speed; } // D
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
        fill(50, 150, 250);
        ellipse(this.x, this.y, this.size, this.size);
        let angle = atan2(mouseY - this.y, mouseX - this.x);
        push();
        translate(this.x, this.y);
        rotate(angle);
        stroke(0);
        line(0, 0, this.size / 2 + 10, 0);
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
        fill(this.pColor);
        noStroke();
        ellipse(this.x, this.y, this.size, this.size);
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
        fill(this.color);
        stroke(0);
        ellipse(this.x, this.y, this.size, this.size);
    }
    takeDamage(amount) { // Called by player projectiles
        this.health -= amount;
    }
}

class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 70;
        this.speed = 0.6;
        this.health = 60 + (currentWave - (BOSS_APPEARS_WAVE -1)) * 10; // Scale health if re-appears
        this.maxHealth = this.health;
        this.color = color(80, 0, 120);

        this.attackCooldown = 1500;
        this.lastAttackTime = millis();
        this.projectiles = []; // Renamed from bossProjectiles for consistency
        this.xpValue = 50;
        this.projectileDamage = 2 + floor((currentWave - (BOSS_APPEARS_WAVE -1))*0.5);
    }

    update(player) {
        this.move(player);
        if (millis() - this.lastAttackTime > this.attackCooldown) {
            this.shootAttack(player);
            this.lastAttackTime = millis();
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

    shootAttack(player) {
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        for (let i = -1; i <= 1; i++) {
            let currentAngle = angleToPlayer + (i * PI / 12);
            // type 'boss', damage, color, speed, size
            this.projectiles.push(new Projectile(this.x, this.y, currentAngle, 'boss', this.projectileDamage, color(255, 100, 0), 4, 10));
        }
    }

    takeDamage(amount) { // Called by player projectiles
        this.health -= amount;
    }

    display() {
        fill(this.color);
        stroke(0);
        rectMode(CENTER);
        rect(this.x, this.y, this.size, this.size);
        this.drawHealthBar();
        rectMode(CORNER);
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
