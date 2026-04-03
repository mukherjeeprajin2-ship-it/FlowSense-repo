const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");

const app = express();

// 🔐 Firebase Setup
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔑 Google API Key
const GOOGLE_API_KEY = "YOUR_API_KEY";

// 🌆 STEP 1: Fetch ALL traffic signals in Chennai (Overpass API)
async function getTrafficSignals() {
  const query = `
    [out:json];
    area["name"="Chennai"]->.searchArea;
    node["highway"="traffic_signals"](area.searchArea);
    out;
  `;

  const url = "https://overpass-api.de/api/interpreter";

  const response = await axios.post(url, query);

  return response.data.elements.map((el) => ({
    lat: el.lat,
    lon: el.lon,
  }));
}

// 🚗 STEP 2: Convert signal → short route
function createRoute(signal) {
  return {
    origin: `${signal.lat},${signal.lon}`,
    destination: `${signal.lat + 0.002},${signal.lon + 0.002}`,
  };
}

// 🚦 STEP 3: Fetch traffic from Google Maps
async function fetchTraffic(route) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${route.origin}&destination=${route.destination}&departure_time=now&key=${GOOGLE_API_KEY}`;

  const response = await axios.get(url);

  const leg = response.data.routes[0].legs[0];

  const normal = leg.duration.value;
  const traffic = leg.duration_in_traffic.value;

  const ratio = traffic / normal;

  let congestion = "Low";
  if (ratio > 1.5) congestion = "High";
  else if (ratio > 1.2) congestion = "Medium";

  return congestion;
}

// 💾 STEP 4: Store in Firestore
async function storeData(signal, congestion) {
  await db.collection("traffic_data").add({
    lat: signal.lat,
    lon: signal.lon,
    congestion,
    timestamp: new Date(),
  });
}

// 🔄 STEP 5: Full pipeline (IMPORTANT)
async function collectTrafficData() {
  console.log("Fetching signals...");

  const signals = await getTrafficSignals();

  console.log(`Total signals: ${signals.length}`);

  // ⚠️ Limit processing (important for API limits)
  const sampleSignals = signals.slice(0, 50);

  for (let signal of sampleSignals) {
    try {
      const route = createRoute(signal);
      const congestion = await fetchTraffic(route);

      await storeData(signal, congestion);

      console.log("Stored:", signal.lat, signal.lon, congestion);
    } catch (err) {
      console.log("Error at signal:", signal, err.message);
    }
  }
}

// 🧠 STEP 6: Analyze per signal
async function analyzeTraffic() {
  const snapshot = await db.collection("traffic_data").get();

  let signalsData = {};

  snapshot.forEach((doc) => {
    const d = doc.data();
    const key = `${d.lat}_${d.lon}`;

    if (!signalsData[key]) {
      signalsData[key] = { total: 0, count: 0 };
    }

    const score =
      d.congestion === "Low" ? 1 :
      d.congestion === "Medium" ? 2 : 3;

    signalsData[key].total += score;
    signalsData[key].count += 1;
  });

  let results = [];

  for (let key in signalsData) {
    let avg = signalsData[key].total / signalsData[key].count;

    let suggestion = "No change";
    if (avg > 2.5) suggestion = "Increase green signal time";
    else if (avg > 1.5) suggestion = "Optimize timing";
    else suggestion = "Reduce signal delay";

    results.push({
      signal: key,
      avg_congestion: avg.toFixed(2),
      suggestion,
    });
  }

  return results;
}

// 📊 API endpoint
app.get("/analysis", async (req, res) => {
  const data = await analyzeTraffic();
  res.json(data);
});

// ⏱ Run every hour
setInterval(collectTrafficData, 60 * 60 * 1000);

app.listen(3000, () => console.log("Server running on port 3000"));