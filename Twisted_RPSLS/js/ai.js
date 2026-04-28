const EnemyAI = {
    deck: [],
    hand: [],
    difficulty: 'normal', // 'normal' or 'boss'

    // Initialize for a new battle
    init(isBoss, battleTurns) {
        this.difficulty = isBoss ? 'boss' : 'normal';
        this.deck = this.generateDeck();
        this.shuffleDeck();
        this.hand = [];
        this.drawStartingHand(battleTurns);
    },

    // Create a deck based on difficulty
    generateDeck() {
        if (this.difficulty === 'boss') {
            // Boss deck: mix of upgraded and base cards, more variety
            return [
                'rock_upgraded',
                'paper_upgraded',
                'scissors',
                'lizard_upgraded',
                'spock',
                'rock',
                'paper',
                'scissors_upgraded',
                'lizard',
                'spock_upgraded'
            ];
        } else {
            // Normal deck: two of each base card (total 10)
            return [
                'rock', 'rock',
                'paper', 'paper',
                'scissors', 'scissors',
                'lizard', 'lizard',
                'spock', 'spock'
            ];
        }
    },

    // Shuffle the deck
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    // Draw the starting hand (one card per turn)
    drawStartingHand(battleTurns) {
        // Take the first `battleTurns` cards from the shuffled deck
        for (let i = 0; i < battleTurns; i++) {
            if (this.deck.length > 0) {
                this.hand.push(this.deck.shift());
            }
        }
    },

    // Core decision-making – currently random, but structured for future AI
    chooseCardToPlay(playerDeckSize, turnNumber) {
        if (this.hand.length === 0) {
            console.warn("Enemy hand is empty! Should not happen.");
            return 'rock'; // fallback
        }

        // Random selection for now
        const chosenIndex = Math.floor(Math.random() * this.hand.length);
        const cardToPlay = this.hand[chosenIndex];
        this.hand.splice(chosenIndex, 1); // Remove played card from hand
        return cardToPlay;
    }
};