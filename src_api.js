const BASE_URL = "https://your-backend.onrender.com"; // 🔁 replace after deploy

export const getComplaints = async () => {
  const res = await fetch(`${BASE_URL}/complaints`);
  return res.json();
};

export const getTraffic = async () => {
  const res = await fetch(`${BASE_URL}/traffic`);
  return res.json();
};

export const addComplaint = async (data) => {
  const res = await fetch(`${BASE_URL}/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.json();
};