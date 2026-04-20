import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberUser: true,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Bạn cần nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const signedInUser = await login(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.rememberUser
      );

      const redirectTo =
        location.state?.from?.pathname && location.state.from.pathname !== "/login"
          ? location.state.from.pathname
          : signedInUser.role === "admin"
            ? "/admin/dashboard"
            : "/home";

      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="login-screen">
      <div className="login-showcase">
        <p className="eyebrow">Diễn đàn nội bộ khoa Công nghệ</p>
        <h1>Đăng nhập bằng tài khoản do admin cấp để vào diễn đàn sinh viên DNTU.</h1>
        <p className="login-showcase__lead">
          Luồng hiện tại đã đi qua backend thật: xác thực, phân quyền admin hoặc sinh viên, khóa tài khoản và đồng bộ hồ sơ cá nhân.
        </p>

        <div className="login-showcase__stats">
          <div className="metric-card">
            <span>02</span>
            <p>Vai trò chính</p>
          </div>
          <div className="metric-card">
            <span>01</span>
            <p>Luồng duyệt bài</p>
          </div>
          <div className="metric-card">
            <span>100%</span>
            <p>Tài khoản do admin tạo</p>
          </div>
        </div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Đăng nhập</p>
        <h2>Sử dụng email học tập hoặc email nội bộ</h2>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            className="text-input"
            type="email"
            placeholder="mssv@dntu.edu.vn"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            className="text-input"
            type="password"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
        </div>

        <div className="login-card__options">
          <label className="checkbox-line">
            <input
              type="checkbox"
              name="rememberUser"
              checked={formData.rememberUser}
              onChange={handleChange}
            />
            <span>Giữ đăng nhập trên thiết bị này</span>
          </label>
        </div>

        {error ? <div className="form-error">{error}</div> : null}

        <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Vào diễn đàn"}
        </button>

        <div className="login-card__note">
          <strong>Tài khoản mẫu</strong>
          <p>Admin: admin1@itforum.local / 123456</p>
          <p>Sinh viên: 1721031253@dntu.edu.vn / 123456</p>
        </div>
      </form>
    </section>
  );
}

export default Login;
