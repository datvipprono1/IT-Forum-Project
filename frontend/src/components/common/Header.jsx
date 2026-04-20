import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRoleLabel } from "../../utils/labels";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const profileName = user?.fullName || user?.email?.split("@")[0] || "Người dùng";
  const avatarLabel = user?.avatar || profileName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="brand-mark">D</div>
        <div>
          <p className="eyebrow">Đại học Công nghệ Đồng Nai</p>
          <h1>DNTU Forum</h1>
        </div>
      </div>

      <div className="topbar__center">
        <p className="topbar__context">
          {isAdminRoute
            ? "Khu vực quản trị nội dung, tài khoản và chủ đề diễn đàn"
            : "Diễn đàn học tập cho sinh viên khoa Công nghệ"}
        </p>
        <nav className="topbar__nav">
          <NavLink to="/home" className={({ isActive }) => (isActive ? "nav-tab is-active" : "nav-tab")}>
            Bảng tin
          </NavLink>
          <NavLink
            to="/create-post"
            className={({ isActive }) => (isActive ? "nav-tab is-active" : "nav-tab")}
          >
            Tạo bài
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? "nav-tab is-active" : "nav-tab")}
          >
            Trang cá nhân
          </NavLink>
          {isAdmin ? (
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "nav-tab is-active" : "nav-tab")}
            >
              Admin
            </NavLink>
          ) : null}
        </nav>
      </div>

      <div className="topbar__profile">
        <div className="avatar-badge">{avatarLabel}</div>
        <div>
          <strong>{profileName}</strong>
          <p>{getRoleLabel(user?.role)}</p>
        </div>
        <button type="button" className="outline-button compact" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default Header;
