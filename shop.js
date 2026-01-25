// Shop system for buying items between boss waves
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

    getRerollCost(currentWave = 1) {
        let multiplier = 1 + Math.max(0, this.visitCount - 1) * 0.35 + Math.max(0, currentWave - 1) * 0.08;
        return Math.max(5, Math.floor(this.rerollBaseCost * multiplier));
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

        // Fallback
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
}
