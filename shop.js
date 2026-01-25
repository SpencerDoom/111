// Shop system for buying upgrades between boss waves
class ShopSystem {
    constructor() {
        this.items = [];
        this.visitCount = 0;
        this.rerollBaseCost = 12;
        this.message = null;
        this.messageTime = 0;

        this.catalog = this.createCatalog();
    }

    createCatalog() {
        return [
            {
                id: 'heal_full',
                emoji: '❤️',
                name: '治疗',
                description: '立刻恢复至满血。',
                basePrice: 10,
                rarity: 1,
                canBuy: (p) => p.health < p.maxHealth,
                apply: (p) => {
                    p.health = p.maxHealth;
                }
            },
            {
                id: 'max_hp',
                emoji: '💗',
                name: '+2 最大生命值',
                description: '增加2点最大生命值并立刻恢复2点生命。',
                basePrice: 18,
                rarity: 1,
                canBuy: () => true,
                apply: (p) => {
                    p.maxHealth += 2;
                    p.health = Math.min(p.maxHealth, p.health + 2);
                }
            },
            {
                id: 'damage',
                emoji: '🔥',
                name: '+1 伤害',
                description: '投射物伤害 +1。',
                basePrice: 22,
                rarity: 1,
                canBuy: () => true,
                apply: (p) => {
                    p.projectileDamage += 1;
                }
            },
            {
                id: 'fire_rate',
                emoji: '💨',
                name: '快速射击',
                description: '射击冷却 -40ms（最低 100ms）。',
                basePrice: 20,
                rarity: 1,
                canBuy: (p) => p.shotCooldown > 100,
                apply: (p) => {
                    p.shotCooldown = Math.max(100, p.shotCooldown - 40);
                }
            },
            {
                id: 'speed',
                emoji: '⚡',
                name: '+速度',
                description: '移动速度 +0.5，加速度 +0.05。',
                basePrice: 18,
                rarity: 1,
                canBuy: () => true,
                apply: (p) => {
                    p.maxSpeed += 0.5;
                    p.acceleration += 0.05;
                }
            },
            {
                id: 'shield_3',
                emoji: '🛡️',
                name: '+3 护盾',
                description: '获得3点护盾（可叠加）。',
                basePrice: 16,
                rarity: 1,
                canBuy: () => true,
                apply: (p) => {
                    p.shield = (p.shield || 0) + 3;
                    p.maxShield = (p.maxShield || 0) + 3;
                }
            },
            {
                id: 'piercing',
                emoji: '🎯',
                name: '穿透强化',
                description: '子弹穿透 +2。',
                basePrice: 26,
                rarity: 2,
                canBuy: () => true,
                apply: (p) => {
                    p.piercingCount = (p.piercingCount || 0) + 2;
                }
            },
            {
                id: 'multi_shot',
                emoji: '🔱',
                name: '多重射击',
                description: '每次射击额外 +1 发子弹。',
                basePrice: 35,
                rarity: 3,
                canBuy: () => true,
                apply: (p) => {
                    p.projectileCount = (p.projectileCount || 1) + 1;
                }
            },
            {
                id: 'crit',
                emoji: '💢',
                name: '暴击训练',
                description: '暴击率 +10%。',
                basePrice: 28,
                rarity: 2,
                canBuy: () => true,
                apply: (p) => {
                    p.critChance = (p.critChance || 0) + 0.1;
                }
            },
            {
                id: 'knockback',
                emoji: '🌀',
                name: '击退强化',
                description: '击退力 +5。',
                basePrice: 20,
                rarity: 2,
                canBuy: () => true,
                apply: (p) => {
                    p.knockbackForce = (p.knockbackForce || 0) + 5;
                }
            },
            {
                id: 'explosive',
                emoji: '💥',
                name: '爆炸弹',
                description: '投射物击中时会爆炸造成范围伤害。',
                basePrice: 45,
                rarity: 4,
                canBuy: (p) => !p.explosiveShots,
                apply: (p) => {
                    p.explosiveShots = true;
                }
            },
            {
                id: 'spread',
                emoji: '🌪️',
                name: '散射',
                description: '发射三连散射（与多重射击叠加）。',
                basePrice: 40,
                rarity: 3,
                canBuy: (p) => !p.spreadShot,
                apply: (p) => {
                    p.spreadShot = true;
                }
            },
            {
                id: 'vampirism',
                emoji: '🩸',
                name: '吸血',
                description: '击败敌人时恢复1点生命值。',
                basePrice: 50,
                rarity: 4,
                canBuy: (p) => !p.vampiric,
                apply: (p) => {
                    p.vampiric = true;
                }
            },
            {
                id: 'regen',
                emoji: '🌿',
                name: '再生',
                description: '每2秒恢复1点生命值。',
                basePrice: 42,
                rarity: 3,
                canBuy: (p) => !p.regenRate || p.regenRate <= 0,
                apply: (p) => {
                    p.regenRate = 2000;
                    p.lastRegenTime = millis();
                }
            }
        ];
    }

    update() {
        if (this.messageTime > 0) {
            this.messageTime -= 1;
            if (this.messageTime <= 0) {
                this.messageTime = 0;
                this.message = null;
            }
        }
    }

    open(player, currentWave) {
        this.visitCount++;
        this.generateItems(player, currentWave);
        this.setMessage('欢迎光临！按 1~3 购买，R 刷新，ESC 离开。', 180);
    }

    setMessage(msg, time = 120) {
        this.message = msg;
        this.messageTime = time;
    }

    getRerollCost(currentWave = 1) {
        let multiplier = 1 + Math.max(0, this.visitCount - 1) * 0.35 + Math.max(0, currentWave - 1) * 0.08;
        return Math.max(5, Math.floor(this.rerollBaseCost * multiplier));
    }

    getPriceMultiplier(currentWave = 1) {
        return 1 + Math.max(0, currentWave - 1) * 0.1;
    }

    generateItems(player, currentWave = 1) {
        let multiplier = this.getPriceMultiplier(currentWave);
        let selected = [];
        let attempts = 0;

        while (selected.length < 3 && attempts < 80) {
            attempts++;
            let template = this.weightedPick(this.catalog);
            if (selected.some(i => i.id === template.id)) continue;

            // If a template is not buyable now, still allow it occasionally, but reduce its chance
            let canBuyNow = template.canBuy ? template.canBuy(player) : true;
            if (!canBuyNow && Math.random() < 0.85) {
                continue;
            }

            selected.push({
                ...template,
                sold: false,
                price: Math.max(1, Math.floor(template.basePrice * multiplier))
            });
        }

        // Fallback: fill with whatever we can
        while (selected.length < 3) {
            let template = this.catalog[Math.floor(Math.random() * this.catalog.length)];
            if (selected.some(i => i.id === template.id)) continue;
            selected.push({
                ...template,
                sold: false,
                price: Math.max(1, Math.floor(template.basePrice * multiplier))
            });
        }

        this.items = selected;
    }

    weightedPick(list) {
        let getWeight = (item) => 1 / Math.max(1, item.rarity || 1);

        let total = 0;
        for (let item of list) total += getWeight(item);

        let r = Math.random() * total;
        for (let item of list) {
            r -= getWeight(item);
            if (r <= 0) return item;
        }
        return list[list.length - 1];
    }

    canPurchase(index, player) {
        let item = this.items[index];
        if (!item) return { ok: false, reason: '不存在的商品' };
        if (item.sold) return { ok: false, reason: '已售罄' };
        if (item.canBuy && !item.canBuy(player)) return { ok: false, reason: '条件不满足' };
        if (player.gold < item.price) return { ok: false, reason: '金币不足' };
        return { ok: true, reason: null };
    }

    purchase(index, player) {
        let check = this.canPurchase(index, player);
        if (!check.ok) {
            this.setMessage(check.reason, 90);
            return false;
        }

        let item = this.items[index];
        player.gold -= item.price;
        if (item.apply) {
            item.apply(player);
        }

        item.sold = true;
        this.setMessage(`购买成功：${item.emoji} ${item.name} (-${item.price}💰)`, 140);
        return true;
    }

    reroll(player, currentWave = 1) {
        let cost = this.getRerollCost(currentWave);
        if (player.gold < cost) {
            this.setMessage('金币不足，无法刷新', 90);
            return false;
        }
        player.gold -= cost;
        this.generateItems(player, currentWave);
        this.setMessage(`已刷新商品 (-${cost}💰)`, 120);
        return true;
    }

    handleKeyPressed(keyValue, player, currentWave = 1) {
        if (keyValue === '1' || keyValue === '2' || keyValue === '3') {
            let idx = parseInt(keyValue, 10) - 1;
            return this.purchase(idx, player);
        }

        if (keyValue === 'r' || keyValue === 'R') {
            return this.reroll(player, currentWave);
        }

        return false;
    }
}
