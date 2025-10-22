// Particle system for visual effects
class Particle {
    constructor(x, y, color, size = 5, velocity = null) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.size = size;
        this.originalSize = size;
        
        // Velocity
        if (velocity) {
            this.vx = velocity.x;
            this.vy = velocity.y;
        } else {
            this.vx = random(-3, 3);
            this.vy = random(-3, 3);
        }
        
        // Lifecycle
        this.life = 255;
        this.maxLife = 255;
        this.decay = random(2, 8);
        
        // Effects
        this.gravity = 0;
        this.friction = 1;
        this.bounce = 0;
    }
    
    update() {
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply gravity
        this.vy += this.gravity;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Boundary bounce
        if (this.bounce > 0) {
            if (this.x <= 0 || this.x >= width) {
                this.vx *= -this.bounce;
                this.x = constrain(this.x, 0, width);
            }
            if (this.y <= 0 || this.y >= height) {
                this.vy *= -this.bounce;
                this.y = constrain(this.y, 0, height);
            }
        }
        
        // Update life and size
        this.life -= this.decay;
        this.size = map(this.life, 0, this.maxLife, 0, this.originalSize);
    }
    
    display() {
        push();
        
        let alpha = map(this.life, 0, this.maxLife, 0, 255);
        if (Array.isArray(this.color)) {
            fill(this.color[0], this.color[1], this.color[2], alpha);
        } else {
            fill(red(this.color), green(this.color), blue(this.color), alpha);
        }
        
        noStroke();
        ellipse(this.x, this.y, this.size, this.size);
        
        pop();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    addParticle(particle) {
        this.particles.push(particle);
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            particle.update();
            
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    display() {
        for (let particle of this.particles) {
            particle.display();
        }
    }
    
    getCount() {
        return this.particles.length;
    }
    
    clear() {
        this.particles = [];
    }
}

// Specialized particle effects
class StarField {
    constructor(count = 100) {
        this.stars = [];
        this.scrollSpeed = 1;
        
        for (let i = 0; i < count; i++) {
            this.stars.push(this.createStar());
        }
    }
    
    createStar() {
        return {
            x: random(0, width),
            y: random(0, height),
            size: random(1, 4),
            brightness: random(100, 255),
            speed: random(0.2, 1.5)
        };
    }
    
    update() {
        for (let star of this.stars) {
            star.y += star.speed * this.scrollSpeed;
            
            // Wrap around when star goes off screen
            if (star.y > height + star.size) {
                star.y = -star.size;
                star.x = random(0, width);
            }
        }
    }
    
    display() {
        push();
        
        for (let star of this.stars) {
            fill(star.brightness, star.brightness, 255, star.brightness);
            noStroke();
            ellipse(star.x, star.y, star.size, star.size);
        }
        
        pop();
    }
    
    setScrollSpeed(speed) {
        this.scrollSpeed = speed;
    }
}

// Explosion effect
class ExplosionParticle extends Particle {
    constructor(x, y, color, size, explosionForce = 1) {
        super(x, y, color, size);
        
        // Random explosion direction
        let angle = random(0, TWO_PI);
        let force = random(2, 8) * explosionForce;
        this.vx = cos(angle) * force;
        this.vy = sin(angle) * force;
        
        this.gravity = 0.1;
        this.friction = 0.98;
        this.decay = random(3, 7);
    }
}

// Screen shake effect
class ScreenShake {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.intensity = 0;
        this.duration = 0;
        this.maxDuration = 0;
    }
    
    start(intensity, duration) {
        this.intensity = intensity;
        this.duration = duration;
        this.maxDuration = duration;
    }
    
    update() {
        if (this.duration > 0) {
            // Generate random shake based on intensity
            let currentIntensity = map(this.duration, 0, this.maxDuration, 0, this.intensity);
            this.x = random(-currentIntensity, currentIntensity);
            this.y = random(-currentIntensity, currentIntensity);
            
            this.duration--;
        } else {
            this.x = 0;
            this.y = 0;
        }
    }
    
    getOffset() {
        return { x: this.x, y: this.y };
    }
    
    isActive() {
        return this.duration > 0;
    }
}

// Utility functions for creating particle effects
function createExplosion(x, y, color, particleCount = 10, explosionForce = 1) {
    let particles = [];
    for (let i = 0; i < particleCount; i++) {
        let size = random(3, 8);
        particles.push(new ExplosionParticle(x, y, color, size, explosionForce));
    }
    return particles;
}

function createTrail(x, y, color, length = 5) {
    let particles = [];
    for (let i = 0; i < length; i++) {
        let offsetX = random(-2, 2);
        let offsetY = random(-2, 2);
        let size = map(i, 0, length - 1, 1, 4);
        particles.push(new Particle(x + offsetX, y + offsetY, color, size));
    }
    return particles;
}

function createSpark(x, y, direction, color) {
    let particle = new Particle(x, y, color, random(2, 5));
    particle.vx = cos(direction) * random(3, 8);
    particle.vy = sin(direction) * random(3, 8);
    particle.gravity = 0.2;
    particle.friction = 0.95;
    return particle;
}

// Global particle system instance
let globalParticleSystem;

function initializeParticleSystem() {
    globalParticleSystem = new ParticleSystem();
}

function addParticleEffect(x, y, color, count = 5, type = 'explosion') {
    if (!globalParticleSystem) return;
    
    switch(type) {
        case 'explosion':
            let explosionParticles = createExplosion(x, y, color, count);
            for (let particle of explosionParticles) {
                globalParticleSystem.addParticle(particle);
            }
            break;
        case 'trail':
            let trailParticles = createTrail(x, y, color, count);
            for (let particle of trailParticles) {
                globalParticleSystem.addParticle(particle);
            }
            break;
    }
}