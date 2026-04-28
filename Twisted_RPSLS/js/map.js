const MapSystem = {
    nodes: [],
    currentFloor: 0,
    maxFloors: 7,

    init() {
        this.currentFloor = 0;
        this.generateMap();
        this.renderMap();
        
        window.addEventListener('resize', () => this.drawLines());
    },

    generateMap() {
        this.nodes = [];
        for (let i = 0; i < this.maxFloors; i++) {
            const floorNodes = [];
            
            if (i === 0) {
                floorNodes.push({ id: `node-0-0`, type: 'battle', floor: 0 });
            } else if (i === this.maxFloors - 1) {
                floorNodes.push({ id: `node-${i}-boss`, type: 'boss', floor: i });
            } else {
                const branchCount = Math.random() > 0.6 ? 2 : (Math.random() > 0.8 ? 3 : 1);
                for (let j = 0; j < branchCount; j++) {
                    const r = Math.random();
                    let type = 'battle';
                    
                    if (r > 0.85) type = 'shop';
                    else if (r > 0.70) type = 'upgrade';
                    else if (r > 0.40) type = 'reward';
                    
                    floorNodes.push({ id: `node-${i}-${j}`, type: type, floor: i });
                }
            }
            this.nodes.push(floorNodes);
        }
    },

    renderMap() {
        const layer = document.getElementById('map-nodes-layer');
        layer.innerHTML = '';

        const mapDeckCounter = document.getElementById('map-deck-counter');
        if (mapDeckCounter && typeof state !== 'undefined') {
            mapDeckCounter.textContent = `DECK: ${state.deck.length}`;
        }

        this.nodes.forEach((floor, floorIndex) => {
            const floorDiv = document.createElement('div');
            floorDiv.className = 'map-floor';

            floor.forEach(node => {
                const nodeEl = document.createElement('div');
                nodeEl.className = `map-node node-${node.type}`;
                nodeEl.id = node.id;
                
                if (floorIndex < this.currentFloor) {
                    nodeEl.classList.add('locked');
                } else if (floorIndex === this.currentFloor) {
                    nodeEl.classList.add('active');
                } else {
                    nodeEl.classList.add('locked');
                }

                let iconSrc = 'assets/Enemy.png';
                if (node.type === 'boss') iconSrc = 'assets/Boss.png';
                if (node.type === 'shop') iconSrc = 'assets/Shop.png';
                if (node.type === 'upgrade') iconSrc = 'assets/Upgrade.png';
                if (node.type === 'reward') iconSrc = 'assets/Reward.png';
                
                nodeEl.innerHTML = `<img src="${iconSrc}" class="node-icon" alt="${node.type}">`;

                nodeEl.onclick = () => {
                    if (floorIndex === this.currentFloor) {
                        this.enterNode(node);
                    }
                };
                floorDiv.appendChild(nodeEl);
            });
            layer.appendChild(floorDiv);
        });

        setTimeout(() => this.drawLines(), 50);
    },

    drawLines() {
        const canvas = document.getElementById('map-canvas');
        const container = document.getElementById('map-container');
        if (!canvas || !container) return;

        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        for (let i = 0; i < this.nodes.length - 1; i++) {
            const currentFloor = this.nodes[i];
            const nextFloor = this.nodes[i + 1];

            currentFloor.forEach(nodeA => {
                const elA = document.getElementById(nodeA.id);
                if (!elA) return;
                const rectA = elA.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                const x1 = rectA.left - containerRect.left + rectA.width / 2;
                const y1 = rectA.top - containerRect.top + rectA.height / 2;

                nextFloor.forEach(nodeB => {
                    const elB = document.getElementById(nodeB.id);
                    if (!elB) return;
                    const rectB = elB.getBoundingClientRect();
                    
                    const x2 = rectB.left - containerRect.left + rectB.width / 2;
                    const y2 = rectB.top - containerRect.top + rectB.height / 2;

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                });
            });
        }
    },

    enterNode(node) {
        triggerTransition(() => {
            document.getElementById('map-screen').style.display = 'none';
            
            if (node.type === 'battle' || node.type === 'boss') {
                startNewBattle(node.type === 'boss'); 
                document.getElementById('game-screen').style.display = 'flex';
            } else if (node.type === 'reward') {
                showAddCardModal('REWARD: CHOOSE A CARD');
            } else if (node.type === 'shop') {
                showShopModal(); // Call new shop function
            } else if (node.type === 'upgrade') {
                showUpgradeModal();
            }
        });
    }
};