// frontend/src/api.js
import axios from "axios";

// Axios instance for backend API
const API = axios.create({
  baseURL: "http://localhost:4000/api", // update if backend runs elsewhere
  timeout: 5000,
});

// ===================== REAL BACKEND CALLS ===================== //

// Get anomalies from backend
export const getAnomalies = async () => {
  try {
    const { data } = await API.get("/anomalies");
    return data || [];
  } catch (err) {
    console.error("❌ Failed to fetch anomalies:", err.message);
    return [];
  }
};

// Get alerts from backend
export const getRecentAlerts = async () => {
  try {
    const { data } = await API.get("/alerts");
    return data || [];
  } catch (err) {
    console.error("❌ Failed to fetch alerts:", err.message);
    return [];
  }
};

// Get system statistics (latest snapshot)
export const getSystemStats = async () => {
  try {
    const { data } = await API.get("/metrics");
    return data || {};
  } catch (err) {
    console.error("❌ Failed to fetch system stats:", err.message);
    return {};
  }
};

// Get user behavior analytics
export const getUserBehavior = async () => {
  try {
    const { data } = await API.get("/user-behavior");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Failed to fetch user behavior:", err.message);
    return [];
  }
};

// ===================== ML PREDICTION CALL ===================== //
// No need to pass features, backend builds them from DB
export const getPrediction = async () => {
  try {
    const { data } = await API.post("/ml/predict");
    return data; // { prediction, risk_score, xgb_proba, reconstruction_error }
  } catch (err) {
    console.error("❌ Failed to fetch ML prediction:", err.response?.data || err.message);
    return null;
  }
};

export default API;
