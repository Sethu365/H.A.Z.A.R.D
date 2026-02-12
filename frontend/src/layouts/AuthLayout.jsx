import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const AuthLayout = () => {
  const token = localStorage.getItem("token");

  // if no token, go back to login
  if (!token) return <Navigate to="/login" />;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <div className="p-4">
          <Outlet /> {/* here your protected pages will load */}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
