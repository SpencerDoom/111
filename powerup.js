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
            default:
                return "💎";
        }
    }
}

// Utility functions for creating powerups
function createRandomPowerUp(x, y) {
    let types = ['health', 'speed', 'damage', 'gold', 'xp'];
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