/**
 * Central API helper for mock development and future backend integration.
 */

const API_CONFIG = {
  BASE_URL: "http://localhost:5000/api/v1",
  MOCK: true,
  MOCK_DELAY: 400,
  TIMEOUT: 10000,
};

const DEFAULT_USERS = [
  {
    id: 1,
    fullName: "Lạc Mạnh Tuấn",
    email: "tuan.lac@example.edu.vn",
    password: "Password@123",
    role: "ThucTapSinh",
    university: "ĐH Công nghệ Thông tin & Truyền thông - ĐHTN",
    major: "Công nghệ Thông tin",
    status: "ChoDuyet",
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

function getMockUsers() {
  let savedUsers = [];
  try {
    savedUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
  } catch (error) {
    savedUsers = [];
  }

  const users = [...savedUsers];
  DEFAULT_USERS.forEach((defaultUser) => {
    if (!users.some((user) => user.email === defaultUser.email)) {
      users.push(defaultUser);
    }
  });
  localStorage.setItem("mock_users", JSON.stringify(users));
  return users;
}

getMockUsers();

async function mockRequest(endpoint, options) {
  await new Promise((resolve) => setTimeout(resolve, API_CONFIG.MOCK_DELAY));

  const method = (options.method || "GET").toUpperCase();
  const users = getMockUsers();
  let body = {};

  if (options.body instanceof FormData) {
    body = Object.fromEntries(options.body.entries());
  } else if (typeof options.body === "string") {
    try {
      body = JSON.parse(options.body);
    } catch (error) {
      body = {};
    }
  }

  if (endpoint === "/auth/register" && method === "POST") {
    if (users.some((user) => user.email === body.email)) {
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
      status: "ChuaNop",
      hasCv: false,
    };
    localStorage.setItem("mock_users", JSON.stringify([...users, newUser]));
    return {
      success: true,
      message: "Đăng ký tài khoản thành công!",
      data: { userId: newUser.id, email: newUser.email },
    };
  }

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

  if (endpoint === "/intern/submit-cv" && method === "POST") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const updatedUsers = users.map((user) =>
      user.email === currentUser.email
        ? {
            ...user,
            university: body.university || user.university,
            major: body.major || user.major,
            position: body.desiredPosition || "Thực tập sinh",
            hasCv: true,
            status: "ChoDuyet",
            cvFileName: body.cvFile?.name || "CV_DinhKem.pdf",
          }
        : user,
    );
    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
    localStorage.setItem(
      "user_info",
      JSON.stringify({ ...currentUser, hasCv: true, status: "ChoDuyet" }),
    );
    return { success: true, message: "Nộp hồ sơ thành công!" };
  }

  if (endpoint === "/intern/profile-status" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current =
      users.find((user) => user.email === currentUser.email) || currentUser;
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

  if (endpoint === "/hr/candidates" && method === "GET") {
    return {
      success: true,
      data: users
        .filter((user) => user.role === "ThucTapSinh" && user.hasCv)
        .map((user) => ({
          id: user.id,
          profileCode: `HS-${user.id}`,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || "Chưa cập nhật",
          university: user.university || "Chưa cập nhật",
          major: user.major || "Chưa cập nhật",
          position: user.position || "Thực tập sinh",
          cvUrl: user.cvUrl || "about:blank",
          status: user.status || "ChoDuyet",
        })),
    };
  }

  if (endpoint === "/hr/approve" && method === "POST") {
    const updatedUsers = users.map((user) =>
      user.id === Number(body.candidateId)
        ? { ...user, status: "DaDuyet" }
        : user,
    );
    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
    return { success: true, message: "Đã phê duyệt hồ sơ." };
  }

  if (endpoint === "/hr/reject" && method === "POST") {
    const updatedUsers = users.map((user) =>
      user.id === Number(body.candidateId)
        ? { ...user, status: "TuChoi", rejectReason: body.reason || "" }
        : user,
    );
    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
    return { success: true, message: "Đã từ chối hồ sơ." };
  }

  if (endpoint.startsWith("/hr/interns/") && method === "PUT") {
    const id = Number(endpoint.split("/").pop());
    const updatedUsers = users.map((user) =>
      user.id === id
        ? {
            ...user,
            fullName: body.fullName || user.fullName,
            phone: body.phone || "",
            university: body.university || user.university,
            major: body.major || user.major,
            position: body.position || user.position,
          }
        : user,
    );
    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
    return { success: true, message: "Cập nhật hồ sơ thành công." };
  }

  throw new Error(
    `[Mock Error] Endpoint "${endpoint}" với method "${method}" chưa được cấu hình.`,
  );
}

async function request(endpoint, options = {}) {
  if (API_CONFIG.MOCK) return mockRequest(endpoint, options);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  const headers = { Accept: "application/json", ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("access_token");
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.message || "Có lỗi xảy ra trên hệ thống");
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      error.message = "Máy chủ phản hồi quá thời gian quy định.";
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "DELETE" }),
};
