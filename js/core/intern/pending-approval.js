import { api } from "../api.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. ROUTE GUARD: Kiểm tra phiên đăng nhập
  const token = localStorage.getItem("access_token");
  const userInfoStr = localStorage.getItem("user_info");

  if (!token) {
    window.location.replace("../auth/login.html");
    return;
  }

  let userInfo = {};
  try {
    userInfo = JSON.parse(userInfoStr) || {};
  } catch (e) {
    userInfo = {};
  }

  // 2. KHỞI TẠO DOM ELEMENTS
  const statusIcon = document.getElementById("statusIcon");
  const statusTitle = document.getElementById("statusTitle");
  const statusDesc = document.getElementById("statusDesc");
  const profileId = document.getElementById("profileId");
  const candidateName = document.getElementById("candidateName");
  const candidateEducation = document.getElementById("candidateEducation");
  const cvFileName = document.getElementById("cvFileName");
  const statusBadge = document.getElementById("statusBadge");
  const nextStepBox = document.getElementById("nextStepBox");
  const btnReUpload = document.getElementById("btnReUpload");
  const btnEnterDashboard = document.getElementById("btnEnterDashboard");
  const btnLogout = document.getElementById("btnLogout");

  // Điền thông tin cá nhân cơ bản từ LocalStorage trước
  candidateName.textContent =
    userInfo.fullName || userInfo.hoTen || "Thực tập sinh";

  // 3. GỌI API LẤY TRẠNG THÁI HỒ SƠ MỚI NHẤT
  try {
    // API backend tương ứng: GET /api/v1/intern/profile-status
    // Dữ liệu mẫu minh họa trạng thái từ CSDL:
    const applicationData = {
      profileId: "HS-2026-089",
      university: userInfo.university || "Đại học CNTT & Truyền thông - ĐHTN",
      major: userInfo.major || "Công nghệ Thông tin",
      cvName: "CV_NguyenVanA_Frontend.pdf",
      status: userInfo.trangThaiHoSo || "ChoDuyet", // Các giá trị: 'ChoDuyet', 'DaDuyet', 'TuChoi'
      rejectReason: "Chưa đính kèm bảng điểm chuyên ngành theo yêu cầu.",
    };

    // Render thông tin tóm tắt
    profileId.textContent = `#${applicationData.profileId}`;
    candidateEducation.textContent = `${applicationData.university} (${applicationData.major})`;
    cvFileName.textContent = applicationData.cvName;

    // 4. XỬ LÝ GIAO DIỆN THEO 3 TRẠNG THÁI (ChoDuyet / DaDuyet / TuChoi)
    renderStatusView(applicationData);
  } catch (error) {
    console.error("Lỗi nạp trạng thái:", error);
    statusDesc.textContent =
      "Không thể lấy thông tin hồ sơ mới nhất từ máy chủ.";
  }

  /**
   * Cập nhật UI theo từng trạng thái
   */
  function renderStatusView(data) {
    if (data.status === "DaDuyet") {
      // Trường hợp 1: HR đã phê duyệt
      statusIcon.className = "status-icon-wrapper approved";
      statusIcon.textContent = "🎉";
      statusTitle.textContent = "Chúc Mừng! Hồ Sơ Đã Được Duyệt";
      statusDesc.textContent =
        "Bạn đã chính thức được tiếp nhận vào chương trình thực tập của doanh nghiệp.";

      statusBadge.className = "status-badge approved";
      statusBadge.textContent = "Đã duyệt";

      nextStepBox.innerHTML =
        "✅ <strong>Bước tiếp theo:</strong> Bạn đã được gán vào đợt thực tập. Hãy truy cập Bảng điều khiển để nhận nhiệm vụ đầu tiên và điểm danh hàng ngày.";
      nextStepBox.style.backgroundColor = "#f0fdf4";
      nextStepBox.style.borderColor = "#16a34a";
      nextStepBox.style.color = "#15803d";

      btnReUpload.classList.add("hidden"); // Đã duyệt thì không sửa CV nữa
      btnEnterDashboard.classList.remove("hidden"); // Hiện nút vào Dashboard

      btnEnterDashboard.addEventListener("click", () => {
        window.location.href = "intern-dashboard.html";
      });
    } else if (data.status === "TuChoi") {
      // Trường hợp 2: Bị HR từ chối hồ sơ
      statusIcon.className = "status-icon-wrapper rejected";
      statusIcon.textContent = "❌";
      statusTitle.textContent = "Hồ Sơ Cần Bổ Sung / Từ Chối";
      statusDesc.textContent =
        "Rất tiếc, hồ sơ của bạn chưa đủ điều kiện tiếp nhận ở đợt này.";

      statusBadge.className = "status-badge rejected";
      statusBadge.textContent = "Từ chối";

      nextStepBox.innerHTML = `⚠️ <strong>Lý do từ chối:</strong> ${data.rejectReason || "Hồ sơ chưa đạt yêu cầu tiêu chuẩn."}<br>Bạn có thể cập nhật lại CV và nộp lại yêu cầu.`;
      nextStepBox.style.backgroundColor = "#fef2f2";
      nextStepBox.style.borderColor = "#dc2626";
      nextStepBox.style.color = "#b91c1c";

      btnReUpload.textContent = "🔄 Bổ sung & Nộp lại CV";
    } else {
      // Trường hợp 3: Chờ duyệt (ChoDuyet - Mặc định sau khi nộp)
      statusIcon.className = "status-icon-wrapper pending";
      statusIcon.textContent = "⏳";
      statusTitle.textContent = "Hồ Sơ Đang Chờ Xét Duyệt";
      statusBadge.className = "status-badge pending";
      statusBadge.textContent = "Chờ duyệt";
    }
  }

  // 5. SỰ KIỆN ĐĂNG XUẤT
  btnLogout.addEventListener("click", () => {
    if (confirm("Bạn có muốn đăng xuất tài khoản?")) {
      localStorage.clear();
      window.location.replace("../auth/login.html");
    }
  });
});
