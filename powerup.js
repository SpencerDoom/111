// Item pickup + item definition system (Isaac-like)

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
    },
    boss: {
        id: 'boss',
        name: 'Boss',
        tier: 4,
        color: [255, 80, 80],
        shopPriceMin: 0,
        shopPriceMax: 0
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

function killAllRegularEnemies(gameInstance, { withEffects = true } = {}) {
    if (!gameInstance || !Array.isArray(gameInstance.enemies)) return;

    for (let i = gameInstance.enemies.length - 1; i >= 0; i--) {
        let enemy = gameInstance.enemies[i];
        if (enemy && typeof enemy.takeDamage === 'function') {
            if (withEffects && gameInstance.addExplosion) {
                gameInstance.addExplosion(enemy.x, enemy.y, [255, 120, 120], 5);
            }
            enemy.takeDamage(99999);
        }
    }
}

function forEachEnemyInRadius(gameInstance, x, y, radius, cb) {
    if (!gameInstance || !Array.isArray(gameInstance.enemies)) return;

    for (let enemy of gameInstance.enemies) {
        if (!enemy || typeof enemy.isDead !== 'function' || enemy.isDead()) continue;
        if (dist(x, y, enemy.x, enemy.y) <= radius) {
            cb(enemy);
        }
    }
}

class FamiliarDrone {
    constructor({ orbitRadius = 45, orbitSpeed = 0.04, fireCooldown = 800, damageScale = 0.6 } = {}) {
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = orbitSpeed;
        this.fireCooldown = fireCooldown;
        this.damageScale = damageScale;

        this.angle = random(0, TWO_PI);
        this.lastShotTime = 0;
        this.x = 0;
        this.y = 0;
    }

    update(player) {
        this.angle += this.orbitSpeed;
        this.x = player.x + cos(this.angle) * this.orbitRadius;
        this.y = player.y + sin(this.angle) * this.orbitRadius;

        let gameInstance = safeGetGame();
        if (!gameInstance) return;

        if (millis() - this.lastShotTime < this.fireCooldown) return;

        let target = null;
        let bestDist = Infinity;
        for (let enemy of gameInstance.enemies) {
            if (!enemy || (typeof enemy.isDead === 'function' && enemy.isDead())) continue;
            let d = dist(this.x, this.y, enemy.x, enemy.y);
            if (d < bestDist) {
                bestDist = d;
                target = enemy;
            }
        }

        if (!target && gameInstance.waveManager && gameInstance.waveManager.isBossActive()) {
            target = gameInstance.waveManager.getBoss();
            bestDist = dist(this.x, this.y, target.x, target.y);
        }

        if (!target || bestDist > 420) return;

        let angle = atan2(target.y - this.y, target.x - this.x);
        let damage = Math.max(1, Math.floor(player.projectileDamage * this.damageScale));
        let projectile = new Projectile(this.x, this.y, angle, 'player', damage, color(180, 255, 220), 7, 5);
        projectile.pierceCount = 0;
        player.projectiles.push(projectile);

        this.lastShotTime = millis();
    }

    display() {
        push();
        translate(this.x, this.y);
        fill(180, 255, 220);
        stroke(0);
        strokeWeight(1);
        ellipse(0, 0, 16, 16);
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(12);
        text('🛰️', 0, 0);
        pop();
    }
}

const ITEM_DEFS = [
    {
        id: 'caffeine_rush',
        type: 'passive',
        rarity: 'common',
        emoji: '☕',
        name: '咖啡因冲刺',
        description: '移动速度 +0.4，射击冷却 -25ms（最低 80ms）。',
        unique: false,
        shop: true,
        boss: false,
        apply: (p) => {
            p.maxSpeed += 0.4;
            p.acceleration += 0.03;
            p.shotCooldown = Math.max(80, p.shotCooldown - 25);
        }
    },
    {
        id: 'heart_container',
        type: 'passive',
        rarity: 'common',
        emoji: '💖',
        name: '心之容器',
        description: '最大生命值 +2，并立刻回复 2 点生命。',
        unique: false,
        shop: true,
        boss: false,
        apply: (p) => {
            p.maxHealth += 2;
            p.health = Math.min(p.maxHealth, p.health + 2);
        }
    },
    {
        id: 'safety_shield',
        type: 'passive',
        rarity: 'common',
        emoji: '🛡️',
        name: '安全护盾',
        description: '获得 2 点护盾（可叠加）。',
        unique: false,
        shop: true,
        boss: false,
        apply: (p) => {
            p.shield = (p.shield || 0) + 2;
            p.maxShield = (p.maxShield || 0) + 2;
        }
    },
    {
        id: 'needle_tip',
        type: 'passive',
        rarity: 'common',
        emoji: '🪡',
        name: '针尖',
        description: '投射物穿透 +1。',
        unique: false,
        shop: true,
        boss: false,
        apply: (p) => {
            p.piercingCount = (p.piercingCount || 0) + 1;
        }
    },
    {
        id: 'spike_knuckles',
        type: 'passive',
        rarity: 'common',
        emoji: '🥊',
        name: '尖刺拳套',
        description: '击退力 +8。',
        unique: false,
        shop: true,
        boss: false,
        apply: (p) => {
            p.knockbackForce = (p.knockbackForce || 0) + 8;
        }
    },
    {
        id: 'sprout_of_regen',
        type: 'passive',
        rarity: 'common',
        emoji: '🌿',
        name: '再生芽',
        description: '获得再生：每 2.5 秒回复 1 点生命。',
        unique: true,
        shop: true,
        boss: false,
        apply: (p) => {
            p.regenRate = Math.min(p.regenRate || Infinity, 2500);
            p.lastRegenTime = millis();
        }
    },
    {
        id: 'spread_rune',
        type: 'passive',
        rarity: 'common',
        emoji: '🌀',
        name: '散射符文',
        description: '获得散射（3 连发）。',
        unique: true,
        shop: true,
        boss: false,
        apply: (p) => {
            p.spreadShot = true;
        }
    },
    {
        id: 'crystal_focus',
        type: 'passive',
        rarity: 'rare',
        emoji: '🔮',
        name: '水晶专注',
        description: '暴击率 +15%，投射物伤害 +1。',
        unique: true,
        shop: true,
        boss: true,
        apply: (p) => {
            p.critChance = (p.critChance || 0) + 0.15;
            p.projectileDamage += 1;
        }
    },
    {
        id: 'explosive_gel',
        type: 'passive',
        rarity: 'rare',
        emoji: '💥',
        name: '爆炸凝胶',
        description: '获得爆炸弹：投射物命中会造成范围伤害。',
        unique: true,
        shop: true,
        boss: true,
        apply: (p) => {
            p.explosiveShots = true;
        }
    },
    {
        id: 'double_barrel',
        type: 'passive',
        rarity: 'rare',
        emoji: '🔱',
        name: '双管扩容',
        description: '每次射击额外 +1 发子弹，但射击冷却 +20ms。',
        unique: false,
        shop: true,
        boss: true,
        apply: (p) => {
            p.projectileCount = (p.projectileCount || 1) + 1;
            p.shotCooldown += 20;
        }
    },
    {
        id: 'blood_contract',
        type: 'passive',
        rarity: 'rare',
        emoji: '📜',
        name: '血之契约',
        description: '投射物伤害 +2，但最大生命值 -2。',
        unique: true,
        shop: true,
        boss: true,
        apply: (p) => {
            p.projectileDamage += 2;
            p.maxHealth = Math.max(2, p.maxHealth - 2);
            p.health = Math.min(p.health, p.maxHealth);
        }
    },
    {
        id: 'metamorphosis_pill',
        type: 'special',
        rarity: 'rare',
        emoji: '💊',
        name: '变形药丸',
        description: '变得更小更快：体积 -20%，移动速度 +0.8。',
        unique: true,
        shop: true,
        boss: true,
        apply: (p) => {
            p.size *= 0.8;
            p.maxSpeed += 0.8;
            p.acceleration += 0.05;
        }
    },

    {
        id: 'shockwave_emitter',
        type: 'active',
        rarity: 'rare',
        emoji: '🌊',
        name: '震荡发射器',
        description: '主动：释放能量波，击退并伤害附近敌人。冷却 10 秒。',
        unique: true,
        shop: true,
        boss: true,
        cooldownMs: 10000,
        onUse: (p, g) => {
            let radius = 140;
            let dmg = 5 + Math.floor(p.projectileDamage * 0.5);

            forEachEnemyInRadius(g, p.x, p.y, radius, (enemy) => {
                enemy.takeDamage(dmg);
                let a = atan2(enemy.y - p.y, enemy.x - p.x);
                enemy.x += cos(a) * 18;
                enemy.y += sin(a) * 18;
            });

            if (g.waveManager && g.waveManager.isBossActive()) {
                let boss = g.waveManager.getBoss();
                if (boss && dist(p.x, p.y, boss.x, boss.y) <= radius) {
                    boss.takeDamage(Math.floor(dmg * 0.6));
                }
            }

            g.addExplosion(p.x, p.y, [120, 200, 255], 18);
            g.addScreenShake(10, 12);
        }
    },

    {
        id: 'guardian_orb',
        type: 'passive',
        rarity: 'legendary',
        emoji: '🛰️',
        name: '守卫星球',
        description: '获得一个护卫无人机：环绕你并自动射击。',
        unique: false,
        shop: true,
        boss: true,
        apply: (p) => {
            p.familiars = p.familiars || [];
            p.familiars.push(new FamiliarDrone({ orbitRadius: 50 + p.familiars.length * 8 }));
        }
    },
    {
        id: 'halo_matrix',
        type: 'passive',
        rarity: 'legendary',
        emoji: '😇',
        name: '光环矩阵',
        description: '最大生命值 +4，获得 4 点护盾。',
        unique: true,
        shop: true,
        boss: true,
        apply: (p) => {
            p.maxHealth += 4;
            p.health = Math.min(p.maxHealth, p.health + 4);
            p.shield = (p.shield || 0) + 4;
            p.maxShield = (p.maxShield || 0) + 4;
        }
    },
    {
        id: 'panic_button',
        type: 'active',
        rarity: 'legendary',
        emoji: '🚨',
        name: '紧急按钮',
        description: '主动：清空屏幕上的普通敌人并获得 2 秒无敌。冷却 18 秒。',
        unique: true,
        shop: true,
        boss: true,
        cooldownMs: 18000,
        onUse: (p, g) => {
            killAllRegularEnemies(g, { withEffects: true });
            p.invulnerableTime = Math.max(p.invulnerableTime || 0, 2000);
            g.addScreenShake(12, 18);
        }
    },
    {
        id: 'chrono_stopwatch',
        type: 'active',
        rarity: 'legendary',
        emoji: '⏳',
        name: '时间秒表',
        description: '主动：时间暂停 4 秒。冷却 25 秒。',
        unique: true,
        shop: true,
        boss: true,
        cooldownMs: 25000,
        onUse: (p, g) => {
            g.timeStopEndTime = Math.max(g.timeStopEndTime || 0, millis() + 4000);
            g.addExplosion(p.x, p.y, [150, 150, 255], 12);
        }
    },

    // Boss-only items (stronger than shop pool)
    {
        id: 'crown_of_the_overlord',
        type: 'passive',
        rarity: 'boss',
        emoji: '👑',
        name: '支配者王冠',
        description: 'Boss遗物：伤害 +2，额外子弹 +1，穿透 +2，暴击率 +15%。',
        unique: true,
        shop: false,
        boss: true,
        apply: (p) => {
            p.projectileDamage += 2;
            p.projectileCount = (p.projectileCount || 1) + 1;
            p.piercingCount = (p.piercingCount || 0) + 2;
            p.critChance = (p.critChance || 0) + 0.15;
        }
    },
    {
        id: 'void_reactor',
        type: 'active',
        rarity: 'boss',
        emoji: '🕳️',
        name: '虚空反应堆',
        description: 'Boss遗物：释放虚空爆破，重创Boss并清空周围敌人。冷却 30 秒。',
        unique: true,
        shop: false,
        boss: true,
        cooldownMs: 30000,
        onUse: (p, g) => {
            let radius = 240;
            forEachEnemyInRadius(g, p.x, p.y, radius, (enemy) => {
                enemy.takeDamage(99999);
            });

            if (g.waveManager && g.waveManager.isBossActive()) {
                let boss = g.waveManager.getBoss();
                if (boss) {
                    boss.takeDamage(18 + Math.floor(p.projectileDamage * 2));
                }
            }

            g.addExplosion(p.x, p.y, [140, 0, 255], 28);
            g.addScreenShake(18, 24);
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

function equipActiveItem(player, itemDef, gameInstance, { dropPrevious = true } = {}) {
    player.activeItem = player.activeItem || null;

    let old = player.activeItem;

    player.activeItem = {
        id: itemDef.id,
        def: itemDef,
        cooldownMs: itemDef.cooldownMs || 10000,
        lastUsedTime: -Infinity
    };

    if (dropPrevious && old && gameInstance) {
        // Drop the previous active item near the player so it can be swapped like Isaac.
        let dropX = player.x + random(-20, 20);
        let dropY = player.y + random(-20, 20);
        gameInstance.powerUps.push(createItemPickup(dropX, dropY, old.id));
    }
}

function grantItemToPlayer(player, itemId, gameInstance = null) {
    let def = getItemDef(itemId);
    if (!def || !player) return false;

    if (def.type === 'active') {
        equipActiveItem(player, def, gameInstance, { dropPrevious: true });
        return true;
    }

    // Passive / special
    if (def.unique && playerHasItem(player, def.id)) {
        // Duplicate uniques: convert into a small gold refund (simple interaction rule)
        player.gold = (player.gold || 0) + 15;
        return false;
    }

    player.passiveItems = player.passiveItems || [];
    player.passiveItems.push(def.id);

    if (typeof def.apply === 'function') {
        def.apply(player, gameInstance);
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

function weightedPickDef(pool, { avoidIds = [] } = {}) {
    let filtered = pool.filter(e => !avoidIds.includes(e.def.id));
    if (filtered.length === 0) filtered = pool;

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
        drops.push(def);
    }

    return drops;
}

// Collectible pickup entity
class ItemPickup {
    constructor(x, y, itemId) {
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
    }

    update(player) {
        this.bobOffset += 0.05;

        this.glowIntensity += this.glowDirection * 3;
        if (this.glowIntensity > 110 || this.glowIntensity < 10) {
            this.glowDirection *= -1;
        }

        let def = getItemDef(this.itemId);
        if (!def) {
            this.collected = true;
            return;
        }

        let distanceToPlayer = dist(this.x, this.y, player.x, player.y);
        if (distanceToPlayer < this.magnetRange) {
            let pullForce = map(distanceToPlayer, 0, this.magnetRange, 8, 0);
            let angle = atan2(player.y - this.y, player.x - this.x);
            this.x += cos(angle) * pullForce;
            this.y += sin(angle) * pullForce;
        }

        if (distanceToPlayer < this.size / 2 + player.size / 2) {
            let g = safeGetGame();
            grantItemToPlayer(player, this.itemId, g);
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

        push();
        translate(this.x, this.y + sin(this.bobOffset) * 3);

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

        pop();
    }

    isExpired() {
        return millis() - this.spawnTime > this.lifespan;
    }
}

function createItemPickup(x, y, itemId) {
    return new ItemPickup(x, y, itemId);
}

function createRandomShopItemPickup(x, y, player, currentWave = 1) {
    let def = rollShopItemDef(player, currentWave);
    return new ItemPickup(x, y, def.id);
}

function createBossItemPickups(x, y, player, currentWave = 1) {
    let drops = rollBossDropDefs(player, currentWave);
    let pickups = [];

    if (drops.length === 1) {
        pickups.push(new ItemPickup(x, y, drops[0].id));
        return pickups;
    }

    // Spread 2 drops so they don't overlap
    pickups.push(new ItemPickup(x - 18, y, drops[0].id));
    pickups.push(new ItemPickup(x + 18, y, drops[1].id));
    return pickups;
}
