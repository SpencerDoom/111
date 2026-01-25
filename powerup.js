// PowerUp and Item classes for collectibles
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = 20;
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
            if (typeof playSound === 'function') {
                playSound('pickup');
            }
            if (typeof createExplosion === 'function') {
                createExplosion(this.x, this.y, this.getColor(), 8);
            }
        }
    }
    
    display() {
        push();
        translate(this.x, this.y + sin(this.bobOffset) * 3);
        
        // Outer glow
        let glowColor = this.getColor();
        fill(red(glowColor), green(glowColor), blue(glowColor), this.glowIntensity);
        noStroke();
        ellipse(0, 0, this.size + 10, this.size + 10);
        
        // Main body
        fill(glowColor);
        stroke(255);
        strokeWeight(2);
        ellipse(0, 0, this.size, this.size);
        
        // Item emoji/symbol
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.7);
        text(this.getEmoji(), 0, 0);
        
        pop();
    }
    
    applyEffect(player) {
        // Override in subclasses
    }
    
    getColor() {
        return color(255, 255, 255); // Default white
    }
    
    getEmoji() {
        return "💎"; // Default gem
    }
    
    isExpired() {
        return millis() - this.spawnTime > this.lifespan;
    }
}

class PowerUp extends Item {
    constructor(x, y, type) {
        super(x, y, type);
        this.size = 25;
        this.magnetRange = 60;
    }
    
    applyEffect(player) {
        switch(this.type) {
            case 'health':
                player.heal(2);
                break;
            case 'speed':
                player.tempSpeedBoost = 300; // 5 seconds at 60fps
                break;
            case 'damage':
                player.tempDamageBoost = 300; // 5 seconds at 60fps
                break;
            case 'gold':
                player.gold += random(5, 15);
                break;
            case 'xp':
                player.gainXP(random(10, 25));
                break;
            // New power-up types
            case 'shield':
                player.shield = (player.shield || 0) + 2;
                player.maxShield = player.shield;
                break;
            case 'freeze':
                // Freeze nearby enemies for 3 seconds
                for (let enemy of game.enemies) {
                    let distance = dist(player.x, player.y, enemy.x, enemy.y);
                    if (distance < 100) {
                        enemy.frozen = true;
                        enemy.freezeEndTime = millis() + 3000;
                    }
                }
                // Also freeze boss if active
                if (game.waveManager.isBossActive()) {
                    let boss = game.waveManager.getBoss();
                    let distance = dist(player.x, player.y, boss.x, boss.y);
                    if (distance < 100) {
                        boss.frozen = true;
                        boss.freezeEndTime = millis() + 3000;
                    }
                }
                break;
            case 'explosion':
                // Deal massive damage to nearby enemies
                let explosionRadius = 120;
                let damage = 10;
                for (let i = game.enemies.length - 1; i >= 0; i--) {
                    let enemy = game.enemies[i];
                    let distance = dist(player.x, player.y, enemy.x, enemy.y);
                    if (distance < explosionRadius) {
                        enemy.takeDamage(damage);
                        if (enemy.isDead()) {
                            game.enemies.splice(i, 1);
                        }
                    }
                }
                // Damage boss
                if (game.waveManager.isBossActive()) {
                    let boss = game.waveManager.getBoss();
                    let distance = dist(player.x, player.y, boss.x, boss.y);
                    if (distance < explosionRadius) {
                        boss.takeDamage(damage);
                    }
                }
                game.addExplosion(player.x, player.y, [255, 100, 100], 25);
                game.addScreenShake(12, 25);
                break;
            case 'multishot':
                player.tempMultiShot = 600; // 10 seconds
                break;
            case 'piercing':
                player.tempPiercing = 600; // 10 seconds
                break;
            case 'critical':
                player.tempCritChance = 0.5; // 50% crit chance for 10 seconds
                break;
            case 'timeslow':
                player.tempTimeSlow = 600; // 10 seconds
                break;
            case 'vampirism':
                player.tempVampiric = 600; // 10 seconds
                break;
            case 'xpmagnet':
                player.tempXPMagnet = 1200; // 20 seconds
                break;
            case 'goldmagnet':
                player.tempGoldMagnet = 1200; // 20 seconds
                break;
        }
    }
    
    getColor() {
        switch(this.type) {
            case 'health':
                return color(100, 255, 100); // Green
            case 'speed':
                return color(100, 100, 255); // Blue
            case 'damage':
                return color(255, 100, 100); // Red
            case 'gold':
                return color(255, 215, 0); // Gold
            case 'xp':
                return color(255, 100, 255); // Magenta
            // New power-up colors
            case 'shield':
                return color(100, 200, 255); // Light blue
            case 'freeze':
                return color(150, 220, 255); // Ice blue
            case 'explosion':
                return color(255, 150, 0); // Orange
            case 'multishot':
                return color(255, 200, 100); // Light orange
            case 'piercing':
                return color(200, 200, 255); // Light purple
            case 'critical':
                return color(255, 215, 0); // Gold
            case 'timeslow':
                return color(150, 150, 255); // Purple
            case 'vampirism':
                return color(255, 0, 100); // Dark red
            case 'xpmagnet':
                return color(255, 100, 255); // Pink
            case 'goldmagnet':
                return color(255, 215, 0); // Gold
            default:
                return color(255, 255, 255); // White
        }
    }
    
    getEmoji() {
        switch(this.type) {
            case 'health':
                return "❤️";
            case 'speed':
                return "⚡";
            case 'damage':
                return "🔥";
            case 'gold':
                return "💰";
            case 'xp':
                return "⭐";
            // New power-up emojis
            case 'shield':
                return "🛡️";
            case 'freeze':
                return "❄️";
            case 'explosion':
                return "💥";
            case 'multishot':
                return "🔱";
            case 'piercing':
                return "🎯";
            case 'critical':
                return "💢";
            case 'timeslow':
                return "⏰";
            case 'vampirism':
                return "🩸";
            case 'xpmagnet':
                return "🌟";
            case 'goldmagnet':
                return "🧲";
            default:
                return "💎";
        }
    }
}

// Utility functions for creating powerups
function createRandomPowerUp(x, y) {
    let types = ['health', 'speed', 'damage', 'gold', 'xp', 'shield', 'freeze', 'explosion', 'multishot', 'piercing', 'critical', 'timeslow', 'vampirism', 'xpmagnet', 'goldmagnet'];
    let randomType = random(types);
    return new PowerUp(x, y, randomType);
}

function createHealthPowerUp(x, y) {
    return new PowerUp(x, y, 'health');
}

function createSpeedPowerUp(x, y) {
    return new PowerUp(x, y, 'speed');
}

function createDamagePowerUp(x, y) {
    return new PowerUp(x, y, 'damage');
}

function createGoldPowerUp(x, y) {
    return new PowerUp(x, y, 'gold');
}

function createXPPowerUp(x, y) {
    return new PowerUp(x, y, 'xp');
}

// New power-up creation functions
function createShieldPowerUp(x, y) {
    return new PowerUp(x, y, 'shield');
}

function createFreezePowerUp(x, y) {
    return new PowerUp(x, y, 'freeze');
}

function createExplosionPowerUp(x, y) {
    return new PowerUp(x, y, 'explosion');
}

function createMultiShotPowerUp(x, y) {
    return new PowerUp(x, y, 'multishot');
}

function createPiercingPowerUp(x, y) {
    return new PowerUp(x, y, 'piercing');
}

function createCriticalPowerUp(x, y) {
    return new PowerUp(x, y, 'critical');
}

function createTimeSlowPowerUp(x, y) {
    return new PowerUp(x, y, 'timeslow');
}

function createVampirismPowerUp(x, y) {
    return new PowerUp(x, y, 'vampirism');
}

function createXPMagnetPowerUp(x, y) {
    return new PowerUp(x, y, 'xpmagnet');
}

function createGoldMagnetPowerUp(x, y) {
    return new PowerUp(x, y, 'goldmagnet');
}