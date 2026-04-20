import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  resetPassword as resetPasswordApi,
  validateResetPasswordToken,
} from "../../api/authApi";
import ThemeSwitch from "../../components/common/ThemeSwitch";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationState, setValidationState] = useState({
    loading: true,
    valid: false,
    message: "",
  });
  const [submitState, setSubmitState] = useState({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function validateToken() {
      if (!token) {
        if (isMounted) {
          setValidationState({
            loading: false,
            valid: false,
            message: "Link đặt lại mật khẩu không hợp lệ hoặc đã thiếu token.",
          });
        }
        return;
      }

      try {
        const response = await validateResetPasswordToken(token);
        if (!isMounted) {
          return;
        }

        setValidationState({
          loading: false,
          valid: true,
          message:
            response.data?.message || "Link hợp lệ. Bạn có thể nhập mật khẩu mới.",
        });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setValidationState({
          loading: false,
          valid: false,
          message:
            requestError.response?.data?.message ||
            "Link đặt lại mật khẩu không còn hợp lệ.",
        });
      }
    }

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitState({
      loading: false,
      error: "",
      success: "",
    });

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setSubmitState({
        loading: false,
        error: "Bạn cần nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.",
        success: "",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitState({
        loading: false,
        error: "Mật khẩu xác nhận không khớp.",
        success: "",
      });
      return;
    }

    setSubmitState({
      loading: true,
      error: "",
      success: "",
    });

    try {
      const response = await resetPasswordApi({
        token,
        newPassword,
      });

      setSubmitState({
        loading: false,
        error: "",
        success:
          response.data?.message ||
          "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (requestError) {
      setSubmitState({
        loading: false,
        error:
          requestError.response?.data?.message ||
          "Không thể đặt lại mật khẩu lúc này.",
        success: "",
      });
    }
  };

  return (
    <section className="login-screen">
      <form className="login-card login-card--centered" onSubmit={handleSubmit}>
        <div className="login-card__theme">
          <ThemeSwitch />
        </div>

        <div className="login-card__intro">
          <p className="eyebrow">DNTU Forum</p>
          <h2>Đặt lại mật khẩu</h2>
          <p className="section-heading__note">
            Tạo mật khẩu mới cho tài khoản của bạn bằng link bảo mật đã gửi qua email.
          </p>
        </div>

        {validationState.loading ? (
          <div className="empty-state">Hệ thống đang kiểm tra link đặt lại mật khẩu...</div>
        ) : null}

        {!validationState.loading && !validationState.valid ? (
          <div className="form-error">{validationState.message}</div>
        ) : null}

        {!validationState.loading && validationState.valid ? (
          <>
            <div className="form-success">{validationState.message}</div>

            <div className="field">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                id="newPassword"
                name="newPassword"
                className="text-input"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                className="text-input"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            {submitState.error ? <div className="form-error">{submitState.error}</div> : null}
            {submitState.success ? <div className="form-success">{submitState.success}</div> : null}

            <button type="submit" className="primary-button full-width" disabled={submitState.loading}>
              {submitState.loading ? "Đang cập nhật mật khẩu..." : "Lưu mật khẩu mới"}
            </button>
          </>
        ) : null}

        <Link className="text-link login-card__subtle-action" to="/login">
          Quay lại đăng nhập
        </Link>
      </form>
    </section>
  );
}

export default ResetPassword;
