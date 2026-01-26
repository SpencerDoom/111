// 完全重构的道具系统 - 20种复杂机制道具
const ITEM_RARITIES = {
    common: {
        id: 'common',
        name: '普通',
        tier: 1,
        color: [220, 220, 220],
        shopPriceMin: 50,
        shopPriceMax: 80
    },
    rare: {
        id: 'rare',
        name: '稀有',
        tier: 2,
        color: [100, 200, 255],
        shopPriceMin: 100,
        shopPriceMax: 150
    },
    legendary: {
        id: 'legendary',
        name: '传奇',
        tier: 3,
        color: [255, 215, 0],
        shopPriceMin: 200,
        shopPriceMax: 280
    }
};

function getRarityDef(rarityId) {
    return ITEM_RARITIES[rarityId] || ITEM_RARITIES.common;
}

function clampNumber(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function safeGetGame() {
    return typeof game !== 'undefined' ? game : null;
}

// 独立实体类
class SoulFragment {
    constructor(player, gameInstance) {
        this.player = player;
        this.game = gameInstance;
        this.x = player.x;
        this.y = player.y;
        this.size = 20;
        this.damage = Math.floor(player.projectileDamage * 0.5);
        this.angle = random(0, TWO_PI);
        this.orbitRadius = 40;
        this.orbitSpeed = 0.03;
        this.lastShotTime = 0;
        this.fireCooldown = 1200;
        this.followDelay = 0.1;
        this.targetX = player.x;
        this.targetY = player.y;
        this.active = true;
        this.lifespan = 8000; // 8秒
        this.spawnTime = millis();
    }

    update() {
        if (!this.active) return;

        // 更新轨道角度
        this.angle += this.orbitSpeed;
        
        // 更新目标位置（带延迟跟随）
        let desiredX = this.player.x + cos(this.angle) * this.orbitRadius;
        let desiredY = this.player.y + sin(this.angle) * this.orbitRadius;
        
        this.targetX += (desiredX - this.targetX) * this.followDelay;
        this.targetY += (desiredY - this.targetY) * this.followDelay;
        
        this.x = this.targetX;
        this.y = this.targetY;

        // 检查生命周期
        if (millis() - this.spawnTime > this.lifespan) {
            this.active = false;
            return;
        }

        // 自动攻击
        if (millis() - this.lastShotTime > this.fireCooldown) {
            this.autoAttack();
        }
    }

    autoAttack() {
        if (!this.game || !this.game.enemies || !this.game.player) return;

        // 寻找最近敌人
        let nearestEnemy = null;
        let nearestDist = Infinity;
        
        for (let enemy of this.game.enemies) {
            if (enemy.isDead()) continue;
            let d = dist(this.x, this.y, enemy.x, enemy.y);
            if (d < nearestDist && d < 200) {
                nearestDist = d;
                nearestEnemy = enemy;
            }
        }

        if (nearestEnemy) {
            let angle = atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            let projectile = new Projectile(this.x, this.y, angle, 'player', this.damage, color(150, 100, 255), 6, 4);
            projectile.isSoulFragment = true;
            this.game.player.projectiles.push(projectile);
            this.lastShotTime = millis();
        }
    }

    display() {
        if (!this.active) return;
        
        let age = millis() - this.spawnTime;
        let alpha = map(age, 0, this.lifespan, 255, 100);
        
        push();
        translate(this.x, this.y);
        fill(150, 100, 255, alpha);
        stroke(255, 255, 255, alpha);
        strokeWeight(2);
        ellipse(0, 0, this.size, this.size);
        fill(255, 255, 255, alpha);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.6);
        text('👻', 0, 0);
        pop();
    }
}

class MirrorClone {
    constructor(player, gameInstance) {
        this.player = player;
        this.game = gameInstance;
        this.x = player.x + random(-50, 50);
        this.y = player.y + random(-50, 50);
        this.size = 25;
        this.damage = Math.floor(player.projectileDamage * 0.75);
        this.health = Math.max(5, Math.floor(player.maxHealth * 0.3));
        this.maxHealth = this.health;
        this.lastShotTime = 0;
        this.fireCooldown = player.shotCooldown + 100; // 稍微慢一点
        this.targetX = player.x;
        this.targetY = player.y;
        this.followDelay = 0.05;
        this.active = true;
        this.syncDelay = 0;
    }

    update() {
        if (!this.active) return;

        // 同步射击延迟
        this.syncDelay++;
        if (this.syncDelay >= 3) { // 每3帧同步一次射击
            this.syncDelay = 0;
            this.syncShooting();
        }

        // 跟随玩家（带延迟）
        let desiredX = this.player.x + random(-30, 30);
        let desiredY = this.player.y + random(-30, 30);
        
        this.targetX += (desiredX - this.targetX) * this.followDelay;
        this.targetY += (desiredY - this.targetY) * this.followDelay;
        
        this.x = this.targetX;
        this.y = this.targetY;

        // 生命值检查
        if (this.health <= 0) {
            this.active = false;
        }
    }

    syncShooting() {
        if (!this.game || !this.game.enemies || !this.game.player) return;
        if (millis() - this.lastShotTime < this.fireCooldown) return;

        // 寻找目标
        let nearestEnemy = null;
        let nearestDist = Infinity;
        
        for (let enemy of this.game.enemies) {
            if (enemy.isDead()) continue;
            let d = dist(this.x, this.y, enemy.x, enemy.y);
            if (d < nearestDist) {
                nearestDist = d;
                nearestEnemy = enemy;
            }
        }

        if (nearestEnemy && nearestDist < 300) {
            let angle = atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            let projectile = new Projectile(this.x, this.y, angle, 'player', this.damage, color(100, 255, 150), 7, 5);
            projectile.isMirrorClone = true;
            this.game.player.projectiles.push(projectile);
            this.lastShotTime = millis();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
    }

    display() {
        if (!this.active) return;
        
        let healthPercent = this.health / this.maxHealth;
        let colorValue = map(healthPercent, 0, 1, 100, 255);
        
        push();
        translate(this.x, this.y);
        fill(100, colorValue, 150);
        stroke(255);
        strokeWeight(2);
        ellipse(0, 0, this.size, this.size);
        
        // 血条
        fill(255, 0, 0);
        noStroke();
        rect(-this.size/2, -this.size/2 - 8, this.size, 4);
        fill(0, 255, 0);
        rect(-this.size/2, -this.size/2 - 8, this.size * healthPercent, 4);
        
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(this.size * 0.7);
        text('👤', 0, 0);
        pop();
    }
}

// 20种新道具定义
const ITEM_DEFS = [
    // 分裂与弹幕系统（3种）
    {
        id: 'split_barrage',
        type: 'passive',
        rarity: 'rare',
        emoji: '⚡',
        name: '分裂弹幕',
        description: '子弹击中敌人时分裂成2-3发小弹幕（伤害60%，最多3层）。',
        unique: true,
        shop: true,
        tags: ['mechanic_split'],
        apply: (player, game) => {
            player.hasSplitBarrage = true;
        },
        onProjectileHit: (player, projectile, enemy, game) => {
            if (projectile.splitLevel >= 3) return;
            if (!game || !game.player) return;
            
            let splitCount = Math.floor(random(2, 4));
            let splitDamage = Math.floor(projectile.damage * 0.6);
            
            for (let i = 0; i < splitCount; i++) {
                let angle = random(0, TWO_PI);
                let newProjectile = new Projectile(
                    enemy.x, enemy.y, angle, 'player', 
                    splitDamage, projectile.color, projectile.size * 0.7, projectile.speed * 0.8
                );
                newProjectile.splitLevel = (projectile.splitLevel || 0) + 1;
                newProjectile.pierceCount = Math.max(0, (projectile.pierceCount || 0) - 1);
                game.player.projectiles.push(newProjectile);
            }
        }
    },
    {
        id: 'echo_gun',
        type: 'passive',
        rarity: 'rare',
        emoji: '🔄',
        name: '回声枪',
        description: '子弹命中敌人后在原击中位置再发射一次相同伤害的弹幕。',
        unique: true,
        shop: true,
        tags: ['mechanic_echo'],
        apply: (player, game) => {
            player.hasEchoGun = true;
        },
        onProjectileHit: (player, projectile, enemy, game) => {
            setTimeout(() => {
                if (!enemy.isDead()) {
                    if (!game || !game.player) return;
                    let angle = atan2(enemy.y - projectile.y, enemy.x - projectile.x);
                    let echoProjectile = new Projectile(
                        projectile.x, projectile.y, angle, 'player', 
                        projectile.damage, color(200, 200, 255), projectile.size, projectile.speed
                    );
                    game.player.projectiles.push(echoProjectile);
                }
            }, 300); // 300ms延迟
        }
    },
    {
        id: 'soul_fragments',
        type: 'active',
        rarity: 'legendary',
        emoji: '👻',
        name: '灵魂碎片',
        description: '主动：释放5个跟随你的灵魂，持续8秒自动攻击。冷却45秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_soul'],
        cooldownMs: 45000,
        onUse: (player, game) => {
            if (!game) return;
            for (let i = 0; i < 5; i++) {
                let soul = new SoulFragment(player, game);
                game.soulFragments.push(soul);
            }
        }
    },

    // 能量转换系统（3种）
    {
        id: 'cursed_gold',
        type: 'passive',
        rarity: 'rare',
        emoji: '🪙',
        name: '诅咒金币',
        description: '金币转换为伤害：每收集10金币自动转为+1伤害。',
        unique: true,
        shop: true,
        tags: ['mechanic_conversion'],
        apply: (player, game) => {
            player.hasCursedGold = true;
            player.goldToDamageConversion = 10;
        },
        onGoldCollected: (player, amount, game) => {
            let totalGold = player.totalGoldCollected || 0;
            let damageBonus = Math.floor(totalGold / player.goldToDamageConversion);
            player.projectileDamage = player.baseProjectileDamage + damageBonus;
        }
    },
    {
        id: 'soul_contract',
        type: 'passive',
        rarity: 'legendary',
        emoji: '📜',
        name: '灵魂契约',
        description: '每次击杀敌人消耗1点生命值，但伤害提升30%。',
        unique: true,
        shop: true,
        tags: ['mechanic_contract'],
        apply: (player, game) => {
            player.hasSoulContract = true;
            player.damageMultiplier *= 1.3;
        },
        onKill: (player, enemy, game) => {
            if (player.health > 1) {
                player.health -= 1;
            }
        }
    },
    {
        id: 'eternal_ring',
        type: 'passive',
        rarity: 'rare',
        emoji: '💍',
        name: '永恒之环',
        description: '每拥有5个主动获取的道具，增加一个光环效果（范围伤害）。',
        unique: true,
        shop: true,
        tags: ['mechanic_accumulation'],
        apply: (player, game) => {
            player.hasEternalRing = true;
            player.updateAuras();
        }
    },

    // 条件触发型道具（4种）
    {
        id: 'crit_heal',
        type: 'passive',
        rarity: 'rare',
        emoji: '💖',
        name: '致命一击回血',
        description: '每次暴击时恢复2点生命值。',
        unique: true,
        shop: true,
        tags: ['mechanic_trigger'],
        apply: (player, game) => {
            player.hasCritHeal = true;
        },
        onCrit: (player, enemy, game) => {
            player.heal(2);
        }
    },
    {
        id: 'combo_reward',
        type: 'passive',
        rarity: 'rare',
        emoji: '🔥',
        name: '连击奖励',
        description: '15秒内击杀3个敌人时临时触发+50%伤害，持续8秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_combo'],
        apply: (player, game) => {
            player.hasComboReward = true;
            player.comboCount = 0;
            player.lastComboTime = 0;
            player.comboBonusTime = 0;
        },
        onKill: (player, enemy, game) => {
            let now = millis();
            if (now - player.lastComboTime > 15000) {
                player.comboCount = 0;
            }
            
            player.comboCount++;
            player.lastComboTime = now;
            
            if (player.comboCount >= 3) {
                player.comboBonusTime = 8000; // 8秒
                player.comboCount = 0; // 重置连击
            }
        }
    },
    {
        id: 'danger_frenzy',
        type: 'passive',
        rarity: 'rare',
        emoji: '⚔️',
        name: '濒危狂化',
        description: '生命值低于30%时伤害翻倍，移动速度+30%。',
        unique: true,
        shop: true,
        tags: ['mechanic_threshold'],
        apply: (player, game) => {
            player.hasDangerFrenzy = true;
        }
    },
    {
        id: 'revenge_heart',
        type: 'passive',
        rarity: 'rare',
        emoji: '💢',
        name: '复仇之心',
        description: '受到伤害后，下一发子弹造成双倍伤害。',
        unique: true,
        shop: true,
        tags: ['mechanic_revenge'],
        apply: (player, game) => {
            player.hasRevengeHeart = true;
            player.revengeReady = false;
        },
        onDamage: (player, damage, game) => {
            player.revengeReady = true;
        }
    },

    // 反弹与防御系统（3种）
    {
        id: 'energy_reflect',
        type: 'passive',
        rarity: 'rare',
        emoji: '⚡',
        name: '能量反弹',
        description: '敌人投射物有30%概率被玩家周围形成的力场反弹。',
        unique: true,
        shop: true,
        tags: ['mechanic_reflect'],
        apply: (player, game) => {
            player.hasEnergyReflect = true;
            player.reflectChance = 0.3;
        }
    },
    {
        id: 'shield_reflect',
        type: 'active',
        rarity: 'legendary',
        emoji: '🛡️',
        name: '护盾反射',
        description: '主动：启动5秒护盾，期间敌人投射物全部反弹回去。冷却60秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_shield'],
        cooldownMs: 60000,
        onUse: (player, game) => {
            player.reflectAllTime = 5000; // 5秒
            player.shieldReflectActive = true;
        }
    },
    {
        id: 'spike_body',
        type: 'passive',
        rarity: 'rare',
        emoji: '🌵',
        name: '钉刺护体',
        description: '敌人碰撞玩家时反伤敌人2点伤害。',
        unique: true,
        shop: true,
        tags: ['mechanic_spike'],
        apply: (player, game) => {
            player.hasSpikeBody = true;
            player.spikeDamage = 2;
        }
    },

    // 变身与模式切换（2种）
    {
        id: 'turret_mode',
        type: 'active',
        rarity: 'legendary',
        emoji: '🏰',
        name: '炮台模式',
        description: '主动：切换炮台模式（移动速度0，伤害翻倍，射速翻倍）。按T键切换。',
        unique: true,
        shop: true,
        tags: ['mechanic_mode'],
        cooldownMs: 0,
        onUse: (player, game) => {
            player.turretMode = !player.turretMode;
            if (player.turretMode) {
                player.originalSpeed = player.maxSpeed;
                player.originalAccel = player.acceleration;
                player.maxSpeed = 0;
                player.acceleration = 0;
                player.projectileDamage *= 2;
                player.shotCooldown = Math.max(50, player.shotCooldown / 2);
            } else {
                player.maxSpeed = player.originalSpeed;
                player.acceleration = player.originalAccel;
                player.projectileDamage = Math.floor(player.projectileDamage / 2);
                player.shotCooldown = Math.min(500, player.shotCooldown * 2);
            }
        }
    },
    {
        id: 'whip_weapon',
        type: 'passive',
        rarity: 'legendary',
        emoji: '🐍',
        name: '鞭子武器',
        description: '改变射击方式为近战鞭子：范围150像素，伤害+30%，可穿透敌人。',
        unique: true,
        shop: true,
        tags: ['mechanic_weapon'],
        apply: (player, game) => {
            player.hasWhipWeapon = true;
            player.whipRange = 150;
            player.whipDamage = Math.floor(player.projectileDamage * 1.3);
        }
    },

    // 叠加与组合效应（2种）
    {
        id: 'four_elements',
        type: 'passive',
        rarity: 'legendary',
        emoji: '🌟',
        name: '四元素碰撞',
        description: '若同时拥有4个不同元素相关道具，触发额外效果（每秒能量波）。',
        unique: true,
        shop: true,
        tags: ['mechanic_combo', 'element_fire', 'element_ice', 'element_lightning', 'element_earth'],
        apply: (player, game) => {
            player.hasFourElements = true;
        }
    },
    {
        id: 'infinite_shop',
        type: 'passive',
        rarity: 'rare',
        emoji: '🏪',
        name: '无穷商城',
        description: '商店每次刷新金币消耗降低5%，累积可达最低3金币。',
        unique: true,
        shop: true,
        tags: ['mechanic_progressive'],
        apply: (player, game) => {
            player.hasInfiniteShop = true;
            player.shopDiscount = 0.95; // 5%折扣
        }
    },

    // 概率与运气系统（2种）
    {
        id: 'lucky_rune',
        type: 'passive',
        rarity: 'rare',
        emoji: '🍀',
        name: '幸运符文',
        description: '25%概率在击杀敌人时临时获得随机buff（+伤害/+速度/+火速之一），持续12秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_luck'],
        apply: (player, game) => {
            player.hasLuckyRune = true;
            player.activeBuffs = [];
        },
        onKill: (player, enemy, game) => {
            if (Math.random() < 0.25) {
                let buffType = Math.floor(Math.random() * 3);
                let buff = {
                    type: buffType,
                    duration: 12000, // 12秒
                    startTime: millis()
                };
                player.activeBuffs.push(buff);
            }
        }
    },
    {
        id: 'gambler_dice',
        type: 'active',
        rarity: 'legendary',
        emoji: '🎲',
        name: '赌徒的骰子',
        description: '主动：50%翻倍下一波敌人的金币掉落，50%清空当前掉落物品。冷却90秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_gamble'],
        cooldownMs: 90000,
        onUse: (player, game) => {
            player.gambling = !player.gambling;
            if (Math.random() < 0.5) {
                player.nextWaveDoubleGold = true;
            } else {
                player.clearNextWaveDrops = true;
            }
        }
    },

    // 跟随与分身系统（1种）
    {
        id: 'mirror_clone',
        type: 'passive',
        rarity: 'legendary',
        emoji: '👥',
        name: '分身镜像',
        description: '创建一个跟随玩家的分身，同步射击（伤害75%）。',
        unique: true,
        shop: true,
        tags: ['mechanic_clone'],
        apply: (player, game) => {
            player.hasMirrorClone = true;
            if (!game) return;
            if (!player.mirrorClone || !player.mirrorClone.active) {
                player.mirrorClone = new MirrorClone(player, game);
                game.mirrorClones.push(player.mirrorClone);
            }
        }
    },

    // ============================================
    // 10种新道具（游戏扩展计划）
    // ============================================

    // 分裂与弹幕系统（2种）
    {
        id: 'spiral_barrage',
        type: 'passive',
        rarity: 'rare',
        emoji: '🌀',
        name: '螺旋弹幕',
        description: '子弹呈螺旋轨迹飞行，增加命中率和范围。',
        unique: true,
        shop: true,
        tags: ['mechanic_spiral'],
        apply: (player, game) => {
            player.hasSpiralBarrage = true;
            player.spiralAmplitude = 20;
            player.spiralFrequency = 0.1;
        }
    },
    {
        id: 'delay_bomb',
        type: 'active',
        rarity: 'rare',
        emoji: '💣',
        name: '延迟炸弹',
        description: '主动：投掷一枚延迟炸弹，2秒后爆炸造成范围伤害。冷却8秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_bomb'],
        cooldownMs: 8000,
        onUse: (player, game) => {
            if (!game) return;
            let bomb = {
                x: player.x,
                y: player.y,
                size: 30,
                damage: player.projectileDamage * 3,
                radius: 100,
                delay: 2000,
                spawnTime: millis(),
                active: true
            };
            game.bombs.push(bomb);
        }
    },

    // 能量转换系统（2种）
    {
        id: 'life_conversion',
        type: 'active',
        rarity: 'rare',
        emoji: '❤️',
        name: '生命转化',
        description: '主动：消耗50金币恢复5点生命值。冷却10秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_conversion'],
        cooldownMs: 10000,
        onUse: (player, game) => {
            if (player.gold >= 50) {
                player.gold -= 50;
                player.heal(5);
                if (game && game.addExplosion) {
                    game.addExplosion(player.x, player.y, [255, 100, 100], 10);
                }
            }
        }
    },
    {
        id: 'xp_conversion',
        type: 'active',
        rarity: 'rare',
        emoji: '📚',
        name: '经验转化',
        description: '主动：消耗30金币获得15点经验值。冷却10秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_conversion'],
        cooldownMs: 10000,
        onUse: (player, game) => {
            if (player.gold >= 30) {
                player.gold -= 30;
                player.gainXP(15);
                if (game && game.addExplosion) {
                    game.addExplosion(player.x, player.y, [100, 200, 255], 10);
                }
            }
        }
    },

    // 条件触发型（2种）
    {
        id: 'combo_speed',
        type: 'passive',
        rarity: 'rare',
        emoji: '⚡',
        name: '连击加速',
        description: '连续击杀3个敌人时，移动速度提升50%，持续5秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_combo'],
        apply: (player, game) => {
            player.hasComboSpeed = true;
            player.comboKillCount = 0;
            player.lastComboKillTime = 0;
            player.comboSpeedEndTime = 0;
        },
        onKill: (player, enemy, game) => {
            let now = millis();
            if (now - player.lastComboKillTime > 3000) {
                player.comboKillCount = 0;
            }
            
            player.comboKillCount++;
            player.lastComboKillTime = now;
            
            if (player.comboKillCount >= 3) {
                player.comboSpeedEndTime = 5000;
                player.comboKillCount = 0;
            }
        }
    },
    {
        id: 'perfect_dodge',
        type: 'passive',
        rarity: 'rare',
        emoji: '💨',
        name: '完美闪避',
        description: '闪避攻击后获得1秒无敌时间。',
        unique: true,
        shop: true,
        tags: ['mechanic_dodge'],
        apply: (player, game) => {
            player.hasPerfectDodge = true;
        },
        onDamage: (player, damage, game) => {
            if (player.isDashing) {
                player.invulnerableTime = 1000;
            }
        }
    },

    // 变身与模式（2种）
    {
        id: 'giant_mode',
        type: 'active',
        rarity: 'legendary',
        emoji: '🦣',
        name: '巨人模式',
        description: '主动：体型变大50%，伤害提升30%，速度降低20%。持续8秒。冷却15秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_mode'],
        cooldownMs: 15000,
        onUse: (player, game) => {
            if (!player.isGiantMode) {
                player.isGiantMode = true;
                player.giantModeEndTime = 8000;
                player.originalSize = player.size;
                player.originalMaxSpeed = player.maxSpeed;
                player.originalDamage = player.projectileDamage;
                
                player.size = player.originalSize * 1.5;
                player.maxSpeed = player.originalMaxSpeed * 0.8;
                player.projectileDamage = Math.floor(player.originalDamage * 1.3);
            }
        }
    },
    {
        id: 'ghost_mode',
        type: 'active',
        rarity: 'legendary',
        emoji: '👻',
        name: '幽灵模式',
        description: '主动：穿墙，无法攻击，但免疫所有伤害。持续5秒。冷却20秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_mode'],
        cooldownMs: 20000,
        onUse: (player, game) => {
            if (!player.isGhostMode) {
                player.isGhostMode = true;
                player.ghostModeEndTime = 5000;
                player.invulnerableTime = 5000;
            }
        }
    },

    // 叠加与组合（2种）
    {
        id: 'element_fusion',
        type: 'passive',
        rarity: 'legendary',
        emoji: '🔮',
        name: '元素融合',
        description: '火冰雷三元素融合攻击：每3发子弹依次附加火/冰/雷效果。',
        unique: true,
        shop: true,
        tags: ['mechanic_element', 'element_fire', 'element_ice', 'element_lightning'],
        apply: (player, game) => {
            player.hasElementFusion = true;
            player.elementCycle = 0;
            player.elements = ['fire', 'ice', 'lightning'];
        }
    },
    {
        id: 'item_fusion',
        type: 'active',
        rarity: 'legendary',
        emoji: '⚗️',
        name: '道具融合',
        description: '主动：融合两个被动道具为一个更强的道具（随机选择）。冷却60秒。',
        unique: true,
        shop: true,
        tags: ['mechanic_fusion'],
        cooldownMs: 60000,
        onUse: (player, game) => {
            if (!game || !player.passiveItems || player.passiveItems.length < 2) return;
            
            // 随机选择两个道具
            let shuffled = [...player.passiveItems].sort(() => 0.5 - Math.random());
            let item1Id = shuffled[0];
            let item2Id = shuffled[1];
            
            // 移除这两个道具
            player.passiveItems = player.passiveItems.filter(id => id !== item1Id && id !== item2Id);
            
            // 获取玩家已拥有的 unique 道具（用于避免重复）
            let avoidUniqueIds = [];
            if (player && Array.isArray(player.passiveItems)) {
                avoidUniqueIds = player.passiveItems.filter((id) => {
                    let d = getItemDef(id);
                    return d && d.unique;
                });
            }
            if (player && player.activeItem) {
                let d = getItemDef(player.activeItem.id);
                if (d && d.unique) avoidUniqueIds.push(player.activeItem.id);
            }
            
            // 随机选择一个新道具（稀有度提升），避免玩家已拥有的 unique 道具
            let rareItems = ITEM_DEFS.filter(d => 
                (d.rarity === 'rare' || d.rarity === 'legendary') && 
                !avoidUniqueIds.includes(d.id)
            );
            
            // 如果没有可用的道具，则不限制 unique 属性
            if (rareItems.length === 0) {
                rareItems = ITEM_DEFS.filter(d => d.rarity === 'rare' || d.rarity === 'legendary');
            }
            
            let newItem = rareItems[Math.floor(Math.random() * rareItems.length)];
            
            // 添加新道具
            grantItemToPlayer(player, newItem.id, game);
            
            if (game && game.addExplosion) {
                game.addExplosion(player.x, player.y, [255, 215, 0], 15);
            }
        }
    }
];

const ITEM_DEF_BY_ID = Object.fromEntries(ITEM_DEFS.map(d => [d.id, d]));

function getItemDef(itemId) {
    return ITEM_DEF_BY_ID[itemId] || null;
}

function getAllItemDefs() {
    return ITEM_DEFS.slice();
}

function playerHasItem(player, itemId) {
    if (!player) return false;
    if (typeof player.hasItem === 'function') return player.hasItem(itemId);
    return Array.isArray(player.passiveItems) && player.passiveItems.includes(itemId);
}

function equipActiveItem(player, itemDef, gameInstance, { dropPrevious = true, cooldownData = null } = {}) {
    // 确保使用数组形式
    player.activeItems = player.activeItems || [];
    
    // 获取最大装备数量（默认为1，双持天赋可增加）
    let maxActiveItems = player.maxActiveItems || 1;

    let old = null;
    // 只有在达到最大装备数量时才移除旧道具
    if (dropPrevious && player.activeItems.length >= maxActiveItems) {
        // 移除第一个主动道具（如果存在）
        old = player.activeItems.shift();
        if (old && gameInstance) {
            let dropX = player.x + random(-20, 20);
            let dropY = player.y + random(-20, 20);
            // 保留冷却时间信息
            let oldCooldownData = {
                lastUsedTime: old.lastUsedTime,
                cooldownMs: old.cooldownMs
            };
            // 设置ownerId为player对象引用，用于拾取冷却检测
            gameInstance.powerUps.push(createItemPickup(dropX, dropY, old.id, oldCooldownData, player));
        }
    }

    // 使用 addActiveItem 方法添加道具，传递冷却时间数据
    player.addActiveItem(itemDef, cooldownData);
}

function grantItemToPlayer(player, itemId, gameInstance = null, pickupInstance = null) {
    let def = getItemDef(itemId);
    if (!def || !player) return false;

    if (def.type === 'active') {
        // 获取冷却时间数据（如果是从掉落物拾取的）
        let cooldownData = pickupInstance && pickupInstance.cooldownData ? pickupInstance.cooldownData : null;
        equipActiveItem(player, def, gameInstance, { dropPrevious: true, cooldownData: cooldownData });
        return true;
    }

    // Passive / special
    if (def.unique && playerHasItem(player, def.id)) {
        // Duplicate uniques: convert into a small gold refund
        player.gold = (player.gold || 0) + 15;
        return false;
    }

    player.passiveItems = player.passiveItems || [];
    player.passiveItems.push(def.id);

    if (typeof def.apply === 'function') {
        def.apply(player, gameInstance);
    }

    // 注册事件监听器（避免重复注册）
    if (def.onKill && !player._itemEventListeners?.[def.id]?.onKill) {
        player._itemEventListeners = player._itemEventListeners || {};
        player._itemEventListeners[def.id] = player._itemEventListeners[def.id] || {};
        let callback = (enemy) => def.onKill(player, enemy, gameInstance);
        player._itemEventListeners[def.id].onKill = callback;
        player.addEventListener('onKill', callback);
    }
    if (def.onCrit && !player._itemEventListeners?.[def.id]?.onCrit) {
        player._itemEventListeners = player._itemEventListeners || {};
        player._itemEventListeners[def.id] = player._itemEventListeners[def.id] || {};
        let callback = (enemy) => def.onCrit(player, enemy, gameInstance);
        player._itemEventListeners[def.id].onCrit = callback;
        player.addEventListener('onCrit', callback);
    }
    if (def.onDamage && !player._itemEventListeners?.[def.id]?.onDamage) {
        player._itemEventListeners = player._itemEventListeners || {};
        player._itemEventListeners[def.id] = player._itemEventListeners[def.id] || {};
        let callback = (damage) => def.onDamage(player, damage, gameInstance);
        player._itemEventListeners[def.id].onDamage = callback;
        player.addEventListener('onDamage', callback);
    }
    if (def.onGoldCollected && !player._itemEventListeners?.[def.id]?.onGoldCollected) {
        player._itemEventListeners = player._itemEventListeners || {};
        player._itemEventListeners[def.id] = player._itemEventListeners[def.id] || {};
        let callback = (amount) => def.onGoldCollected(player, amount, gameInstance);
        player._itemEventListeners[def.id].onGoldCollected = callback;
        player.addEventListener('onGoldCollected', callback);
    }
    if (def.onProjectileHit && !player._itemEventListeners?.[def.id]?.onProjectileHit) {
        player._itemEventListeners = player._itemEventListeners || {};
        player._itemEventListeners[def.id] = player._itemEventListeners[def.id] || {};
        let callback = (projectile, enemy) => def.onProjectileHit(player, projectile, enemy, gameInstance);
        player._itemEventListeners[def.id].onProjectileHit = callback;
        player.addEventListener('onProjectileHit', callback);
    }

    return true;
}

function getShopPool(currentWave = 1) {
    let wave = currentWave || 1;
    return ITEM_DEFS.filter(d => d.shop).map(def => {
        let tier = getRarityDef(def.rarity).tier;

        // Slightly improve odds with wave
        let weight = 1;
        if (tier === 1) weight = 1;
        if (tier === 2) weight = 0.35 + wave * 0.03;
        if (tier === 3) weight = 0.08 + wave * 0.012;
        weight = clampNumber(weight, 0.02, 1.2);

        return { def, weight };
    });
}

function weightedPickDef(pool, { avoidIds = [] } = {}) {
    let filtered = pool.filter(e => e && e.def && !avoidIds.includes(e.def.id));
    if (filtered.length === 0) filtered = pool.filter(e => e && e.def);

    if (filtered.length === 0) return null;

    let total = 0;
    for (let e of filtered) total += e.weight;

    let r = Math.random() * total;
    for (let e of filtered) {
        r -= e.weight;
        if (r <= 0) return e.def;
    }
    return filtered[filtered.length - 1].def;
}

function rollShopItemDef(player, currentWave = 1) {
    let pool = getShopPool(currentWave);
    let avoid = [];
    if (player && Array.isArray(player.passiveItems)) {
        avoid = player.passiveItems.filter((id) => {
            let d = getItemDef(id);
            return d && d.unique;
        });
    }
    if (player && player.activeItem) {
        let d = getItemDef(player.activeItem.id);
        if (d && d.unique) avoid.push(player.activeItem.id);
    }

    return weightedPickDef(pool, { avoidIds: avoid });
}

// Collectible pickup entity
class ItemPickup {
    constructor(x, y, itemId, cooldownData = null, ownerId = null) {
        this.x = x;
        this.y = y;
        this.itemId = itemId;
        this.size = 26;

        this.bobOffset = random(0, TWO_PI);
        this.magnetRange = 70;
        this.collected = false;
        this.lifespan = 45000;
        this.spawnTime = millis();

        this.glowIntensity = 0;
        this.glowDirection = 1;

        // 保存主动道具的冷却时间信息
        this.cooldownData = cooldownData;

        // 拾取冷却系统：防止刚刚丢弃的道具被立即拾取
        this.ownerId = ownerId; // 标记是谁丢弃的道具
        this.pickupCooldown = 2000; // 2秒拾取冷却时间
        this.pickupCooldownEndTime = millis() + this.pickupCooldown;
    }

    update(player) {
        this.bobOffset += 0.05;

        // 检查是否在拾取冷却中
        let isOnCooldown = this.ownerId !== null && millis() < this.pickupCooldownEndTime;

        if (!isOnCooldown) {
            // 正常状态下的发光效果
            this.glowIntensity += this.glowDirection * 3;
            if (this.glowIntensity > 110 || this.glowIntensity < 10) {
                this.glowDirection *= -1;
            }
        } else {
            // 冷却状态下减少发光
            this.glowIntensity = 30;
        }

        let def = getItemDef(this.itemId);
        if (!def) {
            this.collected = true;
            return;
        }

        let distanceToPlayer = dist(this.x, this.y, player.x, player.y);
        if (distanceToPlayer < this.magnetRange) {
            // 冷却中不吸引
            if (isOnCooldown) {
                return;
            }
            let pullForce = map(distanceToPlayer, 0, this.magnetRange, 8, 0);
            let angle = atan2(player.y - this.y, player.x - this.x);
            this.x += cos(angle) * pullForce;
            this.y += sin(angle) * pullForce;
        }

        if (distanceToPlayer < this.size / 2 + player.size / 2) {
            // 检查拾取冷却时间
            if (this.ownerId !== null && millis() < this.pickupCooldownEndTime) {
                // 还在冷却中，不能拾取
                return;
            }

            let g = safeGetGame();
            grantItemToPlayer(player, this.itemId, g, this);
            this.collected = true;

            if (typeof playSound === 'function') {
                playSound('pickup');
            }
            if (g && g.addExplosion) {
                let rarityColor = getRarityDef(def.rarity).color;
                g.addExplosion(this.x, this.y, rarityColor, 10);
            }
        }
    }

    display() {
        let def = getItemDef(this.itemId);
        if (!def) return;

        let rarity = getRarityDef(def.rarity);
        let glowColor = color(rarity.color[0], rarity.color[1], rarity.color[2]);

        // 检查是否在拾取冷却中
        let isOnCooldown = this.ownerId !== null && millis() < this.pickupCooldownEndTime;

        push();
        translate(this.x, this.y + sin(this.bobOffset) * 3);

        if (isOnCooldown) {
            // 冷却中：显示灰色
            fill(100, 100, 100, 80);
            noStroke();
            ellipse(0, 0, this.size + 12, this.size + 12);

            fill(80, 80, 80);
            stroke(150, 150, 150);
            strokeWeight(2);
            ellipse(0, 0, this.size, this.size);

            fill(200);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(this.size * 0.65);
            text(def.emoji || '💎', 0, 0);

            // 显示冷却时间
            let remainingTime = Math.ceil((this.pickupCooldownEndTime - millis()) / 1000);
            fill(255);
            textSize(10);
            text(`${remainingTime}s`, 0, this.size / 2 + 12);
        } else {
            // 正常状态
            fill(red(glowColor), green(glowColor), blue(glowColor), this.glowIntensity);
            noStroke();
            ellipse(0, 0, this.size + 12, this.size + 12);

            fill(glowColor);
            stroke(255);
            strokeWeight(2);
            ellipse(0, 0, this.size, this.size);

            fill(255);
            noStroke();
            textAlign(CENTER, CENTER);
            textSize(this.size * 0.65);
            text(def.emoji || '💎', 0, 0);
        }

        pop();
    }

    isExpired() {
        return millis() - this.spawnTime > this.lifespan;
    }
}

function createItemPickup(x, y, itemId, cooldownData = null, ownerId = null) {
    return new ItemPickup(x, y, itemId, cooldownData, ownerId);
}

function getBossPool(currentWave = 1) {
    let wave = currentWave || 1;
    return ITEM_DEFS.filter(d => d.boss).map(def => {
        let tier = getRarityDef(def.rarity).tier;

        let weight = 1;
        if (tier === 2) weight = 1;
        if (tier === 3) weight = 0.8 + wave * 0.05;
        if (tier === 4) weight = 0.35 + wave * 0.06;
        weight = clampNumber(weight, 0.05, 2.0);

        return { def, weight };
    });
}

function rollBossDropDefs(player, currentWave = 1) {
    let wave = currentWave || 1;
    let pool = getBossPool(wave);

    let avoid = [];
    if (player && Array.isArray(player.passiveItems)) {
        avoid = player.passiveItems.filter((id) => {
            let d = getItemDef(id);
            return d && d.unique;
        });
    }
    if (player && player.activeItem) {
        let d = getItemDef(player.activeItem.id);
        if (d && d.unique) avoid.push(player.activeItem.id);
    }

    let count = 1;
    let twoChance = clampNumber(0.25 + wave * 0.03, 0.25, 0.65);
    if (Math.random() < twoChance) count = 2;

    let drops = [];
    for (let i = 0; i < count; i++) {
        let def = weightedPickDef(pool, { avoidIds: avoid.concat(drops.map(d => d.id)) });
        if (def) drops.push(def);
    }

    return drops;
}

function createRandomShopItemPickup(x, y, player, currentWave = 1) {
    let def = rollShopItemDef(player, currentWave);
    return new ItemPickup(x, y, def.id);
}

function createBossItemPickups(x, y, player, currentWave = 1) {
    let drops = rollBossDropDefs(player, currentWave);
    let pickups = [];

    if (drops.length === 0) return pickups;

    if (drops.length === 1) {
        pickups.push(new ItemPickup(x, y, drops[0].id));
        return pickups;
    }

    // Spread 2 drops so they don't overlap
    pickups.push(new ItemPickup(x - 18, y, drops[0].id));
    pickups.push(new ItemPickup(x + 18, y, drops[1].id));
    return pickups;
}