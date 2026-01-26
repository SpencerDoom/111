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
        this.contactDamage = 1; // 碰撞伤害
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

// ============================================
// 5种新敌人类型（游戏扩展计划）
// ============================================

// 骑士 - 高防御，移动慢，正面减伤
class KnightEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'knight');
        this.speed = 0.6;
        this.health = 8;
        this.maxHealth = 8;
        this.attackCooldown = 3500;
        this.projectileDamage = 2;
        this.xpValue = 12;
        this.goldValue = 5;
        this.size = 32;
        this.shieldActive = true;
        this.shieldCooldown = 0;
    }

    takeDamage(amount) {
        // 检查是否从正面受击
        if (typeof game !== 'undefined' && game.player) {
            let angleToPlayer = atan2(this.y - game.player.y, this.x - game.player.x);
            let movementAngle = atan2(this.vy || 0, this.vx || 0);
            let angleDiff = abs(angleToPlayer - movementAngle);
            
            // 如果从正面受击，伤害减少50%
            if (angleDiff < PI / 3 && this.shieldActive) {
                amount = Math.floor(amount * 0.5);
                this.shieldActive = false;
                this.shieldCooldown = 2000; // 2秒后恢复护盾
            }
        }
        
        super.takeDamage(amount);
    }

    update(player) {
        super.update(player);
        
        // 护盾恢复
        if (!this.shieldActive && millis() > this.shieldCooldown) {
            this.shieldActive = true;
        }
    }

    getColor() {
        return this.shieldActive ? color(180, 180, 200) : color(150, 150, 170);
    }

    getEmoji() {
        return "🛡️";
    }

    display() {
        super.display();
        
        // 显示护盾状态
        if (this.shieldActive) {
            push();
            translate(this.x, this.y);
            noFill();
            stroke(200, 200, 255, 150);
            strokeWeight(3);
            ellipse(0, 0, this.size + 10, this.size + 10);
            pop();
        }
    }
}

// 法师 - 远程魔法攻击，可瞬移
class MageEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'mage');
        this.speed = 0.9;
        this.health = 4;
        this.maxHealth = 4;
        this.attackCooldown = 2500;
        this.projectileDamage = 2;
        this.xpValue = 10;
        this.goldValue = 4;
        this.teleportCooldown = 8000;
        this.lastTeleportTime = millis();
        this.magicColor = color(150, 100, 255);
    }

    update(player) {
        super.update(player);
        
        // 瞬移逻辑
        if (millis() - this.lastTeleportTime > this.teleportCooldown) {
            let distance = dist(this.x, this.y, player.x, player.y);
            
            // 如果距离玩家太近或太远，瞬移到合适位置
            if (distance < 100 || distance > 300) {
                this.teleport(player);
                this.lastTeleportTime = millis();
            }
        }
    }

    teleport(player) {
        // 瞬移到玩家周围随机位置
        let angle = random(TWO_PI);
        let distance = random(150, 250);
        this.x = player.x + cos(angle) * distance;
        this.y = player.y + sin(angle) * distance;
        
        // 瞬移特效
        if (typeof game !== 'undefined' && game.addExplosion) {
            game.addExplosion(this.x, this.y, [150, 100, 255], 8);
        }
    }

    attack(player) {
        // 发射3发魔法弹，呈扇形
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        
        for (let i = -1; i <= 1; i++) {
            let spreadAngle = angleToPlayer + (i * PI / 8);
            let projectile = new Projectile(
                this.x, this.y, spreadAngle, 'enemy', 
                this.projectileDamage, this.magicColor, 6, 5
            );
            projectile.isMagic = true;
            this.projectiles.push(projectile);
        }
    }

    getColor() {
        return color(150, 100, 255);
    }

    getEmoji() {
        return "🧙";
    }
}

// 史莱姆 - 被击中分裂成小史莱姆
class SlimeEnemy extends Enemy {
    constructor(x, y, isSmall = false) {
        super(x, y, 'slime');
        this.isSmall = isSmall;
        
        if (isSmall) {
            this.size = 18;
            this.speed = 1.8;
            this.health = 2;
            this.maxHealth = 2;
            this.xpValue = 3;
            this.goldValue = 1;
        } else {
            this.size = 30;
            this.speed = 1.2;
            this.health = 6;
            this.maxHealth = 6;
            this.xpValue = 8;
            this.goldValue = 3;
        }
        
        this.attackCooldown = 4000;
        this.projectileDamage = 1;
        this.canSplit = !isSmall;
        this.splitThreshold = 3; // 受到3次攻击后分裂
        this.hitsTaken = 0;
    }

    takeDamage(amount) {
        this.hitsTaken++;
        super.takeDamage(amount);
        
        // 分裂逻辑
        if (this.canSplit && this.hitsTaken >= this.splitThreshold && this.health > 0) {
            this.split();
        }
    }

    split() {
        if (typeof game === 'undefined' || !game) return;
        
        this.canSplit = false;
        
        // 创建2个小史莱姆
        for (let i = 0; i < 2; i++) {
            let offsetX = random(-20, 20);
            let offsetY = random(-20, 20);
            let smallSlime = new SlimeEnemy(this.x + offsetX, this.y + offsetY, true);
            game.enemies.push(smallSlime);
        }
        
        // 分裂特效
        if (game.addExplosion) {
            game.addExplosion(this.x, this.y, [100, 255, 100], 10);
        }
    }

    moveTowardsPlayer(player) {
        // 史莱姆有弹跳移动效果
        let angle = atan2(player.y - this.y, player.x - this.x);
        let bounce = sin(millis() * 0.01) * 0.3;
        this.x += cos(angle + bounce) * this.speed;
        this.y += sin(angle + bounce) * this.speed;
    }

    getColor() {
        return this.isSmall ? color(100, 200, 100) : color(80, 255, 80);
    }

    getEmoji() {
        return "🟢";
    }

    display() {
        super.display();
        
        // 史莱姆有弹性效果
        let squish = sin(millis() * 0.01) * 0.1;
        
        push();
        translate(this.x, this.y);
        fill(100, 255, 100, 100);
        noStroke();
        ellipse(0, this.size * 0.3, this.size * (1 + squish), this.size * (1 - squish));
        pop();
    }
}

// 狙击手 - 高伤害单发，攻击前蓄力
class SniperEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'sniper');
        this.speed = 0.5;
        this.health = 3;
        this.maxHealth = 3;
        this.attackCooldown = 5000;
        this.projectileDamage = 5;
        this.xpValue = 15;
        this.goldValue = 6;
        this.size = 28;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeDuration = 1500;
        this.chargeColor = color(255, 255, 0);
    }

    update(player) {
        // 保持距离玩家
        let distance = dist(this.x, this.y, player.x, player.y);
        let desiredDistance = 250;
        
        if (distance < desiredDistance) {
            // 后退
            let angle = atan2(this.y - player.y, this.x - player.x);
            this.x += cos(angle) * this.speed;
            this.y += sin(angle) * this.speed;
        } else if (distance > desiredDistance + 50) {
            // 靠近
            this.moveTowardsPlayer(player);
        }
        
        this.updateAttack(player);
        this.updateProjectiles(player);
        
        // 更新蓄力状态
        if (this.isCharging) {
            let chargeProgress = (millis() - this.chargeStartTime) / this.chargeDuration;
            if (chargeProgress >= 1) {
                this.fireSniperShot(player);
                this.isCharging = false;
            }
        }
    }

    updateAttack(player) {
        if (!this.isCharging && millis() - this.lastAttackTime > this.attackCooldown) {
            this.isCharging = true;
            this.chargeStartTime = millis();
        }
    }

    fireSniperShot(player) {
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        let projectile = new Projectile(
            this.x, this.y, angleToPlayer, 'enemy', 
            this.projectileDamage, color(255, 50, 50), 8, 12
        );
        projectile.isSniperShot = true;
        projectile.pierceCount = 2; // 可穿透2个敌人
        this.projectiles.push(projectile);
        
        this.lastAttackTime = millis();
    }

    getColor() {
        return color(100, 100, 120);
    }

    getEmoji() {
        return "🎯";
    }

    display() {
        super.display();
        
        // 蓄力指示器
        if (this.isCharging) {
            let chargeProgress = (millis() - this.chargeStartTime) / this.chargeDuration;
            chargeProgress = constrain(chargeProgress, 0, 1);
            
            push();
            translate(this.x, this.y);
            noFill();
            stroke(255, 255 - chargeProgress * 255, 0);
            strokeWeight(3);
            let arcLength = TWO_PI * chargeProgress;
            arc(0, 0, this.size + 15, this.size + 15, -PI/2, -PI/2 + arcLength);
            pop();
        }
    }
}

// 治疗者 - 治疗周围敌人
class HealerEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 'healer');
        this.speed = 0.7;
        this.health = 5;
        this.maxHealth = 5;
        this.attackCooldown = 4000;
        this.projectileDamage = 1;
        this.xpValue = 10;
        this.goldValue = 4;
        this.size = 28;
        this.healRange = 150;
        this.healAmount = 2;
        this.lastHealTime = millis();
        this.healCooldown = 3000;
        this.healColor = color(100, 255, 100);
    }

    update(player) {
        super.update(player);
        
        // 治疗周围敌人
        if (millis() - this.lastHealTime > this.healCooldown) {
            this.healNearbyEnemies();
            this.lastHealTime = millis();
        }
    }

    healNearbyEnemies() {
        if (typeof game === 'undefined' || !game || !game.enemies) return;
        
        let healedCount = 0;
        
        for (let enemy of game.enemies) {
            if (enemy === this || enemy.isDead()) continue;
            
            let distance = dist(this.x, this.y, enemy.x, enemy.y);
            if (distance <= this.healRange) {
                enemy.health = Math.min(enemy.maxHealth, enemy.health + this.healAmount);
                healedCount++;
            }
        }
        
        // 治疗特效
        if (healedCount > 0 && typeof game !== 'undefined' && game.addExplosion) {
            game.addExplosion(this.x, this.y, [100, 255, 100], 12);
        }
    }

    attack(player) {
        // 发射治疗弹（对玩家造成伤害）
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        let projectile = new Projectile(
            this.x, this.y, angleToPlayer, 'enemy', 
            this.projectileDamage, this.healColor, 5, 4
        );
        projectile.isHealShot = true;
        this.projectiles.push(projectile);
    }

    getColor() {
        return color(100, 255, 100);
    }

    getEmoji() {
        return "💊";
    }

    display() {
        super.display();
        
        // 治疗范围指示器
        push();
        translate(this.x, this.y);
        noFill();
        stroke(100, 255, 100, 80);
        strokeWeight(1);
        ellipse(0, 0, this.healRange * 2, this.healRange * 2);
        
        // 十字标记
        stroke(100, 255, 100, 150);
        strokeWeight(2);
        line(-8, 0, 8, 0);
        line(0, -8, 0, 8);
        pop();
    }
}