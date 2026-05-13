const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 슬라이더 및 UI 요소
const sliderA = document.getElementById('sliderA');
const sliderP = document.getElementById('sliderP');
const sliderQ = document.getElementById('sliderQ');
const valA = document.getElementById('valA');
const valP = document.getElementById('valP');
const valQ = document.getElementById('valQ');
const shootBtn = document.getElementById('shootBtn');
const message = document.getElementById('message');

// 게임 설정 (수학 좌표계를 캔버스 픽셀로 변환하기 위한 변수)
const scale = 20; // 1 수학 단위 = 20 픽셀
const originX = 50; // 공이 출발하는 x 픽셀 위치
const originY = 350; // 공이 출발하는 y 픽셀 위치

// 골대 위치 (수학 좌표 기준)
const hoopX = 30;
const hoopY = 12;

let isShooting = false;
let ballX = 0;
let animationId;

// 화면 초기화 및 렌더링
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawHoop();
    
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);

    // 슛을 쏘기 전이면 예상 궤적을 점선으로 표시
    if (!isShooting) {
        drawTrajectory(a, p, q);
        drawBall(0, a * Math.pow(0 - p, 2) + q); // 공을 시작 위치에 그림
    } else {
        // 슛이 진행 중이면 현재 공의 위치를 그림
        const y = a * Math.pow(ballX - p, 2) + q;
        drawBall(ballX, y);
    }
}

// 수학 좌표를 캔버스 x 픽셀로 변환
function getCanvasX(mathX) {
    return originX + mathX * scale;
}

// 수학 좌표를 캔버스 y 픽셀로 변환 (y축은 아래로 갈수록 증가하므로 뒤집음)
function getCanvasY(mathY) {
    return originY - mathY * scale;
}

function drawHoop() {
    const cx = getCanvasX(hoopX);
    const cy = getCanvasY(hoopY);
    
    // 백보드
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx + 10, cy - 40, 5, 80);
    
    // 링
    ctx.beginPath();
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 4;
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.stroke();
}

function drawBall(x, y) {
    const cx = getCanvasX(x);
    const cy = getCanvasY(y);
    
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ff8c00'; // 농구공 색상
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawTrajectory(a, p, q) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // 점선
    
    for (let x = 0; x <= 35; x += 0.5) {
        const y = a * Math.pow(x - p, 2) + q;
        const cx = getCanvasX(x);
        const cy = getCanvasY(y);
        
        if (x === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]); // 점선 초기화
}

// 애니메이션 실행
function animateShoot() {
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);
    
    ballX += 0.4; // 공의 이동 속도
    const ballY = a * Math.pow(ballX - p, 2) + q;
    
    draw();

    // 골대 근처 도달 시 판정
    if (ballX >= hoopX - 1 && ballX <= hoopX + 1) {
        if (ballY >= hoopY - 1 && ballY <= hoopY + 1) {
            message.innerText = "🏀 클린 슛! 완벽한 이차함수입니다!";
            message.style.color = "#00ff00";
            isShooting = false;
            return;
        }
    }

    // 바닥에 떨어지거나 화면 밖으로 나가면 실패
    if (ballY < 0 || ballX > 35) {
        message.innerText = "❌ 궤적이 빗나갔습니다. 방정식을 다시 수정하세요.";
        message.style.color = "#ff0000";
        isShooting = false;
        ballX = 0;
        setTimeout(draw, 1000); // 1초 후 초기화
        return;
    }

    animationId = requestAnimationFrame(animateShoot);
}

// 이벤트 리스너
function updateValues() {
    valA.innerText = parseFloat(sliderA.value).toFixed(2);
    valP.innerText = parseFloat(sliderP.value).toFixed(1);
    valQ.innerText = parseFloat(sliderQ.value).toFixed(1);
    if (!isShooting) draw();
}

sliderA.addEventListener('input', updateValues);
sliderP.addEventListener('input', updateValues);
sliderQ.addEventListener('input', updateValues);

shootBtn.addEventListener('click', () => {
    if (!isShooting) {
        isShooting = true;
        ballX = 0;
        message.innerText = "공이 날아갑니다...";
        message.style.color = "#ffd700";
        animateShoot();
    }
});

// 초기 화면 렌더링
draw();
