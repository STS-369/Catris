// ============================================================
// CATRIS — Tetris with Cats (Expanded Edition)
// 5 Levels, Power-ups, Combos, Save/Load, High Scores
// ============================================================

// === CANVAS & DOM REFS ===
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const levelNameEl = document.getElementById('level-name');
const livesEl = document.getElementById('lives');
const comboEl = document.getElementById('combo');
const highscoreEl = document.getElementById('highscore');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const puSlowCount = document.getElementById('pu-slow-count');
const puClearCount = document.getElementById('pu-clear-count');
const puBombCount = document.getElementById('pu-bomb-count');
const puSlowBtn = document.getElementById('pu-slow');
const puClearBtn = document.getElementById('pu-clear');
const puBombBtn = document.getElementById('pu-bomb');

const overlayStart = document.getElementById('overlay-start');
const overlayPause = document.getElementById('overlay-pause');
const overlayGameover = document.getElementById('overlay-gameover');
const overlayLevelup = document.getElementById('overlay-levelup');
const overlaySaves = document.getElementById('overlay-saves');
const overlayHighscores = document.getElementById('overlay-highscores');
const overlaySkins = document.getElementById('overlay-skins');
const overlayStore = document.getElementById('overlay-store');

context.scale(20, 20);
nextContext.scale(20, 20);

// ============================================================
// CAT EMOJI SKIN PACKS
// ============================================================
const SKIN_PACKS = [
    {
        id: 'classic',
        name: 'Classic Cats',
        emojis: { T: '🐱', O: '😸', L: '😽', J: '😼', I: '😺', S: '😹', Z: '😻' },
        unlocked: true,
        premium: false,
    },
    {
        id: 'royal',
        name: 'Royal Cats',
        emojis: { T: '👑', O: '🤴', L: '💎', J: '⚜️', I: '🏰', S: '✨', Z: '🌟' },
        unlocked: false,
        premium: true,
    },
    {
        id: 'food',
        name: 'Food Cats',
        emojis: { T: '🍣', O: '🍙', L: '🍩', J: '🍰', I: '🍜', S: '🧋', Z: '🍦' },
        unlocked: false,
        premium: true,
    },
    {
        id: 'space',
        name: 'Space Cats',
        emojis: { T: '🚀', O: '🌙', L: '🪐', J: '⭐', I: '🛸', S: '☄️', Z: '🌌' },
        unlocked: false,
        premium: true,
    },
    {
        id: 'spooky',
        name: 'Spooky Cats',
        emojis: { T: '👻', O: '🎃', L: '🦇', J: '🕷️', I: '💀', S: '🧛', Z: '😈' },
        unlocked: false,
        premium: true,
    },
    {
        id: 'heart',
        name: 'Love Cats',
        emojis: { T: '❤️', O: '💕', L: '💗', J: '💖', I: '💘', S: '💖', Z: '🩷' },
        unlocked: false,
        premium: true,
    },
];

let activeSkinId = localStorage.getItem('catris_skin') || 'classic';
function getActiveSkin() {
    return SKIN_PACKS.find(s => s.id === activeSkinId) || SKIN_PACKS[0];
}

// ============================================================
// CREDIT SYSTEM — Play-to-Win
// ============================================================
const CREDIT_EARNINGS = {
    LINE_CLEAR: 10,
    LEVEL_COMPLETE: 500,
    COMBO_BONUS: 10,       // per combo level
    DAILY_LOGIN: 50,
    HIGH_SCORE: 200,
};

const CREDIT_COSTS = {
    SKIN_PACK: { royal: 1500, food: 2000, space: 3000, spooky: 2500, heart: 1000 },
    EXTRA_LIFE: 200,
    SAVE_SLOT: 500,
    POWERUP_PACK: 300,
};

const STORE_ITEMS = [
    { id: 'skin_royal', name: 'Royal Cats', icon: '👑', desc: 'Crown & gem cat skins', cost: 1500, type: 'skin', skinId: 'royal' },
    { id: 'skin_food', name: 'Food Cats', icon: '🍣', desc: 'Sushi & dessert cats', cost: 2000, type: 'skin', skinId: 'food' },
    { id: 'skin_space', name: 'Space Cats', icon: '🚀', desc: 'Rocket & star cats', cost: 3000, type: 'skin', skinId: 'space' },
    { id: 'skin_spooky', name: 'Spooky Cats', icon: '👻', desc: 'Ghost & pumpkin cats', cost: 2500, type: 'skin', skinId: 'spooky' },
    { id: 'skin_heart', name: 'Love Cats', icon: '❤️', desc: 'Heart & love cats', cost: 1000, type: 'skin', skinId: 'heart' },
    { id: 'extra_life', name: 'Extra Life', icon: '💖', desc: '+1 life when starting', cost: 200, type: 'consumable' },
    { id: 'save_slot', name: 'Save Slot', icon: '💾', desc: 'Unlock extra save slot', cost: 500, type: 'permanent' },
    { id: 'powerup_pack', name: 'Power-Up Pack', icon: '⚡', desc: '3 random power-ups', cost: 300, type: 'consumable' },
];

let wallet = {
    credits: 0,
    totalEarned: 0,
    totalSpent: 0,
    lastLogin: null,
    ownedSkins: ['classic'],
    extraLivesPurchased: 0,
    saveSlotsUnlocked: 0,
    purchaseHistory: [],
};

function loadWallet() {
    try {
        const saved = JSON.parse(localStorage.getItem('catris_wallet'));
        if (saved) {
            wallet = { ...wallet, ...saved };
        }
    } catch {}
    // Ensure classic skin is always owned
    if (!wallet.ownedSkins.includes('classic')) {
        wallet.ownedSkins.push('classic');
    }
    syncSkinUnlocks();
}

function saveWallet() {
    localStorage.setItem('catris_wallet', JSON.stringify(wallet));
}

function syncSkinUnlocks() {
    SKIN_PACKS.forEach(pack => {
        pack.unlocked = wallet.ownedSkins.includes(pack.id);
    });
}

function earnCredits(amount, reason) {
    wallet.credits += amount;
    wallet.totalEarned += amount;
    saveWallet();
    updateCreditUI();
    showCreditPopup(amount, reason);
}

function spendCredits(amount, reason) {
    if (wallet.credits < amount) return false;
    wallet.credits -= amount;
    wallet.totalSpent += amount;
    wallet.purchaseHistory.push({
        amount,
        reason,
        date: new Date().toISOString(),
    });
    saveWallet();
    updateCreditUI();
    return true;
}

function checkDailyLogin() {
    const today = new Date().toDateString();
    if (wallet.lastLogin !== today) {
        wallet.lastLogin = today;
        saveWallet();
        // Award daily login bonus
        setTimeout(() => {
            earnCredits(CREDIT_EARNINGS.DAILY_LOGIN, 'Daily Login Bonus');
        }, 1500);
    }
}

function getExtraSaveSlots() {
    return 2 + wallet.saveSlotsUnlocked; // base 2 + purchased
}

// ============================================================
// CREDIT POPUP
// ============================================================
let popupTimeout = null;

function showCreditPopup(amount, reason) {
    const popup = document.getElementById('credit-popup');
    const popupAmount = document.getElementById('popup-amount');
    const popupReason = document.getElementById('popup-reason');

    popupAmount.textContent = '+' + amount;
    popupReason.textContent = reason || '';

    // Reset animation
    popup.classList.remove('hidden');
    popup.style.animation = 'none';
    popup.offsetHeight; // trigger reflow
    popup.style.animation = '';

    if (popupTimeout) clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => {
        popup.classList.add('hidden');
    }, 2000);
}

function updateCreditUI() {
    const creditsEl = document.getElementById('credits');
    if (creditsEl) creditsEl.textContent = wallet.credits;
    const storeCreditsEl = document.getElementById('store-credits');
    if (storeCreditsEl) storeCreditsEl.textContent = wallet.credits;
}

// ============================================================
// LEVEL DEFINITIONS
// ============================================================
const LEVELS = [
    {
        id: 1,
        name: 'Classic',
        desc: 'The purr-fect introduction! Standard Tetris with cats.',
        linesNeeded: 10,
        baseSpeed: 1000,
        speedMultiplier: 0.9,
        mechanics: [],
        wallInterval: 0,
        bombChance: 0,
    },
    {
        id: 2,
        name: 'Speed Round',
        desc: 'Faster drops! Bonus points for quick clears.',
        linesNeeded: 12,
        baseSpeed: 700,
        speedMultiplier: 0.85,
        mechanics: ['speed_bonus'],
        wallInterval: 0,
        bombChance: 0,
    },
    {
        id: 3,
        name: 'Bomb Blocks',
        desc: 'Every 8th block is a 💣 bomb! Clears a 3×3 area.',
        linesNeeded: 15,
        baseSpeed: 900,
        speedMultiplier: 0.88,
        mechanics: ['bomb_blocks'],
        wallInterval: 0,
        bombChance: 0.125, // 1 in 8 blocks
    },
    {
        id: 4,
        name: 'Boss Level',
        desc: 'Walls appear every 20 seconds! Dodge the obstacles!',
        linesNeeded: 20,
        baseSpeed: 850,
        speedMultiplier: 0.87,
        mechanics: ['walls'],
        wallInterval: 20000,
        bombChance: 0,
    },
    {
        id: 5,
        name: 'Zen Mode',
        desc: 'No pressure. No timer. Just you and the cats. 🧘',
        linesNeeded: 999, // effectively infinite
        baseSpeed: 1200,
        speedMultiplier: 1.0, // no speed increase
        mechanics: ['zen'],
        wallInterval: 0,
        bombChance: 0,
    },
];

// ============================================================
// GAME STATE
// ============================================================
const ARENA_W = 12;
const ARENA_H = 20;
const MAX_LIVES = 3;
const SAVE_SLOTS = 5;

let game = {
    running: false,
    paused: false,
    level: 1,
    score: 0,
    lines: 0,
    combo: 0,
    maxCombo: 0,
    lives: MAX_LIVES,
    totalPieces: 0,
    bombPiecesSpawned: 0,

    // Power-ups inventory
    powerups: { slow: 0, clear: 0, bomb: 0 },
    activePowerup: null,   // 'slow' | 'clear' | null
    powerupTimer: 0,

    // Zen mode slow-mo flag
    zenMode: false,

    // Boss level wall timer
    wallTimer: 0,
};

let arena = createMatrix(ARENA_W, ARENA_H);
const player = { pos: { x: 0, y: 0 }, matrix: null, score: 0, lines: 0 };
let nextPiece = null;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationId = null;

// ============================================================
// HIGH SCORES (localStorage)
// ============================================================
function loadHighScores() {
    try {
        return JSON.parse(localStorage.getItem('catris_highscores')) || [];
    } catch { return []; }
}
function saveHighScores(scores) {
    localStorage.setItem('catris_highscores', JSON.stringify(scores));
}
function recordHighScore() {
    const scores = loadHighScores();
    scores.push({
        score: game.score,
        lines: game.lines,
        level: game.level,
        maxCombo: game.maxCombo,
        date: new Date().toISOString(),
    });
    scores.sort((a, b) => b.score - a.score);
    saveHighScores(scores.slice(0, 20)); // keep top 20
    updateHighScoreDisplay();
    return scores.length > 0 && scores[0].score === game.score;
}
function updateHighScoreDisplay() {
    const scores = loadHighScores();
    highscoreEl.textContent = scores.length > 0 ? scores[0].score : 0;
}

// ============================================================
// SAVE / LOAD SYSTEM
// ============================================================
function getSaveSlots() {
    try {
        return JSON.parse(localStorage.getItem('catris_saves')) || {};
    } catch { return {}; }
}
function setSaveSlots(slots) {
    localStorage.setItem('catris_saves', JSON.stringify(slots));
}
function saveGame(slotNum) {
    const state = {
        level: game.level,
        score: game.score,
        lines: game.lines,
        combo: game.combo,
        maxCombo: game.maxCombo,
        lives: game.lives,
        totalPieces: game.totalPieces,
        powerups: { ...game.powerups },
        activeSkinId,
        arena: arena.map(r => [...r]),
        playerMatrix: player.matrix ? player.matrix.map(r => [...r]) : null,
        playerPos: player.pos ? { ...player.pos } : null,
        nextPiece: nextPiece ? nextPiece.map(r => [...r]) : null,
        dropInterval,
        timestamp: Date.now(),
    };
    const slots = getSaveSlots();
    slots[`slot_${slotNum}`] = state;
    setSaveSlots(slots);
}
function loadGame(slotNum) {
    const slots = getSaveSlots();
    const state = slots[`slot_${slotNum}`];
    if (!state) return false;

    game.level = state.level;
    game.score = state.score;
    game.lines = state.lines;
    game.combo = state.combo || 0;
    game.maxCombo = state.maxCombo || 0;
    game.lives = state.lives;
    game.totalPieces = state.totalPieces || 0;
    game.powerups = state.powerups || { slow: 0, clear: 0, bomb: 0 };
    game.activePowerup = null;
    game.powerupTimer = 0;
    game.running = false;
    game.paused = false;

    if (state.activeSkinId) {
        activeSkinId = state.activeSkinId;
        localStorage.setItem('catris_skin', activeSkinId);
    }

    arena = state.arena.map(r => [...r]);
    player.matrix = state.playerMatrix ? state.playerMatrix.map(r => [...r]) : null;
    player.pos = state.playerPos ? { ...state.playerPos } : { x: 0, y: 0 };
    nextPiece = state.nextPiece ? state.nextPiece.map(r => [...r]) : null;
    dropInterval = state.dropInterval || getDropSpeed();

    hideAllOverlays();
    applyLevelState();
    updateAllUI();
    drawNext();
    game.running = true;
    lastTime = performance.now();
    cancelAnimationFrame(animationId);
    update(lastTime);
    return true;
}
function deleteSave(slotNum) {
    const slots = getSaveSlots();
    delete slots[`slot_${slotNum}`];
    setSaveSlots(slots);
}

// Auto-save on level change
function autoSave() {
    saveGame(0); // slot 0 = auto-save
}

// ============================================================
// CORE TETRIS FUNCTIONS
// ============================================================
function createPiece(type) {
    const shapes = {
        I: [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
        L: [[0,2,0],[0,2,0],[0,2,2]],
        J: [[0,3,0],[0,3,0],[3,3,0]],
        O: [[4,4],[4,4]],
        Z: [[5,5,0],[0,5,5],[0,0,0]],
        S: [[0,6,6],[6,6,0],[0,0,0]],
        T: [[0,7,0],[7,7,7],[0,0,0]],
    };
    return shapes[type].map(row => [...row]);
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function getActiveEmojis() {
    return getActiveSkin().emojis;
}

function drawMatrix(matrix, offset, ctx = context) {
    const CATS = getActiveEmojis();
    const typeMap = 'ILJOTSZ';
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                let emoji;
                if (value === -1) {
                    emoji = '💣'; // bomb block
                } else {
                    const type = typeMap[value - 1];
                    emoji = CATS[type] || '🐾';
                }
                ctx.font = '1px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(emoji, x + offset.x + 0.5, y + offset.y + 0.5);
            }
        });
    });
}

function drawWalls() {
    // Boss level: draw subtle wall indicators on the sides
    if (getCurrentLevel().mechanics.includes('walls')) {
        context.fillStyle = 'rgba(255, 50, 50, 0.15)';
        context.fillRect(0, 0, 0.3, ARENA_H);
        context.fillRect(ARENA_W - 0.3, 0, 0.3, ARENA_H);
    }
}

function draw() {
    // Zen mode: semi-transparent background
    context.fillStyle = game.zenMode ? '#0a0a1a' : '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }
    drawWalls();

    // Slow time visual effect
    if (game.activePowerup === 'slow') {
        context.fillStyle = 'rgba(100, 200, 255, 0.05)';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawNext() {
    nextContext.fillStyle = '#2d2d2d';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        drawMatrix(nextPiece, { x: 1, y: 1 }, nextContext);
    }
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// ============================================================
// ARENA SWEEP — Enhanced with combo & scoring
// ============================================================
function arenaSweep() {
    let rowsCleared = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        arena.splice(y, 1)[0];
        arena.unshift(new Array(ARENA_W).fill(0));
        ++y;
        ++rowsCleared;
    }

    if (rowsCleared > 0) {
        // Combo system
        game.combo++;
        if (game.combo > game.maxCombo) game.maxCombo = game.combo;

        // Scoring: base + combo multiplier
        const levelMultiplier = game.level;
        const comboMultiplier = game.combo;
        const basePoints = rowsCleared * 10 * levelMultiplier;
        const comboBonus = (game.combo - 1) * 5;
        let totalPoints = (basePoints + comboBonus) * comboMultiplier;

        // Speed bonus in Level 2
        if (getCurrentLevel().mechanics.includes('speed_bonus')) {
            totalPoints = Math.floor(totalPoints * 1.5);
        }

        game.score += totalPoints;
        game.lines += rowsCleared;

        // === CREDIT EARNINGS ===
        // Credits for line clear
        const lineCredits = rowsCleared * CREDIT_EARNINGS.LINE_CLEAR;
        // Combo bonus credits
        const comboCredits = (game.combo - 1) * CREDIT_EARNINGS.COMBO_BONUS;
        const totalCredits = lineCredits + comboCredits;
        if (totalCredits > 0) {
            earnCredits(totalCredits, `Line Clear (${rowsCleared}x)`);
        }

        // Power-up drops: random chance on clear
        if (Math.random() < 0.15) {
            grantRandomPowerup();
        }

        updateAllUI();
        checkLevelProgress();
    } else {
        // No clear resets combo
        game.combo = 0;
        comboEl.textContent = 'x1';
    }
}

// ============================================================
// POWER-UP SYSTEM
// ============================================================
function grantRandomPowerup() {
    const types = ['slow', 'clear', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    game.powerups[type]++;
    updatePowerupUI();
}

function activatePowerup(type) {
    if (game.powerups[type] <= 0) return;
    game.powerups[type]--;
    updatePowerupUI();

    if (type === 'slow') {
        game.activePowerup = 'slow';
        game.powerupTimer = 10000; // 10 seconds of slow time
        puSlowBtn.classList.add('active');
    } else if (type === 'clear') {
        clearBottomRow();
    } else if (type === 'bomb') {
        bombCenterArea();
    }
}

function clearBottomRow() {
    // Find and clear the bottom-most complete row
    for (let y = ARENA_H - 1; y >= 0; --y) {
        if (arena[y].some(v => v !== 0)) {
            arena.splice(y, 1);
            arena.unshift(new Array(ARENA_W).fill(0));
            game.score += 15;
            game.lines++;
            updateAllUI();
            return;
        }
    }
}

function bombCenterArea() {
    // Clear a 3x3 area around the center-bottom
    const cx = Math.floor(ARENA_W / 2);
    const cy = ARENA_H - 3;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const ny = cy + dy;
            const nx = cx + dx;
            if (ny >= 0 && ny < ARENA_H && nx >= 0 && nx < ARENA_W) {
                arena[ny][nx] = 0;
            }
        }
    }
    game.score += 25;
    updateAllUI();
    // Collapse floating blocks
    collapseFloating();
}

function collapseFloating() {
    for (let x = 0; x < ARENA_W; x++) {
        let writePos = ARENA_H - 1;
        for (let y = ARENA_H - 1; y >= 0; y--) {
            if (arena[y][x] !== 0) {
                if (writePos !== y) {
                    arena[writePos][x] = arena[y][x];
                    arena[y][x] = 0;
                }
                writePos--;
            }
        }
    }
}

// ============================================================
// BOMB BLOCKS (Level 3 mechanic)
// ============================================================
function maybeSpawnBombPiece() {
    const level = getCurrentLevel();
    if (!level.mechanics.includes('bomb_blocks')) return false;
    if (Math.random() < level.bombChance) {
        // Create a 1x1 bomb piece
        player.matrix = [[-1]];
        game.bombPiecesSpawned++;
        return true;
    }
    return false;
}

function isBombPiece(matrix) {
    return matrix && matrix.length === 1 && matrix[0].length === 1 && matrix[0][0] === -1;
}

function bombDetonate() {
    // Clear 3x3 around where the bomb lands
    const px = player.pos.x;
    const py = player.pos.y;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const ny = py + dy;
            const nx = px + dx;
            if (ny >= 0 && ny < ARENA_H && nx >= 0 && nx < ARENA_W) {
                arena[ny][nx] = 0;
            }
        }
    }
    game.score += 50;
    collapseFloating();
}

// ============================================================
// BOSS LEVEL WALLS (Level 4 mechanic)
// ============================================================
let bossWallPhase = 0;
function spawnBossWall() {
    // Add a short wall block at the bottom
    const wallHeight = 3;
    const wallX = Math.floor(Math.random() * (ARENA_W - 4)) + 1;
    for (let y = ARENA_H - wallHeight; y < ARENA_H; y++) {
        for (let x = wallX; x < Math.min(wallX + 3, ARENA_W); x++) {
            arena[y][x] = 8; // wall block value (special rendering)
        }
    }
    bossWallPhase = (bossWallPhase + 1) % 3;
}

// ============================================================
// LEVEL PROGRESSION
// ============================================================
function getCurrentLevel() {
    return LEVELS[game.level - 1] || LEVELS[0];
}

function getDropSpeed() {
    const level = getCurrentLevel();
    let speed = level.baseSpeed;
    // In zen mode, no speed increase
    if (level.mechics.includes('zen')) return speed;

    // Scale speed based on lines cleared in this level
    const linesInLevel = game.lines % (level.linesNeeded || 10);
    speed = level.baseSpeed * Math.pow(level.speedMultiplier, Math.floor(linesInLevel / 5));
    return Math.max(speed, 100);
}

function checkLevelProgress() {
    const level = getCurrentLevel();
    if (game.lines >= level.linesNeeded && game.level < LEVELS.length) {
        // Level up!
        const nextLevel = game.level + 1;
        showLevelUp(nextLevel);
    }
    updateLevelProgressUI();
}

function showLevelUp(nextLevelId) {
    game.running = false;
    cancelAnimationFrame(animationId);
    autoSave();

    const nextLevel = LEVELS[nextLevelId - 1];
    document.getElementById('levelup-title').textContent = `🎉 Level ${nextLevelId}!`;
    document.getElementById('levelup-desc').textContent = nextLevel.desc;

    let mechText = '';
    if (nextLevel.mechanics.length === 0) {
        mechText = '✅ Standard rules apply';
    } else {
        nextLevel.mechanics.forEach(m => {
            switch (m) {
                case 'speed_bonus': mechText += '⚡ 1.5x score bonus for quick clears<br>'; break;
                case 'bomb_blocks': mechText += '💣 Random bomb blocks will appear<br>'; break;
                case 'walls': mechText += '🧱 Walls will spawn periodically<br>'; break;
                case 'zen': mechText += '🧘 No timer, relax and play<br>'; break;
            }
        });
    }
    document.getElementById('levelup-mechanics').innerHTML = mechText;

    hideAllOverlays();
    overlayLevelup.classList.remove('hidden');
}

function advanceToNextLevel() {
    game.level++;
    game.zenMode = getCurrentLevel().mechanics.includes('zen');
    dropInterval = getDropSpeed();
    bossWallPhase = 0;
    applyLevelState();
    hideAllOverlays();
    game.running = true;
    lastTime = performance.now();
    update(lastTime);

    // === CREDIT EARNINGS: Level Complete ===
    earnCredits(CREDIT_EARNINGS.LEVEL_COMPLETE, `Level ${game.level - 1} Complete!`);
}

function applyLevelState() {
    const level = getCurrentLevel();
    dropInterval = level.baseSpeed;
    game.zenMode = level.mechanics.includes('zen');
    game.wallTimer = 0;
    updateAllUI();
}

// ============================================================
// LIVES SYSTEM
// ============================================================
function loseLife() {
    game.lives--;
    updateLivesUI();

    if (game.lives <= 0) {
        gameOver();
    } else {
        // Clear the board but keep going
        arena = createMatrix(ARENA_W, ARENA_H);
        player.matrix = null;
        game.combo = 0;
        playerReset();
    }
}

// ============================================================
// GAME OVER
// ============================================================
function gameOver() {
    game.running = false;
    cancelAnimationFrame(animationId);

    const isNewHigh = recordHighScore();

    document.getElementById('final-score').textContent = game.score;
    document.getElementById('final-lines').textContent = game.lines;
    document.getElementById('final-level').textContent = game.level;
    document.getElementById('final-combo').textContent = 'x' + game.maxCombo;

    const newHsEl = document.getElementById('new-highscore');
    if (isNewHigh) {
        newHsEl.classList.remove('hidden');
        // === CREDIT EARNINGS: New High Score ===
        earnCredits(CREDIT_EARNINGS.HIGH_SCORE, 'New High Score!');
    } else {
        newHsEl.classList.add('hidden');
    }

    hideAllOverlays();
    overlayGameover.classList.remove('hidden');
}

// ============================================================
// PLAYER CONTROLS
// ============================================================
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);

        // Bomb detonation for bomb blocks
        if (isBombPiece(player.matrix)) {
            bombDetonate();
        }

        playerReset();
        arenaSweep();
        updateAllUI();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';

    if (nextPiece === null) {
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    } else {
        player.matrix = nextPiece;
    }

    // Maybe spawn bomb piece (Level 3)
    maybeSpawnBombPiece();

    // For non-bomb pieces, generate next
    if (!isBombPiece(player.matrix)) {
        nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    } else {
        nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    }

    game.totalPieces++;

    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        loseLife();
        return;
    }
    drawNext();
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function hardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    playerDrop();
}

// ============================================================
// GAME LOOP
// ============================================================
function update(time = 0) {
    if (!game.running) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!game.paused) {
        // Zen mode: player controls speed entirely
        if (!game.zenMode) {
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
        }

        // Power-up timer
        if (game.activePowerup === 'slow') {
            game.powerupTimer -= deltaTime;
            if (game.powerupTimer <= 0) {
                game.activePowerup = null;
                puSlowBtn.classList.remove('active');
            }
        }

        // Boss level wall spawning
        if (getCurrentLevel().mechanics.includes('walls')) {
            game.wallTimer += deltaTime;
            if (game.wallTimer >= getCurrentLevel().wallInterval) {
                game.wallTimer = 0;
                spawnBossWall();
            }
        }
    }

    draw();
    animationId = requestAnimationFrame(update);
}

// ============================================================
// UI UPDATES
// ============================================================
function updateAllUI() {
    scoreEl.textContent = game.score;
    linesEl.textContent = game.lines;
    levelEl.textContent = game.level;
    levelNameEl.textContent = getCurrentLevel().name;
    comboEl.textContent = game.combo > 0 ? 'x' + game.combo : 'x1';
    updateLivesUI();
    updatePowerupUI();
    updateHighScoreDisplay();
    updateLevelProgressUI();
}

function updateLivesUI() {
    const totalLives = MAX_LIVES + wallet.extraLivesPurchased;
    let hearts = '';
    for (let i = 0; i < totalLives; i++) {
        hearts += i < game.lives ? '❤️' : '🖤';
    }
    livesEl.textContent = hearts;
}

function updatePowerupUI() {
    puSlowCount.textContent = game.powerups.slow;
    puClearCount.textContent = game.powerups.clear;
    puBombCount.textContent = game.powerups.bomb;
    puSlowBtn.disabled = game.powerups.slow <= 0;
    puClearBtn.disabled = game.powerups.clear <= 0;
    puBombBtn.disabled = game.powerups.bomb <= 0;
}

function updateLevelProgressUI() {
    const level = getCurrentLevel();
    let linesInLevel = game.lines;
    if (game.level > 1) {
        let prevTotal = 0;
        for (let i = 0; i < game.level - 1; i++) {
            prevTotal += LEVELS[i].linesNeeded;
        }
        linesInLevel = game.lines - prevTotal;
    }
    linesInLevel = Math.max(0, linesInLevel);

    const needed = level.linesNeeded;
    const pct = Math.min(100, (linesInLevel / needed) * 100);
    progressBar.style.width = pct + '%';
    if (needed >= 999) {
        progressText.textContent = `${linesInLevel} lines`;
    } else {
        progressText.textContent = `${linesInLevel} / ${needed} lines`;
    }
}

function hideAllOverlays() {
    [overlayStart, overlayPause, overlayGameover, overlayLevelup,
     overlaySaves, overlayHighscores, overlaySkins, overlayStore].forEach(o => {
        o.classList.add('hidden');
    });
}

// ============================================================
// SAVE/LOAD UI
// ============================================================
function renderSaveSlots() {
    const container = document.getElementById('save-slots');
    container.innerHTML = '';
    const slots = getSaveSlots();

    for (let i = 1; i <= SAVE_SLOTS; i++) {
        const key = `slot_${i}`;
        const state = slots[key];
        const div = document.createElement('div');
        div.className = 'save-slot';

        if (state) {
            const date = new Date(state.timestamp).toLocaleDateString();
            div.innerHTML = `
                <div class="slot-info">
                    <div class="slot-name">Slot ${i}</div>
                    <div class="slot-details">Lvl ${state.level} | Score ${state.score} | ${state.lines} lines | ${date}</div>
                </div>
                <div class="slot-actions">
                    <button class="slot-save-btn" data-slot="${i}">Save</button>
                    <button class="slot-load-btn" data-slot="${i}">Load</button>
                    <button class="slot-delete-btn" data-slot="${i}">✕</button>
                </div>`;
        } else {
            div.innerHTML = `
                <div class="slot-info">
                    <div class="slot-name">Slot ${i}</div>
                    <div class="slot-details">Empty</div>
                </div>
                <div class="slot-actions">
                    <button class="slot-save-btn" data-slot="${i}">Save</button>
                </div>`;
        }
        container.appendChild(div);
    }

    // Event delegation
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const slot = parseInt(e.target.dataset.slot);
            if (e.target.classList.contains('slot-save-btn')) {
                saveGame(slot);
                renderSaveSlots();
            } else if (e.target.classList.contains('slot-load-btn')) {
                hideAllOverlays();
                loadGame(slot);
            } else if (e.target.classList.contains('slot-delete-btn')) {
                deleteSave(slot);
                renderSaveSlots();
            }
        });
    });
}

// ============================================================
// HIGH SCORES UI
// ============================================================
function renderHighScores() {
    const container = document.getElementById('highscores-list');
    const scores = loadHighScores();
    container.innerHTML = '';

    if (scores.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;">No high scores yet!</p>';
        return;
    }

    scores.slice(0, 10).forEach((s, i) => {
        const date = new Date(s.date).toLocaleDateString();
        const rankEmojis = ['🥇', '🥈', '🥉'];
        const rank = i < 3 ? rankEmojis[i] : `#${i + 1}`;
        const div = document.createElement('div');
        div.className = 'hs-entry';
        div.innerHTML = `
            <span class="hs-rank">${rank}</span>
            <span class="hs-score">${s.score}</span>
            <span class="hs-details">Lvl ${s.level} | ${s.lines} lines | ${date}</span>`;
        container.appendChild(div);
    });
}

// ============================================================
// STORE SYSTEM
// ============================================================
function renderStore() {
    const container = document.getElementById('store-list');
    container.innerHTML = '';
    document.getElementById('store-credits').textContent = wallet.credits;

    STORE_ITEMS.forEach(item => {
        const div = document.createElement('div');
        div.className = 'store-item';

        let owned = false;
        let btnHtml = '';

        if (item.type === 'skin') {
            owned = wallet.ownedSkins.includes(item.skinId);
            if (owned) {
                div.classList.add('owned');
                btnHtml = `<button class="store-buy-btn owned-btn" disabled>✓ Owned</button>`;
            } else if (wallet.credits >= item.cost) {
                btnHtml = `<button class="store-buy-btn" data-item="${item.id}">Buy 🪙${item.cost}</button>`;
            } else {
                btnHtml = `<button class="store-buy-btn" disabled>Need 🪙${item.cost}</button>`;
            }
        } else if (item.type === 'consumable') {
            btnHtml = wallet.credits >= item.cost
                ? `<button class="store-buy-btn" data-item="${item.id}">Buy 🪙${item.cost}</button>`
                : `<button class="store-buy-btn" disabled>Need 🪙${item.cost}</button>`;
        } else if (item.type === 'permanent') {
            if (item.id === 'save_slot') {
                const maxSlots = getExtraSaveSlots();
                if (maxSlots >= 7) {
                    div.classList.add('owned');
                    btnHtml = `<button class="store-buy-btn owned-btn" disabled>✓ Max Slots</button>`;
                } else if (wallet.credits >= item.cost) {
                    btnHtml = `<button class="store-buy-btn" data-item="${item.id}">Buy 🪙${item.cost}</button>`;
                } else {
                    btnHtml = `<button class="store-buy-btn" disabled>Need 🪙${item.cost}</button>`;
                }
            }
        }

        div.innerHTML = `
            <div class="store-item-icon">${item.icon}</div>
            <div class="store-item-name">${item.name}</div>
            <div class="store-item-desc">${item.desc}</div>
            <div class="store-item-cost">🪙 ${item.cost}</div>
            ${btnHtml}`;

        container.appendChild(div);
    });

    // Bind buy buttons
    container.querySelectorAll('.store-buy-btn[data-item]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.item;
            purchaseStoreItem(itemId);
        });
    });
}

function purchaseStoreItem(itemId) {
    const item = STORE_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (!spendCredits(item.cost, item.name)) {
        showCreditPopup(0, 'Not enough credits!');
        return;
    }

    if (item.type === 'skin') {
        wallet.ownedSkins.push(item.skinId);
        syncSkinUnlocks();
        showCreditPopup(0, `${item.name} Unlocked! 🎉`);
    } else if (item.id === 'extra_life') {
        wallet.extraLivesPurchased++;
        showCreditPopup(0, '+1 Extra Life! 💖');
    } else if (item.id === 'save_slot') {
        wallet.saveSlotsUnlocked++;
        showCreditPopup(0, 'Save Slot Unlocked! 💾');
    } else if (item.id === 'powerup_pack') {
        // Grant 3 random power-ups
        for (let i = 0; i < 3; i++) {
            grantRandomPowerup();
        }
        showCreditPopup(0, '3 Power-Ups Granted! ⚡');
    }

    saveWallet();
    renderStore();
}

// ============================================================
// SKINS UI (Updated with credit-based unlock)
// ============================================================
function renderSkins() {
    const container = document.getElementById('skins-list');
    container.innerHTML = '';

    SKIN_PACKS.forEach(pack => {
        const div = document.createElement('div');
        div.className = 'skin-pack' +
            (pack.id === activeSkinId ? ' selected' : '') +
            (!pack.unlocked ? ' locked' : '');

        let statusHtml = '';
        if (pack.id === activeSkinId) {
            statusHtml = '<div class="skin-status unlocked">✓ Active</div>';
        } else if (!pack.unlocked) {
            const cost = CREDIT_COSTS.SKIN_PACK[pack.id] || 1000;
            statusHtml = `<div class="skin-status premium">🔒 ${cost} Credits</div>`;
        } else {
            statusHtml = '<div class="skin-status unlocked">Unlocked</div>';
        }

        const emojis = Object.values(pack.emojis).join(' ');
        div.innerHTML = `
            <div class="skin-emojis">${emojis}</div>
            <div class="skin-name">${pack.name}</div>
            ${statusHtml}`;

        div.addEventListener('click', () => {
            if (pack.unlocked) {
                activeSkinId = pack.id;
                localStorage.setItem('catris_skin', activeSkinId);
                renderSkins();
            } else {
                // Redirect to store
                overlaySkins.classList.add('hidden');
                renderStore();
                overlayStore.classList.remove('hidden');
            }
        });

        container.appendChild(div);
    });
}

// ============================================================
// GAME START / RESET
// ============================================================
function startGame() {
    game.level = 1;
    game.score = 0;
    game.lines = 0;
    game.combo = 0;
    game.maxCombo = 0;
    game.lives = MAX_LIVES + wallet.extraLivesPurchased;
    game.totalPieces = 0;
    game.bombPiecesSpawned = 0;
    game.powerups = { slow: 0, clear: 0, bomb: 0 };
    game.activePowerup = null;
    game.powerupTimer = 0;
    game.running = false;
    game.paused = false;
    game.zenMode = false;
    game.wallTimer = 0;

    arena = createMatrix(ARENA_W, ARENA_H);
    player.matrix = null;
    nextPiece = null;
    dropCounter = 0;
    bossWallPhase = 0;

    applyLevelState();
    updateAllUI();

    hideAllOverlays();
    game.running = true;
    lastTime = performance.now();
    cancelAnimationFrame(animationId);
    playerReset();
    update(lastTime);
}

// ============================================================
// KEYBOARD CONTROLS
// ============================================================
document.addEventListener('keydown', event => {
    // Pause toggle
    if (event.keyCode === 27) { // ESC
        event.preventDefault();
        if (game.running) {
            game.paused = !game.paused;
            if (game.paused) {
                hideAllOverlays();
                overlayPause.classList.remove('hidden');
            } else {
                hideAllOverlays();
            }
        }
        return;
    }

    if (!game.running || game.paused) return;

    switch (event.keyCode) {
        case 37: playerMove(-1); break; // Left
        case 39: playerMove(1); break;  // Right
        case 40: playerDrop(); break;   // Soft drop
        case 38: playerRotate(1); break; // Rotate
        case 32: hardDrop(); break;     // Hard drop

        // Power-ups
        case 49: activatePowerup('slow'); break;  // 1
        case 50: activatePowerup('clear'); break; // 2
        case 51: activatePowerup('bomb'); break;  // 3
    }
});

// ============================================================
// BUTTON EVENT HANDLERS
// ============================================================
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('retry-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
    hideAllOverlays();
    overlayStart.classList.remove('hidden');
    game.running = false;
    cancelAnimationFrame(animationId);
});

document.getElementById('resume-btn').addEventListener('click', () => {
    game.paused = false;
    hideAllOverlays();
    lastTime = performance.now();
});

document.getElementById('save-btn-pause').addEventListener('click', () => {
    renderSaveSlots();
    overlaySaves.classList.remove('hidden');
});
document.getElementById('close-saves-btn').addEventListener('click', () => {
    overlaySaves.classList.add('hidden');
    if (game.paused) overlayPause.classList.remove('hidden');
});

document.getElementById('load-btn').addEventListener('click', () => {
    renderSaveSlots();
    overlaySaves.classList.remove('hidden');
});
document.getElementById('quit-btn').addEventListener('click', () => {
    game.running = false;
    game.paused = false;
    cancelAnimationFrame(animationId);
    hideAllOverlays();
    overlayStart.classList.remove('hidden');
});

document.getElementById('highscores-btn').addEventListener('click', () => {
    renderHighScores();
    overlayHighscores.classList.remove('hidden');
});
document.getElementById('close-highscores-btn').addEventListener('click', () => {
    overlayHighscores.classList.add('hidden');
});

document.getElementById('skins-btn').addEventListener('click', () => {
    renderSkins();
    overlaySkins.classList.remove('hidden');
});
document.getElementById('close-skins-btn').addEventListener('click', () => {
    overlaySkins.classList.add('hidden');
});

document.getElementById('store-btn').addEventListener('click', () => {
    renderStore();
    overlayStore.classList.remove('hidden');
});
document.getElementById('close-store-btn').addEventListener('click', () => {
    overlayStore.classList.add('hidden');
});

document.getElementById('levelup-btn').addEventListener('click', advanceToNextLevel);

// Power-up button clicks
puSlowBtn.addEventListener('click', () => activatePowerup('slow'));
puClearBtn.addEventListener('click', () => activatePowerup('clear'));
puBombBtn.addEventListener('click', () => activatePowerup('bomb'));

// Donate button
document.getElementById('donate-btn').addEventListener('click', () => {
    window.open('https://ko-fi.com/sophi', '_blank');
});

// ============================================================
// MOBILE & RESPONSIVE CANVAS
// ============================================================
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768);

function resizeCanvas() {
    const mainStage = document.querySelector('.main-stage');
    if (!mainStage) return;

    const containerWidth = mainStage.parentElement.clientWidth;
    const isSmallScreen = window.innerWidth <= 768;

    if (isSmallScreen) {
        // On mobile, canvas fills available width (with some padding)
        const maxW = Math.min(containerWidth - 16, 300);
        canvas.style.width = maxW + 'px';
        canvas.style.height = (maxW * (ARENA_H / ARENA_W)) + 'px';
        canvas.width = ARENA_W * 20;
        canvas.height = ARENA_H * 20;
    } else {
        // Desktop: fixed size
        canvas.style.width = '';
        canvas.style.height = '';
        canvas.width = 240;
        canvas.height = 400;
    }
    context.scale(20, 20);
}

// Debounced resize
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resizeCanvas();
    }, 150);
});
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 300);
});

// ============================================================
// TOUCH CONTROLS — Swipe gestures on canvas
// ============================================================
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const SWIPE_THRESHOLD = 30;
const TAP_THRESHOLD = 10;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!game.running || game.paused) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Tap to rotate (short touch, small movement)
    if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD && dt < 300) {
        playerRotate(1);
        return;
    }

    // Swipe detection
    if (absDx > SWIPE_THRESHOLD || absDy > SWIPE_THRESHOLD) {
        if (absDx > absDy) {
            // Horizontal swipe
            if (dx > 0) {
                playerMove(1);  // right
            } else {
                playerMove(-1); // left
            }
        } else {
            // Vertical swipe
            if (dy > 0) {
                playerDrop();   // swipe down = soft drop
            }
        }
    }
}, { passive: false });

// ============================================================
// ON-SCREEN BUTTON CONTROLS (Mobile)
// ============================================================
function setupTouchButton(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return;

    // Use mousedown for immediate response (no 300ms delay)
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (!game.running || game.paused) return;
        action();
    });
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!game.running || game.paused) return;
        action();
    }, { passive: false });
}

setupTouchButton('touch-left', () => playerMove(-1));
setupTouchButton('touch-right', () => playerMove(1));
setupTouchButton('touch-down', () => playerDrop());
setupTouchButton('touch-rotate', () => playerRotate(1));
setupTouchButton('touch-hard-drop', () => hardDrop());

// Touch power-up buttons
setupTouchButton('touch-pu-slow', () => activatePowerup('slow'));
setupTouchButton('touch-pu-clear', () => activatePowerup('clear'));
setupTouchButton('touch-pu-bomb', () => activatePowerup('bomb'));

// Repeating hold for left/right/down
function startHold(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return;

    let holdInterval = null;
    const startHoldAction = (e) => {
        e.preventDefault();
        if (!game.running || game.paused) return;
        action();
        holdInterval = setInterval(() => {
            if (!game.running || game.paused) { clearInterval(holdInterval); return; }
            action();
        }, 100);
    };
    const stopHold = () => { if (holdInterval) { clearInterval(holdInterval); holdInterval = null; } };

    btn.addEventListener('mousedown', startHoldAction);
    btn.addEventListener('touchstart', startHoldAction, { passive: false });
    btn.addEventListener('mouseup', stopHold);
    btn.addEventListener('mouseleave', stopHold);
    btn.addEventListener('touchend', stopHold);
    btn.addEventListener('touchcancel', stopHold);
}
startHold('touch-left', () => playerMove(-1));
startHold('touch-right', () => playerMove(1));
startHold('touch-down', () => playerDrop());

// ============================================================
// INIT
// ============================================================
loadWallet();
syncSkinUnlocks();
updateCreditUI();
updateHighScoreDisplay();
updateLivesUI();
checkDailyLogin();
resizeCanvas();
