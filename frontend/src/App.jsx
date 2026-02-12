  // import React from 'react';
  // import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
  // import Sidebar from './components/Sidebar';
  // import Topbar from './components/Topbar';
  // import Dashboard from './pages/Dashboard';
  // import UserBehavior from './pages/UserBehavior';
  // import Anomalies from './pages/Anomalies';
  // import Settings from './pages/Settings';

  // function App() {
  //   return (
  //     <Router>
  //       <div className="min-h-screen bg-gray-900 text-white flex">
  //         <Sidebar />
  //         <div className="flex-1 flex flex-col">
  //           <Topbar />
  //           <main className="flex-1 p-6">
  //             <Routes>
  //               <Route path="/" element={<Dashboard />} />
  //               <Route path="/user-behavior" element={<UserBehavior />} />
  //               <Route path="/anomalies" element={<Anomalies />} />
  //               <Route path="/settings" element={<Settings />} />
  //             </Routes>
  //           </main>
  //         </div>
  //       </div>
  //     </Router>
  //   );
  // }

  // export default App;



  // import React, { useState } from "react";
  // import Sidebar from "./components/Sidebar";
  // import Topbar from "./components/Topbar";
  // import Dashboard from "./pages/Dashboard";
  // import UserBehavior from "./pages/UserBehavior";
  // import Anomalies from "./pages/Anomalies";
  // import Settings from "./pages/Settings";
  // import SplashScreen from "./components/SplashScreen";
  // import Signup from "./pages/Signup";
  // import Login from "./pages/Login";
  // import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

  // function App() {
  //   const [showSplash, setShowSplash] = useState(true);

  //   return (
  //     <>
  //       {showSplash ? (
  //         <SplashScreen onFinish={() => setShowSplash(false)} />
  //       ) : (
  //         <Router>
  //           <div className="flex h-screen bg-gray-900 text-white">
  //             <Sidebar />
  //             <div className="flex-1 flex flex-col">
  //               <Topbar />
  //               <main className="flex-1 overflow-y-auto p-6">
  //                 <Routes>
  //                   <Route path="/" element={<Dashboard />} />
  //                   <Route path="/user-behavior" element={<UserBehavior />} />
  //                   <Route path="/anomalies" element={<Anomalies />} />
  //                   <Route path="/settings" element={<Settings />} />
  //                 </Routes>
  //               </main>
  //             </div>
  //           </div>
  //         </Router>
  //       )}
  //     </>
  //   );
  // }

  // export default App;

// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// import Sidebar from "./components/Sidebar";
// import Topbar from "./components/Topbar";
// import Dashboard from "./pages/Dashboard";
// import UserBehavior from "./pages/UserBehavior";
// import Anomalies from "./pages/Anomalies";
// import Settings from "./pages/Settings";
// import SplashScreen from "./components/SplashScreen";
// import Signup from "./pages/Signup";
// import Login from "./pages/Login";
// import ProtectedRoute from "./components/ProtectedRoute";

// function App() {
//   const [showSplash, setShowSplash] = useState(true);

//   return (
//     <>
//       {showSplash ? (
//         <SplashScreen onFinish={() => setShowSplash(false)} />
//       ) : (
//         <Router>
//           <Routes>
//             {/* Public pages (no sidebar/topbar) */}
//             <Route path="/signup" element={<Signup />} />
//             <Route path="/login" element={<Login />} />

//             {/* Protected pages (with sidebar + topbar) */}
//             <Route
//               path="/"
//               element={
//                 <ProtectedRoute>
//                   <div className="flex h-screen bg-gray-900 text-white">
//                     <Sidebar />
//                     <div className="flex-1 flex flex-col">
//                       <Topbar />
//                       <main className="flex-1 overflow-y-auto p-6">
//                         <Routes>
//                           <Route path="/" element={<Dashboard />} />
//                           <Route path="/user-behavior" element={<UserBehavior />} />
//                           <Route path="/anomalies" element={<Anomalies />} />
//                           <Route path="/settings" element={<Settings />} />
//                         </Routes>
//                       </main>
//                     </div>
//                   </div>
//                 </ProtectedRoute>
//               }
//             />
//           </Routes>
//         </Router>
//       )}
//     </>
//   );
// }

// export default App;

// frontend/src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SplashScreen from "./components/SplashScreen";
import Dashboard from "./pages/Dashboard";
import UserBehavior from "./pages/UserBehavior";
import Anomalies from "./pages/Anomalies";
import Settings from "./pages/Settings";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <Router>
          <Routes>
            {/* Main dashboard layout with sidebar + topbar */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="user-behavior" element={<UserBehavior />} />
              <Route path="anomalies" element={<Anomalies />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;

