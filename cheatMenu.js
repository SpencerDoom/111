// 作弊菜单系统
class CheatMenu {
    constructor() {
        this.isOpen = false;
        this.currentTab = 'player'; // 'player', 'items', 'waves'
        this.itemScrollOffset = 0;
        this.maxItemsVisible = 10;
        
        // 颜色方案
        this.colors = {
            background: [40, 44, 52],
            panel: [30, 33, 39],
            accent: [97, 175, 239],
            success: [152, 195, 121],
            warning: [229, 192, 123],
            danger: [224, 108, 117],
            text: [171, 178, 191],
            textLight: [220, 223, 228]
        };
        
        // 玩家属性修改器
        this.playerModifiers = {
            health: { value: 10, min: 1, max: 999, name: '生命值', step: 1 },
            maxHealth: { value: 10, min: 1, max: 999, name: '最大生命值', step: 1 },
            damage: { value: 2, min: 1, max: 999, name: '伤害', step: 1 },
            speed: { value: 4, min: 1, max: 20, name: '速度', step: 0.5 },
            gold: { value: 0, min: 0, max: 99999, name: '金币', step: 100 },
            xp: { value: 0, min: 0, max: 9999, name: '经验值', step: 50 },
            level: { value: 1, min: 1, max: 99, name: '等级', step: 1 },
            shield: { value: 0, min: 0, max: 999, name: '护盾', step: 1 },
            critChance: { value: 0, min: 0, max: 1, name: '暴击率', step: 0.1 }
        };
        
        // 波数修改器
        this.waveModifiers = {
            currentWave: { value: 1, min: 1, max: 999, name: '当前波次', step: 1 },
            enemiesPerWave: { value: 5, min: 1, max: 100, name: '每波敌人数量', step: 5 }
        };
    }
    
    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.syncFromGame();
        }
    }
    
    syncFromGame() {
        if (!game || !game.player) return;
        
        let player = game.player;
        
        // 同步玩家属性
        this.playerModifiers.health.value = player.health;
        this.playerModifiers.maxHealth.value = player.maxHealth;
        this.playerModifiers.damage.value = player.projectileDamage;
        this.playerModifiers.speed.value = player.maxSpeed;
        this.playerModifiers.gold.value = Math.floor(player.gold);
        this.playerModifiers.xp.value = player.xp;
        this.playerModifiers.level.value = player.level;
        this.playerModifiers.shield.value = player.shield || 0;
        this.playerModifiers.critChance.value = player.critChance || 0;
        
        // 同步波数
        if (game.waveManager) {
            this.waveModifiers.currentWave.value = game.waveManager.getCurrentWave();
            this.waveModifiers.enemiesPerWave.value = game.waveManager.enemiesPerWave;
        }
    }
    
    applyToGame() {
        if (!game || !game.player) return;
        
        let player = game.player;
        
        // 应用玩家属性
        player.health = this.playerModifiers.health.value;
        player.maxHealth = this.playerModifiers.maxHealth.value;
        player.projectileDamage = this.playerModifiers.damage.value;
        player.baseProjectileDamage = this.playerModifiers.damage.value;
        player.maxSpeed = this.playerModifiers.speed.value;
        player.gold = this.playerModifiers.gold.value;
        player.xp = this.playerModifiers.xp.value;
        player.level = this.playerModifiers.level.value;
        player.shield = this.playerModifiers.shield.value;
        player.critChance = this.playerModifiers.critChance.value;
        
        // 更新经验需求
        player.xpToNextLevel = Math.floor(10 * Math.pow(1.2, player.level - 1));
        
        // 应用波数
        if (game.waveManager) {
            game.waveManager.currentWave = this.waveModifiers.currentWave.value;
            game.waveManager.enemiesPerWave = this.waveModifiers.enemiesPerWave.value;
        }
    }
    
    giveItem(itemId) {
        if (!game || !game.player) return;
        
        let itemDef = getItemDef(itemId);
        if (!itemDef) return;
        
        grantItemToPlayer(game.player, itemId, game);
        console.log(`作弊菜单: 已获得道具 ${itemDef.name}`);
    }
    
    giveAllItems() {
        if (!game || !game.player) return;
        
        let allItems = getAllItemDefs();
        for (let item of allItems) {
            grantItemToPlayer(game.player, item.id, game);
        }
        console.log('作弊菜单: 已获得所有道具');
    }
    
    draw() {
        if (!this.isOpen) return;
        
        push();
        
        // 半透明背景
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        
        // 主面板
        let panelWidth = 600;
        let panelHeight = 500;
        let panelX = (width - panelWidth) / 2;
        let panelY = (height - panelHeight) / 2;
        
        fill(this.colors.panel[0], this.colors.panel[1], this.colors.panel[2]);
        stroke(this.colors.accent[0], this.colors.accent[1], this.colors.accent[2]);
        strokeWeight(2);
        rect(panelX, panelY, panelWidth, panelHeight, 10);
        
        // 标题
        fill(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
        textAlign(CENTER, TOP);
        textSize(24);
        text('🎮 作弊菜单 🎮', width / 2, panelY + 15);
        
        // Tab切换按钮
        this.drawTabs(panelX, panelY + 60, panelWidth);
        
        // 根据当前tab绘制内容
        let contentY = panelY + 110;
        let contentHeight = panelHeight - 180;
        
        if (this.currentTab === 'player') {
            this.drawPlayerModifiers(panelX + 20, contentY, panelWidth - 40, contentHeight);
        } else if (this.currentTab === 'items') {
            this.drawItemsPanel(panelX + 20, contentY, panelWidth - 40, contentHeight);
        } else if (this.currentTab === 'waves') {
            this.drawWaveModifiers(panelX + 20, contentY, panelWidth - 40, contentHeight);
        }
        
        // 底部按钮
        this.drawBottomButtons(panelX, panelY + panelHeight - 60, panelWidth);
        
        // 关闭提示
        fill(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
        textAlign(CENTER, BOTTOM);
        textSize(12);
        text('按 C 关闭 | 点击外部区域关闭', width / 2, panelY + panelHeight - 10);
        
        pop();
    }
    
    drawTabs(x, y, width) {
        let tabWidth = width / 3;
        let tabs = [
            { id: 'player', name: '玩家属性' },
            { id: 'items', name: '道具获取' },
            { id: 'waves', name: '波数设置' }
        ];
        
        for (let i = 0; i < tabs.length; i++) {
            let tab = tabs[i];
            let tabX = x + i * tabWidth;
            
            if (this.currentTab === tab.id) {
                fill(this.colors.accent[0], this.colors.accent[1], this.colors.accent[2]);
            } else {
                fill(this.colors.background[0], this.colors.background[1], this.colors.background[2]);
            }
            
            stroke(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
            strokeWeight(1);
            rect(tabX + 5, y, tabWidth - 10, 35, 5);
            
            fill(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
            textAlign(CENTER, CENTER);
            textSize(14);
            text(tab.name, tabX + tabWidth / 2, y + 17);
        }
    }
    
    drawPlayerModifiers(x, y, width, height) {
        let startY = y;
        let rowHeight = 35;
        let colWidth = width / 2;
        
        fill(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
        textAlign(LEFT, TOP);
        textSize(14);
        text('玩家属性修改:', x, startY);
        startY += 25;
        
        let modifiers = Object.entries(this.playerModifiers);
        for (let i = 0; i < modifiers.length; i++) {
            let [key, modifier] = modifiers[i];
            let col = i % 2;
            let row = Math.floor(i / 2);
            let itemX = x + col * colWidth;
            let itemY = startY + row * rowHeight;
            
            // 属性名
            fill(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
            textAlign(LEFT, CENTER);
            textSize(12);
            text(`${modifier.name}:`, itemX, itemY);
            
            // 减少按钮
            this.drawSmallButton(itemX + 80, itemY - 12, 25, 24, '-', false);
            
            // 当前值
            fill(this.colors.accent[0], this.colors.accent[1], this.colors.accent[2]);
            textAlign(CENTER, CENTER);
            textSize(12);
            text(modifier.value.toFixed(1), itemX + 115, itemY);
            
            // 增加按钮
            this.drawSmallButton(itemX + 130, itemY - 12, 25, 24, '+', false);
        }
    }
    
    drawItemsPanel(x, y, width, height) {
        let allItems = getAllItemDefs();
        let startY = y;
        
        fill(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
        textAlign(LEFT, TOP);
        textSize(14);
        text('道具获取 (点击获取):', x, startY);
        startY += 25;
        
        // 获取所有道具按钮
        this.drawButton(x, startY, 200, 30, '获取所有道具', false);
        
        startY += 40;
        
        // 道具列表
        let itemHeight = 28;
        let visibleItems = Math.min(this.maxItemsVisible, allItems.length - this.itemScrollOffset);
        
        for (let i = 0; i < visibleItems; i++) {
            let itemIndex = this.itemScrollOffset + i;
            let item = allItems[itemIndex];
            let itemY = startY + i * itemHeight;
            
            // 道具背景
            fill(this.colors.background[0], this.colors.background[1], this.colors.background[2]);
            stroke(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
            strokeWeight(1);
            rect(x, itemY, width, itemHeight, 3);
            
            // 道具信息
            fill(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
            textAlign(LEFT, CENTER);
            textSize(11);
            text(`${item.emoji} ${item.name}`, x + 8, itemY + itemHeight / 2);
            
            // 稀有度
            let rarity = getRarityDef(item.rarity);
            fill(rarity.color[0], rarity.color[1], rarity.color[2]);
            textAlign(RIGHT, CENTER);
            text(rarity.name, x + width - 8, itemY + itemHeight / 2);
        }
        
        // 滚动提示
        if (allItems.length > this.maxItemsVisible) {
            fill(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
            textAlign(CENTER, BOTTOM);
            textSize(10);
            text(`显示 ${this.itemScrollOffset + 1}-${Math.min(this.itemScrollOffset + this.maxItemsVisible, allItems.length)} / ${allItems.length} (滚轮滚动)`, x + width / 2, y + height - 5);
        }
    }
    
    drawWaveModifiers(x, y, width, height) {
        let startY = y;
        let rowHeight = 50;
        
        fill(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
        textAlign(LEFT, TOP);
        textSize(14);
        text('波数设置:', x, startY);
        startY += 25;
        
        let modifiers = Object.entries(this.waveModifiers);
        for (let i = 0; i < modifiers.length; i++) {
            let [key, modifier] = modifiers[i];
            let itemY = startY + i * rowHeight;
            
            // 属性名
            fill(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
            textAlign(LEFT, CENTER);
            textSize(13);
            text(`${modifier.name}:`, x, itemY + 15);
            
            // 减少按钮
            this.drawSmallButton(x + 150, itemY + 3, 30, 28, '-', false);
            
            // 当前值
            fill(this.colors.accent[0], this.colors.accent[1], this.colors.accent[2]);
            textAlign(CENTER, CENTER);
            textSize(14);
            text(Math.floor(modifier.value), x + 195, itemY + 17);
            
            // 增加按钮
            this.drawSmallButton(x + 210, itemY + 3, 30, 28, '+', false);
        }
        
        // 跳转到Boss战按钮
        startY += modifiers.length * rowHeight + 20;
        this.drawButton(x, startY, 200, 35, '跳转到Boss战', false);
    }
    
    drawBottomButtons(x, y, width) {
        let buttonWidth = 120;
        let buttonHeight = 35;
        let gap = 20;
        let totalWidth = buttonWidth * 2 + gap;
        let startX = x + (width - totalWidth) / 2;
        
        // 应用按钮
        this.drawButton(startX, y, buttonWidth, buttonHeight, '应用修改', true);
        
        // 重置按钮
        this.drawButton(startX + buttonWidth + gap, y, buttonWidth, buttonHeight, '重置', false);
    }
    
    drawButton(x, y, w, h, buttonText, isPrimary) {
        if (isPrimary) {
            fill(this.colors.success[0], this.colors.success[1], this.colors.success[2]);
        } else {
            fill(this.colors.accent[0], this.colors.accent[1], this.colors.accent[2]);
        }
        stroke(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
        strokeWeight(1);
        rect(x, y, w, h, 5);
        
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(13);
        text(buttonText, x + w / 2, y + h / 2);
    }
    
    drawSmallButton(x, y, w, h, buttonText, isPrimary) {
        if (isPrimary) {
            fill(this.colors.success[0], this.colors.success[1], this.colors.success[2]);
        } else {
            fill(this.colors.background[0], this.colors.background[1], this.colors.background[2]);
        }
        stroke(this.colors.text[0], this.colors.text[1], this.colors.text[2]);
        strokeWeight(1);
        rect(x, y, w, h, 3);
        
        fill(this.colors.textLight[0], this.colors.textLight[1], this.colors.textLight[2]);
        textAlign(CENTER, CENTER);
        textSize(14);
        text(buttonText, x + w / 2, y + h / 2);
    }
    
    handleClick(mx, my) {
        if (!this.isOpen) return false;
        
        let panelWidth = 600;
        let panelHeight = 500;
        let panelX = (width - panelWidth) / 2;
        let panelY = (height - panelHeight) / 2;
        
        // 检查是否点击外部区域
        if (mx < panelX || mx > panelX + panelWidth || my < panelY || my > panelY + panelHeight) {
            this.isOpen = false;
            return true;
        }
        
        // Tab切换
        let tabWidth = panelWidth / 3;
        let tabs = ['player', 'items', 'waves'];
        for (let i = 0; i < tabs.length; i++) {
            let tabX = panelX + 5 + i * tabWidth;
            if (mx >= tabX && mx <= tabX + tabWidth - 10 && my >= panelY + 60 && my <= panelY + 95) {
                this.currentTab = tabs[i];
                return true;
            }
        }
        
        let contentY = panelY + 110;
        let contentHeight = panelHeight - 180;
        
        if (this.currentTab === 'player') {
            return this.handlePlayerModifiersClick(mx, my, panelX + 20, contentY, panelWidth - 40);
        } else if (this.currentTab === 'items') {
            return this.handleItemsClick(mx, my, panelX + 20, contentY, panelWidth - 40, contentHeight);
        } else if (this.currentTab === 'waves') {
            return this.handleWaveModifiersClick(mx, my, panelX + 20, contentY, panelWidth - 40);
        }
        
        // 底部按钮
        let buttonWidth = 120;
        let buttonHeight = 35;
        let gap = 20;
        let totalWidth = buttonWidth * 2 + gap;
        let startX = panelX + (panelWidth - totalWidth) / 2;
        let buttonY = panelY + panelHeight - 60;
        
        // 应用按钮
        if (mx >= startX && mx <= startX + buttonWidth && my >= buttonY && my <= buttonY + buttonHeight) {
            this.applyToGame();
            return true;
        }
        
        // 重置按钮
        if (mx >= startX + buttonWidth + gap && mx <= startX + buttonWidth * 2 + gap && my >= buttonY && my <= buttonY + buttonHeight) {
            this.syncFromGame();
            return true;
        }
        
        return false;
    }
    
    handlePlayerModifiersClick(mx, my, x, y, width) {
        let startY = y + 25;
        let rowHeight = 35;
        let colWidth = width / 2;
        
        let modifiers = Object.entries(this.playerModifiers);
        for (let i = 0; i < modifiers.length; i++) {
            let [key, modifier] = modifiers[i];
            let col = i % 2;
            let row = Math.floor(i / 2);
            let itemX = x + col * colWidth;
            let itemY = startY + row * rowHeight;
            
            // 减少按钮
            if (mx >= itemX + 80 && mx <= itemX + 105 && my >= itemY - 12 && my <= itemY + 12) {
                modifier.value = Math.max(modifier.min, modifier.value - modifier.step);
                return true;
            }
            
            // 增加按钮
            if (mx >= itemX + 130 && mx <= itemX + 155 && my >= itemY - 12 && my <= itemY + 12) {
                modifier.value = Math.min(modifier.max, modifier.value + modifier.step);
                return true;
            }
        }
        
        return false;
    }
    
    handleItemsClick(mx, my, x, y, width, height) {
        let startY = y + 25;
        
        // 获取所有道具按钮
        if (mx >= x && mx <= x + 200 && my >= startY && my <= startY + 30) {
            this.giveAllItems();
            return true;
        }
        
        startY += 40;
        
        // 道具列表
        let allItems = getAllItemDefs();
        let itemHeight = 28;
        let visibleItems = Math.min(this.maxItemsVisible, allItems.length - this.itemScrollOffset);
        
        for (let i = 0; i < visibleItems; i++) {
            let itemIndex = this.itemScrollOffset + i;
            let itemY = startY + i * itemHeight;
            
            if (mx >= x && mx <= x + width && my >= itemY && my <= itemY + itemHeight) {
                this.giveItem(allItems[itemIndex].id);
                return true;
            }
        }
        
        return false;
    }
    
    handleWaveModifiersClick(mx, my, x, y, width) {
        let startY = y + 25;
        let rowHeight = 50;
        
        let modifiers = Object.entries(this.waveModifiers);
        for (let i = 0; i < modifiers.length; i++) {
            let [key, modifier] = modifiers[i];
            let itemY = startY + i * rowHeight;
            
            // 减少按钮
            if (mx >= x + 150 && mx <= x + 180 && my >= itemY + 3 && my <= itemY + 31) {
                modifier.value = Math.max(modifier.min, modifier.value - modifier.step);
                return true;
            }
            
            // 增加按钮
            if (mx >= x + 210 && mx <= x + 240 && my >= itemY + 3 && my <= itemY + 31) {
                modifier.value = Math.min(modifier.max, modifier.value + modifier.step);
                return true;
            }
        }
        
        // 跳转到Boss战按钮
        startY += modifiers.length * rowHeight + 20;
        if (mx >= x && mx <= x + 200 && my >= startY && my <= startY + 35) {
            if (game && game.waveManager) {
                this.waveModifiers.currentWave.value = game.waveManager.bossAppearsWave;
                this.applyToGame();
            }
            return true;
        }
        
        return false;
    }
    
    handleScroll(delta) {
        if (!this.isOpen || this.currentTab !== 'items') return;
        
        let allItems = getAllItemDefs();
        let maxScroll = Math.max(0, allItems.length - this.maxItemsVisible);
        
        this.itemScrollOffset += delta > 0 ? 1 : -1;
        this.itemScrollOffset = constrain(this.itemScrollOffset, 0, maxScroll);
    }
}