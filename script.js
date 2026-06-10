const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sliderA = document.getElementById('sliderA'), sliderP = document.getElementById('sliderP'), sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA'), valP = document.getElementById('valP'), valQ = document.getElementById('valQ');
const levelText = document.getElementById('currentLevel'), eqText = document.getElementById('equationText');
const shootBtn = document.getElementById('shootBtn'), message = document.getElementById('message');

// 좌표계 설정
const scale = 20; 
const originX = 40;  
const originY = 350; 

let isShooting = false;
let ballX = 0, startX = 0, vx = 0.4; 
let particles = [];

// 단계별 골대 위치 데이터
const levels = [
    { x: 20, y: 8 },
    { x: 28, y: 12 },
    { x: 18, y: 16 },
    { x: 32, y: 10 },
    { x: 35, y: 15 }
];
let currentLevelIdx = 0;

function getCanvasX(mathX) { return originX + mathX * scale; }
function getCanvasY(mathY) { return originY - mathY * scale; }

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. 지면(바닥선) 그리기
    ctx.beginPath(); 
    ctx.strokeStyle = '#666'; 
    ctx.lineWidth = 2;
    ctx.moveTo(0, originY); 
    ctx.lineTo(canvas.width, originY); 
    ctx.stroke();

    const stage = levels[currentLevelIdx];
    
    // 2. 골대 그리기
    const hx = getCanvasX(stage.x), hy = getCanvasY(stage.y);
    ctx.fillStyle = '#f0f0f0'; 
    ctx.fillRect(hx + 10, hy - 50, 6, 100); // 백보드
    
    ctx.beginPath(); 
    ctx.strokeStyle = '#ff4500'; 
    ctx.lineWidth = 4;
    ctx.moveTo(hx - 25, hy); 
    ctx.lineTo(hx + 10, hy); 
    ctx.stroke(); // 링

    // 슬라이더 값 가져오기
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);

    // [핵심 수정] 이차방정식의 근을 구하여 공이 무조건 땅(y=0)에서 시작하도록 계산
    startX = p - Math.sqrt(Math.abs(q / a));

    if (!isShooting) {
        // 3. 전체 궤도 점선 표시 (땅에서부터 지면에 닿을 때까지)
        ctx.beginPath(); 
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; 
        ctx.setLineDash([5, 5]);
        
        for (let x = startX; x <= 45; x += 0.5) {
            const y = a * Math.pow(x - p, 2) + q;
            if (y < 0) { 
                ctx.lineTo(getCanvasX(x), getCanvasY(y));
                break; 
            }
            if (x === startX) ctx.moveTo(getCanvasX(x), getCanvasY(y));
            else ctx.lineTo(getCanvasX(x), getCanvasY(y));
        }
        ctx.stroke(); 
        ctx.setLineDash([]);
        
        // 발사 전 공은 땅(startX)에 대기
        drawBall(startX, 0);
    } else {
        // 발사된 공은 식을 따라 움직임
        const currentY = a * Math.pow(ballX - p, 2) + q;
        drawBall(ballX, currentY);
    }
    
    updateParticles();
}

function drawBall(x, y) {
    const cx = getCanvasX(x), cy = getCanvasY(y);
    const radius = 12;
    
    ctx.beginPath();
    const grad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, radius);
    grad.addColorStop(0, '#ff9933'); 
    grad.addColorStop(1, '#cc5500');
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad; 
    ctx.fill();
    ctx.strokeStyle = '#333'; 
    ctx.lineWidth = 1; 
    ctx.stroke();
}

function startShoot() {
    if (isShooting) return;
    
    // 계산된 시작점(땅)에서 출발
    ballX = startX; 
    isShooting = true; 
    message.innerText = "날아갑니다!";
    animate();
}

function animate() {
    if (!isShooting) return;
    
    ballX += vx; 
    
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);
    
    const currentY = a * Math.pow(ballX - p, 2) + q;
    const stage = levels[currentLevelIdx];

    // 백보드 충돌 판정 (수학 그래프가 백보드 벽을 통과할 때)
    if (ballX >= stage.x + 0.3 && currentY > stage.y - 2.5 && currentY < stage.y + 2.5) {
        message.innerText = "텅! 백보드에 부딪혔습니다. 포물선을 높여보세요!";
        isShooting = false; 
        return;
    }

    // 골인 판정 (공이 정점 p를 지나 하강하며 링을 통과할 때)
    if (ballX >= stage.x - 1.5 && ballX <= stage.x + 0.5 && Math.abs(currentY - stage.y) < 1.0 && ballX > p) {
        message.innerText = "클린 샷! 완벽한 이차함수입니다! 🎆"; 
        isShooting = false;
        createFireworks(getCanvasX(ballX), getCanvasY(currentY));
        setTimeout(nextLevel, 1500); 
        return;
    }

    // 실패 판정 (공이 땅에 닿거나 캔버스를 벗어남)
    if (currentY < -0.5 || ballX > 45) {
        message.innerText = "아쉽네요! 다시 조절해보세요."; 
        isShooting = false; 
        return;
    }
    
    draw();
    requestAnimationFrame(animate);
}

function nextLevel() {
    currentLevelIdx = (currentLevelIdx + 1) % levels.length;
    levelText.innerText = currentLevelIdx + 1;
    message.innerText = "다음 단계입니다! 방정식을 맞추세요.";
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
        const angle = Math.random() * Math.PI * 2, speed = Math.random() * 6 + 2;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color: `hsl(${Math.random() * 360}, 100%, 60%)`, life: 1.0 });
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

// 이벤트 연결
sliderA.addEventListener('input', updateValues);
sliderP.addEventListener('input', updateValues);
sliderQ.addEventListener('input', updateValues);
shootBtn.addEventListener('click', startShoot);

// 브라우저 켜짐과 동시에 실행
window.onload = function() {
    updateValues();
    function loop() { 
        if(!isShooting) draw(); 
        requestAnimationFrame(loop); 
    }
    loop();
};
