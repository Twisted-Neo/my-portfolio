// -------------------- Sound System --------------------
const SOUNDS = {
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

Object.values(SOUNDS).forEach(s => s.volume = 0.5);

const playSound = (name) => {
    const original = SOUNDS[name];
    if (!original) return;
    const clone = original.cloneNode();
    clone.volume = original.volume;
    if (name === 'deal') clone.playbackRate = 0.9 + Math.random() * 0.2;
    clone.play().catch(() => {});
};

// Global hover for all buttons
document.body.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'BUTTON' && !e.target.disabled) playSound('hover');
});

// -------------------- DOM Elements --------------------
const DOM = {
    menuOverlay: document.getElementById('menu-overlay'),
    shopOverlay: document.getElementById('shop-overlay'),
    startBtn: document.getElementById('start-btn'),
    shopBtn: document.getElementById('shop-btn'),
    closeShopBtn: document.getElementById('close-shop-btn'),
    multDisplay: document.getElementById('mult-number'),
    multBox: document.getElementById('mult'),
    message: document.getElementById('message'),
    playerArea: document.getElementById('player-area'),
    cpuArea: document.getElementById('cpu-area'),
    playerScore: document.getElementById('player-score'),
    cpuScore: document.getElementById('cpu-score'),
    hit: document.getElementById('hit'),
    stand: document.getElementById('stand'),
    goldCount: document.getElementById('gold-count'),
    shopGold: document.getElementById('shop-gold-count'),
    shopItems: document.getElementById('shop-items'),
    playerBar: document.querySelector('#player-bar'),
    cpuBar: document.querySelector('#cpu-bar')
};

// -------------------- Game State --------------------
let gold = 0;
let ownedDecks = ['default'];
let equippedDeck = 'default';
let multiplier = 1;
let playerRed = 0;
let cpuRed = 0;
let deck = [];
let playerHand = [];
let cpuHand = [];
let isGameOver = true;

const CARD_TYPES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

const DECK_SHOP = [
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

// -------------------- Helper Functions --------------------
const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
};

const updateGoldDisplay = () => {
    DOM.goldCount.textContent = gold;
    if (DOM.shopGold) DOM.shopGold.textContent = gold;
};

const getScore = (hand) => {
    let score = 0, aces = 0;
    for (const card of hand) {
        if (card === 'Jack' || card === 'Queen' || card === 'King') score += 10;
        else if (card === 'Ace') { score += 11; aces++; }
        else score += parseInt(card);
    }
    while (score > 21 && aces--) score -= 10;
    return score;
};

const createDeck = () => {
    const excluded = DECK_SHOP.find(d => d.id === equippedDeck)?.exclude || [];
    const newDeck = [];
    for (let i = 0; i < 4; i++) {
        for (const type of CARD_TYPES) {
            if (!excluded.includes(type)) newDeck.push(type);
        }
    }
    return newDeck;
};

// -------------------- UI Updates --------------------
const updateScoreUI = () => {
    DOM.playerScore.textContent = `PLAYER: ${getScore(playerHand)}`;
    const hiddenCard = document.querySelector('.card-hidden');
    let cpuVisibleScore = 0;
    if (hiddenCard) {
        // 🔧 FIXED: use DOM.cpuArea instead of undefined cpuArea
        const visibleCards = cpuHand.filter((_, idx) => {
            const cardEl = DOM.cpuArea.querySelectorAll('.card')[idx];
            return cardEl && !cardEl.classList.contains('card-hidden');
        });
        cpuVisibleScore = getScore(visibleCards);
    } else {
        cpuVisibleScore = getScore(cpuHand);
    }
    DOM.cpuScore.textContent = `CPU: ${cpuVisibleScore}`;
};

const updateUI = () => {
    DOM.multDisplay.textContent = `${multiplier}x`;
    document.documentElement.style.setProperty('--mult-intensity', multiplier);

    let borderColor, shadowColor, textColor;
    if (multiplier >= 5) {
        borderColor = '#ff0055';
        shadowColor = 'rgba(255,0,85,0.6)';
        textColor = '#ff0055';
    } else if (multiplier >= 3) {
        borderColor = '#ff8a00';
        shadowColor = 'rgba(255,138,0,0.6)';
        textColor = '#ff8a00';
    } else {
        borderColor = '#00f3ff';
        shadowColor = 'rgba(0,243,255,0.6)';
        textColor = '#00f3ff';
    }
    DOM.multBox.style.borderColor = borderColor;
    DOM.multBox.style.boxShadow = `0 0 50px ${shadowColor}, inset 0 0 30px ${shadowColor.replace('0.6', '0.4')}`;
    DOM.multDisplay.style.color = textColor;
    DOM.multDisplay.style.textShadow = `0 0 25px ${textColor}`;

    const pYellow = Math.min(playerRed + multiplier, 10);
    DOM.playerBar.style.setProperty('--stage-red', playerRed);
    DOM.playerBar.style.setProperty('--stage-yellow', pYellow);

    const cYellow = Math.min(cpuRed + multiplier, 10);
    DOM.cpuBar.style.setProperty('--stage-red', cpuRed);
    DOM.cpuBar.style.setProperty('--stage-yellow', cYellow);
};

const toggleButtons = (disabled) => {
    DOM.hit.disabled = DOM.stand.disabled = disabled;
};

// -------------------- Card Dealing & Visuals --------------------
const dealCard = (target, isHidden = false) => {
    if (!deck.length) return;
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
        DOM.playerArea.appendChild(cardDiv);
    } else {
        cpuHand.push(val);
        DOM.cpuArea.appendChild(cardDiv);
    }

    playSound('deal');
    updateScoreUI();

    if (target === 'player' && !isHidden && !isGameOver && getScore(playerHand) > 21) {
        isGameOver = true;
        toggleButtons(true);
        setTimeout(() => {
            revealCpuCard();
            endRound('cpu');
        }, 500);
    }
};

const revealCpuCard = () => {
    const hidden = document.querySelector('.card-hidden');
    if (hidden) {
        playSound('reveal');
        hidden.classList.remove('card-hidden');
        hidden.style.backgroundImage = `url('assets/${hidden.dataset.val}.png')`;
        updateScoreUI();
    }
};

// -------------------- Round Flow --------------------
const startRound = () => {
    isGameOver = true;
    toggleButtons(true);
    playerHand = [];
    cpuHand = [];
    [...DOM.playerArea.children, ...DOM.cpuArea.children].forEach(child => {
        if (child.classList?.contains('card')) child.remove();
    });

    DOM.message.textContent = "DEALING...";
    DOM.message.style.cssText = "color:white; text-shadow:0 0 20px white";
    deck = createDeck();
    shuffle(deck);

    setTimeout(() => dealCard('player'), 100);
    setTimeout(() => dealCard('cpu', true), 300);
    setTimeout(() => dealCard('player'), 500);
    setTimeout(() => dealCard('cpu'), 700);
    setTimeout(checkInitialBlackjack, 1000);
};

const checkInitialBlackjack = () => {
    const pScore = getScore(playerHand);
    const cScore = getScore(cpuHand);
    if (pScore === 21 && cScore === 21) {
        revealCpuCard();
        setTimeout(() => endRound('draw'), 1000);
    } else if (pScore === 21) {
        playSound('blackjack');
        revealCpuCard();
        DOM.message.textContent = "BLACKJACK!";
        DOM.message.style.cssText = "color:#fdf500; text-shadow:0 0 25px #fdf500";
        setTimeout(() => endRound('player'), 1200);
    } else if (cScore === 21) {
        playSound('lose');
        revealCpuCard();
        DOM.message.textContent = "CPU BLACKJACK!";
        DOM.message.style.cssText = "color:#ff0055; text-shadow:0 0 25px #ff0055";
        setTimeout(() => endRound('cpu'), 1200);
    } else {
        isGameOver = false;
        toggleButtons(false);
        DOM.message.textContent = "YOUR TURN";
        DOM.message.style.cssText = "color:white; text-shadow:0 0 20px white";
    }
};

const cpuTurnSequence = () => {
    DOM.message.textContent = "CPU TURN...";
    revealCpuCard();
    const drawNext = () => {
        if (getScore(cpuHand) < 17 && deck.length) {
            dealCard('cpu');
            setTimeout(drawNext, 600);
        } else {
            const pScore = getScore(playerHand);
            const cScore = getScore(cpuHand);
            if (cScore > 21 || pScore > cScore) endRound('player');
            else if (cScore > pScore) endRound('cpu');
            else endRound('draw');
        }
    };
    setTimeout(drawNext, 600);
};

const endRound = (winner) => {
    isGameOver = true;
    toggleButtons(true);

    if (winner === 'player') {
        playSound('win');
        cpuRed = Math.min(cpuRed + multiplier, 10);
        const earnedGold = getScore(playerHand);
        gold += earnedGold;
        updateGoldDisplay();
        DOM.message.innerHTML = `CPU TAKES ${multiplier} DMG!<br><span style="font-size:1rem;color:var(--neon-yellow);">+${earnedGold} GOLD</span>`;
        DOM.message.style.cssText = "color:#39ff14; text-shadow:0 0 25px #39ff14";
        triggerDamage('cpu');
    } else if (winner === 'cpu') {
        playSound('lose');
        playerRed = Math.min(playerRed + multiplier, 10);
        DOM.message.textContent = `PLAYER TAKES ${multiplier} DMG!`;
        DOM.message.style.cssText = "color:#ff0055; text-shadow:0 0 25px #ff0055";
        triggerDamage('player');
    } else {
        playSound('multUp');
        DOM.message.textContent = "DRAW! MULTIPLIER RISES!";
        DOM.message.style.cssText = "color:#fdf500; text-shadow:0 0 25px #fdf500";
    }

    multiplier++;
    updateUI();

    if (cpuRed >= 10) {
        setTimeout(() => {
            playSound('blackjack');
            DOM.message.textContent = "CPU DESTROYED! NEXT OPPONENT...";
            DOM.message.style.cssText = "color:white; text-shadow:0 0 25px white";
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
            DOM.message.textContent = "K.O. - SYSTEM FAILURE";
            DOM.message.style.cssText = "color:#ff0055; text-shadow:0 0 25px #ff0055";
        }, 1500);
        setTimeout(() => {
            DOM.menuOverlay.style.display = 'flex';
            DOM.menuOverlay.style.opacity = '1';
        }, 3000);
    } else {
        setTimeout(startRound, 2500);
    }
};

// -------------------- Visual Effects (Particles & Shake) --------------------
const triggerDamage = (target) => {
    playSound('damage');
    document.body.classList.remove('shake-heavy');
    void document.body.offsetWidth;
    document.body.classList.add('shake-heavy');

    const bar = document.getElementById(`${target}-bar`);
    const rect = bar.getBoundingClientRect();
    const colors = target === 'player' ? ['#ff0055', '#ff2a2a', '#ff7675'] : ['#39ff14', '#00ff88', '#2ecc71'];
    const count = 40 + multiplier * 5;

    const container = document.getElementById('particles-container');
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'pixel-particle';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = rect.left + rect.width / 2 + 'px';
        p.style.top = rect.top + rect.height / 2 + 'px';
        container.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 250 + multiplier * 15;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        const spin = Math.random() * 720 - 360;

        const anim = p.animate(
            [
                { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${spin}deg)`, opacity: 0 }
            ],
            { duration: 800 + Math.random() * 600, easing: 'cubic-bezier(0.175,0.885,0.32,1)', fill: 'forwards' }
        );
        anim.onfinish = () => p.remove();
    }
};

// -------------------- Shop System --------------------
const renderShop = () => {
    if (DOM.shopGold) DOM.shopGold.textContent = gold;
    DOM.shopItems.innerHTML = '';
    DECK_SHOP.forEach(item => {
        const isOwned = ownedDecks.includes(item.id);
        const isEquipped = equippedDeck === item.id;
        let btnHTML = '';
        if (isEquipped) btnHTML = `<button class="shop-btn btn-equipped" disabled>EQUIPPED</button>`;
        else if (isOwned) btnHTML = `<button class="shop-btn btn-equip" onclick="equipDeck('${item.id}')">EQUIP</button>`;
        else btnHTML = `<button class="shop-btn btn-buy" onclick="buyDeck('${item.id}')">BUY</button>`;

        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <h3>${item.name}</h3>
            <div class="preview-card" style="filter: ${item.filter}"></div>
            <div class="shop-desc">${item.desc}</div>
            <div class="shop-cost">${item.cost > 0 ? item.cost + 'G' : 'FREE'}</div>
            ${btnHTML}
        `;
        DOM.shopItems.appendChild(div);
    });
};

window.buyDeck = (id) => {
    const item = DECK_SHOP.find(d => d.id === id);
    if (gold >= item.cost) {
        playSound('select');
        gold -= item.cost;
        ownedDecks.push(id);
        updateGoldDisplay();
        renderShop();
    } else {
        playSound('lose');
        alert("INSUFFICIENT GOLD!");
    }
};

window.equipDeck = (id) => {
    if (ownedDecks.includes(id)) {
        playSound('select');
        equippedDeck = id;
        document.documentElement.style.setProperty('--card-color-filter', DECK_SHOP.find(d => d.id === id).filter);
        renderShop();
    }
};

// -------------------- Initialisation & Event Binding --------------------
const initGame = () => {
    multiplier = 1;
    playerRed = 0;
    cpuRed = 0;
    updateGoldDisplay();
    updateUI();
    startRound();
};

DOM.startBtn.addEventListener('click', () => {
    playSound('select');
    DOM.menuOverlay.style.opacity = '0';
    setTimeout(() => {
        DOM.menuOverlay.style.display = 'none';
        initGame();
    }, 500);
});

document.getElementById('restart').addEventListener('click', () => {
    playSound('select');
    gold = 0;
    ownedDecks = ['default'];
    equipDeck('default');
    DOM.menuOverlay.style.display = 'flex';
    DOM.menuOverlay.style.opacity = '1';
});

DOM.shopBtn.addEventListener('click', () => {
    playSound('shopOpen');
    renderShop();
    DOM.shopOverlay.style.display = 'flex';
});

DOM.closeShopBtn.addEventListener('click', () => {
    playSound('select');
    DOM.shopOverlay.style.display = 'none';
});

DOM.hit.addEventListener('click', () => {
    if (!isGameOver) {
        playSound('select');
        dealCard('player');
    }
});

DOM.stand.addEventListener('click', () => {
    if (!isGameOver) {
        playSound('select');
        isGameOver = true;
        toggleButtons(true);
        cpuTurnSequence();
    }
});