import React, { useEffect, useState } from "react";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/BarangKeluarAdmin.css";
import { FaCalendarAlt, FaFilter, FaArrowUp } from "react-icons/fa";

const API_URL = "http://localhost/Online_Shop";

const BarangKeluarAdmin = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/Admin/barang-keluar`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setFilteredData(data);
      })
      .catch((err) => console.error("Gagal memuat data barang keluar:", err));
  }, []);

  const handleFilter = () => {
    if (!startDate || !endDate) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => {
      const itemDate = new Date(item.date_outgoing);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      return itemDate >= start && itemDate <= end;
    });

    setFilteredData(filtered);
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Sidebard>
      <div className="barang-keluar-wrapper">
        <header className="barang-keluar-header">
          <div className="title-section-barang-keluar">
            <FaArrowUp className="header-icon-barang-keluar" />
            <div>
              <h2>Data Barang Keluar</h2>
              <p>Kelola dan pantau aktivitas barang keluar dengan mudah</p>
            </div>
          </div>
        </header>

        <div className="filter-container-barang-keluar">
          <div className="filter-group-barang-keluar">
            <label>
              <FaCalendarAlt /> Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-group-barang-keluar">
            <label>
              <FaCalendarAlt /> Sampai
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button className="filter-barang-keluar-btn" onClick={handleFilter}>
            <FaFilter /> Filter
          </button>
        </div>

        <div className="table-container-barang-keluar">
          <table className="modern-table-barang-keluar">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th>Jumlah Keluar</th>
                <th>Tanggal Keluar</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.product_name}</td>
                    <td>{item.quantity_outgoing}</td>
                    <td>{formatTanggal(item.date_outgoing)}</td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row-barang-keluar">
                  <td colSpan="4">
                    Tidak ada data barang keluar dalam rentang tanggal yang dipilih
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Sidebard>
  );
};

export default BarangKeluarAdmin;
