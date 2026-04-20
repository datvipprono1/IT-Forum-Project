export const studentProfile = {
  name: "Trần Minh Khang",
  roleLabel: "Sinh viên Khoa Công nghệ",
  faculty: "Công nghệ thông tin",
  className: "DHKTPM18A",
  avatar: "TK",
  bio: "Quan tâm đến lập trình, AI ứng dụng và các hoạt động học thuật trong khoa.",
  points: 1280,
  savedPosts: 16,
  publishedPosts: 9,
  reactions: 248,
};

export const adminProfile = {
  name: "Lê Hà An",
  roleLabel: "Admin học vụ",
  faculty: "Phòng Công tác sinh viên",
  avatar: "LA",
};

export const homeMetrics = [
  { label: "Bài viết mới hôm nay", value: "24", note: "8 bài đang chờ duyệt" },
  { label: "Báo cáo đã xử lý", value: "12", note: "Trong 24 giờ gần nhất" },
  { label: "Chủ đề đang theo dõi", value: "06", note: "AI, Web, Học tập, Thực tập" },
];

export const categories = [
  "Thông báo khoa",
  "Lập trình web",
  "Đồ án môn học",
  "Kinh nghiệm thực tập",
  "AI ứng dụng",
  "Hỏi đáp kỹ thuật",
];

export const homeAnnouncement = {
  title: "Thông báo từ khoa",
  content:
    "Đề nghị sinh viên sử dụng diễn đàn để trao đổi học tập, chia sẻ tài liệu và báo cáo nội dung vi phạm theo đúng quy định cộng đồng.",
};

export const feedPosts = [
  {
    id: 1,
    title: "Tổng hợp kinh nghiệm làm đồ án môn Lập trình Web trong 3 tuần cuối",
    excerpt:
      "Mình tổng hợp lại cách phân chia task frontend, backend và database để nhóm chạy nhanh mà vẫn không bị vỡ workflow khi ghép code.",
    author: "Phạm Gia Hân",
    role: "Sinh viên CNTT",
    faculty: "Khoa Công nghệ",
    category: "Lập trình web",
    createdAt: "2026-04-19T08:20:00+07:00",
    likes: 42,
    comments: 18,
    saves: 11,
    status: "published",
    imageLabel: "Workflow dự án",
  },
  {
    id: 2,
    title: "Checklist xin thực tập kỳ hè cho sinh viên năm 3",
    excerpt:
      "Bài viết này chia sẻ danh sách giấy tờ cần chuẩn bị, cách viết CV ngắn gọn và một vài lỗi thường gặp khi nộp hồ sơ vào công ty.",
    author: "Nguyễn Minh Thu",
    role: "Sinh viên HTTT",
    faculty: "Khoa Công nghệ",
    category: "Kinh nghiệm thực tập",
    createdAt: "2026-04-18T20:10:00+07:00",
    likes: 31,
    comments: 9,
    saves: 27,
    status: "published",
    imageLabel: "Thực tập doanh nghiệp",
  },
  {
    id: 3,
    title: "Hỏi đáp nhanh về cách tổ chức state trong dự án React có phân quyền",
    excerpt:
      "Nên tách state theo auth, feed và admin hay gom chung? Mình viết lại một cấu trúc để team dễ ghép code hơn.",
    author: "Võ Bảo Anh",
    role: "Sinh viên KTPM",
    faculty: "Công nghệ thông tin",
    category: "Hỏi đáp kỹ thuật",
    createdAt: "2026-04-18T15:00:00+07:00",
    likes: 26,
    comments: 14,
    saves: 8,
    status: "published",
    imageLabel: "Cấu trúc React",
  },
];

export const postDetail = {
  id: 1,
  title: "Tổng hợp kinh nghiệm làm đồ án môn Lập trình Web trong 3 tuần cuối",
  author: "Phạm Gia Hân",
  role: "Sinh viên CNTT",
  className: "DHKTPM18B",
  category: "Lập trình web",
  createdAt: "2026-04-19T08:20:00+07:00",
  likes: 42,
  comments: 18,
  saves: 11,
  paragraphs: [
    "Nếu nhóm chỉ còn ít thời gian, việc quan trọng nhất là đóng băng scope và chốt workflow. Frontend không nên đổi API liên tục, backend không nên thay đổi tên field sát ngày demo.",
    "Nhóm mình chia thành 3 khối: auth, bài viết và admin. Mỗi khối có route, controller và giao diện riêng. Khi xong mock data thì mới nối xuống API thật để tránh vỡ giao diện.",
    "Với bài viết cần duyệt, mình để status pending ngay từ lúc tạo. Admin chỉ cần có một màn hình đọc nhanh, duyệt và xoá bài. Luồng report cũng nên tách riêng để dễ kiểm soát vi phạm.",
  ],
  highlights: [
    "Đóng băng scope trước khi code",
    "Tên field và response cần giữ ổn định",
    "Mock giao diện trước khi nối backend",
  ],
};

export const comments = [
  {
    id: 1,
    author: "Nguyễn Minh Thu",
    role: "Sinh viên HTTT",
    createdAt: "2026-04-19T09:05:00+07:00",
    content:
      "Phần đóng băng tên field rất quan trọng. Nhóm mình từng đổi likes thành likeCount lúc sắp demo nên vỡ mặt frontend.",
  },
  {
    id: 2,
    author: "Lê Hoàng Sơn",
    role: "Trợ giảng",
    createdAt: "2026-04-19T09:40:00+07:00",
    content:
      "Nếu có thêm luồng report comment thì nên thống nhất schema ngay từ đầu để admin xử lý nhanh hơn.",
  },
];

export const profileOverview = {
  sections: [
    { label: "Email", value: "khang.tm@st.dntu.edu.vn" },
    { label: "Lớp", value: "DHKTPM18A" },
    { label: "Vai trò", value: "Sinh viên" },
    { label: "Trạng thái", value: "Đang hoạt động" },
  ],
  recentActivity: [
    "Đã lưu bài viết về workflow React và Express",
    "Đã đăng 1 bài viết mới cho chủ đề AI ứng dụng",
    "Đã đổi mật khẩu cách đây 6 ngày",
  ],
  savedPosts: [
    {
      title: "Bộ câu hỏi ôn tập môn Cơ sở dữ liệu cho tuần cuối",
      category: "Học tập",
      note: "Đã lưu 2 ngày trước",
    },
    {
      title: "Mẫu CV thực tập cho sinh viên năm 3 ngành CNTT",
      category: "Thực tập",
      note: "Đã lưu 5 ngày trước",
    },
  ],
};

export const publishingGuide = [
  "Chỉ đăng bài liên quan đến học tập, sinh hoạt khoa hoặc hỏi đáp chuyên môn.",
  "Mỗi bài viết chỉ sử dụng tối đa 1 ảnh để tiết kiệm dung lượng.",
  "Nội dung mới sẽ vào hàng chờ duyệt trước khi hiển thị công khai.",
];

export const adminMetrics = [
  { label: "Tổng số tài khoản", value: "214", note: "198 sinh viên, 16 giảng viên" },
  { label: "Bài viết chờ duyệt", value: "08", note: "Cần xử lý trong ngày" },
  { label: "Report chưa xử lý", value: "05", note: "2 mức độ cao" },
  { label: "Tài khoản đang khoá", value: "03", note: "Theo quy chế cộng đồng" },
];

export const moderationQueue = [
  {
    title: "Tài liệu ôn tập môn Mạng máy tính",
    author: "Nguyễn Quốc Việt",
    category: "Học tập",
    note: "Chờ duyệt 45 phút",
  },
  {
    title: "Hỏi đáp về cách nộp đồ án backend trên Render",
    author: "Trần Gia Bảo",
    category: "Lập trình web",
    note: "Chờ duyệt 1 giờ 10 phút",
  },
];

export const managedUsers = [
  {
    id: 1,
    name: "Trần Minh Khang",
    role: "Sinh viên",
    department: "Công nghệ thông tin",
    status: "active",
    postCount: 9,
    lastActive: "2026-04-19T08:50:00+07:00",
  },
  {
    id: 2,
    name: "Lê Hoàng Sơn",
    role: "Giảng viên",
    department: "Khoa Công nghệ",
    status: "active",
    postCount: 4,
    lastActive: "2026-04-18T18:10:00+07:00",
  },
  {
    id: 3,
    name: "Phạm Quốc Đạt",
    role: "Sinh viên",
    department: "Hệ thống thông tin",
    status: "locked",
    postCount: 2,
    lastActive: "2026-04-16T15:30:00+07:00",
  },
];

export const pendingPosts = [
  {
    id: 1,
    title: "Hướng dẫn chia nhanh vai trò trong đồ án môn học",
    author: "Nguyễn Minh Châu",
    category: "Đồ án môn học",
    summary:
      "Bài viết chia sẻ cách chia task frontend, backend, test và người tổng hợp tài liệu để tránh trùng lặp công việc.",
  },
  {
    id: 2,
    title: "Tài liệu tham khảo về xây dựng REST API với Node.js",
    author: "Võ Gia Linh",
    category: "Lập trình web",
    summary:
      "Tổng hợp tài liệu cần đọc, cách đặt route và gợi ý cách viết middleware auth có JWT.",
  },
  {
    id: 3,
    title: "Kinh nghiệm phỏng vấn thực tập tại công ty phần mềm",
    author: "Đỗ Ngọc Hân",
    category: "Kinh nghiệm thực tập",
    summary:
      "Chia sẻ các câu hỏi thường gặp và cách trình bày dự án cá nhân gọn gàng trong 5 phút.",
  },
];

export const reports = [
  {
    id: "RP-201",
    target: "Bài viết",
    title: "Bình luận có nội dung công kích cá nhân trong bài viết đồ án",
    reporter: "Sinh viên năm 2",
    reason: "Ngôn từ xúc phạm",
    severity: "high",
    status: "Chưa xử lý",
    recommendation: "Xoá bình luận và cảnh báo tài khoản",
  },
  {
    id: "RP-202",
    target: "Comment",
    title: "Spam link ngoài lề trong chủ đề hỏi đáp kỹ thuật",
    reporter: "Trợ giảng khoa",
    reason: "Spam / không liên quan",
    severity: "medium",
    status: "Đang xem xét",
    recommendation: "Xoá comment, theo dõi thêm",
  },
  {
    id: "RP-203",
    target: "Bài viết",
    title: "Đăng tải nội dung không liên quan đến học tập",
    reporter: "Admin trực ca",
    reason: "Sai mục đích sử dụng",
    severity: "low",
    status: "Chưa xử lý",
    recommendation: "Từ chối bài viết và nhắc nhở",
  },
];
