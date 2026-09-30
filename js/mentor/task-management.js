import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. ROUTE GUARD: Kiểm tra token & quyền Mentor
    const token = localStorage.getItem("access_token");
    const userInfoStr = localStorage.getItem("user_info");

    if (!token) {
        alert("Vui lòng đăng nhập với tài khoản Mentor!");
        window.location.replace("../auth/login.html");
        return;
    }

    let currentUser = null;
    try {
        currentUser = JSON.parse(userInfoStr);
    } catch (e) {
        currentUser = null;
    }

    // Chặn nếu không phải Mentor
    if (!currentUser || (currentUser.role !== "Mentor" && currentUser.role !== "HR" && currentUser.role !== "Admin")) {
        alert("Khu vực này chỉ dành cho Mentor hướng dẫn!");
        window.location.replace("../auth/login.html");
        return;
    }

    // Hiển thị thông tin Mentor trên Header Topbar
    initUserHeader(currentUser);
    initDateTime();

    let internsList = [];
    const createTaskModal = document.getElementById("createTaskModal");
    const btnOpenCreateModal = document.getElementById("btnOpenCreateModal");
    const btnCloseModal = document.getElementById("btnCloseModal");
    const btnCancelModal = document.getElementById("btnCancelModal");

    const createTaskForm = document.getElementById("createTaskForm");
    const selectIntern = document.getElementById("selectIntern");
    const taskTitleInput = document.getElementById("taskTitleInput");
    const taskDescInput = document.getElementById("taskDescInput");
    const taskDeadlineInput = document.getElementById("taskDeadlineInput");
    const taskPrioritySelect = document.getElementById("taskPrioritySelect");
    const mentorTaskTableBody = document.getElementById("mentorTaskTableBody");
    const totalTaskCount = document.getElementById("totalTaskCount");

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

    // 2. TẢI DANH SÁCH SINH VIÊN VÀ BẢNG TASK
    async function initPage() {
        await loadMyInterns();
        await loadAssignedTasks();
    }

    // Lấy danh sách sinh viên do Mentor quản lý
    async function loadMyInterns() {
        try {
            const res = await api.get("/mentor/interns");
            internsList = res.data || [];

            if (selectIntern) {
                if (internsList.length === 0) {
                    selectIntern.innerHTML = `<option value="">Không có thực tập sinh nào</option>`;
                    return;
                }

                selectIntern.innerHTML =
                    `<option value="">-- Chọn thực tập sinh --</option>` +
                    internsList
                        .map((i) => `<option value="${i.id}">${i.fullName} (${i.email})</option>`)
                        .join("");
            }
        } catch (err) {
            console.error("Lỗi nạp danh sách thực tập sinh:", err);
        }
    }

    // Tải danh sách task đã giao
    async function loadAssignedTasks() {
        try {
            const res = await api.get("/intern/tasks");
            const tasks = res.data || [];

            if (totalTaskCount) totalTaskCount.textContent = `${tasks.length} Task`;

            if (!mentorTaskTableBody) return;

            if (tasks.length === 0) {
                mentorTaskTableBody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #64748b;">Chưa có nhiệm vụ nào được giao.</td></tr>`;
                return;
            }

            const priorityBadges = {
                low: '<span class="badge" style="background:#e2e8f0; color:#334155; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">🟢 Thấp</span>',
                medium: '<span class="badge" style="background:#fef3c7; color:#d97706; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">🟡 Trung bình</span>',
                high: '<span class="badge" style="background:#fee2e2; color:#dc2626; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">🔴 Cao</span>',
            };

            const statusBadges = {
                todo: '<span class="badge" style="background:#fee2e2; color:#dc2626; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Chưa làm</span>',
                in_progress: '<span class="badge" style="background:#e0f2fe; color:#0369a1; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Đang làm</span>',
                in_review: '<span class="badge" style="background:#fef3c7; color:#d97706; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Chờ duyệt</span>',
                done: '<span class="badge" style="background:#dcfce7; color:#15803d; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">Hoàn thành</span>',
            };

            mentorTaskTableBody.innerHTML = tasks
                .map((t) => {
                    const student = internsList.find((i) => i.id === t.internId) || {
                        fullName: "Lạc Mạnh Tuấn",
                    };

                    return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px;"><strong>#TSK-${t.id}</strong></td>
              <td style="padding: 12px;"><strong>${student.fullName}</strong></td>
              <td style="padding: 12px;">${t.title}</td>
              <td style="padding: 12px;">${t.deadline}</td>
              <td style="padding: 12px;">${priorityBadges[t.priority] || priorityBadges.medium}</td>
              <td style="padding: 12px;">${statusBadges[t.status] || statusBadges.todo}</td>
              <td style="padding: 12px;"><strong>${t.progressPercent || 0}%</strong></td>
            </tr>
          `;
                })
                .join("");
        } catch (err) {
            console.error("Lỗi nạp danh sách task:", err);
            if (mentorTaskTableBody) {
                mentorTaskTableBody.innerHTML = `<tr><td colspan="7" style="padding: 20px; text-align: center; color: #dc2626;">Lỗi tải danh sách nhiệm vụ.</td></tr>`;
            }
        }
    }

    // 3. MỞ / ĐÓNG MODAL POPUP
    if (btnOpenCreateModal) {
        btnOpenCreateModal.addEventListener("click", () => {
            createTaskModal.classList.remove("hidden");
        });
    }

    function closeModal() {
        if (createTaskModal) createTaskModal.classList.add("hidden");
    }

    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener("click", closeModal);

    // 4. XỬ LÝ GIAO NHIỆM VỤ MỚI
    if (createTaskForm) {
        createTaskForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                internId: selectIntern.value,
                title: taskTitleInput.value.trim(),
                description: taskDescInput.value.trim(),
                deadline: taskDeadlineInput.value,
                priority: taskPrioritySelect.value,
            };

            if (!payload.internId || !payload.title || !payload.deadline) {
                alert("Vui lòng nhập đầy đủ sinh viên tiếp nhận, tiêu đề và deadline!");
                return;
            }

            try {
                await api.post("/mentor/tasks", payload);
                alert("🎉 Giao nhiệm vụ cho thực tập sinh thành công!");
                createTaskForm.reset();
                closeModal();
                loadAssignedTasks();
            } catch (err) {
                alert(` Lỗi giao việc: ${err.message}`);
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

    initPage();
});