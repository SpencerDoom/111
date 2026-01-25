// Environmental effects and obstacles system
class EnvironmentSystem {
    constructor() {
        this.obstacles = [];
        this.asteroids = [];
        this.energyFields = [];
        this.timeField = null; // Slow-motion field
        this.gravityWells = [];
        
        // Spawn timers
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnInterval = 10000; // 10 seconds
        
        this.fieldSpawnTimer = 0;
        this.fieldSpawnInterval = 15000; // 15 seconds
        
        this.gravitySpawnTimer = 0;
        this.gravitySpawnInterval = 20000; // 20 seconds
    }
    
    update(game) {
        this.updateAsteroids();
        this.updateEnergyFields();
        this.updateTimeField();
        this.updateGravityWells();
        this.spawnEnvironmentalEffects(game);
    }
    
    spawnEnvironmentalEffects(game) {
        // Spawn asteroids
        this.asteroidSpawnTimer += deltaTime;
        if (this.asteroidSpawnTimer > this.asteroidSpawnInterval) {
            this.spawnAsteroid();
            this.asteroidSpawnTimer = 0;
            // Decrease interval over time for more challenge
            this.asteroidSpawnInterval = max(5000, this.asteroidSpawnInterval - 100);
        }
        
        // Spawn energy fields
        this.fieldSpawnTimer += deltaTime;
        if (this.fieldSpawnTimer > this.fieldSpawnInterval) {
            this.spawnEnergyField();
            this.fieldSpawnTimer = 0;
        }
        
        // Spawn gravity wells
        this.gravitySpawnTimer += deltaTime;
        if (this.gravitySpawnTimer > this.gravitySpawnInterval) {
            this.spawnGravityWell();
            this.gravitySpawnTimer = 0;
        }
    }
    
    spawnAsteroid() {
        let side = floor(random(4));
        let x, y;
        
        switch(side) {
            case 0: // Top
                x = random(50, width - 50);
                y = -30;
                break;
            case 1: // Right
                x = width + 30;
                y = random(50, height - 50);
                break;
            case 2: // Bottom
                x = random(50, width - 50);
                y = height + 30;
                break;
            case 3: // Left
                x = -30;
                y = random(50, height - 50);
                break;
        }
        
        let asteroid = new Asteroid(x, y);
        this.asteroids.push(asteroid);
    }
    
    spawnEnergyField() {
        let x = random(100, width - 100);
        let y = random(100, height - 100);
        let type = random(['healing', 'damage', 'speed', 'shield']);
        
        let field = new EnergyField(x, y, type);
        this.energyFields.push(field);
    }
    
    spawnGravityWell() {
        let x = random(150, width - 150);
        let y = random(150, height - 150);
        
        let well = new GravityWell(x, y);
        this.gravityWells.push(well);
    }
    
    updateAsteroids() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            let asteroid = this.asteroids[i];
            asteroid.update();
            
            if (asteroid.isOffScreen()) {
                this.asteroids.splice(i, 1);
            }
        }
    }
    
    updateEnergyFields() {
        for (let i = this.energyFields.length - 1; i >= 0; i--) {
            let field = this.energyFields[i];
            field.update();
            
            if (field.isExpired()) {
                this.energyFields.splice(i, 1);
            }
        }
    }
    
    updateTimeField() {
        if (this.timeField) {
            this.timeField.update();
            if (this.timeField.isExpired()) {
                this.timeField = null;
            }
        }
    }
    
    updateGravityWells() {
        for (let i = this.gravityWells.length - 1; i >= 0; i--) {
            let well = this.gravityWells[i];
            well.update();
            
            if (well.isExpired()) {
                this.gravityWells.splice(i, 1);
            }
        }
    }
    
    draw() {
        // Draw energy fields
        for (let field of this.energyFields) {
            field.draw();
        }
        
        // Draw gravity wells
        for (let well of this.gravityWells) {
            well.draw();
        }
        
        // Draw time field
        if (this.timeField) {
            this.timeField.draw();
        }
        
        // Draw asteroids
        for (let asteroid of this.asteroids) {
            asteroid.draw();
        }
    }
    
    checkCollisions(game) {
        // Check asteroid collisions with player
        for (let asteroid of this.asteroids) {
            if (checkCircleCollision(asteroid, game.player)) {
                game.player.takeDamage(1);
                asteroid.health -= 2;
                game.addScreenShake(8, 15);
                
                if (asteroid.health <= 0) {
                    let index = this.asteroids.indexOf(asteroid);
                    this.asteroids.splice(index, 1);
                    game.addExplosion(asteroid.x, asteroid.y, [139, 69, 19], 8);
                }
            }
            
            // Check asteroid collisions with enemies
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                let enemy = game.enemies[i];
                if (checkCircleCollision(asteroid, enemy)) {
                    enemy.takeDamage(1);
                    asteroid.health -= 1;
                    
                    if (enemy.isDead()) {
                        game.enemies.splice(i, 1);
                        game.totalKills++;
                    }
                    
                    if (asteroid.health <= 0) {
                        let index = this.asteroids.indexOf(asteroid);
                        this.asteroids.splice(index, 1);
                        game.addExplosion(asteroid.x, asteroid.y, [139, 69, 19], 8);
                        break;
                    }
                }
            }
        }
        
        // Check energy field effects
        for (let field of this.energyFields) {
            field.checkEffect(game.player);
            for (let enemy of game.enemies) {
                field.checkEffect(enemy);
            }
        }
        
        // Check time field effect
        if (this.timeField) {
            this.timeField.checkEffect(game.player);
            for (let enemy of game.enemies) {
                this.timeField.checkEffect(enemy);
            }
        }
        
        // Check gravity well effects
        for (let well of this.gravityWells) {
            well.applyGravity(game.player);
            for (let enemy of game.enemies) {
                well.applyGravity(enemy);
            }
            for (let projectile of game.player.projectiles) {
                well.applyGravity(projectile);
            }
        }
    }
    
    clear() {
        this.obstacles = [];
        this.asteroids = [];
        this.energyFields = [];
        this.timeField = null;
        this.gravityWells = [];
    }
}

// Asteroid obstacle class
class Asteroid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(20, 40);
        this.speed = random(1, 3);
        this.health = floor(this.size / 10);
        this.rotation = random(TWO_PI);
        this.rotationSpeed = random(-0.05, 0.05);
        this.color = color(139, 69, 19); // Brown
    }
    
    update() {
        // Move toward center
        let centerX = width / 2;
        let centerY = height / 2;
        let angle = atan2(centerY - this.y, centerX - this.x);
        
        this.x += cos(angle) * this.speed;
        this.y += sin(angle) * this.speed;
        
        // Rotate
        this.rotation += this.rotationSpeed;
    }
    
    draw() {
        push();
        translate(this.x, this.y);
        rotate(this.rotation);
        
        // Asteroid body
        fill(this.color);
        stroke(0);
        strokeWeight(2);
        ellipse(0, 0, this.size, this.size);
        
        // Craters
        fill(101, 67, 33);
        ellipse(-this.size * 0.2, -this.size * 0.1, this.size * 0.3, this.size * 0.3);
        ellipse(this.size * 0.3, this.size * 0.2, this.size * 0.2, this.size * 0.2);
        
        pop();
    }
    
    isOffScreen() {
        let margin = 100;
        return this.x < -margin || this.x > width + margin || 
               this.y < -margin || this.y > height + margin;
    }
}

// Energy field class
class EnergyField {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 60;
        this.duration = 8000; // 8 seconds
        this.spawnTime = millis();
        this.pulsePhase = 0;
        
        // Field properties
        this.effects = {
            healing: { color: [100, 255, 100], emoji: "❤️", effect: (entity) => {
                if (entity.heal) entity.heal(1);
            }},
            damage: { color: [255, 100, 100], emoji: "🔥", effect: (entity) => {
                if (entity.takeDamage) entity.takeDamage(1);
            }},
            speed: { color: [100, 100, 255], emoji: "⚡", effect: (entity) => {
                if (entity.speed) entity.speed *= 1.5;
                setTimeout(() => {
                    if (entity.speed) entity.speed /= 1.5;
                }, 3000);
            }},
            shield: { color: [100, 200, 255], emoji: "🛡️", effect: (entity) => {
                if (entity.shield !== undefined) {
                    entity.shield = (entity.shield || 0) + 2;
                    if (entity.maxShield) entity.maxShield = entity.shield;
                }
            }}
        };
    }
    
    update() {
        this.pulsePhase += 0.1;
    }
    
    draw() {
        push();
        translate(this.x, this.y);
        
        let effect = this.effects[this.type];
        let pulseSize = this.radius + sin(this.pulsePhase) * 10;
        
        // Outer glow
        fill(effect.color[0], effect.color[1], effect.color[2], 50);
        noStroke();
        ellipse(0, 0, pulseSize * 2, pulseSize * 2);
        
        // Main field
        fill(effect.color[0], effect.color[1], effect.color[2], 100);
        stroke(255);
        strokeWeight(2);
        ellipse(0, 0, this.radius * 2, this.radius * 2);
        
        // Field emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.radius * 0.8);
        text(effect.emoji, 0, 0);
        
        pop();
    }
    
    checkEffect(entity) {
        let distance = dist(this.x, this.y, entity.x, entity.y);
        if (distance < this.radius && this.effects[this.type]) {
            this.effects[this.type].effect(entity);
        }
    }
    
    isExpired() {
        return millis() - this.spawnTime > this.duration;
    }
}

// Time field class (slow motion)
class TimeField {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 80;
        this.duration = 6000; // 6 seconds
        this.spawnTime = millis();
        this.pulsePhase = 0;
        this.slowFactor = 0.5; // 50% speed
    }
    
    update() {
        this.pulsePhase += 0.05;
    }
    
    draw() {
        push();
        translate(this.x, this.y);
        
        let pulseSize = this.radius + sin(this.pulsePhase) * 15;
        
        // Time field effect
        fill(150, 150, 255, 80);
        noStroke();
        ellipse(0, 0, pulseSize * 2, pulseSize * 2);
        
        // Concentric circles
        stroke(150, 150, 255, 150);
        strokeWeight(3);
        noFill();
        for (let i = 1; i <= 3; i++) {
            ellipse(0, 0, (this.radius / 3) * i * 2, (this.radius / 3) * i * 2);
        }
        
        // Time emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.radius * 0.6);
        text("⏰", 0, 0);
        
        pop();
    }
    
    checkEffect(entity) {
        let distance = dist(this.x, this.y, entity.x, entity.y);
        if (distance < this.radius) {
            if (entity.originalSpeed === undefined) {
                entity.originalSpeed = entity.speed || 1;
                entity.speed = entity.originalSpeed * this.slowFactor;
            }
        }
    }
    
    isExpired() {
        let expired = millis() - this.spawnTime > this.duration;
        if (expired && this.affectedEntities) {
            // Restore original speeds
            for (let entity of this.affectedEntities) {
                if (entity.originalSpeed !== undefined) {
                    entity.speed = entity.originalSpeed;
                    delete entity.originalSpeed;
                }
            }
        }
        return expired;
    }
}

// Gravity well class
class GravityWell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 100;
        this.duration = 10000; // 10 seconds
        this.spawnTime = millis();
        this.pulsePhase = 0;
        this.gravityStrength = 0.5;
    }
    
    update() {
        this.pulsePhase += 0.03;
    }
    
    draw() {
        push();
        translate(this.x, this.y);
        
        let pulseSize = this.radius + sin(this.pulsePhase) * 5;
        
        // Gravity well spiral
        stroke(100, 50, 150, 200);
        strokeWeight(3);
        noFill();
        
        // Draw spiral
        let steps = 50;
        beginShape();
        for (let i = 0; i < steps; i++) {
            let angle = (i / steps) * TWO_PI * 3; // 3 rotations
            let radius = (i / steps) * pulseSize;
            vertex(cos(angle) * radius, sin(angle) * radius);
        }
        endShape();
        
        // Center
        fill(100, 50, 150);
        noStroke();
        ellipse(0, 0, 20, 20);
        
        // Gravity emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(20);
        text("🌀", 0, 0);
        
        pop();
    }
    
    applyGravity(entity) {
        let distance = dist(this.x, this.y, entity.x, entity.y);
        if (distance < this.radius && distance > 0) {
            let angle = atan2(this.y - entity.y, this.x - entity.x);
            let gravity = this.gravityStrength * (1 - distance / this.radius);
            
            if (entity.x !== undefined) entity.x += cos(angle) * gravity;
            if (entity.y !== undefined) entity.y += sin(angle) * gravity;
        }
    }
    
    isExpired() {
        return millis() - this.spawnTime > this.duration;
    }
}