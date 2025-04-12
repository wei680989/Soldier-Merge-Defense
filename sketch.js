// --- Game Configuration ---
const STARTING_GOLD = 80; // <<< MODIFIED as per user request
const MAX_LEVEL = 10;
const BASE_UNIT_MAX_LEVEL = 3;
const ADVANCED_UNIT_MAX_LEVEL = 3;
const BATTLEFIELD_Y_START = 150;
const BATTLEFIELD_HEIGHT = 350;
const SOLDIER_SPAWN_X = 80;
const MONSTER_SPAWN_X_OFFSET = 80;
const UNIT_RADIUS = 15;
const PREVIEW_X = 650; const PREVIEW_Y = 50;
const TOOLTIP_WIDTH = 160; const TOOLTIP_HEIGHT = 120;
const QUEST_TRIGGER_LEVEL = 4;
const NUM_QUESTS_TO_SHOW = 3;
const NUM_QUESTS_TO_CHOOSE = 1;
const NUM_ADVANCED_TO_UNLOCK = 2;
const ADVANCED_UNIT_BUY_LIMIT = 2;

// --- Game State ---
let gold; let currentLevel; let gamePhase;
let soldiers = []; let monsters = []; let draggedSoldier = null;
let monstersToSpawn = []; let nextWavePreview = [];
let nextWaveSpawnList = [];
let spawnTimer = 0; let spawnInterval = 85;
let buyButtons = []; let startButton;
let gameMessage = ""; let messageTimer = 0;
let totalMonstersKilled = 0; let totalSoldiersLost = 0;
let hoveredUnitInfo = null;
let availableQuests = []; let activeQuests = [];
let questRewardClaimed = false;
let pendingQuestReward = false;
let waveStartTime = 0;

// --- Asset Definitions --- (Applying User's Specific Adjustments)
const BASE_SOLDIER_TYPES = {
    axe: { name: "斧兵", cost: 6, baseHealth: 65, baseDamage: 7, attackSpeed: 50, range: 70, attackDistance: UNIT_RADIUS * 1.6, speed: 1.0, color: [0, 150, 0], upgradeMultiplier: 1.4, isMelee: true }, // Dmg/AS updated
    spear: { name: "長矛兵", cost: 8, baseHealth: 60, baseDamage: 6, attackSpeed: 55, range: 90, attackDistance: UNIT_RADIUS * 2.5, speed: 0.9, color: [100, 100, 0], upgradeMultiplier: 1.45, isMelee: true },  // Dmg/AS updated
    archer: { name: "弓箭手", cost: 12, baseHealth: 35, baseDamage: 6, attackSpeed: 65, range: 200, attackDistance: 200, speed: 0.7, color: [0, 0, 200], upgradeMultiplier: 1.5, isMelee: false },// Dmg/AS updated
    tank: { name: "坦克", cost: 15, baseHealth: 190, baseDamage: 5, attackSpeed: 75, range: 60, attackDistance: UNIT_RADIUS * 1.8, speed: 0.5, color: [100, 100, 120], upgradeMultiplier: 1.25, isMelee: true } // From previous balance
};
const ADVANCED_SOLDIER_TYPES = {
    berserker: { name: "狂戰士", unlocked: false, cost: 25, buyLimit: ADVANCED_UNIT_BUY_LIMIT, buyCount: 0, baseHealth: 220, baseDamage: 38, attackSpeed: 30, range: 80, attackDistance: UNIT_RADIUS * 1.8, speed: 1.2, color: [255, 50, 50], upgradeMultiplier: 1.9, isMelee: true },
    headhunter: { name: "獵頭者", unlocked: false, cost: 28, buyLimit: ADVANCED_UNIT_BUY_LIMIT, buyCount: 0, baseHealth: 160, baseDamage: 28, attackSpeed: 35, range: 75, attackDistance: UNIT_RADIUS * 1.7, speed: 1.4, color: [0, 200, 100], upgradeMultiplier: 2.0, isMelee: true },
    juggernaut: { name: "重裝兵", unlocked: false, cost: 40, buyLimit: ADVANCED_UNIT_BUY_LIMIT, buyCount: 0, baseHealth: 735, baseDamage: 22, attackSpeed: 70, range: 70, attackDistance: UNIT_RADIUS * 2.0, speed: 0.4, color: [80, 80, 80], upgradeMultiplier: 1.8, isMelee: true },
    marksman: { name: "神射手", unlocked: false, cost: 35, buyLimit: ADVANCED_UNIT_BUY_LIMIT, buyCount: 0, baseHealth: 110, baseDamage: 25, attackSpeed: 50, range: 300, attackDistance: 300, speed: 0.7, color: [100, 0, 255], upgradeMultiplier: 2.2, isMelee: false },
    phalanx: { name: "方陣兵", unlocked: false, cost: 32, buyLimit: ADVANCED_UNIT_BUY_LIMIT, buyCount: 0, baseHealth: 395, baseDamage: 20, attackSpeed: 58, range: 100, attackDistance: UNIT_RADIUS * 2.8, speed: 0.6, color: [180, 140, 0], upgradeMultiplier: 2.0, isMelee: true },
    bulwarkArcher: { name: "堡壘射手", unlocked: false, cost: 30, buyLimit: ADVANCED_UNIT_BUY_LIMIT, buyCount: 0, baseHealth: 225, baseDamage: 16, attackSpeed: 60, range: 220, attackDistance: 210, speed: 0.5, color: [50, 100, 180], upgradeMultiplier: 2.0, isMelee: false }
};
const mergeRecipes = [ { input: ['archer', 'axe'], output: 'headhunter' }, { input: ['archer', 'spear'], output: 'marksman' }, { input: ['archer', 'tank'], output: 'bulwarkArcher' }, { input: ['axe', 'spear'], output: 'berserker' }, { input: ['axe', 'tank'], output: 'juggernaut' }, { input: ['spear', 'tank'], output: 'phalanx' }, ];
// <<< MONSTER_TYPES with User's Adjustments >>>
const MONSTER_TYPES = {
    goblin: { name: "哥布林", baseHealth: 35, baseDamage: 6, attackSpeed: 60, range: 60, attackDistance: UNIT_RADIUS * 1.6, speed: 0.7, reward: 2, color: [200, 0, 0], isMelee: true }, // USER ADJUSTED
    goblinSpear: { name: "投矛哥布林", baseHealth: 50, baseDamage: 8, attackSpeed: 65, range: 150, attackDistance: 150, speed: 0.7, reward: 4, color: [220, 50, 0], isMelee: false }, // HP+, Dmg+, Reward same
    ogre: { name: "食人魔", baseHealth: 250, baseDamage: 25, attackSpeed: 75, range: 80, attackDistance: UNIT_RADIUS * 2.0, speed: 0.4, reward: 6, color: [100, 50, 0], isMelee: true },
    skeletonArcher: { name: "骷髏弓手", baseHealth: 85, baseDamage: 15, attackSpeed: 58, range: 180, attackDistance: 180, speed: 0.6, reward: 5, color: [180, 180, 180], isMelee: false },
    boar: { name: "野豬", baseHealth: 160, baseDamage: 20, attackSpeed: 50, range: 50, attackDistance: UNIT_RADIUS * 1.5, speed: 1.4, reward: 4, color: [139, 69, 19], isMelee: true },
    eliteGoblin: { name: "精英哥布林", baseHealth: 180, baseDamage: 25, attackSpeed: 38, range: 70, attackDistance: UNIT_RADIUS * 1.7, speed: 1.3, reward: 8, color: [255, 100, 100], isMelee: true },
    eliteOgre: { name: "精英食人魔", baseHealth: 480, baseDamage: 40, attackSpeed: 68, range: 90, attackDistance: UNIT_RADIUS * 2.2, speed: 0.5, reward: 18, color: [150, 75, 0], isMelee: true },
    eliteSkeletonArcher: { name: "精英骷髏弓手", baseHealth: 180, baseDamage: 30, attackSpeed: 48, range: 240, attackDistance: 240, speed: 0.7, reward: 15, color: [210, 210, 210], isMelee: false },
    eliteKnight: { name: "精英騎士", baseHealth: 420, baseDamage: 35, attackSpeed: 50, range: 90, attackDistance: UNIT_RADIUS * 2.1, speed: 1.0, reward: 25, color: [192, 192, 192], isMelee: true },
    miniBossOrc: { name: "獸人隊長", baseHealth: 1000, baseDamage: 55, attackSpeed: 60, range: 100, attackDistance: UNIT_RADIUS * 2.5, speed: 0.6, reward: 50, color: [0, 100, 0], isMelee: true },
    bossHydra: { name: "九頭蛇", baseHealth: 1300, baseDamage: 50, attackSpeed: 45, range: 150, attackDistance: UNIT_RADIUS * 3.0, speed: 0.5, reward: 80, color: [0, 150, 150], isMelee: true },
    finalBossDragon: { name: "巨龍", baseHealth: 2500, baseDamage: 80, attackSpeed: 75, range: 300, attackDistance: 300, speed: 0.5, reward: 200, color: [50, 50, 50], isMelee: false }
};
function getUnitDefinition(type) { return BASE_SOLDIER_TYPES[type] || ADVANCED_SOLDIER_TYPES[type] || MONSTER_TYPES[type]; }
const masterQuestList = [ { id: 'kill_ogres', description: "擊殺 3 隻食人魔", targetType: 'killMonsterType', targetValue: 'ogre', targetCount: 3, progress: 0, isCompleted: false, isActive: false }, { id: 'kill_skeletons', description: "擊殺 5 隻骷髏弓手", targetType: 'killMonsterType', targetValue: 'skeletonArcher', targetCount: 5, progress: 0, isCompleted: false, isActive: false }, { id: 'kill_boars', description: "擊殺 4 隻野豬", targetType: 'killMonsterType', targetValue: 'boar', targetCount: 4, progress: 0, isCompleted: false, isActive: false }, { id: 'reach_gold', description: "累積金幣達到 150", targetType: 'reachGold', targetValue: null, targetCount: 150, progress: 0, isCompleted: false, isActive: false }, { id: 'merge_advanced', description: "成功合成 1 個進階單位", targetType: 'mergeAdvanced', targetValue: null, targetCount: 1, progress: 0, isCompleted: false, isActive: false }, { id: 'upgrade_archer', description: "將弓箭手升到 3 級", targetType: 'upgradeUnitToLevel', targetValue: 'archer', targetCount: 3, progress: 0, isCompleted: false, isActive: false }, { id: 'upgrade_tank', description: "將坦克升到 3 級", targetType: 'upgradeUnitToLevel', targetValue: 'tank', targetCount: 3, progress: 0, isCompleted: false, isActive: false }, { id: 'clear_wave_fast', description: "在 50 秒內清除一個波次", targetType: 'clearWaveFast', targetValue: null, targetCount: 50, progress: Infinity, isCompleted: false, isActive: false }, { id: 'win_wave_5', description: "成功通過第 5 波", targetType: 'clearSpecificWave', targetValue: null, targetCount: 5, progress: 0, isCompleted: false, isActive: false }, { id: 'win_wave_6', description: "成功通過第 6 波", targetType: 'clearSpecificWave', targetValue: null, targetCount: 6, progress: 0, isCompleted: false, isActive: false }, ];

// --- P5.js Functions ---
function setup() { createCanvas(800, 600); textAlign(CENTER, CENTER); initializeGame(); }
function draw() { background(200, 220, 200); hoveredUnitInfo = null; switch (gamePhase) { case 'startScreen': drawStartScreen(); break; case 'questSelection': drawQuestSelectionScreen(); break; case 'buy': case 'fight': drawBattlefield(); drawUI(); if(gamePhase === 'buy') drawEnemyPreview(); handleDragging(); drawSoldiers(); drawMonsters(); detectHover(); displayGameMessage(); if (gamePhase === 'buy') { updateBuyButtons(); } else { updateUnits(); handleCombat(); spawnMonsters(); checkWaveEnd(); checkGameOver(); } break; case 'restarting': drawBattlefield(); drawUI(); drawSoldiers(); drawMonsters(); displayGameMessage(); break; case 'win': drawBattlefield(); drawUI(); drawSoldiers(); drawMonsters(); drawVictoryScreen(); break; default: console.error("Unknown phase:", gamePhase); initializeGame(); } if (hoveredUnitInfo && gamePhase !== 'startScreen' && gamePhase !== 'questSelection' && gamePhase !== 'win' && gamePhase !== 'restarting') { drawUnitTooltip(hoveredUnitInfo.unit, hoveredUnitInfo.type, mouseX, mouseY); } }
function detectHover() { for (const m of monsters) { if (dist(mouseX, mouseY, m.x, m.y) < UNIT_RADIUS) { hoveredUnitInfo = { unit: m, type: 'monster' }; return; } } for (const s of soldiers) { if (draggedSoldier && draggedSoldier.soldierRef === s) continue; if (dist(mouseX, mouseY, s.x, s.y) < UNIT_RADIUS) { hoveredUnitInfo = { unit: s, type: 'soldier' }; return; } } }

// --- Initialization and Button Functions ---
function initializeGame(skipStartScreen = false) { gold = STARTING_GOLD; currentLevel = 1; soldiers = []; monsters = []; monstersToSpawn = []; draggedSoldier = null; gameMessage = ""; messageTimer = 0; nextWavePreview = []; nextWaveSpawnList = []; totalMonstersKilled = 0; totalSoldiersLost = 0; availableQuests = []; activeQuests = []; questRewardClaimed = false; pendingQuestReward = false; for(const type in ADVANCED_SOLDIER_TYPES) { if (ADVANCED_SOLDIER_TYPES.hasOwnProperty(type)){ ADVANCED_SOLDIER_TYPES[type].unlocked = false; ADVANCED_SOLDIER_TYPES[type].buyCount = 0; } } gamePhase = skipStartScreen ? 'buy' : 'startScreen'; createGameButtons(); if (startButton) updateStartButton(); if (gamePhase === 'startScreen') { hideGameButtons(); } else { showGameButtons(); calculateNextWavePreview(currentLevel); } if (!isLooping()) loop(); console.log(`Game Initialized/Reset to phase: ${gamePhase}`); }
function createGameButtons() { selectAll('button').forEach(btn => btn.remove()); buyButtons = []; let buttonX = 10; const buttonY = height - 50; let buttonWidth = 110; let buttonSpacing = buttonWidth + 10; const maxButtonX = width - 160; let secondRowY = height - 95; let currentY = buttonY; let count = 0; for (const type in BASE_SOLDIER_TYPES) { if (BASE_SOLDIER_TYPES.hasOwnProperty(type)){ if (buttonX + buttonWidth > maxButtonX && count >= 4) { console.warn("Not enough space for base buttons"); break; } const stats = BASE_SOLDIER_TYPES[type]; const btn = createButton(`${stats.name} (${stats.cost} G)`); btn.position(buttonX, currentY); btn.size(buttonWidth, 40); btn.mousePressed(((t) => () => buySoldier(t))(type)); buyButtons.push({ button: btn, type: type, isAdvanced: false }); buttonX += buttonSpacing; count++; } } buttonX = 10; currentY = buttonY; let advancedCount = 0; for(const type in ADVANCED_SOLDIER_TYPES){ if(ADVANCED_SOLDIER_TYPES.hasOwnProperty(type) && ADVANCED_SOLDIER_TYPES[type].unlocked) advancedCount++; } if (advancedCount > 0) { currentY = secondRowY; buttonWidth = 100; buttonSpacing = buttonWidth + 8; } for (const type in ADVANCED_SOLDIER_TYPES) { if (ADVANCED_SOLDIER_TYPES.hasOwnProperty(type)){ const stats = ADVANCED_SOLDIER_TYPES[type]; if (stats.unlocked) { if (buttonX + buttonWidth > maxButtonX) { console.warn("Not enough space for unlocked advanced button:", type); continue; } const cost = stats.cost || floor(stats.baseHealth / 10 + stats.baseDamage * 2); const btn = createButton(`★${stats.name} (${cost} G)`); btn.position(buttonX, currentY); btn.size(buttonWidth, 40); btn.style('background-color', '#FFD700'); btn.mousePressed(((t) => () => buySoldier(t))(type)); buyButtons.push({ button: btn, type: type, isAdvanced: true }); buttonX += buttonSpacing; count++; } } } if (startButton) startButton.remove(); startButton = createButton(`開始第 ${currentLevel} 波`); startButton.position(width - 150, buttonY); startButton.size(140, 40); startButton.mousePressed(startWave); }
function hideGameButtons() { buyButtons.forEach(item => { if(item.button) item.button.hide(); }); if (startButton) startButton.hide(); }
function showGameButtons() { buyButtons.forEach(item => { if(item.button) item.button.show(); }); if (startButton) startButton.show(); updateBuyButtons(); updateStartButton(); }
function updateBuyButtons() { buyButtons.forEach(item => { if (item.button) { const stats = item.isAdvanced ? ADVANCED_SOLDIER_TYPES[item.type] : BASE_SOLDIER_TYPES[item.type]; if (!stats) return; const cost = stats.cost || 0; const canAfford = gold >= cost; const isUnlocked = item.isAdvanced ? stats.unlocked : true; const buyLimitReached = item.isAdvanced ? (stats.buyCount >= stats.buyLimit) : false; const enabled = (gamePhase === 'buy') && canAfford && isUnlocked && !buyLimitReached; if (enabled) item.button.removeAttribute('disabled'); else item.button.attribute('disabled', ''); let buttonText = item.isAdvanced ? `★${stats.name}` : stats.name; buttonText += ` (${cost} G)`; if (item.isAdvanced) { buttonText += ` [${stats.buyCount}/${stats.buyLimit}]`; } item.button.html(buttonText); } }); }
function updateStartButton() { if (startButton) { startButton.html(`開始第 ${currentLevel} 波`); if (gamePhase === 'buy') startButton.removeAttribute('disabled'); else startButton.attribute('disabled', ''); } }

// --- Drawing Functions ---
function drawBattlefield() { push(); fill(180, 200, 180); noStroke(); rect(0, BATTLEFIELD_Y_START, width, BATTLEFIELD_HEIGHT); pop(); }
function drawUI() { if (gamePhase === 'startScreen') return; push(); fill(0); textSize(18); textAlign(LEFT, TOP); text(`金幣: ${gold}`, 10, 10); textAlign(RIGHT, TOP); text(`關卡: ${currentLevel} / ${MAX_LEVEL}`, width - 10, 10); pop(); }
function displayGameMessage() { if (gameMessage && gamePhase !== 'startScreen') { push(); textSize(32); let alphaValue = 255; if (messageTimer > 0 && messageTimer < 60 && gamePhase !== 'restarting' && gamePhase !== 'win') { alphaValue = map(messageTimer, 0, 59, 0, 255); } let msgColor = color(0, 0, 0, alphaValue); if (gamePhase === 'restarting') msgColor = color(255, 0, 0, alphaValue); if (gamePhase === 'win') msgColor = color(0, 200, 0, alphaValue); if (gameMessage.includes("完成")) msgColor = color(0, 150, 0, alphaValue); if (gameMessage.includes("解鎖")) msgColor = color(255, 215, 0, alphaValue); fill(msgColor); textAlign(CENTER, CENTER); text(gameMessage, width / 2, height / 2 - 30); pop(); if (messageTimer > 0 && gamePhase !== 'restarting' && gamePhase !== 'win') { messageTimer--; if (messageTimer <= 0) gameMessage = ""; } } }
function drawUnit(unit, type) { if (!unit) return; const definition = getUnitDefinition(unit.type); if (!definition) { console.error(`No definition for type: ${unit.type}`); return; } if (type === 'soldier' && draggedSoldier && draggedSoldier.soldierRef === unit) return; push(); translate(unit.x, unit.y); if (type === 'soldier') { stroke(0, 100, 255, 200); strokeWeight(2); } else if (type === 'monster') { stroke(255, 50, 50, 200); strokeWeight(2); } else { stroke(0); strokeWeight(1); } fill(unit.color || definition.color); ellipse(0, 0, UNIT_RADIUS * 2, UNIT_RADIUS * 2); noStroke(); const healthBarWidth = UNIT_RADIUS * 2.2; const healthBarHeight = 6; const healthBarYOffset = -(UNIT_RADIUS + 8); const healthRatio = constrain(unit.health / unit.maxHealth, 0, 1); fill(255, 0, 0); rect(-healthBarWidth / 2, healthBarYOffset, healthBarWidth, healthBarHeight, 2); fill(0, 255, 0); rect(-healthBarWidth / 2, healthBarYOffset, healthBarWidth * healthRatio, healthBarHeight, 2); const numericalHealthY = healthBarYOffset + healthBarHeight + 6; fill(255); stroke(0); strokeWeight(0.5); textSize(9); textAlign(CENTER, CENTER); text(`${floor(unit.health)}/${floor(unit.maxHealth)}`, 0, numericalHealthY); const nameY = numericalHealthY + 10; fill(0); noStroke(); textSize(8); text(definition.name, 0, nameY); if (type === 'soldier' && unit.level) { fill(255); stroke(0); strokeWeight(1); textSize(10); let levelPrefix = ADVANCED_SOLDIER_TYPES[unit.type] ? "★" : "L"; text(`${levelPrefix}${unit.level}`, 0, 1); } pop(); if (!definition.isMelee && unit.target !== null && frameCount - unit.lastAttackFrame < 6) { const targetList = (type === 'soldier' ? monsters : soldiers); const targetUnit = targetList[unit.target]; if (targetUnit) { push(); stroke(255, 255, 0, 180); strokeWeight(1.5); line(unit.x, unit.y, targetUnit.x, targetUnit.y); pop(); } } }
function drawSoldiers() { soldiers.forEach(s => drawUnit(s, 'soldier')); }
function drawMonsters() { monsters.forEach(m => drawUnit(m, 'monster')); }
function handleDragging() { if (draggedSoldier && draggedSoldier.soldierRef) { const s = draggedSoldier.soldierRef; const definition = getUnitDefinition(s.type); if (!definition) return; const displayX = mouseX - draggedSoldier.offsetX; const displayY = mouseY - draggedSoldier.offsetY; push(); let ghostColor = color(s.color || definition.color); ghostColor.setAlpha(150); fill(ghostColor); stroke(0, 150); ellipse(displayX, displayY, UNIT_RADIUS * 2, UNIT_RADIUS * 2); fill(255, 150); stroke(0, 150); textSize(10); textAlign(CENTER, CENTER); let levelPrefix = ADVANCED_SOLDIER_TYPES[s.type] ? "★" : "L"; text(`${levelPrefix}${s.level}`, displayX, displayY + 1); pop(); } }
function drawEnemyPreview() { if (currentLevel > MAX_LEVEL || gamePhase !== 'buy') return; push(); fill(0, 0, 0, 180); noStroke(); rect(PREVIEW_X - 10, PREVIEW_Y - 25, 150, BATTLEFIELD_HEIGHT / 1.5 + 40, 5); fill(255); textSize(14); textAlign(LEFT, TOP); text(`下一波 (關卡 ${currentLevel}):`, PREVIEW_X, PREVIEW_Y - 20); let yOffset = PREVIEW_Y; textSize(12); if (nextWavePreview.length === 0) text("載入中...", PREVIEW_X, yOffset); else { nextWavePreview.forEach(enemyInfo => { const enemyName = MONSTER_TYPES[enemyInfo.type] ? MONSTER_TYPES[enemyInfo.type].name : enemyInfo.type; text(`- ${enemyName} x ${enemyInfo.count}`, PREVIEW_X, yOffset); yOffset += 18; }); } pop(); }
function drawVictoryScreen() { push(); fill(0, 0, 50, 180); rect(0, 0, width, height); fill(0, 255, 0); textSize(48); textAlign(CENTER, CENTER); text("遊戲勝利!", width / 2, height / 2 - 150); fill(255); textSize(20); let statY = height / 2 - 80; text(`總擊殺怪物: ${totalMonstersKilled}`, width / 2, statY); statY += 30; text(`總損失士兵: ${totalSoldiersLost}`, width / 2, statY); statY += 40; textSize(16); text("存活士兵:", width / 2, statY); statY += 25; textAlign(LEFT, TOP); let survivorX = width / 2 - 150; let survivorYLimit = height - 70; soldiers.forEach(s => { if (s) { const definition = getUnitDefinition(s.type); if (definition) { let levelPrefix = ADVANCED_SOLDIER_TYPES[s.type] ? "★" : "L"; text(`- ${definition.name} (${levelPrefix}${s.level})`, survivorX, statY); statY += 20; if (statY > survivorYLimit) { survivorX += 200; statY = height / 2 + 10; } } } }); textAlign(CENTER, CENTER); textSize(18); fill(200); text("點擊任意處返回開始畫面", width / 2, height - 50); pop(); }
function drawStartScreen() { push(); background(50, 50, 80); fill(255, 215, 0); textSize(52); textAlign(CENTER, CENTER); textFont('Georgia'); text("士兵合成守城", width / 2, 60); fill(200); textSize(20); text("點擊畫面開始遊戲", width / 2, height - 40); let startInfoY = 120; let infoXLeft = 50; let infoXRight = 450; let currentX = infoXLeft; let currentY = startInfoY; let lineHeight = 28; let statOffset = 11; fill(220); textSize(16); textAlign(LEFT, TOP); text("基礎單位 (可購買):", currentX, currentY); currentY += 25; textSize(10); for (const type in BASE_SOLDIER_TYPES) { const stats = BASE_SOLDIER_TYPES[type]; fill(stats.color || 200); text(`${stats.name} (${stats.cost}G):`, currentX, currentY); fill(220); text(`  生命 ${stats.baseHealth}, 傷害 ${stats.baseDamage}, 攻速 ${stats.attackSpeed}, ${stats.isMelee ? '近戰' : '遠程'}`, currentX, currentY + statOffset); currentY += lineHeight; } currentY += 30; fill(200, 200, 100); textSize(14); textAlign(LEFT, TOP); text("提示:", currentX, currentY); currentY += 20; textSize(12); fill(220); text("- 將兩個相同的基礎/隱藏單位拖曳合成可升級 (最高 L3)。", currentX, currentY); currentY += 18; text("- 將兩個【不同】的【L3】基礎單位拖曳合成", currentX, currentY); currentY += 18; text("  可產生強大的隱藏單位！", currentX, currentY); currentX = infoXRight; currentY = startInfoY; fill(220); textSize(16); textAlign(LEFT, TOP); text("部分敵方單位:", currentX, currentY); currentY += 25; textSize(10); let monsterCount = 0; for (const type in MONSTER_TYPES) { if (monsterCount >= 10 || currentY > height - 80) { text("... 及更多", currentX, currentY); break; } const stats = MONSTER_TYPES[type]; let monsterNameColor = stats.color || 200; if (type.includes('Boss') || type.includes('Elite')) monsterNameColor = color(255, 180, 180); fill(monsterNameColor); text(`${stats.name}:`, currentX, currentY); fill(220); text(`  生命 ${stats.baseHealth}, 傷害 ${stats.baseDamage}, ${stats.isMelee ? '近戰' : '遠程'}`, currentX, currentY + statOffset); currentY += lineHeight; monsterCount++; } pop(); }
function drawQuestSelectionScreen() { push(); fill(0, 0, 0, 150); rect(0, 0, width, height); fill(255, 220, 0); textSize(32); textAlign(CENTER, TOP); text("任務選擇", width / 2, 50); fill(200); textSize(16); text(`從下面 ${NUM_QUESTS_TO_SHOW} 個任務中選擇 1 個`, width / 2, 90); text(`(完成即可解鎖隱藏單位)`, width / 2, 115); let questButtonY = 160; let questButtonHeight = 70; let questButtonSpacing = 20; let questButtonWidth = width * 0.7; let questButtonX = (width - questButtonWidth) / 2; availableQuests.forEach((quest, index) => { fill(80, 80, 100); stroke(150); strokeWeight(1); rect(questButtonX, questButtonY, questButtonWidth, questButtonHeight, 8); noStroke(); fill(220); textSize(14); textAlign(CENTER, CENTER); text(quest.description, questButtonX + questButtonWidth / 2, questButtonY + questButtonHeight / 2); questButtonY += questButtonHeight + questButtonSpacing; }); pop(); }
function drawUnitTooltip(unit, unitType, x, y) { const definition = getUnitDefinition(unit.type); if (!definition) return; const tooltipPadding = 8; const lineHeight = 14; let tooltipContent = []; let nameLine = `${definition.name}`; if (unitType === 'soldier' && unit.level) { let levelPrefix = ADVANCED_SOLDIER_TYPES[unit.type] ? "★" : "L"; nameLine += ` (${levelPrefix}${unit.level})`; } tooltipContent.push(nameLine); tooltipContent.push(`生命: ${floor(unit.health)} / ${floor(unit.maxHealth)}`); tooltipContent.push(`傷害: ${floor(unit.damage || 0)} | 攻速: ${definition.attackSpeed}`); tooltipContent.push(`射程: ${definition.range} | 速度: ${definition.speed.toFixed(1)}`); tooltipContent.push(`類型: ${definition.isMelee ? '近戰' : '遠程'}`); textSize(10); let requiredWidth = 0; tooltipContent.forEach(line => { requiredWidth = max(requiredWidth, textWidth(line)); }); requiredWidth += tooltipPadding * 2; let requiredHeight = tooltipContent.length * lineHeight + tooltipPadding * 2; let tooltipX = x + 15; let tooltipY = y + 15; if (tooltipX + requiredWidth > width) tooltipX = x - requiredWidth - 15; if (tooltipY + requiredHeight > height) tooltipY = y - requiredHeight - 15; tooltipX = max(tooltipX, 0); tooltipY = max(tooltipY, 0); push(); fill(0, 0, 0, 200); noStroke(); rect(tooltipX, tooltipY, requiredWidth, requiredHeight, 4); fill(255); textSize(10); textAlign(LEFT, TOP); let textY = tooltipY + tooltipPadding; tooltipContent.forEach(line => { text(line, tooltipX + tooltipPadding, textY); textY += lineHeight; }); pop(); }

// --- Mouse Interaction ---
function mousePressed() { if (gamePhase === 'startScreen') { gamePhase = 'buy'; showGameButtons(); calculateNextWavePreview(currentLevel); console.log("Starting game from start screen"); return; } if (gamePhase === 'win' || gamePhase === 'restarting') { console.log("Resetting to start screen from win/restart via click."); if (!isLooping()){ loop(); } initializeGame(); return; } if (gamePhase === 'questSelection') { let questButtonY = 160; let questButtonHeight = 70; let questButtonSpacing = 20; let questButtonWidth = width * 0.7; let questButtonX = (width - questButtonWidth) / 2; availableQuests.forEach((quest, index) => { if (mouseX > questButtonX && mouseX < questButtonX + questButtonWidth && mouseY > questButtonY && mouseY < questButtonY + questButtonHeight) { activeQuests = [{...quest}]; activeQuests[0].isActive = true; activeQuests[0].progress = 0; if (activeQuests[0].targetType === 'reachGold') activeQuests[0].progress = gold; if (activeQuests[0].targetType === 'clearWaveFast') activeQuests[0].progress = Infinity; console.log("Selected Active Quest:", activeQuests[0]); gamePhase = 'buy'; currentLevel = QUEST_TRIGGER_LEVEL + 1; soldiers.forEach(s => { if (s) { s.isMoving = false; s.target = null; s.health = s.maxHealth; s.x = s.lastBuyPhaseX || (SOLDIER_SPAWN_X + random(-15, 15)); s.y = s.lastBuyPhaseY || random(BATTLEFIELD_Y_START + UNIT_RADIUS + 10, BATTLEFIELD_Y_START + BATTLEFIELD_HEIGHT - UNIT_RADIUS - 10); } }); showGameButtons(); calculateNextWavePreview(currentLevel); availableQuests = []; return; } questButtonY += questButtonHeight + questButtonSpacing; }); return; } if (gamePhase === 'buy') { for (let i = soldiers.length - 1; i >= 0; i--) { const s = soldiers[i]; if (s && dist(mouseX, mouseY, s.x, s.y) < UNIT_RADIUS) { draggedSoldier = { index: i, originalX: s.x, originalY: s.y, offsetX: mouseX - s.x, offsetY: mouseY - s.y, soldierRef: s }; return; } } } }
function mouseReleased() { if (draggedSoldier) { const sourceSoldier = draggedSoldier.soldierRef; if (!sourceSoldier) { draggedSoldier = null; return; } let droppedOnTarget = false; let mergeOccurred = false; let advancedMergeOccurred = false; let upgradedUnitType = null; let upgradedUnitLevel = 0; let droppedX = mouseX - draggedSoldier.offsetX; let droppedY = mouseY - draggedSoldier.offsetY; for (let i = 0; i < soldiers.length; i++) { if (i === draggedSoldier.index) continue; const targetSoldier = soldiers[i]; if (!targetSoldier) continue; if (dist(droppedX, droppedY, targetSoldier.x, targetSoldier.y) < UNIT_RADIUS * 1.5) { droppedOnTarget = true; const sourceIsBase = BASE_SOLDIER_TYPES[sourceSoldier.type]; const targetIsBase = BASE_SOLDIER_TYPES[targetSoldier.type]; const sourceIsAdvanced = ADVANCED_SOLDIER_TYPES[sourceSoldier.type]; if (sourceIsBase && targetIsBase && sourceSoldier.level === BASE_UNIT_MAX_LEVEL && targetSoldier.level === BASE_UNIT_MAX_LEVEL && sourceSoldier.type !== targetSoldier.type) { const inputTypes = [sourceSoldier.type, targetSoldier.type].sort(); const recipe = mergeRecipes.find(r => r.input[0] === inputTypes[0] && r.input[1] === inputTypes[1]); if (recipe) { const advancedStats = ADVANCED_SOLDIER_TYPES[recipe.output]; if (advancedStats) { targetSoldier.type = recipe.output; targetSoldier.level = 1; targetSoldier.maxHealth = advancedStats.baseHealth || 100; targetSoldier.health = targetSoldier.maxHealth; targetSoldier.damage = advancedStats.baseDamage || 5; targetSoldier.attackSpeed = advancedStats.attackSpeed; targetSoldier.range = advancedStats.range; targetSoldier.attackDistance = advancedStats.attackDistance; targetSoldier.speed = advancedStats.speed; targetSoldier.color = advancedStats.color.slice(); targetSoldier.isMelee = advancedStats.isMelee; targetSoldier.lastAttackFrame = -Infinity; targetSoldier.target = null; targetSoldier.lastBuyPhaseX = targetSoldier.x; targetSoldier.lastBuyPhaseY = targetSoldier.y; removeSoldier(draggedSoldier.index); mergeOccurred = true; advancedMergeOccurred = true; console.log(`Created ${advancedStats.name} L1`); } else { console.error("Adv stats missing:", recipe.output); sourceSoldier.x = draggedSoldier.originalX; sourceSoldier.y = draggedSoldier.originalY; } } else { console.log("No adv recipe found"); sourceSoldier.x = draggedSoldier.originalX; sourceSoldier.y = draggedSoldier.originalY; } } else if (!mergeOccurred && sourceSoldier.type === targetSoldier.type && sourceSoldier.level === targetSoldier.level && ( (sourceIsBase && sourceSoldier.level < BASE_UNIT_MAX_LEVEL) || (sourceIsAdvanced && sourceSoldier.level < ADVANCED_UNIT_MAX_LEVEL) ) ) { console.log(`Standard Merging: ${sourceSoldier.type} L${sourceSoldier.level} -> L${targetSoldier.level + 1}`); targetSoldier.level++; upgradedUnitType = targetSoldier.type; upgradedUnitLevel = targetSoldier.level; const stats = getUnitDefinition(targetSoldier.type); let multiplier = 1.0; if (stats && stats.upgradeMultiplier) { multiplier = Math.pow(stats.upgradeMultiplier, targetSoldier.level - 1); } else if(stats) { multiplier = Math.pow(1.5, targetSoldier.level - 1); } targetSoldier.maxHealth = (stats.baseHealth || 100) * multiplier; targetSoldier.health = targetSoldier.maxHealth; targetSoldier.damage = (stats.baseDamage || 5) * multiplier; targetSoldier.lastBuyPhaseX = targetSoldier.x; targetSoldier.lastBuyPhaseY = targetSoldier.y; removeSoldier(draggedSoldier.index); mergeOccurred = true; } else if (!mergeOccurred) { console.log("Cannot merge: Invalid combination or max level reached."); sourceSoldier.x = draggedSoldier.originalX; sourceSoldier.y = draggedSoldier.originalY; } break; } } if (droppedOnTarget && !mergeOccurred) { /* Handled */ } else if (!droppedOnTarget) { sourceSoldier.x = constrain(droppedX, UNIT_RADIUS, width - UNIT_RADIUS); sourceSoldier.y = constrain(droppedY, BATTLEFIELD_Y_START + UNIT_RADIUS, BATTLEFIELD_Y_START + BATTLEFIELD_HEIGHT - UNIT_RADIUS); sourceSoldier.lastBuyPhaseX = sourceSoldier.x; sourceSoldier.lastBuyPhaseY = sourceSoldier.y; console.log("Repositioned soldier", draggedSoldier.index); } draggedSoldier = null; if(advancedMergeOccurred) updateQuestProgress('mergeAdvanced', null, 1); if(upgradedUnitType && upgradedUnitLevel > 0) updateQuestProgress('upgradeUnitToLevel', upgradedUnitType, upgradedUnitLevel); } }

// --- Game Logic Functions ---
function buySoldier(type) { if (gamePhase !== 'buy') return; const stats = getUnitDefinition(type); if (!stats) { console.error("Invalid soldier type:", type); return; } const cost = stats.cost || 0; const isAdv = ADVANCED_SOLDIER_TYPES[type]; if (isAdv) { if (!stats.unlocked) { console.log("Cannot buy locked advanced unit:", type); return; } if (stats.buyCount >= stats.buyLimit) { console.log(`Buy limit reached for ${stats.name}`); return; } } if (gold >= cost) { gold -= cost; if (isAdv) { stats.buyCount++; } const newSoldier = { type: type, level: 1, x: SOLDIER_SPAWN_X + random(-15, 15), y: random(BATTLEFIELD_Y_START + UNIT_RADIUS + 10, BATTLEFIELD_Y_START + BATTLEFIELD_HEIGHT - UNIT_RADIUS - 10), maxHealth: stats.baseHealth, health: stats.baseHealth, damage: stats.baseDamage, attackSpeed: stats.attackSpeed, range: stats.range, attackDistance: stats.attackDistance, speed: stats.speed, lastAttackFrame: -Infinity, target: null, isMoving: false, color: stats.color.slice(), isMelee: stats.isMelee, lastBuyPhaseX: 0, lastBuyPhaseY: 0 }; newSoldier.lastBuyPhaseX = newSoldier.x; newSoldier.lastBuyPhaseY = newSoldier.y; soldiers.push(newSoldier); console.log(`Bought ${stats.name}. Gold left: ${gold}`); updateBuyButtons(); updateQuestProgress('reachGold', null, gold); } else { console.log(`Not enough gold to buy ${stats.name}`); } }
function startWave() { if (gamePhase !== 'buy') return; console.log(`Attempting to start wave. Current phase: ${gamePhase}`); if (gamePhase !== 'buy') { console.log("Cannot start wave, not in buy phase."); return; } console.log(`Starting wave ${currentLevel}`); gamePhase = 'fight'; waveStartTime = millis(); monsters = []; console.log("Generating monster wave for level", currentLevel); monstersToSpawn = nextWaveSpawnList.slice(); if (!monstersToSpawn || monstersToSpawn.length === 0) { console.warn("Starting wave with empty pre-calculated spawn list! Adding fallback goblin."); monstersToSpawn = ['goblin']; } console.log("Using Monsters to spawn:", monstersToSpawn); spawnTimer = 0; gameMessage = ""; console.log("Setting soldiers to moving state."); soldiers.forEach(s => { if (s) { s.lastBuyPhaseX = s.x; s.lastBuyPhaseY = s.y; s.isMoving = true; s.target = null; s.lastAttackFrame = -Infinity; } }); console.log("Calculating next wave preview for level", currentLevel + 1); calculateNextWavePreview(currentLevel + 1); console.log("Updating buttons for fight phase."); updateBuyButtons(); updateStartButton(); console.log("startWave function finished. New phase:", gamePhase); }
function calculateNextWavePreview(level) { if (level > MAX_LEVEL) { nextWavePreview = [{ type: "已通關", count: "!" }]; nextWaveSpawnList = []; return; } console.log(`Calculating preview AND spawn list for level ${level}`); const spawnList = generateMonsterWave(level); if (!spawnList) { console.error("generateMonsterWave returned null/undefined!"); nextWaveSpawnList = ['goblin']; } else { nextWaveSpawnList = spawnList; } let counts = {}; nextWaveSpawnList.forEach(type => { counts[type] = (counts[type] || 0) + 1; }); let composition = []; for (const type in counts) { composition.push({ type: type, count: counts[type] }); } nextWavePreview = composition; console.log(`Preview L${level}:`, nextWavePreview); /*console.log(`Actual Spawn List L${level}:`, nextWaveSpawnList);*/ }
// --- Modified generateMonsterWave with balanced values and L1 fix ---
function generateMonsterWave(level) {
    let waveComposition = [];
    let spawnList = [];
    let basePoints = 0;
    let tempSpawnList = [];
    const regularPool = ['goblin', 'goblinSpear', 'ogre', 'skeletonArcher', 'boar'];
    const weakRegularPool = ['goblin', 'goblinSpear', 'skeletonArcher']; // Pool excluding ogre/boar
    const strongRegularPool = ['ogre', 'boar']; // Pool with only ogre/boar
    const elitePool = ['eliteGoblin', 'eliteOgre', 'eliteSkeletonArcher', 'eliteKnight'];
    const bossPool = ['miniBossOrc', 'bossHydra', 'finalBossDragon'];
    const costs = { goblin: 1, goblinSpear: 1.5, ogre: 5, skeletonArcher: 4, boar: 3, eliteGoblin: 7, eliteOgre: 18, eliteSkeletonArcher: 14, eliteKnight: 22, miniBossOrc: 35, bossHydra: 60, finalBossDragon: 120 };

    // --- Define Wave Compositions ---
    if (level === 10) { waveComposition = [ { type: 'finalBossDragon', count: 1 }, { type: 'bossHydra', count: 1 }, { type: 'eliteKnight', count: 4 }, { type: 'eliteOgre', count: 3 } ]; }
    else if (level === 9) { waveComposition = [ { type: 'miniBossOrc', count: 2 }, { type: 'eliteKnight', count: 4 }, { type: 'eliteSkeletonArcher', count: 3 } ]; }
    else if (level >= 7) { basePoints = 15 + level * 6; tempSpawnList.push('bossHydra'); basePoints -= costs['bossHydra'] || 50; let numEliteTypes = (level === 8) ? 3 : 2; let chosenElites = shuffle(elitePool).slice(0, numEliteTypes); chosenElites.forEach(eliteType => { let eliteCount = floor(random(2, 4)); for(let i=0; i<eliteCount; i++) tempSpawnList.push(eliteType); basePoints -= (costs[eliteType] || 10) * eliteCount; }); while (basePoints > 0 && tempSpawnList.length < 35) { let available = regularPool.filter(type => costs[type] <= basePoints); if (available.length === 0) break; let type = random(available); tempSpawnList.push(type); basePoints -= costs[type]; } }
    else if (level >= 4 && level <=6) { // Levels 4, 5, 6: Regular + 1-2 Elite type
         basePoints = 10 + level * 5;
         let eliteType = random(elitePool);
         let eliteCount = (level >= 5) ? floor(random(2, 4)) : floor(random(1, 3));
         for(let i=0; i<eliteCount; i++) tempSpawnList.push(eliteType);
         basePoints -= (costs[eliteType] || 10) * eliteCount;
         while (basePoints > 0 && tempSpawnList.length < 30) { let available = regularPool.filter(type => costs[type] <= basePoints); if (available.length === 0) break; let type = random(available); tempSpawnList.push(type); basePoints -= costs[type]; }
    }
    // <<< --- Special Logic for Level 3 --- >>>
    else if (level === 3) {
        basePoints = 10 + level * 5; // Base points for L3 (e.g., 25)

        // 1. Add one random Elite
        let eliteType = random(elitePool);
        tempSpawnList.push(eliteType);
        basePoints -= (costs[eliteType] || 10);
        console.log(`Level 3: Added ${eliteType}, points left: ${basePoints}`);

        // 2. Add exactly 3 Ogre OR Boar (randomly choose one type)
        let strongType = random(strongRegularPool); // Choose 'ogre' or 'boar'
        let strongCount = 3;
        for (let i = 0; i < strongCount; i++) {
            if (basePoints >= (costs[strongType] || 5)) { // Check if affordable
                 tempSpawnList.push(strongType);
                 basePoints -= (costs[strongType] || 5);
            } else {
                console.log(`Level 3: Not enough points for all ${strongType}`);
                break; // Stop adding if points run out
            }
        }
        console.log(`Level 3: Added ${strongCount} ${strongType}, points left: ${basePoints}`);

        // 3. Fill remaining points with WEAKER regular units
        while (basePoints > 0 && tempSpawnList.length < 25) {
            let available = weakRegularPool.filter(type => costs[type] <= basePoints);
            if (available.length === 0) break;
            let type = random(available);
            tempSpawnList.push(type);
            basePoints -= costs[type];
        }
         console.log(`Level 3: Filled remaining points. Final temp list size: ${tempSpawnList.length}`);
    }
    // <<< --- Special Logic for Level 2 --- >>>
    else if (level === 2) {
        basePoints = 15 + level * 5; // Base points for L2 (e.g., 25)
        let strongUnitAdded = false;

        // 1. Add at most ONE Ogre or Boar
        if (random() < 0.6) { // 60% chance to add one strong unit
            let strongType = random(strongRegularPool);
             if (basePoints >= (costs[strongType] || 5)) {
                tempSpawnList.push(strongType);
                basePoints -= (costs[strongType] || 5);
                strongUnitAdded = true;
                console.log(`Level 2: Added ${strongType}, points left: ${basePoints}`);
             }
        }

        // 2. Fill remaining points with WEAKER regular units
        while (basePoints > 0 && tempSpawnList.length < 18) { // Slightly increased limit
            let available = weakRegularPool.filter(type => costs[type] <= basePoints);
            if (available.length === 0) break;
            let type = random(available);
            tempSpawnList.push(type);
            basePoints -= costs[type];
        }
        // Ensure minimum size if needed
        if (tempSpawnList.length < 6) {
             console.log("Level 2: Below minimum size, adding goblin");
             tempSpawnList.push('goblin');
        }
         console.log(`Level 2: Filled remaining points. Final temp list size: ${tempSpawnList.length}`);
    }
    // <<< --- Logic for Level 1 (Using points, limited pool) --- >>>
    else { // Level 1
        basePoints = 12; // Give slightly more points for L1
        let level1Pool = ['goblin', 'goblinSpear'];
        let level1Costs = { goblin: 1, goblinSpear: 1.5 };
        while (basePoints > 0 && tempSpawnList.length < 8) { // Limit count
             let available = level1Pool.filter(type => level1Costs[type] <= basePoints);
             if (available.length === 0) break;
             let type = random(available);
             tempSpawnList.push(type);
             basePoints -= level1Costs[type];
         }
         if (tempSpawnList.length < 4) { // Ensure minimum of 4
            console.log("Level 1: Below minimum size, adding goblin");
            tempSpawnList.push('goblin');
         }
          console.log(`Level 1: Final temp list size: ${tempSpawnList.length}`);
    }

    // --- Final Processing ---
    // Generate spawn list from composition if fixed, or use tempSpawnList if dynamic
    if ([10, 9].includes(level)) {
        spawnList = [];
        waveComposition.forEach(item => { for (let i = 0; i < item.count; i++) spawnList.push(item.type); });
    } else {
        spawnList = tempSpawnList; // Use the dynamically generated list
    }
    spawnList = shuffle(spawnList);
    if (spawnList.length === 0) { console.warn(`Generated empty spawn list for level ${level}, adding fallback goblin.`); spawnList.push('goblin'); }

    // --- Calculate Composition for Preview ---
    // This needs to be done AFTER the final spawnList is determined
    let finalCounts = {};
    spawnList.forEach(type => { finalCounts[type] = (finalCounts[type] || 0) + 1; });
    waveComposition = []; // Reset composition array
    for (const type in finalCounts) {
        waveComposition.push({ type: type, count: finalCounts[type] });
    }
    nextWavePreview = waveComposition; // Update the global preview

    return spawnList; // Return the shuffled list for spawning
}
// spawnMonsters remains the same
function spawnMonsters() { if (gamePhase !== 'fight' || monstersToSpawn.length === 0) return; spawnTimer++; if (spawnTimer >= spawnInterval) { spawnTimer = 0; const monsterTypeKey = monstersToSpawn.shift(); const stats = MONSTER_TYPES[monsterTypeKey]; if (!stats) { console.error("Invalid monster type:", monsterTypeKey); return;} const healthMultiplier = 1 + (currentLevel - 1) * 0.15; const damageMultiplier = 1 + (currentLevel - 1) * 0.12; monsters.push({ type: monsterTypeKey, x: width - MONSTER_SPAWN_X_OFFSET + random(-15, 15), y: random(BATTLEFIELD_Y_START + UNIT_RADIUS + 10, BATTLEFIELD_Y_START + BATTLEFIELD_HEIGHT - UNIT_RADIUS - 10), maxHealth: (stats.baseHealth || 100) * healthMultiplier, health: (stats.baseHealth || 100) * healthMultiplier, damage: (stats.baseDamage || 5) * damageMultiplier, attackSpeed: stats.attackSpeed, range: stats.range, attackDistance: stats.attackDistance, speed: stats.speed, reward: stats.reward || 1, lastAttackFrame: -Infinity, target: null, isMoving: true, color: stats.color ? stats.color.slice() : [128, 128, 128], isMelee: stats.isMelee }); } }
// findClosestEnemyOverall, findTargetInRange remain the same
function findClosestEnemyOverall(unit, targets) { let closestTarget = null; let minDistSq = Infinity; for (let i = 0; i < targets.length; i++) { const potentialTarget = targets[i]; if (!potentialTarget || potentialTarget.health <= 0) continue; const dSq = sq(unit.x - potentialTarget.x) + sq(unit.y - potentialTarget.y); if (dSq < minDistSq) { minDistSq = dSq; closestTarget = potentialTarget; } } return closestTarget; }
function findTargetInRange(unit, targets) { let closestTargetIndex = null; let minDistSq = sq(unit.range); for (let i = 0; i < targets.length; i++) { const potentialTarget = targets[i]; if (!potentialTarget || potentialTarget.health <= 0) continue; const dSq = sq(unit.x - potentialTarget.x) + sq(unit.y - potentialTarget.y); if (dSq < minDistSq) { minDistSq = dSq; closestTargetIndex = i; } } return closestTargetIndex; }
// updateUnits remains the same
function updateUnits() { soldiers.forEach((s) => { if (!s) return; const definition = getUnitDefinition(s.type); if(!definition) return; if (s.target !== null && (!monsters[s.target] || monsters[s.target].health <= 0)) s.target = null; if (s.target === null) s.target = findTargetInRange(s, monsters); let moveTargetPosition = null; if (s.target !== null) { const targetMonster = monsters[s.target]; if (targetMonster) { const distance = dist(s.x, s.y, targetMonster.x, targetMonster.y); if (distance <= definition.attackDistance) { s.isMoving = false; if (frameCount - s.lastAttackFrame >= s.attackSpeed) { targetMonster.health -= s.damage; s.lastAttackFrame = frameCount; } } else { s.isMoving = true; moveTargetPosition = { x: targetMonster.x, y: targetMonster.y }; } } else s.target = null; } if (s.target === null) { const closestEnemy = findClosestEnemyOverall(s, monsters); if (closestEnemy) { s.isMoving = true; moveTargetPosition = { x: closestEnemy.x, y: closestEnemy.y }; } else { s.isMoving = true; /* Keep moving right */ } } if (s.isMoving) { if (moveTargetPosition) { let angle = atan2(moveTargetPosition.y - s.y, moveTargetPosition.x - s.x); s.x += cos(angle) * s.speed; s.y += sin(angle) * s.speed; } else s.x += s.speed; s.x = constrain(s.x, UNIT_RADIUS, width - UNIT_RADIUS); s.y = constrain(s.y, BATTLEFIELD_Y_START + UNIT_RADIUS, BATTLEFIELD_Y_START + BATTLEFIELD_HEIGHT - UNIT_RADIUS); } }); monsters.forEach((m) => { if (!m) return; const definition = getUnitDefinition(m.type); if(!definition) return; if (m.target !== null && (!soldiers[m.target] || soldiers[m.target].health <= 0)) m.target = null; if (m.target === null) m.target = findTargetInRange(m, soldiers); let moveTargetPosition = null; if (m.target !== null) { const targetSoldier = soldiers[m.target]; if (targetSoldier) { const distance = dist(m.x, m.y, targetSoldier.x, targetSoldier.y); if (distance <= definition.attackDistance) { m.isMoving = false; if (frameCount - m.lastAttackFrame >= m.attackSpeed) { targetSoldier.health -= m.damage; m.lastAttackFrame = frameCount; } } else { m.isMoving = true; moveTargetPosition = { x: targetSoldier.x, y: targetSoldier.y }; } } else m.target = null; } if (m.target === null) { const closestEnemy = findClosestEnemyOverall(m, soldiers); if (closestEnemy) { m.isMoving = true; moveTargetPosition = { x: closestEnemy.x, y: closestEnemy.y }; } else { m.isMoving = true; /* Keep moving left */ } } if (m.isMoving) { if (moveTargetPosition) { let angle = atan2(moveTargetPosition.y - m.y, moveTargetPosition.x - m.x); m.x += cos(angle) * m.speed; m.y += sin(angle) * m.speed; } else m.x -= m.speed; m.x = constrain(m.x, UNIT_RADIUS, width - UNIT_RADIUS); m.y = constrain(m.y, BATTLEFIELD_Y_START + UNIT_RADIUS, BATTLEFIELD_Y_START + BATTLEFIELD_HEIGHT - UNIT_RADIUS); } }); }
// handleCombat, removeUnit, removeSoldier, removeMonster remain the same
function handleCombat() { let goldFromKills = 0; for (let i = monsters.length - 1; i >= 0; i--) { const m = monsters[i]; if (m && m.health <= 0) { goldFromKills += (m.reward || 1); totalMonstersKilled++; updateQuestProgress('killMonsterType', m.type, 1); removeMonster(i); } } if (goldFromKills > 0) { gold += goldFromKills; updateBuyButtons(); updateQuestProgress('reachGold', null, gold); } for (let i = soldiers.length - 1; i >= 0; i--) { const s = soldiers[i]; if (s && s.health <= 0) { totalSoldiersLost++; removeSoldier(i); } } }
function removeUnit(list, index, targetingList, unitType) { if (index < 0 || index >= list.length || !list[index]) return; const removedUnit = list[index]; list.splice(index, 1); targetingList.forEach(unit => { if(unit){ if (unit.target === index) { unit.target = null; unit.isMoving = true; } else if (unit.target > index) { unit.target--; } } }); }
function removeSoldier(index) { const soldierToRemove = soldiers[index]; removeUnit(soldiers, index, monsters, 'soldier'); if (draggedSoldier && index < draggedSoldier.index) { draggedSoldier.index--; } }
function removeMonster(index) { removeUnit(monsters, index, soldiers, 'monster'); }
// --- Modified checkWaveEnd ---
function checkWaveEnd() {
    if (gamePhase === 'fight' && monsters.length === 0 && monstersToSpawn.length === 0) {
        const currentWaveCleared = currentLevel;
        console.log(`Wave ${currentWaveCleared} cleared!`);
        const waveDuration = (millis() - waveStartTime) / 1000;
        updateQuestProgress('clearWaveFast', null, waveDuration);
        updateQuestProgress('clearSpecificWave', null, currentWaveCleared);

        let newUnitsWereUnlocked = false;
        if (pendingQuestReward && !questRewardClaimed) {
            newUnitsWereUnlocked = unlockAdvancedUnits();
            pendingQuestReward = false;
        }

        if (currentWaveCleared >= MAX_LEVEL) {
            console.log("Win condition met (currentLevel >= MAX_LEVEL)");
            gamePhase = 'win';
            console.log("Setting gamePhase to 'win'");
            gameMessage = ""; messageTimer = 0;
            updateBuyButtons(); updateStartButton();
            hideGameButtons();
            if(isLooping()) noLoop(); // Stop loop ONLY on win screen
            console.log("Game Won! Loop stopped.");
        } else if (currentWaveCleared === QUEST_TRIGGER_LEVEL && activeQuests.length === 0 && !questRewardClaimed) {
            gamePhase = 'questSelection'; gameMessage = ""; messageTimer = 0;
            availableQuests = shuffle(masterQuestList).slice(0, NUM_QUESTS_TO_SHOW).map(q => ({...q}));
            hideGameButtons();
            console.log("Entering Quest Selection");
        } else {
            gamePhase = 'buy';
            let waveReward = 5 + currentLevel * 2; // Adjusted wave clear gold reward
            gold += waveReward;
            currentLevel++;

            if (newUnitsWereUnlocked) {
                 console.log("Unlock message will be displayed.");
            } else {
                gameMessage = `第 ${currentWaveCleared} 波完成！+${waveReward}G. 準備第 ${currentLevel} 波`;
                messageTimer = 180;
            }

            soldiers.forEach(s => { if (s) { s.isMoving = false; s.target = null; s.health = s.maxHealth; s.x = s.lastBuyPhaseX || (SOLDIER_SPAWN_X + random(-15, 15)); s.y = s.lastBuyPhaseY || random(BATTLEFIELD_Y_START + UNIT_RADIUS + 10, BATTLEFIELD_Y_START + BATTLEFIELD_HEIGHT - UNIT_RADIUS - 10); } });
            updateBuyButtons();
            updateStartButton();
            calculateNextWavePreview(currentLevel);
            updateQuestProgress('reachGold', null, gold);
        }
    }
}
function checkGameOver() { if (gamePhase === 'fight' && soldiers.length === 0 && (monsters.length > 0 || monstersToSpawn.length > 0)) { console.log("Game Over - All soldiers defeated"); gamePhase = 'restarting'; gameMessage = "遊戲結束 - 你失敗了"; messageTimer = 120; hideGameButtons(); updateBuyButtons(); updateStartButton(); } }
// --- Modified updateQuestProgress ---
function updateQuestProgress(eventType, value, amount = 1) {
    if (questRewardClaimed || activeQuests.length === 0) return;
    let questCompletedThisUpdate = false;
    activeQuests.forEach(quest => {
        if (quest.isCompleted || !quest.isActive) return;
        let progressMade = false;
        switch (quest.targetType) { case 'killMonsterType': if (eventType === 'killMonsterType' && value === quest.targetValue) { quest.progress += amount; progressMade = true; } break; case 'reachGold': if (eventType === 'reachGold') { quest.progress = max(quest.progress, value); if (quest.progress >= quest.targetCount) progressMade = true; } else if (eventType === 'buySoldier' || eventType === 'waveReward') { quest.progress = gold; if (quest.progress >= quest.targetCount) progressMade = true; } break; case 'mergeAdvanced': if (eventType === 'mergeAdvanced') { quest.progress += amount; progressMade = true; } break; case 'upgradeUnitToLevel': if (eventType === 'upgradeUnitToLevel' && value === quest.targetValue) { quest.progress = max(quest.progress, amount); if (quest.progress >= quest.targetCount) progressMade = true; } break; case 'clearWaveFast': if (eventType === 'clearWaveFast') { quest.progress = min(quest.progress, value); if (quest.progress <= quest.targetCount) progressMade = true; } break; case 'clearSpecificWave': if (eventType === 'clearSpecificWave' && value === quest.targetCount) { quest.progress = value; progressMade = true; } break; }
        if (progressMade && !quest.isCompleted) {
             if (quest.targetType === 'clearWaveFast' ? quest.progress <= quest.targetCount : quest.progress >= quest.targetCount) {
                 quest.isCompleted = true;
                 questCompletedThisUpdate = true;
                 console.log(`Quest Completed (marked): ${quest.description}`);
             }
        }
    });
    // <<< Check and trigger reward HERE >>>
    if (questCompletedThisUpdate && !questRewardClaimed) {
        unlockAdvancedUnits(); // Immediately attempt to unlock
    }
}
// --- Modified unlockAdvancedUnits ---
function unlockAdvancedUnits() {
    if (questRewardClaimed) return false; // Already claimed

    console.log("Quest completed! Trying to unlock advanced units...");
    let availableToUnlock = [];
    for (const type in ADVANCED_SOLDIER_TYPES) { if (!ADVANCED_SOLDIER_TYPES[type].unlocked) availableToUnlock.push(type); }
    if (availableToUnlock.length === 0) { console.log("All advanced units already unlocked."); questRewardClaimed = true; return false; }

    let unlockedCount = 0;
    let unlockedNames = [];
    availableToUnlock = shuffle(availableToUnlock);
    for (let i = 0; i < availableToUnlock.length && unlockedCount < NUM_ADVANCED_TO_UNLOCK; i++) { // <<< Use constant
        const typeToUnlock = availableToUnlock[i];
        ADVANCED_SOLDIER_TYPES[typeToUnlock].unlocked = true;
        ADVANCED_SOLDIER_TYPES[typeToUnlock].buyCount = 0;
        unlockedCount++;
        unlockedNames.push(ADVANCED_SOLDIER_TYPES[typeToUnlock].name);
        console.log(`Unlocked: ${ADVANCED_SOLDIER_TYPES[typeToUnlock].name}`);
    }

    let unlockedSuccessfully = unlockedNames.length > 0;
    if (unlockedSuccessfully) {
        gameMessage = `${unlockedNames.join('、')} 已解鎖！`; // <<< Set message here
        messageTimer = 180; // <<< Set timer here
    } else { console.log("No new units were available to unlock?"); }
    questRewardClaimed = true; // <<< Set the flag AFTER attempting unlocks >>>
    createGameButtons();
    if (gamePhase === 'buy') showGameButtons();
    return unlockedSuccessfully; // <<< Return whether units were unlocked
}
function shuffle(array) { let currentIndex = array.length, randomIndex; while (currentIndex != 0) { randomIndex = Math.floor(Math.random() * currentIndex); currentIndex--; [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]; } return array; }