import React from "react";
import { useParams } from "react-router-dom";
import ClusterDashboard from "./ClusterDashboard";

const ClientClusterDashboard = (props) => {
  const { hostname } = useParams();

  return (
    <ClusterDashboard
      {...props}
      lockedHosts={hostname ? [hostname] : []}
      homePath={hostname ? `/clients/${hostname}` : "/clients"}
      title={hostname ? `${hostname} Cluster` : "Cluster"}
      compactLayout
    />
  );
};

export default ClientClusterDashboard;
