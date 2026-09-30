/**
 * js/hr/final-report.js - Controller tổng hợp báo cáo và xuất file cho HR
 */
import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. ROUTE GUARD: Kiểm tra token & role HR / Admin
    const token = localStorage.getItem("access_token");
    const userInfoStr = localStorage.getItem("user_info");

    if (!token) {
        alert("Vui lòng đăng nhập tài khoản HR!");
        window.location.replace("../auth/login.html");
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(userInfoStr);
    } catch (e) {
        currentUser = null;
    }

    if (!currentUser || (currentUser.role !== "HR" && currentUser.role !== "Admin")) {
        alert("Khu vực này chỉ dành cho Cán bộ Nhân sự HR!");
        window.location.replace("../auth/login.html");
        return;
    }

    initUserHeader(currentUser);
    initDateTime();

    let reportDataCache = null;

    const hrReportTableBody = document.getElementById("hrReportTableBody");
    const kpiTotalInterns = document.getElementById("kpiTotalInterns");
    const kpiAvgGpa = document.getElementById("kpiAvgGpa");
    const kpiGoodRate = document.getElementById("kpiGoodRate");
    const kpiRecommendHire = document.getElementById("kpiRecommendHire");
    const btnExportCsv = document.getElementById("btnExportCsv");
    const btnPrintReport = document.getElementById("btnPrintReport");

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

    // 2. TẢI VÀ NẠP BÁO CÁO TỔNG HỢP
    async function loadFinalSummaryReport() {
        try {
            const res = await api.get("/hr/reports/final-summary");
            reportDataCache = res.data || {};

            const kpi = reportDataCache.kpiSummary || {};
            const list = reportDataCache.internSummaries || [];

            // Render các thông số KPI
            if (kpiTotalInterns) kpiTotalInterns.textContent = kpi.totalInterns || 0;
            if (kpiAvgGpa) kpiAvgGpa.textContent = kpi.averageGpa || "0.0";
            if (kpiGoodRate) kpiGoodRate.textContent = `${(kpi.excellentCount || 0) + (kpi.goodCount || 0)} Sinh viên`;
            if (kpiRecommendHire) kpiRecommendHire.textContent = `${kpi.recommendedHireCount || 0} Sinh viên`;

            if (!hrReportTableBody) return;

            if (list.length === 0) {
                hrReportTableBody.innerHTML = `<tr><td colspan="8" style="padding: 20px; text-align: center; color: #64748b;">Chưa có dữ liệu báo cáo tổng kết.</td></tr>`;
                return;
            }

            hrReportTableBody.innerHTML = list
                .map((item) => {
                    const hireBadge = item.recommendHire
                        ? '<span style="color:#16a34a; font-weight:600;">🌟 Đề xuất</span>'
                        : '<span style="color:#94a3b8;">Không</span>';

                    return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px;"><strong>#SV-${item.internId}</strong></td>
              <td style="padding: 12px;"><strong>${item.fullName}</strong></td>
              <td style="padding: 12px;">${item.university}</td>
              <td style="padding: 12px;">${item.mentorName}</td>
              <td style="padding: 12px; text-align:center;"><strong>${item.submittedReportsCount}</strong> tuần</td>
              <td style="padding: 12px;"><strong>${item.finalScore}</strong></td>
              <td style="padding: 12px;"><strong>${item.grade}</strong></td>
              <td style="padding: 12px;">${hireBadge}</td>
            </tr>
          `;
                })
                .join("");
        } catch (err) {
            console.error("Lỗi nạp báo cáo tổng hợp HR:", err);
            if (hrReportTableBody) {
                hrReportTableBody.innerHTML = `<tr><td colspan="8" style="padding: 20px; text-align: center; color: #dc2626;">Lỗi tổng hợp dữ liệu báo cáo.</td></tr>`;
            }
        }
    }

    // 3. THAO TÁC XUẤT CSV / EXCEL
    if (btnExportCsv) {
        btnExportCsv.addEventListener("click", () => {
            if (!reportDataCache || !reportDataCache.internSummaries) {
                alert("Chưa có dữ liệu báo cáo để xuất file!");
                return;
            }

            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Ma SV,Ho va Ten,Truong Dai Hoc,Mentor,So Bao Cao,Diem Final,Xep Loai,De Xuat Tuyen Dung\n";

            reportDataCache.internSummaries.forEach((i) => {
                csvContent += `${i.internId},"${i.fullName}","${i.university}","${i.mentorName}",${i.submittedReportsCount},${i.finalScore},"${i.grade}","${i.recommendHire ? "Co" : "Khong"}"\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "Bao_Cao_Tong_Ket_Thuc_Tap_2026.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // 4. THAO TÁC IN / XUẤT PDF
    if (btnPrintReport) {
        btnPrintReport.addEventListener("click", () => {
            window.print();
        });
    }

    function initUserHeader(user) {
        const userNameHeader = document.getElementById("userNameHeader");
        const userEmailHeader = document.getElementById("userEmailHeader");
        const welcomeUser = document.getElementById("welcomeUser");
        const userAvatar = document.getElementById("userAvatar");

        if (user) {
            const fullName = user.fullName || user.hoTen || "Cán Bộ Nhân Sự HR";
            if (userNameHeader) userNameHeader.textContent = fullName;
            if (userEmailHeader) userEmailHeader.textContent = user.email || "hr@company.com";
            if (welcomeUser) welcomeUser.textContent = `Xin chào, ${fullName}!`;

            const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .slice(-2)
                .join("")
                .toUpperCase();
            if (userAvatar) userAvatar.textContent = initials || "HR";
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

    loadFinalSummaryReport();
});