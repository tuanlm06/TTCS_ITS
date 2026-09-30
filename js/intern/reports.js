/**
 * js/intern/reports.js - Controller quản lý và nộp báo cáo thực tập tuần
 */
import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. ROUTE GUARD: Kiểm tra đăng nhập & quyền Thực tập sinh
    const token = localStorage.getItem("access_token");
    const userInfoStr = localStorage.getItem("user_info");

    if (!token) {
        window.location.replace("../auth/login.html");
        return;
    }

    let currentUser = {};
    try {
        currentUser = JSON.parse(userInfoStr) || {};
    } catch (e) {
        currentUser = {};
    }

    if (currentUser.role !== "ThucTapSinh") {
        alert("Khu vực này chỉ dành cho Thực tập sinh!");
        window.location.replace("../auth/login.html");
        return;
    }

    const weekTitleDisp = document.getElementById("weekTitleDisp");
    const weekNumberInput = document.getElementById("weekNumberInput");
    const statusBanner = document.getElementById("statusBanner");

    const reportTitleInput = document.getElementById("reportTitleInput");
    const achievementsInput = document.getElementById("achievementsInput");
    const difficultiesInput = document.getElementById("difficultiesInput");
    const nextWeekPlanInput = document.getElementById("nextWeekPlanInput");
    const attachmentUrlInput = document.getElementById("attachmentUrlInput");
    const weeklyReportForm = document.getElementById("weeklyReportForm");
    const btnSubmitReport = document.getElementById("btnSubmitReport");

    // 2. LẤY THÔNG TIN TUẦN HIỆN TẠI TỪ API
    try {
        const res = await api.get("/intern/reports/current-week");
        const weekData = res.data;

        if (weekTitleDisp) weekTitleDisp.textContent = weekData.weekTitle;
        if (weekNumberInput) weekNumberInput.value = weekData.weekNumber;

        // Nếu đã nộp báo cáo tuần này trước đó, điền dữ liệu cũ vào form
        if (weekData.isSubmitted && weekData.existingReport) {
            const rep = weekData.existingReport;
            reportTitleInput.value = rep.title || "";
            achievementsInput.value = rep.achievements || "";
            difficultiesInput.value = rep.difficulties || "";
            nextWeekPlanInput.value = rep.nextWeekPlan || "";
            attachmentUrlInput.value = rep.attachmentUrl || "";

            statusBanner.classList.remove("hidden");
            if (rep.isLate) {
                statusBanner.className = "status-banner warning";
                statusBanner.textContent = "⚠️ Bạn đã nộp báo cáo tuần này (Ghi nhận Nộp muộn). Bạn vẫn có thể cập nhật lại trước khi Mentor chấm điểm.";
            } else {
                statusBanner.className = "status-banner success";
                statusBanner.textContent = "✅ Bạn đã nộp báo cáo tuần này thành công. Bạn vẫn có thể chỉnh sửa lại nội dung bên dưới.";
            }

            if (btnSubmitReport) {
                btnSubmitReport.textContent = "💾 Cập Nhật Báo Cáo Tuần";
            }
        }
    } catch (err) {
        console.error("Lỗi lấy thông tin tuần:", err);
    }

    // 3. XỬ LÝ SUBMIT FORM NỘP BÁO CÁO
    if (weeklyReportForm) {
        weeklyReportForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                weekNumber: Number(weekNumberInput.value),
                title: reportTitleInput.value.trim(),
                achievements: achievementsInput.value.trim(),
                difficulties: difficultiesInput.value.trim(),
                nextWeekPlan: nextWeekPlanInput.value.trim(),
                attachmentUrl: attachmentUrlInput.value.trim(),
            };

            if (!payload.achievements || !payload.nextWeekPlan) {
                alert("Vui lòng điền đầy đủ Kết quả đạt được và Kế hoạch tuần tới!");
                return;
            }

            btnSubmitReport.disabled = true;
            btnSubmitReport.textContent = "Đang gửi báo cáo...";

            try {
                const res = await api.post("/intern/reports/weekly", payload);
                alert(`🎉 ${res.message || "Nộp báo cáo tuần thành công!"}`);
                window.location.replace("intern-dashboard.html");
            } catch (err) {
                alert(` Lỗi nộp báo cáo: ${err.message}`);
                btnSubmitReport.disabled = false;
                btnSubmitReport.textContent = "🚀 Gửi Báo Cáo Tuần";
            }
        });
    }
});