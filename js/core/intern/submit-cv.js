document.addEventListener("DOMContentLoaded", () => {
  // 1. ROUTE GUARD: Kiểm tra token trước
  const token = localStorage.getItem("access_token");
  if (!token) {
    window.location.replace("../auth/login.html");
    return;
  }

  const form = document.getElementById("formSubmitCv");
  const dropZone = document.getElementById("dropZone");
  const cvFileInput = document.getElementById("cvFileInput");
  const filePreview = document.getElementById("filePreview");
  const fileName = document.getElementById("fileName");
  const btnRemoveFile = document.getElementById("btnRemoveFile");
  const globalAlert = document.getElementById("globalAlert");
  const btnSubmit = document.getElementById("btnSubmit");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = document.getElementById("btnText");

  let selectedFile = null;

  // 2. XỬ LÝ SỰ KIỆN KÉO THẢ & CHỌN FILE
  dropZone.addEventListener("click", () => cvFileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () =>
    dropZone.classList.remove("dragover"),
  );

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  cvFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    const errorEl = document.getElementById("cvFileError");
    errorEl.textContent = "";

    // Validate định dạng và kích thước
    const validExtensions = ["pdf", "doc", "docx"];
    const fileExt = file.name.split(".").pop().toLowerCase();
    const maxSizeInMB = 5;

    if (!validExtensions.includes(fileExt)) {
      errorEl.textContent = "Chỉ chấp nhận định dạng file PDF, DOC hoặc DOCX!";
      return;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      errorEl.textContent = "Dung lượng file vượt quá giới hạn 5MB!";
      return;
    }

    selectedFile = file;
    fileName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    filePreview.classList.remove("hidden");
    dropZone.classList.add("hidden");
  }

  btnRemoveFile.addEventListener("click", () => {
    selectedFile = null;
    cvFileInput.value = "";
    filePreview.classList.add("hidden");
    dropZone.classList.remove("hidden");
  });

  // 3. SUBMIT FORM
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Reset alert
    globalAlert.className = "alert hidden";
    globalAlert.textContent = "";

    const university = document.getElementById("university").value.trim();
    const major = document.getElementById("major").value.trim();
    const desiredPosition = document.getElementById("desiredPosition").value;
    const coverLetter = document.getElementById("coverLetter").value.trim();

    // Client Validation
    let isValid = true;
    if (!university) {
      document.getElementById("universityError").textContent =
        "Vui lòng nhập trường đại học";
      isValid = false;
    }
    if (!major) {
      document.getElementById("majorError").textContent =
        "Vui lòng nhập chuyên ngành";
      isValid = false;
    }
    if (!desiredPosition) {
      document.getElementById("desiredPositionError").textContent =
        "Vui lòng chọn vị trí ứng tuyển";
      isValid = false;
    }
    if (!selectedFile) {
      document.getElementById("cvFileError").textContent =
        "Vui lòng đính kèm file CV";
      isValid = false;
    }

    if (!isValid) return;

    // Chuẩn bị FormData để tải file
    const formData = new FormData();
    formData.append("university", university);
    formData.append("major", major);
    formData.append("desiredPosition", desiredPosition);
    formData.append("coverLetter", coverLetter);
    formData.append("cvFile", selectedFile);

    // Bật Loading
    btnSubmit.disabled = true;
    btnSpinner.classList.remove("hidden");
    btnText.textContent = "Đang tải hồ sơ lên...";

    try {
      const mockUsers = JSON.parse(
        localStorage.getItem("mock_users") || "null",
      );
      if (Array.isArray(mockUsers)) {
        const userInfo = JSON.parse(
          localStorage.getItem("user_info") || "null",
        );
        const updatedUsers = mockUsers.map((user) =>
          user.email === userInfo?.email ? { ...user, hasCv: true } : user,
        );
        localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
        localStorage.setItem(
          "user_info",
          JSON.stringify({ ...userInfo, hasCv: true, status: "ChoDuyet" }),
        );
        globalAlert.className = "alert alert-success";
        globalAlert.textContent =
          "Nộp hồ sơ thành công! Đang chuyển đến màn hình chờ phê duyệt...";
        setTimeout(() => {
          window.location.href = "pending-approval.html";
        }, 1500);
        return;
      }

      // Gửi trực tiếp qua fetch (không set header Content-Type để trình duyệt tự set multipart boundary)
      const response = await fetch(
        "http://localhost:5000/api/v1/intern/submit-cv",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const resData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(resData?.message || "Tải hồ sơ thất bại");
      }

      globalAlert.className = "alert alert-success";
      globalAlert.textContent =
        "Nộp hồ sơ thành công! Đang chuyển đến màn hình chờ phê duyệt...";

      setTimeout(() => {
        // Chuyển hướng tới trang thông báo trạng thái
        window.location.href = "pending-approval.html";
      }, 1500);
    } catch (err) {
      btnSubmit.disabled = false;
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Nộp hồ sơ ngay";

      globalAlert.className = "alert alert-error";
      globalAlert.textContent =
        err.message || "Lỗi kết nối máy chủ khi nộp hồ sơ!";
    }
  });
});
