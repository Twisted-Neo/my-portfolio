(function () {
    const CONFIG = { w: 1500, h: 600, g: 3200, baseSpd: 500, maxSpd: 1300 };
    let isRunning = false, score = 0, lastTime = 0, speed = CONFIG.baseSpd;
    let obstacles = [], ghostTimer = 0, obstacleTimer = 0, spawnRate = 900;
    let bgX = 0, invincTimer = 0, nextSpeedScore = 100;

    const get = (id) => document.getElementById(id);
    const ui = { 
        cont: get('game-container'), 
        world: get('game-world'), 
        p: get('player'), 
        score: get('score'), 
        msg: get('start-message'),
        title: document.querySelector('.game-title'),
        blink: document.querySelector('.blink-text')
    };
    
    const mkDiv = (cls, id) => { const el = document.createElement('div'); el.className = cls; if(id) el.id = id; return el; };
    const starsFar = ui.world.insertBefore(mkDiv('star-layer', 'stars-far'), ui.world.firstChild);
    const starsNear = ui.world.insertBefore(mkDiv('star-layer', 'stars-near'), ui.world.firstChild);

    const aud = {
        land: new Audio('/assets/Land.mp3'), 
        slide: new Audio('/assets/Slide.mp3'),
        speedUp: new Audio('/assets/SpeedUp.mp3'), 
        music: new Audio('/assets/MusicLoop.mp3'),
        gameOver: new Audio('/assets/GameOver.mp3'),
        invert: new Audio('/assets/Invert.mp3'),
        powerUp: new Audio('/assets/PoweUp.mp3') 
    };
    aud.music.loop = true; aud.music.volume = 0.5;
    const playSnd = (s) => { s.currentTime = 0; s.play().catch(() => {}); };

    let p = { x: 50, y: 0, dy: 0, w: 40, h: 40, ground: true, duck: false, l: false, r: false, inv: false, rot: 0, squish: 0, visualInv: false, flipTimer: 0 };

    const start = () => {
        if (isRunning) return;
        isRunning = true; score = 0; speed = CONFIG.baseSpd; obstacles.forEach(o => o.el.remove()); obstacles = [];
        p.y = 0; p.dy = 0; p.ground = true; p.inv = false; p.rot = 0; p.squish = 0; p.visualInv = false; p.flipTimer = 0;
        bgX = 0; nextSpeedScore = 100; invincTimer = 0;
        ghostTimer = 0; obstacleTimer = performance.now();
        
        ui.msg.style.display = 'none';
        ui.p.style.display = 'block';
        ui.p.classList.remove('invincible-active');
        
        aud.music.playbackRate = 1; playSnd(aud.music);
        lastTime = performance.now();
        requestAnimationFrame(loop);
    };

    const gameOver = () => {
        isRunning = false; aud.music.pause(); ui.p.style.display = 'none';
        spawnFx('shard', p.x + 20, p.y + 20, 800, true);

        ui.title.setAttribute('data-text', 'SYSTEM FAILURE');
        ui.title.innerText = 'SYSTEM FAILURE';
        ui.title.style.color = '#ff0055';
        ui.blink.innerHTML = `SCORE: ${Math.floor(score).toString().padStart(5, '0')}<br><br>PRESS SPACE TO RETRY`;
        ui.msg.style.display = 'block';
        playSnd(aud.gameOver);
    };

    const loop = (t) => {
        if (!isRunning) return;
        const dt = (t - lastTime) / 1000;
        lastTime = t;

        score += dt * 10;
        ui.score.innerText = Math.floor(score).toString().padStart(5, '0');
        speed = Math.min(CONFIG.maxSpd, CONFIG.baseSpd + (score * 1.5));
        aud.music.playbackRate = Math.min(2, 1 + ((speed - CONFIG.baseSpd) / 1000));
        
        if (score >= nextSpeedScore) { playSnd(aud.speedUp); nextSpeedScore += 100; }

        const accel = p.inv ? CONFIG.g : -CONFIG.g;
        p.dy = Math.max(-3000, Math.min(3000, p.dy + accel * dt));
        p.y += p.dy * dt;
        
        const ceil = CONFIG.h - p.h;
        const wasAir = !p.ground;

        if (p.y <= 0 || p.y >= ceil) {
            p.y = p.y <= 0 ? 0 : ceil;
            p.dy = 0; p.ground = true;
            
            if (wasAir) {
                p.squish = 0.4; 
                spawnFx('impact-flash', p.x + 20, p.y > 100 ? CONFIG.h - 20 : 20, 150, false, p.y > 100);
                playSnd(aud.land);
            }
        }

        if (p.flipTimer > 0) p.flipTimer -= dt;
        if (p.flipTimer <= 0) p.visualInv = p.inv;

        const targetRot = p.visualInv ? 180 : 0;
        p.rot += (targetRot - p.rot) * dt * 15;

        const stretch = Math.min(0.3, Math.abs(p.dy) / 9000);
        let scaleX = 1 - stretch, scaleY = 1 + stretch;

        if (p.squish > 0) {
            p.squish -= dt * 4;
            if (p.squish < 0) p.squish = 0;
            scaleY -= p.squish;
            scaleX += p.squish;
        }

        if (p.l && p.x > 0) p.x -= 600 * dt;
        if (p.r && p.x < CONFIG.w - p.w) p.x += 600 * dt;

        bgX -= speed * dt;
        starsFar.style.backgroundPositionX = (bgX * 0.1) + 'px';
        starsNear.style.backgroundPositionX = (bgX * 0.3) + 'px';

        if ((ghostTimer += dt) > 0.05) { spawnFx('ghost', p.x, p.y, 250); ghostTimer = 0; }
        if (invincTimer > 0) invincTimer -= dt;
        if (performance.now() - obstacleTimer > spawnRate) spawnObstacle();

        updateObstacles(dt);
        draw(scaleX, scaleY);
        
        requestAnimationFrame(loop);
    };

    const spawnFx = (type, x, y, dur, isExplosion = false, isCeil = false) => {
        if (isExplosion) {
            for(let i=0; i<20; i++) {
                const s = mkDiv('shard');
                Object.assign(s.style, { left: x+'px', bottom: y+'px', '--tx':(Math.cos(Math.random()*6)*100)+'px', '--ty':(Math.sin(Math.random()*6)*-100)+'px', '--rot':(Math.random()*360)+'deg' });
                ui.world.appendChild(s); setTimeout(()=>s.remove(), dur);
            }
            return;
        }
        const el = mkDiv(type);
        if (type === 'ghost') {
            Object.assign(el.style, { width: p.w+'px', height: p.h+'px', left: x+'px', bottom: y+'px' });
            if (p.inv) el.classList.add('inverted'); 
            if (p.duck) el.classList.add('ducking');
        } else if (type === 'impact-flash') {
            el.style.left = x + 'px';
            el.style.top = isCeil ? '0px' : 'auto';
            el.style.bottom = isCeil ? 'auto' : '0px';
        }
        
        ui.world.appendChild(el);
        setTimeout(() => el.remove(), dur);
    };

    const spawnObstacle = () => {
        const r = Math.random(), x = 1560;
        let type = 'normal', y = 0, h = 50, w = 30, el;
        
        obstacleTimer = performance.now();
        let minSpawn = Math.max(300, 600 - score * 2);
        let maxSpawn = Math.max(600, 1400 - score * 2);
        spawnRate = Math.random() * (maxSpawn - minSpawn) + minSpawn;

        if (r < 0.05) { 
            type = 'powerup'; y = Math.random() * (CONFIG.h - 100) + 50; h = 30;
            el = mkDiv('powerup-invincible');
        } else if (r < 0.15) { 
            const gapY = Math.random() * (CONFIG.h - 335) + 30;
            [{y:0, h:gapY}, {y: gapY + 275, h: CONFIG.h - (gapY + 275)}].forEach(pt => {
                let e = mkDiv('obstacle obstacle-hole');
                Object.assign(e.style, {left:x+'px', bottom:pt.y+'px', height:pt.h+'px'});
                ui.world.appendChild(e);
                obstacles.push({ el: e, x, y: pt.y, w: 30, h: pt.h, type: 'wall' });
            });
            return;
        } else { 
            el = mkDiv('obstacle');
            if (r > 0.7) { el.classList.add('obstacle-flying'); h = 30; y = Math.random() * (CONFIG.h - 130) + 50; }
            else if (r > 0.45) { el.classList.add('obstacle-tall'); h = CONFIG.h - 50; y = 23; }
            else { y = Math.random() > 0.5 ? CONFIG.h - 50 : 0; }
        }
        
        Object.assign(el.style, { left: x+'px', bottom: y+'px', height: h+'px' });
        ui.world.appendChild(el);
        obstacles.push({ el, x, y, w, h, type });
    };

    const updateObstacles = (dt) => {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.x -= speed * dt;
            o.el.style.left = o.x + 'px';

            if (p.x < o.x + o.w && p.x + p.w > o.x && p.y < o.y + o.h && p.y + p.h > o.y) {
                if (o.type === 'powerup') {
                    invincTimer = 5; spawnRate += 200; 
                    playSnd(aud.powerUp);
                    o.el.remove(); obstacles.splice(i, 1);
                } else if (invincTimer <= 0) {
                    gameOver();
                }
            } else if (o.x < -50) {
                o.el.remove(); obstacles.splice(i, 1);
            }
        }
    };

    const draw = (sx, sy) => {
        ui.p.style.left = p.x + 'px';
        ui.p.style.bottom = p.y + 'px';
        ui.p.style.height = p.h + 'px';
        
        const yOffset = (p.rot / 180) * 100;
        ui.p.style.transform = `rotate(${p.rot}deg) scale(${sx}, ${sy}) translateY(${yOffset}%)`;
        
        ui.p.classList.toggle('invincible-active', invincTimer > 0);
        ui.p.classList.toggle('ducking', p.duck);
        
        if(p.inv) ui.p.style.boxShadow = `0 0 15px var(--c-magenta)`; 
        else if(invincTimer <= 0) ui.p.style.boxShadow = `0 0 15px var(--c-cyan)`;
        
        ui.p.style.backgroundColor = p.inv ? 'var(--c-magenta)' : 'var(--c-cyan)';
    };

    const handleKey = (e, down) => {
        const k = e.code;
        if (down && (k === 'Space' || k === 'ArrowUp' || k === 'KeyW')) {
            if (!isRunning) {
                ui.title.setAttribute('data-text', 'TWISTED JUMPER');
                ui.title.innerText = 'TWISTED JUMPER';
                ui.title.style.color = 'transparent';
                ui.blink.innerHTML = 'PRESS <span class="highlight">SPACE</span> TO INITIALIZE';
                return start();
            }
            if (p.ground) {
                playSnd(aud.invert);
                p.inv = !p.inv; p.ground = false, p.flipTimer = 0.09;
                spawnFx('shard', p.x + p.w/2, p.y + p.h/2, 200, true);
            }
        }
        if (k === 'ArrowDown' || k === 'KeyS') {
            if (down && !p.duck) playSnd(aud.slide);
            p.duck = down; p.h = down ? 20 : 40;
        }
        if (k === 'ArrowLeft' || k === 'KeyA') p.l = down;
        if (k === 'ArrowRight' || k === 'KeyD') p.r = down;
    };

    document.addEventListener('keydown', e => handleKey(e, true));
    document.addEventListener('keyup', e => handleKey(e, false));
})();