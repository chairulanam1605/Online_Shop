import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/StatusTransaksi.css";

const API_URL = "http://localhost/Online_Shop";

const StatusTransaksi = () => {
  const [riwayat, setRiwayat] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();



  const fetchData = () => {
    fetch(`${API_URL}/Admin/status-transaksi`)
      .then(res => res.json())
      .then(data => {
        setRiwayat(data);
        setFiltered(data); // default: tampil semua
      })
      .catch(err => console.error("Gagal memuat riwayat:", err));
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

  const updateStatus = (transactionId, newStatus) => {
  fetch(`${API_URL}/Admin/update-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_id: transactionId, status: newStatus }),
  })
    .then(res => res.json())
    .then(response => {
      if (response.success) {
        // Update kedua state: filtered & riwayat
        setRiwayat(prev =>
          prev.map(item =>
            item.transaction_id === transactionId ? { ...item, status: newStatus } : item
          )
        );
        setFiltered(prev =>
          prev.map(item =>
            item.transaction_id === transactionId ? { ...item, status: newStatus } : item
          )
        );
      } else {
        alert(response.message || "Gagal update status");
      }
    })
    .catch(() => alert("Terjadi kesalahan server"));
};
  return (
    <Sidebard>
      <div className="riwayat-container">
        <h2>Transaksi Terbaru</h2>

        {/* Filter Tanggal */}
        <div className="filter-date">
          <label>Dari: </label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>Sampai: </label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
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
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr key={index}>
                <td>{item.transaction_id}</td>
                <td>{item.user_name}</td>
                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                <td>{item.product_name}</td>
                <td>{parseInt(item.quantity)}</td>
                <td>Rp.{item.price * item.quantity}</td>
                <td>
                    <select
                    className={`status-dropdown status-${item.status}`}
                    value={item.status}
                    onChange={(e) => updateStatus(item.transaction_id, e.target.value)}
                    >
                        <option value="Dipesan">Dipesan</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Dikirim">Dikirim</option>
                        <option value="Completed">Completed</option>
                    </select>

                </td>
                <td>
                  <button className="btn" onClick={()=> navigate(`/admin/status-transaksi/${item.transaction_id}`)}>
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebard>
  );
};

export default StatusTransaksi;