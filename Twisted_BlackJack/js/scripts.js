// --- Sound System Setup ---
const sounds = {
    deal: new Audio('assets/SND_CARD_DEAL.wav'),
    hover: new Audio('assets/SND_UI_HOVER.wav'),
    select: new Audio('assets/SND_UI_SELECT.wav'),
    reveal: new Audio('assets/SND_REVEAL.wav'),
    multUp: new Audio('assets/SND_MULT_UP.wav'),
    win: new Audio('assets/SND_WIN.wav'),
    lose: new Audio('assets/SND_LOSE.wav'),
    damage: new Audio('assets/SND_DAMAGE.wav'),
    shopOpen: new Audio('assets/SND_SHOP_OPEN.wav'),
    blackjack: new Audio('assets/SND_BLACKJACK.wav')
};

// Global audio volume configuration
Object.values(sounds).forEach(snd => snd.volume = 0.5);

function playSound(name) {
    if (!sounds[name]) return;
    const s = sounds[name].cloneNode(); // Clone allows overlapping sounds
    s.volume = sounds[name].volume;
    
    // Slight pitch randomization for card dealing to prevent audio fatigue
    if (name === 'deal') {
        s.playbackRate = 0.9 + (Math.random() * 0.2); 
    }
    s.play().catch(() => {}); // Catch prevents errors before user interacts with DOM
}

// Global hover listener for all buttons (including dynamically created shop buttons)
document.body.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
        playSound('hover');
    }
});


// DOM Elements
const menuOverlay = document.getElementById('menu-overlay');
const shopOverlay = document.getElementById('shop-overlay');
const startBtn = document.getElementById('start-btn');
const shopBtn = document.getElementById('shop-btn');
const closeShopBtn = document.getElementById('close-shop-btn');

const multDisplay = document.getElementById('mult-number');
const multBox = document.getElementById('mult');
const messageDisplay = document.getElementById('message');
const playerArea = document.getElementById('player-area');
const cpuArea = document.getElementById('cpu-area');
const playerExitScore = document.getElementById('player-score');
const cpuExitScore = document.getElementById('cpu-score');
const btnHit = document.getElementById('hit');
const btnStand = document.getElementById('stand');

// Economy & Progress State
let gold = 0;
let ownedDecks = ['default'];
let equippedDeck = 'default';

// Shop Items Setup
const deckShop = [
    { id: 'default', name: 'Standard', cost: 0, filter: 'none', desc: 'Standard 52-card deck.', exclude: [] },
    { id: 'cyan', name: 'Cyan Glow', cost: 50, filter: 'sepia(1) hue-rotate(150deg) saturate(5) brightness(1.2)', desc: 'Removes 2s and 3s.', exclude: ['2', '3'] },
    { id: 'red', name: 'Blood Red', cost: 50, filter: 'sepia(1) hue-rotate(320deg) saturate(10) brightness(0.8)', desc: 'Removes 8s and 9s.', exclude: ['8', '9'] },
    { id: 'pink', name: 'Hot Pink', cost: 100, filter: 'sepia(1) hue-rotate(290deg) saturate(5) brightness(1.2)', desc: 'Removes all 10s.', exclude: ['10'] },
    { id: 'purple', name: 'Deep Void', cost: 100, filter: 'sepia(1) hue-rotate(250deg) saturate(7) brightness(1.1)', desc: 'Removes Face Cards (J,Q,K).', exclude: ['Jack', 'Queen', 'King'] },
    { id: 'green', name: 'Toxic Green', cost: 150, filter: 'sepia(1) hue-rotate(80deg) saturate(5) brightness(1.2)', desc: 'Removes 2, 3, and 4.', exclude: ['2', '3', '4'] },
    { id: 'ghost', name: 'Ghost Protocol', cost: 150, filter: 'grayscale(100%) brightness(2) contrast(1.5)', desc: 'Removes 5, 6, and 7.', exclude: ['5', '6', '7'] },
    { id: 'gold', name: 'Midas Touch', cost: 300, filter: 'sepia(1) hue-rotate(40deg) saturate(10) brightness(1.5)', desc: 'Removes 2, 3, 4, and 5.', exclude: ['2', '3', '4', '5'] },
    { id: 'matrix', name: 'The Matrix', cost: 500, filter: 'invert(1) hue-rotate(180deg) brightness(1.2)', desc: 'High Rollers: Only 10+, Faces, Aces.', exclude: ['2', '3', '4', '5', '6', '7', '8', '9'] }
];

// Game state
let multiplier = 1;
let playerRed = 0;
let cpuRed = 0;
let deck = [];
let playerHand = [];
let cpuHand = [];
let isGameOver = true;

const cardTypes = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

// -------------------- Core Logic & Overlays --------------------
startBtn.addEventListener('click', () => {
    playSound('select');
    menuOverlay.style.opacity = '0';
    setTimeout(() => {
        menuOverlay.style.display = 'none';
        initGame();
    }, 500);
});

document.getElementById('restart').addEventListener('click', () => {
    playSound('select');
    gold = 10000;
    ownedDecks = ['default'];
    equipDeck('default');
    menuOverlay.style.display = 'flex';
    menuOverlay.style.opacity = '1';
});

// -------------------- Shop Logic --------------------
shopBtn.addEventListener('click', () => {
    playSound('shopOpen');
    renderShop();
    shopOverlay.style.display = 'flex';
});

closeShopBtn.addEventListener('click', () => {
    playSound('select');
    shopOverlay.style.display = 'none';
});

function renderShop() {
    document.getElementById('shop-gold-count').textContent = gold;
    const shopContainer = document.getElementById('shop-items');
    shopContainer.innerHTML = '';

    deckShop.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        
        const isOwned = ownedDecks.includes(item.id);
        const isEquipped = equippedDeck === item.id;

        let btnHTML = '';
        if (isEquipped) {
            btnHTML = `<button class="shop-btn btn-equipped" disabled>EQUIPPED</button>`;
        } else if (isOwned) {
            btnHTML = `<button class="shop-btn btn-equip" onclick="equipDeck('${item.id}')">EQUIP</button>`;
        } else {
            btnHTML = `<button class="shop-btn btn-buy" onclick="buyDeck('${item.id}')">BUY</button>`;
        }

        itemDiv.innerHTML = `
            <h3>${item.name}</h3>
            <div class="preview-card" style="filter: ${item.filter}"></div>
            <div class="shop-desc">${item.desc}</div>
            <div class="shop-cost">${item.cost > 0 ? item.cost + 'G' : 'FREE'}</div>
            ${btnHTML}
        `;
        shopContainer.appendChild(itemDiv);
    });
}

window.buyDeck = function(id) {
    const item = deckShop.find(d => d.id === id);
    if (gold >= item.cost) {
        playSound('select');
        gold -= item.cost;
        ownedDecks.push(item.id);
        updateGoldDisplay();
        renderShop();
    } else {
        playSound('lose');
        alert("INSUFFICIENT GOLD!");
    }
};

window.equipDeck = function(id) {
    const item = deckShop.find(d => d.id === id);
    if (ownedDecks.includes(id)) {
        playSound('select');
        equippedDeck = id;
        document.documentElement.style.setProperty('--card-color-filter', item.filter);
        renderShop();
    }
};

function updateGoldDisplay() {
    document.getElementById('gold-count').textContent = gold;
}

// -------------------- Game Initialisation --------------------
function initGame() {
    multiplier = 1;
    playerRed = 0;
    cpuRed = 0;
    updateGoldDisplay();
    updateUI();
    startRound();
}

function createDeck() {
    let newDeck = [];
    const currentDeckData = deckShop.find(d => d.id === equippedDeck);
    const excludedCards = currentDeckData ? currentDeckData.exclude : [];

    for (let i = 0; i < 4; i++) {
        for (let type of cardTypes) {
            if (!excludedCards.includes(type)) {
                newDeck.push(type);
            }
        }
    }
    return newDeck;
}

function startRound() {
    isGameOver = true; 
    toggleButtons(true);
    playerHand = [];
    cpuHand = [];

    Array.from(playerArea.children).forEach(child => {
        if (child.className.includes('card')) child.remove();
    });
    Array.from(cpuArea.children).forEach(child => {
        if (child.className.includes('card')) child.remove();
    });

    messageDisplay.textContent = "DEALING...";
    messageDisplay.style.color = "white";
    messageDisplay.style.textShadow = "0 0 20px white"; 

    deck = createDeck();
    shuffle(deck);

    setTimeout(() => dealCard('player'), 100);
    setTimeout(() => dealCard('cpu', true), 300);
    setTimeout(() => dealCard('player'), 500);
    setTimeout(() => dealCard('cpu'), 700);
    setTimeout(() => checkInitialBlackjack(), 1000);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function dealCard(target, isHidden = false) {
    if (deck.length === 0) return;

    const val = deck.pop();
    const cardDiv = document.createElement('div');
    
    cardDiv.className = `card card-${val}`; 
    cardDiv.dataset.val = val; 
    
    if (isHidden) {
        cardDiv.classList.add('card-hidden');
        cardDiv.style.backgroundImage = 'none'; 
        cardDiv.id = 'cpu-hidden-card';
    } else {
        cardDiv.style.backgroundImage = `url('assets/${val}.png')`;
    }

    if (target === 'player') {
        playerHand.push(val);
        playerArea.appendChild(cardDiv);
    } else {
        cpuHand.push(val);
        cpuArea.appendChild(cardDiv);
    }

    playSound('deal');
    updateScoreUI();

    if (target === 'player' && !isHidden && !isGameOver) {
        if (getScore(playerHand) > 21) {
            isGameOver = true;
            toggleButtons(true);
            setTimeout(() => {
                revealCpuCard();
                endRound('cpu'); 
            }, 500);
        }
    }
}

function revealCpuCard() {
    const hiddenCard = document.querySelector('.card-hidden');
    if (hiddenCard) {
        playSound('reveal');
        hiddenCard.classList.remove('card-hidden');
        hiddenCard.style.backgroundImage = `url('assets/${hiddenCard.dataset.val}.png')`;
    }
    updateScoreUI();
}

function getScore(hand) {
    let score = 0;
    let aces = 0;

    for (let card of hand) {
        if (card === 'Jack' || card === 'Queen' || card === 'King') {
            score += 10;
        } else if (card === 'Ace') {
            score += 11;
            aces += 1;
        } else {
            score += parseInt(card);
        }
    }

    while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
    }
    return score;
}

function updateScoreUI() {
    playerExitScore.textContent = `PLAYER: ${getScore(playerHand)}`;
    
    let cpuDisplayScore = 0;
    const hiddenCard = document.querySelector('.card-hidden');

    if (hiddenCard) {
        const visibleCards = cpuHand.filter((card, index) => {
            const cardElement = cpuArea.querySelectorAll('.card')[index];
            return cardElement && !cardElement.classList.contains('card-hidden');
        });
        cpuDisplayScore = getScore(visibleCards);
    } else {
        cpuDisplayScore = getScore(cpuHand);
    }
    
    cpuExitScore.textContent = `CPU: ${cpuDisplayScore}`;
}

function checkInitialBlackjack() {
    const pScore = getScore(playerHand);
    const cScore = getScore(cpuHand);
    
    if (pScore === 21 && cScore === 21) {
        revealCpuCard();
        setTimeout(() => endRound('draw'), 1000);
    } else if (pScore === 21) {
        playSound('blackjack');
        revealCpuCard();
        messageDisplay.textContent = "BLACKJACK!";
        messageDisplay.style.color = "#fdf500";
        setTimeout(() => endRound('player'), 1200);
    } else if (cScore === 21) {
        playSound('lose');
        revealCpuCard();
        messageDisplay.textContent = "CPU BLACKJACK!";
        messageDisplay.style.color = "#ff0055";
        setTimeout(() => endRound('cpu'), 1200);
    } else {
        isGameOver = false;
        toggleButtons(false);
        messageDisplay.textContent = "YOUR TURN";
        messageDisplay.style.color = "white";
        messageDisplay.style.textShadow = "0 0 20px white"; 
    }
}

function updateUI() {
    multDisplay.textContent = multiplier + "x";
    document.documentElement.style.setProperty('--mult-intensity', multiplier);

    if (multiplier >= 5) {
        multBox.style.borderColor = '#ff0055'; 
        multBox.style.boxShadow = '0 0 50px rgba(255,0,85,0.6), inset 0 0 30px rgba(255,0,85,0.4)';
        multDisplay.style.color = '#ff0055';
        multDisplay.style.textShadow = '0 0 25px #ff0055';
    } else if (multiplier >= 3) {
        multBox.style.borderColor = '#ff8a00'; 
        multBox.style.boxShadow = '0 0 50px rgba(255,138,0,0.6), inset 0 0 30px rgba(255,138,0,0.4)';
        multDisplay.style.color = '#ff8a00';
        multDisplay.style.textShadow = '0 0 25px #ff8a00';
    } else {
        multBox.style.borderColor = '#00f3ff'; 
        multBox.style.boxShadow = '0 0 50px rgba(0,243,255,0.6), inset 0 0 30px rgba(0,243,255,0.4)';
        multDisplay.style.color = '#00f3ff';
        multDisplay.style.textShadow = '0 0 25px #00f3ff';
    }

    const pYellow = Math.min(playerRed + multiplier, 10);
    document.querySelector('#player-bar').style.setProperty('--stage-red', playerRed);
    document.querySelector('#player-bar').style.setProperty('--stage-yellow', pYellow);

    const cYellow = Math.min(cpuRed + multiplier, 10);
    document.querySelector('#cpu-bar').style.setProperty('--stage-red', cpuRed);
    document.querySelector('#cpu-bar').style.setProperty('--stage-yellow', cYellow);
}

function toggleButtons(disabled) {
    btnHit.disabled = disabled;
    btnStand.disabled = disabled;
}

btnHit.addEventListener('click', () => {
    if (isGameOver) return;
    playSound('select');
    dealCard('player');
});

btnStand.addEventListener('click', () => {
    if (isGameOver) return;
    playSound('select');
    isGameOver = true;
    toggleButtons(true);
    cpuTurnSequence();
});

function cpuTurnSequence() {
    messageDisplay.textContent = "CPU TURN...";
    revealCpuCard();
    
    function drawNext() {
        if (getScore(cpuHand) < 17 && deck.length > 0) {
            dealCard('cpu');
            setTimeout(drawNext, 600); 
        } else {
            finalizeRound();
        }
    }
    setTimeout(drawNext, 600);
}

function finalizeRound() {
    const pScore = getScore(playerHand);
    const cScore = getScore(cpuHand);

    if (cScore > 21 || pScore > cScore) {
        endRound('player');
    } else if (cScore > pScore) {
        endRound('cpu');
    } else {
        endRound('draw');
    }
}

// -------------------- Round Resolution & Progression --------------------
function endRound(winner) {
    isGameOver = true;
    toggleButtons(true);

    if (winner === 'player') {
        playSound('win');
        cpuRed = Math.min(cpuRed + multiplier, 10);
        
        const earnedGold = getScore(playerHand);
        gold += earnedGold;
        updateGoldDisplay();

        messageDisplay.innerHTML = `CPU TAKES ${multiplier} DMG!<br><span style="font-size: 1rem; color: var(--neon-yellow);">+${earnedGold} GOLD</span>`;
        messageDisplay.style.color = "#39ff14"; 
        messageDisplay.style.textShadow = "0 0 25px #39ff14";
        triggerDamage('cpu');
    } else if (winner === 'cpu') {
        playSound('lose');
        playerRed = Math.min(playerRed + multiplier, 10);
        messageDisplay.textContent = `PLAYER TAKES ${multiplier} DMG!`;
        messageDisplay.style.color = "#ff0055"; 
        messageDisplay.style.textShadow = "0 0 25px #ff0055";
        triggerDamage('player');
    } else { 
        playSound('multUp');
        messageDisplay.textContent = "DRAW! MULTIPLIER RISES!";
        messageDisplay.style.color = "#fdf500"; 
        messageDisplay.style.textShadow = "0 0 25px #fdf500";
    }

    multiplier++;
    updateUI();

    if (cpuRed >= 10) {
        setTimeout(() => {
            playSound('blackjack');
            messageDisplay.textContent = "CPU DESTROYED! NEXT OPPONENT...";
            messageDisplay.style.color = "white";
            messageDisplay.style.textShadow = "0 0 25px white";
        }, 1500);
        setTimeout(() => {
            cpuRed = 0;
            multiplier = 1;
            updateUI();
            startRound();
        }, 4000);
    } else if (playerRed >= 10) {
        setTimeout(() => {
            playSound('lose');
            messageDisplay.textContent = "K.O. - SYSTEM FAILURE";
            messageDisplay.style.color = "#ff0055";
            messageDisplay.style.textShadow = "0 0 25px #ff0055";
        }, 1500);
        setTimeout(() => {
            menuOverlay.style.display = 'flex';
            menuOverlay.style.opacity = '1';
        }, 3000);
    } else {
        setTimeout(startRound, 2500);
    }
}

// -------------------- Visual Effects --------------------
function triggerDamage(target) {
    playSound('damage');
    document.body.classList.remove('shake-heavy');
    void document.body.offsetWidth; 
    document.body.classList.add('shake-heavy');

    const barId = target === 'player' ? 'player-bar' : 'cpu-bar';
    const barEl = document.getElementById(barId);
    const rect = barEl.getBoundingClientRect();

    const colors = target === 'player' ? ['#ff0055', '#ff2a2a', '#ff7675'] : ['#39ff14', '#00ff88', '#2ecc71'];
    const particleCount = 40 + (multiplier * 5); 

    spawnParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        colors,
        particleCount
    );
}

function spawnParticles(x, y, colors, count) {
    const container = document.getElementById('particles-container');
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'pixel-particle';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        container.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 250 + (multiplier * 15);
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        const spin = Math.random() * 720 - 360;

        const animation = p.animate(
            [
                { transform: `translate(0px, 0px) scale(1) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${spin}deg)`, opacity: 0 }
            ],
            {
                duration: 800 + Math.random() * 600,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1)',
                fill: 'forwards'
            }
        );
        animation.onfinish = () => p.remove();
    }
}