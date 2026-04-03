const axios = require("axios");
const db = require("../firebase");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

function getSignalTiming(level) {
  if (level === "High") return { greenTime: 70, redTime: 20, yellowTime: 5, cycleTime: 95 };
  if (level === "Medium") return { greenTime: 45, redTime: 45, yellowTime: 5, cycleTime: 95 };
  return { greenTime: 30, redTime: 60, yellowTime: 5, cycleTime: 95 };
}

function getColor(level) {
  if (level === "High") return "#ef4444";
  if (level === "Medium") return "#f59e0b";
  return "#22c55e";
}

async function fetchTraffic(signal) {
  const origin = `${signal.lat},${signal.lon}`;
  const destination = `${signal.lat + 0.002},${signal.lon + 0.002}`;

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&departure_time=now&key=${GOOGLE_API_KEY}`;

  const res = await axios.get(url);
  const leg = res.data.routes[0].legs[0];

  const ratio = leg.duration_in_traffic.value / leg.duration.value;

  if (ratio > 1.5) return "High";
  if (ratio > 1.2) return "Medium";
  return "Low";
}

async function storeTraffic(signal, level) {
  const congestion_level = level === "Low" ? 30 : level === "Medium" ? 60 : 85;

  await db.collection("traffic_data").add({
    road_name: `Signal_${signal.lat.toFixed(3)}_${signal.lon.toFixed(3)}`,
    congestion_level,
    congestion_label: level,
    estimated_count: Math.floor(Math.random() * 300),
    signal_timing: getSignalTiming(level),
    color: getColor(level),
    processed_at: new Date().toISOString(),
  });
}

module.exports = {
  fetchTraffic,
  storeTraffic,
};