// Player class with movement, shooting, and abilities
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.health = 10;
        this.maxHealth = 10;
        this.projectiles = [];
        
        // Movement properties
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 4;
        this.acceleration = 0.3;
        this.friction = 0.85;
        
        // Shooting properties
        this.lastShotTime = 0;
        this.shotCooldown = 300; // milliseconds between shots
        this.projectileSpeed = 8;
        this.projectileDamage = 2;
        
        // Dash ability
        this.isDashing = false;
        this.dashCooldown = 2000; // 2 seconds
        this.lastDashTime = 0;
        this.dashDuration = 200; // 200ms dash
        this.dashEndTime = 0;
        this.dashSpeed = 12;
        
        // Experience and leveling
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 10;
        this.availableTalents = [];
        
        // Resources
        this.gold = 0;
        
        // Visual effects
        this.hitFlashTime = 0;
        this.hitFlashDuration = 200;
        
        // Temporary effects
        this.tempSpeedBoost = 0;
        this.tempDamageBoost = 0;
        this.invulnerableTime = 0;
    }

    update() {
        this.move();
        this.updateProjectiles();
        this.updateTimers();
    }

    updateTimers() {
        // Update dash state
        if (this.isDashing && millis() > this.dashEndTime) {
            this.isDashing = false;
        }
        
        // Update temporary effects
        if (this.tempSpeedBoost > 0) {
            this.tempSpeedBoost -= 0.5;
            if (this.tempSpeedBoost < 0) this.tempSpeedBoost = 0;
        }
        
        if (this.tempDamageBoost > 0) {
            this.tempDamageBoost -= 0.5;
            if (this.tempDamageBoost < 0) this.tempDamageBoost = 0;
        }
        
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= 16; // Assume 60fps
        }
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            
            if (p.isDead()) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    move() {
        let currentAcceleration = this.acceleration + (this.tempSpeedBoost || 0) * 0.1;
        let currentMaxSpeed = this.maxSpeed + (this.tempSpeedBoost || 0);
        
        // Handle input with acceleration
        let inputX = 0, inputY = 0;
        if (keyIsDown(87) || keyIsDown(UP_ARROW)) inputY -= 1; // W or Up
        if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) inputY += 1; // S or Down
        if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) inputX -= 1; // A or Left
        if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) inputX += 1; // D or Right
        
        // Apply acceleration based on input
        if (inputX !== 0) {
            this.vx += inputX * currentAcceleration;
        } else {
            this.vx *= this.friction; // Apply friction when no input
        }
        
        if (inputY !== 0) {
            this.vy += inputY * currentAcceleration;
        } else {
            this.vy *= this.friction; // Apply friction when no input
        }
        
        // Limit velocity to max speed
        this.vx = constrain(this.vx, -currentMaxSpeed, currentMaxSpeed);
        this.vy = constrain(this.vy, -currentMaxSpeed, currentMaxSpeed);
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Keep player within screen bounds
        this.x = constrain(this.x, this.size / 2, width - this.size / 2);
        this.y = constrain(this.y, this.size / 2, height - this.size / 2);
        
        // Stop velocity if hitting screen bounds
        if (this.x <= this.size / 2 || this.x >= width - this.size / 2) {
            this.vx = 0;
        }
        if (this.y <= this.size / 2 || this.y >= height - this.size / 2) {
            this.vy = 0;
        }
    }

    shoot() {
        if (millis() - this.lastShotTime > this.shotCooldown) {
            let angle = atan2(mouseY - this.y, mouseX - this.x);
            let damage = this.projectileDamage + this.tempDamageBoost;
            this.projectiles.push(new Projectile(this.x, this.y, angle, 'player', damage));
            this.lastShotTime = millis();
            
            // Play shoot sound if audio system exists
            if (typeof playSound === 'function') {
                playSound('shoot');
            }
        }
    }

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

    takeDamage(amount) {
        if (this.invulnerableTime > 0) return; // Invulnerable
        
        this.health -= amount;
        this.hitFlashTime = millis();
        this.invulnerableTime = 500; // 500ms invulnerability after taking damage
        
        // Visual effects
        if (typeof addScreenShake === 'function') {
            addScreenShake(5, 10);
        }
        if (typeof playSound === 'function') {
            playSound('hit');
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    gainXP(amount) {
        this.xp += amount;
        
        // Check for level up
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2);
        
        // Trigger level up state
        if (typeof game !== 'undefined' && game.triggerLevelUp) {
            game.triggerLevelUp();
        }
        
        console.log(`Level up! Now level ${this.level}`);
    }

    isDead() {
        return this.health <= 0;
    }

    display() {
        push();
        translate(this.x, this.y);
        
        // Hit flash effect
        if (millis() - this.hitFlashTime < this.hitFlashDuration) {
            tint(255, 100, 100);
        }
        
        // Dash effect
        if (this.isDashing) {
            fill(100, 150, 255, 100);
            noStroke();
            ellipse(0, 0, this.size + 20, this.size + 20);
        }
        
        // Player body
        fill(100, 150, 255);
        stroke(0);
        strokeWeight(2);
        ellipse(0, 0, this.size, this.size);
        
        // Player emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.8);
        text("🚀", 0, 0);
        
        noTint();
        pop();
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.display();
        }
    }

    // Getters for UI and other systems
    getHealthPercentage() {
        return this.health / this.maxHealth;
    }

    getXPPercentage() {
        return this.xp / this.xpToNextLevel;
    }

    getDashCooldownPercentage() {
        let timeSinceLastDash = millis() - this.lastDashTime;
        return Math.min(1, timeSinceLastDash / this.dashCooldown);
    }
}