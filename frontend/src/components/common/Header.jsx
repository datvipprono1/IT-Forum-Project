import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { searchUsers as searchUsersApi } from "../../api/userApi";
import { useAuth } from "../../context/AuthContext";
import { getRoleLabel } from "../../utils/labels";
import NotificationCenter from "./NotificationCenter";
import ThemeSwitch from "./ThemeSwitch";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const profileName = user?.fullName || user?.email?.split("@")[0] || "Người dùng";
  const avatarLabel = user?.avatar || profileName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchError("");
      setSearching(false);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearching(true);
        setSearchError("");
        const response = await searchUsersApi(searchQuery.trim());
        setSearchResults(response.data || []);
      } catch (requestError) {
        setSearchError(requestError.response?.data?.message || "Không tìm được người dùng.");
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleSubmitSearch = (event) => {
    event.preventDefault();

    if (searchResults.length) {
      navigate(`/users/${searchResults[0].id}`);
    }
  };

  const handleSelectUser = (userId) => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchError("");
    navigate(`/users/${userId}`);
  };

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="brand-mark brand-mark--logo">
          <img src="/dntu-logo.svg" alt="DNTU logo" className="brand-mark__image" />
        </div>
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

        <div className="topbar__search">
          <form className="topbar__search-form" onSubmit={handleSubmitSearch}>
            <input
              type="text"
              className="text-input topbar__search-input"
              placeholder="Tìm tên hoặc MSSV để xem trang cá nhân"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </form>

          {searchQuery.trim().length >= 2 ? (
            <div className="topbar__search-dropdown">
              {searching ? <div className="topbar__search-empty">Đang tìm người dùng...</div> : null}
              {!searching && searchError ? <div className="topbar__search-empty">{searchError}</div> : null}
              {!searching && !searchError && !searchResults.length ? (
                <div className="topbar__search-empty">Không tìm thấy kết quả phù hợp.</div>
              ) : null}
              {!searching && !searchError && searchResults.length
                ? searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className="topbar__search-item"
                      onClick={() => handleSelectUser(result.id)}
                    >
                      <div className="avatar-badge">{result.avatar || result.fullName.slice(0, 2).toUpperCase()}</div>
                      <div className="topbar__search-item-content">
                        <strong>{result.fullName}</strong>
                        <span>
                          {result.studentId || "Không có MSSV"}
                          {result.faculty ? ` • ${result.faculty}` : ""}
                        </span>
                      </div>
                      <span className="status-pill">{result.approvedPostsCount} bài</span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="topbar__actions">
        <ThemeSwitch />
        <NotificationCenter userId={user?.id} />
        <div className="topbar__profile">
          <div className="avatar-badge">{avatarLabel}</div>
          <div>
            <strong>{profileName}</strong>
            <p>{getRoleLabel(user?.role)}</p>
          </div>
        </div>
        <button type="button" className="outline-button compact" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default Header;
