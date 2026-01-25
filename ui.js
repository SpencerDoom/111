// UI system for HUD, menus, and game screens
class UIManager {
    constructor() {
        this.colorScheme = {
            background: [20, 25, 40],
            accent: [100, 200, 255],
            warning: [255, 100, 100],
            success: [100, 255, 100],
            gold: [255, 215, 0],
            textColor: [255, 255, 255]
        };
    }

    // Main HUD during gameplay
    drawHUD(player, waveManager) {
        push();
        
        // Health bar
        this.drawHealthBar(player, 20, 20);
        
        // Shield bar (if player has shield)
        if (player.shield && player.shield > 0) {
            this.drawShieldBar(player, 20, 45);
        }
        
        // XP bar
        this.drawXPBar(player, 20, 75);
        
        // Dash cooldown
        this.drawDashCooldown(player, 20, 105);
        
        // Active effects
        this.drawActiveEffects(player, 20, 130);
        
        // Wave info
        this.drawWaveInfo(waveManager, width - 200, 20);
        
        // Resources (Gold, Level)
        this.drawResources(player, width - 200, 60);
        
        // Achievement progress
        this.drawAchievementProgress(game.achievementSystem, width - 200, 100);
        
        pop();
    }

    drawHealthBar(player, x, y) {
        let barWidth = 200;
        let barHeight = 20;

        // Background
        fill(50);
        rect(x, y, barWidth, barHeight);

        // Health fill
        let healthWidth = map(player.health, 0, player.maxHealth, 0, barWidth);
        fill(this.colorScheme.warning[0], this.colorScheme.warning[1], this.colorScheme.warning[2]);
        rect(x, y, healthWidth, barHeight);

        // Border
        noFill();
        stroke(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        rect(x, y, barWidth, barHeight);

        // Text
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(CENTER, CENTER);
        textSize(12);
        text(`❤️ 生命值 ${player.health}/${player.maxHealth}`, x + barWidth/2, y + barHeight/2);
    }

    drawXPBar(player, x, y) {
        let barWidth = 200;
        let barHeight = 15;

        // Background
        fill(50);
        rect(x, y, barWidth, barHeight);

        // XP fill
        let xpWidth = map(player.xp, 0, player.xpToNextLevel, 0, barWidth);
        fill(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
        rect(x, y, xpWidth, barHeight);

        // Border
        noFill();
        stroke(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        rect(x, y, barWidth, barHeight);

        // Text
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(LEFT, CENTER);
        textSize(10);
        text(`⭐ 等级 ${player.level} (${player.xp}/${player.xpToNextLevel})`, x + 5, y + barHeight/2);
    }

    drawDashCooldown(player, x, y) {
        let barWidth = 100;
        let barHeight = 10;

        // Background
        fill(50);
        rect(x, y, barWidth, barHeight);

        // Cooldown fill
        let cooldownPercentage = player.getDashCooldownPercentage();
        let cooldownWidth = map(cooldownPercentage, 0, 1, 0, barWidth);
        fill(this.colorScheme.success[0], this.colorScheme.success[1], this.colorScheme.success[2]);
        rect(x, y, cooldownWidth, barHeight);

        // Border
        noFill();
        stroke(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        rect(x, y, barWidth, barHeight);

        // Text
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(LEFT, CENTER);
        textSize(8);
        text("⚡ 冲刺", x + 5, y + barHeight/2);
    }
    
    drawShieldBar(player, x, y) {
        let barWidth = 150;
        let barHeight = 8;

        // Background
        fill(50);
        rect(x, y, barWidth, barHeight);

        // Shield fill
        let shieldWidth = map(player.shield, 0, player.maxShield, 0, barWidth);
        fill(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
        rect(x, y, shieldWidth, barHeight);

        // Border
        noFill();
        stroke(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        rect(x, y, barWidth, barHeight);

        // Text
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(LEFT, CENTER);
        textSize(8);
        text(`🛡️ 护盾: ${player.shield}/${player.maxShield}`, x + 5, y + barHeight/2);
    }
    
    drawActiveEffects(player, x, y) {
        let effects = [];

        if (player.tempSpeedBoost > 0) effects.push({emoji: "⚡", time: player.tempSpeedBoost});
        if (player.tempDamageBoost > 0) effects.push({emoji: "🔥", time: player.tempDamageBoost});
        if (player.tempMultiShot > 0) effects.push({emoji: "🔱", time: player.tempMultiShot});
        if (player.tempPiercing > 0) effects.push({emoji: "🎯", time: player.tempPiercing});
        if (player.tempCritChance > 0) effects.push({emoji: "💢", time: player.tempCritChance});
        if (player.tempTimeSlow > 0) effects.push({emoji: "⏰", time: player.tempTimeSlow});
        if (player.tempVampiric > 0) effects.push({emoji: "🩸", time: player.tempVampiric});
        if (player.tempXPMagnet > 0) effects.push({emoji: "🌟", time: player.tempXPMagnet});
        if (player.tempGoldMagnet > 0) effects.push({emoji: "🧲", time: player.tempGoldMagnet});

        let hasActiveItem = player.activeItem && player.activeItem.def;
        if (!hasActiveItem && effects.length === 0) return;

        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(LEFT, TOP);
        textSize(10);

        let offsetY = y;

        if (hasActiveItem) {
            let remainMs = player.getActiveItemCooldownRemaining ? player.getActiveItemCooldownRemaining() : 0;
            let cdText = remainMs <= 0 ? '就绪' : `${(remainMs / 1000).toFixed(1)}s`;
            text(`E: ${player.activeItem.def.emoji} ${player.activeItem.def.name} (${cdText})`, x, offsetY);
            offsetY += 14;
        }

        if (effects.length > 0) {
            text("激活效果:", x, offsetY);
            for (let i = 0; i < effects.length; i++) {
                let effect = effects[i];
                let yOffset = offsetY + 12 + i * 15;
                text(`${effect.emoji} ${Math.ceil(effect.time / 60)}秒`, x, yOffset);
            }
        }
    }
    
    drawAchievementProgress(achievementSystem, x, y) {
        let unlocked = achievementSystem.getUnlockedCount();
        let total = achievementSystem.getTotalCount();
        
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(RIGHT, TOP);
        textSize(12);
        text(`🏆 ${unlocked}/${total}`, x, y);
        
        // Progress bar
        let barWidth = 100;
        let barHeight = 6;
        let progress = unlocked / total;
        
        // Background
        fill(50);
        rect(x - barWidth, y + 20, barWidth, barHeight);
        
        // Progress fill
        fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
        rect(x - barWidth, y + 20, barWidth * progress, barHeight);
        
        // Border
        noFill();
        stroke(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        rect(x - barWidth, y + 20, barWidth, barHeight);
    }

    drawWaveInfo(waveManager, x, y) {
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(RIGHT, TOP);
        textSize(16);
        text(`波次: ${waveManager.getCurrentWave()}`, x, y);

        if (waveManager.isBossActive()) {
            textSize(14);
            fill(this.colorScheme.warning[0], this.colorScheme.warning[1], this.colorScheme.warning[2]);
            text("⚠️ Boss战", x, y + 20);
        }
    }

    drawResources(player, x, y) {
        fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
        textAlign(RIGHT, TOP);
        textSize(14);
        text(`💰 金币: ${Math.floor(player.gold)}`, x, y);

        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        text(`等级: ${player.level}`, x, y + 20);
    }

    // Start screen
    drawStartScreen() {
        push();

        // Background overlay
        fill(0, 0, 0, 150);
        rect(0, 0, width, height);

        // Title
        fill(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
        textAlign(CENTER, CENTER);
        textSize(48);
        text("🚀 表情符号 Roguelike 射击游戏 🚀", width/2, height/2 - 100);

        // Subtitle with new features
        fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
        textSize(16);
        text("新增4种敌人类型、强化武器和成就系统！", width/2, height/2 - 60);

        // Instructions
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textSize(18);
        text("WASD 移动", width/2, height/2 - 30);
        text("鼠标瞄准并点击射击", width/2, height/2);
        text("右键冲刺", width/2, height/2 + 30);
        text("收集道具并解锁成就！", width/2, height/2 + 60);

        // Start button
        textSize(24);
        fill(this.colorScheme.success[0], this.colorScheme.success[1], this.colorScheme.success[2]);
        text("点击开始", width/2, height/2 + 100);

        pop();
    }

    // Game over screen
    drawGameOverScreen(player, waveManager) {
        push();

        // Background overlay
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);

        // Game Over title
        fill(this.colorScheme.warning[0], this.colorScheme.warning[1], this.colorScheme.warning[2]);
        textAlign(CENTER, CENTER);
        textSize(48);
        text("💀 游戏结束 💀", width/2, height/2 - 80);

        // Stats
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textSize(18);
        text(`最终等级: ${player.level}`, width/2, height/2 - 30);
        text(`存活波次: ${waveManager.getCurrentWave() - 1}`, width/2, height/2);
        text(`收集金币: ${Math.floor(player.gold)}`, width/2, height/2 + 30);

        // Restart button
        textSize(20);
        fill(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
        text("点击重新开始", width/2, height/2 + 80);

        pop();
    }

    // Level up screen with talent selection
    drawLevelUpScreen(availableTalents) {
        push();

        // Background overlay
        fill(0, 0, 0, 180);
        rect(0, 0, width, height);

        // Title
        fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
        textAlign(CENTER, CENTER);
        textSize(36);
        text("🎯 升级！🎯", width/2, height/2 - 150);

        // Instructions
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textSize(16);
        text("选择一个天赋:", width/2, height/2 - 100);

        // Talent options
        let talentY = height/2 - 50;
        for (let i = 0; i < availableTalents.length; i++) {
            let talent = availableTalents[i];
            let y = talentY + i * 60;

            // Talent box
            fill(50);
            stroke(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
            rect(width/2 - 200, y - 25, 400, 50);

            // Talent name
            fill(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
            textAlign(LEFT, CENTER);
            textSize(18);
            text(`${i + 1}. ${talent.name}`, width/2 - 190, y - 5);

            // Talent description
            fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
            textSize(12);
            text(talent.description, width/2 - 190, y + 15);
        }

        // Instructions
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(CENTER, CENTER);
        textSize(14);
        text("按 1、2 或 3 选择", width/2, height/2 + 100);

        pop();
    }

    // Shop screen
    drawShopScreen(player, shopSystem, waveManager) {
        push();

        // Background overlay
        fill(0, 0, 0, 180);
        rect(0, 0, width, height);

        let currentWave = waveManager && waveManager.getCurrentWave ? waveManager.getCurrentWave() : 1;

        // Title
        fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
        textAlign(CENTER, CENTER);
        textSize(36);
        text("🏪 商店 🏪", width/2, height/2 - 230);

        // Player gold & wave
        textSize(16);
        text(`💰 金币: ${Math.floor(player.gold)}    波次: ${currentWave}`, width/2, height/2 - 190);

        if (!shopSystem) {
            fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
            textSize(16);
            text("商店系统加载失败", width/2, height/2);
            pop();
            return;
        }

        // Items
        let itemRects = this.getShopItemRects(shopSystem.items.length);
        for (let i = 0; i < shopSystem.items.length; i++) {
            let item = shopSystem.items[i];
            let rectInfo = itemRects[i];

            let canBuy = !item.sold && (!item.canBuy || item.canBuy(player));
            let affordable = player.gold >= item.price;

            // Box styling
            fill(40);
            if (item.sold) {
                fill(25);
            } else if (!canBuy || !affordable) {
                fill(35);
            }

            if (item.sold) {
                stroke(120);
            } else if (canBuy && affordable) {
                stroke(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
            } else {
                stroke(this.colorScheme.warning[0], this.colorScheme.warning[1], this.colorScheme.warning[2]);
            }
            strokeWeight(2);
            rect(rectInfo.x, rectInfo.y, rectInfo.w, rectInfo.h, 8);

            // Header line
            noStroke();
            fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
            textAlign(LEFT, TOP);
            textSize(18);
            let statusText = "";
            if (item.sold) statusText = "(已购买)";
            else if (!canBuy) statusText = "(不可购买)";
            else if (!affordable) statusText = "(金币不足)";

            text(`${i + 1}. ${item.emoji} ${item.name}  -  ${item.price}💰 ${statusText}`, rectInfo.x + 16, rectInfo.y + 12);

            // Description
            textSize(12);
            fill(210);
            textWrap(WORD);
            let maxLines = 3;
            let lineHeight = 16;
            text(item.description, rectInfo.x + 16, rectInfo.y + 42, rectInfo.w - 32, maxLines * lineHeight);
        }

        // Reroll button
        let rerollRect = this.getShopRerollButtonRect();
        let rerollCost = shopSystem.getRerollCost ? shopSystem.getRerollCost(currentWave) : 0;
        let canReroll = player.gold >= rerollCost;
        this.drawButton(
            rerollRect.x,
            rerollRect.y,
            rerollRect.w,
            rerollRect.h,
            `R 刷新商品 (-${rerollCost}💰)`,
            canReroll
        );

        // Footer instructions
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(CENTER, CENTER);
        textSize(14);
        text("按 1~3 购买 | 按 R 刷新 | 按 ESC 离开", width/2, height - 60);

        // Message
        if (shopSystem.message) {
            textSize(14);
            if (shopSystem.message.includes('成功')) {
                fill(this.colorScheme.success[0], this.colorScheme.success[1], this.colorScheme.success[2]);
            } else {
                fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
            }
            text(shopSystem.message, width/2, height - 30);
        }

        pop();
    }

    getShopItemRects(itemCount) {
        let rects = [];
        let boxW = 560;
        let boxH = 90;
        let gap = 18;
        let totalH = itemCount * boxH + (itemCount - 1) * gap;
        let startY = height/2 - totalH/2 - 40;
        let x = width/2 - boxW/2;

        for (let i = 0; i < itemCount; i++) {
            rects.push({
                x,
                y: startY + i * (boxH + gap),
                w: boxW,
                h: boxH
            });
        }
        return rects;
    }

    getShopRerollButtonRect() {
        return {
            x: width/2 - 140,
            y: height - 110,
            w: 280,
            h: 36
        };
    }

    // Boss health bar
    drawBossHealthBar(boss) {
        if (!boss || boss.isDead()) return;

        push();

        let barWidth = 300;
        let barHeight = 20;
        let x = width/2 - barWidth/2;
        let y = 30;

        // Background
        fill(50);
        rect(x, y, barWidth, barHeight);

        // Health fill
        let healthWidth = map(boss.health, 0, boss.maxHealth, 0, barWidth);
        fill(this.colorScheme.warning[0], this.colorScheme.warning[1], this.colorScheme.warning[2]);
        rect(x, y, healthWidth, barHeight);

        // Border
        noFill();
        stroke(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        strokeWeight(2);
        rect(x, y, barWidth, barHeight);

        // Boss name and phase
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(CENTER, CENTER);
        textSize(14);
        text(`${boss.getBossEmoji()} Boss 阶段 ${boss.phase} ${boss.getBossEmoji()}`, x + barWidth/2, y + barHeight/2);

        pop();
    }

    // Utility methods
    drawButton(x, y, w, h, buttonText, isHovered = false) {
        push();
        
        if (isHovered) {
            fill(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
        } else {
            fill(50);
        }
        stroke(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        rect(x, y, w, h);
        
        fill(this.colorScheme.textColor[0], this.colorScheme.textColor[1], this.colorScheme.textColor[2]);
        textAlign(CENTER, CENTER);
        textSize(16);
        text(buttonText, x + w/2, y + h/2);
        
        pop();
    }

    isPointInRect(px, py, x, y, w, h) {
        return px >= x && px <= x + w && py >= y && py <= y + h;
    }
}