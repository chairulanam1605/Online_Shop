import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/BarangMasukAdmin.css";

const API_URL = "http://localhost/Online_Shop";

const BarangMasukAdmin = () => {
  const [barangMasuk, setBarangMasuk] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  const fetchBarangMasuk = () => {
    let url = `${API_URL}/Admin/barang-masuk`;
    if (startDate && endDate) {
      url += `?start=${startDate}&end=${endDate}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => setBarangMasuk(data))
      .catch((err) => console.error("Gagal memuat barang masuk:", err));
  };

  useEffect(() => {
    fetchBarangMasuk();
  }, [startDate, endDate]);

  return (
    <Sidebard>
      <div className="barang-masuk">
        <h2>Barang Masuk</h2>

        <div className="filter-container">
          <label>Filter Tanggal:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span>sampai</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="filter-btn" onClick={fetchBarangMasuk}>
            Filter
          </button>
        </div>

        <button
          className="tambah-barang-btn"
          onClick={() => navigate("/admin/tambah-barang-masuk")}
        >
          + Tambah Barang Masuk
        </button>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Produk</th>
              <th>Jumlah Masuk</th>
              <th>Tanggal Masuk</th>
            </tr>
          </thead>
          <tbody>
            {barangMasuk.map((bm, index) => (
              <tr key={bm.id}>
                <td>{index + 1}</td>
                <td>{bm.product_name}</td>
                <td>{bm.quantity_incoming}</td>
                <td>{bm.date_incoming}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebard>
  );
};

export default BarangMasukAdmin;