import { api } from "../api.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. ROUTE GUARD: Kiểm tra token & role
  const token = localStorage.getItem("access_token");
  const userProfileStr = localStorage.getItem("user_info");

  if (!token) {
    // Chưa đăng nhập -> Đá về màn hình Login
    window.location.replace("../auth/login.html");
    return;
  }

  let currentUser = null;
  try {
    currentUser = JSON.parse(userProfileStr);
  } catch (e) {
    currentUser = null;
  }

  // 2. KHỞI TẠO DỮ LIỆU BAN ĐẦU TRÊN GIAO DIỆN
  initUserHeader(currentUser);
  initDateTime();
  loadDashboardData();

  // 3. SỰ KIỆN NÚT ĐĂNG XUẤT
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_info");
        window.location.replace("../auth/login.html");
      }
    });
  }

  // 4. SỰ KIỆN NÚT CHECK-IN
  const btnCheckIn = document.getElementById("btnCheckIn");
  if (btnCheckIn) {
    btnCheckIn.addEventListener("click", handleCheckIn);
  }
});

/**
 * Hiển thị tên và thông tin người dùng
 */
function initUserHeader(user) {
  const userNameHeader = document.getElementById("userNameHeader");
  const userEmailHeader = document.getElementById("userEmailHeader");
  const welcomeUser = document.getElementById("welcomeUser");
  const userAvatar = document.getElementById("userAvatar");

  if (user) {
    const fullName = user.fullName || user.hoTen || "Thực tập sinh";
    userNameHeader.textContent = fullName;
    userEmailHeader.textContent = user.email || "";
    welcomeUser.textContent = `Xin chào, ${fullName}!`;

    // Lấy ký tự đầu làm Avatar
    const initials = fullName
      .split(" ")
      .map((n) => n[0])
      .slice(-2)
      .join("")
      .toUpperCase();
    userAvatar.textContent = initials || "TTS";
  }
}

/**
 * Cập nhật thời gian thực tế
 */
function initDateTime() {
  const dateEl = document.getElementById("currentDateText");
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateEl.textContent = `Hôm nay: ${now.toLocaleDateString("vi-VN", options)}`;
}

/**
 * Gọi API lấy dữ liệu tổng quan của Thực tập sinh
 */
async function loadDashboardData() {
  try {
    // Giả định Backend cung cấp endpoint tổng quan cho intern
    // const res = await api.get('/intern/overview');
    // Dữ liệu mẫu phản hồi để render giao diện trực quan:
    const mockOverview = {
      department: "Phòng Kỹ thuật Phần mềm",
      mentorName: "Thân Tuấn Vũ",
      mentorEmail: "vu.tt@company.com",
      pendingTasks: [
        {
          id: 1,
          title: "Thiết kế sơ đồ CSDL đợt thực tập",
          deadline: "2026-10-02",
          status: "progress",
        },
        {
          id: 2,
          title: "Hoàn thiện luồng kiểm thử giao diện Auth",
          deadline: "2026-10-05",
          status: "todo",
        },
      ],
      todayCheckedIn: false,
    };

    renderDashboard(mockOverview);
  } catch (error) {
    console.error("Không thể nạp dữ liệu dashboard:", error);
  }
}

/**
 * Đổ dữ liệu ra các widget trên Dashboard
 */
function renderDashboard(data) {
  // Cập nhật KPI
  document.getElementById("kpiDepartment").textContent =
    data.department || "Chưa cập nhật";
  document.getElementById("kpiMentor").textContent =
    data.mentorName || "Chưa phân công";
  document.getElementById("kpiTaskCount").textContent =
    `${data.pendingTasks.length} Task`;

  // Cập nhật Kênh liên hệ mentor
  document.getElementById("mentorContactInfo").textContent =
    `Email: ${data.mentorEmail || "Chưa có"}`;

  // Cập nhật trạng thái Checkin
  const checkinStatus = document.getElementById("checkinStatusText");
  const btnCheckIn = document.getElementById("btnCheckIn");
  if (data.todayCheckedIn) {
    checkinStatus.textContent = "Đã check-in";
    checkinStatus.className = "badge-status done";
    btnCheckIn.disabled = true;
    btnCheckIn.textContent = "Đã điểm danh";
  }

  // Render danh sách nhiệm vụ
  const taskListEl = document.getElementById("taskList");
  if (!data.pendingTasks || data.pendingTasks.length === 0) {
    taskListEl.innerHTML =
      '<div class="empty-state">Hiện tại bạn không có nhiệm vụ nào cần làm.</div>';
    return;
  }

  taskListEl.innerHTML = data.pendingTasks
    .map(
      (task) => `
      <div class="task-item">
        <div>
          <div class="task-title">${task.title}</div>
          <div class="task-deadline">Hạn: ${task.deadline}</div>
        </div>
        <span class="task-tag ${task.status}">${task.status === "progress" ? "Đang làm" : "Chưa làm"}</span>
      </div>
    `,
    )
    .join("");
}

/**
 * Xử lý sự kiện bấm Check-in
 */
async function handleCheckIn() {
  const btn = document.getElementById("btnCheckIn");
  btn.disabled = true;
  btn.textContent = "Đang ghi nhận...";

  try {
    // Gọi API checkin
    // await api.post('/attendance/checkin', { timestamp: new Date().toISOString() });

    // Giả lập xử lý thành công
    setTimeout(() => {
      alert("Điểm danh ngày hôm nay thành công!");
      const checkinStatus = document.getElementById("checkinStatusText");
      checkinStatus.textContent = "Đã check-in";
      checkinStatus.className = "badge-status done";
      btn.textContent = "Đã điểm danh";
    }, 600);
  } catch (error) {
    alert("Điểm danh thất bại: " + error.message);
    btn.disabled = false;
    btn.textContent = "Check-in ngay";
  }
}
