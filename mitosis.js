/**
 * THPT VĨNH XUÂN - ONLINE EXPERIMENT
 * Module: Mô phỏng Nguyên phân (Mitosis Simulation)
 */

let mitosisCanvas, mCtx;
let mitosisAnimationId = null;
let mitosisIsRunning = false;
let mitosisProgress = 0; // Tiến trình chạy từ 0 đến 400 biểu diễn 4 kì tiếp diễn
let currentChosenStage = "prophase";

// Cấu trúc dữ liệu quản lý game sắp xếp
let selectedOrderSlotIndex = null;
let userOrderedAnswers = [null, null, null, null];
const correctMitosisOrder = ["Kì đầu", "Kì giữa", "Kì sau", "Kì cuối"];

// Khởi tạo sự kiện khi tải trang
document.addEventListener("DOMContentLoaded", () => {
    mitosisCanvas = document.getElementById("mitosis-canvas");
    if (mitosisCanvas) {
        mCtx = mitosisCanvas.getContext("2d");
        resetMitosisAnimation();
    }
});

// Hàm kích hoạt/tạm dừng hoạt hình kéo tách NST
function toggleMitosisAnimation() {
    const btn = document.getElementById("mitosis-btn");
    if (mitosisIsRunning) {
        mitosisIsRunning = false;
        btn.textContent = "▶ CHẠY THÍ NGHIỆM";
        cancelAnimationFrame(mitosisAnimationId);
    } else {
        mitosisIsRunning = true;
        btn.textContent = "⏸ TẠM DỪNG";
        animateMitosis();
    }
}

// Reset trạng thái ban đầu
function resetMitosisAnimation() {
    mitosisIsRunning = false;
    cancelAnimationFrame(mitosisAnimationId);
    const btn = document.getElementById("mitosis-btn");
    if (btn) btn.textContent = "▶ CHẠY THÍ NGHIỆM";
    mitosisProgress = 20; // Bắt đầu ở kì đầu
    currentChosenStage = "prophase";
    drawMitosisSimulation();
    updateChromosomeDataPanel();
}

// Chuyển nhanh sang một kì cụ thể
function setMitosisStage(stage) {
    mitosisIsRunning = false;
    cancelAnimationFrame(mitosisAnimationId);
    const btn = document.getElementById("mitosis-btn");
    if (btn) btn.textContent = "▶ CHẠY THÍ NGHIỆM";

    currentChosenStage = stage;
    if (stage === "prophase") mitosisProgress = 40;
    else if (stage === "metaphase") mitosisProgress = 130;
    else if (stage === "anaphase") mitosisProgress = 240;
    else if (stage === "telophase") mitosisProgress = 350;

    drawMitosisSimulation();
    updateChromosomeDataPanel();
}

// Hàm vòng lặp hoạt hình Render
function animateMitosis() {
    if (!mitosisIsRunning) return;
    mitosisProgress += 1;
    if (mitosisProgress > 400) {
        mitosisProgress = 0; // Lặp lại chu kỳ
    }

    // Cập nhật trạng thái chu kỳ dựa theo điểm tiến trình
    if (mitosisProgress <= 90) currentChosenStage = "prophase";
    else if (mitosisProgress <= 190) currentChosenStage = "metaphase";
    else if (mitosisProgress <= 290) currentChosenStage = "anaphase";
    else currentChosenStage = "telophase";

    drawMitosisSimulation();
    updateChromosomeDataPanel();
    mitosisAnimationId = requestAnimationFrame(animateMitosis);
}

// Vẽ đồ họa mô phỏng nhiễm sắc thể lên Canvas
function drawMitosisSimulation() {
    if (!mCtx) return;
    const w = mitosisCanvas.width;
    const height = mitosisCanvas.height;
    mCtx.clearRect(0, 0, w, height);

    const centerX = w / 2;
    const centerY = height / 2;

    // 1. Vẽ màng màng tế bào nền
    mCtx.lineWidth = 4;
    if (currentChosenStage === "telophase") {
        // Kì cuối: Tế bào thắt eo phân chia làm hai
        let localProg = (mitosisProgress - 290) / 110; // 0 -> 1
        let cleavageDepth = localProg * 35;
        
        mCtx.strokeStyle = "#4ade80";
        mCtx.beginPath();
        mCtx.arc(centerX - 120, centerY, 80, 0, Math.PI * 2);
        mCtx.stroke();

        mCtx.beginPath();
        mCtx.arc(centerX + 120, centerY, 80, 0, Math.PI * 2);
        mCtx.stroke();
    } else {
        // Các kì trước: Tế bào hình bầu dục elip nguyên vẹn
        mCtx.strokeStyle = "#27ae60";
        mCtx.beginPath();
        mCtx.ellipse(centerX, centerY, 240, 100, 0, 0, Math.PI * 2);
        mCtx.stroke();
    }

    // 2. Vẽ các thoi phân bào và trung tử ở 2 cực cơ thể tế bào
    if (currentChosenStage !== "telophase") {
        mCtx.fillStyle = "#f39c12";
        mCtx.fillRect(centerX - 200, centerY - 5, 10, 10); // Cực trái
        mCtx.fillRect(centerX + 190, centerY - 5, 10, 10); // Cực phải
    }

    // 3. Xử lý vẽ hình thái di chuyển chi tiết nhiễm sắc thể
    mCtx.lineWidth = 5;

    if (currentChosenStage === "prophase") {
        // Kì đầu: Các NST kép bắt đầu co xoắn, nằm lộn xộn trong trung tâm nhân tế bào
        mCtx.strokeStyle = "rgba(255,255,255,0.15)"; // Màng nhân mờ chưa tiêu biến hết
        mCtx.beginPath(); mCtx.arc(centerX, centerY, 60, 0, Math.PI * 2); mCtx.stroke();

        // NST 1 (Đỏ)
        drawChromatidPair(centerX - 20, centerY - 15, 0.4);
        // NST 2 (Xanh lam)
        drawChromatidPair(centerX + 15, centerY + 10, -0.2);

    } else if (currentChosenStage === "metaphase") {
        // Kì giữa: Tập trung thành một hàng dọc thẳng đứng ở tâm xích đạo tế bào
        // Vẽ sợi tơ vô sắc mảnh liên kết từ cực đến tâm động
        mCtx.lineWidth = 1; mCtx.strokeStyle = "rgba(243, 156, 18, 0.4)";
        mCtx.beginPath();
        mCtx.moveTo(centerX - 200, centerY); mCtx.lineTo(centerX, centerY - 30);
        mCtx.moveTo(centerX - 200, centerY); mCtx.lineTo(centerX, centerY + 30);
        mCtx.moveTo(centerX + 190, centerY); mCtx.lineTo(centerX, centerY - 30);
        mCtx.moveTo(centerX + 190, centerY); mCtx.lineTo(centerX, centerY + 30);
        mCtx.stroke();

        // Vẽ cặp nhiễm sắc thể kép xếp dọc xích đạo
        drawChromatidPair(centerX, centerY - 35, 0); // NST Kép bên trên
        drawChromatidPair(centerX, centerY + 25, 0); // NST Kép bên dưới

    } else if (currentChosenStage === "anaphase") {
        // Kì sau: Tâm động tách, thoi phân bào rút kéo các NST đơn chạy về hai cực
        let localProg = (mitosisProgress - 190) / 100; // Khoảng cách giãn từ từ
        let distance = localProg * 130; 

        mCtx.lineWidth = 1; mCtx.strokeStyle = "rgba(243, 156, 18, 0.3)";
        // Vẽ dây kéo co tơ thoi phân bào ngắn dần
        mCtx.beginPath();
        mCtx.moveTo(centerX - 200, centerY); mCtx.lineTo(centerX - distance, centerY - 30);
        mCtx.moveTo(centerX - 200, centerY); mCtx.lineTo(centerX - distance, centerY + 30);
        mCtx.moveTo(centerX + 190, centerY); mCtx.lineTo(centerX + distance, centerY - 30);
        mCtx.moveTo(centerX + 190, centerY); mCtx.lineTo(centerX + distance, centerY + 30);
        mCtx.stroke();

        // Kéo NST đơn về cực TRÁI (Uốn cong hình chữ V quay lưng về tâm)
        drawSingleChromatid(centerX - distance, centerY - 30, true, "#e74c3c");
        drawSingleChromatid(centerX - distance, centerY + 30, true, "#3498db");

        // Kéo NST đơn về cực PHẢI
        drawSingleChromatid(centerX + distance, centerY - 30, false, "#e74c3c");
        drawSingleChromatid(centerX + distance, centerY + 30, false, "#3498db");

    } else if (currentChosenStage === "telophase") {
        // Kì cuối: NST dãn xoắn nằm gọn trong hai nhân tế bào con mới
        mCtx.strokeStyle = "rgba(255, 255, 255, 0.4)"; // Màng nhân mới tái tạo hình thành
        mCtx.beginPath(); mCtx.arc(centerX - 120, centerY, 35, 0, Math.PI * 2); mCtx.stroke();
        mCtx.beginPath(); mCtx.arc(centerX + 120, centerY, 35, 0, Math.PI * 2); mCtx.stroke();

        // Bộ NST đơn dãn sợi tại nhân trái
        mCtx.strokeStyle = "#e74c3c"; mCtx.beginPath(); mCtx.arc(centerX - 130, centerY - 10, 12, 0, Math.PI); mCtx.stroke();
        mCtx.strokeStyle = "#3498db"; mCtx.beginPath(); mCtx.arc(centerX - 115, centerY + 10, 14, 0, Math.PI * 1.5); mCtx.stroke();

        // Bộ NST đơn dãn sợi tại nhân phải
        mCtx.strokeStyle = "#e74c3c"; mCtx.beginPath(); mCtx.arc(centerX + 115, centerY - 10, 12, 0, Math.PI); mCtx.stroke();
        mCtx.strokeStyle = "#3498db"; mCtx.beginPath(); mCtx.arc(centerX + 130, centerY + 10, 14, 0, Math.PI * 1.5); mCtx.stroke();
    }
}

// Hàm vẽ bổ trợ một nhiễm sắc thể kép (gồm 2 chị em chromatid dính nhau ở tâm động)
function drawChromatidPair(x, y, angle) {
    mCtx.save();
    mCtx.translate(x, y);
    mCtx.rotate(angle);
    
    mCtx.lineWidth = 5;
    // Nhánh chromatid đỏ 1
    mCtx.strokeStyle = "#e74c3c";
    mCtx.beginPath(); mCtx.moveTo(-12, -18); mCtx.lineTo(0, 0); mCtx.lineTo(-12, 18); mCtx.stroke();
    // Nhánh chromatid đỏ 2 chéo dính tâm động tạo hình chữ X
    mCtx.beginPath(); mCtx.moveTo(12, -18); mCtx.lineTo(0, 0); mCtx.lineTo(12, 18); mCtx.stroke();

    // Điểm tâm động phát sáng màu vàng trung tâm
    mCtx.fillStyle = "#fff";
    mCtx.beginPath(); mCtx.arc(0, 0, 4, 0, Math.PI * 2); mCtx.fill();
    mCtx.restore();
}

// Hàm vẽ bổ trợ một chiếc NST đơn hình chữ V khi bị kéo
function drawSingleChromatid(x, y, headingLeft, color) {
    mCtx.save();
    mCtx.translate(x, y);
    mCtx.lineWidth = 5;
    mCtx.strokeStyle = color;
    mCtx.beginPath();
    if (headingLeft) {
        mCtx.moveTo(12, -14); mCtx.lineTo(0, 0); mCtx.lineTo(12, 14);
    } else {
        mCtx.moveTo(-12, -14); mCtx.lineTo(0, 0); mCtx.lineTo(-12, 14);
    }
    mCtx.stroke();
    
    mCtx.fillStyle = "#fff";
    mCtx.beginPath(); mCtx.arc(0, 0, 3, 0, Math.PI * 2); mCtx.fill();
    mCtx.restore();
}

// Cập nhật các thông số tính toán sinh học số lượng NST thời gian thực lên giao diện
function updateChromosomeDataPanel() {
    const label = document.getElementById("nst-state");
    const count = document.getElementById("nst-count");
    const centromere = document.getElementById("nst-centromere");
    const chromatid = document.getElementById("nst-chromatid");

    if (!label) return;

    if (currentChosenStage === "prophase") {
        label.textContent = "Kì đầu";
        count.innerHTML = `46 <span class="dc-unit">kép</span>`;
        centromere.innerHTML = `46 <span class="dc-unit">tâm</span>`;
        chromatid.innerHTML = `92 <span class="dc-unit">tử</span>`;
    } else if (currentChosenStage === "metaphase") {
        label.textContent = "Kì giữa";
        count.innerHTML = `46 <span class="dc-unit">kép</span>`;
        centromere.innerHTML = `46 <span class="dc-unit">tâm</span>`;
        chromatid.innerHTML = `92 <span class="dc-unit">tử</span>`;
    } else if (currentChosenStage === "anaphase") {
        label.textContent = "Kì sau";
        count.innerHTML = `92 <span class="dc-unit">đơn</span>`;
        centromere.innerHTML = `92 <span class="dc-unit">tâm</span>`;
        chromatid.innerHTML = `0 <span class="dc-unit">không có</span>`;
    } else if (currentChosenStage === "telophase") {
        label.textContent = "Kì cuối (mỗi tế bào con)";
        count.innerHTML = `46 <span class="dc-unit">đơn</span>`;
        centromere.innerHTML = `46 <span class="dc-unit">tâm</span>`;
        chromatid.innerHTML = `0 <span class="dc-unit">không có</span>`;
    }
}

// --- LOGIC TRÒ CHƠI SẮP XẾP GIÚP HỌC SINH TƯƠNG TÁC ---
function selectOrderSlot(slotNum) {
    selectedOrderSlotIndex = slotNum;
    // Highlight ô đang chọn cho trực quan bằng cách thay đổi CSS viền
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`m-slot-${i}`).style.borderColor = (i === slotNum) ? "#ffd966" : "#27ae60";
    }
}

function pickStageCard(stageName) {
    if (selectedOrderSlotIndex === null) {
        alert("Vui lòng click chọn 1 ô trống (Bước 1 -> 4) trước khi chọn kì!");
        return;
    }
    
    // Lưu lựa chọn người dùng vào mảng đáp án
    userOrderedAnswers[selectedOrderSlotIndex - 1] = stageName;
    document.getElementById(`m-slot-${selectedOrderSlotIndex}`).textContent = stageName;
    document.getElementById(`m-slot-${selectedOrderSlotIndex}`).style.color = "#fff";
    document.getElementById(`m-slot-${selectedOrderSlotIndex}`).style.background = "#1e293b";

    // Tự động nhảy sang ô tiếp theo để tiện click liên tiếp
    if (selectedOrderSlotIndex < 4) {
        selectOrderSlot(selectedOrderSlotIndex + 1);
    } else {
        selectedOrderSlotIndex = null;
    }
}

function checkMitosisOrder() {
    let allFilled = userOrderedAnswers.every(ans => ans !== null);
    if (!allFilled) {
        document.getElementById("mitosis-game-status").textContent = "❌ Hãy điền đủ cả 4 bước!";
        document.getElementById("mitosis-game-status").style.color = "#e74c3c";
        return;
    }

    let isCorrect = true;
    for (let i = 0; i < 4; i++) {
        if (userOrderedAnswers[i] !== correctMitosisOrder[i]) {
            isCorrect = false;
            break;
        }
    }

    const statusDiv = document.getElementById("mitosis-game-status");
    if (isCorrect) {
        statusDiv.textContent = "🎉 CHÍNH XÁC! Bạn đã nắm vững chu trình nguyên phân.";
        statusDiv.style.color = "#2ecc71";
    } else {
        statusDiv.textContent = "❌ SAI RỒI! Trình tự đúng phải là: Kì đầu → Kì giữa → Kì sau → Kì cuối. Hãy thử lại!";
        statusDiv.style.color = "#e74c3c";
    }
}