import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SplashScreen from "./components/SplashScreen";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Anomalies from "./pages/Anomalies";
import Settings from "./pages/Settings";
import DashboardLayout from "./layouts/DashboardLayout";
import DockerSettings from "./pages/DockerSettings";
import TimescaleLogs from "./pages/TimescaleLogs";
import MongoLogs from "./pages/MongoLogs";
import ClientDetails from "./pages/ClientDetails";
import ClientCommandExecution from "./pages/ClientCommandExecution";
import ProcessTree from "./pages/ProcessTree";
import FileExplorer from "./pages/FileExplorer";
import AnomalyHistory from "./pages/AnomalyHistory";
import UnderDevelopment from "./components/UnderDevelopment";
import Intel from "./pages/Intel";
import ClientAnomaly from "./pages/AnomaliesClients";
import ClientAnomalyHistory from "./pages/AnomalyClientsHistory";

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
              <Route path="docker-settings" element={<DockerSettings />} />
              <Route path="timescale-logs" element={<TimescaleLogs />} />
              <Route path="mongo-logs" element={<MongoLogs />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:hostname" element={<ClientDetails />} />
              <Route path="/clients/:hostname/control" element={<ClientCommandExecution />} />
              <Route path="/clients/:hostname/process-tree" element={<ProcessTree />} />
              <Route path="/clients/:hostname/file-explorer" element={<FileExplorer />} />
              <Route path="/clients/:hostname/client-anomaly" element={<ClientAnomaly />} />
              <Route path="/clients/:hostname/client-anomaly/history" element={<ClientAnomalyHistory />} />
              <Route path="anomalies" element={<Anomalies />} />
              <Route path="anomalies/history" element={<AnomalyHistory />} />
              {/* <Route path="settings" element={<Settings />} /> */}
              <Route path="scraper" element={<Intel />} />
            </Route>
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;


