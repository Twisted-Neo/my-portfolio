// ----- DOM elements -----
const startMenu = document.getElementById('start-menu');
const gameScreen = document.getElementById('game-screen');
const gameOverDiv = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const handArea = document.getElementById('hand-area');
const playerSlot = document.getElementById('player-slot');
const opponentSlot = document.getElementById('opponent-slot');
const readyBtn = document.getElementById('ready-btn');
const continueBtn = document.getElementById('continue-btn');
const roundCounter = document.getElementById('round-counter');
const deckCounter = document.getElementById('deck-counter');
const resultMsg = document.getElementById('result-message');
const transitionOverlay = document.getElementById('transition-overlay');
const deckBtn = document.getElementById('deck-btn');
const viewDeckBtn = document.getElementById('view-deck-btn');
const mapViewDeckBtn = document.getElementById('map-view-deck-btn');
const deckViewer = document.getElementById('deck-viewer');
const closeDeckBtn = document.getElementById('close-deck-btn');
const deckCardsDiv = document.getElementById('deck-cards');
const addCardModal = document.getElementById('add-card-modal');
const cardChoicesDiv = document.getElementById('card-choices');
const addCardBtn = document.getElementById('add-card-btn');
const skipAddBtn = document.getElementById('skip-add-btn');
const upgradeModal = document.getElementById('upgrade-modal');
const upgradeChoicesDiv = document.getElementById('upgrade-choices');
const confirmUpgradeBtn = document.getElementById('confirm-upgrade-btn');
const skipUpgradeBtn = document.getElementById('skip-upgrade-btn');
const opponentHandArea = document.getElementById('opponent-hand');
const tutorialScreen = document.getElementById('tutorial-screen');
const startTutorialBtn = document.getElementById('start-tutorial-btn');
const particlesContainer = document.getElementById('particles-container');
const battleTitle = document.getElementById('battle-title');
const moneyAmount = document.getElementById('money-amount');
const mapMoneyAmount = document.getElementById('map-money-amount');

// ----- Game Constants & State -----
const BASE_CARDS = [
    { name: 'rock',     image: 'assets/Rock.png',     beats: ['scissors', 'lizard'] },
    { name: 'paper',    image: 'assets/Paper.png',    beats: ['rock', 'spock'] },
    { name: 'scissors', image: 'assets/Scissors.png', beats: ['paper', 'lizard'] },
    { name: 'lizard',   image: 'assets/Lizard.png',   beats: ['spock', 'paper'] },
    { name: 'spock',    image: 'assets/Spock.png',    beats: ['scissors', 'rock'] }
];

const CARD_TYPES = [...BASE_CARDS];
// Dynamically create upgraded versions
BASE_CARDS.forEach(c => {
    CARD_TYPES.push({
        name: c.name + '_upgraded',
        image: c.image,
        beats: c.beats,
        isUpgraded: true
    });
});

const CARD_MAP = Object.fromEntries(CARD_TYPES.map(c => [c.name, c]));

const MAX_DECK_SIZE = 20;
const INIT_DECK = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
const HAND_SIZE = 3; 
let currentBattleTurns = 3;

const state = {
    deck: [],                
    hand: [],                
    battleTurn: 0,           
    selectedCardIndex: null,
    currentPlayerCard: null,
    currentOpponentCard: null,
    battleResult: null,      
    canSelect: false,
    deckClicksRemaining: 0,  
    inBattle: false,
    money: 10                // Starting money
};

// Shop mode flag
let isShopMode = false;
let selectedShopCard = null;
let selectedShopPrice = 0;

// ----- helpers -----
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getRandomCard() {
    return BASE_CARDS[Math.floor(Math.random() * BASE_CARDS.length)].name;
}

function determineWinner(playerCard, opponentCard) {
    const pCardData = CARD_MAP[playerCard];
    const oCardData = CARD_MAP[opponentCard];
    
    const playerWins = pCardData.beats.includes(oCardData.name.replace('_upgraded', ''));
    const opponentWins = oCardData.beats.includes(pCardData.name.replace('_upgraded', ''));
    
    if (playerWins && !opponentWins) return 'win';
    if (opponentWins && !playerWins) return 'lose';
    return 'tie';
}

function spawnParticles(x, y, isWin) {
    const count = isWin ? 40 : 20;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 150 + 50;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--vx', `${Math.cos(angle) * speed}px`);
        p.style.setProperty('--vy', `${Math.sin(angle) * speed}px`);
        p.style.animation = `particleMove 0.8s ease-out forwards`;
        particlesContainer.appendChild(p);
        setTimeout(() => { if(p.parentNode) p.parentNode.removeChild(p); }, 800);
    }
}

function spawnMoneyParticles(x, y, amount) {
    const count = amount * 5; // 5 particles per money
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle money-particle';
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 120 + 30;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.setProperty('--vx', `${Math.cos(angle) * speed}px`);
        p.style.setProperty('--vy', `${Math.sin(angle) * speed}px`);
        p.style.animation = `particleMove 0.8s ease-out forwards`;
        particlesContainer.appendChild(p);
        setTimeout(() => { if(p.parentNode) p.parentNode.removeChild(p); }, 800);
    }
}

function applyResultEffect(resultMsg, gameScreen, result) {
    resultMsg.className = 'result-message'; 
    void resultMsg.offsetWidth; 

    const middlePanel = document.querySelector('.middle-panel');
    const rect = middlePanel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    gameScreen.classList.remove('shake', 'heavy-shake');
    void gameScreen.offsetWidth;

    if (result === 'win') {
        resultMsg.textContent = 'VICTORY';
        resultMsg.classList.add('show', 'win-glow');
        gameScreen.classList.add('shake');
        spawnParticles(centerX, centerY, true);
    } else if (result === 'lose') {
        resultMsg.textContent = 'DEFEAT';
        resultMsg.classList.add('show', 'lose-glow');
        gameScreen.classList.add('heavy-shake');
        spawnParticles(centerX, centerY, false);
    } else {
        resultMsg.textContent = 'TIE';
        resultMsg.classList.add('show', 'tie-glow');
        gameScreen.classList.add('shake');
        spawnParticles(centerX, centerY, false);
    }
    
    setTimeout(() => gameScreen.classList.remove('shake', 'heavy-shake'), 400);
}

function triggerTransition(callback) {
    transitionOverlay.classList.remove('wipe-out');
    transitionOverlay.classList.add('wipe-in');
    
    setTimeout(() => {
        if(callback) callback();
        transitionOverlay.classList.remove('wipe-in');
        transitionOverlay.classList.add('wipe-out');
        setTimeout(() => transitionOverlay.classList.remove('wipe-out'), 400);
    }, 400);
}

// ----- Money display -----
function updateMoneyDisplay() {
    if (moneyAmount) moneyAmount.textContent = state.money;
    if (mapMoneyAmount) mapMoneyAmount.textContent = state.money;
}

// ----- rendering helpers -----
function createCardElement(cardName, isMini = false) {
    const cardData = CARD_MAP[cardName];
    const div = document.createElement('div');
    div.className = isMini ? 'mini-card' : 'hand-card';
    if (cardData.isUpgraded) div.classList.add('upgraded-card');

    const img = document.createElement('img');
    img.src = cardData.image;
    img.alt = cardName;
    div.appendChild(img);
    return div;
}

function displayCardInSlot(slot, cardName) {
    slot.innerHTML = '';
    const cardData = CARD_MAP[cardName];
    const img = document.createElement('img');
    img.src = cardData.image;
    img.alt = cardName;
    slot.appendChild(img);
    if(cardData.isUpgraded) slot.classList.add('upgraded-slot-glow');
    else slot.classList.remove('upgraded-slot-glow');
}

function renderHand(animateNew = false) {
    handArea.innerHTML = '';
    state.hand.forEach((cardName, idx) => {
        const cardDiv = createCardElement(cardName);
        if (idx === state.selectedCardIndex) cardDiv.classList.add('selected');
        if (animateNew && idx === state.hand.length - 1) cardDiv.classList.add('new-card');
        cardDiv.onclick = () => onCardClick(idx);
        handArea.appendChild(cardDiv);
    });
}

function renderOpponentHand(turnsLeft) {
    opponentHandArea.innerHTML = '';
    for (let i = 0; i < turnsLeft; i++) {
        const fakeCard = document.createElement('div');
        fakeCard.className = 'opponent-card-fake';
        opponentHandArea.appendChild(fakeCard);
    }
}

function clearSlots() {
    playerSlot.innerHTML = '';
    opponentSlot.innerHTML = '';
    playerSlot.classList.remove('upgraded-slot-glow');
    state.currentPlayerCard = null;
    state.currentOpponentCard = null;
    resultMsg.className = 'result-message';
}

function updateTurnCounter() {
    roundCounter.textContent = `TURN ${state.battleTurn + 1}/${currentBattleTurns}`;
}

function updateDeckCounter() {
    deckCounter.textContent = `DECK: ${state.deck.length}`;
}

// ----- deck viewer -----
function showDeckViewer() {
    deckCardsDiv.innerHTML = '';
    state.deck.forEach(cardName => {
        deckCardsDiv.appendChild(createCardElement(cardName, true));
    });
    deckViewer.style.display = 'flex';
}

closeDeckBtn.addEventListener('click', () => deckViewer.style.display = 'none');
viewDeckBtn.addEventListener('click', showDeckViewer);
mapViewDeckBtn.addEventListener('click', showDeckViewer);

// ----- game flow -----
function startGame() {
    state.deck = [...INIT_DECK];
    state.money = 10; // Reset money on new game
    updateMoneyDisplay();
    tutorialScreen.style.display = 'none';
    document.getElementById('map-screen').style.display = 'flex';
    MapSystem.init(); 
}

function triggerGameOver(isWin) {
    gameScreen.style.display = 'none';
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    
    document.getElementById('end-title').textContent = isWin ? 'SYSTEM CONQUERED' : 'SYSTEM FAILURE';
    document.getElementById('end-desc').textContent = isWin ? 'You have cleared the final map sector.' : 'Your deck was decimated.';
    document.getElementById('end-title').style.color = isWin ? '#0f0' : '#fff';
    
    gameOverDiv.style.display = 'flex';
}

function restartGame() {
    gameOverDiv.style.display = 'none';
    tutorialScreen.style.display = 'flex'; // Go back through intro
}

function startNewBattle(isBoss = false) {
    state.inBattle = true;
    state.hand = [];
    state.battleTurn = 0;
    state.selectedCardIndex = null;
    state.canSelect = false;
    currentBattleTurns = isBoss ? 5 : 3;
    battleTitle.textContent = isBoss ? '// BOSS BATTLE //' : '// CARD BATTLE //';
    battleTitle.style.color = isBoss ? '#ff4444' : '#ffffff';
    battleTitle.style.borderColor = isBoss ? '#ff4444' : '#ffffff';
    
    // Initialize enemy AI with the battle length
    EnemyAI.init(isBoss, currentBattleTurns);
    
    shuffle(state.deck);
    state.deckClicksRemaining = Math.min(HAND_SIZE, state.deck.length);
    
    renderHand();
    clearSlots();
    renderOpponentHand(currentBattleTurns);
    
    readyBtn.style.display = 'inline-block';
    continueBtn.style.display = 'none';
    readyBtn.disabled = true;
    deckBtn.disabled = (state.deckClicksRemaining === 0);
    
    updateTurnCounter();
    updateDeckCounter();
    updateMoneyDisplay();
}

function onDeckClick() {
    if (state.deckClicksRemaining <= 0 || !state.inBattle) return;
    if (state.deck.length === 0) return; 

    const card = state.deck.pop(); 
    state.hand.push(card);
    state.deckClicksRemaining--;

    renderHand(true);
    updateDeckCounter();

    if (state.deckClicksRemaining === 0) {
        deckBtn.disabled = true;
        if (state.hand.length > 0) state.canSelect = true;
    }
}

function onCardClick(index) {
    if (!state.canSelect || !state.inBattle) return;
    state.selectedCardIndex = index;
    renderHand();
    readyBtn.disabled = false;
}

function onReady() {
    if (!state.inBattle || state.selectedCardIndex === null) return;

    state.currentPlayerCard = state.hand[state.selectedCardIndex];
    state.hand.splice(state.selectedCardIndex, 1);
    state.selectedCardIndex = null;
    state.canSelect = false;

    renderHand();
    readyBtn.style.display = 'none';
    continueBtn.style.display = 'inline-block';
    continueBtn.disabled = false;

    // Get opponent's card from AI
    state.currentOpponentCard = EnemyAI.chooseCardToPlay(state.deck.length, state.battleTurn);
    state.battleResult = determineWinner(state.currentPlayerCard, state.currentOpponentCard);

    displayCardInSlot(playerSlot, state.currentPlayerCard);
    displayCardInSlot(opponentSlot, state.currentOpponentCard);
    applyResultEffect(resultMsg, gameScreen, state.battleResult);

    // Money rewards
    const middlePanel = document.querySelector('.middle-panel');
    const rect = middlePanel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (state.battleResult === 'win') {
        state.money += 3;
        spawnMoneyParticles(centerX, centerY, 3);
    } else if (state.battleResult === 'tie') {
        state.money += 1;
        spawnMoneyParticles(centerX, centerY, 1);
    }
    updateMoneyDisplay();

    if (state.battleResult === 'win' || state.battleResult === 'tie') {
        state.hand.push(state.currentPlayerCard);
    }
}

function onContinue() {
    continueBtn.style.display = 'none';
    readyBtn.style.display = 'inline-block';
    readyBtn.disabled = true;
    clearSlots();

    state.battleTurn++;
    renderOpponentHand(currentBattleTurns - state.battleTurn);

    if (state.hand.length === 0 && state.deck.length === 0) {
        triggerGameOver(false);
        return;
    }

    if (state.battleTurn >= currentBattleTurns || state.hand.length === 0) {
        endBattle();
    } else {
        updateTurnCounter();
        state.canSelect = true;
        renderHand(true);
    }
}

function endBattle() {
    state.inBattle = false;
    state.canSelect = false;
    readyBtn.disabled = true;

    while (state.hand.length > 0) state.deck.push(state.hand.pop());
    updateDeckCounter();
    renderHand();
    
    returnToMap();
}

// ----- Modals and Progression Logic -----
function returnToMap() {
    MapSystem.currentFloor++;
    
    if (MapSystem.currentFloor >= MapSystem.maxFloors) {
        triggerGameOver(true);
        return;
    }

    triggerTransition(() => {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        gameScreen.style.display = 'none';
        document.getElementById('map-screen').style.display = 'flex';
        MapSystem.renderMap();
        updateMoneyDisplay(); // Ensure money is updated on map
    });
}

// Reward (free card)
let selectedAddCard = null;
function showAddCardModal(titleText = 'REWARD: CHOOSE A CARD') {
    isShopMode = false;
    addCardBtn.textContent = 'TAKE';
    document.getElementById('reward-title').textContent = titleText;
    cardChoicesDiv.innerHTML = '';
    
    // Pick 3 random base cards
    const options = [];
    while(options.length < 3) {
        let rc = BASE_CARDS[Math.floor(Math.random() * BASE_CARDS.length)];
        if(!options.includes(rc)) options.push(rc);
    }

    options.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'choice-card';
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.name}">`;
        cardDiv.onclick = function() { selectCardToAdd(card.name, this); };
        cardChoicesDiv.appendChild(cardDiv);
    });
    
    addCardModal.style.display = 'flex';
    addCardBtn.disabled = true;
}

function selectCardToAdd(cardName, element) {
    document.querySelectorAll('.choice-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedAddCard = cardName;
    addCardBtn.disabled = false;
}

// Shop modal
function showShopModal() {
    isShopMode = true;
    addCardBtn.textContent = 'BUY';
    document.getElementById('reward-title').textContent = 'SHOP: BUY A CARD';
    cardChoicesDiv.innerHTML = '';
    
    // Pick 3 random base cards with random prices (3-7)
    const options = [];
    while(options.length < 3) {
        let card = BASE_CARDS[Math.floor(Math.random() * BASE_CARDS.length)];
        if(!options.some(c => c.name === card.name)) {
            options.push({ card, price: Math.floor(Math.random() * 5) + 3 }); // 3-7
        }
    }

    options.forEach(item => {
        const card = item.card;
        const cardDiv = document.createElement('div');
        cardDiv.className = 'choice-card';
        cardDiv.innerHTML = `<img src="${card.image}" alt="${card.name}"><span class="card-price">${item.price}</span>`;
        cardDiv.onclick = function() { selectShopCard(card.name, item.price, this); };
        cardChoicesDiv.appendChild(cardDiv);
    });
    
    addCardModal.style.display = 'flex';
    addCardBtn.disabled = true;
}

function selectShopCard(cardName, price, element) {
    document.querySelectorAll('.choice-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedShopCard = cardName;
    selectedShopPrice = price;
    // Enable button only if player has enough money
    addCardBtn.disabled = state.money < price;
}

// Add card button click handler (for both reward and shop)
addCardBtn.addEventListener('click', () => {
    if (state.deck.length >= MAX_DECK_SIZE) {
        alert('Deck is full!');
        return;
    }

    if (isShopMode) {
        if (selectedShopCard && state.money >= selectedShopPrice) {
            state.money -= selectedShopPrice;
            state.deck.push(selectedShopCard);
            updateMoneyDisplay();
            
            // Spawn money particles at center
            const modalRect = addCardModal.getBoundingClientRect();
            spawnMoneyParticles(modalRect.left + modalRect.width/2, modalRect.top + modalRect.height/2, -selectedShopPrice); // negative for spending
        } else {
            return;
        }
    } else {
        // Reward mode
        if (selectedAddCard) {
            state.deck.push(selectedAddCard);
        } else {
            return;
        }
    }
    
    // Reset and close
    selectedAddCard = null;
    selectedShopCard = null;
    selectedShopPrice = 0;
    isShopMode = false;
    returnToMap();
});

skipAddBtn.addEventListener('click', () => {
    selectedAddCard = null;
    selectedShopCard = null;
    selectedShopPrice = 0;
    isShopMode = false;
    returnToMap();
});

// Upgrade
let selectedUpgradeIndex = null;
function showUpgradeModal() {
    upgradeChoicesDiv.innerHTML = '';
    state.deck.forEach((cardName, idx) => {
        const cardDiv = createCardElement(cardName, true);
        if(!cardName.endsWith('_upgraded')) {
            cardDiv.style.cursor = 'pointer';
            cardDiv.onclick = function() { selectCardToUpgrade(idx, this); };
        } else {
            cardDiv.style.opacity = '0.5';
            cardDiv.style.cursor = 'not-allowed';
        }
        upgradeChoicesDiv.appendChild(cardDiv);
    });
    upgradeModal.style.display = 'flex';
    confirmUpgradeBtn.disabled = true;
}

function selectCardToUpgrade(index, element) {
    Array.from(upgradeChoicesDiv.children).forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedUpgradeIndex = index;
    confirmUpgradeBtn.disabled = false;
}

confirmUpgradeBtn.addEventListener('click', () => {
    if (selectedUpgradeIndex !== null) {
        let oldCard = state.deck[selectedUpgradeIndex];
        state.deck[selectedUpgradeIndex] = oldCard + '_upgraded';
    }
    selectedUpgradeIndex = null;
    returnToMap();
});

skipUpgradeBtn.addEventListener('click', returnToMap);

// ----- Event Listeners -----
startBtn.addEventListener('click', () => {
    startMenu.style.display = 'none';
    tutorialScreen.style.display = 'flex';
});
startTutorialBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
deckBtn.addEventListener('click', onDeckClick);
readyBtn.addEventListener('click', onReady);
continueBtn.addEventListener('click', onContinue);

// ----- Initialize Display States -----
startMenu.style.display = 'flex';
gameScreen.style.display = 'none';
gameOverDiv.style.display = 'none';
deckViewer.style.display = 'none';
addCardModal.style.display = 'none';
upgradeModal.style.display = 'none';
tutorialScreen.style.display = 'none';
updateMoneyDisplay();