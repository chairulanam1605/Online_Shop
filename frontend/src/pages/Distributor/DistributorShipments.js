// src/pages/distributor/DistributorShipments.js
import React, { useEffect, useState } from "react";
import DistributorSidebar from "../../components/Distributor/DistributorSidebar";
import "../../styles/Distributor/Shipments.css";

const API_URL = "http://localhost/Online_Shop";

const DistributorShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

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
              <th>No</th>
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
                  {/* Nomor urut */}
                  <td>{i + 1}</td>
                  <td>{ship.customer_name}</td>
                  <td>{ship.customer_address}</td>
                  <td>Rp {parseInt(ship.total_price).toLocaleString("id-ID")}</td>
                  <td>
                    {ship.completed_at
                      ? new Date(ship.completed_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td>
                    {ship.proof_image ? (
                      <img
                        src={`${API_URL}/uploads/proof/${ship.proof_image}`}
                        alt="Bukti Foto"
                        className="proof-thumbnail"
                        onClick={() => setPreviewImage(`${API_URL}/uploads/proof/${ship.proof_image}`)}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">Belum ada pengiriman</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Modal Preview Foto */}
        {previewImage && (
          <div
            className="modal-overlay"
            onClick={() => setPreviewImage(null)}
          >
            <div className="modal-content">
              <img
                src={previewImage}
                alt="Preview Bukti"
                className="proof-full"
              />
            </div>
          </div>
        )}
      </div>
    </DistributorSidebar>
  );
};

export default DistributorShipments;
