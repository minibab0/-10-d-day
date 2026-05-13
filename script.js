// --- 핵심 변경 및 추가된 로직 ---

// 1. 단계별 설정 (위치 및 슬라이더 제한 범위)
const levels = [
    { x: 25, y: 8,  rangeA: [-0.3, -0.05], rangeP: [10, 20] },
    { x: 34, y: 12, rangeA: [-0.2, -0.03], rangeP: [15, 30] },
    { x: 18, y: 15, rangeA: [-0.3, -0.1],  rangeP: [5, 15] },
    { x: 30, y: 7,  rangeA: [-0.15, -0.04], rangeP: [20, 35] },
    { x: 36, y: 16, rangeA: [-0.25, -0.05], rangeP: [10, 30] }
];

let curX, curY, vx, vy, gravity; // 물리 변수
let isBounced = false; // 백보드 충돌 여부

// 2. 점선 그리기 (길이 단축)
function drawTrajectory(a, p, q) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.setLineDash([2, 4]); // 더 촘촘하고 짧은 점선
    
    // x 범위를 10까지만 제한하여 가이드라인을 짧게 표시
    for (let x = 0; x <= 10; x += 0.5) {
        const y = a * Math.pow(x - p, 2) + q;
        if (y < 0) break;
        const cx = getCanvasX(x), cy = getCanvasY(y);
        if (x === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke(); ctx.setLineDash([]);
}

// 3. 발사 로직 (함수 -> 물리 기반 전환)
function startShoot() {
    const a = parseFloat(sliderA.value);
    const p = parseFloat(sliderP.value);
    const q = parseFloat(sliderQ.value);

    // 초기 위치 (x=0일 때의 y값)
    curX = 0;
    curY = a * Math.pow(0 - p, 2) + q;
    
    // 물리 파라미터 계산: 수학 함수와 일치하는 초기 속도와 중력 도출
    const speedScale = 0.45; 
    vx = speedScale;
    vy = (-2 * a * (0 - p)) * speedScale; // 함수의 미분계수를 이용한 초기 수직 속도
    gravity = -2 * a * Math.pow(speedScale, 2); // 곡률(a)에 비례하는 중력값
    
    isShooting = true;
    isBounced = false;
    animateShoot();
}

function animateShoot() {
    if (!isShooting) return;

    // 물리 업데이트
    curX += vx;
    vy -= gravity; // 중력 적용
    curY += vy;

    const cx = getCanvasX(curX), cy = getCanvasY(curY);
    const stage = levels[currentLevelIdx];
    const hoopX = getCanvasX(stage.x), hoopY = getCanvasY(stage.y);

    // --- 백보드 충돌 판정 (튕겨나기) ---
    // 백보드 위치(골대 뒤쪽 6px 영역)에 닿으면 x축 속도를 반전시킴
    if (!isBounced && curX >= stage.x + 0.5 && curY > stage.y - 2.5 && curY < stage.y + 2.5) {
        vx = -vx * 0.6; // 60%의 힘으로 튕겨나감
        isBounced = true;
        message.innerText = "백보드 강타! 들어갈까요?";
    }

    // --- 골인 판정 ---
    if (curX >= stage.x - 1.5 && curX <= stage.x + 0.5 && Math.abs(curY - stage.y) < 0.8 && vy < 0) {
        message.innerText = "클린 샷! 성공!";
        isShooting = false;
        createFireworks(cx, cy);
        setTimeout(nextLevel, 1500);
        return;
    }

    // 바닥 체크
    if (curY < -1 || curX > 50 || curX < -10) {
        message.innerText = "아쉽네요! 다시 해보세요.";
        isShooting = false;
        return;
    }

    draw();
    drawBall(curX, curY);
    requestAnimationFrame(animateShoot);
}

// 4. 단계별 범위 업데이트 함수
function updateLevelConfig() {
    const config = levels[currentLevelIdx];
    sliderA.min = config.rangeA[0]; sliderA.max = config.rangeA[1];
    sliderP.min = config.rangeP[0]; sliderP.max = config.rangeP[1];
    
    levelText.innerText = currentLevelIdx + 1;
    updateValues();
}

function updateValues() {
    // 소수점 3자리까지 표시
    valA.innerText = parseFloat(sliderA.value).toFixed(3);
    valP.innerText = parseFloat(sliderP.value).toFixed(3);
    valQ.innerText = parseFloat(sliderQ.value).toFixed(3);
    eqText.innerText = `y = ${valA.innerText}(x - ${valP.innerText})² + ${valQ.innerText}`;
    draw();
}
