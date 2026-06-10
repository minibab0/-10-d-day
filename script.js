const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sliderA = document.getElementById('sliderA'), sliderP = document.getElementById('sliderP'), sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA'), valP = document.getElementById('valP'), valQ = document.getElementById('valQ');
const levelText = document.getElementById('currentLevel'), eqText = document.getElementById('equationText');
const shootBtn = document.getElementById('shootBtn'), message = document.getElementById('message');

// 게임 수학 좌표계 설정
const scale = 20; 
const originX = 60;  // 대포(출발점)의 화면상 X 좌표
const originY = 350; // 바닥선의 화면상 Y 좌표 (400 안쪽으로 올려서 공이 보이게 수정)

let isShooting = false, isBounced = false;
let curX = 0, curY = 0, vx = 0, vy = 0, gravity = 0, particles = [];

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
    // 화면 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 바닥 기준선 그리기
    ctx.beginPath(); 
    ctx.strokeStyle = '#555'; 
    ctx.lineWidth = 2;
    ctx.moveTo(0, originY); 
    ctx.lineTo(canvas.width, originY); 
    ctx.stroke();

    const stage = levels[currentLevelIdx];
    
    // 1. 골대 세트 (백보드와 링) 그리기
    const hx = getCanvasX(stage.x), hy = getCanvasY(stage.y);
    ctx.fillStyle = '#fff'; 
    ctx.fillRect(hx + 10, hy - 50, 6, 100); // 백보드 벽
    
    ctx.beginPath(); 
    ctx.strokeStyle = '#ff4500'; 
    ctx.lineWidth = 4;
    ctx.moveTo(hx - 25, hy); 
    ctx.lineTo(hx + 10, hy); 
    ctx.stroke(); // 농구 링

    // 슬라이더 값 파싱
    const a = parseFloat(sliderA.value) || -0.1;
    const p = parseFloat(sliderP.value) || 15;
    const q = parseFloat(sliderQ.value) || 15;

    // 2. 궤적 및 공 그리기
    if (!isShooting) {
        // 조준용 점선 가이드
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
        ctx.setLineDash([]); // 점선 초기화
        
        // 발사 대기 중인 공 위치 계산 ($x=0$)
        const startY = a * Math.pow(0 - p, 2) + q;
        drawBall(0, startY);
    } else {
        // 날아가는 중인 공
        drawBall(curX, curY);
    }
    
    // 폭죽 효과 업데이트
    updateParticles();
}

function drawBall(x, y) {
    const cx = getCanvasX(x), cy = getCanvasY(y);
    const radius = 12;
    
    // 공이 화면 밖으로 탈출해서 안 보이는 현상 방지 (클램핑)
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
    
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);
    
    curX = 0; 
    curY = a * Math.pow(0 - p, 2) + q;
    
    const speed = 0.4;
    vx = speed; 
    vy = (-2 * a * (0 - p)) * speed; 
    gravity = -2 * a * Math.pow(speed, 2); 
    
    isShooting = true; 
    isBounced = false;
    animate();
}

function animate() {
    if (!isShooting) return;
    
    curX += vx; 
    vy -= gravity; 
    curY += vy;
    
    const stage = levels[currentLevelIdx];

    // 백보드 충돌 엔진
    if (!isBounced && curX >= stage.x + 0.3 && curY > stage.y - 2.5 && curY < stage.y + 2.5) {
        vx = -vx * 0.7; 
        isBounced = true; 
        message.innerText = "백보드 리바운드!";
    }

    // 골인 판정
    if (curX >= stage.x - 1.5 && curX <= stage.x + 0.5 && Math.abs(curY - stage.y) < 0.7 && vy < 0) {
        message.innerText = "골인! 성공입니다! 🎆"; 
        isShooting = false;
        createFireworks(getCanvasX(curX), getCanvasY(curY));
        setTimeout(nextLevel, 1200); 
        return;
    }

    // 실패 판정 (바닥 추락)
    if (curY < -5 || curX > 50 || curX < -5) {
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
    
    // 슬라이더 범위를 레벨에 맞게 동적 교체
    sliderA.min = config.rangeA[0]; 
    sliderA.max = config.rangeA[1];
    sliderA.value = (config.rangeA[0] + config.rangeA[1]) / 2; // 중앙값 초기화
    
    sliderP.min = config.rangeP[0]; 
    sliderP.max = config.rangeP[1];
    sliderP.value = (config.rangeP[0] + config.rangeP[1]) / 2; // 중앙값 초기화
    
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

// 이벤트 리스너 바인딩
sliderA.addEventListener('input', updateValues);
sliderP.addEventListener('input', updateValues);
sliderQ.addEventListener('input', updateValues);
shootBtn.addEventListener('click', startShoot);

// 브라우저 로드가 완료되는 즉시 강제 드로우 실행 순서 보장
window.onload = function() {
    updateLevelConfig();
    function loop() { 
        if(!isShooting) draw(); 
        requestAnimationFrame(loop); 
    }
    loop();
};
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sliderA = document.getElementById('sliderA'), sliderP = document.getElementById('sliderP'), sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA'), valP = document.getElementById('valP'), valQ = document.getElementById('valQ');
const levelText = document.getElementById('currentLevel'), eqText = document.getElementById('equationText');
const shootBtn = document.getElementById('shootBtn'), message = document.getElementById('message');

// 게임 수학 좌표계 설정
const scale = 20; 
const originX = 60;  // 대포(출발점)의 화면상 X 좌표
const originY = 350; // 바닥선의 화면상 Y 좌표 (400 안쪽으로 올려서 공이 보이게 수정)

let isShooting = false, isBounced = false;
let curX = 0, curY = 0, vx = 0, vy = 0, gravity = 0, particles = [];

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
    // 화면 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 바닥 기준선 그리기
    ctx.beginPath(); 
    ctx.strokeStyle = '#555'; 
    ctx.lineWidth = 2;
    ctx.moveTo(0, originY); 
    ctx.lineTo(canvas.width, originY); 
    ctx.stroke();

    const stage = levels[currentLevelIdx];
    
    // 1. 골대 세트 (백보드와 링) 그리기
    const hx = getCanvasX(stage.x), hy = getCanvasY(stage.y);
    ctx.fillStyle = '#fff'; 
    ctx.fillRect(hx + 10, hy - 50, 6, 100); // 백보드 벽
    
    ctx.beginPath(); 
    ctx.strokeStyle = '#ff4500'; 
    ctx.lineWidth = 4;
    ctx.moveTo(hx - 25, hy); 
    ctx.lineTo(hx + 10, hy); 
    ctx.stroke(); // 농구 링

    // 슬라이더 값 파싱
    const a = parseFloat(sliderA.value) || -0.1;
    const p = parseFloat(sliderP.value) || 15;
    const q = parseFloat(sliderQ.value) || 15;

    // 2. 궤적 및 공 그리기
    if (!isShooting) {
        // 조준용 점선 가이드
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
        ctx.setLineDash([]); // 점선 초기화
        
        // 발사 대기 중인 공 위치 계산 ($x=0$)
        const startY = a * Math.pow(0 - p, 2) + q;
        drawBall(0, startY);
    } else {
        // 날아가는 중인 공
        drawBall(curX, curY);
    }
    
    // 폭죽 효과 업데이트
    updateParticles();
}

function drawBall(x, y) {
    const cx = getCanvasX(x), cy = getCanvasY(y);
    const radius = 12;
    
    // 공이 화면 밖으로 탈출해서 안 보이는 현상 방지 (클램핑)
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
    
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);
    
    curX = 0; 
    curY = a * Math.pow(0 - p, 2) + q;
    
    const speed = 0.4;
    vx = speed; 
    vy = (-2 * a * (0 - p)) * speed; 
    gravity = -2 * a * Math.pow(speed, 2); 
    
    isShooting = true; 
    isBounced = false;
    animate();
}

function animate() {
    if (!isShooting) return;
    
    curX += vx; 
    vy -= gravity; 
    curY += vy;
    
    const stage = levels[currentLevelIdx];

    // 백보드 충돌 엔진
    if (!isBounced && curX >= stage.x + 0.3 && curY > stage.y - 2.5 && curY < stage.y + 2.5) {
        vx = -vx * 0.7; 
        isBounced = true; 
        message.innerText = "백보드 리바운드!";
    }

    // 골인 판정
    if (curX >= stage.x - 1.5 && curX <= stage.x + 0.5 && Math.abs(curY - stage.y) < 0.7 && vy < 0) {
        message.innerText = "골인! 성공입니다! 🎆"; 
        isShooting = false;
        createFireworks(getCanvasX(curX), getCanvasY(curY));
        setTimeout(nextLevel, 1200); 
        return;
    }

    // 실패 판정 (바닥 추락)
    if (curY < -5 || curX > 50 || curX < -5) {
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
    
    // 슬라이더 범위를 레벨에 맞게 동적 교체
    sliderA.min = config.rangeA[0]; 
    sliderA.max = config.rangeA[1];
    sliderA.value = (config.rangeA[0] + config.rangeA[1]) / 2; // 중앙값 초기화
    
    sliderP.min = config.rangeP[0]; 
    sliderP.max = config.rangeP[1];
    sliderP.value = (config.rangeP[0] + config.rangeP[1]) / 2; // 중앙값 초기화
    
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

// 이벤트 리스너 바인딩
sliderA.addEventListener('input', updateValues);
sliderP.addEventListener('input', updateValues);
sliderQ.addEventListener('input', updateValues);
shootBtn.addEventListener('click', startShoot);

// 브라우저 로드가 완료되는 즉시 강제 드로우 실행 순서 보장
window.onload = function() {
    updateLevelConfig();
    function loop() { 
        if(!isShooting) draw(); 
        requestAnimationFrame(loop); 
    }
    loop();
};
