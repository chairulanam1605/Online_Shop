import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/RefundAdmin.css";

const API_URL = "http://localhost/Online_Shop";

const RefundAdmin = () => {
  const [refunds, setRefunds] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  // 🔄 Ambil semua refund
  const fetchRefunds = useCallback(() => {
    let url = `${API_URL}/admin/refunds`;
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRefunds(data);
        } else if (Array.isArray(data.refunds)) {
          setRefunds(data.refunds);
        } else {
          console.warn("Data refunds tidak sesuai format:", data);
          setRefunds([]);
        }
      })
      .catch((err) => console.error("Gagal memuat refund:", err));
  }, [startDate, endDate]);

  // 🚀 Load data pertama kali
  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  // 📅 Format tanggal tampil rapi
  const formatTanggal = (tgl) => {
    if (!tgl) return "-";
    const d = new Date(tgl);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // 🎨 Warna label status
  const renderStatusLabel = (status) => {
    let className = "";
    if (status === "pending") className = "status-pending";
    if (status === "approved") className = "status-approved";
    if (status === "rejected") className = "status-rejected";
    return <span className={className}>{status}</span>;
  };

  return (
    <Sidebard>
      <div className="refund-admin">
        <h2>Daftar Refund Pembeli</h2>

        {/* === Filter tanggal === */}
        <div className="filter-refund">
          <label>Dari:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>Sampai:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button onClick={fetchRefunds}>Filter</button>
        </div>

        {/* === Tabel Refund === */}
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Pembeli</th>
              <th>Alasan Refund</th>
              <th>Deskripsi</th>
              <th>Status</th>
              <th>Tanggal Pengajuan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {refunds.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  Belum ada refund.
                </td>
              </tr>
            ) : (
              refunds.map((r, index) => (
                <tr key={r.id}>
                  <td>{index + 1}</td>
                  <td>{r.username}</td>
                  <td>{r.reason}</td>
                  <td>{r.description || "-"}</td>
                  <td>{renderStatusLabel(r.status)}</td>
                  <td>{formatTanggal(r.created_at)}</td>
                  <td>
                    <button
                      className="btn-detail"
                      onClick={() => navigate(`/admin/detail-refund/${r.id}`)}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Sidebard>
  );
};

export default RefundAdmin;
