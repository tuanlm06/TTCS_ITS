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
    status: "DaDuyet", // 'ChuaNop', 'ChoDuyet', 'DaDuyet', 'TuChoi'
    hasCv: true,
    cvFileName: "CV_LacManhTuan.pdf",
    cvUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    rejectReason: "",
    contractStatus: "DaKy", // 'ChoKy', 'DaKy'
    contractSignedAt: null,
    mentorId: 4,
    mentorName: "ThS. Hoàng Anh Tuấn",
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

  // 4.1 MOCK: Tổng quan bảng điều khiển Thực tập sinh
  if (endpoint === "/intern/overview" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current =
      users.find((user) => user.email === currentUser.email) || currentUser;
    const mentor = users.find(
      (user) =>
        user.id === current.mentorId || user.fullName === current.mentorName,
    );

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

  // 5. MOCK: HR lấy danh sách hồ sơ thực tập sinh
  // 5. MOCK: HR lấy danh sách hồ sơ thực tập sinh (ĐÃ SỬA LỖI)
  if (endpoint === "/hr/candidates" && method === "GET") {
    return {
      success: true,
      data: users
        // BỎ điều kiện && user.hasCv để hiển thị cả sinh viên mới được HR cấp tài khoản
        .filter((user) => user.role === "ThucTapSinh" || user.role === "Intern")
        .map((user) => ({
          id: user.id,
          profileCode: `HS-${user.id}`,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || "Chưa cập nhật",
          university: user.university || "Chưa cập nhật",
          major: user.major || "Chưa cập nhật",
          position: user.position || "Thực tập sinh",
          cvUrl: user.cvUrl || "",
          cvFileName: user.cvFileName || (user.hasCv ? "CV_ThucTap.pdf" : "Chưa nộp CV"),
          hasCv: Boolean(user.hasCv),
          status: user.status || "ChuaNop",
          rejectReason: user.rejectReason || "",
          contractStatus: user.contractStatus || "ChoKy",
          mentorId: user.mentorId || null,
          mentorName: user.mentorName || "Chưa phân công",
          programName: user.programName || "",
        })),
    };
  }

  // 6. MOCK: HR phê duyệt hồ sơ
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

  // 7. MOCK: HR từ chối hồ sơ
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

  // 8. MOCK: HR tạo tài khoản hộ
  if (endpoint === "/hr/interns" && method === "POST") {
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
      password: "Password@123",
      role: "ThucTapSinh",
      university: body.university,
      major: body.major || "Chưa cập nhật",
      position: body.position || "Thực tập sinh",
      status: "ChuaNop",
      hasCv: false,
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
      message: "Cấp tài khoản cho sinh viên thành công!",
      data: newIntern,
    };
  }

  // 9. MOCK: HR cập nhật thông tin thực tập sinh
  if (endpoint.startsWith("/hr/interns/") && method === "PUT") {
    const id = Number(endpoint.split("/").pop());
    const existingIndex = users.findIndex((u) => u.id === id);

    if (existingIndex === -1) {
      const error = new Error("Không tìm thấy thực tập sinh này.");
      error.status = 404;
      throw error;
    }

    users[existingIndex] = {
      ...users[existingIndex],
      fullName: body.fullName || users[existingIndex].fullName,
      phone: body.phone !== undefined ? body.phone : users[existingIndex].phone,
      university: body.university !== undefined ? body.university : users[existingIndex].university,
      major: body.major !== undefined ? body.major : users[existingIndex].major,
      position: body.position !== undefined ? body.position : users[existingIndex].position,
    };

    localStorage.setItem("mock_users", JSON.stringify(users));
    return {
      success: true,
      message: "Cập nhật hồ sơ thành công.",
      data: users[existingIndex],
    };
  }

  // 10. MOCK: Thực tập sinh lấy chi tiết hợp đồng
  if (endpoint === "/intern/contract" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current = users.find((user) => user.email === currentUser.email) || currentUser;

    return {
      success: true,
      data: {
        contractCode: `HD-2026-${current.id || 101}`,
        internName: current.fullName,
        university: current.university || "ĐH Công nghệ Thông tin & Truyền thông - ĐHTN",
        position: current.position || "Thực tập sinh",
        startDate: "01/10/2026",
        endDate: "31/12/2026",
        allowance: "3.000.000 VNĐ / tháng",
        contractStatus: current.contractStatus || "ChoKy",
        contractSignedAt: current.contractSignedAt || null,
        pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    };
  }

  // 11. MOCK: Thực tập sinh xác nhận ký hợp đồng
  if (endpoint === "/intern/contract/confirm" && method === "POST") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");

    if (!body.agreeTerms) {
      const error = new Error("Bạn phải đồng ý với điều khoản hợp đồng.");
      error.status = 400;
      throw error;
    }

    const signedTime = new Date().toISOString();
    const updatedUsers = users.map((u) => {
      if (u.email === currentUser.email) {
        return { ...u, contractStatus: "DaKy", contractSignedAt: signedTime };
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
      data: { contractStatus: "DaKy", signedAt: signedTime },
    };
  }

  // 12. MOCK: HR lấy danh sách Mentor
  if (endpoint.startsWith("/hr/mentors") && method === "GET") {
    const mentors = users
      .filter((u) => u.role === "Mentor")
      .map((mentor) => {
        const currentCount = users.filter((u) => u.mentorId === mentor.id).length;
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

  // 13. MOCK: HR phân công Mentor
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
    return {
      success: true,
      message: `Đã phân công Mentor ${mentor.fullName} hướng dẫn thành công!`,
    };
  }

  // 14. MOCK: HR lấy danh sách đợt thực tập
  if (endpoint === "/hr/programs" && method === "GET") {
    const programs = getMockPrograms();
    const now = new Date();

    const data = programs.map((p) => {
      const enrolledCount = users.filter((u) => u.programName === p.name).length;
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);

      let status = "SapDienRa";
      if (now >= start && now <= end) {
        status = "DangDienRa";
      } else if (now > end) {
        status = "DaKetThuc";
      }

      return { ...p, enrolledInterns: enrolledCount, status: status };
    });

    return { success: true, data: data };
  }

  // 15. MOCK: HR tạo đợt thực tập mới
  if (endpoint === "/hr/programs" && method === "POST") {
    const programs = getMockPrograms();

    if (!body.name || !body.startDate || !body.endDate || !body.departmentId) {
      const error = new Error("Tên đợt, phòng ban, ngày bắt đầu và kết thúc là bắt buộc!");
      error.status = 400;
      throw error;
    }

    const dept = DEFAULT_DEPARTMENTS.find((d) => d.id === body.departmentId);
    const newProg = {
      id: Date.now(),
      programCode: `CT-${dept ? dept.code : "GEN"}-2026-Q4`,
      name: body.name,
      departmentId: body.departmentId,
      departmentName: dept ? dept.name : "Phòng Kỹ thuật",
      startDate: body.startDate,
      endDate: body.endDate,
      targetInterns: Number(body.targetInterns) || 20,
      description: body.description || "",
    };

    programs.push(newProg);
    localStorage.setItem("mock_programs", JSON.stringify(programs));

    return { success: true, message: "Tạo đợt thực tập thành công!", data: newProg };
  }

  // 16. MOCK: HR cập nhật đợt thực tập
  if (endpoint.startsWith("/hr/programs/") && method === "PUT") {
    const id = Number(endpoint.split("/").pop());
    const programs = getMockPrograms();

    const updatedPrograms = programs.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: body.name || p.name,
          startDate: body.startDate || p.startDate,
          endDate: body.endDate || p.endDate,
          targetInterns: body.targetInterns !== undefined ? Number(body.targetInterns) : p.targetInterns,
          description: body.description !== undefined ? body.description : p.description,
        };
      }
      return p;
    });

    localStorage.setItem("mock_programs", JSON.stringify(updatedPrograms));
    return { success: true, message: "Cập nhật đợt thực tập thành công!" };
  }

  // 17. MOCK: Lấy danh sách phòng ban
  if (endpoint === "/hr/departments" && method === "GET") {
    const data = DEFAULT_DEPARTMENTS.map((dept) => {
      const mentorsInDept = users.filter((u) => u.role === "Mentor" && u.department === dept.name);
      const totalCapacity = mentorsInDept.reduce((sum, m) => sum + (m.maxInterns || 4), 0);
      const currentAssigned = users.filter((u) => u.mentorId && mentorsInDept.some((m) => m.id === u.mentorId)).length;

      return {
        ...dept,
        mentorCount: mentorsInDept.length,
        availableCapacity: Math.max(0, totalCapacity - currentAssigned),
        totalCapacity: totalCapacity,
      };
    });
    return { success: true, data };
  }

  // 18. MOCK: Lịch thực tập cá nhân
  if (endpoint === "/intern/schedule" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const current = users.find((u) => u.email === currentUser.email) || currentUser;

    const programs = getMockPrograms();
    const program = programs.find((p) => p.name === current.programName) || programs[0];

    return {
      success: true,
      data: {
        programInfo: {
          programCode: program.programCode || "CT-IT-2026-Q4",
          programName: program.name,
          departmentName: program.departmentName || "Phòng Công nghệ Phần mềm",
          mentorName: current.mentorName || "ThS. Hoàng Anh Tuấn",
          startDate: program.startDate || "2026-10-01",
          endDate: program.endDate || "2026-12-31",
          workingShift: "Sáng: 08:00 - 12:00 | Chiều: 13:30 - 17:30 (Thứ 2 - Thứ 6)",
          location: "Tầng 4 - Văn phòng Doanh nghiệp",
        },
        milestones: [
          { id: 1, title: "Nhận đợt thực tập & Gặp gỡ Mentor", date: program.startDate || "2026-10-01", status: "completed" },
          { id: 2, title: "Báo cáo tiến độ giữa kỳ", date: "2026-11-15", status: "upcoming" },
          { id: 3, title: "Nộp Báo cáo tổng kết & Đánh giá kết quả", date: program.endDate || "2026-12-31", status: "upcoming" },
        ],
      },
    };
  }

  // 19. MOCK: Mentor lấy danh sách sinh viên phụ trách (Có lọc chuẩn)
  if (endpoint === "/mentor/interns" && method === "GET") {
    const currentUser = JSON.parse(localStorage.getItem("user_info") || "{}");
    const mentor = users.find((u) => u.email === currentUser.email);

    let myInterns = users.filter((u) => u.role === "ThucTapSinh" || u.role === "Intern");
    if (mentor) {
      myInterns = myInterns.filter((u) => u.mentorId === mentor.id || u.mentorName === mentor.fullName);
    }

    if (myInterns.length === 0) {
      myInterns = [
        { id: 1, fullName: "Lạc Mạnh Tuấn", email: "tuan.lac@example.edu.vn", programName: "Đợt thực tập Thu Đông 2026 (Khóa K23)" },
      ];
    }

    return { success: true, data: myInterns };
  }

  // 22. MOCK: Lấy danh sách nhiệm vụ
  if (endpoint === "/intern/tasks" && method === "GET") {
    let tasks = JSON.parse(localStorage.getItem("mock_intern_tasks") || "null");

    if (!tasks) {
      tasks = [
        {
          id: 1,
          internId: 1,
          title: "Tìm hiểu quy trình và nghiệp vụ thực tập doanh nghiệp",
          description: "Đọc tài liệu onboard, tìm hiểu quy trình làm việc của phòng ban và vẽ sơ đồ nghiệp vụ.",
          deadline: "2026-10-05",
          priority: "high",
          status: "in_progress",
          progressPercent: 50,
          note: "Đã hoàn thành tìm hiểu quy trình, đang hoàn thiện sơ đồ.",
          proofUrl: "https://github.com/example/docs",
        },
        {
          id: 2,
          internId: 1,
          title: "Kiểm thử tích hợp luồng nộp hồ sơ & báo cáo công việc",
          description: "Thực hiện test case cho luồng nộp CV, ký hợp đồng và báo cáo công việc hàng tuần.",
          deadline: "2026-10-10",
          priority: "medium",
          status: "todo",
          progressPercent: 0,
          note: "",
          proofUrl: "",
        },
      ];
      localStorage.setItem("mock_intern_tasks", JSON.stringify(tasks));
    }

    return { success: true, data: tasks };
  }

  // 23. MOCK: Cập nhật tiến độ nhiệm vụ
  if (endpoint.startsWith("/intern/tasks/") && endpoint.endsWith("/progress") && method === "PUT") {
    const taskId = Number(endpoint.split("/")[3]);
    const tasks = JSON.parse(localStorage.getItem("mock_intern_tasks") || "[]");

    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      const error = new Error("Không tìm thấy nhiệm vụ này.");
      error.status = 404;
      throw error;
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      status: body.status || tasks[taskIndex].status,
      progressPercent: Number(body.progressPercent) || 0,
      note: body.note !== undefined ? body.note : tasks[taskIndex].note,
      proofUrl: body.proofUrl !== undefined ? body.proofUrl : tasks[taskIndex].proofUrl,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("mock_intern_tasks", JSON.stringify(tasks));
    return { success: true, message: "Cập nhật tiến độ nhiệm vụ thành công!", data: tasks[taskIndex] };
  }

  // 24. MOCK: Mentor Giao nhiệm vụ mới
  if (endpoint === "/mentor/tasks" && method === "POST") {
    const tasks = JSON.parse(localStorage.getItem("mock_intern_tasks") || "[]");

    const newTask = {
      id: Date.now(),
      internId: Number(body.internId) || 1,
      title: body.title,
      description: body.description || "",
      deadline: body.deadline,
      priority: body.priority || "medium",
      status: "todo",
      progressPercent: 0,
      note: "",
      proofUrl: "",
      createdAt: new Date().toISOString(),
    };

    tasks.unshift(newTask);
    localStorage.setItem("mock_intern_tasks", JSON.stringify(tasks));

    return { success: true, message: "Giao nhiệm vụ cho thực tập sinh thành công!", data: newTask };
  }

  // 25. MOCK: Mentor lấy danh sách Báo cáo tuần
  if (endpoint === "/mentor/reports" && method === "GET") {
    const reports = JSON.parse(localStorage.getItem("mock_weekly_reports") || "[]");

    if (reports.length === 0) {
      const defaultReports = [
        {
          id: 501,
          weekNumber: 4,
          title: "Báo cáo thực tập Tuần 4 - Xây dựng Module UI & Rest API",
          achievements: "Đã thiết kế xong giao diện Dashboard, tích hợp xong các Mock API.",
          difficulties: "Gặp một số vấn đề về đường dẫn tương đối khi Import ES Modules.",
          nextWeekPlan: "Nghiên cứu thêm về bảo mật Route Guard.",
          attachmentUrl: "https://drive.google.com/file/d/example/view",
          status: "submitted",
          isLate: false,
          submittedAt: "2026-09-30T09:00:00Z",
          score: null,
          mentorFeedback: "",
          fullName: "Lạc Mạnh Tuấn",
          email: "tuan.lac@example.edu.vn",
        },
      ];
      localStorage.setItem("mock_weekly_reports", JSON.stringify(defaultReports));
      return { success: true, data: defaultReports };
    }

    return { success: true, data: reports };
  }

  // 26. MOCK: Mentor gửi Đánh giá & Chấm điểm Báo cáo tuần
  if (endpoint.startsWith("/mentor/reports/") && endpoint.endsWith("/review") && method === "POST") {
    const reportId = Number(endpoint.split("/")[3]);
    const reports = JSON.parse(localStorage.getItem("mock_weekly_reports") || "[]");

    const index = reports.findIndex((r) => r.id === reportId || r.weekNumber === reportId);
    if (index === -1) {
      const error = new Error("Không tìm thấy báo cáo này trên hệ thống!");
      error.status = 404;
      throw error;
    }

    reports[index] = {
      ...reports[index],
      score: Number(body.score),
      mentorFeedback: body.mentorFeedback || "",
      status: "reviewed",
      reviewedAt: new Date().toISOString(),
    };

    localStorage.setItem("mock_weekly_reports", JSON.stringify(reports));
    return { success: true, message: "Đã gửi đánh giá và chấm điểm báo cáo tuần thành công!", data: reports[index] };
  }

  // 27. MOCK: Mentor lấy danh sách Đánh giá Final
  if (endpoint === "/mentor/evaluations/final" && method === "GET") {
    const evaluations = JSON.parse(localStorage.getItem("mock_final_evaluations") || "[]");
    const interns = users.filter((u) => u.role === "ThucTapSinh" || u.role === "Intern");

    const data = interns.map((intern) => {
      const evalData = evaluations.find((e) => e.internId === intern.id) || null;
      return {
        internId: intern.id,
        fullName: intern.fullName || "Lạc Mạnh Tuấn",
        email: intern.email || "tuan.lac@example.edu.vn",
        programName: intern.programName || "Đợt thực tập Thu Đông 2026",
        isEvaluated: Boolean(evalData),
        evaluation: evalData,
      };
    });

    return { success: true, data };
  }

  // 28. MOCK: Mentor gửi Đánh giá Final
  if (endpoint === "/mentor/evaluations/final" && method === "POST") {
    const evaluations = JSON.parse(localStorage.getItem("mock_final_evaluations") || "[]");

    const techScore = Number(body.technicalScore) || 0;
    const attScore = Number(body.attitudeScore) || 0;
    const learnScore = Number(body.learningScore) || 0;
    const finalScore = Number((techScore * 0.5 + attScore * 0.3 + learnScore * 0.2).toFixed(2));

    const newEval = {
      id: Date.now(),
      internId: Number(body.internId),
      technicalScore: techScore,
      attitudeScore: attScore,
      learningScore: learnScore,
      finalScore: finalScore,
      strengths: body.strengths || "",
      improvements: body.improvements || "",
      overallComment: body.overallComment || "",
      recommendHire: Boolean(body.recommendHire),
      createdAt: new Date().toISOString(),
    };

    const index = evaluations.findIndex((e) => e.internId === newEval.internId);
    if (index !== -1) {
      evaluations[index] = newEval;
    } else {
      evaluations.push(newEval);
    }
    localStorage.setItem("mock_final_evaluations", JSON.stringify(evaluations));

    return { success: true, message: "Đã gửi đánh giá tổng kết thực tập thành công!", data: newEval };
  }

  // 29. MOCK: HR lấy Báo cáo Tổng kết Cuối kỳ
  if (endpoint.startsWith("/hr/reports/final-summary") && method === "GET") {
    const evaluations = JSON.parse(localStorage.getItem("mock_final_evaluations") || "[]");
    const reports = JSON.parse(localStorage.getItem("mock_weekly_reports") || "[]");
    const interns = users.filter((u) => u.role === "ThucTapSinh" || u.role === "Intern");

    let completedCount = 0;
    let excellentCount = 0;
    let goodCount = 0;
    let averageCount = 0;
    let totalScoreSum = 0;
    let evaluatedCount = 0;

    const internSummaries = interns.map((intern) => {
      const evalData = evaluations.find((e) => e.internId === intern.id) || null;
      const internReports = reports.filter((r) => r.email === intern.email);

      const isEvaluated = Boolean(evalData || intern.isEvaluated);
      const finalScore = evalData ? evalData.finalScore : (intern.finalScore || null);

      let grade = "Chưa xếp loại";
      if (finalScore !== null) {
        evaluatedCount++;
        totalScoreSum += finalScore;
        if (finalScore >= 9.0) {
          grade = "Xuất sắc";
          excellentCount++;
        } else if (finalScore >= 8.0) {
          grade = "Giỏi";
          goodCount++;
        } else if (finalScore >= 6.5) {
          grade = "Khá";
          averageCount++;
        } else {
          grade = "Trung bình";
        }
      }

      if (intern.status === "DaDuyet" && intern.contractStatus === "DaKy") {
        completedCount++;
      }

      return {
        internId: intern.id,
        fullName: intern.fullName || "Thực tập sinh",
        email: intern.email,
        university: intern.university || "Đại học Công nghệ Thông tin & Truyền thông",
        mentorName: intern.mentorName || "ThS. Hoàng Anh Tuấn",
        submittedReportsCount: internReports.length,
        finalScore: finalScore !== null ? finalScore : "---",
        grade: grade,
        recommendHire: evalData ? evalData.recommendHire : false,
        isEvaluated: isEvaluated,
      };
    });

    const avgGpa = evaluatedCount > 0 ? Number((totalScoreSum / evaluatedCount).toFixed(2)) : 0;

    return {
      success: true,
      data: {
        programInfo: {
          programName: "Đợt thực tập Thu Đông 2026 (Khóa K23)",
          departmentName: "Phòng Công nghệ Phần mềm",
          startDate: "2026-10-01",
          endDate: "2026-12-31",
          totalInterns: interns.length,
        },
        kpiSummary: {
          totalInterns: interns.length,
          completedRate: interns.length > 0 ? `${Math.round((completedCount / interns.length) * 100)}%` : "0%",
          averageGpa: avgGpa,
          excellentCount: excellentCount,
          goodCount: goodCount,
          averageCount: averageCount,
          recommendedHireCount: internSummaries.filter((i) => i.recommendHire).length,
        },
        internSummaries: internSummaries,
      },
    };
  }

  // Ném lỗi nếu không khớp endpoint nào
  throw new Error(`[Mock Error] Endpoint "${endpoint}" với method "${method}" chưa được cấu hình.`);
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

      const error = new Error((data && data.message) || "Có lỗi xảy ra trên hệ thống");
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
      error.message = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc máy chủ Backend!";
    }
    throw error;
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),

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

  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};