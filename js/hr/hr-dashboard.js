/**
 * js/hr/hr-dashboard.js - Điều khiển phân hệ Quản trị HR:
 * 1. Xét duyệt hồ sơ, xem CV, từ chối (US 7)
 * 2. Chỉnh sửa hồ sơ ứng viên (US 2)
 * 3. Phân công & Giám sát tải trọng Mentor (US 12)
 * 4. Thiết lập chương trình thực tập theo phòng ban & thời gian (US 13)
 * 5. Thêm mới hồ sơ thực tập sinh thủ công
 */
import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. ROUTE GUARD: Kiểm tra token & quyền hạn HR / Admin
  const token = localStorage.getItem("access_token");
  const userProfileStr = localStorage.getItem("user_info");

  if (!token) {
    window.location.replace("../auth/login.html");
    return;
  }

  let currentUser = {};
  try {
    currentUser = JSON.parse(userProfileStr) || {};
  } catch (e) {
    currentUser = {};
  }

  if (currentUser.role !== "HR" && currentUser.role !== "Admin") {
    alert("Truy cập bị từ chối! Bạn không có quyền truy cập cổng Quản trị HR.");
    window.location.replace("../intern/intern-dashboard.html");
    return;
  }

  initHrHeader(currentUser);

  let candidates = [];
  let currentRejectId = null;
  let departmentList = [];

  // Header Titles
  const pageHeaderTitle = document.getElementById("pageHeaderTitle");
  const pageHeaderDesc = document.getElementById("pageHeaderDesc");

  // Navigation Tabs & Views
  const menuCandidates = document.getElementById("menuCandidates");
  const menuMentors = document.getElementById("menuMentors");
  const menuPrograms = document.getElementById("menuPrograms");

  const viewCandidateList = document.getElementById("viewCandidateList");
  const viewMentorList = document.getElementById("viewMentorList");
  const viewProgramList = document.getElementById("viewProgramList");

  // Candidate Table & Filters
  const searchInput = document.getElementById("searchInput");
  const filterUniversity = document.getElementById("filterUniversity");
  const filterStatus = document.getElementById("filterStatus");
  const btnResetFilter = document.getElementById("btnResetFilter");

  // Program Filters
  const filterProgramDept = document.getElementById("filterProgramDept");

  // Modal Xem CV
  const cvModal = document.getElementById("cvModal");
  const cvIframe = document.getElementById("cvIframe");
  const modalCvTitle = document.getElementById("modalCvTitle");
  const btnCloseCvModal = document.getElementById("btnCloseCvModal");
  const btnCloseCvModalFooter = document.getElementById(
    "btnCloseCvModalFooter",
  );

  // Modal Từ chối
  const rejectModal = document.getElementById("rejectModal");
  const rejectReasonInput = document.getElementById("rejectReasonInput");
  const rejectReasonError = document.getElementById("rejectReasonError");
  const btnCloseRejectModal = document.getElementById("btnCloseRejectModal");
  const btnCancelReject = document.getElementById("btnCancelReject");
  const btnConfirmReject = document.getElementById("btnConfirmReject");

  // Modal Chỉnh sửa hồ sơ (US 2)
  const editModal = document.getElementById("editInternModal");
  const formEdit = document.getElementById("formEditIntern");
  const btnCloseEditModal = document.getElementById("btnCloseEditModal");
  const btnCancelEdit = document.getElementById("btnCancelEdit");

  // Modal Phân công Mentor (US 12)
  const assignModal = document.getElementById("assignMentorModal");
  const formAssign = document.getElementById("formAssignMentor");
  const btnCloseAssignModal = document.getElementById("btnCloseAssignModal");
  const btnCancelAssign = document.getElementById("btnCancelAssign");
  const assignProgramSelect = document.getElementById("assignProgram");
  const selectMentor = document.getElementById("selectMentor");
  const selectMentorError = document.getElementById("selectMentorError");

  // Modal Thiết lập Đợt thực tập theo Phòng ban (US 13)
  const programModal = document.getElementById("programModal");
  const formProgramTime = document.getElementById("formProgramTime");
  const programModalTitle = document.getElementById("programModalTitle");
  const btnOpenCreateProgram = document.getElementById("btnOpenCreateProgram");
  const btnCloseProgramModal = document.getElementById("btnCloseProgramModal");
  const btnCancelProgramModal = document.getElementById(
    "btnCancelProgramModal",
  );
  const programDeptSelect = document.getElementById("programDepartmentInput");
  const deptCapacityHint = document.getElementById("deptCapacityHint");

  // Modal Thêm mới hồ sơ thực tập sinh
  const createInternModal = document.getElementById("createInternModal");
  const formCreateIntern = document.getElementById("formCreateIntern");
  const btnOpenCreateIntern = document.getElementById("btnOpenCreateIntern");
  const btnCloseCreateInternModal = document.getElementById(
    "btnCloseCreateInternModal",
  );
  const btnCancelCreateIntern = document.getElementById(
    "btnCancelCreateIntern",
  );
  const createProgramSelect = document.getElementById("createProgramSelect");

  // Modal Xem Danh Sách Sinh Viên Trực Thuộc Mentor (US 12)
  const mentorStudentsModal = document.getElementById("mentorStudentsModal");
  const btnCloseMentorStudentsModal = document.getElementById(
    "btnCloseMentorStudentsModal",
  );
  const btnCloseMentorStudentsModalFooter = document.getElementById(
    "btnCloseMentorStudentsModalFooter",
  );

  // 2. CHUYỂN ĐỔI TAB VIEW TRÊN SIDEBAR
  function switchView(activeMenu, activeView, title, desc) {
    document
      .querySelectorAll(".sidebar-menu .menu-item")
      .forEach((m) => m.classList.remove("active"));
    if (activeMenu) activeMenu.classList.add("active");

    if (viewCandidateList) viewCandidateList.classList.add("hidden");
    if (viewMentorList) viewMentorList.classList.add("hidden");
    if (viewProgramList) viewProgramList.classList.add("hidden");

    if (activeView) activeView.classList.remove("hidden");
    if (pageHeaderTitle) pageHeaderTitle.textContent = title;
    if (pageHeaderDesc) pageHeaderDesc.textContent = desc;
  }

  if (menuCandidates) {
    menuCandidates.addEventListener("click", () => {
      switchView(
        menuCandidates,
        viewCandidateList,
        "Danh Sách Hồ Sơ Thực Tập Sinh",
        "Tiếp nhận, thẩm định hồ sơ ứng tuyển, ký kết hợp đồng và phân công Mentor",
      );
    });
  }

  if (menuMentors) {
    menuMentors.addEventListener("click", async () => {
      switchView(
        menuMentors,
        viewMentorList,
        "Bảng Theo Dõi & Phân Công Mentor",
        "Giám sát khối lượng công việc của Mentor và quản lý sinh viên trực thuộc",
      );
      await loadMentorTableView();
    });
  }

  if (menuPrograms) {
    menuPrograms.addEventListener("click", async () => {
      switchView(
        menuPrograms,
        viewProgramList,
        "Quản Lý Đợt & Kế Hoạch Thời Gian Thực Tập Theo Phòng Ban",
        "Tổ chức chương trình thực tập theo phòng ban, thiết lập mốc thời gian và chỉ tiêu",
      );
      await loadDepartments();
      await loadProgramsTable();
    });
  }

  // 3. TẢI VÀ VẼ BẢNG ỨNG VIÊN (VIEW 1)
  async function loadCandidates() {
    const tableBody = document.getElementById("candidateTableBody");
    if (!tableBody) return;

    try {
      const res = await api.get("/hr/candidates");
      candidates = res.data || [];
      updateKPIs();
      applyFilters();
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color:#dc2626;">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
  }

  function updateKPIs() {
    const total = candidates.length;
    const pending = candidates.filter((c) => c.status === "ChoDuyet" || c.status === "ChuaNop").length;
    const approved = candidates.filter((c) => c.status === "DaDuyet").length;

    const elTotal = document.getElementById("kpiTotal");
    const elPending = document.getElementById("kpiPending");
    const elApproved = document.getElementById("kpiApproved");

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elApproved) elApproved.textContent = approved;
  }

  function renderCandidateTable(list) {
    const tableBody = document.getElementById("candidateTableBody");
    if (!tableBody) return;

    if (!list || list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" class="empty-state">Không tìm thấy hồ sơ nào phù hợp.</td></tr>`;
      return;
    }

    tableBody.innerHTML = list
      .map((item) => {
        let statusBadge = "";
        if (item.status === "ChuaNop") {
          statusBadge = `<span class="badge-status" style="background-color:#f1f5f9; color:#64748b;">Chưa nộp CV</span>`;
        } else if (item.status === "ChoDuyet") {
          statusBadge = `<span class="badge-status pending">Chờ duyệt</span>`;
        } else if (item.status === "DaDuyet") {
          statusBadge = `<span class="badge-status done">Đã duyệt</span>`;
        } else {
          statusBadge = `<span class="badge-status" style="background-color:#fee2e2; color:#dc2626;">Từ chối</span>`;
        }

        const reviewActions =
          item.status === "ChoDuyet"
            ? `
          <button class="btn-approve" data-id="${item.id}" title="Duyệt hồ sơ">✓ Duyệt</button>
          <button class="btn-reject" data-id="${item.id}" title="Từ chối hồ sơ">✕ Từ chối</button>
        `
            : "";

        const assignAction =
          item.status === "DaDuyet"
            ? `
          <button class="btn-assign-mentor" data-id="${item.id}" title="Phân công Mentor" style="background-color: #059669; color: #fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem; font-weight:600;">
            ${item.mentorName && item.mentorName !== "Chưa phân công" ? "🔄 Đổi Mentor" : "👨‍🏫 Gán Mentor"}
          </button>
        `
            : "";

        const cvButton = item.hasCv
          ? `<button class="btn-view-cv" data-cv="${item.cvUrl}" data-name="${item.fullName}">📄 Xem CV</button>`
          : `<button disabled style="opacity:0.6; cursor:not-allowed; background:#e2e8f0; color:#64748b; border:none; padding:5px 9px; border-radius:4px; font-size:0.8rem;">📄 Chưa có CV</button>`;

        const mentorDisplay = item.mentorName && item.mentorName !== "Chưa phân công"
          ? `<strong style="color: #059669;">${item.mentorName}</strong>`
          : `<span style="color: #94a3b8; font-style: italic;">Chưa phân công</span>`;

        return `
        <tr>
          <td><strong>#${item.profileCode}</strong></td>
          <td>
            <div class="candidate-cell">
              <span class="name">${item.fullName}</span>
              <span class="email">${item.email} - ${item.phone}</span>
            </div>
          </td>
          <td>${item.university} <br><small style="color:#64748b;">${item.major}</small></td>
          <td><strong>${item.position}</strong></td>
          <td>${cvButton}</td>
          <td>${statusBadge}</td>
          <td>${mentorDisplay}</td>
          <td style="text-align:center;">
            <div class="action-buttons">
              ${reviewActions}
              ${assignAction}
              <button class="btn-edit-intern" data-id="${item.id}" title="Chỉnh sửa thông tin hồ sơ" style="background-color: #3b82f6; color: #fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem; font-weight:600;">
                ✏️ Sửa
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    attachCandidateEvents();
  }

  function removeVietnameseTones(str) {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();
  }

  function applyFilters() {
    if (!searchInput) return;
    const rawKeyword = searchInput.value.trim();
    const keyword = removeVietnameseTones(rawKeyword);
    const uni = filterUniversity ? filterUniversity.value : "";
    const st = filterStatus ? filterStatus.value : "";

    const filtered = candidates.filter((item) => {
      const nameNoTone = removeVietnameseTones(item.fullName);
      const emailNoTone = (item.email || "").toLowerCase();
      const codeNoTone = (item.profileCode || "").toLowerCase();
      const majorNoTone = removeVietnameseTones(item.major);
      const positionNoTone = removeVietnameseTones(item.position);
      const mentorNoTone = removeVietnameseTones(item.mentorName || "");

      const matchKeyword =
        !keyword ||
        nameNoTone.includes(keyword) ||
        emailNoTone.includes(keyword) ||
        codeNoTone.includes(keyword) ||
        majorNoTone.includes(keyword) ||
        positionNoTone.includes(keyword) ||
        mentorNoTone.includes(keyword);

      const matchUni =
        !uni || (item.university && item.university.includes(uni));
      const matchStatus = !st || item.status === st;

      return matchKeyword && matchUni && matchStatus;
    });

    renderCandidateTable(filtered);
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (filterUniversity)
    filterUniversity.addEventListener("change", applyFilters);
  if (filterStatus) filterStatus.addEventListener("change", applyFilters);
  if (btnResetFilter) {
    btnResetFilter.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (filterUniversity) filterUniversity.value = "";
      if (filterStatus) filterStatus.value = "";
      applyFilters();
    });
  }

  function attachCandidateEvents() {
    // Xem CV
    document.querySelectorAll(".btn-view-cv").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cvUrl = e.currentTarget.getAttribute("data-cv");
        const name = e.currentTarget.getAttribute("data-name");
        if (modalCvTitle)
          modalCvTitle.textContent = `Chi tiết CV - Ứng viên: ${name}`;
        if (cvIframe) cvIframe.src = cvUrl;
        if (cvModal) cvModal.classList.remove("hidden");
      });
    });

    // Duyệt hồ sơ (US 7)
    document.querySelectorAll(".btn-approve").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = Number(e.currentTarget.getAttribute("data-id"));
        if (
          confirm("Xác nhận DUYỆT hồ sơ của ứng viên này vào đợt thực tập?")
        ) {
          try {
            await api.post("/hr/approve", { candidateId: id });
            alert("Đã phê duyệt hồ sơ thành công!");
            await loadCandidates();
          } catch (err) {
            alert("Lỗi phê duyệt: " + err.message);
          }
        }
      });
    });

    // Từ chối hồ sơ (US 7)
    document.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        currentRejectId = Number(e.currentTarget.getAttribute("data-id"));
        if (rejectReasonInput) rejectReasonInput.value = "";
        if (rejectReasonError) rejectReasonError.textContent = "";
        if (rejectModal) rejectModal.classList.remove("hidden");
      });
    });

    // Chỉnh sửa hồ sơ (US 2)
    document.querySelectorAll(".btn-edit-intern").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = Number(e.currentTarget.getAttribute("data-id"));
        const candidate = candidates.find((c) => c.id === id);
        if (!candidate || !editModal) return;

        document.getElementById("editCandidateId").value = candidate.id;
        document.getElementById("editEmail").value = candidate.email;
        document.getElementById("editFullName").value = candidate.fullName;
        document.getElementById("editPhone").value =
          candidate.phone !== "Chưa cập nhật" ? candidate.phone : "";
        document.getElementById("editUniversity").value =
          candidate.university !== "Chưa cập nhật" ? candidate.university : "";
        document.getElementById("editMajor").value =
          candidate.major !== "Chưa cập nhật" ? candidate.major : "";
        document.getElementById("editPosition").value =
          candidate.position || "";

        editModal.classList.remove("hidden");
      });
    });

    // Mở modal Phân công Mentor (US 12)
    document.querySelectorAll(".btn-assign-mentor").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = Number(e.currentTarget.getAttribute("data-id"));
        const candidate = candidates.find((c) => c.id === id);
        if (!candidate || !assignModal) return;

        document.getElementById("assignInternId").value = candidate.id;
        document.getElementById("assignInternName").textContent =
          candidate.fullName;
        document.getElementById("assignInternMeta").textContent =
          `${candidate.university} • Vị trí: ${candidate.position}`;

        // Nạp động danh sách Đợt thực tập
        if (assignProgramSelect) {
          try {
            const progRes = await api.get("/hr/programs");
            const programs = progRes.data || [];
            assignProgramSelect.innerHTML = programs
              .map((p) => {
                const selectedAttr =
                  candidate.programName === p.name ? "selected" : "";
                return `<option value="${p.name}" ${selectedAttr}>${p.name} (${p.departmentName || "Khối chung"})</option>`;
              })
              .join("");
          } catch (err) {
            assignProgramSelect.innerHTML =
              '<option value="Đợt thực tập Thu Đông 2026 (Khóa K23)">Đợt thực tập Thu Đông 2026 (Khóa K23)</option>';
          }
        }

        // Nạp động danh sách Mentor
        if (selectMentor) {
          selectMentor.innerHTML =
            '<option value="">-- Đang nạp danh sách Mentor... --</option>';

          try {
            const res = await api.get("/hr/mentors");
            const mentors = res.data || [];

            selectMentor.innerHTML =
              '<option value="">-- Chọn Mentor phụ trách --</option>' +
              mentors
                .map((m) => {
                  const isFull = m.currentInterns >= m.maxInterns;
                  const disabledAttr = isFull ? "disabled" : "";
                  const countText = isFull
                    ? "(Đã đủ chỉ tiêu)"
                    : `(Đang kèm: ${m.currentInterns}/${m.maxInterns})`;
                  const selectedAttr =
                    candidate.mentorId === m.id ? "selected" : "";
                  return `<option value="${m.id}" ${disabledAttr} ${selectedAttr}>${m.fullName} - ${m.department} ${countText}</option>`;
                })
                .join("");

            assignModal.classList.remove("hidden");
          } catch (err) {
            alert("Lỗi tải danh sách Mentor: " + err.message);
          }
        }
      });
    });
  }

  // 4. VẼ BẢNG GIÁM SÁT MENTOR (VIEW 2)
  async function loadMentorTableView() {
    const tableBody = document.getElementById("mentorTableBody");
    if (!tableBody) return;

    try {
      const res = await api.get("/hr/mentors");
      const mentors = res.data || [];

      const internRes = await api.get("/hr/candidates");
      const internList = internRes.data || [];

      if (mentors.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="7" class="empty-state">Chưa có dữ liệu Mentor trong hệ thống.</td></tr>';
        return;
      }

      tableBody.innerHTML = mentors
        .map((m) => {
          const assignedStudents = internList.filter(
            (s) => s.mentorId === m.id,
          );

          const studentBadges =
            assignedStudents.length > 0
              ? assignedStudents
                .map(
                  (s) =>
                    `<span style="display:inline-block; background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:0.8rem; margin:2px;">👤 ${s.fullName}</span>`,
                )
                .join(" ")
              : `<span style="color:#94a3b8; font-style:italic;">Chưa hướng dẫn sinh viên nào</span>`;

          const isFull = m.currentInterns >= m.maxInterns;
          const capacityColor = isFull ? "#dc2626" : "#059669";
          const statusBadge = isFull
            ? `<span class="badge-status" style="background:#fee2e2; color:#dc2626;">Đã đầy tải</span>`
            : `<span class="badge-status" style="background:#dcfce7; color:#15803d;">Sẵn sàng nhận</span>`;

          return `
          <tr>
            <td><strong>#MT-${m.id}</strong></td>
            <td>
              <div class="candidate-cell">
                <span class="name" style="font-weight:600; color:#1e293b;">${m.fullName}</span>
                <span class="email" style="color:#64748b; font-size:0.82rem;">${m.email}</span>
              </div>
            </td>
            <td>
              <div>${m.department || "Khối Công nghệ"}</div>
              <small style="color:#64748b;">${m.position || "Senior Lead"}</small>
            </td>
            <td>
              <strong style="color: ${capacityColor}; font-size: 1rem;">${m.currentInterns} / ${m.maxInterns}</strong>
              <div style="font-size:0.75rem; color:#64748b;">sinh viên</div>
            </td>
            <td>${studentBadges}</td>
            <td style="text-align:center;">${statusBadge}</td>
            <td style="text-align:center;">
              <div style="display:flex; gap:6px; justify-content:center; align-items:center; flex-wrap:wrap;">
                <button 
                  class="btn-view-mentor-students" 
                  data-id="${m.id}"
                  data-name="${m.fullName}"
                  style="background-color: #0284c7; color: #fff; border:none; padding:5px 9px; border-radius:4px; cursor:pointer; font-size:0.78rem; font-weight:600; white-space:nowrap;"
                  title="Xem danh sách sinh viên do Mentor này phụ trách"
                >
                  👥 Xem SV (${assignedStudents.length})
                </button>
                ${!isFull
              ? `<button 
                        class="btn-quick-assign-mentor" 
                        data-id="${m.id}" 
                        data-name="${m.fullName}"
                        style="background-color: #059669; color: #fff; border:none; padding:5px 9px; border-radius:4px; cursor:pointer; font-size:0.78rem; font-weight:600; white-space:nowrap;"
                        title="Gán nhanh thực tập sinh cho Mentor này"
                      >
                        ➕ Gán TTS
                      </button>`
              : ""
            }
              </div>
            </td>
          </tr>
        `;
        })
        .join("");

      const triggerQuickAssign = async (mentorId, mentorName) => {
        const unassigned = candidates.filter((c) => !c.mentorId);

        if (unassigned.length === 0) {
          alert("Tất cả ứng viên hiện tại đều đã được phân công Mentor!");
          return;
        }

        const targetCandidate = unassigned[0];
        if (!assignModal) return;

        document.getElementById("assignInternId").value = targetCandidate.id;
        document.getElementById("assignInternName").textContent =
          targetCandidate.fullName;
        document.getElementById("assignInternMeta").textContent =
          `${targetCandidate.university} • Vị trí: ${targetCandidate.position}`;

        if (assignProgramSelect) {
          try {
            const progRes = await api.get("/hr/programs");
            const programs = progRes.data || [];
            assignProgramSelect.innerHTML = programs
              .map((p) => {
                const selectedAttr =
                  targetCandidate.programName === p.name ? "selected" : "";
                return `<option value="${p.name}" ${selectedAttr}>${p.name} (${p.departmentName || "Khối chung"})</option>`;
              })
              .join("");
          } catch (err) {
            assignProgramSelect.innerHTML =
              '<option value="Đợt thực tập Thu Đông 2026 (Khóa K23)">Đợt thực tập Thu Đông 2026 (Khóa K23)</option>';
          }
        }

        if (selectMentor) {
          try {
            const mRes = await api.get("/hr/mentors");
            const mList = mRes.data || [];
            selectMentor.innerHTML =
              '<option value="">-- Chọn Mentor phụ trách --</option>' +
              mList
                .map((m) => {
                  const isMFull = m.currentInterns >= m.maxInterns;
                  const disabledAttr = isMFull ? "disabled" : "";
                  const countText = isMFull
                    ? "(Đã đủ chỉ tiêu)"
                    : `(Đang kèm: ${m.currentInterns}/${m.maxInterns})`;
                  const selectedAttr = m.id === mentorId ? "selected" : "";
                  return `<option value="${m.id}" ${disabledAttr} ${selectedAttr}>${m.fullName} - ${m.department} ${countText}</option>`;
                })
                .join("");
          } catch (err) {
            alert("Lỗi tải danh sách Mentor: " + err.message);
          }
        }

        assignModal.classList.remove("hidden");
      };

      document.querySelectorAll(".btn-view-mentor-students").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const mentorId = Number(e.currentTarget.getAttribute("data-id"));
          const mentor = mentors.find((m) => m.id === mentorId);
          if (!mentor || !mentorStudentsModal) return;

          const assignedStudents = internList.filter(
            (s) => s.mentorId === mentor.id,
          );

          const modalNameEl = document.getElementById("modalMentorName");
          const modalDeptEl = document.getElementById("modalMentorDept");
          const modalCapEl = document.getElementById("modalMentorCapacityBadge");

          if (modalNameEl) modalNameEl.textContent = `👨‍🏫 ${mentor.fullName}`;
          if (modalDeptEl) modalDeptEl.textContent = `${mentor.department || "Khối Công nghệ"} • ${mentor.position || "Senior Lead"} • Email: ${mentor.email}`;

          const isFull = mentor.currentInterns >= mentor.maxInterns;
          if (modalCapEl) {
            modalCapEl.style.background = isFull ? "#fee2e2" : "#dcfce7";
            modalCapEl.style.color = isFull ? "#dc2626" : "#15803d";
            modalCapEl.textContent = `Tải trọng: ${assignedStudents.length} / ${mentor.maxInterns} sinh viên (${isFull ? "Đã đầy tải" : "Còn " + (mentor.maxInterns - assignedStudents.length) + " chỗ"})`;
          }

          const tbody = document.getElementById("mentorStudentsTableBody");
          if (tbody) {
            if (assignedStudents.length === 0) {
              tbody.innerHTML = `
                <tr>
                  <td colspan="6" class="empty-state" style="padding:32px; text-align:center; color:#64748b;">
                    Mentor này hiện chưa được phân công hướng dẫn sinh viên nào.
                  </td>
                </tr>
              `;
            } else {
              tbody.innerHTML = assignedStudents
                .map(
                  (s) => `
                <tr>
                  <td><strong>${s.profileCode || "#TTS-" + s.id}</strong></td>
                  <td>
                    <div class="candidate-cell">
                      <span class="name" style="font-weight:600; color:#1e293b;">${s.fullName}</span>
                      <span class="email" style="font-size:0.8rem; color:#64748b;">${s.email}</span>
                    </div>
                  </td>
                  <td>
                    <div>${s.university}</div>
                    <small style="color:#64748b;">${s.major || "Chưa cập nhật"}</small>
                  </td>
                  <td><strong>${s.position}</strong></td>
                  <td>${s.programName || "Đợt thực tập chung"}</td>
                  <td style="text-align:center;">
                    <span class="badge-status done">Đang hướng dẫn</span>
                  </td>
                </tr>
              `,
                )
                .join("");
            }
          }

          const quickBtnContainer = document.getElementById("modalMentorQuickAssignBtnContainer");
          if (quickBtnContainer) {
            if (!isFull) {
              quickBtnContainer.innerHTML = `
                <button 
                  id="btnModalAssignToMentor" 
                  class="btn-primary-sm" 
                  style="background-color: #059669; padding: 7px 14px; font-weight:600; font-size: 0.85rem;"
                >
                  ➕ Phân công thêm sinh viên cho Mentor này
                </button>
              `;
              document
                .getElementById("btnModalAssignToMentor")
                ?.addEventListener("click", () => {
                  mentorStudentsModal.classList.add("hidden");
                  triggerQuickAssign(mentor.id, mentor.fullName);
                });
            } else {
              quickBtnContainer.innerHTML = `<span style="font-size:0.85rem; color:#dc2626; font-weight:600;">⚠️️ Mentor đã đạt tải trọng tối đa (${mentor.maxInterns} sinh viên)</span>`;
            }
          }

          mentorStudentsModal.classList.remove("hidden");
        });
      });

      document.querySelectorAll(".btn-quick-assign-mentor").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const mentorId = Number(e.currentTarget.getAttribute("data-id"));
          const mentorName = e.currentTarget.getAttribute("data-name");
          await triggerQuickAssign(mentorId, mentorName);
        });
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:#dc2626;">Lỗi tải dữ liệu Mentor: ${err.message}</td></tr>`;
      console.error("Lỗi nạp bảng Mentor:", err);
    }
  }

  // 5. TẢI DANH MỤC PHÒNG BAN
  async function loadDepartments() {
    try {
      const res = await api.get("/hr/departments");
      departmentList = res.data || [];

      if (filterProgramDept) {
        filterProgramDept.innerHTML =
          '<option value="">-- Tất cả phòng ban --</option>' +
          departmentList
            .map((d) => `<option value="${d.id}">${d.name}</option>`)
            .join("");
      }

      if (programDeptSelect) {
        programDeptSelect.innerHTML =
          '<option value="">-- Chọn phòng ban tiếp nhận --</option>' +
          departmentList
            .map(
              (d) =>
                `<option value="${d.id}">${d.name} (${d.mentorCount} Mentor - Còn ${d.availableCapacity} chỗ)</option>`,
            )
            .join("");
      }
    } catch (err) {
      console.error("Lỗi nạp phòng ban:", err);
    }
  }

  if (programDeptSelect) {
    programDeptSelect.addEventListener("change", (e) => {
      const selectedId = e.target.value;
      const dept = departmentList.find((d) => d.id === selectedId);
      if (dept && deptCapacityHint) {
        deptCapacityHint.innerHTML = `💡 <strong>${dept.name}</strong> hiện có <strong>${dept.mentorCount} Mentor</strong>. Năng lực tiếp nhận tối đa: <strong>${dept.totalCapacity}</strong> sinh viên (Hiện còn trống: ${dept.availableCapacity}).`;
      } else if (deptCapacityHint) {
        deptCapacityHint.innerHTML = "";
      }
    });
  }

  // 6. VẼ BẢNG ĐỢT THỰC TẬP THEO PHÒNG BAN (VIEW 3 - US 13)
  async function loadProgramsTable() {
    const tableBody = document.getElementById("programTableBody");
    if (!tableBody) return;

    try {
      const res = await api.get("/hr/programs");
      let programs = res.data || [];

      const selectedDept = filterProgramDept ? filterProgramDept.value : "";
      if (selectedDept) {
        programs = programs.filter((p) => p.departmentId === selectedDept);
      }

      if (programs.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="9" class="empty-state">Chưa có đợt thực tập nào thuộc phòng ban này. Bấm nút "+ Thêm đợt thực tập" để tạo!</td></tr>';
        return;
      }

      tableBody.innerHTML = programs
        .map((p) => {
          const start = new Date(p.startDate);
          const end = new Date(p.endDate);
          const diffDays = Math.ceil(
            Math.abs(end - start) / (1000 * 60 * 60 * 24),
          );
          const diffWeeks = Math.round(diffDays / 7);

          let statusBadge = "";
          if (p.status === "DangDienRa") {
            statusBadge = `<span class="badge-status done">Đang diễn ra</span>`;
          } else if (p.status === "SapDienRa") {
            statusBadge = `<span class="badge-status pending">Sắp diễn ra</span>`;
          } else {
            statusBadge = `<span class="badge-status" style="background:#f1f5f9; color:#64748b;">Đã kết thúc</span>`;
          }

          return `
          <tr>
            <td><strong>#${p.programCode}</strong></td>
            <td>
              <strong>${p.name}</strong>
              <div style="font-size: 0.8rem; color: #64748b;">${p.description || "Chưa có mô tả"}</div>
            </td>
            <td>
              <span class="badge-role" style="background-color: #0284c7;">${p.departmentName || "Phòng Kỹ thuật"}</span>
            </td>
            <td>${p.startDate}</td>
            <td>${p.endDate}</td>
            <td>${diffDays} ngày <small style="color:#64748b;">(~${diffWeeks} tuần)</small></td>
            <td><strong>${p.enrolledInterns || 0} / ${p.targetInterns}</strong> sinh viên</td>
            <td>${statusBadge}</td>
            <td style="text-align: center;">
              <button class="btn-edit-program" data-id="${p.id}" style="background-color: #3b82f6; color: #fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.8rem; font-weight:600;">
                ✏️ Thiết lập
              </button>
            </td>
          </tr>
        `;
        })
        .join("");

      document.querySelectorAll(".btn-edit-program").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = Number(e.currentTarget.getAttribute("data-id"));
          const selectedProg = programs.find((p) => p.id === id);
          if (!selectedProg || !programModal) return;

          if (programModalTitle) {
            programModalTitle.textContent = "Thiết lập đợt thực tập phòng ban";
          }
          document.getElementById("editProgramId").value = selectedProg.id;
          if (programDeptSelect) {
            programDeptSelect.value = selectedProg.departmentId || "PB_IT";
          }
          document.getElementById("programNameInput").value = selectedProg.name;
          document.getElementById("startDateInput").value =
            selectedProg.startDate;
          document.getElementById("endDateInput").value = selectedProg.endDate;
          document.getElementById("targetInternsInput").value =
            selectedProg.targetInterns;
          if (document.getElementById("programDescInput")) {
            document.getElementById("programDescInput").value =
              selectedProg.description || "";
          }

          if (document.getElementById("programDepartmentError"))
            document.getElementById("programDepartmentError").textContent = "";
          if (document.getElementById("programNameError"))
            document.getElementById("programNameError").textContent = "";
          if (document.getElementById("startDateError"))
            document.getElementById("startDateError").textContent = "";
          if (document.getElementById("endDateError"))
            document.getElementById("endDateError").textContent = "";

          programModal.classList.remove("hidden");
        });
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="9" class="empty-state" style="color:#dc2626;">Lỗi tải danh sách đợt thực tập: ${err.message}</td></tr>`;
    }
  }

  if (filterProgramDept) {
    filterProgramDept.addEventListener("change", loadProgramsTable);
  }

  // Mở modal tạo mới Đợt thực tập
  if (btnOpenCreateProgram) {
    btnOpenCreateProgram.addEventListener("click", () => {
      if (!programModal) return;
      if (programModalTitle)
        programModalTitle.textContent = "Thêm Đợt Thực Tập Theo Phòng Ban";
      document.getElementById("editProgramId").value = "";
      if (programDeptSelect) programDeptSelect.value = "";
      if (deptCapacityHint) deptCapacityHint.innerHTML = "";
      document.getElementById("programNameInput").value = "";
      document.getElementById("startDateInput").value = "";
      document.getElementById("endDateInput").value = "";
      document.getElementById("targetInternsInput").value = "20";
      if (document.getElementById("programDescInput")) {
        document.getElementById("programDescInput").value = "";
      }

      if (document.getElementById("programDepartmentError"))
        document.getElementById("programDepartmentError").textContent = "";
      if (document.getElementById("programNameError"))
        document.getElementById("programNameError").textContent = "";
      if (document.getElementById("startDateError"))
        document.getElementById("startDateError").textContent = "";
      if (document.getElementById("endDateError"))
        document.getElementById("endDateError").textContent = "";

      programModal.classList.remove("hidden");
    });
  }

  // Submit Lưu đợt thực tập theo phòng ban (US 13)
  if (formProgramTime) {
    formProgramTime.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editProgramId").value;
      const departmentId = programDeptSelect ? programDeptSelect.value : "";
      const name = document.getElementById("programNameInput").value.trim();
      const startDate = document.getElementById("startDateInput").value;
      const endDate = document.getElementById("endDateInput").value;
      const targetInterns = Number(
        document.getElementById("targetInternsInput").value,
      );
      const descInput = document.getElementById("programDescInput");
      const description = descInput ? descInput.value.trim() : "";

      let hasError = false;
      if (!departmentId) {
        document.getElementById("programDepartmentError").textContent =
          "Vui lòng chọn phòng ban phụ trách!";
        hasError = true;
      }
      if (!name) {
        document.getElementById("programNameError").textContent =
          "Vui lòng nhập tên chương trình thực tập!";
        hasError = true;
      }
      if (!startDate) {
        document.getElementById("startDateError").textContent =
          "Vui lòng chọn ngày bắt đầu!";
        hasError = true;
      }
      if (!endDate) {
        document.getElementById("endDateError").textContent =
          "Vui lòng chọn ngày kết thúc!";
        hasError = true;
      }
      if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        document.getElementById("endDateError").textContent =
          "Ngày kết thúc phải diễn ra sau ngày bắt đầu!";
        hasError = true;
      }
      if (hasError) return;

      const payload = {
        departmentId,
        name,
        startDate,
        endDate,
        targetInterns,
        description,
      };

      try {
        if (id) {
          await api.put(`/hr/programs/${id}`, payload);
          alert("Thiết lập đợt thực tập thành công!");
        } else {
          await api.post("/hr/programs", payload);
          alert("Thêm chương trình thực tập theo phòng ban thành công!");
        }

        programModal.classList.add("hidden");
        await loadProgramsTable();
      } catch (err) {
        alert("Lỗi: " + err.message);
      }
    });
  }

  // =========================================================================
  // 7. XỬ LÝ MODAL THÊM MỚI HỒ SƠ THỰC TẬP SINH
  // =========================================================================
  if (btnOpenCreateIntern && createInternModal) {
    btnOpenCreateIntern.addEventListener("click", async () => {
      formCreateIntern?.reset();
      document
        .querySelectorAll("#formCreateIntern .error-msg")
        .forEach((el) => {
          el.textContent = "";
        });

      if (createProgramSelect) {
        createProgramSelect.innerHTML =
          '<option value="">-- Đang nạp danh sách đợt... --</option>';
        try {
          const response = await api.get("/hr/programs");
          const programs = response.data || [];
          createProgramSelect.innerHTML =
            '<option value="">-- Không chọn đợt --</option>' +
            programs
              .map(
                (p) =>
                  `<option value="${p.name}">${p.name} (${p.departmentName || "Khối chung"})</option>`,
              )
              .join("");
        } catch (error) {
          createProgramSelect.innerHTML =
            '<option value="">Không tải được danh sách đợt</option>';
        }
      }

      createInternModal.classList.remove("hidden");
    });
  }

  const closeCreateInternModal = () => {
    createInternModal?.classList.add("hidden");
    formCreateIntern?.reset();
  };

  if (btnCloseCreateInternModal)
    btnCloseCreateInternModal.addEventListener("click", closeCreateInternModal);
  if (btnCancelCreateIntern)
    btnCancelCreateIntern.addEventListener("click", closeCreateInternModal);

  if (formCreateIntern) {
    formCreateIntern.addEventListener("submit", async (event) => {
      event.preventDefault();

      const fullName =
        document.getElementById("createFullName")?.value.trim() || "";
      const email =
        document.getElementById("createEmail")?.value.trim().toLowerCase() ||
        "";
      const university =
        document.getElementById("createUniversity")?.value.trim() || "";
      const phone = document.getElementById("createPhone")?.value.trim() || "";
      const major = document.getElementById("createMajor")?.value.trim() || "";
      const position =
        document.getElementById("createPosition")?.value.trim() ||
        "Thực tập sinh";
      const programName = createProgramSelect ? createProgramSelect.value : "";

      const fullNameError = document.getElementById("createFullNameError");
      const emailError = document.getElementById("createEmailError");
      const universityError = document.getElementById("createUniversityError");

      if (fullNameError) fullNameError.textContent = "";
      if (emailError) emailError.textContent = "";
      if (universityError) universityError.textContent = "";

      let isValid = true;
      if (!fullName) {
        if (fullNameError)
          fullNameError.textContent = "Vui lòng nhập họ và tên.";
        isValid = false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (emailError) emailError.textContent = "Email không đúng định dạng.";
        isValid = false;
      }
      if (!university) {
        if (universityError)
          universityError.textContent = "Vui lòng nhập trường học.";
        isValid = false;
      }
      if (!isValid) return;

      const submitButton = document.getElementById("btnSubmitCreateIntern");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Đang lưu...";
      }

      try {
        await api.post("/hr/interns", {
          fullName,
          email,
          phone,
          university,
          major,
          position,
          programName,
          status: "ChuaNop",
        });

        alert(
          "Cấp tài khoản thành công!\nMật khẩu khởi tạo: Password@123\nSinh viên hãy đăng nhập để tải tệp CV lên hệ thống.",
        );
        closeCreateInternModal();

        // 1. Reset bộ lọc tìm kiếm để đảm bảo dữ liệu mới hiện ra ngay
        if (searchInput) searchInput.value = "";
        if (filterStatus) filterStatus.value = "";

        // 2. Chuyển view về Tab Danh sách Hồ sơ nếu đang ở View khác
        if (menuCandidates && viewCandidateList) {
          switchView(
            menuCandidates,
            viewCandidateList,
            "Danh Sách Hồ Sơ Thực Tập Sinh",
            "Tiếp nhận, thẩm định hồ sơ ứng tuyển, ký kết hợp đồng và phân công Mentor",
          );
        }

        // 3. Nạp lại bảng dữ liệu mới nhất từ API
        await loadCandidates();

        if (document.getElementById("programTableBody")) {
          await loadProgramsTable();
        }
      } catch (error) {
        if (error.status === 409 && emailError) {
          emailError.textContent = error.message;
        } else {
          alert("Lỗi thêm hồ sơ: " + error.message);
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Lưu hồ sơ";
        }
      }
    });
  }

  // 8. XỬ LÝ SUBMIT TỪ CHỐI
  if (btnConfirmReject) {
    btnConfirmReject.addEventListener("click", async () => {
      const reason = rejectReasonInput.value.trim();
      if (!reason) {
        rejectReasonError.textContent = "Vui lòng nhập lý do từ chối!";
        return;
      }

      try {
        await api.post("/hr/reject", { candidateId: currentRejectId, reason });
        alert("Đã từ chối hồ sơ thành công.");
        rejectModal.classList.add("hidden");
        await loadCandidates();
      } catch (err) {
        alert("Lỗi: " + err.message);
      }
    });
  }

  // 9. XỬ LÝ SUBMIT CHỈNH SỬA HỒ SƠ
  if (formEdit) {
    formEdit.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editCandidateId").value;
      const fullName = document.getElementById("editFullName").value.trim();
      const university = document.getElementById("editUniversity").value.trim();

      if (!fullName || !university) {
        alert("Họ tên và Trường học là bắt buộc!");
        return;
      }

      const payload = {
        fullName: fullName,
        phone: document.getElementById("editPhone").value.trim(),
        university: university,
        major: document.getElementById("editMajor").value.trim(),
        position:
          document.getElementById("editPosition").value.trim() ||
          "Thực tập sinh",
      };

      try {
        await api.put(`/hr/interns/${id}`, payload);
        alert("Cập nhật hồ sơ thành công!");
        editModal.classList.add("hidden");
        await loadCandidates();
      } catch (err) {
        alert("Lỗi cập nhật: " + err.message);
      }
    });
  }

  // 10. XỬ LÝ SUBMIT PHÂN CÔNG MENTOR (US 12)
  if (formAssign) {
    formAssign.addEventListener("submit", async (e) => {
      e.preventDefault();
      const internId = document.getElementById("assignInternId").value;
      const mentorId = selectMentor ? selectMentor.value : "";
      const programName = assignProgramSelect
        ? assignProgramSelect.value
        : "Đợt thực tập Thu Đông 2026 (Khóa K23)";
      const note = document.getElementById("assignNote").value.trim();

      if (!mentorId) {
        if (selectMentorError)
          selectMentorError.textContent = "Vui lòng chọn Mentor hướng dẫn!";
        return;
      }
      if (selectMentorError) selectMentorError.textContent = "";

      try {
        await api.post("/hr/assignments", {
          internId,
          mentorId,
          programName,
          note,
        });

        alert("Phân công Mentor thành công!");
        if (assignModal) assignModal.classList.add("hidden");

        await loadCandidates();
        if (document.getElementById("mentorTableBody")) {
          await loadMentorTableView();
        }
        if (document.getElementById("programTableBody")) {
          await loadProgramsTable();
        }
      } catch (err) {
        alert("Lỗi phân công: " + err.message);
      }
    });
  }

  // 11. ĐÓNG CÁC MODAL
  const closeCvModal = () => {
    if (cvModal) cvModal.classList.add("hidden");
    if (cvIframe) cvIframe.src = "";
  };
  if (btnCloseCvModal) btnCloseCvModal.addEventListener("click", closeCvModal);
  if (btnCloseCvModalFooter)
    btnCloseCvModalFooter.addEventListener("click", closeCvModal);

  const closeRejectModal = () => {
    if (rejectModal) rejectModal.classList.add("hidden");
    currentRejectId = null;
  };
  if (btnCloseRejectModal)
    btnCloseRejectModal.addEventListener("click", closeRejectModal);
  if (btnCancelReject)
    btnCancelReject.addEventListener("click", closeRejectModal);

  if (btnCloseEditModal)
    btnCloseEditModal.addEventListener("click", () =>
      editModal.classList.add("hidden"),
    );
  if (btnCancelEdit)
    btnCancelEdit.addEventListener("click", () =>
      editModal.classList.add("hidden"),
    );

  if (btnCloseAssignModal)
    btnCloseAssignModal.addEventListener("click", () =>
      assignModal.classList.add("hidden"),
    );
  if (btnCancelAssign)
    btnCancelAssign.addEventListener("click", () =>
      assignModal.classList.add("hidden"),
    );

  if (btnCloseProgramModal)
    btnCloseProgramModal.addEventListener("click", () =>
      programModal.classList.add("hidden"),
    );
  if (btnCancelProgramModal)
    btnCancelProgramModal.addEventListener("click", () =>
      programModal.classList.add("hidden"),
    );

  // Đóng Modal xem sinh viên trực thuộc Mentor
  if (btnCloseMentorStudentsModal)
    btnCloseMentorStudentsModal.addEventListener("click", () =>
      mentorStudentsModal?.classList.add("hidden"),
    );
  if (btnCloseMentorStudentsModalFooter)
    btnCloseMentorStudentsModalFooter.addEventListener("click", () =>
      mentorStudentsModal?.classList.add("hidden"),
    );
  if (mentorStudentsModal) {
    mentorStudentsModal.addEventListener("click", (e) => {
      if (e.target === mentorStudentsModal) {
        mentorStudentsModal.classList.add("hidden");
      }
    });
  }

  // 12. ĐĂNG XUẤT
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Bạn có muốn đăng xuất khỏi cổng Quản trị HR?")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_info");
        window.location.replace("../auth/login.html");
      }
    });
  }

  // Nạp dữ liệu ban đầu
  await loadCandidates();
});

function initHrHeader(user) {
  if (user && user.fullName) {
    const hrFullName = document.getElementById("hrFullName");
    const hrEmail = document.getElementById("hrEmail");
    if (hrFullName) hrFullName.textContent = user.fullName;
    if (hrEmail) hrEmail.textContent = user.email || "hr@company.com";
  }
}