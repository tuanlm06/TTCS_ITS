/**
 * js/hr/hr-dashboard.js - Xử lý toàn diện nghiệp vụ HR (Xem CV, Duyệt, Từ chối, Sửa hồ sơ)
 */
import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. ROUTE GUARD: Kiểm tra phiên làm việc và quyền hạn HR/Admin
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

  // DOM Elements - Bảng & Bộ lọc
  const tableBody = document.getElementById("candidateTableBody");
  const searchInput = document.getElementById("searchInput");
  const filterUniversity = document.getElementById("filterUniversity");
  const filterStatus = document.getElementById("filterStatus");
  const btnResetFilter = document.getElementById("btnResetFilter");

  // DOM Elements - Modal Xem CV
  const cvModal = document.getElementById("cvModal");
  const cvIframe = document.getElementById("cvIframe");
  const modalCvTitle = document.getElementById("modalCvTitle");
  const btnCloseCvModal = document.getElementById("btnCloseCvModal");
  const btnCloseCvModalFooter = document.getElementById(
    "btnCloseCvModalFooter",
  );

  // DOM Elements - Modal Từ chối
  const rejectModal = document.getElementById("rejectModal");
  const rejectReasonInput = document.getElementById("rejectReasonInput");
  const rejectReasonError = document.getElementById("rejectReasonError");
  const btnCloseRejectModal = document.getElementById("btnCloseRejectModal");
  const btnCancelReject = document.getElementById("btnCancelReject");
  const btnConfirmReject = document.getElementById("btnConfirmReject");

  // DOM Elements - Modal Chỉnh sửa hồ sơ (US 2)
  const editModal = document.getElementById("editInternModal");
  const formEdit = document.getElementById("formEditIntern");
  const btnCloseEditModal = document.getElementById("btnCloseEditModal");
  const btnCancelEdit = document.getElementById("btnCancelEdit");

  // 2. TẢI DỮ LIỆU TỪ MOCK / BACKEND API
  async function loadCandidates() {
    try {
      const res = await api.get("/hr/candidates");
      candidates = res.data || [];
      updateKPIs();
      applyFilters();
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:#dc2626;">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
  }

  // 3. CẬP NHẬT CHỈ SỐ KPI VÀ VẼ BẢNG
  function updateKPIs() {
    const total = candidates.length;
    const pending = candidates.filter((c) => c.status === "ChoDuyet").length;
    const approved = candidates.filter((c) => c.status === "DaDuyet").length;

    document.getElementById("kpiTotal").textContent = total;
    document.getElementById("kpiPending").textContent = pending;
    document.getElementById("kpiApproved").textContent = approved;
  }

  function renderTable(list) {
    if (!list || list.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Không tìm thấy hồ sơ nào phù hợp.</td></tr>`;
      return;
    }

    tableBody.innerHTML = list
      .map((item) => {
        let statusBadge = "";
        if (item.status === "ChoDuyet") {
          statusBadge = `<span class="badge-status pending">Chờ duyệt</span>`;
        } else if (item.status === "DaDuyet") {
          statusBadge = `<span class="badge-status done">Đã duyệt</span>`;
        } else {
          statusBadge = `<span class="badge-status" style="background-color:#fee2e2; color:#dc2626;">Từ chối</span>`;
        }

        // Nút Duyệt và Từ chối chỉ hiển thị khi hồ sơ đang Chờ duyệt
        const reviewActions =
          item.status === "ChoDuyet"
            ? `
          <button class="btn-approve" data-id="${item.id}" title="Duyệt hồ sơ">✓ Duyệt</button>
          <button class="btn-reject" data-id="${item.id}" title="Từ chối hồ sơ">✕ Từ chối</button>
        `
            : "";

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
          <td>
            <button class="btn-view-cv" data-cv="${item.cvUrl}" data-name="${item.fullName}">
              📄 Xem CV
            </button>
          </td>
          <td>${statusBadge}</td>
          <td style="text-align:center;">
            <div class="action-buttons">
              ${reviewActions}
              <button class="btn-edit-intern" data-id="${item.id}" title="Chỉnh sửa thông tin hồ sơ" style="background-color: #3b82f6; color: #fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem; font-weight:600;">
                ✏️ Sửa
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    attachTableEvents();
  }

  // 4. LỌC VÀ TÌM KIẾM THEO THỜI GIAN THỰC (US 3)
  function applyFilters() {
    const keyword = searchInput.value.toLowerCase().trim();
    const uni = filterUniversity.value;
    const st = filterStatus.value;

    const filtered = candidates.filter((item) => {
      const matchKeyword =
        item.fullName.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.profileCode.toLowerCase().includes(keyword);

      // Dùng includes thay vì so sánh tuyệt đối để tránh lệch tên trường viết tắt
      const matchUni = !uni || item.university.includes(uni);
      const matchStatus = !st || item.status === st;

      return matchKeyword && matchUni && matchStatus;
    });

    renderTable(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  filterUniversity.addEventListener("change", applyFilters);
  filterStatus.addEventListener("change", applyFilters);

  btnResetFilter.addEventListener("click", () => {
    searchInput.value = "";
    filterUniversity.value = "";
    filterStatus.value = "";
    applyFilters();
  });

  // 5. GẮN SỰ KIỆN NÚT HÀNH ĐỘNG TRÊN BẢNG
  function attachTableEvents() {
    // A. Xem CV
    document.querySelectorAll(".btn-view-cv").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cvUrl = e.currentTarget.getAttribute("data-cv");
        const name = e.currentTarget.getAttribute("data-name");
        modalCvTitle.textContent = `Chi tiết CV - Ứng viên: ${name}`;
        cvIframe.src = cvUrl;
        cvModal.classList.remove("hidden");
      });
    });

    // B. Duyệt hồ sơ (US 7)
    document.querySelectorAll(".btn-approve").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = Number(e.currentTarget.getAttribute("data-id"));
        if (
          confirm(
            "Bạn có chắc chắn muốn DUYỆT hồ sơ của ứng viên này vào đợt thực tập?",
          )
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

    // C. Mở modal Từ chối (US 7)
    document.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        currentRejectId = Number(e.currentTarget.getAttribute("data-id"));
        rejectReasonInput.value = "";
        rejectReasonError.textContent = "";
        rejectModal.classList.remove("hidden");
      });
    });

    // D. Mở modal Chỉnh sửa hồ sơ (US 2)
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

        const posInput = document.getElementById("editPosition");
        if (posInput) posInput.value = candidate.position || "";

        editModal.classList.remove("hidden");
      });
    });
  }

  // 6. XÁC NHẬN TỪ CHỐI HỒ SƠ
  btnConfirmReject.addEventListener("click", async () => {
    const reason = rejectReasonInput.value.trim();
    if (!reason) {
      rejectReasonError.textContent =
        "Vui lòng nhập lý do từ chối để thông báo cho ứng viên!";
      return;
    }

    try {
      await api.post("/hr/reject", { candidateId: currentRejectId, reason });
      alert("Đã từ chối hồ sơ thành công.");
      rejectModal.classList.add("hidden");
      await loadCandidates();
    } catch (err) {
      alert("Lỗi từ chối: " + err.message);
    }
  });

  // 7. XÁC NHẬN CHỈNH SỬA HỒ SƠ (GỌI API PUT)
  if (formEdit) {
    formEdit.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editCandidateId").value;
      const fullName = document.getElementById("editFullName").value.trim();
      const university = document.getElementById("editUniversity").value.trim();

      if (!fullName) {
        document.getElementById("editFullNameError").textContent =
          "Họ tên không được để trống";
        return;
      }
      if (!university) {
        document.getElementById("editUniversityError").textContent =
          "Trường học không được để trống";
        return;
      }

      const payload = {
        fullName: fullName,
        phone: document.getElementById("editPhone").value.trim(),
        university: university,
        major: document.getElementById("editMajor").value.trim(),
        position:
          document.getElementById("editPosition")?.value.trim() ||
          "Thực tập sinh",
      };

      try {
        await api.put(`/hr/interns/${id}`, payload);
        alert("Cập nhật thông tin hồ sơ thành công!");
        editModal.classList.add("hidden");
        await loadCandidates();
      } catch (err) {
        alert("Lỗi cập nhật: " + err.message);
      }
    });
  }

  // 8. ĐÓNG CÁC MODAL
  const closeCvModal = () => {
    cvModal.classList.add("hidden");
    cvIframe.src = "";
  };
  btnCloseCvModal.addEventListener("click", closeCvModal);
  btnCloseCvModalFooter.addEventListener("click", closeCvModal);

  const closeRejectModal = () => {
    rejectModal.classList.add("hidden");
    currentRejectId = null;
  };
  btnCloseRejectModal.addEventListener("click", closeRejectModal);
  btnCancelReject.addEventListener("click", closeRejectModal);

  if (btnCloseEditModal)
    btnCloseEditModal.addEventListener("click", () =>
      editModal.classList.add("hidden"),
    );
  if (btnCancelEdit)
    btnCancelEdit.addEventListener("click", () =>
      editModal.classList.add("hidden"),
    );

  // 9. ĐĂNG XUẤT
  document.getElementById("btnLogout").addEventListener("click", () => {
    if (confirm("Bạn có muốn đăng xuất khỏi cổng Quản trị HR?")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      window.location.replace("../auth/login.html");
    }
  });

  // Tải dữ liệu ban đầu khi vào trang
  await loadCandidates();
});

function initHrHeader(user) {
  if (user && user.fullName) {
    document.getElementById("hrFullName").textContent = user.fullName;
    document.getElementById("hrEmail").textContent =
      user.email || "hr@company.com";
  }
}
