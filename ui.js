// UI system for HUD, menus, and game screens
class UIManager {
    constructor() {
        this.colorScheme = {
            background: [20, 25, 40],
            accent: [100, 200, 255],
            warning: [255, 100, 100],
            success: [100, 255, 100],
            gold: [255, 215, 0],
            text: [255, 255, 255]
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
        stroke(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        rect(x, y, barWidth, barHeight);
        
        // Text
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textAlign(CENTER, CENTER);
        textSize(12);
        text(`❤️ ${player.health}/${player.maxHealth}`, x + barWidth/2, y + barHeight/2);
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
        stroke(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        rect(x, y, barWidth, barHeight);
        
        // Text
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textAlign(LEFT, CENTER);
        textSize(10);
        text(`⭐ Level ${player.level} (${player.xp}/${player.xpToNextLevel})`, x + 5, y + barHeight/2);
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
        stroke(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        rect(x, y, barWidth, barHeight);
        
        // Text
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textAlign(LEFT, CENTER);
        textSize(8);
        text("⚡ Dash", x + 5, y + barHeight/2);
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
        stroke(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        rect(x, y, barWidth, barHeight);
        
        // Text
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textAlign(LEFT, CENTER);
        textSize(8);
        text(`🛡️ Shield: ${player.shield}/${player.maxShield}`, x + 5, y + barHeight/2);
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
        
        if (effects.length > 0) {
            fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
            textAlign(LEFT, TOP);
            textSize(10);
            text("Active Effects:", x, y);
            
            for (let i = 0; i < effects.length; i++) {
                let effect = effects[i];
                let yOffset = y + 12 + i * 15;
                
                // Effect emoji and timer
                text(`${effect.emoji} ${Math.ceil(effect.time / 60)}s`, x, yOffset);
            }
        }
    }
    
    drawAchievementProgress(achievementSystem, x, y) {
        let unlocked = achievementSystem.getUnlockedCount();
        let total = achievementSystem.getTotalCount();
        
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
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
        stroke(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        rect(x - barWidth, y + 20, barWidth, barHeight);
    }

    drawWaveInfo(waveManager, x, y) {
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textAlign(RIGHT, TOP);
        textSize(16);
        text(`Wave: ${waveManager.getCurrentWave()}`, x, y);
        
        if (waveManager.isBossActive()) {
            textSize(14);
            fill(this.colorScheme.warning[0], this.colorScheme.warning[1], this.colorScheme.warning[2]);
            text("⚠️ BOSS BATTLE", x, y + 20);
        }
    }

    drawResources(player, x, y) {
        fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
        textAlign(RIGHT, TOP);
        textSize(14);
        text(`💰 Gold: ${player.gold}`, x, y);
        
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        text(`Level: ${player.level}`, x, y + 20);
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
        text("🚀 EMOJI ROGUELIKE SHOOTER 🚀", width/2, height/2 - 100);
        
        // Subtitle with new features
        fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
        textSize(16);
        text("Now with 4 New Enemy Types, Enhanced Weapons, and Achievements!", width/2, height/2 - 60);
        
        // Instructions
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textSize(18);
        text("WASD to move", width/2, height/2 - 30);
        text("Mouse to aim and click to shoot", width/2, height/2);
        text("Right click to dash", width/2, height/2 + 30);
        text("Collect power-ups and unlock achievements!", width/2, height/2 + 60);
        
        // Start button
        textSize(24);
        fill(this.colorScheme.success[0], this.colorScheme.success[1], this.colorScheme.success[2]);
        text("Click to Start", width/2, height/2 + 100);
        
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
        text("💀 GAME OVER 💀", width/2, height/2 - 80);
        
        // Stats
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textSize(18);
        text(`Final Level: ${player.level}`, width/2, height/2 - 30);
        text(`Waves Survived: ${waveManager.getCurrentWave() - 1}`, width/2, height/2);
        text(`Gold Collected: ${player.gold}`, width/2, height/2 + 30);
        
        // Restart button
        textSize(20);
        fill(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
        text("Click to Restart", width/2, height/2 + 80);
        
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
        text("🎯 LEVEL UP! 🎯", width/2, height/2 - 150);
        
        // Instructions
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textSize(16);
        text("Choose a talent:", width/2, height/2 - 100);
        
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
            fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
            textSize(12);
            text(talent.description, width/2 - 190, y + 15);
        }
        
        // Instructions
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textAlign(CENTER, CENTER);
        textSize(14);
        text("Press 1, 2, or 3 to select", width/2, height/2 + 100);
        
        pop();
    }

    // Shop screen
    drawShopScreen(player) {
        push();
        
        // Background overlay
        fill(0, 0, 0, 180);
        rect(0, 0, width, height);
        
        // Title
        fill(this.colorScheme.gold[0], this.colorScheme.gold[1], this.colorScheme.gold[2]);
        textAlign(CENTER, CENTER);
        textSize(36);
        text("🏪 SHOP 🏪", width/2, height/2 - 150);
        
        // Player gold
        textSize(18);
        text(`💰 Gold: ${player.gold}`, width/2, height/2 - 100);
        
        // Shop items (placeholder)
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textSize(16);
        text("Coming Soon...", width/2, height/2);
        text("Press ESC to continue", width/2, height/2 + 50);
        
        pop();
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
        stroke(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        strokeWeight(2);
        rect(x, y, barWidth, barHeight);
        
        // Boss name and phase
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textAlign(CENTER, CENTER);
        textSize(14);
        text(`${boss.getBossEmoji()} Boss Phase ${boss.phase} ${boss.getBossEmoji()}`, x + barWidth/2, y + barHeight/2);
        
        pop();
    }

    // Utility methods
    drawButton(x, y, w, h, text, isHovered = false) {
        push();
        
        if (isHovered) {
            fill(this.colorScheme.accent[0], this.colorScheme.accent[1], this.colorScheme.accent[2]);
        } else {
            fill(50);
        }
        stroke(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        rect(x, y, w, h);
        
        fill(this.colorScheme.text[0], this.colorScheme.text[1], this.colorScheme.text[2]);
        textAlign(CENTER, CENTER);
        textSize(16);
        text(text, x + w/2, y + h/2);
        
        pop();
    }

    isPointInRect(px, py, x, y, w, h) {
        return px >= x && px <= x + w && py >= y && py <= y + h;
    }
}