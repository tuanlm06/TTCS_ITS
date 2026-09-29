/**
 * js/core/api.js - File helper giao tiếp API tập trung (Hỗ trợ Mock đa luồng & Fetch thật)
 */

const API_CONFIG = {
  BASE_URL: "http://localhost:5000/api/v1",
  MOCK: true, // Đổi thành false khi kết nối với Backend thật
  MOCK_DELAY: 400, // Giả lập độ trễ mạng 400ms để kiểm thử spinner loading
  TIMEOUT: 10000,
};

// Khởi tạo tài khoản mẫu ban đầu nếu localStorage chưa có dữ liệu
function initMockDatabase() {
  const users = localStorage.getItem("mock_users");
  if (!users) {
    const initialUsers = [
      {
        id: 1,
        fullName: "Lạc Mạnh Tuấn",
        email: "tuan.lac@example.edu.vn",
        password: "Password@123",
        role: "ThucTapSinh",
        university: "ĐH Công nghệ Thông tin & Truyền thông - ĐHTN",
        major: "Công nghệ Thông tin",
        status: "ChoDuyet", // Trạng thái: 'ChuaNop', 'ChoDuyet', 'DaDuyet', 'TuChoi'
        hasCv: true,
        cvFileName: "CV_LacManhTuan.pdf",
      },
      {
        id: 2,
        fullName: "Cán Bộ Tuyển Dụng HR",
        email: "hr@company.com",
        password: "Password@123",
        role: "HR",
        university: "",
        major: "",
        status: "HoatDong",
        hasCv: false,
      },
    ];
    localStorage.setItem("mock_users", JSON.stringify(initialUsers));
  }
}
initMockDatabase();

/**
 * Xử lý dữ liệu giả lập cho toàn bộ các màn hình
 */
async function mockRequest(endpoint, options) {
  // Giả lập độ trễ mạng bất đồng bộ
  await new Promise((resolve) => setTimeout(resolve, API_CONFIG.MOCK_DELAY));

  const method = (options.method || "GET").toUpperCase();
  const users = JSON.parse(localStorage.getItem("mock_users") || "[]");

  // Đọc body an toàn (Hỗ trợ cả JSON và FormData)
  let body = {};
  if (options.body) {
    if (options.body instanceof FormData) {
      body = Object.fromEntries(options.body.entries());
    } else if (typeof options.body === "string") {
      try {
        body = JSON.parse(options.body);
      } catch (e) {
        body = {};
      }
    }
  }

  // 1. MOCK: Đăng ký tài khoản
  if (endpoint === "/auth/register" && method === "POST") {
    if (users.some((u) => u.email === body.email)) {
      const error = new Error("Email này đã được sử dụng trên hệ thống");
      error.status = 409;
      error.data = {
        errors: { email: "Email này đã được sử dụng trên hệ thống" },
      };
      throw error;
    }

    const newUser = {
      id: Date.now(),
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      role: "ThucTapSinh",
      university: body.university,
      major: body.major,
      status: "ChuaNop", // Vừa đăng ký xong thì chưa nộp CV
      hasCv: false,
    };

    localStorage.setItem("mock_users", JSON.stringify([...users, newUser]));
    return {
      success: true,
      message: "Đăng ký tài khoản thành công!",
      data: { userId: newUser.id, email: newUser.email },
    };
  }

  // 2. MOCK: Đăng nhập
  if (endpoint === "/auth/login" && method === "POST") {
    const user = users.find(
      (item) => item.email === body.email && item.password === body.password,
    );

    if (!user) {
      const error = new Error("Email hoặc mật khẩu không chính xác");
      error.status = 401;
      throw error;
    }

    const { password, ...userInfo } = user;
    return {
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        accessToken: `mock-jwt-token-${user.id}-${Date.now()}`,
        user: userInfo,
      },
    };
  }

  // 3. MOCK: Thực tập sinh nộp hồ sơ & CV
  if (endpoint === "/intern/submit-cv" && method === "POST") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const updatedUsers = users.map((u) => {
      if (u.email === currentUser.email) {
        return {
          ...u,
          university: body.university || u.university,
          major: body.major || u.major,
          position: body.desiredPosition || "Thực tập sinh",
          hasCv: true,
          status: "ChoDuyet",
          cvFileName: body.cvFile ? body.cvFile.name : "CV_DinhKem.pdf",
        };
      }
      return u;
    });

    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));

    // Cập nhật lại user_info trong session
    currentUser.hasCv = true;
    currentUser.status = "ChoDuyet";
    localStorage.setItem("user_info", JSON.stringify(currentUser));

    return {
      success: true,
      message: "Nộp hồ sơ thành công! Hồ sơ đang chờ HR xét duyệt.",
    };
  }

  // 4. MOCK: Lấy trạng thái hồ sơ của cá nhân Thực tập sinh
  if (endpoint === "/intern/profile-status" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current =
      users.find((u) => u.email === currentUser.email) || currentUser;

    return {
      success: true,
      data: {
        profileId: `HS-${current.id || 101}`,
        fullName: current.fullName,
        university: current.university,
        major: current.major,
        cvName: current.cvFileName || "CV_ThucTap.pdf",
        status: current.status || "ChoDuyet",
        rejectReason: current.rejectReason || "",
      },
    };
  }

  throw new Error(
    `[Mock Error] Endpoint "${endpoint}" với method "${method}" chưa được cấu hình.`,
  );
}

/**
 * Hàm gửi HTTP Request chính
 */
async function request(endpoint, options = {}) {
  // Nếu bật chế độ Mock -> Chuyển sang mockRequest
  if (API_CONFIG.MOCK) {
    return mockRequest(endpoint, options);
  }

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const token = localStorage.getItem("access_token");

  // Thiết lập Header tự động
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  // Nếu body KHÔNG PHẢI là FormData thì mới gán Content-Type là JSON
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Hỗ trợ AbortController xử lý Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(
        (data && data.message) || "Có lỗi xảy ra trên hệ thống",
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      error.message =
        "Yêu cầu đã bị hủy do máy chủ phản hồi quá thời gian quy định (Timeout).";
    } else if (!error.status) {
      error.message =
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc máy chủ Backend!";
    }
    throw error;
  }
}

// Xuất các phương thức API tiện ích
export const api = {
  get: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "GET" }),

  post: (endpoint, body, options = {}) => {
    // Nếu body là FormData (khi upload file), giữ nguyên không stringify
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  put: (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "DELETE" }),
};
