import React, { useEffect, useState } from "react";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/BarangKeluarAdmin.css";

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
      end.setDate(end.getDate() + 1); // Tambahkan 1 hari agar rentang tanggal mencakup hari terakhir
      return itemDate >= start && itemDate <= end;
    });

    setFilteredData(filtered);
  };

  return (
    <Sidebard>
      <div className="data-barang-keluar">
        <h2>Data Barang Keluar</h2>

        <div className="filter-container">
          <label>Filter Tanggal: </label>
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
          <button onClick={handleFilter}>Filter</button>
        </div>

        <table>
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
                  <td>{item.date_outgoing}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">
                  Tidak ada data barang keluar dalam rentang tanggal yang
                  dipilih
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Sidebard>
  );
};

export default BarangKeluarAdmin;