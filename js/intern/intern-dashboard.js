import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. ROUTE GUARD: Kiểm tra token & role
  const token = localStorage.getItem("access_token");
  const userProfileStr = localStorage.getItem("user_info");

  if (!token) {
    window.location.replace("../auth/login.html");
    return;
  }

  let currentUser = null;
  try {
    currentUser = JSON.parse(userProfileStr);
  } catch (e) {
    currentUser = null;
  }

  if (!currentUser) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    window.location.replace("../auth/login.html");
    return;
  }

  // Chặn truy cập trái phép nếu không phải thực tập sinh hoặc chưa đủ điều kiện
  if (currentUser.role !== "ThucTapSinh") {
    alert("Khu vực này chỉ dành cho Thực tập sinh!");
    if (currentUser.role === "HR" || currentUser.role === "Admin") {
      window.location.replace("../hr/hr-dashboard.html");
    } else {
      window.location.replace("../auth/login.html");
    }
    return;
  }

  const userStatus = currentUser.status || currentUser.trangThai || "ChuaNop";
  const hasCv = Boolean(currentUser.hasCv);
  const contractStatus = currentUser.contractStatus || "ChoKy";

  if (userStatus === "ChuaNop" || !hasCv) {
    alert("Vui lòng nộp hồ sơ CV trước khi truy cập bảng điều khiển!");
    window.location.replace("submit-cv.html");
    return;
  }

  if (
    userStatus === "ChoDuyet" ||
    userStatus === "TuChoi" ||
    contractStatus !== "DaKy"
  ) {
    alert("Hồ sơ chưa được duyệt hoặc bạn chưa hoàn tất ký hợp đồng thực tập!");
    window.location.replace("pending-approval.html");
    return;
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
    if (userNameHeader) userNameHeader.textContent = fullName;
    if (userEmailHeader) userEmailHeader.textContent = user.email || "";
    if (welcomeUser) welcomeUser.textContent = `Xin chào, ${fullName}!`;

    // Lấy ký tự đầu làm Avatar
    const initials = fullName
      .split(" ")
      .map((n) => n[0])
      .slice(-2)
      .join("")
      .toUpperCase();
    if (userAvatar) userAvatar.textContent = initials || "TTS";
  }
}

/**
 * Cập nhật thời gian thực tế
 */
function initDateTime() {
  const dateEl = document.getElementById("currentDateText");
  if (!dateEl) return;
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
 * Gọi API lấy dữ liệu tổng quan & danh sách nhiệm vụ của Thực tập sinh
 */
async function loadDashboardData() {
  try {
    // 1. Gọi API tổng quan
    const resOverview = await api.get("/intern/overview");
    let overviewData = resOverview ? resOverview.data : {};

    // 2. Gọi API nhiệm vụ để lấy dữ liệu đồng bộ với trang tasks.html
    try {
      const resTasks = await api.get("/intern/tasks");
      if (resTasks && resTasks.data) {
        overviewData.pendingTasks = resTasks.data;
      }
    } catch (e) {
      console.warn("Nạp nhiệm vụ chi tiết thất bại, dùng nhiệm vụ mặc định:", e);
    }

    renderDashboard(overviewData);
  } catch (error) {
    console.error("Không thể nạp dữ liệu dashboard:", error);
  }
}

/**
 * Đổ dữ liệu ra các widget trên Dashboard
 */
function renderDashboard(data) {
  // Cập nhật KPI
  const kpiDept = document.getElementById("kpiDepartment");
  const kpiMentor = document.getElementById("kpiMentor");
  const kpiTask = document.getElementById("kpiTaskCount");
  const mentorContact = document.getElementById("mentorContactInfo");

  if (kpiDept) kpiDept.textContent = data.department || "Phòng Công nghệ Phần mềm";
  if (kpiMentor) kpiMentor.textContent = data.mentorName || "Chưa phân công";

  const tasks = data.pendingTasks || [];
  // Đếm số task chưa hoàn thành (khác 'done')
  const activeTasks = tasks.filter((t) => t.status !== "done");
  if (kpiTask) kpiTask.textContent = `${activeTasks.length} Task`;

  // Cập nhật Kênh liên hệ mentor
  if (mentorContact) {
    mentorContact.textContent = `Email: ${data.mentorEmail || "mentor@company.com"}`;
  }

  // Cập nhật trạng thái Checkin
  const checkinStatus = document.getElementById("checkinStatusText");
  const btnCheckIn = document.getElementById("btnCheckIn");
  if (data.todayCheckedIn && checkinStatus && btnCheckIn) {
    checkinStatus.textContent = "Đã check-in";
    checkinStatus.className = "badge-status done";
    btnCheckIn.disabled = true;
    btnCheckIn.textContent = "Đã điểm danh";
  }

  // Render danh sách nhiệm vụ gần đây
  const taskListEl = document.getElementById("taskList");
  if (!taskListEl) return;

  if (tasks.length === 0) {
    taskListEl.innerHTML =
      '<div class="empty-state">Hiện tại bạn không có nhiệm vụ nào cần làm.</div>';
    return;
  }

  const statusBadges = {
    todo: '<span class="task-tag todo" style="background:#fee2e2; color:#dc2626;">Chưa làm</span>',
    in_progress: '<span class="task-tag progress" style="background:#e0f2fe; color:#0369a1;">Đang làm</span>',
    in_review: '<span class="task-tag review" style="background:#fef3c7; color:#d97706;">Chờ duyệt</span>',
    done: '<span class="task-tag done" style="background:#dcfce7; color:#15803d;">Hoàn thành</span>',
  };

  taskListEl.innerHTML = tasks
    .slice(0, 3) // Hiển thị tối đa 3 nhiệm vụ gần đây
    .map((task) => {
      const badge = statusBadges[task.status] || '<span class="task-tag progress">Đang làm</span>';
      return `
        <div class="task-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
          <div>
            <div class="task-title" style="font-weight: 600; font-size: 0.95rem;">${task.title}</div>
            <div class="task-deadline" style="font-size: 0.8rem; color: #64748b;">Hạn: ${task.deadline}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${badge}
            <!-- NÚT CẬP NHẬT NHANH CHUYỂN TRANG TASKS.HTML -->
            <a href="tasks.html?id=${task.id}" style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 0.8rem; font-weight: 600;">
              ✏️ Cập nhật
            </a>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * Xử lý sự kiện bấm Check-in
 */
async function handleCheckIn() {
  const btn = document.getElementById("btnCheckIn");
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = "Đang ghi nhận...";

  try {
    await api.post("/attendance/checkin", {
      timestamp: new Date().toISOString(),
    });

    alert("Điểm danh ngày hôm nay thành công!");
    const checkinStatus = document.getElementById("checkinStatusText");
    if (checkinStatus) {
      checkinStatus.textContent = "Đã check-in";
      checkinStatus.className = "badge-status done";
    }
    btn.textContent = "Đã điểm danh";
  } catch (error) {
    alert("Điểm danh thất bại: " + error.message);
    btn.disabled = false;
    btn.textContent = "Check-in ngay";
  }
}