import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getCategories } from "../../api/postApi";
import { useAuth } from "../../context/AuthContext";

const studentLinks = [
  { to: "/home", label: "Bảng tin" },
  { to: "/profile", label: "Trang cá nhân" },
  { to: "/create-post", label: "Soạn bài viết" },
];

const adminLinks = [
  { to: "/admin/dashboard", label: "Tổng quan" },
  { to: "/admin/users", label: "Quản lý user" },
  { to: "/admin/pending-posts", label: "Bài chờ duyệt" },
  { to: "/admin/reports", label: "Xử lý report" },
];

function Sidebar() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await getCategories();
        if (isMounted) {
          setCategories(response.data);
        }
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <aside className="sidebar-panel">
      <section className="sidebar-panel__group">
        <p className="sidebar-panel__label">Không gian sinh viên</p>
        <div className="sidebar-panel__nav">
          {studentLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "side-link is-active" : "side-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </section>

      {isAdmin ? (
        <section className="sidebar-panel__group">
          <p className="sidebar-panel__label">Công cụ admin</p>
          <div className="sidebar-panel__nav">
            {adminLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "side-link is-active" : "side-link")}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </section>
      ) : null}

      <section className="sidebar-panel__group">
        <p className="sidebar-panel__label">Chủ đề nổi bật</p>
        <div className="tag-cloud">
          {categories.length ? (
            categories.map((category) => (
              <span key={category.id} className="tag">
                {category.name}
              </span>
            ))
          ) : (
            <span className="tag">Đang tải chủ đề</span>
          )}
        </div>
      </section>

      <div className={isAdminRoute ? "notice-card notice-card--admin" : "notice-card"}>
        <p className="sidebar-panel__label">Ghi chú</p>
        <strong>{isAdminRoute ? "Ưu tiên report mức cao" : "Mọi bài mới đều qua kiểm duyệt"}</strong>
        <p>
          {isAdminRoute
            ? "Admin có thể duyệt bài, khóa tài khoản, tạo chủ đề và xử lý report trực tiếp từ hệ thống."
            : "Thông tin hồ sơ của bạn được lấy từ dữ liệu admin đã tạo và có thể cập nhật ở trang cá nhân."}
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
