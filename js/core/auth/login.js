import { api } from "../api.js";

// Route Guard: Kiểm tra phiên đăng nhập ngay khi DOM được nạp
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("access_token");
  if (token) {
    window.location.replace("../intern/intern-dashboard.html");
    return;
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

  /**
   * Reset thông báo lỗi trên UI
   */
  function clearErrors() {
    emailInput.classList.remove("is-invalid");
    passwordInput.classList.remove("is-invalid");
    emailError.textContent = "";
    passwordError.textContent = "";
    globalAlert.className = "alert hidden";
    globalAlert.textContent = "";
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
    btnLogin.disabled = isLoading;
    if (isLoading) {
      btnSpinner.classList.remove("hidden");
      btnText.textContent = "Đang đăng nhập...";
    } else {
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Đăng nhập";
    }
  }

  // Xử lý gửi biểu mẫu
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

      // Backend trả về HTTP 200 kèm payload dạng: { data: { accessToken: "...", user: {...} } }
      const token =
        response.data?.accessToken || response.accessToken || response.token;
      const userInfo = response.data?.user || response.user;

      if (token) {
        localStorage.setItem("access_token", token);
      }
      if (userInfo) {
        localStorage.setItem("user_info", JSON.stringify(userInfo));
      }

      // Thông báo và chuyển hướng
      globalAlert.className = "alert alert-success";
      globalAlert.textContent = "Đăng nhập thành công! Đang chuyển hướng...";

      setTimeout(() => {
        const userStatus = userInfo.status || userInfo.trangThai || "ChuaNop";
        if (userStatus === "ChuaNop" || !userInfo.hasCv) {
          window.location.href = "../intern/submit-cv.html";
        } else if (userStatus === "ChoDuyet") {
          window.location.href = "../intern/pending-approval.html";
        } else {
          window.location.href = "../intern/intern-dashboard.html";
        }
      }, 500);
    } catch (err) {
      setLoading(false);

      // Hiển thị thông báo khi sai thông tin hoặc lỗi hệ thống
      globalAlert.className = "alert alert-error";
      if (err.status === 401 || err.status === 400) {
        globalAlert.textContent = "Email hoặc mật khẩu không chính xác";
      } else {
        globalAlert.textContent =
          err.message || "Đăng nhập không thành công, vui lòng thử lại";
      }
    }
  });

  // Tự xóa class lỗi khi người dùng thay đổi dữ liệu
  emailInput.addEventListener("input", () => {
    emailInput.classList.remove("is-invalid");
    emailError.textContent = "";
  });

  passwordInput.addEventListener("input", () => {
    passwordInput.classList.remove("is-invalid");
    passwordError.textContent = "";
  });
});
