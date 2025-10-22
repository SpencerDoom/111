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