const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sliderA = document.getElementById('sliderA'), sliderP = document.getElementById('sliderP'), sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA'), valP = document.getElementById('valP'), valQ = document.getElementById('valQ');
const levelText = document.getElementById('currentLevel'), eqText = document.getElementById('equationText');
const shootBtn = document.getElementById('shootBtn'), message = document.getElementById('message');

// 게임 수학 좌표계 설정
const scale = 20; 
const originX = 60;  
const originY = 350; 

let isShooting = false, isBounced = false;
let ballX = 0, vx = 0.35; // 방정식 상에서 x가 전진하는 기본 속도 단위
let particles = [];

// 5단계 레벨 데이터
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
    
    // 바닥 기준선
    ctx.beginPath(); 
    ctx.strokeStyle = '#555'; 
    ctx.lineWidth = 2;
    ctx.moveTo(0, originY); 
    ctx.lineTo(canvas.width, originY); 
    ctx.stroke();

    const stage = levels[currentLevelIdx];
    
    // 골대 세트 그리기
    const hx = getCanvasX(stage.x), hy = getCanvasY(stage.y);
    ctx.fillStyle = '#fff'; 
    ctx.fillRect(hx + 10, hy - 50, 6, 100); // 백보드 벽
    
    ctx.beginPath(); 
    ctx.strokeStyle = '#ff4500'; 
    ctx.lineWidth = 4;
    ctx.moveTo(hx - 25, hy); 
    ctx.lineTo(hx + 10, hy); 
    ctx.stroke(); // 농구 링

    const a = parseFloat(sliderA.value) || -0.1;
    const p = parseFloat(sliderP.value) || 15;
    const q = parseFloat(sliderQ.value) || 15;

    if (!isShooting) {
        // 조준용 짧은 점선 가이드 (x가 0부터 8까지만 표기되며 바닥 아래로 내려가지 않음)
        ctx.beginPath(); 
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; 
        ctx.setLineDash([4, 4]);
        for (let x = 0; x <= 8; x += 0.5) {
            const y = a * Math.pow(x - p, 2) + q;
            if (y < 0) break;
            if (x === 0) ctx.moveTo(getCanvasX(x), getCanvasY(y));
            else ctx.lineTo(getCanvasX(x), getCanvasY(y));
        }
        ctx.stroke(); 
        ctx.setLineDash([]);
        
        // 발사 대기 중 (공이 포물선 시작점 x=0 에 고정)
        const startY = a * Math.pow(0 - p, 2) + q;
        drawBall(0, startY);
    } else {
        // 발사 진행 중 (수학 함수 궤적을 실시간 순방향 추적)
        const currentY = a * Math.pow(ballX - p, 2) + q;
        drawBall(ballX, currentY);
    }
    
    updateParticles();
}

function drawBall(x, y) {
    const cx = getCanvasX(x), cy = getCanvasY(y);
    const radius = 12;
    
    // 화면 이탈 방지 예외처리
    const safeX = Math.max(radius, Math.min(canvas.width - radius, cx));
    const safeY = Math.max(radius, Math.min(canvas.height - radius, cy));

    ctx.beginPath();
    const grad = ctx.createRadialGradient(safeX - 3, safeY - 3, 2, safeX, safeY, radius);
    grad.addColorStop(0, '#ff9933'); 
    grad.addColorStop(1, '#cc5500');
    ctx.arc(safeX, safeY, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad; 
    ctx.fill();
    ctx.strokeStyle = '#333'; 
    ctx.lineWidth = 1.5; 
    ctx.stroke();
}

function startShoot() {
    if (isShooting) return;
    
    ballX = 0; // x좌표 시작점으로 리셋
    isShooting = true; 
    isBounced = false;
    vx = 0.35; // 초기 순방향 속도 지정
    animate();
}

function animate() {
    if (!isShooting) return;
    
    // x를 고정 속도로 계속 전진시킴
    ballX += vx; 
    
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);
    
    // 현재 x에 매칭되는 완전한 방정식 y 좌표 산출
    const currentY = a * Math.pow(ballX - p, 2) + q;
    const stage = levels[currentLevelIdx];

    // 1. 백보드 반사 물리 구현 (x 축이 백보드 벽을 만나면 튕겨서 반대방향 x로 전진)
    if (!isBounced && ballX >= stage.x + 0.3 && currentY > stage.y - 2.5 && currentY < stage.y + 2.5) {
        vx = -vx * 0.7; // 진행 방향 전환 (반사)
        isBounced = true; 
        message.innerText = "백보드 리바운드!";
    }

    // 2. 골인 판정 (공이 위에서 아래로 내려올 때 링 범위 체크)
    // 수학 함수에서 대칭축 p보다 x가 커지면 공은 내려오게 됩니다 (하강 체크: ballX > p)
    if (ballX >= stage.x - 1.5 && ballX <= stage.x + 0.5 && Math.abs(currentY - stage.y) < 0.7 && ballX > p) {
        message.innerText = "골인! 성공입니다! 🎆"; 
        isShooting = false;
        createFireworks(getCanvasX(ballX), getCanvasY(currentY));
        setTimeout(nextLevel, 1200); 
        return;
    }

    // 3. 실패 판정 (공이 지면 아래로 떨어지거나 화면 좌우 경계를 크게 이탈한 경우)
    if (currentY < -2 || ballX > 50 || ballX < -5) {
        message.innerText = "실패! 다시 조절해보세요."; 
        isShooting = false; 
        return;
    }
    
    draw();
    requestAnimationFrame(animate);
}

function nextLevel() {
    currentLevelIdx = (currentLevelIdx + 1) % levels.length;
    updateLevelConfig();
}

function updateLevelConfig() {
    const config = levels[currentLevelIdx];
    
    sliderA.min = config.rangeA[0]; 
    sliderA.max = config.rangeA[1];
    sliderA.value = (config.rangeA[0] + config.rangeA[1]) / 2; 
    
    sliderP.min = config.rangeP[0]; 
    sliderP.max = config.rangeP[1];
    sliderP.value = (config.rangeP[0] + config.rangeP[1]) / 2; 
    
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

window.onload = function() {
    updateLevelConfig();
    function loop() { 
        if(!isShooting) draw(); 
        requestAnimationFrame(loop); 
    }
    loop();
};
