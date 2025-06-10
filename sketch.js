let player;
let enemies = [];
const ENEMY_SPAWN_INTERVAL = 2000;
let lastEnemySpawnTime = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver', 'talentSelection', 'shop'

// Portal
let portalPosition = { x: null, y: null, active: false };
const PORTAL_SIZE = 50;
let shopOfferItem = null;

// Wave management
let currentWave = 1;
let enemiesPerWave = 5;
let enemiesSpawnedThisWave = 0;
let enemiesDefeatedThisWave = 0;

// Boss management
let isBossBattleActive = false;
const BOSS_APPEARS_WAVE = 3;
let currentBoss = null;

// Talent System
const allTalents = [
    { id: 'hp_boost', name: "+2 最大生命值", description: "最大生命值增加2.", apply: (p) => { p.maxHealth += 2; p.health += 2; } },
    { id: 'speed_boost', name: "+0.5 速度", description: "提高移动速度.", apply: (p) => { p.speed += 0.5; } },
    { id: 'firerate_boost', name: "-20% 射速", description: "提高射击速度（减少延迟）.", apply: (p) => { p.fireRate *= 0.8; } },
    { id: 'damage_boost', name: "+1 子弹伤害", description: "你的子弹造成更多伤害.", apply: (p) => { p.projectileDamage += 1; } },
    { id: 'dash_cooldown', name: "-20% 冲刺冷却", description: "减少冲刺冷却时间.", apply: (p) => { p.dashCooldown *= 0.8; } }
];
let offeredTalents = [];
let talentButtonHeight = 50;
let talentButtonSpacing = 20;

// Shop UI Button Dimenstions (Example Values)
const shopButtonWidth = 200;
const shopButtonHeight = 50;
const shopButtonSpacing = 20;
let takeItemButton = { x: 0, y: 0, width: shopButtonWidth, height: shopButtonHeight, text: "Take Item (Free)" };
let refreshItemsButton = { x: 0, y: 0, width: shopButtonWidth, height: shopButtonHeight, text: "Refresh Items (10G)" };
let nextWaveButton = { x: 0, y: 0, width: shopButtonWidth, height: shopButtonHeight, text: "Next Wave" };
let shopInventory = [];
const MAX_SHOP_ITEMS = 3; // Number of items to display for purchase
let buyItemButtons = []; // To store dynamic buy buttons
const REFRESH_COST = 10;

// Item System
class Item {
    constructor(id, name, description, applyEffect, rarity) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.applyEffect = applyEffect; // This will be a function
        this.rarity = rarity; // 'common', 'rare', 'legendary'
    }
}

const allItems = [
    new Item('health_potion', 'Health Potion', 'Restores 5 HP.', (player) => { player.health = min(player.maxHealth, player.health + 5); }, 'common'),
    new Item('damage_shard', 'Damage Shard', 'Increases projectile damage by 1.', (player) => { player.projectileDamage += 1; }, 'rare'),
    new Item('speed_crystal', 'Speed Crystal', 'Increases player speed by 0.5.', (player) => { player.speed += 0.5; }, 'rare'),
    new Item('gold_magnet', 'Gold Magnet', 'Increases gold from enemies (NYI).', (player) => { /* player.goldBonus += 0.1; */ console.log("Gold Magnet effect (NYI)"); }, 'legendary')
    // NYI: Not Yet Implemented for gold bonus part.
];


function setup() {
    createCanvas(800, 600);
    player = new Player(width / 2, height / 2); // Player must be created before resetGame
    resetGame();
}

function resetGame() {
    // Player stats that can be modified by talents
    player.speed = 3;
    player.fireRate = 250; // ms per shot
    player.projectileDamage = 1;
    player.maxHealth = 10;
    player.dashCooldown = 1000;
    // Other player stats from constructor (not directly talent modified but reset for consistency)
    player.dashSpeed = 10;
    player.dashDuration = 150;

    // Core player state
    player.health = player.maxHealth;
    player.x = width / 2;
    player.y = height / 2;
    player.projectiles = [];
    player.level = 1;
    player.xp = 0;
    player.xpToNextLevel = 10;
    player.lastShotTime = 0;
    player.inventory = []; // Clear inventory
    player.gold = 0;       // Reset gold

    shopInventory = [];    // Clear shop inventory on reset
    buyItemButtons = [];   // Clear buy buttons

    enemies = [];
    currentWave = 1;
    enemiesPerWave = 5;
    enemiesSpawnedThisWave = 0;
    enemiesDefeatedThisWave = 0;
    lastEnemySpawnTime = millis();

    isBossBattleActive = false;
    currentBoss = null;
    if (currentBoss && currentBoss.projectiles) currentBoss.projectiles = []; // Clear boss projectiles if any linger

    portalPosition.active = false; // Deactivate portal on reset
    shopOfferItem = null; // Clear shop offer

    offeredTalents = []; // Clear any talents from previous game
    // gameState = 'start'; // This is usually set by the caller of resetGame
}

function draw() {
    background(220);

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        runGame();
    } else if (gameState === 'gameOver') {
        drawGameOverScreen();
    } else if (gameState === 'talentSelection') {
        drawTalentSelectionScreen();
    } else if (gameState === 'shop') {
        drawShopScreen();
    }
}

function drawStartScreen() {
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(0);
    text("肉鸽射击", width / 2, height / 3);
    textSize(24);
    text("点击开始", width / 2, height / 2);
}

function runGame() {
    player.display(); // Player display first
    player.update(enemies, currentBoss); // Player update handles its movement and projectile logic

    if (isBossBattleActive) {
        if (currentBoss) {
            currentBoss.update(player);
            currentBoss.display();

            if (currentBoss.health <= 0) {
                player.gainXP(currentBoss.xpValue);
                // Boss defeat gold handled in Boss.takeDamage
                portalPosition.x = currentBoss.x; // Store boss death location
                portalPosition.y = currentBoss.y;
                portalPosition.active = true;
                shopOfferItem = currentBoss.getDroppedItem(); // Determine item for the shop
                populateShopItems(); // Populate general shop items when portal opens

                isBossBattleActive = false;
                // currentBoss = null; // Keep currentBoss for its position until portal is used or next wave starts
                // Don't immediately advance wave or clear boss until portal is handled or new wave starts explicitly
                console.log("Boss defeated! Portal appears. Item offered: " + (shopOfferItem ? shopOfferItem.name : "None"));
                // Wave advancement will now happen after shop or if portal is ignored.
            }
        }
    } else if (portalPosition.active) { // If portal is active, don't spawn/manage other enemies
        // Player can move towards portal
    }
    else { // Regular wave logic (No boss, no portal)
        // Enemy Spawning Logic
        if (enemiesSpawnedThisWave < enemiesPerWave && millis() - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
            spawnEnemy();
        }

        // Update and display regular enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(player); // Enemy update handles its movement, attacks, and projectile logic
            enemies[i].display();

            // Player-Enemy direct collision (melee)
            if (dist(player.x, player.y, enemies[i].x, enemies[i].y) < player.size / 2 + enemies[i].size / 2) {
                player.takeDamage(1); // Player takes 1 melee damage
                enemies[i].health = 0; // Enemy destroyed on collision
            }

            // Enemy defeat gold handled in Enemy.takeDamage
            if (enemies[i].health <= 0) {
                // player.gainXP(enemies[i].xpValue); // XP gain is now in Enemy.takeDamage
                enemies.splice(i, 1);
                enemiesDefeatedThisWave++;
            }
        }

        // Wave Transition Logic / Boss Trigger
        if (enemiesSpawnedThisWave >= enemiesPerWave && enemiesDefeatedThisWave >= enemiesPerWave && enemies.length === 0) {
            if (currentWave === BOSS_APPEARS_WAVE - 1) {
                isBossBattleActive = true;
                enemiesSpawnedThisWave = 0;
                enemiesDefeatedThisWave = 0;
                currentBoss = new Boss(width / 2, 120);
                console.log("BOSS INCOMING!");
                enemies = [];
            } else {
                currentWave++;
                enemiesPerWave += 2;
                enemiesSpawnedThisWave = 0;
                enemiesDefeatedThisWave = 0;
                lastEnemySpawnTime = millis();
                console.log("Starting Wave: " + currentWave);
                 // Potentially offer talents between normal waves too if desired
                // player.levelUp(); // For testing talent screen
            }
        }
    }

    // Portal Display
    if (portalPosition.active) {
        fill(150, 0, 255, 150); // Purple, semi-transparent
        ellipse(portalPosition.x, portalPosition.y, PORTAL_SIZE, PORTAL_SIZE);
        fill(255);
        textAlign(CENTER, CENTER);
        text("Shop", portalPosition.x, portalPosition.y);
    }

    // HUD Display
    fill(0); textSize(16); textAlign(LEFT, TOP);
    text("生命值: " + player.health + "/" + player.maxHealth, 10, 10);
    text("等级: " + player.level, 10, 30);
    let xpBarWidth = 100;
    fill(150); rect(10, 50, xpBarWidth, 10);
    fill(0,255,0); rect(10, 50, constrain(map(player.xp, 0, player.xpToNextLevel, 0, xpBarWidth),0,xpBarWidth), 10);
    text("经验值: " + player.xp + "/" + player.xpToNextLevel, 10 + xpBarWidth + 5, 50 + 5);
    text("金币: " + player.gold, 10, 70); // Display Gold

    if (!isBossBattleActive) {
        text("波次: " + currentWave, width - 150, 10);
        text("敌人: " + (enemiesPerWave - enemiesDefeatedThisWave), width - 150, 30);
    } else if (currentBoss) {
        text("BOSS 战！", width - 150, 10);
    }

    // Check for game over state from player health
    if (player.health <= 0 && gameState !== 'gameOver') {
        gameState = 'gameOver';
    }

    // Player-Portal Interaction
    if (portalPosition.active && dist(player.x, player.y, portalPosition.x, portalPosition.y) < player.size / 2 + PORTAL_SIZE / 2) {
        gameState = 'shop';
        portalPosition.active = false;
        // populateShopItems(); // Moved to when portal opens, so items are ready before shop screen draws
        // currentBoss = null;
        console.log("Entering shop...");
    }
}


function populateShopItems() {
    shopInventory = [];
    buyItemButtons = []; // Clear old buttons

    let availableForShop = allItems.filter(item => item.rarity !== 'legendary'); // Exclude legendary, or make very rare & expensive
    if (shopOfferItem) { // Temporarily exclude the free offer item from being re-rolled in general shop
        availableForShop = availableForShop.filter(item => item.id !== shopOfferItem.id);
    }


    for (let i = 0; i < MAX_SHOP_ITEMS; i++) {
        if (availableForShop.length === 0) break;

        let randomIndex = floor(random(availableForShop.length));
        let templateItem = availableForShop[randomIndex];

        // Create a new object to avoid modifying allItems directly with cost
        let shopItemInstance = { ...templateItem };

        // Assign cost based on rarity (example costs)
        if (shopItemInstance.rarity === 'common') {
            shopItemInstance.cost = floor(random(5, 11)); // e.g. 5-10 gold
        } else if (shopItemInstance.rarity === 'rare') {
            shopItemInstance.cost = floor(random(15, 26)); // e.g. 15-25 gold
        } else { // Should not happen if legendary are filtered
            shopItemInstance.cost = 50;
        }

        shopInventory.push(shopItemInstance);
        availableForShop.splice(randomIndex, 1); // Remove to avoid duplicates in the same shop roll

        // Prepare button structure (positions will be set in drawShopScreen)
        buyItemButtons.push({
            itemIndex: i, // To link button to shopInventory item
            x: 0, y: 0, width: shopButtonWidth * 0.6, height: shopButtonHeight * 0.8,
            text: "Buy (" + shopItemInstance.cost + "G)"
        });
    }
    console.log("Shop populated with " + shopInventory.length + " items.");
}

function generateOfferedTalents() {
    offeredTalents = [];
    let availableTalents = [...allTalents];
    for (let i = 0; i < 3; i++) {
        if (availableTalents.length === 0) break;
        let randomIndex = floor(random(availableTalents.length));
        offeredTalents.push(availableTalents[randomIndex]);
        availableTalents.splice(randomIndex, 1);
    }
}

function drawTalentSelectionScreen() {
    textAlign(CENTER, CENTER);
    textSize(32);
    fill(0);
    text("升级！选择一个天赋：", width / 2, height / 4);

    for (let i = 0; i < offeredTalents.length; i++) {
        let talent = offeredTalents[i];
        let yPos = height / 2 + i * (talentButtonHeight + talentButtonSpacing) - (talentButtonHeight + talentButtonSpacing);

        fill(200);
        stroke(0);
        rectMode(CENTER);
        rect(width / 2, yPos, width * 0.6, talentButtonHeight);

        fill(0);
        noStroke();
        textSize(18);
        text(talent.name, width / 2, yPos - 10);
        textSize(14);
        text(talent.description, width/2, yPos + 10);
    }
    rectMode(CORNER); // Reset rectMode
}

function drawShopScreen() {
    background(200, 220, 255); // Light blue background for shop
    textAlign(CENTER, CENTER);

    // Title
    textSize(48);
    fill(0);
    text("Item Shop", width / 2, 70);

    // Gold Display
    textSize(24);
    fill(50, 50, 0); // Dark gold color
    textAlign(RIGHT, TOP);
    text("Gold: " + player.gold, width - 20, 20);
    textAlign(CENTER, CENTER); // Reset alignment

    let currentY = 150;

    // Display Offered Item (from Boss)
    if (shopOfferItem) {
        fill(255);
        stroke(0);
        rectMode(CENTER);
        rect(width / 2, currentY, width * 0.7, 100); // Item display box

        fill(0);
        noStroke();
        textSize(22);
        text(shopOfferItem.name + " (" + shopOfferItem.rarity + ")", width / 2, currentY - 25);
        textSize(16);
        text(shopOfferItem.description, width / 2, currentY + 5);

        // "Take Item" Button
        takeItemButton.x = width / 2;
        takeItemButton.y = currentY + 75;
        fill(180, 255, 180); // Light green
        stroke(0);
        rectMode(CENTER);
        rect(takeItemButton.x, takeItemButton.y, takeItemButton.width, takeItemButton.height);
        fill(0);
        noStroke();
        textSize(18);
        text(takeItemButton.text, takeItemButton.x, takeItemButton.y);
        currentY += 100 + shopButtonSpacing + shopButtonHeight; // Move Y for next section
    } else {
        textSize(20);
        fill(100);
        text("The special item has been taken.", width / 2, currentY + 50);
        currentY += 100 + shopButtonSpacing;
    }


    // General Shop Items Area
    currentY += shopButtonSpacing; // Add some space before general items

    for (let i = 0; i < shopInventory.length; i++) {
        let item = shopInventory[i];
        if (!item) continue; // Should not happen if populated correctly and not "sold" by nulling

        let itemBoxY = currentY + 60;
        fill(240, 240, 240); // Light grey box for each item
        stroke(100);
        rectMode(CENTER);
        rect(width / 2, itemBoxY, width * 0.75, 80);

        fill(0);
        noStroke();
        textSize(18);
        textAlign(LEFT, CENTER);
        text(item.name + " (" + item.rarity + ")", width / 2 - width * 0.35, itemBoxY - 15);
        textSize(14);
        text(item.description, width / 2 - width * 0.35, itemBoxY + 10);
        textAlign(CENTER, CENTER); // Reset

        // Buy Button for this item
        let btn = buyItemButtons[i];
        btn.x = width / 2 + width * 0.25; // Position button to the right of item info
        btn.y = itemBoxY;

        fill(180, 220, 255); // Light blue for buy buttons
        stroke(0);
        rectMode(CENTER);
        rect(btn.x, btn.y, btn.width, btn.height);
        fill(0);
        noStroke();
        textSize(16);
        text(btn.text, btn.x, btn.y);

        currentY += 80 + shopButtonSpacing; // Increment Y for next item
    }
    if (shopInventory.length === 0 && !shopOfferItem) { // Only if no free item and no purchasable items
        textSize(20);
        fill(100);
        text("Shop is currently empty. Try refreshing!", width / 2, currentY + 50);
         currentY += 80 + shopButtonSpacing;
    }


    // Bottom Buttons
    // "Refresh Items" Button
    refreshItemsButton.x = width / 2 - shopButtonWidth / 2 - shopButtonSpacing / 2;
    refreshItemsButton.y = height - 80;
    fill(200, 200, 255); // Light purple
    stroke(0);
    rectMode(CENTER);
    rect(refreshItemsButton.x, refreshItemsButton.y, refreshItemsButton.width, refreshItemsButton.height);
    fill(0);
    noStroke();
    textSize(18);
    text(refreshItemsButton.text, refreshItemsButton.x, refreshItemsButton.y);

    // "Next Wave" Button
    nextWaveButton.x = width / 2 + shopButtonWidth / 2 + shopButtonSpacing / 2;
    nextWaveButton.y = height - 80;
    fill(255, 200, 200); // Light red
    stroke(0);
    rectMode(CENTER);
    rect(nextWaveButton.x, nextWaveButton.y, nextWaveButton.width, nextWaveButton.height);
    fill(0);
    noStroke();
    textSize(18);
    text(nextWaveButton.text, nextWaveButton.x, nextWaveButton.y);

    rectMode(CORNER); // Reset rectMode
}


function drawGameOverScreen() {
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(255, 0, 0);
    text("游戏结束", width / 2, height / 3);
    textSize(24);
    fill(0);
    let message = "你到达了 ";
    if (isBossBattleActive || currentWave >= BOSS_APPEARS_WAVE) { // Adjusted logic slightly
        message += "Boss 波次 " + (BOSS_APPEARS_WAVE -1) +"!";
    } else {
        message += "波次 " + currentWave +".";
    }
    text(message, width/2, height/2);
    text("最终等级: " + player.level, width/2, height/2 + 30);
    text("点击重新开始", width / 2, height / 2 + 70);
}

function mousePressed() {
    if (gameState === 'start') {
        resetGame();
        gameState = 'playing';
    } else if (gameState === 'playing') {
        if (mouseButton === LEFT) {
            player.shoot();
        }
    } else if (gameState === 'gameOver') {
        resetGame();
        gameState = 'start';
    } else if (gameState === 'talentSelection') {
        for (let i = 0; i < offeredTalents.length; i++) {
            let talent = offeredTalents[i];
            let btnY = height / 2 + i * (talentButtonHeight + talentButtonSpacing) - (talentButtonHeight + talentButtonSpacing);
            let btnX = width / 2;
            let btnWidth = width * 0.6;

            if (mouseX > btnX - btnWidth / 2 && mouseX < btnX + btnWidth / 2 &&
                mouseY > btnY - talentButtonHeight / 2 && mouseY < btnY + talentButtonHeight / 2) {
                talent.apply(player);
                console.log("Talent selected: " + talent.name);
                offeredTalents = []; // Clear offers
                gameState = 'playing';
                break;
            }
        }
    } else if (gameState === 'shop') {
        // "Take Item" Button
        if (shopOfferItem && mouseX > takeItemButton.x - takeItemButton.width / 2 && mouseX < takeItemButton.x + takeItemButton.width / 2 &&
            mouseY > takeItemButton.y - takeItemButton.height / 2 && mouseY < takeItemButton.y + takeItemButton.height / 2) {
            player.addItem(shopOfferItem);
            shopOfferItem = null; // Item taken
            console.log("Took boss item.");
            return; // Prevent other button clicks in same press
        }

        // "Refresh Items" Button
        if (mouseX > refreshItemsButton.x - refreshItemsButton.width / 2 && mouseX < refreshItemsButton.x + refreshItemsButton.width / 2 &&
            mouseY > refreshItemsButton.y - refreshItemsButton.height / 2 && mouseY < refreshItemsButton.y + refreshItemsButton.height / 2) {
            if (player.gold >= REFRESH_COST) {
                player.gold -= REFRESH_COST;
                populateShopItems();
                console.log("Items refreshed. Gold: " + player.gold);
            } else {
                console.log("Not enough gold to refresh!");
                // TODO: Display message on screen
            }
            return;
        }

        // "Next Wave" Button
        if (mouseX > nextWaveButton.x - nextWaveButton.width / 2 && mouseX < nextWaveButton.x + nextWaveButton.width / 2 &&
            mouseY > nextWaveButton.y - nextWaveButton.height / 2 && mouseY < nextWaveButton.y + nextWaveButton.height / 2) {

            currentBoss = null;
            currentWave++;
            enemiesPerWave += 3;
            enemiesSpawnedThisWave = 0;
            enemiesDefeatedThisWave = 0;
            lastEnemySpawnTime = millis();
            gameState = 'playing';
            shopInventory = []; // Clear shop inventory
            buyItemButtons = []; // Clear buy buttons
            // shopOfferItem is already null or handled by "Take Item"
            console.log("Exiting shop. Proceeding to wave " + currentWave);
            return;
        }

        // Buy Item Buttons for shopInventory
        for (let i = 0; i < buyItemButtons.length; i++) {
            let btn = buyItemButtons[i];
            let item = shopInventory[i]; // shopInventory items might be marked sold (e.g. set to null)

            if (item && mouseX > btn.x - btn.width / 2 && mouseX < btn.x + btn.width / 2 &&
                mouseY > btn.y - btn.height / 2 && mouseY < btn.y + btn.height / 2) {

                if (player.gold >= item.cost) {
                    player.gold -= item.cost;
                    player.addItem(item); // Add the actual item object
                    console.log("Bought: " + item.name + " for " + item.cost + " gold. Player gold: " + player.gold);
                    shopInventory.splice(i, 1); // Remove item from shop
                    buyItemButtons.splice(i, 1); // Remove corresponding button
                    // Adjust itemIndex for subsequent buttons if needed, or simply re-evaluate buttons in draw
                } else {
                    console.log("Not enough gold to buy " + item.name);
                    // TODO: Display message on screen
                }
                return; // Process one click at a time
            }
        }
    }
}

function keyPressed() {
    if (gameState === 'playing') {
        if (keyCode === 32) { // Spacebar for Dash
            player.attemptDash();
        }
        if (keyCode === 73) { // 'I' key for testing item add
            if (allItems.length > 0) {
                let randomItem = random(allItems);
                player.addItem(randomItem);
            }
        }
    }
    // Removed 'C' key logic for shop, now handled by mousePressed on "Next Wave" button
}

function spawnEnemy() {
    if (enemiesSpawnedThisWave >= enemiesPerWave || isBossBattleActive) return;

    let edge = floor(random(4));
    let x, y;
    let size = random(20,35);
    if (edge === 0) { x = random(width); y = 0 - size / 2; }
    else if (edge === 1) { x = random(width); y = height + size / 2; }
    else if (edge === 2) { x = 0 - size / 2; y = random(height); }
    else { x = width + size / 2; y = random(height); }

    enemies.push(new Enemy(x, y, currentWave));
    enemiesSpawnedThisWave++;
    lastEnemySpawnTime = millis();
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        // Stats that will be reset by resetGame and potentially modified by talents
        this.speed = 3;
        this.fireRate = 250; // ms per shot
        this.projectileDamage = 1;
        this.maxHealth = 10;
        this.dashCooldown = 1000;
        this.dashSpeed = 10;
        this.dashDuration = 150;

        // Core state
        this.health = this.maxHealth;
        this.projectiles = [];
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 10;
        this.lastShotTime = 0;
        this.isDashing = false;
        this.lastDashTime = -this.dashCooldown;
        this.dashEndTime = 0;

        // Item related
        this.inventory = [];
        this.gold = 0;
    }

    addItem(item) {
        if (this.inventory.length < 10) { // Max 10 items for example
            this.inventory.push(item);
            item.applyEffect(this); // Apply effect immediately
            console.log("Picked up: " + item.name);
        } else {
            console.log("Inventory full!");
        }
    }

    gainXP(amount) {
        this.xp += amount;
        console.log("Gained " + amount + " XP. Total XP: " + this.xp);
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel; // Carry over excess XP
        if (this.xp < 0) this.xp = 0;
        this.xpToNextLevel = floor(this.xpToNextLevel * 1.5); // Increase XP for next level
        console.log("Level Up! Level: " + this.level + ", XP to next: " + this.xpToNextLevel);
        generateOfferedTalents();
        gameState = 'talentSelection';
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        // Could add invulnerability frames here
    }

    shoot() {
        if (millis() - this.lastShotTime > this.fireRate) {
            let angle = atan2(mouseY - this.y, mouseX - this.x);
            // type 'player', damage, color, speed, size
            this.projectiles.push(new Projectile(this.x, this.y, angle, 'player', this.projectileDamage, color(0, 150, 255), 7, 5));
            this.lastShotTime = millis();
        }
    }

    update(currentEnemies, boss) {
        if (this.isDashing) {
            if (millis() > this.dashEndTime) this.isDashing = false;
        } else {
            this.move();
        }
        this.aim();

        // Player Projectile Logic
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            p.display();
            let projectileHit = false;

            if (boss && isBossBattleActive) {
               if (dist(p.x, p.y, boss.x, boss.y) < p.size / 2 + boss.size / 2) {
                   boss.takeDamage(p.damage);
                   this.projectiles.splice(i, 1);
                   projectileHit = true;
               }
            } else if (!isBossBattleActive) {
                for (let j = currentEnemies.length - 1; j >= 0; j--) {
                    let enemy = currentEnemies[j];
                    if (dist(p.x, p.y, enemy.x, enemy.y) < p.size / 2 + enemy.size / 2) {
                        enemy.takeDamage(p.damage);
                        this.projectiles.splice(i, 1);
                        projectileHit = true;
                        break;
                    }
                }
            }

            if (!projectileHit && p.isOffScreen()) {
                this.projectiles.splice(i, 1);
            }
        }
    }


    move() {
        if (keyIsDown(87)) { this.y -= this.speed; } // W
        if (keyIsDown(83)) { this.y += this.speed; } // S
        if (keyIsDown(65)) { this.x -= this.speed; } // A
        if (keyIsDown(68)) { this.x += this.speed; } // D
        this.x = constrain(this.x, this.size / 2, width - this.size / 2);
        this.y = constrain(this.y, this.size / 2, height - this.size / 2);
    }

    aim() { /* Implicit via mouse */ }

    attemptDash() {
        if (millis() - this.lastDashTime > this.dashCooldown && !this.isDashing) {
            this.isDashing = true;
            this.lastDashTime = millis();
            this.dashEndTime = millis() + this.dashDuration;
            let angle = atan2(mouseY - this.y, mouseX - this.x);
            let dashDistance = this.dashSpeed * 5;
            this.x += cos(angle) * dashDistance;
            this.y += sin(angle) * dashDistance;
            this.x = constrain(this.x, this.size / 2, width - this.size / 2);
            this.y = constrain(this.y, this.size / 2, height - this.size / 2);
        }
    }

    display() {
        fill(50, 150, 250);
        ellipse(this.x, this.y, this.size, this.size);
        let angle = atan2(mouseY - this.y, mouseX - this.x);
        push();
        translate(this.x, this.y);
        rotate(angle);
        stroke(0);
        line(0, 0, this.size / 2 + 10, 0);
        pop();
    }
}

class Projectile {
    constructor(x, y, angle, type, damage, pColor, speed, size) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.type = type; // 'player', 'enemy', 'boss'
        this.damage = damage;
        this.pColor = pColor;
        this.speed = speed;
        this.size = size;
    }
    update() {
        this.x += cos(this.angle) * this.speed;
        this.y += sin(this.angle) * this.speed;
    }
    display() {
        fill(this.pColor);
        noStroke();
        ellipse(this.x, this.y, this.size, this.size);
    }
    isOffScreen() {
        return (this.x < -this.size || this.x > width + this.size || this.y < -this.size || this.y > height + this.size);
    }
}

class Enemy {
    constructor(x, y, wave = 1) {
        this.x = x;
        this.y = y;
        this.size = random(20, 35);

        this.speed = random(0.5, 1.2) + (wave-1) * 0.05; // Slight increase per wave
        this.health = floor(random(2, 4)) + floor((wave-1) * 0.5); // Slight increase per wave
        this.xpValue = 5 + (wave-1); // More XP for later wave enemies
        this.goldValue = floor(random(1, 3)) + floor(wave / 2); // e.g. 1-2 base, +1 every 2 waves

        this.attackCooldown = 2500 - (wave-1)*50; // Attack slightly faster in later waves
        if (this.attackCooldown < 1000) this.attackCooldown = 1000;
        this.lastAttackTime = millis() + random(-500, 500); // Stagger initial attacks
        this.projectileDamage = 1 + floor((wave-1)*0.2);

        this.projectiles = [];

        let r = map(this.health, 2, 6, 100, 200);
        let g = map(this.speed, 0.5, 2, 200, 50);
        let b = map(this.size, 20, 35, 50, 150);
        this.color = color(r, g, b, 220);
    }

    shootAttack(player) {
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        // type 'enemy', damage, color, speed, size
        this.projectiles.push(new Projectile(this.x, this.y, angleToPlayer, 'enemy', this.projectileDamage, color(255,200,0), 3, 8));
    }

    update(player) {
        this.moveTowardsPlayer(player);

        if (millis() - this.lastAttackTime > this.attackCooldown) {
            this.shootAttack(player);
            this.lastAttackTime = millis();
        }

        // Enemy Projectile Logic
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            p.display();
            if (dist(player.x, player.y, p.x, p.y) < player.size / 2 + p.size / 2) {
                player.takeDamage(p.damage);
                this.projectiles.splice(i, 1);
                // No direct game over check here, runGame loop handles it
            } else if (p.isOffScreen()) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    moveTowardsPlayer(player) {
        let angle = atan2(player.y - this.y, player.x - this.x);
        this.x += cos(angle) * this.speed;
        this.y += sin(angle) * this.speed;
    }
    display() {
        fill(this.color);
        stroke(0);
        ellipse(this.x, this.y, this.size, this.size);
    }
    takeDamage(amount) { // Called by player projectiles
        this.health -= amount;
        if (this.health <= 0) {
            player.gainXP(this.xpValue); // Grant XP from here
            player.gold += this.goldValue;
            console.log("Enemy defeated. Player gold: " + player.gold);
            // The enemy object will be spliced from enemies array in runGame loop
        }
    }
}

class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 70;
        this.speed = 0.6;
        this.health = 60 + (currentWave - (BOSS_APPEARS_WAVE -1)) * 10; // Scale health if re-appears
        this.maxHealth = this.health;
        this.color = color(80, 0, 120);

        this.attackCooldown = 1500;
        this.lastAttackTime = millis();
        this.projectiles = []; // Renamed from bossProjectiles for consistency
        this.xpValue = 50;
        this.projectileDamage = 2 + floor((currentWave - (BOSS_APPEARS_WAVE -1))*0.5);
        this.goldValue = 25 + floor((currentWave - (BOSS_APPEARS_WAVE -1))*5); // e.g. 25 base, +5 per boss cycle
    }

    getDroppedItem() {
        const rareItems = allItems.filter(item => item.rarity === 'rare' || item.rarity === 'legendary');
        if (rareItems.length > 0) {
            return random(rareItems);
        }
        return null; // Should not happen if allItems is populated correctly
    }

    update(player) {
        this.move(player);
        if (millis() - this.lastAttackTime > this.attackCooldown) {
            this.shootAttack(player);
            this.lastAttackTime = millis();
        }

        // Boss Projectile Logic
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.update();
            p.display();

            if (dist(player.x, player.y, p.x, p.y) < player.size/2 + p.size/2) {
                player.takeDamage(p.damage);
                this.projectiles.splice(i,1);
            } else if (p.isOffScreen()) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    move(player) {
        let targetX = player.x;
        if (abs(this.x - targetX) > 50) {
             if (this.x < targetX) this.x += this.speed;
             if (this.x > targetX) this.x -= this.speed;
        }
        this.y += sin(millis() / 500) * 0.3;
        this.x = constrain(this.x, this.size/2, width - this.size/2);
        this.y = constrain(this.y, this.size/2, height/2);
    }

    shootAttack(player) {
        let angleToPlayer = atan2(player.y - this.y, player.x - this.x);
        for (let i = -1; i <= 1; i++) {
            let currentAngle = angleToPlayer + (i * PI / 12);
            // type 'boss', damage, color, speed, size
            this.projectiles.push(new Projectile(this.x, this.y, currentAngle, 'boss', this.projectileDamage, color(255, 100, 0), 4, 10));
        }
    }

    takeDamage(amount) { // Called by player projectiles
        this.health -= amount;
        if (this.health <= 0) {
            // XP is granted in runGame for boss, gold can be granted here or there.
            // For consistency with Enemy, let's add it here.
            player.gold += this.goldValue;
            console.log("Boss defeated. Player gold: " + player.gold);
            // Other boss defeat logic (portal, etc.) is in runGame
        }
    }

    display() {
        fill(this.color);
        stroke(0);
        rectMode(CENTER);
        rect(this.x, this.y, this.size, this.size);
        this.drawHealthBar();
        rectMode(CORNER);
    }

    drawHealthBar() {
        rectMode(CORNER);
        let barWidth = this.size * 1.5;
        let barHeight = 12;
        let xPos = this.x - barWidth / 2;
        let yPos = this.y - this.size / 2 - barHeight - 8;

        fill(50);
        rect(xPos, yPos, barWidth, barHeight);

        let currentHealthWidth = map(this.health, 0, this.maxHealth, 0, barWidth);
        if (currentHealthWidth < 0) currentHealthWidth = 0;
        fill(255,0,0);
        rect(xPos, yPos, currentHealthWidth, barHeight);

        noFill();
        stroke(0);
        rect(xPos, yPos, barWidth, barHeight);
    }
}
