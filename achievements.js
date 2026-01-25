// Achievement system for the game
class AchievementSystem {
    constructor() {
        this.achievements = [
            {
                id: 'first_kill',
                name: '首杀',
                description: '击败第一个敌人',
                icon: '🔫',
                unlocked: false,
                condition: (game) => game.totalKills >= 1
            },
            {
                id: 'survivor',
                name: '幸存者',
                description: '生存2分钟',
                icon: '⏰',
                unlocked: false,
                condition: (game) => game.elapsedTime >= 120000 // 2 minutes
            },
            {
                id: 'collector',
                name: '收集家',
                description: '收集50个道具',
                icon: '💎',
                unlocked: false,
                condition: (game) => game.totalPowerUpsCollected >= 50
            },
            {
                id: 'gold_rush',
                name: '黄金狂热',
                description: '收集100金币',
                icon: '💰',
                unlocked: false,
                condition: (game) => game.totalGoldCollected >= 100
            },
            {
                id: 'level_master',
                name: '等级大师',
                description: '达到5级',
                icon: '⭐',
                unlocked: false,
                condition: (game) => game.player.level >= 5
            },
            {
                id: 'speed_demon',
                name: '速度恶魔',
                description: '30秒内击败10个敌人',
                icon: '⚡',
                unlocked: false,
                condition: (game) => game.recentKills >= 10 && game.recentKillTimeWindow <= 30000
            },
            {
                id: 'shield_master',
                name: '护盾大师',
                description: '累积50点护盾',
                icon: '🛡️',
                unlocked: false,
                condition: (game) => game.totalShieldPoints >= 50
            },
            {
                id: 'explosive_expert',
                name: '爆炸专家',
                description: '触发10次爆炸',
                icon: '💥',
                unlocked: false,
                condition: (game) => game.totalExplosions >= 10
            },
            {
                id: 'crit_master',
                name: '暴击大师',
                description: '造成20次暴击',
                icon: '💢',
                unlocked: false,
                condition: (game) => game.totalCriticalHits >= 20
            },
            {
                id: 'perfect_run',
                name: '完美运行',
                description: '无伤完成一波',
                icon: '✨',
                unlocked: false,
                condition: (game) => game.damageFreeWaves >= 1
            },
            {
                id: 'boss_slayer',
                name: 'Boss杀手',
                description: '击败第一个Boss',
                icon: '🐉',
                unlocked: false,
                condition: (game) => game.bossesDefeated >= 1
            },
            {
                id: 'talent_collector',
                name: '天赋收集家',
                description: '选择10个天赋',
                icon: '🎯',
                unlocked: false,
                condition: (game) => game.totalTalentsSelected >= 10
            }
        ];
        
        this.newlyUnlocked = [];
        this.notificationTime = 0;
        this.notificationDuration = 4000; // 4 seconds
    }
    
    update(game) {
        this.checkAchievements(game);
        this.updateNotification();
    }
    
    checkAchievements(game) {
        for (let achievement of this.achievements) {
            if (!achievement.unlocked && achievement.condition(game)) {
                this.unlockAchievement(achievement);
            }
        }
    }
    
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        this.newlyUnlocked.push(achievement);
        this.notificationTime = millis();
        
        console.log(`Achievement unlocked: ${achievement.name}`);
        
        // Play achievement sound if available
        if (typeof playSound === 'function') {
            playSound('achievement');
        }
    }
    
    updateNotification() {
        // Remove old notifications
        if (this.newlyUnlocked.length > 0 && millis() - this.notificationTime > this.notificationDuration) {
            this.newlyUnlocked.shift();
            if (this.newlyUnlocked.length > 0) {
                this.notificationTime = millis(); // Show next achievement
            }
        }
    }
    
    draw() {
        if (this.newlyUnlocked.length > 0) {
            let achievement = this.newlyUnlocked[0];
            this.drawAchievementNotification(achievement);
        }
    }
    
    drawAchievementNotification(achievement) {
        push();
        
        let x = width - 300;
        let y = 50;
        let w = 280;
        let h = 80;
        
        // Background with slide-in animation
        let progress = constrain((millis() - this.notificationTime) / 500, 0, 1);
        let slideOffset = (1 - progress) * 100;
        
        fill(0, 0, 0, 200);
        stroke(255, 215, 0);
        strokeWeight(3);
        rect(x - slideOffset, y, w, h, 10);
        
        // Achievement icon
        textAlign(LEFT, CENTER);
        textSize(24);
        text(achievement.icon, x + 10 - slideOffset, y + h/2);
        
        // Achievement text
        fill(255, 215, 0);
        textSize(14);
        text(achievement.name, x + 45 - slideOffset, y + 25);
        
        fill(255);
        textSize(10);
        text(achievement.description, x + 45 - slideOffset, y + 50);
        
        // "NEW!" text
        fill(255, 100, 100);
        textSize(12);
        text("新!", x + 200 - slideOffset, y + 20);
        
        pop();
    }
    
    getUnlockedCount() {
        return this.achievements.filter(a => a.unlocked).length;
    }
    
    getTotalCount() {
        return this.achievements.length;
    }
    
    drawAchievementsMenu() {
        push();
        
        // Background
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);
        
        // Title
        fill(255, 215, 0);
        textAlign(CENTER, TOP);
        textSize(32);
        text("成就", width/2, 50);

        // Progress
        fill(255);
        textSize(16);
        text(`${this.getUnlockedCount()}/${this.getTotalCount()} 已解锁`, width/2, 90);
        
        // Achievements grid
        let cols = 3;
        let rows = 4;
        let startX = 100;
        let startY = 140;
        let cellW = 200;
        let cellH = 120;
        
        for (let i = 0; i < this.achievements.length; i++) {
            let col = i % cols;
            let row = floor(i / cols);
            
            let x = startX + col * cellW;
            let y = startY + row * cellH;
            
            let achievement = this.achievements[i];
            
            // Background
            if (achievement.unlocked) {
                fill(0, 100, 0, 150);
            } else {
                fill(50, 50, 50, 150);
            }
            stroke(achievement.unlocked ? 0 : 255);
            strokeWeight(2);
            rect(x, y, cellW - 10, cellH - 10, 8);
            
            // Icon
            textAlign(CENTER, CENTER);
            textSize(32);
            text(achievement.icon, x + 30, y + 25);
            
            // Name
            fill(achievement.unlocked ? color(255, 215, 0) : 150);
            textSize(12);
            textAlign(LEFT, TOP);
            text(achievement.name, x + 60, y + 10);
            
            // Description
            fill(achievement.unlocked ? 255 : 150);
            textSize(10);
            text(achievement.description, x + 60, y + 35, 120, 60);
            
            // Lock indicator
            if (!achievement.unlocked) {
                fill(255, 0, 0);
                textSize(14);
                text("🔒", x + cellW - 30, y + 10);
            }
        }
        
        // Close instruction
        fill(255);
        textSize(14);
        textAlign(CENTER, BOTTOM);
        text("按 ESC 关闭", width/2, height - 30);
        
        pop();
    }
}