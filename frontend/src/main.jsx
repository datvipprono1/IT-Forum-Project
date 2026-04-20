import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/style.css";
import { AuthProvider } from "./context/AuthContext";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Ứng dụng gặp lỗi runtime không xác định.",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-loading-screen">
          <div className="app-loading-card app-loading-card--error">
            <p className="eyebrow">Lỗi runtime</p>
            <h2>Ứng dụng đang bị lỗi khi render</h2>
            <p>{this.state.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
