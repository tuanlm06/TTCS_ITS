/**
 * js/core/api.js - Central API helper for mock development and future backend integration.
 */

const API_CONFIG = {
  BASE_URL: "http://localhost:5000/api/v1",
  MOCK: true, // Đổi thành false khi kết nối với máy chủ Backend thật
  MOCK_DELAY: 400, // Giả lập độ trễ mạng 400ms để kiểm thử spinner / hiệu ứng loading
  TIMEOUT: 10000, // Hạn thời gian phản hồi (10 giây)
};

const DEFAULT_DEPARTMENTS = [
  { id: "PB_IT", name: "Phòng Công nghệ Phần mềm", code: "IT" },
  { id: "PB_QA", name: "Phòng Đảm bảo Chất lượng (QA/QC)", code: "QA" },
  { id: "PB_HR", name: "Phòng Nhân sự & Tuyển dụng", code: "HR" },
];

const DEFAULT_USERS = [
  {
    id: 1,
    fullName: "Lạc Mạnh Tuấn",
    email: "tuan.lac@example.edu.vn",
    phone: "0987654321",
    password: "Password@123",
    role: "ThucTapSinh",
    university: "ĐH Công nghệ Thông tin & Truyền thông - ĐHTN",
    major: "Công nghệ Thông tin",
    position: "Frontend Developer",
    status: "ChoDuyet", // 'ChuaNop', 'ChoDuyet', 'DaDuyet', 'TuChoi'
    hasCv: true,
    cvFileName: "CV_LacManhTuan.pdf",
    cvUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    rejectReason: "",
    contractStatus: "ChoKy", // 'ChoKy', 'DaKy'
    contractSignedAt: null,
    mentorId: null,
    mentorName: "",
    programName: "Đợt thực tập Thu Đông 2026 (Khóa K23)",
  },
  {
    id: 2,
    fullName: "Cán Bộ Tuyển Dụng HR",
    email: "hr@company.com",
    phone: "0912345678",
    password: "Password@123",
    role: "HR",
    university: "",
    major: "",
    position: "HR Specialist",
    status: "HoatDong",
    hasCv: false,
  },
  {
    id: 3,
    fullName: "Quản Trị Viên Hệ Thống",
    email: "admin@company.com",
    phone: "0999888777",
    password: "Password@123",
    role: "Admin",
    university: "",
    major: "",
    position: "System Administrator",
    status: "HoatDong",
    hasCv: false,
  },
  {
    id: 4,
    fullName: "ThS. Hoàng Anh Tuấn",
    email: "tuan.hoang@company.com",
    phone: "0934567890",
    password: "Password@123",
    role: "Mentor",
    university: "",
    major: "",
    department: "Phòng Công nghệ Phần mềm",
    position: "Senior Technical Lead",
    status: "HoatDong",
    maxInterns: 4,
    hasCv: false,
  },
  {
    id: 5,
    fullName: "Kỹ sư Đặng Thị Mai",
    email: "mai.dang@company.com",
    phone: "0945678901",
    password: "Password@123",
    role: "Mentor",
    university: "",
    major: "",
    department: "Phòng Đảm bảo Chất lượng (QA/QC)",
    position: "QA Lead",
    status: "HoatDong",
    maxInterns: 3,
    hasCv: false,
  },
];

const DEFAULT_PROGRAMS = [
  {
    id: 1,
    programCode: "CT-IT-2026-Q4",
    name: "Đợt thực tập Thu Đông 2026 (Khóa K23)",
    departmentId: "PB_IT",
    departmentName: "Phòng Công nghệ Phần mềm",
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    targetInterns: 30,
    description:
      "Chương trình thực tập chuyên môn Công nghệ thông tin & Phát triển phần mềm",
  },
  {
    id: 2,
    programCode: "CT-QA-2027-Q1",
    name: "Đợt thực tập Kiểm thử Phần mềm Xuân 2027",
    departmentId: "PB_QA",
    departmentName: "Phòng Đảm bảo Chất lượng (QA/QC)",
    startDate: "2027-02-15",
    endDate: "2027-05-15",
    targetInterns: 20,
    description: "Đào tạo kỹ năng Automation Testing & Performance Test",
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

function getMockPrograms() {
  let savedPrograms = [];
  try {
    savedPrograms = JSON.parse(localStorage.getItem("mock_programs") || "[]");
  } catch (error) {
    savedPrograms = [];
  }

  const programs = [...savedPrograms];
  DEFAULT_PROGRAMS.forEach((defaultProg) => {
    if (!programs.some((prog) => prog.id === defaultProg.id)) {
      programs.push(defaultProg);
    }
  });

  localStorage.setItem("mock_programs", JSON.stringify(programs));
  return programs;
}

getMockUsers();
getMockPrograms();

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

  // 1. MOCK: Đăng ký tài khoản (US 6)
  if (endpoint === "/auth/register" && method === "POST") {
    if (
      users.some(
        (user) => user.email.toLowerCase() === body.email.toLowerCase(),
      )
    ) {
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
      phone: body.phone || "",
      password: body.password,
      role: "ThucTapSinh",
      university: body.university,
      major: body.major,
      position: "Chưa phân công",
      status: "ChuaNop",
      hasCv: false,
      cvFileName: "",
      cvUrl: "",
      rejectReason: "",
      contractStatus: "ChoKy",
      contractSignedAt: null,
      mentorId: null,
      mentorName: "",
      programName: "",
    };

    localStorage.setItem("mock_users", JSON.stringify([...users, newUser]));
    return {
      success: true,
      message: "Đăng ký tài khoản thành công!",
      data: { userId: newUser.id, email: newUser.email },
    };
  }

  // 2. MOCK: Đăng nhập hệ thống (US 39)
  if (endpoint === "/auth/login" && method === "POST") {
    const user = users.find(
      (item) =>
        item.email.toLowerCase() === body.email.toLowerCase() &&
        item.password === body.password,
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

  // 3. MOCK: Thực tập sinh nộp hồ sơ & CV (US 4)
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
            cvUrl:
              "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          }
        : user,
    );

    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
    localStorage.setItem(
      "user_info",
      JSON.stringify({
        ...currentUser,
        hasCv: true,
        status: "ChoDuyet",
        position: body.desiredPosition || "Thực tập sinh",
      }),
    );

    return {
      success: true,
      message: "Nộp hồ sơ thành công! Đang chờ xét duyệt.",
    };
  }

  // 4. MOCK: Lấy trạng thái hồ sơ cá nhân thực tập sinh
  if (endpoint === "/intern/profile-status" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current =
      users.find((user) => user.email === currentUser.email) || currentUser;

    return {
      success: true,
      data: {
        profileId: `HS-${current.id || 101}`,
        fullName: current.fullName,
        email: current.email,
        phone: current.phone || "Chưa cập nhật",
        university: current.university,
        major: current.major,
        position: current.position || "Thực tập sinh",
        cvName: current.cvFileName || "CV_ThucTap.pdf",
        cvUrl:
          current.cvUrl ||
          "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        status: current.status || "ChoDuyet",
        rejectReason: current.rejectReason || "",
        contractStatus: current.contractStatus || "ChoKy",
        mentorName: current.mentorName || "",
      },
    };
  }

  // 4.1 MOCK: Tổng quan bảng điều khiển Thực tập sinh (KPI, Task, Mentor)
  if (endpoint === "/intern/overview" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current =
      users.find((user) => user.email === currentUser.email) || currentUser;
    const mentor = users.find(
      (user) =>
        user.id === current.mentorId || user.fullName === current.mentorName,
    );

    // Kiểm tra trạng thái check-in hôm nay
    const todayDate = new Date().toISOString().split("T")[0];
    const isCheckedIn =
      localStorage.getItem(`checkin_${current.id || "guest"}_${todayDate}`) === "true";

    return {
      success: true,
      data: {
        department:
          current.department ||
          (mentor ? mentor.department : "Phòng Công nghệ Phần mềm"),
        mentorName:
          current.mentorName || (mentor ? mentor.fullName : "Chưa phân công"),
        mentorEmail:
          (mentor && mentor.email) || current.mentorEmail || "mentor@company.com",
        pendingTasks: [
          {
            id: 1,
            title: "Tìm hiểu quy trình và nghiệp vụ thực tập doanh nghiệp",
            deadline: "2026-10-05",
            status: "progress",
          },
          {
            id: 2,
            title: "Kiểm thử tích hợp luồng nộp hồ sơ & báo cáo công việc",
            deadline: "2026-10-10",
            status: "todo",
          },
        ],
        todayCheckedIn: isCheckedIn,
      },
    };
  }

  // 4.2 MOCK: Điểm danh / Check-in hàng ngày
  if (endpoint === "/attendance/checkin" && method === "POST") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const todayDate = new Date().toISOString().split("T")[0];
    localStorage.setItem(`checkin_${currentUser.id || "guest"}_${todayDate}`, "true");

    return {
      success: true,
      message: "Ghi nhận điểm danh ngày hôm nay thành công!",
      data: {
        timestamp: body.timestamp || new Date().toISOString(),
      },
    };
  }

  // 5. MOCK: HR lấy danh sách hồ sơ thực tập sinh (US 5)
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
          cvUrl:
            user.cvUrl ||
            "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          cvFileName: user.cvFileName || "CV_ThucTap.pdf",
          status: user.status || "ChoDuyet",
          rejectReason: user.rejectReason || "",
          contractStatus: user.contractStatus || "ChoKy",
          mentorId: user.mentorId || null,
          mentorName: user.mentorName || "",
          programName: user.programName || "",
        })),
    };
  }

  // 6. MOCK: HR phê duyệt hồ sơ (US 7)
  if (endpoint === "/hr/approve" && method === "POST") {
    const targetId = Number(body.candidateId);
    const updatedUsers = users.map((user) =>
      user.id === targetId
        ? { ...user, status: "DaDuyet", contractStatus: "ChoKy" }
        : user,
    );
    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
    return { success: true, message: "Đã phê duyệt hồ sơ thành công." };
  }

  // 7. MOCK: HR từ chối hồ sơ kèm lý do (US 7)
  if (endpoint === "/hr/reject" && method === "POST") {
    const targetId = Number(body.candidateId);
    const updatedUsers = users.map((user) =>
      user.id === targetId
        ? {
            ...user,
            status: "TuChoi",
            rejectReason: body.reason || "Hồ sơ chưa đạt yêu cầu chuẩn.",
          }
        : user,
    );
    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
    return { success: true, message: "Đã từ chối hồ sơ." };
  }

  // 8. MOCK: HR tạo tài khoản hộ, sinh viên tự nộp CV sau (Trường hợp A)
  if (endpoint === "/hr/interns" && method === "POST") {
    // 1. Kiểm tra trùng lặp email
    if (users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
      const error = new Error("Email này đã được sử dụng trên hệ thống!");
      error.status = 409;
      throw error;
    }

    const newId = Date.now();
    const newIntern = {
      id: newId,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone || "Chưa cập nhật",
      password: "Password@123", // Mật khẩu khởi tạo
      role: "ThucTapSinh",
      university: body.university,
      major: body.major || "Chưa cập nhật",
      position: body.position || "Thực tập sinh",
      status: "ChuaNop", // TRƯỜNG HỢP A: Trạng thái chưa nộp
      hasCv: false, // TRƯỜNG HỢP A: Chưa có CV
      cvFileName: "",
      cvUrl: "",
      rejectReason: "",
      contractStatus: "ChoKy",
      contractSignedAt: null,
      mentorId: null,
      mentorName: "",
      programName: body.programName || "Đợt thực tập Thu Đông 2026 (Khóa K23)",
    };

    const updatedUsers = [...users, newIntern];
    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));

    return {
      success: true,
      message:
        "Cấp tài khoản cho sinh viên thành công! Sinh viên cần đăng nhập để nộp CV online.",
      data: newIntern,
    };
  }

  // 9. MOCK: HR cập nhật thông tin hồ sơ thực tập sinh (US 2)
  if (endpoint.startsWith("/hr/interns/") && method === "PUT") {
    const id = Number(endpoint.split("/").pop());
    const existingIndex = users.findIndex((u) => u.id === id);

    if (existingIndex === -1) {
      const error = new Error("Không tìm thấy thực tập sinh này trên hệ thống");
      error.status = 404;
      throw error;
    }

    users[existingIndex] = {
      ...users[existingIndex],
      fullName: body.fullName || users[existingIndex].fullName,
      phone: body.phone !== undefined ? body.phone : users[existingIndex].phone,
      university:
        body.university !== undefined
          ? body.university
          : users[existingIndex].university,
      major: body.major !== undefined ? body.major : users[existingIndex].major,
      position:
        body.position !== undefined
          ? body.position
          : users[existingIndex].position,
    };

    localStorage.setItem("mock_users", JSON.stringify(users));

    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    if (currentUser.id === id) {
      const { password, ...safeInfo } = users[existingIndex];
      localStorage.setItem("user_info", JSON.stringify(safeInfo));
    }

    return {
      success: true,
      message: "Cập nhật hồ sơ thành công.",
      data: users[existingIndex],
    };
  }

  // 10. MOCK: Thực tập sinh lấy chi tiết hợp đồng để ký (US 10)
  if (endpoint === "/intern/contract" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current =
      users.find((user) => user.email === currentUser.email) || currentUser;

    return {
      success: true,
      data: {
        contractCode: `HD-2026-${current.id || 101}`,
        internName: current.fullName,
        university:
          current.university || "ĐH Công nghệ Thông tin & Truyền thông - ĐHTN",
        position: current.position || "Thực tập sinh",
        startDate: "01/10/2026",
        endDate: "31/12/2026",
        allowance: "3.000.000 VNĐ / tháng",
        contractStatus: current.contractStatus || "ChoKy",
        contractSignedAt: current.contractSignedAt || null,
        pdfUrl:
          "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    };
  }

  // 11. MOCK: Thực tập sinh xác nhận ký hợp đồng (US 10)
  if (endpoint === "/intern/contract/confirm" && method === "POST") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current = users.find((user) => user.email === currentUser.email);

    if (!body.agreeTerms) {
      const error = new Error("Bạn phải đồng ý với điều khoản hợp đồng.");
      error.status = 400;
      throw error;
    }

    if (!current || current.status !== "DaDuyet") {
      const error = new Error(
        "Hồ sơ chưa được HR duyệt nên chưa thể ký hợp đồng.",
      );
      error.status = 403;
      throw error;
    }

    const signedTime = new Date().toISOString();

    const updatedUsers = users.map((u) => {
      if (u.email === currentUser.email) {
        return {
          ...u,
          contractStatus: "DaKy",
          contractSignedAt: signedTime,
        };
      }
      return u;
    });

    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));

    currentUser.contractStatus = "DaKy";
    currentUser.contractSignedAt = signedTime;
    localStorage.setItem("user_info", JSON.stringify(currentUser));

    return {
      success: true,
      message: "Ký xác nhận hợp đồng thực tập thành công!",
      data: {
        contractStatus: "DaKy",
        signedAt: signedTime,
      },
    };
  }

  // 12. MOCK: HR lấy danh sách Mentor khả dụng (US 12)
  if (endpoint.startsWith("/hr/mentors") && method === "GET") {
    const mentors = users
      .filter((u) => u.role === "Mentor")
      .map((mentor) => {
        const currentCount = users.filter(
          (u) => u.mentorId === mentor.id,
        ).length;
        return {
          id: mentor.id,
          fullName: mentor.fullName,
          email: mentor.email,
          department: mentor.department || "Phòng Công nghệ Phần mềm",
          position: mentor.position || "Senior Technical Lead",
          currentInterns: currentCount,
          maxInterns: mentor.maxInterns || 4,
        };
      });

    return { success: true, data: mentors };
  }

  // 13. MOCK: HR thực hiện phân công Mentor cho Thực tập sinh (US 12)
  if (endpoint === "/hr/assignments" && method === "POST") {
    const { internId, mentorId, programName, note } = body;
    const targetInternId = Number(internId);
    const targetMentorId = Number(mentorId);

    const mentor = users.find((u) => u.id === targetMentorId);
    if (!mentor) {
      const error = new Error("Không tìm thấy thông tin Mentor đã chọn.");
      error.status = 404;
      throw error;
    }

    const updatedUsers = users.map((u) => {
      if (u.id === targetInternId) {
        return {
          ...u,
          mentorId: targetMentorId,
          mentorName: mentor.fullName,
          mentorEmail: mentor.email,
          programName: programName || "Đợt thực tập Thu Đông 2026 (Khóa K23)",
          assignmentNote: note || "",
          assignedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    localStorage.setItem("mock_users", JSON.stringify(updatedUsers));

    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    if (currentUser.id === targetInternId) {
      currentUser.mentorId = targetMentorId;
      currentUser.mentorName = mentor.fullName;
      localStorage.setItem("user_info", JSON.stringify(currentUser));
    }

    return {
      success: true,
      message: `Đã phân công Mentor ${mentor.fullName} hướng dẫn thành công!`,
    };
  }

  // 14. MOCK: HR lấy danh sách các Đợt thực tập theo phòng ban (US 13)
  if (endpoint === "/hr/programs" && method === "GET") {
    const programs = getMockPrograms();
    const now = new Date();

    const data = programs.map((p) => {
      const enrolledCount = users.filter(
        (u) => u.programName === p.name,
      ).length;
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);

      let status = "SapDienRa";
      if (now >= start && now <= end) {
        status = "DangDienRa";
      } else if (now > end) {
        status = "DaKetThuc";
      }

      return {
        ...p,
        enrolledInterns: enrolledCount,
        status: status,
      };
    });

    return { success: true, data: data };
  }

  // 15. MOCK: HR tạo mới Đợt thực tập gắn với Phòng ban
  if (endpoint === "/hr/programs" && method === "POST") {
    const programs = getMockPrograms();

    if (!body.name || !body.startDate || !body.endDate || !body.departmentId) {
      const error = new Error(
        "Tên đợt, phòng ban, ngày bắt đầu và kết thúc là bắt buộc!",
      );
      error.status = 400;
      throw error;
    }

    if (new Date(body.endDate) <= new Date(body.startDate)) {
      const error = new Error("Ngày kết thúc phải diễn ra sau ngày bắt đầu!");
      error.status = 400;
      throw error;
    }

    const dept = DEFAULT_DEPARTMENTS.find((d) => d.id === body.departmentId);
    const deptCode = dept ? dept.code : "GEN";
    const deptName = dept ? dept.name : body.departmentName || "Phòng Kỹ thuật";

    const newProg = {
      id: Date.now(),
      programCode: `CT-${deptCode}-${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`,
      name: body.name,
      departmentId: body.departmentId,
      departmentName: deptName,
      startDate: body.startDate,
      endDate: body.endDate,
      targetInterns: Number(body.targetInterns) || 20,
      description: body.description || "",
    };

    programs.push(newProg);
    localStorage.setItem("mock_programs", JSON.stringify(programs));

    return {
      success: true,
      message: "Tạo mới chương trình thực tập theo phòng ban thành công!",
      data: newProg,
    };
  }

  // 16. MOCK: HR cập nhật chương trình thực tập
  if (endpoint.startsWith("/hr/programs/") && method === "PUT") {
    const id = Number(endpoint.split("/").pop());
    const programs = getMockPrograms();

    if (new Date(body.endDate) <= new Date(body.startDate)) {
      const error = new Error("Ngày kết thúc phải diễn ra sau ngày bắt đầu!");
      error.status = 400;
      throw error;
    }

    let found = false;
    const updatedPrograms = programs.map((p) => {
      if (p.id === id) {
        found = true;
        const dept = DEFAULT_DEPARTMENTS.find(
          (d) => d.id === body.departmentId,
        );
        return {
          ...p,
          name: body.name || p.name,
          departmentId: body.departmentId || p.departmentId,
          departmentName: dept
            ? dept.name
            : body.departmentName || p.departmentName,
          startDate: body.startDate || p.startDate,
          endDate: body.endDate || p.endDate,
          targetInterns:
            body.targetInterns !== undefined
              ? Number(body.targetInterns)
              : p.targetInterns,
          description:
            body.description !== undefined ? body.description : p.description,
        };
      }
      return p;
    });

    if (!found) {
      const error = new Error("Không tìm thấy đợt thực tập này!");
      error.status = 404;
      throw error;
    }

    localStorage.setItem("mock_programs", JSON.stringify(updatedPrograms));
    return {
      success: true,
      message: "Cập nhật chương trình thực tập thành công!",
    };
  }

  // 17. MOCK: Lấy danh sách phòng ban kèm tải trọng Mentor
  if (endpoint === "/hr/departments" && method === "GET") {
    const data = DEFAULT_DEPARTMENTS.map((dept) => {
      const mentorsInDept = users.filter(
        (u) => u.role === "Mentor" && u.department === dept.name,
      );
      const totalCapacity = mentorsInDept.reduce(
        (sum, m) => sum + (m.maxInterns || 4),
        0,
      );
      const currentAssigned = users.filter(
        (u) => u.mentorId && mentorsInDept.some((m) => m.id === u.mentorId),
      ).length;

      return {
        ...dept,
        mentorCount: mentorsInDept.length,
        availableCapacity: Math.max(0, totalCapacity - currentAssigned),
        totalCapacity: totalCapacity,
      };
    });
    return { success: true, data };
  }

  // Ném lỗi nếu không có endpoint nào khớp
  throw new Error(
    `[Mock Error] Endpoint "${endpoint}" với method "${method}" chưa được cấu hình.`,
  );
}

async function request(endpoint, options = {}) {
  if (API_CONFIG.MOCK) {
    return mockRequest(endpoint, options);
  }

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const token = localStorage.getItem("access_token");

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
      // Tự động điều hướng về Login khi Token hết hạn (401), ngoại trừ chính trang login
      if (response.status === 401 && !endpoint.includes("/auth/login")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_info");
        alert("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!");
        if (window.location.pathname.includes("/pages/")) {
          window.location.href = "../auth/login.html";
        } else {
          window.location.href = "pages/auth/login.html";
        }
        return;
      }

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
      error.message = "Máy chủ phản hồi quá thời gian quy định (Timeout).";
    } else if (!error.status) {
      error.message =
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc máy chủ Backend!";
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: "GET" }),

  post: (endpoint, body, options = {}) => {
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
