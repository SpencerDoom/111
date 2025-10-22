// Collision detection and handling system
class CollisionManager {
    constructor() {
        // Collision layers for optimization
        this.layers = {
            player: [],
            enemies: [],
            projectiles: [],
            powerups: [],
            environment: []
        };
    }

    // Register entities for collision checking
    registerEntity(entity, layer) {
        if (this.layers[layer]) {
            this.layers[layer].push(entity);
        }
    }

    // Clear all registered entities (called each frame)
    clear() {
        for (let layer in this.layers) {
            this.layers[layer] = [];
        }
    }

    // Check collisions between two layers
    checkCollisions(layer1, layer2, callback) {
        for (let entity1 of this.layers[layer1]) {
            for (let entity2 of this.layers[layer2]) {
                if (this.areColliding(entity1, entity2)) {
                    callback(entity1, entity2);
                }
            }
        }
    }

    // Basic circular collision detection
    areColliding(entity1, entity2) {
        let distance = dist(entity1.x, entity1.y, entity2.x, entity2.y);
        let minDistance = (entity1.size || entity1.getHitRadius()) / 2 + 
                         (entity2.size || entity2.getHitRadius()) / 2;
        return distance < minDistance;
    }

    // More precise collision detection methods
    circleCircleCollision(x1, y1, r1, x2, y2, r2) {
        let distance = dist(x1, y1, x2, y2);
        return distance < (r1 + r2);
    }

    circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
        // Find the closest point on the rectangle to the circle
        let closestX = constrain(cx, rx, rx + rw);
        let closestY = constrain(cy, ry, ry + rh);
        
        // Calculate distance from the circle's center to this closest point
        let distance = dist(cx, cy, closestX, closestY);
        
        return distance < cr;
    }

    rectRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && 
               x1 + w1 > x2 && 
               y1 < y2 + h2 && 
               y1 + h1 > y2;
    }

    // Line-circle collision (useful for beam attacks)
    lineCircleCollision(x1, y1, x2, y2, cx, cy, cr) {
        // Calculate the distance from the circle center to the line
        let A = cx - x1;
        let B = cy - y1;
        let C = x2 - x1;
        let D = y2 - y1;
        
        let dot = A * C + B * D;
        let lenSq = C * C + D * D;
        
        if (lenSq === 0) return dist(cx, cy, x1, y1) <= cr;
        
        let param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return dist(cx, cy, xx, yy) <= cr;
    }

    // Spatial partitioning for performance optimization
    spatialHash(entity, cellSize = 50) {
        let gridX = Math.floor(entity.x / cellSize);
        let gridY = Math.floor(entity.y / cellSize);
        return `${gridX},${gridY}`;
    }

    // Get entities in nearby cells for optimized collision checking
    getNearbyEntities(entity, entities, cellSize = 50) {
        let nearby = [];
        let entityHash = this.spatialHash(entity, cellSize);
        
        // Check entity's cell and adjacent cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                let checkHash = `${parseInt(entityHash.split(',')[0]) + dx},${parseInt(entityHash.split(',')[1]) + dy}`;
                for (let other of entities) {
                    if (this.spatialHash(other, cellSize) === checkHash) {
                        nearby.push(other);
                    }
                }
            }
        }
        
        return nearby;
    }
}

// Global collision detection functions for convenience
function checkCircleCollision(entity1, entity2) {
    let distance = dist(entity1.x, entity1.y, entity2.x, entity2.y);
    let minDistance = (entity1.size || 0) / 2 + (entity2.size || 0) / 2;
    return distance < minDistance;
}

function checkProjectileEnemyCollisions(projectiles, enemies, onHit) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let projectile = projectiles[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j];
            
            if (checkCircleCollision(projectile, enemy)) {
                // Handle collision
                enemy.takeDamage(projectile.damage);
                projectiles.splice(i, 1);
                
                if (onHit) {
                    onHit(projectile, enemy);
                }
                
                // Check if enemy is dead
                if (enemy.isDead()) {
                    enemies.splice(j, 1);
                }
                
                break; // Projectile can only hit one enemy
            }
        }
    }
}

function checkEnemyPlayerCollision(enemy, player) {
    return checkCircleCollision(enemy, player);
}

function checkPowerUpPlayerCollision(powerUp, player) {
    return checkCircleCollision(powerUp, player);
}

// Beam collision detection (for boss beam attacks)
function checkBeamPlayerCollision(beamStartX, beamStartY, beamEndX, beamEndY, player, beamWidth = 10) {
    // Use line-circle collision
    let collisionManager = new CollisionManager();
    return collisionManager.lineCircleCollision(
        beamStartX, beamStartY, 
        beamEndX, beamEndY, 
        player.x, player.y, 
        player.size / 2 + beamWidth / 2
    );
}