import { useTheme } from "../../context/ThemeContext";

function ThemeSwitch() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={isDark ? "theme-switch is-dark" : "theme-switch"}
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={isDark ? "Đang ở nền tối" : "Đang ở nền sáng"}
    >
      <span className="theme-switch__label">{isDark ? "Tối" : "Sáng"}</span>
      <span className="theme-switch__track" aria-hidden="true">
        <span className="theme-switch__thumb" />
      </span>
    </button>
  );
}

export default ThemeSwitch;
