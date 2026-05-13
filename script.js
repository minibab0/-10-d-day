const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI 및 제어 요소
const sliderA = document.getElementById('sliderA'), sliderP = document.getElementById('sliderP'), sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA'), valP = document.getElementById('valP'), valQ = document.getElementById('valQ');
const levelText = document.getElementById('currentLevel'), eqText = document.getElementById('equationText');
const shootBtn = document.getElementById('shootBtn'), message = document.getElementById('message');

// 물리 환경 설정
const scale = 20, originX = 60, originY = 380;
let isShooting = false, ballX = 0, particles = [];

// 5단계 레벨 데이터 (hoopX, hoopY)
const levels = [
    { x: 25, y: 8 }, { x: 34, y: 12 }, { x: 18, y: 15 }, { x: 30, y: 7 }, { x: 36, y: 16 }
];
let currentLevelIdx = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath(); ctx.strokeStyle = '#2a2a4a'; ctx.moveTo(0, originY); ctx.lineTo(canvas.width, originY); ctx.stroke();

    const stage = levels[currentLevelIdx];
    drawHoop(stage.x, stage.y);
    
    const a = parseFloat(sliderA.value), p = parseFloat(sliderP.value), q = parseFloat(sliderQ.value);

    if (!isShooting) {
        // 점선 궤적: 바닥 아래로 내려가지 않도록 수정
        drawTrajectory(a, p, q);
        drawBall(0, a * Math.pow(0 - p, 2) + q);
    } else {
        const y = a * Math.pow(ballX - p, 2) + q;
        drawBall(ballX, y);
    }
    updateParticles();
}

function getCanvasX(mathX) { return originX + mathX * scale; }
function getCanvasY(mathY) { return originY - mathY * scale; }

function drawHoop(hx, hy) {
    const cx = getCanvasX(hx), cy = getCanvasY(hy);
    // 백보드 물리 영역 시각화
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(cx + 10, cy - 50, 6, 100);
    // 링 (물리 체크 대상)
    ctx.beginPath(); ctx.strokeStyle = '#e94560'; ctx.lineWidth = 5;
    ctx.moveTo(cx - 25, cy); ctx.lineTo(cx + 10, cy); ctx.stroke();
}

function drawBall(x, y) {
    let cx = getCanvasX(x), cy = getCanvasY(y);
    const radius = 12;
    // 인터페이스 밖으로 나가지 않게 클램핑
    cx = Math.max(radius, Math.min(canvas.width - radius, cx));
    cy = Math.max(radius, Math.min(canvas.height - radius, cy));

    // 공 디자인 개선 (입체감 및 무늬)
    const grad = ctx.createRadialGradient(cx-4, cy-4, 2, cx, cy, radius);
    grad.addColorStop(0, '#ffcc00'); grad.addColorStop(1, '#ff6600');
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
    // 농구공 무늬
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI, false); ctx.stroke();
}

function drawTrajectory(a, p, q) {
    ctx.beginPath(); ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'; ctx.setLineDash([4, 6]);
    // 바닥(y=0)까지만 점선 표시
    for (let x = 0; x <= 40; x += 0.5) {
        const y = a * Math.pow(x - p, 2) + q;
        if (y < -1) break; // 바닥 아래는 그리지 않음
        const cx = getCanvasX(x), cy = getCanvasY(y);
        if (x === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke(); ctx.setLineDash([]);
}

function animateShoot() {
    const a = parseFloat(sliderA.value), p = parseFloat(sliderP.value), q = parseFloat(sliderQ.value);
    const stage = levels[currentLevelIdx];
    ballX += 0.45;
    const ballY = a * Math.pow(ballX - p, 2) + q;

    // 물리 충돌 체크 (백보드 및 링)
    const cx = getCanvasX(ballX), cy = getCanvasY(ballY);
    const hoopCX = getCanvasX(stage.x), hoopCY = getCanvasY(stage.y);

    // 1. 백보드 충돌 (공이 골대 뒤쪽 벽에 맞을 때)
    if (ballX >= stage.x + 0.5 && ballY > stage.y - 2.5 && ballY < stage.y + 2.5) {
        message.innerText = "텅! 백보드에 맞았습니다!";
        isShooting = false; return;
    }

    // 2. 골인 판정
    if (ballX >= stage.x - 1.2 && ballX <= stage.x + 0.5 && ballY >= stage.y - 0.8 && ballY <= stage.y + 0.8) {
        message.innerText = `LEVEL ${currentLevelIdx + 1} CLEAR! 🎆`;
        createFireworks(cx, cy);
        isShooting = false;
        setTimeout(nextLevel, 1500);
        return;
    }

    if (ballY < -1 || ballX > 40) {
        message.innerText = "다시 시도하세요!"; isShooting = false; return;
    }
    draw();
    if (isShooting) requestAnimationFrame(animateShoot);
}

function nextLevel() {
    currentLevelIdx++;
    if (currentLevelIdx >= levels.length) {
        message.innerText = "🏆 모든 단계를 정복했습니다! 챔피언!";
        currentLevelIdx = 0;
    }
    levelText.innerText = currentLevelIdx + 1;
    updateValues();
}

function updateValues() {
    valA.innerText = parseFloat(sliderA.value).toFixed(2);
    valP.innerText = parseFloat(sliderP.value).toFixed(1);
    valQ.innerText = parseFloat(sliderQ.value).toFixed(1);
    // 실시간 방정식 업데이트
    eqText.innerText = `y = ${valA.innerText}(x - ${valP.innerText})² + ${valQ.innerText}`;
    draw();
}

// 나머지 폭죽 로직 및 초기화 동일
function createFireworks(x, y) {
    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2, speed = Math.random() * 8 + 2;
        particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color: `hsl(${Math.random() * 360}, 100%, 60%)`, life: 1.0, gravity: 0.15 });
    }
}
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= 0.015;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

sliderA.addEventListener('input', updateValues); sliderP.addEventListener('input', updateValues); sliderQ.addEventListener('input', updateValues);
shootBtn.addEventListener('click', () => { if (!isShooting) { isShooting = true; ballX = 0; animateShoot(); } });
function gameLoop() { if (!isShooting) draw(); requestAnimationFrame(gameLoop); }
updateValues(); gameLoop();
