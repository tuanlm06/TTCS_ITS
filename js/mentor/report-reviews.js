/**
 * js/mentor/report-reviews.js - Controller xem chi tiết và chấm điểm báo cáo tuần
 */
import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. ROUTE GUARD: Kiểm tra token & role Mentor
    const token = localStorage.getItem("access_token");
    const userInfoStr = localStorage.getItem("user_info");

    if (!token) {
        alert("Vui lòng đăng nhập tài khoản Mentor!");
        window.location.replace("../auth/login.html");
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(userInfoStr);
    } catch (e) {
        currentUser = null;
    }

    if (!currentUser || (currentUser.role !== "Mentor" && currentUser.role !== "HR" && currentUser.role !== "Admin")) {
        alert("Khu vực này chỉ dành cho Mentor hướng dẫn!");
        window.location.replace("../auth/login.html");
        return;
    }

    initUserHeader(currentUser);
    initDateTime();

    let reportsList = [];

    const reviewModal = document.getElementById("reviewModal");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const reviewForm = document.getElementById("reviewForm");

    const mentorReportTableBody = document.getElementById("mentorReportTableBody");
    const totalReportCount = document.getElementById("totalReportCount");

    const modalReportTitle = document.getElementById("modalReportTitle");
    const modalInternName = document.getElementById("modalInternName");
    const modalSubmittedAt = document.getElementById("modalSubmittedAt");
    const modalAchievements = document.getElementById("modalAchievements");
    const modalDifficulties = document.getElementById("modalDifficulties");
    const modalNextWeekPlan = document.getElementById("modalNextWeekPlan");
    const modalAttachmentLink = document.getElementById("modalAttachmentLink");
    const modalReportId = document.getElementById("modalReportId");
    const scoreInput = document.getElementById("scoreInput");
    const feedbackInput = document.getElementById("feedbackInput");

    // Nút Đăng xuất
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

    // 2. TẢI DANH SÁCH BÁO CÁO TỪ MOCK API
    async function loadReports() {
        try {
            const res = await api.get("/mentor/reports");
            reportsList = res.data || [];

            if (totalReportCount) totalReportCount.textContent = `${reportsList.length} Báo cáo`;

            if (!mentorReportTableBody) return;

            if (reportsList.length === 0) {
                mentorReportTableBody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">Chưa có báo cáo tuần nào được nộp.</td></tr>`;
                return;
            }

            mentorReportTableBody.innerHTML = reportsList
                .map((r) => {
                    const isReviewed = r.status === "reviewed";
                    const statusBadge = isReviewed
                        ? '<span class="badge" style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:4px; font-size:0.8rem;">🟢 Đã đánh giá</span>'
                        : '<span class="badge" style="background:#fef3c7; color:#d97706; padding:3px 8px; border-radius:4px; font-size:0.8rem;">🟡 Chờ đánh giá</span>';

                    const lateBadge = r.isLate
                        ? ' <span style="color:#dc2626; font-size:0.75rem; font-weight:bold;">(Nộp muộn)</span>'
                        : '';

                    return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px;"><strong>Tuần ${r.weekNumber}</strong></td>
              <td style="padding: 12px;"><strong>${r.fullName || "Lạc Mạnh Tuấn"}</strong></td>
              <td style="padding: 12px;">${r.title}</td>
              <td style="padding: 12px;">${new Date(r.submittedAt).toLocaleDateString("vi-VN")}${lateBadge}</td>
              <td style="padding: 12px;">${statusBadge}</td>
              <td style="padding: 12px;"><strong>${r.score !== null && r.score !== undefined ? `${r.score}/10` : "---"}</strong></td>
              <td style="padding: 12px;">
                <button class="btn-action-sm btn-review-report" data-id="${r.id || r.weekNumber}">
                  ${isReviewed ? "✏️ Sửa đánh giá" : "👁️ Chấm điểm"}
                </button>
              </td>
            </tr>
          `;
                })
                .join("");

            // Gắn sự kiện click nút xem chi tiết & chấm điểm
            document.querySelectorAll(".btn-review-report").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const repId = Number(e.target.getAttribute("data-id"));
                    openReviewModal(repId);
                });
            });
        } catch (err) {
            console.error("Lỗi nạp báo cáo:", err);
            if (mentorReportTableBody) {
                mentorReportTableBody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #dc2626;">Lỗi tải danh sách báo cáo tuần.</td></tr>`;
            }
        }
    }

    // 3. MỞ MODAL XEM VÀ CHẤM ĐIỂM
    function openReviewModal(reportId) {
        const report = reportsList.find((r) => r.id === reportId || r.weekNumber === reportId);
        if (!report) return;

        modalReportId.value = report.id || report.weekNumber;
        modalReportTitle.textContent = `📝 Báo Cáo Tuần ${report.weekNumber}`;
        modalInternName.textContent = report.fullName || "Lạc Mạnh Tuấn";
        modalSubmittedAt.textContent = new Date(report.submittedAt).toLocaleString("vi-VN");

        modalAchievements.textContent = report.achievements || "Không có nội dung.";
        modalDifficulties.textContent = report.difficulties || "Không có vướng mắc.";
        modalNextWeekPlan.textContent = report.nextWeekPlan || "Chưa có kế hoạch.";

        if (report.attachmentUrl) {
            modalAttachmentLink.href = report.attachmentUrl;
            modalAttachmentLink.style.display = "inline";
        } else {
            modalAttachmentLink.style.display = "none";
        }

        // Nếu đã đánh giá rồi, điền lại điểm và nhận xét cũ
        scoreInput.value = report.score !== null && report.score !== undefined ? report.score : "";
        feedbackInput.value = report.mentorFeedback || "";

        reviewModal.classList.remove("hidden");
    }

    function closeModal() {
        if (reviewModal) reviewModal.classList.add("hidden");
    }

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);

    // 4. SUBMIT ĐÁNH GIÁ VÀ CHẤM ĐIỂM
    if (reviewForm) {
        reviewForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const repId = Number(modalReportId.value);
            const payload = {
                score: Number(scoreInput.value),
                mentorFeedback: feedbackInput.value.trim(),
            };

            if (isNaN(payload.score) || payload.score < 0 || payload.score > 10) {
                alert("Vui lòng nhập điểm số hợp lệ trong thang điểm từ 0 đến 10!");
                return;
            }

            try {
                await api.post(`/mentor/reports/${repId}/review`, payload);
                alert("🎉 Đã gửi đánh giá và chấm điểm báo cáo tuần thành công!");
                closeModal();
                loadReports(); // Nạp lại bảng danh sách
            } catch (err) {
                alert(` Lỗi gửi đánh giá: ${err.message}`);
            }
        });
    }

    function initUserHeader(user) {
        const userNameHeader = document.getElementById("userNameHeader");
        const userEmailHeader = document.getElementById("userEmailHeader");
        const welcomeUser = document.getElementById("welcomeUser");
        const userAvatar = document.getElementById("userAvatar");

        if (user) {
            const fullName = user.fullName || user.hoTen || "ThS. Hoàng Anh Tuấn";
            if (userNameHeader) userNameHeader.textContent = fullName;
            if (userEmailHeader) userEmailHeader.textContent = user.email || "tuan.hoang@company.com";
            if (welcomeUser) welcomeUser.textContent = `Xin chào, ${fullName}!`;

            const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .slice(-2)
                .join("")
                .toUpperCase();
            if (userAvatar) userAvatar.textContent = initials || "MT";
        }
    }

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

    loadReports();
});