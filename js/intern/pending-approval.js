/**
 * js/intern/pending-approval.js - Xử lý hiển thị trạng thái hồ sơ & Xác nhận hợp đồng điện tử
 */
import { api } from "../core/api.js";

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

  // 2. KHỞI TẠO CÁC DOM ELEMENTS
  // Thông tin trạng thái chung
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

  // Thành phần Hợp đồng (US 10)
  const contractSection = document.getElementById("contractSection");
  const contractCode = document.getElementById("contractCode");
  const contractDuration = document.getElementById("contractDuration");
  const contractAllowance = document.getElementById("contractAllowance");
  const btnViewContractPdf = document.getElementById("btnViewContractPdf");
  const chkAgreeContract = document.getElementById("chkAgreeContract");
  const btnSignContract = document.getElementById("btnSignContract");
  const contractError = document.getElementById("contractError");
  const signingFormBox = document.getElementById("signingFormBox");
  const signedSuccessBadge = document.getElementById("signedSuccessBadge");

  // Điền trước thông tin người dùng từ LocalStorage
  candidateName.textContent =
    userInfo.fullName || userInfo.hoTen || "Thực tập sinh";

  // 3. GỌI API LẤY TRẠNG THÁI HỒ SƠ MỚI NHẤT
  try {
    const response = await api.get("/intern/profile-status");
    const applicationData = response.data;

    // Render thông tin tóm tắt hồ sơ
    profileId.textContent = `#${applicationData.profileId}`;
    candidateEducation.textContent = `${applicationData.university} (${applicationData.major})`;
    cvFileName.textContent = applicationData.cvName;

    // 4. XỬ LÝ GIAO DIỆN THEO 3 TRẠNG THÁI (ChoDuyet / DaDuyet / TuChoi)
    await renderStatusView(applicationData);
  } catch (error) {
    console.error("Lỗi nạp trạng thái hồ sơ:", error);
    statusDesc.textContent =
      "Không thể lấy thông tin hồ sơ mới nhất từ máy chủ. Vui lòng thử lại sau!";
  }

  /**
   * Cập nhật UI theo từng trạng thái thực tế
   */
  async function renderStatusView(data) {
    if (data.status === "DaDuyet") {
      // Trường hợp 1: HR đã phê duyệt hồ sơ
      statusIcon.className = "status-icon-wrapper approved";
      statusIcon.textContent = "🎉";
      statusTitle.textContent = "Chúc Mừng! Hồ Sơ Đã Được Duyệt";
      statusDesc.textContent =
        "Bạn đã được bộ phận HR thông qua. Vui lòng kiểm tra và hoàn tất ký hợp đồng thực tập bên dưới.";

      statusBadge.className = "status-badge approved";
      statusBadge.textContent = "Đã duyệt";

      nextStepBox.innerHTML =
        "✅ <strong>Bước tiếp theo:</strong> Hãy đọc kỹ các điều khoản thực tập, xác nhận ký kết trực tuyến để hệ thống mở khóa Bảng điều khiển công việc.";
      nextStepBox.style.backgroundColor = "#f0fdf4";
      nextStepBox.style.borderColor = "#16a34a";
      nextStepBox.style.color = "#15803d";

      if (btnReUpload) btnReUpload.classList.add("hidden"); // Đã duyệt thì ẩn nút sửa CV

      // KÍCH HOẠT QUY TRÌNH HỢP ĐỒNG (US 10)
      await handleApprovedContractState();
    } else if (data.status === "TuChoi") {
      // Trường hợp 2: Bị HR từ chối hồ sơ
      statusIcon.className = "status-icon-wrapper rejected";
      statusIcon.textContent = "❌";
      statusTitle.textContent = "Hồ Sơ Cần Bổ Sung / Từ Chối";
      statusDesc.textContent =
        "Rất tiếc, hồ sơ ứng tuyển của bạn chưa đủ điều kiện tiếp nhận ở đợt này.";

      statusBadge.className = "status-badge rejected";
      statusBadge.textContent = "Từ chối";

      nextStepBox.innerHTML = `⚠️ <strong>Lý do từ chối:</strong> ${
        data.rejectReason ||
        "Hồ sơ chưa đạt yêu cầu tiêu chuẩn của doanh nghiệp."
      }<br>Bạn có thể cập nhật lại CV và nộp lại yêu cầu.`;
      nextStepBox.style.backgroundColor = "#fef2f2";
      nextStepBox.style.borderColor = "#dc2626";
      nextStepBox.style.color = "#b91c1c";

      if (btnReUpload) btnReUpload.textContent = "🔄 Bổ sung & Nộp lại CV";
      if (contractSection) contractSection.classList.add("hidden");
      if (btnEnterDashboard) btnEnterDashboard.classList.add("hidden");
    } else {
      // Trường hợp 3: Chờ duyệt (ChoDuyet - Mặc định sau khi nộp CV)
      statusIcon.className = "status-icon-wrapper pending";
      statusIcon.textContent = "⏳";
      statusTitle.textContent = "Hồ Sơ Đang Chờ Xét Duyệt";
      statusBadge.className = "status-badge pending";
      statusBadge.textContent = "Chờ duyệt";

      if (contractSection) contractSection.classList.add("hidden");
      if (btnEnterDashboard) btnEnterDashboard.classList.add("hidden");
    }
  }

  /**
   * Xử lý nạp và hiển thị Hợp đồng khi hồ sơ đã duyệt
   */
  async function handleApprovedContractState() {
    if (!contractSection) return;

    try {
      // 1. Gọi API lấy thông tin hợp đồng
      const res = await api.get("/intern/contract");
      const contract = res.data;

      // 2. Điền thông tin vào thẻ giao diện
      contractSection.classList.remove("hidden");
      if (contractCode) contractCode.textContent = `#${contract.contractCode}`;
      if (contractDuration)
        contractDuration.textContent = `${contract.startDate} - ${contract.endDate}`;
      if (contractAllowance) contractAllowance.textContent = contract.allowance;
      if (btnViewContractPdf) btnViewContractPdf.href = contract.pdfUrl;

      // 3. Kiểm tra xem Thực tập sinh đã ký hợp đồng hay chưa
      if (contract.contractStatus === "DaKy") {
        // ĐÃ KÝ -> Ẩn form ký, hiện badge đã ký, MỞ NÚT vào Dashboard
        if (signingFormBox) signingFormBox.classList.add("hidden");
        if (signedSuccessBadge) signedSuccessBadge.classList.remove("hidden");
        if (btnEnterDashboard) btnEnterDashboard.classList.remove("hidden");
      } else {
        // CHƯA KÝ -> Hiện form ký, KHÓA nút vào Dashboard
        if (signingFormBox) signingFormBox.classList.remove("hidden");
        if (signedSuccessBadge) signedSuccessBadge.classList.add("hidden");
        if (btnEnterDashboard) btnEnterDashboard.classList.add("hidden");
      }
    } catch (err) {
      console.error("Lỗi nạp thông tin hợp đồng:", err);
    }
  }

  // 5. SỰ KIỆN XÁC NHẬN KÝ HỢP ĐỒNG (US 10)
  if (btnSignContract) {
    btnSignContract.addEventListener("click", async () => {
      if (!chkAgreeContract.checked) {
        if (contractError) {
          contractError.textContent =
            "Bạn phải tích chọn đồng ý với điều khoản hợp đồng trước khi xác nhận!";
        }
        return;
      }
      if (contractError) contractError.textContent = "";

      try {
        btnSignContract.disabled = true;
        btnSignContract.textContent = "Đang xác thực chữ ký...";

        await api.post("/intern/contract/confirm", {
          agreeTerms: true,
        });
        const localUser = JSON.parse(localStorage.getItem("user_info") || "{}");
        localUser.contractStatus = "DaKy";
        localStorage.setItem("user_info", JSON.stringify(localUser));

        alert("Chúc mừng! Bạn đã hoàn tất ký hợp đồng thực tập trực tuyến.");

        // Cập nhật giao diện tức thời
        if (signingFormBox) signingFormBox.classList.add("hidden");
        if (signedSuccessBadge) signedSuccessBadge.classList.remove("hidden");
        if (btnEnterDashboard) btnEnterDashboard.classList.remove("hidden");
      } catch (err) {
        btnSignContract.disabled = false;
        btnSignContract.textContent = "✍️ Xác nhận Ký Hợp Đồng Trực Tuyến";
        alert("Lỗi ký hợp đồng: " + err.message);
      }
    });
  }

  // 6. SỰ KIỆN VÀO DASHBOARD LÀM VIỆC
  if (btnEnterDashboard) {
    btnEnterDashboard.addEventListener("click", () => {
      window.location.href = "intern-dashboard.html";
    });
  }
  if (btnReUpload) {
    btnReUpload.addEventListener("click", () => {
      window.location.href = "submit-cv.html";
    });
  }
  // 7. SỰ KIỆN ĐĂNG XUẤT
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Bạn có muốn đăng xuất tài khoản?")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_info");
        window.location.replace("../auth/login.html");
      }
    });
  }
});
