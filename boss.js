// Boss class with different attack patterns and phases
class Boss {
    constructor(x, y, variant = 'standard') {
        this.x = x;
        this.y = y;
        this.variant = variant;
        this.size = 80;
        this.health = 100;
        this.maxHealth = 100;
        this.phase = 1;
        this.maxPhases = 3;
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.speed = 1;
        this.targetX = x;
        this.targetY = y;
        
        // Attack properties
        this.projectiles = [];
        this.lastAttackTime = millis();
        this.attackCooldown = this.getAttackCooldown();
        this.projectileDamage = 2;
        
        // Variant-specific properties
        this.setupVariant();
        
        // Minions (for summoner variant)
        this.minions = [];
        this.lastMinionSpawn = millis();
        this.minionSpawnCooldown = 5000;
        
        // Beam attack (for beamer variant)
        this.isChargingBeam = false;
        this.isFiringBeam = false;
        this.beamChargeTime = 0;
        this.beamDuration = 0;
        
        // Sweep attack (for sweeper variant)
        this.sweepAngle = 0;
        
        // Rewards
        this.xpValue = 100;
        this.goldValue = 50;
    }

    setupVariant() {
        switch(this.variant) {
            case 'sweeper':
                this.attackCooldown = 800;
                this.health = 120;
                this.maxHealth = 120;
                break;
            case 'summoner':
                this.attackCooldown = 2000;
                this.health = 150;
                this.maxHealth = 150;
                break;
            case 'beamer':
                this.attackCooldown = 3000;
                this.health = 80;
                this.maxHealth = 80;
                break;
        }
    }

    getAttackCooldown() {
        return 2000 - (this.phase * 200); // Faster attacks in higher phases
    }

    update(player) {
        this.updateMovement();
        this.updatePhase();
        this.updateAttack(player);
        this.updateProjectiles(player);
        this.updateMinions(player);
        this.updateBeamAttack(player);
    }

    updateMovement() {
        // Boss movement pattern - move to random positions
        let distToTarget = dist(this.x, this.y, this.targetX, this.targetY);
        if (distToTarget < 20 || frameCount % 180 === 0) { // Change target every 3 seconds
            this.targetX = random(this.size, width - this.size);
            this.targetY = random(50, 200);
        }
        
        // Move towards target
        let angle = atan2(this.targetY - this.y, this.targetX - this.x);
        this.vx = lerp(this.vx, cos(angle) * this.speed, 0.1);
        this.vy = lerp(this.vy, sin(angle) * this.speed, 0.1);
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Keep boss on screen
        this.x = constrain(this.x, this.size/2, width - this.size/2);
        this.y = constrain(this.y, this.size/2, height/2);
    }

    updatePhase() {
        let healthPercentage = this.health / this.maxHealth;
        let newPhase = Math.ceil((1 - healthPercentage) * this.maxPhases);
        
        if (newPhase > this.phase && newPhase <= this.maxPhases) {
            this.phase = newPhase;
            this.attackCooldown = this.getAttackCooldown();
            console.log(`Boss entered phase ${this.phase}`);
        }
    }

    updateAttack(player) {
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
        if (millis() - this.lastAttackTime > this.attackCooldown / 2) {
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
            if (random() < 0.3) {
                this.startBeamAttack();
            } else {
                this.shootAttack(player);
            }
            this.lastAttackTime = millis();
        }
    }

    shootAttack(player) {
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        let bulletCount = this.phase + 2;
        
        for (let i = 0; i < bulletCount; i++) {
            let spreadAngle = (i - bulletCount/2) * PI / 12;
            let currentAngle = angleToPlayer + spreadAngle;
            let projectileColor = color(255, 100, 0);
            this.projectiles.push(new Projectile(this.x, this.y, currentAngle, 'boss', this.projectileDamage, projectileColor, 4, 10));
        }
    }

    sweepAttack(player) {
        let bulletCount = 5 + this.phase;
        let projectileColor = color(255, 150, 0);
        
        for (let i = 0; i < bulletCount; i++) {
            let angle = this.sweepAngle + (i * PI / bulletCount);
            this.projectiles.push(new Projectile(this.x, this.y, angle, 'boss', this.projectileDamage, projectileColor, 3, 8));
        }
        this.sweepAngle += PI / 8;
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
        this.beamChargeTime = 1500;
        console.log("Boss charging beam attack!");
    }

    updateBeamAttack(player) {
        if (this.isChargingBeam) {
            this.beamChargeTime -= 16;
            if (this.beamChargeTime <= 0) {
                this.isChargingBeam = false;
                this.isFiringBeam = true;
                this.beamDuration = 2000;
            }
        }
        
        if (this.isFiringBeam) {
            this.beamDuration -= 16;
            if (this.beamHitsPlayer(player)) {
                player.takeDamage(1); // Continuous damage
            }
            
            if (this.beamDuration <= 0) {
                this.isFiringBeam = false;
            }
        }
    }

    updateProjectiles(player) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            
            // Check collision with player
            if (dist(player.x, player.y, p.x, p.y) < player.size/2 + p.size/2) {
                player.takeDamage(p.damage);
                this.projectiles.splice(i, 1);
            } else if (p.isOffScreen()) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateMinions(player) {
        for (let i = this.minions.length - 1; i >= 0; i--) {
            let minion = this.minions[i];
            minion.update(player);
            
            if (minion.isDead()) {
                this.minions.splice(i, 1);
            }
        }
    }

    beamHitsPlayer(player) {
        return dist(this.x, this.y, player.x, player.y) < 300;
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Visual effects
        if (typeof createExplosion === 'function') {
            createExplosion(this.x, this.y, [255, 50, 50], 8);
        }
        if (typeof addScreenShake === 'function') {
            addScreenShake(7, 12);
        }
        
        if (this.health <= 0) {
            this.onDeath();
        }
    }

    onDeath() {
        // Epic boss death explosion
        if (typeof createExplosion === 'function') {
            createExplosion(this.x, this.y, [255, 255, 0], 25);
        }
        if (typeof playSound === 'function') {
            playSound('explosion');
        }
        if (typeof addScreenShake === 'function') {
            addScreenShake(15, 30);
        }
        
        console.log("Boss defeated!");
    }

    display() {
        push();
        translate(this.x, this.y);
        
        // Boss charging effect
        if (this.isChargingBeam) {
            let chargeIntensity = map(1500 - this.beamChargeTime, 0, 1500, 0, 100);
            fill(255, 0, 0, chargeIntensity);
            noStroke();
            ellipse(0, 0, this.size + 30, this.size + 30);
        }
        
        // Boss body
        let bossColor = this.getBossColor();
        fill(bossColor);
        stroke(0);
        strokeWeight(3);
        rectMode(CENTER);
        rect(0, 0, this.size, this.size);
        
        // Boss face emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.8);
        text(this.getBossEmoji(), 0, 0);
        
        pop();
        
        // Beam drawing is handled externally in the Game class
        
        // Display minions
        for (let minion of this.minions) {
            minion.display();
        }
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.display();
        }
        
        // Health bar
        this.drawHealthBar();
        rectMode(CORNER);
    }

    drawBeam(player) {
        if (!player) return;
        
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
            if (typeof game !== 'undefined' && game.particleSystem) {
                game.particleSystem.addParticle(new Particle(beamX, beamY, [255, 100, 100], 8));
            }
        }
    }

    getBossColor() {
        switch(this.variant) {
            case 'sweeper': return color(255, 100, 0);
            case 'summoner': return color(150, 0, 255);
            case 'beamer': return color(255, 0, 100);
            default: return color(80, 0, 120);
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
        fill(255, 0, 0);
        rect(xPos, yPos, currentHealthWidth, barHeight);

        noFill();
        stroke(0);
        rect(xPos, yPos, barWidth, barHeight);
    }

    isDead() {
        return this.health <= 0;
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
        let projectileColor = color(200, 100, 255);
        this.projectiles.push(new Projectile(this.x, this.y, angleToPlayer, 'enemy', this.projectileDamage, projectileColor, 2, 6));
    }

    takeDamage(amount) {
        this.health -= amount;
        
        if (typeof createExplosion === 'function') {
            createExplosion(this.x, this.y, [200, 100, 255], 3);
        }
        
        if (this.health <= 0) {
            // Small rewards for minions
            if (typeof game !== 'undefined' && game.player) {
                game.player.gainXP(2);
                game.player.gold += 1;
            }
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        
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
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.display();
        }
    }

    isDead() {
        return this.health <= 0;
    }
}