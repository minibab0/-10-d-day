const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI 컨트롤
const sliderA = document.getElementById('sliderA');
const sliderP = document.getElementById('sliderP');
const sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA');
const valP = document.getElementById('valP');
const valQ = document.getElementById('valQ');
const shootBtn = document.getElementById('shootBtn');
const message = document.getElementById('message');

// 물리 및 좌표 설정
const scale = 20; 
const originX = 60; 
const originY = 380; 

const hoopX = 33; 
const hoopY = 11;

let isShooting = false;
let ballX = 0;
let particles = [];

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 바닥 선
    ctx.beginPath();
    ctx.strokeStyle = '#2a2a4a';
    ctx.moveTo(0, originY);
    ctx.lineTo(canvas.width, originY);
    ctx.stroke();

    drawHoop();
    
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);

    if (!isShooting) {
        // 궤적을 앞으로 조금만 표시 (힌트)
        drawTrajectory(a, p, q, 6); 
        // 시작 위치의 공
        drawBall(0, a * Math.pow(0 - p, 2) + q);
    } else {
        const y = a * Math.pow(ballX - p, 2) + q;
        drawBall(ballX, y);
    }

    updateParticles();
}

function getCanvasX(mathX) { return originX + mathX * scale; }
function getCanvasY(mathY) { return originY - mathY * scale; }

function drawHoop() {
    const cx = getCanvasX(hoopX);
    const cy = getCanvasY(hoopY);
    
    // 백보드
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(cx + 10, cy - 50, 6, 100);
    
    // 링 (골대)
    ctx.beginPath();
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.moveTo(cx - 25, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.stroke();

    // 그물 효과
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for(let i=0; i<=3; i++) {
        ctx.moveTo(cx - 20 + (i*10), cy);
        ctx.lineTo(cx - 20 + (i*10), cy + 30);
    }
    ctx.stroke();
}

function drawBall(x, y) {
    let cx = getCanvasX(x);
    let cy = getCanvasY(y);

    // 1. 공이 인터페이스(캔버스 영역) 밖으로 나가지 않게 클램핑
    const radius = 12;
    cx = Math.max(radius, Math.min(canvas.width - radius, cx));
    cy = Math.max(radius, Math.min(canvas.height - radius, cy));

    // 공 그림자
    ctx.beginPath();
    ctx.arc(cx, cy + 3, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // 공 본체
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff8c00';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 농구공 무늬
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.stroke();
}

function drawTrajectory(a, p, q, limitX) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.setLineDash([4, 6]);
    
    // 3. 궤적을 앞부분(limitX)만 표시
    for (let x = 0; x <= limitX; x += 0.5) {
        const y = a * Math.pow(x - p, 2) + q;
        const cx = getCanvasX(x);
        const cy = getCanvasY(y);
        if (x === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
}

// 4. 골인 축하 폭죽 효과
function createFireworks(x, y) {
    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
            life: 1.0,
            gravity: 0.15
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life -= 0.015;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
}

function animateShoot() {
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);
    
    ballX += 0.45; 
    const ballY = a * Math.pow(ballX - p, 2) + q;
    
    draw();

    // 골인 판정
    if (ballX >= hoopX - 1.5 && ballX <= hoopX + 1) {
        if (ballY >= hoopY - 1 && ballY <= hoopY + 1) {
            message.innerText = "SWISH! 🎆 골인입니다!";
            message.style.color = "#00ffcc";
            createFireworks(getCanvasX(ballX), getCanvasY(ballY));
            isShooting = false;
            return;
        }
    }

    // 바닥 충돌 판정 (y < 0)
    if (ballY < -1 || ballX > 38) {
        message.innerText = "아쉽네요! 방정식을 다시 세워보세요.";
        message.style.color = "#ff4d4d";
        isShooting = false;
        return;
    }

    if (isShooting) requestAnimationFrame(animateShoot);
}

function updateValues() {
    valA.innerText = parseFloat(sliderA.value).toFixed(2);
    valP.innerText = parseFloat(sliderP.value).toFixed(1);
    valQ.innerText = parseFloat(sliderQ.value).toFixed(1);
    draw();
}

sliderA.addEventListener('input', updateValues);
sliderP.addEventListener('input', updateValues);
sliderQ.addEventListener('input', updateValues);

shootBtn.addEventListener('click', () => {
    if (!isShooting) {
        isShooting = true;
        ballX = 0;
        message.innerText = "슛 진행 중...";
        message.style.color = "#ffd700";
        animateShoot();
    }
});

// 초기화
updateValues();
// 폭죽 애니메이션을 위한 루프
function gameLoop() {
    if (!isShooting) draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();
