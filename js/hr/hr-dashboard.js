// Import api từ thư mục js/core/api.js (lùi ra 1 cấp)
import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. ROUTE GUARD: Kiểm tra quyền hạn HR hoặc Admin
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

  const tableBody = document.getElementById("candidateTableBody");
  const searchInput = document.getElementById("searchInput");
  const filterUniversity = document.getElementById("filterUniversity");
  const filterStatus = document.getElementById("filterStatus");
  const btnResetFilter = document.getElementById("btnResetFilter");

  const cvModal = document.getElementById("cvModal");
  const cvIframe = document.getElementById("cvIframe");
  const modalCvTitle = document.getElementById("modalCvTitle");
  const btnCloseCvModal = document.getElementById("btnCloseCvModal");
  const btnCloseCvModalFooter = document.getElementById(
    "btnCloseCvModalFooter",
  );

  const rejectModal = document.getElementById("rejectModal");
  const rejectReasonInput = document.getElementById("rejectReasonInput");
  const rejectReasonError = document.getElementById("rejectReasonError");
  const btnCloseRejectModal = document.getElementById("btnCloseRejectModal");
  const btnCancelReject = document.getElementById("btnCancelReject");
  const btnConfirmReject = document.getElementById("btnConfirmReject");

  // 2. TẢI DỮ LIỆU TỪ MOCK / API
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

  // 3. CẬP NHẬT THỐNG KÊ VÀ BẢNG
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

        const actionButtons =
          item.status === "ChoDuyet"
            ? `
          <div class="action-buttons">
            <button class="btn-approve" data-id="${item.id}">✓ Duyệt</button>
            <button class="btn-reject" data-id="${item.id}">✕ Từ chối</button>
          </div>
        `
            : `<span style="color:#94a3b8; font-size:0.8rem;">Đã hoàn tất</span>`;

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
          <td style="text-align:center;">${actionButtons}</td>
        </tr>
      `;
      })
      .join("");

    attachTableEvents();
  }

  // 4. LỌC VÀ TÌM KIẾM THEO THỜI GIAN THỰC
  function applyFilters() {
    const keyword = searchInput.value.toLowerCase().trim();
    const uni = filterUniversity.value;
    const st = filterStatus.value;

    const filtered = candidates.filter((item) => {
      const matchKeyword =
        item.fullName.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword) ||
        item.profileCode.toLowerCase().includes(keyword);
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

  // 5. GẮN SỰ KIỆN DUYỆT, TỪ CHỐI, XEM CV
  function attachTableEvents() {
    document.querySelectorAll(".btn-view-cv").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cvUrl = e.currentTarget.getAttribute("data-cv");
        const name = e.currentTarget.getAttribute("data-name");
        modalCvTitle.textContent = `Chi tiết CV - Ứng viên: ${name}`;
        cvIframe.src = cvUrl;
        cvModal.classList.remove("hidden");
      });
    });

    document.querySelectorAll(".btn-approve").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = parseInt(e.target.getAttribute("data-id"));
        if (confirm("Bạn có chắc chắn muốn DUYỆT hồ sơ của ứng viên này?")) {
          try {
            await api.post("/hr/approve", { candidateId: id });
            alert("Đã phê duyệt thành công hồ sơ!");
            await loadCandidates();
          } catch (err) {
            alert("Lỗi phê duyệt: " + err.message);
          }
        }
      });
    });

    document.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        currentRejectId = parseInt(e.target.getAttribute("data-id"));
        rejectReasonInput.value = "";
        rejectReasonError.textContent = "";
        rejectModal.classList.remove("hidden");
      });
    });
  }

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

  document.getElementById("btnLogout").addEventListener("click", () => {
    if (confirm("Bạn có muốn đăng xuất khỏi tài khoản HR?")) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      window.location.replace("../auth/login.html");
    }
  });

  await loadCandidates();
});

function initHrHeader(user) {
  if (user && user.fullName) {
    document.getElementById("hrFullName").textContent = user.fullName;
    document.getElementById("hrEmail").textContent =
      user.email || "hr@company.com";
  }
}
