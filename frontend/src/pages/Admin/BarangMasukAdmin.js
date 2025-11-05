import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/BarangMasukAdmin.css";
import { FaPlus, FaCalendarAlt, FaFilter, FaArrowDown } from "react-icons/fa";

const API_URL = "http://localhost/Online_Shop";

const BarangMasukAdmin = () => {
  const [barangMasuk, setBarangMasuk] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  const fetchBarangMasuk = useCallback(() => {
    let url = `${API_URL}/Admin/barang-masuk`;
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => setBarangMasuk(data))
      .catch((err) => console.error("Gagal memuat barang masuk:", err));
  }, [startDate, endDate]);

  useEffect(() => {
    fetchBarangMasuk();
  }, [fetchBarangMasuk]);

  const formatTanggal = (tgl) => {
    if (!tgl) return "-";
    const tanggalObj = new Date(tgl);
    if (isNaN(tanggalObj)) return tgl;
    return tanggalObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Sidebard>
      <div className="barang-masuk-wrapper">
        <header className="barang-masuk-header">
          <div className="title-section-barang-masuk">
            <FaArrowDown className="header-icon-barang-masuk" />
            <div>
              <h2>Data Barang Masuk</h2>
              <p>Kelola dan pantau stok barang masuk dengan mudah</p>
            </div>
          </div>

          <button
            className="tambah-barang-masuk-btn"
            onClick={() => navigate("/admin/tambah-barang-masuk")}
          >
            <FaPlus /> Tambah Barang Masuk
          </button>
        </header>

        <div className="filter-container-barang-masuk">
          <div className="filter-group-barang-masuk">
            <label>
              <FaCalendarAlt /> Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-group-barang-masuk">
            <label>
              <FaCalendarAlt /> Sampai
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button className="filter-barang-masuk-btn" onClick={fetchBarangMasuk}>
            <FaFilter /> Filter
          </button>
        </div>

        <div className="table-container-barang-masuk">
          <table className="modern-table-barang-masuk">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th>Jumlah Masuk</th>
                <th>Tanggal Masuk</th>
              </tr>
            </thead>
            <tbody>
              {barangMasuk.length > 0 ? (
                barangMasuk.map((bm, index) => (
                  <tr key={bm.id}>
                    <td>{index + 1}</td>
                    <td>{bm.product_name}</td>
                    <td>{bm.quantity_incoming}</td>
                    <td>{formatTanggal(bm.date_incoming)}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row-barang-masuk">
                  <td colSpan="4">Tidak ada data barang masuk</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Sidebard>
  );
};

export default BarangMasukAdmin;
