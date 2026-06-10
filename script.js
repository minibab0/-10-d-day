const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sliderA = document.getElementById('sliderA'), sliderP = document.getElementById('sliderP'), sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA'), valP = document.getElementById('valP'), valQ = document.getElementById('valQ');
const levelText = document.getElementById('currentLevel'), eqText = document.getElementById('equationText');
const shootBtn = document.getElementById('shootBtn'), message = document.getElementById('message');

const scale = 20; 
const originX = 40;  
const originY = 350; 

let isShooting = false;
let ballX = 0, startX = 0, vx = 0.4; 
let particles = [];
let reqId = null; // 애니메이션 충돌 방지용 ID

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
    
    // 바닥선
    ctx.beginPath(); 
    ctx.strokeStyle = '#666'; 
    ctx.lineWidth = 2;
    ctx.moveTo(0, originY); 
    ctx.lineTo(canvas.width, originY); 
    ctx.stroke();

    const stage = levels[currentLevelIdx];
    
    // 골대
    const hx = getCanvasX(stage.x), hy = getCanvasY(stage.y);
    ctx.fillStyle = '#f0f0f0'; 
    ctx.fillRect(hx + 10, hy - 50, 6, 100); 
    ctx.beginPath(); 
    ctx.strokeStyle = '#ff4500'; 
    ctx.lineWidth = 4;
    ctx.moveTo(hx - 25, hy); 
    ctx.lineTo(hx + 10, hy); 
    ctx.stroke(); 

    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);

    // 공이 시작할 바닥 좌표(이차방정식의 근)
    startX = p - Math.sqrt(Math.abs(q / a));

    if (!isShooting) {
        // 전체 궤도 점선 표시
        ctx.beginPath(); 
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; 
        ctx.setLineDash([5, 5]);
        
        for (let x = startX; x <= 45; x += 0.5) {
            const y = a * Math.pow(x - p, 2) + q;
            if (y < -0.1) { // 부동소수점 오차로 점선이 끊기는 현상 방지
                ctx.lineTo(getCanvasX(x), getCanvasY(y));
                break; 
            }
            if (x === startX) ctx.moveTo(getCanvasX(x), getCanvasY(y));
            else ctx.lineTo(getCanvasX(x), getCanvasY(y));
        }
        ctx.stroke(); 
        ctx.setLineDash([]);
        
        // 대기 중인 공
        drawBall(startX, 0);
    } else {
        // 날아가는 공
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

// 애니메이션 단일 루프 엔진 (오류 해결의 핵심)
function gameLoop() {
    if (!isShooting && particles.length === 0) {
        reqId = null; // 작업이 없으면 루프 완전 종료 (성능 최적화)
        return;
    }

    if (isShooting) {
        ballX += vx; 
        
        const a = parseFloat(sliderA.value);
        const p = parseFloat(sliderP.value);
        const q = parseFloat(sliderQ.value);
        const currentY = a * Math.pow(ballX - p, 2) + q;
        const stage = levels[currentLevelIdx];

        // 충돌 판정
        if (ballX >= stage.x + 0.3 && currentY > stage.y - 2.5 && currentY < stage.y + 2.5) {
            message.innerText = "텅! 백보드에 부딪혔습니다. 포물선을 높여보세요!";
            isShooting = false; 
            setTimeout(resetBall, 1000);
        } 
        else if (ballX >= stage.x - 1.5 && ballX <= stage.x + 0.5 && Math.abs(currentY - stage.y) < 1.0 && ballX > p) {
            message.innerText = "클린 샷! 완벽한 이차함수입니다! 🎆"; 
            isShooting = false;
            createFireworks(getCanvasX(ballX), getCanvasY(currentY));
            setTimeout(nextLevel, 1500); 
        } 
        else if (currentY < -0.5 || ballX > 45) {
            message.innerText = "아쉽네요! 다시 조절해보세요."; 
            isShooting = false; 
            setTimeout(resetBall, 1000);
        }
    }
    
    draw();
    reqId = requestAnimationFrame(gameLoop);
}

function startShoot() {
    if (isShooting) return; // 중복 클릭 방지
    ballX = startX; 
    isShooting = true; 
    message.innerText = "날아갑니다!";
    
    if (!reqId) {
        gameLoop(); // 멈춰있던 엔진 가동
    }
}

function resetBall() {
    isShooting = false;
    updateValues(); // 공을 제자리로 돌림
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
    
    // 발사 중이 아닐 때만 화면을 갱신 (루프 충돌 방지)
    if (!isShooting) {
        draw();
    }
}

function createFireworks(x, y) {
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2, speed = Math.random() * 6 + 2;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color: `hsl(${Math.random() * 360}, 100%, 60%)`, life: 1.0 });
    }
    if (!reqId) gameLoop(); // 폭죽을 그리기 위해 엔진 가동
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

// 브라우저 켜짐과 동시에 초기 1회 렌더링
window.onload = () => updateValues();
