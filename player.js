// Player class with movement, shooting, and abilities - 扩展支持新道具系统
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
        this.baseProjectileDamage = 2; // 基础伤害（用于计算加成）
        
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
        this.totalGoldCollected = 0; // 累计收集金币数

        // Item system
        this.passiveItems = [];
        this.activeItem = null;
        this.familiars = [];
        
        // Visual effects
        this.hitFlashTime = 0;
        this.hitFlashDuration = 200;
        
        // Temporary effects
        this.tempSpeedBoost = 0;
        this.tempDamageBoost = 0;
        this.tempMultiShot = 0;
        this.tempPiercing = 0;
        this.tempCritChance = 0;
        this.tempTimeSlow = 0;
        this.tempVampiric = 0;
        this.tempXPMagnet = 0;
        this.tempGoldMagnet = 0;
        this.invulnerableTime = 0;
        
        // Weapon properties (for talents and power-ups)
        this.piercingCount = 0; // Number of enemies projectiles can pierce through
        this.spreadShot = false; // Shoot in spread pattern
        this.projectileCount = 1; // Number of projectiles per shot
        this.explosiveShots = false; // Projectiles explode on hit
        this.knockbackForce = 0; // Knockback force for projectiles
        this.critChance = 0; // Base critical chance (0-1)
        this.vampiric = false; // Heal on kill
        this.goldMagnet = false; // Auto-attract gold
        this.regenRate = 0; // Health regeneration rate (ms)
        this.lastRegenTime = 0;
        
        // Shield system
        this.shield = 0; // Current shield points
        this.maxShield = 0; // Maximum shield points
        this.size = 30; // Hitbox size

        // ===== 新道具系统扩展 =====
        // 事件系统
        this.eventListeners = {};
        
        // 主动道具管理
        this.activeItems = []; // 支持多个主动道具
        
        // 道具标签追踪
        this.itemTags = new Set();
        
        // Buff管理系统
        this.activeBuffs = []; // 临时增益队列
        
        // 新道具特有属性
        this.damageMultiplier = 1.0; // 伤害乘数
        this.revengeReady = false; // 复仇之心准备状态
        this.reflectChance = 0; // 反弹概率
        this.reflectAllTime = 0; // 全反射时间
        this.shieldReflectActive = false; // 护盾反射激活状态
        this.spikeDamage = 0; // 钉刺伤害
        this.turretMode = false; // 炮台模式
        this.originalSpeed = 0; // 原始速度
        this.originalAccel = 0; // 原始加速度
        this.hasWhipWeapon = false; // 是否有鞭子武器
        this.whipRange = 0; // 鞭子范围
        this.whipDamage = 0; // 鞭子伤害
        this.comboCount = 0; // 连击数
        this.lastComboTime = 0; // 最后连击时间
        this.comboBonusTime = 0; // 连击奖励时间
        this.shopDiscount = 1.0; // 商店折扣
        this.gambling = false; // 赌博状态
        this.nextWaveDoubleGold = false; // 下一波双倍金币
        this.clearNextWaveDrops = false; // 清除下一波掉落
        this.mirrorClone = null; // 分身镜像
        
        // 金币转换系统
        this.hasCursedGold = false; // 诅咒金币
        this.goldToDamageConversion = 10; // 金币转伤害比例
        
        // 状态标志（各种道具效果）
        this.hasSplitBarrage = false; // 分裂弹幕
        this.hasEchoGun = false; // 回声枪
        this.hasSoulContract = false; // 灵魂契约
        this.hasEternalRing = false; // 永恒之环
        this.hasCritHeal = false; // 致命一击回血
        this.hasComboReward = false; // 连击奖励
        this.hasDangerFrenzy = false; // 濒危狂化
        this.hasRevengeHeart = false; // 复仇之心
        this.hasEnergyReflect = false; // 能量反弹
        this.hasSpikeBody = false; // 钉刺护体
        this.hasFourElements = false; // 四元素碰撞
        this.hasInfiniteShop = false; // 无穷商城
        this.hasLuckyRune = false; // 幸运符文
        this.hasMirrorClone = false; // 分身镜像
        
        // 光环系统
        this.auraCount = 0; // 光环数量
        this.auraDamage = 2; // 光环伤害
        this.auraRange = 20; // 光环范围
    }

    update() {
        this.move();
        this.updateFamiliars();
        this.updateProjectiles();
        this.updateTimers();
        this.updateBuffs();
        this.updateNewMechanics();
    }

    updateTimers() {
        // Update dash state
        if (this.isDashing && millis() > this.dashEndTime) {
            this.isDashing = false;
        }
        
        // Update temporary effects
        if (this.tempSpeedBoost > 0) {
            this.tempSpeedBoost -= 1;
            if (this.tempSpeedBoost < 0) this.tempSpeedBoost = 0;
        }
        
        if (this.tempDamageBoost > 0) {
            this.tempDamageBoost -= 1;
            if (this.tempDamageBoost < 0) this.tempDamageBoost = 0;
        }
        
        if (this.tempMultiShot > 0) {
            this.tempMultiShot -= 1;
            if (this.tempMultiShot < 0) this.tempMultiShot = 0;
        }
        
        if (this.tempPiercing > 0) {
            this.tempPiercing -= 1;
            if (this.tempPiercing < 0) this.tempPiercing = 0;
        }
        
        if (this.tempCritChance > 0) {
            this.tempCritChance -= 1;
            if (this.tempCritChance < 0) this.tempCritChance = 0;
        }
        
        if (this.tempTimeSlow > 0) {
            this.tempTimeSlow -= 1;
            if (this.tempTimeSlow < 0) this.tempTimeSlow = 0;
        }
        
        if (this.tempVampiric > 0) {
            this.tempVampiric -= 1;
            if (this.tempVampiric < 0) this.tempVampiric = 0;
        }
        
        if (this.tempXPMagnet > 0) {
            this.tempXPMagnet -= 1;
            if (this.tempXPMagnet < 0) this.tempXPMagnet = 0;
        }
        
        if (this.tempGoldMagnet > 0) {
            this.tempGoldMagnet -= 1;
            if (this.tempGoldMagnet < 0) this.tempGoldMagnet = 0;
        }
        
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= 16; // Assume 60fps
        }
        
        // Health regeneration
        if (this.regenRate > 0 && millis() - this.lastRegenTime > this.regenRate) {
            if (this.health < this.maxHealth) {
                this.health += 1;
                this.lastRegenTime = millis();
            }
        }

        // Update special timers
        this.updateSpecialTimers();
    }

    updateSpecialTimers() {
        // 反射时间更新
        if (this.reflectAllTime > 0) {
            this.reflectAllTime -= 16;
            if (this.reflectAllTime <= 0) {
                this.reflectAllTime = 0;
                this.shieldReflectActive = false;
            }
        }

        // 连击奖励时间更新
        if (this.comboBonusTime > 0) {
            this.comboBonusTime -= 16;
            if (this.comboBonusTime <= 0) {
                this.comboBonusTime = 0;
            }
        }

        // 濒危狂化效果（实时检测）
        this.updateDangerFrenzy();
    }

    updateDangerFrenzy() {
        if (!this.hasDangerFrenzy) return;
        
        let healthPercent = this.health / this.maxHealth;
        if (healthPercent < 0.3) {
            // 激活濒危狂化
            this.tempDamageBoost = Math.max(this.tempDamageBoost, 5); // 临时伤害加成
            this.tempSpeedBoost = Math.max(this.tempSpeedBoost, 3); // 临时速度加成
        }
    }

    updateBuffs() {
        // 更新临时buff
        for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
            let buff = this.activeBuffs[i];
            let elapsed = millis() - buff.startTime;
            
            if (elapsed > buff.duration) {
                // buff过期
                this.activeBuffs.splice(i, 1);
                continue;
            }

            // 应用buff效果
            this.applyBuffEffect(buff);
        }
    }

    applyBuffEffect(buff) {
        switch (buff.type) {
            case 0: // 伤害buff
                this.tempDamageBoost = 3; // 临时+3伤害
                break;
            case 1: // 速度buff
                this.tempSpeedBoost = 3; // 临时+3速度
                break;
            case 2: // 火速buff
                this.tempMultiShot = 3; // 临时多射击
                break;
        }
    }

    updateNewMechanics() {
        // 更新光环效果
        this.updateAuras();
        
        // 更新金币转换
        this.updateGoldConversion();
    }

    updateAuras() {
        if (!this.hasEternalRing) return;
        
        // 计算光环数量（每5个道具1个光环）
        let totalItems = this.passiveItems.length + this.activeItems.length;
        this.auraCount = Math.floor(totalItems / 5);
        
        // 光环范围伤害
        if (this.auraCount > 0 && game && game.enemies) {
            for (let enemy of game.enemies) {
                if (enemy.isDead()) continue;
                
                let distance = dist(this.x, this.y, enemy.x, enemy.y);
                if (distance <= this.auraRange + this.size/2) {
                    // 每秒造成伤害（基于帧率调整）
                    enemy.takeDamage(this.auraDamage * 0.016); // 约60fps时每秒2点伤害
                }
            }
        }
    }

    updateGoldConversion() {
        if (!this.hasCursedGold) return;
        
        // 实时更新伤害值（基于累计金币）
        let damageBonus = Math.floor(this.totalGoldCollected / this.goldToDamageConversion);
        this.projectileDamage = this.baseProjectileDamage + damageBonus;
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

    updateFamiliars() {
        if (!this.familiars || this.familiars.length === 0) return;
        for (let f of this.familiars) {
            if (f && typeof f.update === 'function') {
                f.update(this);
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
            let damage = (this.projectileDamage + this.tempDamageBoost) * this.damageMultiplier;
            
            // 复仇之心效果
            if (this.hasRevengeHeart && this.revengeReady) {
                damage *= 2;
                this.revengeReady = false;
            }
            
            // 连击奖励效果
            if (this.comboBonusTime > 0) {
                damage *= 1.5;
            }
            
            // 鞭子武器模式
            if (this.hasWhipWeapon) {
                this.performWhipAttack(angle);
                this.lastShotTime = millis();
                return;
            }
            
            // Calculate current projectile count and properties
            let currentProjectileCount = this.projectileCount;
            if (this.tempMultiShot > 0) {
                currentProjectileCount += 2;
            }
            
            let currentPiercingCount = this.piercingCount;
            if (this.tempPiercing > 0) {
                currentPiercingCount += 2;
            }
            
            let currentCritChance = this.critChance + this.tempCritChance;
            
            // Shoot projectiles
            if (this.spreadShot) {
                // Spread shot - 3 bullets in a spread pattern
                for (let i = -1; i <= 1; i++) {
                    let spreadAngle = angle + (i * PI / 12);
                    let projectile = new Projectile(this.x, this.y, spreadAngle, 'player', damage);
                    projectile.pierceCount = currentPiercingCount;
                    projectile.isCritical = random() < currentCritChance;
                    projectile.knockbackForce = this.knockbackForce;
                    this.projectiles.push(projectile);
                }
            } else {
                // Regular shot or multi shot
                let angleStep = TWO_PI / currentProjectileCount;
                let startAngle = angle - (angleStep * (currentProjectileCount - 1)) / 2;
                
                for (let i = 0; i < currentProjectileCount; i++) {
                    let projectileAngle = startAngle + (i * angleStep);
                    let projectile = new Projectile(this.x, this.y, projectileAngle, 'player', damage);
                    projectile.pierceCount = currentPiercingCount;
                    projectile.isCritical = random() < currentCritChance;
                    projectile.knockbackForce = this.knockbackForce;
                    this.projectiles.push(projectile);
                }
            }
            
            this.lastShotTime = millis();
            
            // Play shoot sound if audio system exists
            if (typeof playSound === 'function') {
                playSound('shoot');
            }
        }
    }

    performWhipAttack(angle) {
        // 鞭子攻击：近战范围攻击
        let endX = this.x + cos(angle) * this.whipRange;
        let endY = this.y + sin(angle) * this.whipRange;
        
        // 攻击路径上的敌人
        if (game && game.enemies) {
            for (let enemy of game.enemies) {
                if (enemy.isDead()) continue;
                
                // 检查敌人是否在攻击范围内
                if (this.isPointInWhipRange(enemy.x, enemy.y, angle)) {
                    enemy.takeDamage(this.whipDamage);
                }
            }
        }
        
        // 添加视觉特效
        if (game && game.addExplosion) {
            game.addExplosion(endX, endY, [200, 100, 50], 8);
        }
    }

    isPointInWhipRange(x, y, angle) {
        // 检查点是否在鞭子攻击范围内
        let distance = dist(this.x, this.y, x, y);
        if (distance > this.whipRange) return false;
        
        // 检查角度是否在攻击扇形内
        let pointAngle = atan2(y - this.y, x - this.x);
        let angleDiff = abs(angle - pointAngle);
        return angleDiff < PI / 6; // 30度扇形
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
        
        // 触发事件
        this.triggerEvent('onDamage', amount);
        
        // Check if player has shield
        if (this.shield > 0) {
            this.shield -= 1;
            // Shield absorbs damage, no health loss
            if (typeof addScreenShake === 'function') {
                addScreenShake(3, 8);
            }
        } else {
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
        // Draw familiars
        if (this.familiars && this.familiars.length > 0) {
            for (let f of this.familiars) {
                if (f && typeof f.display === 'function') {
                    f.display();
                }
            }
        }

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

        // 炮台模式视觉效果
        if (this.turretMode) {
            fill(255, 200, 100);
        } else {
            fill(100, 150, 255);
        }
        
        // 濒危狂化效果
        let healthPercent = this.health / this.maxHealth;
        if (this.hasDangerFrenzy && healthPercent < 0.3) {
            fill(255, 100, 100); // 红色表示危险状态
        }
        
        stroke(0);
        strokeWeight(2);
        ellipse(0, 0, this.size, this.size);
        
        // Player emoji
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.8);
        
        // 根据模式显示不同emoji
        if (this.turretMode) {
            text("🏰", 0, 0);
        } else if (this.hasWhipWeapon) {
            text("🐍", 0, 0);
        } else {
            text("🚀", 0, 0);
        }
        
        noTint();
        pop();
        
        // Draw projectiles
        for (let projectile of this.projectiles) {
            projectile.display();
        }
    }

    // ===== 新道具系统方法 =====

    // 事件系统
    triggerEvent(eventName, ...args) {
        if (!this.eventListeners[eventName]) return;
        
        for (let callback of this.eventListeners[eventName]) {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event listener ${eventName}:`, error);
            }
        }
    }

    addEventListener(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    removeEventListener(eventName, callback) {
        if (!this.eventListeners[eventName]) return;
        
        let index = this.eventListeners[eventName].indexOf(callback);
        if (index > -1) {
            this.eventListeners[eventName].splice(index, 1);
        }
    }

    // 击杀事件
    onKill(enemy) {
        this.triggerEvent('onKill', enemy);
    }

    // 暴击事件
    onCrit(enemy) {
        this.triggerEvent('onCrit', enemy);
    }

    // 金币收集事件
    onGoldCollected(amount) {
        this.totalGoldCollected += amount;
        this.triggerEvent('onGoldCollected', amount);
    }

    // 投射物击中事件
    onProjectileHit(projectile, enemy) {
        this.triggerEvent('onProjectileHit', projectile, enemy);
    }

    // 道具标签管理
    addItemTags(tags) {
        if (!Array.isArray(tags)) return;
        
        for (let tag of tags) {
            this.itemTags.add(tag);
        }
    }

    hasTag(tag) {
        return this.itemTags.has(tag);
    }

    getAllTags() {
        return Array.from(this.itemTags);
    }

    // 主动道具管理
    addActiveItem(itemDef) {
        this.activeItems.push({
            id: itemDef.id,
            def: itemDef,
            cooldownMs: itemDef.cooldownMs || 10000,
            lastUsedTime: -Infinity
        });
    }

    useActiveItem(index, gameInstance) {
        if (index < 0 || index >= this.activeItems.length) return false;
        
        let activeItem = this.activeItems[index];
        let now = millis();
        let cd = activeItem.cooldownMs || 0;
        let last = activeItem.lastUsedTime || -Infinity;
        
        if (now - last < cd) {
            return false; // 冷却中
        }

        activeItem.lastUsedTime = now;
        
        if (activeItem.def.onUse) {
            activeItem.def.onUse(this, gameInstance);
        }
        
        if (typeof playSound === 'function') {
            playSound('pickup');
        }

        return true;
    }

    getActiveItemCooldownRemaining(index) {
        if (index < 0 || index >= this.activeItems.length) return 0;
        
        let activeItem = this.activeItems[index];
        let now = millis();
        let cd = activeItem.cooldownMs || 0;
        let last = activeItem.lastUsedTime || -Infinity;
        return Math.max(0, cd - (now - last));
    }

    // Item helpers
    hasItem(itemId) {
        if (!itemId) return false;
        if (this.activeItem && this.activeItem.id === itemId) return true;
        return Array.isArray(this.passiveItems) && this.passiveItems.includes(itemId);
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

    // 新增UI相关方法
    getComboPercentage() {
        return this.comboCount / 3; // 3连击触发
    }

    getComboTimePercentage() {
        return this.comboBonusTime / 8000; // 8秒持续时间
    }

    getRevengeReady() {
        return this.revengeReady;
    }

    getReflectActive() {
        return this.shieldReflectActive || this.reflectAllTime > 0;
    }

    getBuffCount() {
        return this.activeBuffs.length;
    }

    getAuraCount() {
        return this.auraCount;
    }
}