import { api } from "../core/api.js";

// Hàm bổ trợ điều hướng chuẩn theo Role và Trạng thái hồ sơ
function redirectByUserRole(user) {
  const role = user.role || "ThucTapSinh";

  if (role === "HR" || role === "Admin") {
    window.location.replace("../hr/hr-dashboard.html");
    return;
  }

  // CẬP NHẬT: Mở chuyển hướng sang Cổng Mentor
  if (role === "Mentor") {
    window.location.replace("../mentor/task-management.html");
    return;
  }

  if (role === "ThucTapSinh") {
    const userStatus = user.status || user.trangThai || "ChuaNop";
    const hasCv = Boolean(user.hasCv);
    const contractStatus = user.contractStatus || "ChoKy";

    // 1. Chưa nộp CV -> Chuyển vào trang nộp CV
    if (userStatus === "ChuaNop" || !hasCv) {
      window.location.replace("../intern/submit-cv.html");
      return;
    }

    // 2. Chờ duyệt HOẶC Bị từ chối -> Đều chuyển tới pending-approval.html
    if (userStatus === "ChoDuyet" || userStatus === "TuChoi") {
      window.location.replace("../intern/pending-approval.html");
      return;
    }

    // 3. Đã duyệt nhưng chưa ký hợp đồng -> Cũng ở pending-approval.html để ký
    if (userStatus === "DaDuyet" && contractStatus === "ChoKy") {
      window.location.replace("../intern/pending-approval.html");
      return;
    }

    // 4. Chỉ khi ĐÃ DUYỆT VÀ ĐÃ KÝ HỢP ĐỒNG mới được vào Dashboard
    if (userStatus === "DaDuyet" && contractStatus === "DaKy") {
      window.location.replace("../intern/intern-dashboard.html");
      return;
    }

    // Mặc định an toàn: đưa về trang xem trạng thái
    window.location.replace("../intern/pending-approval.html");
  }
}

// Route Guard: Kiểm tra phiên đăng nhập ngay khi DOM được nạp
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (token) {
    const userProfileStr = localStorage.getItem("user_info");
    let currentUser = {};

    try {
      currentUser = JSON.parse(userProfileStr) || {};
    } catch (e) {
      currentUser = {};
    }

    if (!currentUser.role) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
    } else {
      redirectByUserRole(currentUser);
      return;
    }
  }

  const form = document.getElementById("formLogin");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");
  const globalAlert = document.getElementById("globalAlert");
  const btnLogin = document.getElementById("btnLogin");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = document.getElementById("btnText");

  // Nút điền nhanh tài khoản Demo
  const btnFillMentor = document.getElementById("btnFillMentor");
  const btnFillIntern = document.getElementById("btnFillIntern");
  const btnFillHR = document.getElementById("btnFillHR");

  if (btnFillMentor) {
    btnFillMentor.addEventListener("click", () => {
      emailInput.value = "tuan.hoang@company.com";
      passwordInput.value = "123";
      clearErrors();
    });
  }

  if (btnFillIntern) {
    btnFillIntern.addEventListener("click", () => {
      emailInput.value = "tuan.lac@example.edu.vn";
      passwordInput.value = "123";
      clearErrors();
    });
  }

  if (btnFillHR) {
    btnFillHR.addEventListener("click", () => {
      emailInput.value = "hr@company.com";
      passwordInput.value = "123";
      clearErrors();
    });
  }

  /**
   * Reset thông báo lỗi trên UI
   */
  function clearErrors() {
    if (emailInput) emailInput.classList.remove("is-invalid");
    if (passwordInput) passwordInput.classList.remove("is-invalid");
    if (emailError) emailError.textContent = "";
    if (passwordError) passwordError.textContent = "";
    if (globalAlert) {
      globalAlert.className = "alert hidden";
      globalAlert.textContent = "";
    }
  }

  /**
   * Kiểm tra cơ bản phía client
   */
  function validate() {
    clearErrors();
    let isValid = true;

    if (!emailInput.value.trim()) {
      emailInput.classList.add("is-invalid");
      emailError.textContent = "Vui lòng nhập địa chỉ email";
      isValid = false;
    }

    if (!passwordInput.value) {
      passwordInput.classList.add("is-invalid");
      passwordError.textContent = "Vui lòng nhập mật khẩu";
      isValid = false;
    }

    return isValid;
  }

  /**
   * Chuyển trạng thái tải cho nút bấm
   */
  function setLoading(isLoading) {
    if (btnLogin) btnLogin.disabled = isLoading;
    if (isLoading) {
      if (btnSpinner) btnSpinner.classList.remove("hidden");
      if (btnText) btnText.textContent = "Đang đăng nhập...";
    } else {
      if (btnSpinner) btnSpinner.classList.add("hidden");
      if (btnText) btnText.textContent = "Đăng nhập";
    }
  }

  // Xử lý gửi biểu mẫu
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!validate()) return;

      const payload = {
        email: emailInput.value.trim(),
        password: passwordInput.value,
      };

      setLoading(true);

      try {
        const response = await api.post("/auth/login", payload);

        const token =
          response.data?.accessToken || response.accessToken || response.token;
        const userInfo = response.data?.user || response.user;

        if (token) {
          localStorage.setItem("access_token", token);
        }
        if (userInfo) {
          localStorage.setItem("user_info", JSON.stringify(userInfo));
        }

        if (globalAlert) {
          globalAlert.className = "alert alert-success";
          globalAlert.textContent =
            "Đăng nhập thành công! Đang chuyển hướng...";
        }

        setTimeout(() => {
          redirectByUserRole(userInfo || {});
        }, 500);
      } catch (err) {
        setLoading(false);

        if (globalAlert) {
          globalAlert.className = "alert alert-error";
          if (err.status === 401 || err.status === 400) {
            globalAlert.textContent = "Email hoặc mật khẩu không chính xác";
          } else {
            globalAlert.textContent =
              err.message || "Đăng nhập không thành công, vui lòng thử lại";
          }
        }
      }
    });
  }

  // Tự xóa class lỗi khi người dùng thay đổi dữ liệu
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      emailInput.classList.remove("is-invalid");
      if (emailError) emailError.textContent = "";
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      passwordInput.classList.remove("is-invalid");
      if (passwordError) passwordError.textContent = "";
    });
  }
});