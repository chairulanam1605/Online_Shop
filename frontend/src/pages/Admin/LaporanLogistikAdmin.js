// src/pages/admin/LaporanLogistikAdmin.js
import React, { useEffect, useState, useCallback } from "react";
import Sidebard from "../../components/Admin/Sidebar"; 
import "../../styles/Admin/LaporanLogistikAdmin.css";

const API_URL = "http://localhost/Online_Shop";

const LaporanLogistikAdmin = () => {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);

  // state filter
  const [filterNama, setFilterNama] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");

  // fungsi ambil data, dibungkus useCallback biar stabil referensinya
  const fetchLaporan = useCallback(() => {
    let url = `${API_URL}/admin/laporan-logistik`;
    const params = [];
    if (filterNama) params.push(`nama=${encodeURIComponent(filterNama)}`);
    if (filterTanggal) params.push(`tanggal=${filterTanggal}`);
    if (params.length > 0) url += `?${params.join("&")}`;

    setLoading(true);
    fetch(url, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setLaporan(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching laporan logistik:", err);
        setLoading(false);
      });
  }, [filterNama, filterTanggal]);

  // panggil saat pertama kali load
  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // Format tanggal jadi "1 Oktober 2025"
  const formatTanggal = (tgl) => {
    if (!tgl) return "-";
    return new Date(tgl).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Sidebard>
      <div className="laporan-container">
        <h1>Laporan Logistik</h1>

        {/* Filter */}
        <div className="filter-container">
          <input
            type="text"
            placeholder="Cari nama distributor..."
            value={filterNama}
            onChange={(e) => setFilterNama(e.target.value)}
          />
          <input
            type="date"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
          />
          <button onClick={fetchLaporan}>Filter</button>
        </div>

        {loading ? (
          <p>Sedang memuat data...</p>
        ) : laporan.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Distributor</th>
                <th>Total Terkirim</th>
                <th>Total Dikirim</th>
                <th>Belum Dikirim</th>
                <th>Refund</th>
              </tr>
            </thead>
            <tbody>
              {laporan.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{formatTanggal(row.tanggal)}</td>
                  <td>{row.distributor_name}</td>
                  <td>{row.total_terkirim}</td>
                  <td>{row.total_dikirim}</td>
                  <td>{row.total_belum_dikirim}</td>
                  <td>{row.total_refund}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Tidak ada data laporan logistik</p>
        )}
      </div>
    </Sidebard>
  );
};

export default LaporanLogistikAdmin;
