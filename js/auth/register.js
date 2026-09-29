import { api } from "../core/api.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formRegister");
  const globalAlert = document.getElementById("globalAlert");
  const btnRegister = document.getElementById("btnRegister");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = document.getElementById("btnText");

  // Khai báo các input
  const inputs = {
    hoTen: document.getElementById("hoTen"),
    email: document.getElementById("email"),
    matKhau: document.getElementById("matKhau"),
    nhapLaiMatKhau: document.getElementById("nhapLaiMatKhau"),
    truongHoc: document.getElementById("truongHoc"),
    chuyenNganh: document.getElementById("chuyenNganh"),
  };

  /**
   * Hiển thị lỗi bên dưới ô input tương ứng
   */
  function showError(fieldKey, message) {
    const inputEl = inputs[fieldKey];
    const errorEl = document.getElementById(`${fieldKey}Error`);
    if (inputEl && errorEl) {
      inputEl.classList.add("is-invalid");
      errorEl.textContent = message;
    }
  }

  /**
   * Xóa toàn bộ lỗi hiển thị trên form
   */
  function clearErrors() {
    Object.keys(inputs).forEach((key) => {
      const inputEl = inputs[key];
      const errorEl = document.getElementById(`${key}Error`);
      if (inputEl) inputEl.classList.remove("is-invalid");
      if (errorEl) errorEl.textContent = "";
    });
    globalAlert.className = "alert hidden";
    globalAlert.textContent = "";
  }

  /**
   * Kiểm tra tính hợp lệ của dữ liệu đầu vào (Client-side validation)
   */
  function validateForm() {
    clearErrors();
    let isValid = true;

    // Validate Họ tên
    const valHoTen = inputs.hoTen.value.trim();
    if (!valHoTen) {
      showError("hoTen", "Vui lòng nhập họ và tên");
      isValid = false;
    } else if (valHoTen.length < 2) {
      showError("hoTen", "Họ và tên phải có ít nhất 2 ký tự");
      isValid = false;
    }

    // Validate Email
    const valEmail = inputs.email.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!valEmail) {
      showError("email", "Vui lòng nhập địa chỉ email");
      isValid = false;
    } else if (!emailRegex.test(valEmail)) {
      showError("email", "Địa chỉ email không đúng định dạng");
      isValid = false;
    }

    // Validate Mật khẩu
    const valMatKhau = inputs.matKhau.value;
    if (!valMatKhau) {
      showError("matKhau", "Vui lòng nhập mật khẩu");
      isValid = false;
    } else if (valMatKhau.length < 8) {
      showError("matKhau", "Mật khẩu phải chứa ít nhất 8 ký tự");
      isValid = false;
    }

    // Validate Nhập lại mật khẩu
    const valNhapLai = inputs.nhapLaiMatKhau.value;
    if (!valNhapLai) {
      showError("nhapLaiMatKhau", "Vui lòng nhập lại mật khẩu");
      isValid = false;
    } else if (valNhapLai !== valMatKhau) {
      showError("nhapLaiMatKhau", "Mật khẩu nhập lại không khớp");
      isValid = false;
    }

    // Validate Trường học
    const valTruongHoc = inputs.truongHoc.value.trim();
    if (!valTruongHoc) {
      showError("truongHoc", "Vui lòng nhập trường đại học/cao đẳng");
      isValid = false;
    }

    return isValid;
  }

  /**
   * Bật/tắt trạng thái loading cho nút bấm
   */
  function setLoading(isLoading) {
    btnRegister.disabled = isLoading;
    if (isLoading) {
      btnSpinner.classList.remove("hidden");
      btnText.textContent = "Đang xử lý...";
    } else {
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Đăng ký";
    }
  }

  // Lắng nghe sự kiện Submit Form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      fullName: inputs.hoTen.value.trim(),
      email: inputs.email.value.trim(),
      password: inputs.matKhau.value,
      university: inputs.truongHoc.value.trim(),
      major: inputs.chuyenNganh.value.trim() || null,
    };

    setLoading(true);

    try {
      const response = await api.post("/auth/register", payload);

      // Hiển thị thông báo thành công
      globalAlert.className = "alert alert-success";
      globalAlert.textContent =
        response.message ||
        "Đăng ký tài khoản thành công! Đang chuyển hướng...";

      // Chuyển hướng sang trang đăng nhập sau 1.5s
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (err) {
      setLoading(false);

      // Xử lý lỗi theo response từ server (400, 422, 409...)
      if (err.data && err.data.errors) {
        // Map lỗi trường cụ thể từ backend nếu có format: { errors: { email: "..." } }
        Object.keys(err.data.errors).forEach((key) => {
          showError(key, err.data.errors[key]);
        });
      } else {
        globalAlert.className = "alert alert-error";
        globalAlert.textContent =
          err.message || "Đăng ký thất bại. Vui lòng thử lại!";
      }
    }
  });

  // Tự động xóa lỗi khi người dùng gõ phím
  Object.keys(inputs).forEach((key) => {
    inputs[key].addEventListener("input", () => {
      inputs[key].classList.remove("is-invalid");
      const errEl = document.getElementById(`${key}Error`);
      if (errEl) errEl.textContent = "";
    });
  });
});
