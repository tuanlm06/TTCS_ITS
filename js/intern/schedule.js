/**
 * js/intern/schedule.js - Controller xử lý hiển thị Lịch thực tập cá nhân
 */
import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. ROUTE GUARD: Kiểm tra token & role
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

    // Hiển thị tên người dùng trên Header
    const dispStudentName = document.getElementById("dispStudentName");
    if (dispStudentName) {
        dispStudentName.textContent = currentUser.fullName || "Thực tập sinh";
    }

    // 2. GỌI API LẤY LỊCH THỰC TẬP
    try {
        const res = await api.get("/intern/schedule");
        const scheduleData = res.data;

        // Render thông tin chương trình
        const { programInfo, milestones } = scheduleData;
        document.getElementById("progCode").textContent = `#${programInfo.programCode}`;
        document.getElementById("progName").textContent = programInfo.programName;
        document.getElementById("progDept").textContent = programInfo.departmentName;
        document.getElementById("progMentor").textContent = programInfo.mentorName;
        document.getElementById("progDates").textContent = `${programInfo.startDate} - ${programInfo.endDate}`;
        document.getElementById("progShift").textContent = programInfo.workingShift;

        // Render danh sách cột mốc Timeline
        renderTimeline(milestones || []);
    } catch (err) {
        console.error("Lỗi lấy lịch thực tập:", err);
        if (err.status === 403) {
            alert("Bạn chưa hoàn tất ký hợp đồng thực tập để xem lịch!");
            window.location.replace("pending-approval.html");
        } else {
            document.getElementById("timelineList").innerHTML = `
        <p style="color: #dc2626;">Lỗi tải dữ liệu lịch thực tập: ${err.message}</p>
      `;
        }
    }

    // 3. HÀM RENDER TIMELINE
    function renderTimeline(list) {
        const timelineList = document.getElementById("timelineList");
        if (!timelineList) return;

        if (list.length === 0) {
            timelineList.innerHTML = `<p class="text-subtle">Chưa có lịch làm việc được thiết lập.</p>`;
            return;
        }

        timelineList.innerHTML = list
            .map((item) => {
                const isCompleted = item.status === "completed";
                return `
          <div class="timeline-item ${isCompleted ? "completed" : "upcoming"}">
            <div class="timeline-header">
              <span class="timeline-title">${item.title}</span>
              <span class="timeline-date">${item.date}</span>
            </div>
            <p class="timeline-note">${item.note}</p>
          </div>
        `;
            })
            .join("");
    }

    // 4. SỰ KIỆN ĐĂNG XUẤT
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
});