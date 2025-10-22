// Wave management system for controlling enemy spawning and progression
class WaveManager {
    constructor() {
        this.currentWave = 1;
        this.enemiesPerWave = 5;
        this.enemiesSpawnedThisWave = 0;
        this.enemiesDefeatedThisWave = 0;
        this.lastEnemySpawnTime = 0;
        this.enemySpawnInterval = 2000; // 2 seconds between spawns
        this.waveStartTime = 0;
        this.isBossBattleActive = false;
        this.bossAppearsWave = 3;
        this.currentBoss = null;
    }

    update(enemies, player) {
        if (this.isBossBattleActive) {
            // Handle boss battle logic
            if (this.currentBoss && this.currentBoss.health <= 0) {
                this.completeBossBattle(player);
            }
            return;
        }

        // Spawn regular enemies
        if (this.shouldSpawnEnemy()) {
            this.spawnEnemy(enemies);
        }

        // Check wave completion
        if (this.isWaveComplete(enemies)) {
            this.completeWave(player);
        }
    }

    shouldSpawnEnemy() {
        return this.enemiesSpawnedThisWave < this.enemiesPerWave &&
               millis() - this.lastEnemySpawnTime > this.enemySpawnInterval;
    }

    spawnEnemy(enemies) {
        let spawnX = random(0, width);
        let spawnY = random(-50, -20);
        
        // Create different enemy types based on wave
        let enemyType = this.getEnemyType();
        let enemy = this.createEnemy(enemyType, spawnX, spawnY);
        
        enemies.push(enemy);
        this.enemiesSpawnedThisWave++;
        this.lastEnemySpawnTime = millis();
    }

    getEnemyType() {
        // Determine enemy type based on current wave
        if (this.currentWave === 1) return 'grunt';
        
        let rand = random();
        if (rand < 0.3) return 'grunt';
        else if (rand < 0.5) return 'alien';
        else if (rand < 0.7) return 'saucer';
        else if (rand < 0.85) return 'skull';
        else return 'robot';
    }

    createEnemy(type, x, y) {
        switch(type) {
            case 'grunt': return new GruntEnemy(x, y);
            case 'alien': return new AlienEnemy(x, y);
            case 'saucer': return new SaucerEnemy(x, y);
            case 'skull': return new SkullEnemy(x, y);
            case 'robot': return new RobotEnemy(x, y);
            default: return new GruntEnemy(x, y);
        }
    }

    isWaveComplete(enemies) {
        // Filter out boss minions when counting enemies
        let regularEnemies = enemies.filter(enemy => !(enemy instanceof BossMinion));
        return this.enemiesSpawnedThisWave >= this.enemiesPerWave && 
               regularEnemies.length === 0;
    }

    completeWave(player) {
        this.currentWave++;
        
        if (this.currentWave === this.bossAppearsWave) {
            this.startBossBattle(player);
        } else {
            this.startNextWave();
        }
    }

    startNextWave() {
        this.enemiesPerWave = Math.floor(5 + this.currentWave * 1.5);
        this.enemiesSpawnedThisWave = 0;
        this.enemiesDefeatedThisWave = 0;
        this.waveStartTime = millis();
        
        // Decrease spawn interval slightly each wave
        this.enemySpawnInterval = Math.max(1000, 2000 - (this.currentWave * 50));
    }

    startBossBattle(player) {
        this.isBossBattleActive = true;
        let bossVariants = ['standard', 'sweeper', 'summoner', 'beamer'];
        let variant = random(bossVariants);
        this.currentBoss = new Boss(width / 2, 100, variant);
        console.log(`Boss battle started! Wave ${this.currentWave}, Variant: ${variant}`);
    }

    completeBossBattle(player) {
        this.isBossBattleActive = false;
        
        // Boss XP reward
        player.gainXP(50 + (this.currentWave * 10));
        
        // Create portal for shop access or next area
        this.createPortal();
        
        // Reset for next set of waves
        this.bossAppearsWave += 3; // Next boss in 3 more waves
        this.currentBoss = null;
        
        console.log(`Boss defeated! Next boss at wave ${this.bossAppearsWave}`);
    }

    createPortal() {
        // Portal creation logic - this will be handled by the main game
        if (typeof game !== 'undefined' && game.createPortal) {
            game.createPortal(width / 2, height / 2);
        }
    }

    onEnemyDefeated() {
        this.enemiesDefeatedThisWave++;
    }

    getCurrentWave() {
        return this.currentWave;
    }

    getBoss() {
        return this.currentBoss;
    }

    isBossActive() {
        return this.isBossBattleActive && this.currentBoss && this.currentBoss.health > 0;
    }
}