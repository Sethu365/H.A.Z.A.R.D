import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Outlet /> {/* login/signup pages will load here */}
    </div>
  );
};

export default PublicLayout;
