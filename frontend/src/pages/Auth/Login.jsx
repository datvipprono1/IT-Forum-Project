import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { forgotPassword as requestPasswordResetApi } from "../../api/authApi";
import ThemeSwitch from "../../components/common/ThemeSwitch";
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isRequestingReset, setIsRequestingReset] = useState(false);

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

  const toggleForgotPassword = () => {
    setShowForgotPassword((current) => !current);
    setResetError("");
    setResetMessage("");
    setResetEmail((current) => current || formData.email.trim().toLowerCase());
  };

  const handleRequestPasswordReset = async () => {
    const email = resetEmail.trim().toLowerCase();

    setResetError("");
    setResetMessage("");

    if (!email) {
      setResetError("Bạn cần nhập email đã được admin cấp để nhận link đặt lại mật khẩu.");
      return;
    }

    setIsRequestingReset(true);

    try {
      const response = await requestPasswordResetApi({ email });
      setResetEmail(email);
      setResetMessage(
        response.data?.message || "Link đặt lại mật khẩu đã được gửi về email của bạn."
      );
    } catch (requestError) {
      setResetError(
        requestError.response?.data?.message || "Không thể gửi link đặt lại mật khẩu lúc này."
      );
    } finally {
      setIsRequestingReset(false);
    }
  };

  const handleResetFieldKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleRequestPasswordReset();
  };

  return (
    <section className="login-screen">
      <form className="login-card login-card--centered" onSubmit={handleSubmit}>
        <div className="login-card__theme">
          <ThemeSwitch />
        </div>

        <div className="login-card__intro">
          <p className="eyebrow">DNTU Forum</p>
          <h2>Đăng nhập</h2>
          <p className="section-heading__note">
            Sử dụng tài khoản do admin cấp để truy cập diễn đàn sinh viên khoa Công nghệ.
          </p>
        </div>

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

          <button
            type="button"
            className="text-link login-card__subtle-action"
            onClick={toggleForgotPassword}
          >
            {showForgotPassword ? "Đóng quên mật khẩu" : "Quên mật khẩu?"}
          </button>
        </div>

        {showForgotPassword ? (
          <div className="login-card__reset">
            <div className="login-card__reset-copy">
              <strong>Nhận link đặt lại mật khẩu</strong>
              <p>
                Nhập email do admin cấp. Hệ thống sẽ gửi một link bảo mật đến email này.
                Bấm vào link để mở trang đặt lại mật khẩu.
              </p>
            </div>

            <div className="field">
              <label htmlFor="resetEmail">Email nhận link</label>
              <input
                id="resetEmail"
                name="resetEmail"
                className="text-input"
                type="email"
                placeholder="mssv@dntu.edu.vn"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                onKeyDown={handleResetFieldKeyDown}
                autoComplete="email"
              />
            </div>

            <div className="login-card__reset-actions">
              <button
                type="button"
                className="outline-button"
                onClick={handleRequestPasswordReset}
                disabled={isRequestingReset}
              >
                {isRequestingReset ? "Đang gửi link..." : "Gửi link đặt lại mật khẩu"}
              </button>
            </div>

            {resetError ? <div className="form-error">{resetError}</div> : null}
            {resetMessage ? <div className="form-success">{resetMessage}</div> : null}
          </div>
        ) : null}

        {error ? <div className="form-error">{error}</div> : null}

        <button type="submit" className="primary-button full-width" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Vào diễn đàn"}
        </button>
      </form>
    </section>
  );
}

export default Login;
