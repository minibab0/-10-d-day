const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 슬라이더 및 UI 요소
const sliderA = document.getElementById('sliderA'), sliderP = document.getElementById('sliderP'), sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA'), valP = document.getElementById('valP'), valQ = document.getElementById('valQ');
const levelText = document.getElementById('currentLevel'), eqText = document.getElementById('equationText');
const shootBtn = document.getElementById('shootBtn'), message = document.getElementById('message');

// 좌표 설정
const scale = 20, originX = 60, originY = 380;

// 물리 변수
let isShooting = false, isBounced = false;
let curX, curY, vx, vy, gravity;
let particles = [];

// 5단계 레벨 구성 (위치 및 슬라이더 제한 범위)
const levels = [
    { x: 25, y: 8,  rangeA: [-0.300, -0.050], rangeP: [10.000, 20.000] },
    { x: 34, y: 12, rangeA: [-0.200, -0.030], rangeP: [15.000, 30.000] },
    { x: 18, y: 15, rangeA: [-0.300, -0.100], rangeP: [5.000, 15.000] },
    { x: 30, y: 7,  rangeA: [-0.150, -0.040], rangeP: [20.000, 35.000] },
    { x: 36, y: 16, rangeA: [-0.250, -0.050], rangeP: [10.000, 30.000] }
];
let currentLevelIdx = 0;

function getCanvasX(mathX) { return originX + mathX * scale; }
function getCanvasY(mathY) { return originY - mathY * scale; }

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 바닥 선
    ctx.beginPath(); ctx.strokeStyle = '#555'; ctx.moveTo(0, originY); ctx.lineTo(canvas.width, originY); ctx.stroke();

    const stage = levels[currentLevelIdx];
    drawHoop(stage.x, stage.y);
    
    const a = parseFloat(sliderA.value), p = parseFloat(sliderP.value), q = parseFloat(sliderQ.value);

    if (!isShooting) {
        drawTrajectory(a, p, q); // 짧아진 가이드 점선
        drawBall(0, a * Math.pow(0 - p, 2) + q);
    } else {
        drawBall(curX, curY);
    }
    updateParticles();
}

function drawHoop(hx, hy) {
    const cx = getCanvasX(hx), cy = getCanvasY(hy);
    // 백보드
    ctx.fillStyle = '#fff'; ctx.fillRect(cx + 10, cy - 50, 6, 100);
    // 링
    ctx.beginPath(); ctx.strokeStyle = '#ff4500'; ctx.lineWidth = 4;
    ctx.moveTo(cx - 25, cy); ctx.lineTo(cx + 10, cy); ctx.stroke();
}

function drawBall(x, y) {
    const cx = getCanvasX(x), cy = getCanvasY(y);
    const radius = 12;
    // 농구공 디자인
    const grad = ctx.createRadialGradient(cx-3, cy-3, 2, cx, cy, radius);
    grad.addColorStop(0, '#ff9933'); grad.addColorStop(1, '#cc5500');
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
    // 공 무늬
    ctx.beginPath(); ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy); ctx.stroke();
}

function drawTrajectory(a, p, q) {
    ctx.beginPath(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.setLineDash([3, 5]);
    // 점선을 x=8 까지만 짧게 표시
    for (let x = 0; x <= 8; x += 0.5) {
        const y = a * Math.pow(x - p, 2) + q;
        if (y < 0) break;
        const cx = getCanvasX(x), cy = getCanvasY(y);
        if (x === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke(); ctx.setLineDash([]);
}

function startShoot() {
    if (isShooting) return;
    const a = parseFloat(sliderA.value), p = parseFloat(sliderP.value), q = parseFloat(sliderQ.value);
    
    curX = 0; curY = a * Math.pow(0 - p, 2) + q;
    const speed = 0.4;
    vx = speed;
    vy = (-2 * a * (0 - p)) * speed; 
    gravity = -2 * a * Math.pow(speed, 2); 

    isShooting = true; isBounced = false;
    animate();
}

function animate() {
    if (!isShooting) return;

    curX += vx;
    vy -= gravity;
    curY += vy;

    const stage = levels[currentLevelIdx];

    // 백보드 충돌 (튕겨나기)
    if (!isBounced && curX >= stage.x + 0.3 && curY > stage.y - 2.5 && curY < stage.y + 2.5) {
        vx = -vx * 0.7; // 70% 힘으로 반사
        isBounced = true;
        message.innerText = "백보드 반동!";
    }

    // 골인 판정 (링 안쪽 범위 및 하강 시점)
    if (curX >= stage.x - 1.5 && curX <= stage.x + 0.5 && Math.abs(curY - stage.y) < 0.7 && vy < 0) {
        message.innerText = "성공!";
        isShooting = false;
        createFireworks(getCanvasX(curX), getCanvasY(curY));
        setTimeout(nextLevel, 1200);
        return;
    }

    // 실패 판정
    if (curY < -2 || curX > 50 || curX < -5) {
        message.innerText = "실패! 다시 시도하세요.";
        isShooting = false;
        return;
    }

    draw();
    requestAnimationFrame(animate);
}

function nextLevel() {
    currentLevelIdx++;
    if (currentLevelIdx >= levels.length) {
        message.innerText = "축하합니다! 모든 단계를 클리어했습니다!";
        currentLevelIdx = 0;
    }
    updateLevelConfig();
}

function updateLevelConfig() {
    const config = levels[currentLevelIdx];
    sliderA.min = config.rangeA[0]; sliderA.max = config.rangeA[1];
    sliderP.min = config.rangeP[0]; sliderP.max = config.rangeP[1];
    levelText.innerText = currentLevelIdx + 1;
    updateValues();
}

function updateValues() {
    valA.innerText = parseFloat(sliderA.value).toFixed(3);
    valP.innerText = parseFloat(sliderP.value).toFixed(3);
    valQ.innerText = parseFloat(sliderQ.value).toFixed(3);
    eqText.innerText = `y = ${valA.innerText}(x - ${valP.innerText})² + ${valQ.innerText}`;
    draw();
}

function createFireworks(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2, speed = Math.random() * 5 + 2;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color: `hsl(${Math.random() * 360}, 100%, 50%)`, life: 1.0 });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.02;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

sliderA.addEventListener('input', updateValues);
sliderP.addEventListener('input', updateValues);
sliderQ.addEventListener('input', updateValues);
shootBtn.addEventListener('click', startShoot);

updateLevelConfig();
