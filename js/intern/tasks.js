/**
 * js/intern/tasks.js - Controller quản lý nhiệm vụ dành cho Thực tập sinh
 */
import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. ROUTE GUARD: Kiểm tra Token & Role Thực tập sinh
    const token = localStorage.getItem("access_token");
    const userInfoStr = localStorage.getItem("user_info");

    if (!token) {
        alert("Vui lòng đăng nhập hệ thống!");
        window.location.replace("../auth/login.html");
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(userInfoStr);
    } catch (e) {
        currentUser = null;
    }

    if (!currentUser || (currentUser.role !== "ThucTapSinh" && currentUser.role !== "Intern")) {
        alert("Khu vực này chỉ dành cho Thực tập sinh!");
        window.location.replace("../auth/login.html");
        return;
    }

    // Khởi tạo thông tin User trên Header
    initUserHeader(currentUser);
    initDateTime();

    let tasksList = [];

    // Lấy các phần tử DOM
    const internTaskTableBody = document.getElementById("internTaskTableBody");
    const totalTaskCount = document.getElementById("totalTaskCount");

    const updateTaskModal = document.getElementById("updateTaskModal");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const updateTaskForm = document.getElementById("updateTaskForm");

    const taskIdInput = document.getElementById("taskIdInput");
    const taskTitleDisplay = document.getElementById("taskTitleDisplay");
    const taskStatusSelect = document.getElementById("taskStatusSelect");
    const taskProgressInput = document.getElementById("taskProgressInput");
    const taskProofUrlInput = document.getElementById("taskProofUrlInput");
    const taskNoteInput = document.getElementById("taskNoteInput");

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

    // 2. TẢI DANH SÁCH NHIỆM VỤ TỪ API
    async function loadTasks() {
        try {
            const res = await api.get("/intern/tasks");
            tasksList = res.data || [];

            if (totalTaskCount) {
                totalTaskCount.textContent = `${tasksList.length} Task`;
            }

            if (!internTaskTableBody) return;

            if (tasksList.length === 0) {
                internTaskTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">
              Bạn chưa có nhiệm vụ nào được giao.
            </td>
          </tr>`;
                return;
            }

            internTaskTableBody.innerHTML = tasksList
                .map((t) => {
                    // Badge độ ưu tiên
                    let priorityBadge = '<span style="color:#64748b; font-weight:600;">🟡 Trung bình</span>';
                    if (t.priority === "high") {
                        priorityBadge = '<span style="color:#dc2626; font-weight:600;">🔴 Cao</span>';
                    } else if (t.priority === "low") {
                        priorityBadge = '<span style="color:#16a34a; font-weight:600;">🟢 Thấp</span>';
                    }

                    // Badge trạng thái
                    let statusBadge = '<span style="background:#fee2e2; color:#dc2626; padding:3px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">Chưa bắt đầu</span>';
                    if (t.status === "in_progress") {
                        statusBadge = '<span style="background:#fef3c7; color:#d97706; padding:3px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">Đang làm</span>';
                    } else if (t.status === "completed" || t.status === "done") {
                        statusBadge = '<span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">Hoàn thành</span>';
                    }

                    return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px;"><strong>#TSK-${t.id}</strong></td>
              <td style="padding: 12px;"><strong>${t.title}</strong></td>
              <td style="padding: 12px;">${t.deadline}</td>
              <td style="padding: 12px;">${priorityBadge}</td>
              <td style="padding: 12px;">${statusBadge}</td>
              <td style="padding: 12px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <progress value="${t.progressPercent || 0}" max="100" style="width:70px; height:8px;"></progress>
                  <span style="font-size:0.8rem; font-weight:bold;">${t.progressPercent || 0}%</span>
                </div>
              </td>
              <td style="padding: 12px;">
                <button class="btn-open-update" data-id="${t.id}" style="background:#eff6ff; color:#1d4ed8; border:none; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; font-size:0.8rem;">
                  ✏️ Cập nhật
                </button>
              </td>
            </tr>
          `;
                })
                .join("");

            // Gắn sự kiện mở Modal cập nhật
            document.querySelectorAll(".btn-open-update").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const taskId = Number(e.target.getAttribute("data-id"));
                    openUpdateModal(taskId);
                });
            });
        } catch (err) {
            console.error("Lỗi nạp nhiệm vụ:", err);
            if (internTaskTableBody) {
                internTaskTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="padding: 20px; text-align: center; color: #dc2626;">
              Không thể tải danh sách nhiệm vụ. Vui lòng kiểm tra lại kết nối!
            </td>
          </tr>`;
            }
        }
    }

    // 3. MỞ MODAL CẬP NHẬT TIẾN ĐỘ
    function openUpdateModal(taskId) {
        const task = tasksList.find((t) => t.id === taskId);
        if (!task) return;

        taskIdInput.value = task.id;
        taskTitleDisplay.value = task.title;
        taskStatusSelect.value = task.status || "todo";
        taskProgressInput.value = task.progressPercent || 0;
        taskProofUrlInput.value = task.proofUrl || "";
        taskNoteInput.value = task.note || "";

        if (updateTaskModal) updateTaskModal.classList.remove("hidden");
    }

    function closeModal() {
        if (updateTaskModal) updateTaskModal.classList.add("hidden");
    }

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);

    // 4. SUBMIT CẬP NHẬT TIẾN ĐỘ NHIỆM VỤ
    if (updateTaskForm) {
        updateTaskForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const tId = Number(taskIdInput.value);
            const payload = {
                status: taskStatusSelect.value,
                progressPercent: Number(taskProgressInput.value),
                proofUrl: taskProofUrlInput.value.trim(),
                note: taskNoteInput.value.trim(),
            };

            try {
                await api.put(`/intern/tasks/${tId}/progress`, payload);
                alert("🎉 Cập nhật tiến độ nhiệm vụ thành công!");
                closeModal();
                loadTasks();
            } catch (err) {
                alert(` Lỗi cập nhật: ${err.message}`);
            }
        });
    }

    function initUserHeader(user) {
        const userNameHeader = document.getElementById("userNameHeader");
        const userEmailHeader = document.getElementById("userEmailHeader");
        const welcomeUser = document.getElementById("welcomeUser");
        const userAvatar = document.getElementById("userAvatar");

        if (user) {
            const fullName = user.fullName || user.hoTen || "Thực Tập Sinh";
            if (userNameHeader) userNameHeader.textContent = fullName;
            if (userEmailHeader) userEmailHeader.textContent = user.email || "tuan.lac@example.edu.vn";
            if (welcomeUser) welcomeUser.textContent = `Xin chào, ${fullName}!`;

            const initials = fullName
                .split(" ")
                .map((n) => n[0])
                .slice(-2)
                .join("")
                .toUpperCase();
            if (userAvatar) userAvatar.textContent = initials || "TTS";
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

    loadTasks();
});