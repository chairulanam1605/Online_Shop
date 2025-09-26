import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/TambahKategori.css";

const API_URL = "http://localhost/Online_Shop"; // sesuaikan

const TambahKategori = () => {
  const [namaKategori, setNamaKategori] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(`${API_URL}/Admin/tambah-kategori`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: namaKategori }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Kategori berhasil ditambahkan!");
        navigate("/admin/kategori");
      })
      .catch((err) => {
        console.error("Gagal menambahkan kategori:", err);
        alert("Terjadi kesalahan.");
      });
  };

  return (
    <Sidebard>
      <div className="tambah-kategori">
        <h2>Tambah Kategori</h2>
        <form onSubmit={handleSubmit}>
          <label>Nama Kategori</label>
          <input
            type="text"
            value={namaKategori}
            onChange={(e) => setNamaKategori(e.target.value)}
            required
            placeholder="Contoh: Makanan"
          />
          <button type="submit">Simpan</button>
        </form>
      </div>
    </Sidebard>
  );
};

export default TambahKategori;
