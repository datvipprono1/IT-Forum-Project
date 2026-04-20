import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/common/Footer";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Admin/Dashboard";
import ManageReports from "./pages/Admin/ManageReports";
import ManageUsers from "./pages/Admin/ManageUsers";
import PendingPosts from "./pages/Admin/PendingPosts";
import Login from "./pages/Auth/Login";
import ResetPassword from "./pages/Auth/ResetPassword";
import CreatePost from "./pages/Student/CreatePost";
import Home from "./pages/Student/Home";
import PostDetail from "./pages/Student/PostDetail";
import Profile from "./pages/Student/Profile";
import UserProfile from "./pages/Student/UserProfile";

function ForumLayout() {
  return (
    <div className="forum-layout">
      <Header />
      <div className="content-shell">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="auth-layout">
      <Outlet />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="app-loading-screen">
      <div className="app-loading-card">
        <p className="eyebrow">DNTU Forum</p>
        <h2>Đang tải phiên đăng nhập</h2>
        <p>Hệ thống đang kiểm tra quyền truy cập trước khi hiển thị diễn đàn.</p>
      </div>
    </div>
  );
}

function DefaultRedirect() {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? "/admin/dashboard" : "/home"} replace />;
}

function ProtectedLayout() {
  const location = useLocation();
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <ForumLayout />;
}

function GuestLayout() {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/home"} replace />;
  }

  return <AuthLayout />;
}

function RequireAdmin() {
  const { loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DefaultRedirect />} />

        <Route element={<GuestLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="/create-post" element={<CreatePost />} />

          <Route element={<RequireAdmin />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/pending-posts" element={<PendingPosts />} />
            <Route path="/admin/reports" element={<ManageReports />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
