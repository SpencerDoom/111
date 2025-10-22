// Projectile class for player and enemy bullets
class Projectile {
    constructor(x, y, angle, type, damage, bulletColor = null, speed = 8, size = 6) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.type = type; // 'player', 'enemy', 'boss'
        this.damage = damage;
        this.speed = speed;
        this.size = size;
        this.color = bulletColor || this.getDefaultColor();
        
        // Calculate velocity components
        this.vx = cos(angle) * speed;
        this.vy = sin(angle) * speed;
        
        // Lifetime tracking
        this.lifespan = 120; // frames (2 seconds at 60fps)
        this.age = 0;
        
        // Visual effects
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update() {
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Update trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Update age
        this.age++;
    }

    display() {
        push();
        
        // Draw trail
        if (this.trail.length > 1) {
            stroke(red(this.color), green(this.color), blue(this.color), 100);
            strokeWeight(this.size * 0.5);
            noFill();
            beginShape();
            for (let point of this.trail) {
                vertex(point.x, point.y);
            }
            endShape();
        }
        
        // Draw projectile
        fill(this.color);
        stroke(255);
        strokeWeight(1);
        ellipse(this.x, this.y, this.size, this.size);
        
        // Add glow effect for special projectiles
        if (this.type === 'boss') {
            fill(red(this.color), green(this.color), blue(this.color), 50);
            noStroke();
            ellipse(this.x, this.y, this.size * 2, this.size * 2);
        }
        
        pop();
    }

    getDefaultColor() {
        switch(this.type) {
            case 'player':
                return color(100, 200, 255); // Blue
            case 'enemy':
                return color(255, 100, 100); // Red
            case 'boss':
                return color(255, 100, 0); // Orange
            default:
                return color(255, 255, 255); // White
        }
    }

    isDead() {
        return this.age >= this.lifespan || this.isOffScreen();
    }

    isOffScreen() {
        let margin = 50;
        return this.x < -margin || 
               this.x > width + margin || 
               this.y < -margin || 
               this.y > height + margin;
    }

    // Collision detection helpers
    collidesWith(entity) {
        let distance = dist(this.x, this.y, entity.x, entity.y);
        return distance < (this.size/2 + entity.size/2);
    }

    // Special projectile types can override these methods
    onHit(target) {
        // Override in subclasses for special effects
    }

    getHitRadius() {
        return this.size / 2;
    }
}