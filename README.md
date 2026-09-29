Dưới đây là bản mô tả chi tiết toàn bộ các luồng hoạt động (Workflows) của từng chức năng bạn đã xây dựng trong hệ thống, được giải thích mạch lạc theo chuỗi sự kiện từ giao diện người dùng (Frontend UI), xử lý logic (JavaScript) đến cơ sở dữ liệu (Database):

---

### Tổng quan vòng đời của một Thực tập sinh (End-to-End Flow)

Hệ thống được thiết kế theo đúng quy chuẩn nghiệp vụ thực tế qua 4 giai đoạn nối tiếp:

```
[1. Đăng ký tài khoản] ──► [2. Đăng nhập hệ thống] ──► [3. Nộp hồ sơ & CV] ──► [4. Theo dõi xét duyệt] ──► [5. Dashboard làm việc]
     (register.html)            (login.html)             (submit-cv.html)        (pending-approval.html)    (intern-dashboard.html)

```

---

### 1. Luồng chức năng: Đăng ký tài khoản Thực tập sinh (`register.html`)

Chức năng này giúp sinh viên tạo định danh trên hệ thống và khai báo thông tin ban đầu.

- **Bước 1: Người dùng thao tác**
- Thực tập sinh điền các thông tin: Họ và tên, Email, Mật khẩu, Nhập lại mật khẩu, Trường học và Chuyên ngành.
- Bấm nút **"Đăng ký"**.

- **Bước 2: Client-side Validation (Kiểm tra dữ liệu tại trình duyệt)**
- JavaScript chặn hành vi tải lại trang mặc định (`e.preventDefault()`).
- Kiểm tra các điều kiện:
- Họ tên không được để trống (tối thiểu 2 ký tự).
- Email đúng định dạng regex chuẩn (`ten@domain.com`).
- Mật khẩu tối thiểu 8 ký tự.
- Mật khẩu nhập lại phải khớp 100% với mật khẩu ban đầu.
- Trường học không được bỏ trống.

- _Nếu sai:_ Viền ô input chuyển sang màu đỏ (`.is-invalid`) và xuất hiện thông báo lỗi chi tiết bên dưới. Không gửi yêu cầu lên server.

- **Bước 3: Gọi API & Chờ phản hồi**
- Nút đăng ký bị vô hiệu hóa (`disabled`), xuất hiện spinner quay tròn và đổi chữ thành _"Đang xử lý..."_ (ngăn việc bấm liên tục gây trùng request).
- Gửi `POST /api/v1/auth/register` kèm body JSON sang backend.

- **Bước 4: Xử lý kết quả**
- **Thành công (201 Created):**
- Bản ghi được tạo trong bảng `NGUOI_DUNG` với vai trò `ThucTapSinh` và tạo trước hồ sơ trong `HO_SO_THUC_TAP`.

- Giao diện hiện bảng thông báo xanh (Alert success): _"Đăng ký tài khoản thành công! Đang chuyển hướng..."_.
- Sau 1.5 giây, tự động chuyển người dùng sang trang `login.html`.

- **Thất bại (400 / 409 Conflict):**
- Mở lại nút bấm để cho phép thử lại.
- Nếu email đã có người đăng ký, hệ thống báo lỗi đỏ lên khung `#globalAlert` hoặc gán lỗi trực tiếp vào ô Email.

---

### 2. Luồng chức năng: Đăng nhập & Điều hướng phân cấp (`login.html`)

Chức năng xác thực danh tính và quyết định người dùng sẽ được đưa đến màn hình nào tùy theo tình trạng hồ sơ.

- **Bước 1: Kiểm tra phiên làm việc tự động (Route Guard)**
- Ngay khi mở trang `login.html`, hàm `DOMContentLoaded` kiểm tra xem trong `localStorage` đã có `access_token` hợp lệ chưa.
- _Nếu đã có token:_ Bỏ qua form đăng nhập, tự động điều hướng thẳng vào trang nội bộ.

- **Bước 2: Người dùng đăng nhập**
- Nhập Email và Mật khẩu, bấm nút **"Đăng nhập"**.
- JS kiểm tra xem 2 trường có bị để trống không trước khi gọi API.

- **Bước 3: Gọi API xác thực (`POST /api/v1/auth/login`)**
- Bật trạng thái xoay loading trên nút đăng nhập.
- Gửi thông tin đăng nhập lên server để đối chiếu mật khẩu (đã băm mã hóa).

- **Bước 4: Nhận Token và Điều hướng theo trạng thái thực tế**
- _Nếu sai tài khoản/mật khẩu:_ Hiện lỗi đỏ _"Email hoặc mật khẩu không chính xác"_.
- _Nếu đúng (200 OK):_
- Lưu mã `access_token` và đối tượng `user_info` vào `localStorage`.
- Hệ thống kiểm tra trường trạng thái (`trangThaiHoSo` hoặc `hasCv`):

1. **Chưa có CV / Lần đầu đăng nhập:** Chuyển sang `pages/intern/submit-cv.html`.
2. **Đã nộp CV nhưng đang chờ HR duyệt:** Chuyển sang `pages/intern/pending-approval.html`.
3. **Đã được HR duyệt và xếp lịch:** Chuyển vào `pages/dashboard/intern-dashboard.html`.

---

### 3. Luồng chức năng: Nộp hồ sơ & Upload CV Online (`submit-cv.html`)

Chức năng giúp sinh viên hoàn thiện hồ sơ ứng tuyển bằng cách đính kèm tệp CV và chọn vị trí mong muốn.

- **Bước 1: Chọn và kiểm tra tệp (File Validation)**
- Người dùng có thể nhấn để duyệt file từ máy tính hoặc **kéo thả file** trực tiếp vào vùng hộp nét đứt (`#dropZone`).
- Khi file được chọn, JS kiểm tra ngay:
- **Định dạng:** Chỉ chấp nhận đuôi `.pdf`, `.doc`, `.docx`.
- **Kích thước:** Dung lượng file không được vượt quá 5MB.

- Nếu hợp lệ, ẩn vùng kéo thả và hiện thẻ thông tin file gồm tên file, dung lượng kèm nút **"✕ Gỡ bỏ"** nếu muốn chọn lại file khác.

- **Bước 2: Gửi dữ liệu qua FormData**
- Người dùng chọn Vị trí ứng tuyển (Frontend, Backend, Tester,...) và viết vài dòng giới thiệu ngắn.
- Khi bấm **"Nộp hồ sơ ngay"**, JS dùng đối tượng `FormData` đóng gói cả dữ liệu text lẫn file nhị phân.
- Gửi qua `POST /api/v1/intern/submit-cv` kèm header `Authorization: Bearer <token>`.

- **Bước 3: Lưu trữ Database**
- Server lưu file vào thư mục lưu trữ (hoặc Cloud) và ghi đường dẫn vào bảng `TAI_LIEU`.

- Cập nhật trạng thái trong bảng `HO_SO_THUC_TAP` thành `ChoDuyet`.

- **Bước 4: Chuyển hướng**
- Hiện thông báo nộp thành công và tự động chuyển sang trang `pending-approval.html` sau 1.5 giây.

---

### 4. Luồng chức năng: Theo dõi trạng thái xét duyệt (`pending-approval.html`)

Màn hình đóng vai trò thông báo kết quả xét duyệt từ HR, tự động biến đổi giao diện theo 3 trạng thái của CSDL.

Khi trang được nạp, JS đọc token và gọi API lấy trạng thái hồ sơ mới nhất từ server:

1. **Trạng thái 1: Đang chờ duyệt (`ChoDuyet`) (Mặc định)**

- Biểu tượng đồng hồ cát màu vàng (⏳) cùng huy hiệu _"Chờ duyệt"_.
- Hiển thị tóm tắt: Mã hồ sơ, tên trường, chuyên ngành và tên file CV đã tải lên.
- Lời nhắc: _"Hồ sơ đang được HR xét duyệt trong 1 - 3 ngày làm việc"_.
- Cho phép nút: **"✏️ Cập nhật lại hồ sơ"** (để sửa thông tin nếu phát hiện nộp nhầm) và nút **"Đăng xuất"**.

2. **Trạng thái 2: Được chấp nhận vào thực tập (`DaDuyet`)**

- Toàn bộ hộp trạng thái chuyển sang màu xanh lá chúc mừng (🎉).
- Ẩn nút nộp lại hồ sơ.
- Kích hoạt nút bấm màu xanh: **"🚀 Vào Dashboard làm việc"**. Khi bấm nút này, sinh viên chính thức được truy cập vào giao diện quản lý thực tập.

3. **Trạng thái 3: Bị từ chối hồ sơ (`TuChoi`)**

- Hộp chuyển sang màu đỏ cảnh báo (❌).
- Hiển thị rõ ràng lý do từ chối từ HR (Ví dụ: _"Thiếu chứng chỉ tiếng Anh"_, _"CV chưa đính kèm bảng điểm"_).
- Nút hành động đổi thành: **"🔄 Bổ sung & Nộp lại CV"** để dẫn người dùng quay lại form nộp lại file mới.

---

### 5. Luồng chức năng: Bảng điều khiển Thực tập sinh (`intern-dashboard.html`)

Dành riêng cho thực tập sinh đã chính thức được tiếp nhận, phân công mentor và chương trình thực tập.

- **Bảo vệ quyền truy cập (Route Guard):** Nếu chưa có token đăng nhập hoặc tài khoản chưa được duyệt, lập tức bị đá ngược về trang đăng nhập.
- **Khối KPI tổng quan:**
- Lấy dữ liệu từ bảng `PHAN_CONG`, `CHUONG_TRINH_THUC_TAP`, `PHONG_BAN` để hiển thị: Phòng ban thực tập, Họ tên & Email của Mentor hướng dẫn.

- **Luồng Điểm danh nhanh (Check-in / Check-out):**
- Kiểm tra trạng thái hôm nay trong bảng `CHAM_CONG`.

- Nếu chưa điểm danh: Nút **"Check-in ngay"** có màu xanh. Khi bấm, gửi thời gian hiện tại lên server, đổi trạng thái sang _"Đã check-in"_ và vô hiệu hóa nút bấm để chống bấm lặp trong ngày.

- **Danh sách Nhiệm vụ (`NHIEM_VU`):**
- Đọc các đầu việc do Mentor giao từ database, hiển thị tiêu đề, thời hạn hoàn thành (Deadline) và nhãn trạng thái (Chưa làm / Đang làm / Hoàn thành).

- **Báo cáo tuần (`BAO_CAO_TUAN`):**
- Nhắc nhở hạn chót nộp báo cáo định kỳ vào mỗi cuối tuần và cung cấp nút mở form nộp báo cáo tiến độ.

- **Đăng xuất (Logout):**
- Khi bấm **"Đăng xuất"**, hộp thoại xác nhận hiện lên. Nếu đồng ý, toàn bộ `access_token` và dữ liệu người dùng trong `localStorage` sẽ bị xóa sạch, điều hướng trình duyệt quay về trang `login.html`.
