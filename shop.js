// Shop system for buying items between boss waves - 只出售新道具系统道具
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
        if (typeof getAllItemDefs === 'function') {
            return getAllItemDefs().filter(d => d.shop);
        }
        return [];
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

    getRerollCost(currentWave = 1, player = null) {
        // 应用无穷商城折扣
        let discount = 1.0;
        if (player && player.hasInfiniteShop) {
            discount = Math.pow(0.95, this.visitCount); // 每次访问5%折扣
            discount = Math.max(discount, 0.15); // 最低15%折扣（最多3金币时相当于6.67折）
        }
        
        let multiplier = 1 + Math.max(0, this.visitCount - 1) * 0.35 + Math.max(0, currentWave - 1) * 0.08;
        let cost = Math.max(5, Math.floor(this.rerollBaseCost * multiplier));
        
        // 应用折扣（最低3金币）
        cost = Math.max(3, Math.floor(cost * discount));
        
        return cost;
    }

    getPriceMultiplier(currentWave = 1) {
        return 1 + Math.max(0, currentWave - 1) * 0.08;
    }

    getBasePriceForRarity(rarityId) {
        if (typeof getRarityDef === 'function') {
            let r = getRarityDef(rarityId);
            if (r && r.shopPriceMax > 0) {
                return Math.floor(random(r.shopPriceMin, r.shopPriceMax + 1));
            }
        }

        // Fallback - 只保留新道具的稀有度定价
        switch (rarityId) {
            case 'rare':
                return Math.floor(random(100, 151));
            case 'legendary':
                return Math.floor(random(200, 281));
            default:
                return Math.floor(random(50, 81));
        }
    }

    generateItems(player, currentWave = 1) {
        let multiplier = this.getPriceMultiplier(currentWave);
        let selected = [];
        let attempts = 0;

        while (selected.length < 3 && attempts < 80) {
            attempts++;

            let def = null;
            if (typeof rollShopItemDef === 'function') {
                def = rollShopItemDef(player, currentWave);
            }

            if (!def) {
                if (this.catalog.length === 0) break;
                def = this.catalog[Math.floor(Math.random() * this.catalog.length)];
            }

            if (selected.some(i => i.id === def.id)) continue;

            selected.push({
                id: def.id,
                emoji: def.emoji,
                name: def.name,
                description: def.description,
                rarity: def.rarity,
                type: def.type,
                sold: false,
                price: Math.max(1, Math.floor(this.getBasePriceForRarity(def.rarity) * multiplier)),
                canBuy: (p) => {
                    if (def.unique && typeof playerHasItem === 'function' && playerHasItem(p, def.id)) return false;
                    if (def.type === 'active' && p.activeItem && p.activeItem.id === def.id) return false;
                    return true;
                },
                apply: (p) => {
                    if (typeof grantItemToPlayer === 'function') {
                        // 注册事件监听器
                        if (def.onKill) {
                            p.addEventListener('onKill', (enemy) => def.onKill(p, enemy, game));
                        }
                        if (def.onCrit) {
                            p.addEventListener('onCrit', (enemy) => def.onCrit(p, enemy, game));
                        }
                        if (def.onDamage) {
                            p.addEventListener('onDamage', (damage) => def.onDamage(p, damage, game));
                        }
                        if (def.onGoldCollected) {
                            p.addEventListener('onGoldCollected', (amount) => def.onGoldCollected(p, amount, game));
                        }
                        if (def.onProjectileHit) {
                            p.addEventListener('onProjectileHit', (projectile, enemy) => def.onProjectileHit(p, projectile, enemy, game));
                        }
                        
                        grantItemToPlayer(p, def.id, typeof game !== 'undefined' ? game : null);
                    }
                }
            });
        }

        // Fallback fill
        while (selected.length < 3 && this.catalog.length > 0) {
            let def = this.catalog[Math.floor(Math.random() * this.catalog.length)];
            if (selected.some(i => i.id === def.id)) continue;
            selected.push({
                id: def.id,
                emoji: def.emoji,
                name: def.name,
                description: def.description,
                rarity: def.rarity,
                type: def.type,
                sold: false,
                price: Math.max(1, Math.floor(this.getBasePriceForRarity(def.rarity) * multiplier)),
                canBuy: (p) => {
                    if (def.unique && typeof playerHasItem === 'function' && playerHasItem(p, def.id)) return false;
                    if (def.type === 'active' && p.activeItem && p.activeItem.id === def.id) return false;
                    return true;
                },
                apply: (p) => {
                    if (typeof grantItemToPlayer === 'function') {
                        grantItemToPlayer(p, def.id, typeof game !== 'undefined' ? game : null);
                    }
                }
            });
        }

        this.items = selected;
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

    display(game) {
        // Display shop overlay
        push();
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);

        // Shop title
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        text('道具商店', width / 2, 50);

        // Display items
        let itemWidth = 200;
        let itemHeight = 120;
        let startX = width / 2 - (3 * itemWidth) / 2;
        let startY = height / 2 - itemHeight / 2;

        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            let x = startX + i * itemWidth;
            let y = startY;

            // Item background
            let rarityColor = getRarityDef(item.rarity).color;
            fill(rarityColor[0], rarityColor[1], rarityColor[2], 50);
            stroke(rarityColor[0], rarityColor[1], rarityColor[2]);
            strokeWeight(2);
            rect(x, y, itemWidth, itemHeight, 10);

            // Item content
            fill(255);
            noStroke();
            textAlign(CENTER, TOP);
            textSize(20);
            text(item.emoji, x + itemWidth / 2, y + 10);

            textSize(14);
            text(item.name, x + itemWidth / 2, y + 40);

            textSize(10);
            text(item.description, x + itemWidth / 2, y + 60, itemWidth - 20, itemHeight - 40);

            // Price
            textSize(12);
            fill(255, 215, 0);
            text(`${item.price}💰`, x + itemWidth / 2, y + itemHeight - 20);

            // Key hint
            textSize(10);
            fill(200);
            text(`${i + 1}`, x + 10, y + 10);

            // Sold indicator
            if (item.sold) {
                fill(255, 0, 0, 150);
                textAlign(CENTER, CENTER);
                textSize(24);
                text('已售罄', x + itemWidth / 2, y + itemHeight / 2);
            }
        }

        // Instructions
        textAlign(CENTER, BOTTOM);
        textSize(14);
        fill(200);
        text('按 1~3 购买，R 刷新，ESC 离开', width / 2, height - 20);

        // Message
        if (this.message) {
            textAlign(CENTER, CENTER);
            textSize(16);
            fill(255, 255, 0);
            text(this.message, width / 2, height - 60);
        }

        // Reroll cost
        let rerollCost = this.getRerollCost(game.waveManager.getCurrentWave());
        textAlign(CENTER, CENTER);
        textSize(12);
        fill(255, 255, 255);
        text(`刷新成本: ${rerollCost}💰`, width / 2, height - 40);

        pop();
    }
}