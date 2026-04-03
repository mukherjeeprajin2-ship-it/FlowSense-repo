import React, { useEffect, useState } from "react";
import { getComplaints, getTraffic, addComplaint } from "./api";

export default function App() {
  const [complaints, setComplaints] = useState([]);
  const [traffic, setTraffic] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const c = await getComplaints();
    const t = await getTraffic();
    setComplaints(c);
    setTraffic(t);
  };

  const handleAdd = async () => {
    await addComplaint({
      type: "Broken Signal",
      description: "Test complaint",
      location: { lat: 13.08, lng: 80.27, address: "Chennai" },
    });

    loadData(); // refresh
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-50">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">
        TrafficIQ Dashboard
      </h1>

      <button
        onClick={handleAdd}
        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg mb-6"
      >
        Add Complaint
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaints */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-3">Complaints</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {complaints.map((c) => (
              <div key={c.id} className="p-2 border rounded">
                <p className="text-sm">{c.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-3">Traffic</h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {traffic.map((t, i) => (
              <div
                key={i}
                className="p-2 border rounded flex justify-between"
              >
                <span className="text-sm">{t.road_name}</span>
                <span className="text-sm font-semibold">
                  {t.congestion_label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}