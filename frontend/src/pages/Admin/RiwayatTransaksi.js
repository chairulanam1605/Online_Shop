import React, { useEffect, useState } from "react";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/RiwayatTransaksi.css";

const API_URL = "http://localhost/Online_Shop";

const RiwayatTransaksi = () => {
  const [riwayat, setRiwayat] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = () => {
    fetch(`${API_URL}/Admin/riwayat-transaksi`)
      .then((res) => res.json())
      .then((data) => {
        setRiwayat(data);
        setFiltered(data); // default: tampil semua
      })
      .catch((err) => console.error("Gagal memuat riwayat:", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilter = () => {
    if (!startDate || !endDate) {
      setFiltered(riwayat); // tampil semua jika tidak ada filter
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // sertakan tanggal akhir penuh

    const filteredData = riwayat.filter((item) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= start && itemDate <= end;
    });

    setFiltered(filteredData);
  };

  // === Tambahkan fungsi format tanggal ===
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
      <div className="riwayat-container">
        <h2>Riwayat Transaksi</h2>

        {/* Filter Tanggal */}
        <div className="filter-date">
          <label>Dari: </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>Sampai: </label>
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
              <th>ID Transaksi</th>
              <th>Nama Pelanggan</th>
              <th>Tanggal</th>
              <th>Produk</th>
              <th>Jumlah</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr key={index}>
                <td>{item.transaction_id}</td>
                <td>{item.user_name}</td>
                {/* Ubah bagian tanggal */}
                <td>{formatTanggal(item.created_at)}</td>
                <td>{item.product_name}</td>
                <td>{parseInt(item.quantity)}</td>
                <td>Rp.{item.price * item.quantity}</td>
                <td>
                  <span
                    className={`status-badge-admin status-${item.status?.toLowerCase()}`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebard>
  );
};

export default RiwayatTransaksi;
