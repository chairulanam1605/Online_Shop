// src/pages/distributor/DistributorShipments.js
import React, { useEffect, useState } from "react";
import DistributorSidebar from "../../components/Distributor/DistributorSidebar";
import "../../styles/Distributor/Shipments.css";

const API_URL = "http://localhost/Online_Shop";

const DistributorShipments = () => {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/distributor/history`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setShipments(data || []))
      .catch((err) => console.error("Error fetching shipments:", err));
  }, []);

  return (
    <DistributorSidebar>
      <div className="shipments-container">
        <h1>Riwayat Pengiriman</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pelanggan</th>
              <th>Alamat</th>
              <th>Total</th>
              <th>Tanggal Selesai</th>
              <th>Bukti Foto</th>
            </tr>
          </thead>
          <tbody>
            {shipments.length > 0 ? (
              shipments.map((ship, i) => (
                <tr key={i}>
                  <td>#{ship.distributor_order_id}</td>
                  <td>{ship.customer_name}</td>
                  <td>{ship.customer_address}</td>
                  <td>Rp {parseInt(ship.total_price).toLocaleString()}</td>
                  <td>
                    {ship.completed_at
                      ? new Date(ship.completed_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {ship.proof_image ? (
                      <a href={`${API_URL}/uploads/proofs/${ship.proof_image}`} target="_blank" rel="noopener noreferrer">
                        Lihat Foto
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">Belum ada pengiriman</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DistributorSidebar>
  );
};

export default DistributorShipments;
