/**
 * js/mentor/final-evaluations.js - Controller đánh giá tổng kết kỹ năng & thái độ
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

    let internsEvalList = [];

    const evalModal = document.getElementById("evalModal");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const evalForm = document.getElementById("evalForm");

    const mentorFinalTableBody = document.getElementById("mentorFinalTableBody");
    const totalInternCount = document.getElementById("totalInternCount");

    const modalStudentName = document.getElementById("modalStudentName");
    const modalInternId = document.getElementById("modalInternId");
    const techScoreInput = document.getElementById("techScoreInput");
    const attScoreInput = document.getElementById("attScoreInput");
    const learnScoreInput = document.getElementById("learnScoreInput");
    const strengthsInput = document.getElementById("strengthsInput");
    const improvementsInput = document.getElementById("improvementsInput");
    const overallCommentInput = document.getElementById("overallCommentInput");
    const recommendHireCheck = document.getElementById("recommendHireCheck");

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

    // 2. TẢI DANH SÁCH SINH VIÊN VÀ TRẠNG THÁI ĐÁNH GIÁ FINAL
    async function loadEvaluations() {
        try {
            const res = await api.get("/mentor/evaluations/final");
            internsEvalList = res.data || [];

            if (totalInternCount) totalInternCount.textContent = `${internsEvalList.length} Sinh viên`;

            if (!mentorFinalTableBody) return;

            if (internsEvalList.length === 0) {
                mentorFinalTableBody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">Chưa có thực tập sinh nào.</td></tr>`;
                return;
            }

            mentorFinalTableBody.innerHTML = internsEvalList
                .map((item) => {
                    const statusBadge = item.isEvaluated
                        ? '<span class="badge" style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:4px; font-size:0.8rem;">🟢 Đã đánh giá Final</span>'
                        : '<span class="badge" style="background:#fee2e2; color:#dc2626; padding:3px 8px; border-radius:4px; font-size:0.8rem;">🔴 Chưa đánh giá</span>';

                    const scoreDisplay = item.evaluation && item.evaluation.finalScore !== undefined
                        ? `<strong>${item.evaluation.finalScore} / 10</strong>`
                        : "---";

                    return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px;"><strong>#SV-${item.internId}</strong></td>
              <td style="padding: 12px;"><strong>${item.fullName}</strong></td>
              <td style="padding: 12px;">${item.email}</td>
              <td style="padding: 12px;">${item.programName}</td>
              <td style="padding: 12px;">${statusBadge}</td>
              <td style="padding: 12px;">${scoreDisplay}</td>
              <td style="padding: 12px;">
                <button class="btn-action-sm btn-open-eval" data-id="${item.internId}">
                  ${item.isEvaluated ? "✏️ Sửa Đánh Giá" : "⭐ Đánh Giá Final"}
                </button>
              </td>
            </tr>
          `;
                })
                .join("");

            // Gắn sự kiện click mở Modal Đánh giá
            document.querySelectorAll(".btn-open-eval").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const id = Number(e.target.getAttribute("data-id"));
                    openEvalModal(id);
                });
            });
        } catch (err) {
            console.error("Lỗi nạp danh sách đánh giá final:", err);
            if (mentorFinalTableBody) {
                mentorFinalTableBody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #dc2626;">Lỗi tải dữ liệu đánh giá.</td></tr>`;
            }
        }
    }

    // 3. MỞ MODAL ĐÁNH GIÁ TỔNG KẾT
    function openEvalModal(internId) {
        const item = internsEvalList.find((i) => i.internId === internId);
        if (!item) return;

        modalInternId.value = item.internId;
        modalStudentName.textContent = `⭐ Đánh Giá Final: ${item.fullName}`;

        // Đổ dữ liệu cũ nếu đã từng đánh giá trước đó
        if (item.isEvaluated && item.evaluation) {
            const ev = item.evaluation;
            techScoreInput.value = ev.technicalScore || "";
            attScoreInput.value = ev.attitudeScore || "";
            learnScoreInput.value = ev.learningScore || "";
            strengthsInput.value = ev.strengths || "";
            improvementsInput.value = ev.improvements || "";
            overallCommentInput.value = ev.overallComment || "";
            recommendHireCheck.checked = Boolean(ev.recommendHire);
        } else {
            evalForm.reset();
        }

        evalModal.classList.remove("hidden");
    }

    function closeModal() {
        if (evalModal) evalModal.classList.add("hidden");
    }

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);

    // 4. SUBMIT FORM ĐÁNH GIÁ FINAL
    if (evalForm) {
        evalForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                internId: Number(modalInternId.value),
                technicalScore: Number(techScoreInput.value),
                attitudeScore: Number(attScoreInput.value),
                learningScore: Number(learnScoreInput.value),
                strengths: strengthsInput.value.trim(),
                improvements: improvementsInput.value.trim(),
                overallComment: overallCommentInput.value.trim(),
                recommendHire: recommendHireCheck.checked,
            };

            try {
                await api.post("/mentor/evaluations/final", payload);
                alert("🎉 Đã gửi đánh giá tổng kết thực tập thành công!");
                closeModal();
                loadEvaluations(); // Nạp lại danh sách
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

    loadEvaluations();
});