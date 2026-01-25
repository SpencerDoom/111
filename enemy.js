// Base Enemy class and specific enemy types
class Enemy {
    constructor(x, y, type = 'grunt') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 25;
        this.speed = 1.5;
        this.health = 3;
        this.maxHealth = 3;
        this.projectiles = [];
        this.lastAttackTime = millis() + random(-1000, 1000); // Stagger initial attacks
        this.attackCooldown = 3000; // 3 seconds between attacks
        this.projectileDamage = 1;
        this.xpValue = 5;
        this.goldValue = 1;
    }

    update(player) {
        this.moveTowardsPlayer(player);
        this.updateAttack(player);
        this.updateProjectiles(player);
    }

    moveTowardsPlayer(player) {
        let angle = atan2(player.y - this.y, player.x - this.x);
        this.x += cos(angle) * this.speed;
        this.y += sin(angle) * this.speed;
    }

    updateAttack(player) {
        if (millis() - this.lastAttackTime > this.attackCooldown) {
            this.attack(player);
            this.lastAttackTime = millis();
        }
    }

    attack(player) {
        // Basic attack - shoot projectile at player
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        let projectileColor = color(255, 100, 100);
        this.projectiles.push(new Projectile(this.x, this.y, angleToPlayer, 'enemy', this.projectileDamage, projectileColor));
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

    takeDamage(amount) {
        this.health -= amount;
        
        // Visual feedback
        if (typeof createExplosion === 'function') {
            createExplosion(this.x, this.y, [255, 100, 100], 3);
        }
        
        if (this.health <= 0) {
            this.onDeath();
        }
    }

    onDeath() {
        // Override in subclasses for specific death behavior
        if (typeof playSound === 'function') {
            playSound('explosion');
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        
        // Enemy body
        fill(this.getColor());
        stroke(0);
        strokeWeight(1);
        ellipse(0, 0, this.size, this.size);
        
        // Enemy emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.6);
        text(this.getEmoji(), 0, 0);
        
        pop();
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.display();
        }
    }

    getColor() {
        return color(255, 100, 100); // Default red
    }

    getEmoji() {
        return "👾"; // Default alien emoji
    }

    isDead() {
        return this.health <= 0;
    }

    isOffScreen() {
        return this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50;
    }
}

// Specific enemy types
class GruntEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'grunt');
        this.speed = 1;
        this.health = 2;
        this.maxHealth = 2;
        this.xpValue = 3;
        this.goldValue = 1;
    }

    getColor() {
        return color(200, 100, 100);
    }

    getEmoji() {
        return "👾";
    }
}

class AlienEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'alien');
        this.speed = 1.2;
        this.health = 3;
        this.maxHealth = 3;
        this.attackCooldown = 2500;
        this.xpValue = 5;
        this.goldValue = 2;
    }

    getColor() {
        return color(150, 255, 150);
    }

    getEmoji() {
        return "👽";
    }
}

class SaucerEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'saucer');
        this.speed = 0.8;
        this.health = 4;
        this.maxHealth = 4;
        this.attackCooldown = 2000;
        this.xpValue = 8;
        this.goldValue = 3;
    }

    attack(player) {
        // Triple shot attack
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        let projectileColor = color(100, 255, 255);
        
        for (let i = -1; i <= 1; i++) {
            let spreadAngle = angleToPlayer + (i * PI / 12);
            this.projectiles.push(new Projectile(this.x, this.y, spreadAngle, 'enemy', this.projectileDamage, projectileColor));
        }
    }

    getColor() {
        return color(100, 255, 255);
    }

    getEmoji() {
        return "🛸";
    }
}

class SkullEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'skull');
        this.speed = 2;
        this.health = 2;
        this.maxHealth = 2;
        this.attackCooldown = 3500;
        this.xpValue = 6;
        this.goldValue = 2;
    }

    moveTowardsPlayer(player) {
        // Erratic movement pattern
        let angle = atan2(player.y - this.y, player.x - this.x);
        angle += sin(millis() * 0.01) * 0.5; // Add sine wave to movement
        this.x += cos(angle) * this.speed;
        this.y += sin(angle) * this.speed;
    }

    getColor() {
        return color(200, 200, 200);
    }

    getEmoji() {
        return "💀";
    }
}

class RobotEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'robot');
        this.speed = 0.7;
        this.health = 6;
        this.maxHealth = 6;
        this.attackCooldown = 1500;
        this.projectileDamage = 2;
        this.xpValue = 12;
        this.goldValue = 5;
        this.size = 30; // Larger size
    }

    attack(player) {
        // Rapid fire attack
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        let projectileColor = color(255, 255, 100);
        this.projectiles.push(new Projectile(this.x, this.y, angleToPlayer, 'enemy', this.projectileDamage, projectileColor, 6, 8));
    }

    getColor() {
        return color(150, 150, 255);
    }

    getEmoji() {
        return "🤖";
    }
}

// New enemy types
class GhostEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'ghost');
        this.speed = 1.8;
        this.health = 3;
        this.maxHealth = 3;
        this.attackCooldown = 4000;
        this.projectileDamage = 1;
        this.xpValue = 8;
        this.goldValue = 3;
        this.teleportCooldown = 6000; // Can teleport periodically
        this.lastTeleportTime = millis();
        this.player = null; // Will be set during update
    }

    update(player) {
        this.player = player; // Store player reference for teleport
        this.moveTowardsPlayer(player);
        this.updateAttack(player);
        this.updateProjectiles(player);
        this.updateTeleport(player);
    }

    updateTeleport(player) {
        if (millis() - this.lastTeleportTime > this.teleportCooldown) {
            // Teleport to random location near player
            let angle = random(TWO_PI);
            let distance = random(80, 150);
            this.x = player.x + cos(angle) * distance;
            this.y = player.y + sin(angle) * distance;
            this.lastTeleportTime = millis();
        }
    }

    moveTowardsPlayer(player) {
        // Phasing movement - can move through obstacles
        let angle = atan2(player.y - this.y, player.x - this.x);
        this.x += cos(angle) * this.speed * 0.8; // Slower when moving directly
        this.y += sin(angle) * this.speed * 0.8;
    }

    getColor() {
        return color(200, 200, 255, 180); // Semi-transparent
    }

    getEmoji() {
        return "👻";
    }

    display() {
        push();
        translate(this.x, this.y);
        
        // Ghost body (semi-transparent)
        fill(this.getColor());
        stroke(255, 255, 255, 200);
        strokeWeight(1);
        ellipse(0, 0, this.size, this.size * 1.2);
        
        // Ghost emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.6);
        text(this.getEmoji(), 0, 0);
        
        pop();
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.display();
        }
    }
}

class SnakeEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'snake');
        this.speed = 0.5;
        this.health = 8;
        this.maxHealth = 8;
        this.attackCooldown = 3000;
        this.projectileDamage = 2;
        this.xpValue = 15;
        this.goldValue = 6;
        this.size = 35; // Larger
        this.bodySegments = [];
        this.segmentCount = 3;
        
        // Create body segments
        for (let i = 0; i < this.segmentCount; i++) {
            this.bodySegments.push({
                x: this.x - i * 20,
                y: this.y,
                health: Math.max(1, 4 - i) // Segments have less health
            });
        }
    }

    takeDamage(amount) {
        // Head takes full damage, body takes reduced damage
        this.health -= amount;
        
        // Randomly damage a body segment
        if (random() < 0.3 && this.bodySegments.length > 0) {
            let segmentIndex = floor(random(this.bodySegments.length));
            this.bodySegments[segmentIndex].health -= Math.floor(amount / 2);
            
            // Remove dead segments
            if (this.bodySegments[segmentIndex].health <= 0) {
                this.bodySegments.splice(segmentIndex, 1);
            }
        }
        
        // Visual feedback
        if (typeof createExplosion === 'function') {
            createExplosion(this.x, this.y, [100, 255, 100], 3);
        }
        
        if (this.health <= 0) {
            this.onDeath();
        }
    }

    update(player) {
        // Move head towards player
        this.moveTowardsPlayer(player);
        
        // Move body segments to follow head
        for (let i = 0; i < this.bodySegments.length; i++) {
            let segment = this.bodySegments[i];
            let targetX, targetY;
            
            if (i === 0) {
                targetX = this.x;
                targetY = this.y;
            } else {
                targetX = this.bodySegments[i-1].x;
                targetY = this.bodySegments[i-1].y;
            }
            
            let dx = targetX - segment.x;
            let dy = targetY - segment.y;
            let distance = sqrt(dx * dx + dy * dy);
            
            if (distance > 20) {
                segment.x += (dx / distance) * 2;
                segment.y += (dy / distance) * 2;
            }
        }
        
        this.updateAttack(player);
        this.updateProjectiles(player);
    }

    attack(player) {
        // Poison spit attack
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        let projectileColor = color(0, 255, 0);
        let projectile = new Projectile(this.x, this.y, angleToPlayer, 'enemy', this.projectileDamage, projectileColor, 4, 6);
        projectile.isPoison = true; // Custom property for poison effect
        this.projectiles.push(projectile);
    }

    isDead() {
        return this.health <= 0 || this.bodySegments.length === 0;
    }

    getColor() {
        return color(0, 200, 0);
    }

    getEmoji() {
        return "🐍";
    }

    display() {
        // Draw body segments first
        for (let i = this.bodySegments.length - 1; i >= 0; i--) {
            let segment = this.bodySegments[i];
            push();
            translate(segment.x, segment.y);
            
            let segmentHealth = segment.health;
            let alpha = map(segmentHealth, 0, 4, 100, 255);
            
            fill(0, 200, 0, alpha);
            stroke(0, 100, 0);
            strokeWeight(1);
            ellipse(0, 0, this.size * 0.7, this.size * 0.7);
            
            pop();
        }
        
        // Draw head
        push();
        translate(this.x, this.y);
        
        fill(this.getColor());
        stroke(0);
        strokeWeight(1);
        ellipse(0, 0, this.size, this.size);
        
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.6);
        text(this.getEmoji(), 0, 0);
        
        pop();
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.display();
        }
    }
}

class BomberEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'bomber');
        this.speed = 1.5;
        this.health = 4;
        this.maxHealth = 4;
        this.attackCooldown = 5000; // Longer cooldown
        this.projectileDamage = 3;
        this.xpValue = 10;
        this.goldValue = 4;
        this.explosionRadius = 80;
        this.isExploding = false;
        this.explosionStartTime = 0;
    }

    update(player) {
        if (!this.isExploding) {
            this.moveTowardsPlayer(player);
            this.updateAttack(player);
            
            // Explode if close to player
            let distance = dist(this.x, this.y, player.x, player.y);
            if (distance < this.explosionRadius * 0.5) {
                this.startExplosion();
            }
        } else {
            this.updateExplosion();
        }
        
        this.updateProjectiles(player);
    }

    startExplosion() {
        this.isExploding = true;
        this.explosionStartTime = millis();
        this.attackCooldown = 999999; // Prevent further attacks
    }

    updateExplosion() {
        let explosionDuration = 1000; // 1 second explosion animation
        if (millis() - this.explosionStartTime > explosionDuration) {
            // Damage player if in explosion radius
            if (typeof game !== 'undefined' && game && game.player) {
                let distance = dist(this.x, this.y, game.player.x, game.player.y);
                if (distance < this.explosionRadius) {
                    game.player.takeDamage(this.projectileDamage + 2);
                    if (game.addExplosion) {
                        game.addExplosion(this.x, this.y, [255, 165, 0], 15);
                    }
                    if (game.addScreenShake) {
                        game.addScreenShake(10, 20);
                    }
                }
            }
            this.health = 0; // Kill self after explosion
        }
    }

    attack(player) {
        // No projectile attack - explodes on proximity
    }

    takeDamage(amount) {
        // Bomber takes double damage when hit
        super.takeDamage(amount * 2);
    }

    getColor() {
        if (this.isExploding) {
            return color(255, 165, 0); // Orange when exploding
        }
        return color(255, 100, 0); // Red-orange normally
    }

    getEmoji() {
        return "💣";
    }

    display() {
        push();
        translate(this.x, this.y);
        
        if (this.isExploding) {
            // Explosion animation
            let progress = (millis() - this.explosionStartTime) / 1000;
            let size = this.size + progress * this.explosionRadius;
            
            fill(255, 165, 0, 150);
            noStroke();
            ellipse(0, 0, size, size);
            
            fill(255, 255, 0, 200);
            ellipse(0, 0, size * 0.7, size * 0.7);
            
            // Warning emoji
            fill(255, 0, 0);
            textAlign(CENTER, CENTER);
            textSize(this.size * 0.6);
            text("💥", 0, 0);
        } else {
            // Normal bomber display
            fill(this.getColor());
            stroke(0);
            strokeWeight(1);
            ellipse(0, 0, this.size, this.size);
            
            fill(255);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(this.size * 0.6);
            text(this.getEmoji(), 0, 0);
        }
        
        pop();
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.display();
        }
    }
}