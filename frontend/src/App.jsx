import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Components & Layouts
import SplashScreen from "./components/SplashScreen";
import DashboardLayout from "./layouts/DashboardLayout";
import GlobalLoader from "./components/GlobalLoader";

// Pages
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Anomalies from "./pages/Anomalies";
import AnomalyHistory from "./pages/AnomalyHistory";
import ClientDetails from "./pages/ClientDetails";
import ClientCommandExecution from "./pages/ClientCommandExecution";
import ProcessTree from "./pages/ProcessTree";
import FileExplorer from "./pages/FileExplorer";
import ClientAnomaly from "./pages/AnomaliesClients";
import ClientAnomalyHistory from "./pages/AnomalyClientsHistory";
import DockerSettings from "./pages/DockerSettings";
import TimescaleLogs from "./pages/TimescaleLogs";
import MongoLogs from "./pages/MongoLogs";
import Settings from "./pages/Settings";
import Intel from "./pages/Intel";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  // 1. Global Neural Link State (Loading & Error)
  const [isNeuralLoading, setIsNeuralLoading] = useState(false);
  const [neuralError, setNeuralError] = useState(null);

  // 2. Prop Transport Bundle
  const loaderProps = {
    setLoading: setIsNeuralLoading,
    setError: setNeuralError
  };

  return (
    <>
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <Router>
          {/* 3. Global Curtain - Sitting above Sidebar and Topbar at z-[1000] */}
          <GlobalLoader 
            loading={isNeuralLoading} 
            error={neuralError} 
            onRetry={() => {
              setNeuralError(null);
              window.location.reload();
            }} 
          />

          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              {/* Dashboard & Infra */}
              <Route index element={<Dashboard {...loaderProps} />} />
              <Route path="docker-settings" element={<DockerSettings {...loaderProps} />} />
              <Route path="timescale-logs" element={<TimescaleLogs {...loaderProps} />} />
              <Route path="mongo-logs" element={<MongoLogs {...loaderProps} />} />
              
              {/* Global Anomalies */}
              <Route path="anomalies" element={<Anomalies {...loaderProps} />} />
              <Route path="anomalies/history" element={<AnomalyHistory {...loaderProps} />} />
              
              {/* Client Management */}
              <Route path="clients" element={<Clients {...loaderProps} />} />
              <Route path="clients/:hostname" element={<ClientDetails {...loaderProps} />} />
              <Route path="clients/:hostname/control" element={<ClientCommandExecution {...loaderProps} />} />
              <Route path="clients/:hostname/process-tree" element={<ProcessTree {...loaderProps} />} />
              <Route path="clients/:hostname/file-explorer" element={<FileExplorer {...loaderProps} />} />
              <Route path="clients/:hostname/client-anomaly" element={<ClientAnomaly {...loaderProps} />} />
              <Route path="clients/:hostname/client-anomaly/history" element={<ClientAnomalyHistory {...loaderProps} />} />
              
              {/* Utilities */}
              <Route path="settings" element={<Settings {...loaderProps} />} />
              <Route path="scraper" element={<Intel {...loaderProps} />} />
            </Route>
          </Routes>
        </Router>
      )}
    </>
  );
}

export default App;