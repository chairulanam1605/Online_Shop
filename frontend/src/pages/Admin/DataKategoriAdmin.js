// src/pages/admin/DataKategoriAdmin.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/DataKategoriAdmin.css"; // pastikan kamu buat file ini

const API_URL = "http://localhost/Online_Shop"; // sesuaikan dengan base URL backend

const DataKategoriAdmin = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const handleHapus = (id) => {
    if (window.confirm("Yakin ingin menghapus kategori ini?")) {
      fetch(`${API_URL}/Admin/hapus-kategori/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          alert("Kategori berhasil dihapus!");
          // perbarui data kategori
          setCategories(categories.filter((k) => k.id !== id));
        })
        .catch((err) => {
          console.error("Gagal menghapus kategori:", err);
          alert("Terjadi kesalahan saat menghapus kategori.");
        });
    }
  };


  useEffect(() => {
    fetch(`${API_URL}/Admin/categories`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Data kategori:", data);
        setCategories(data);
      })
      .catch((err) => console.error("Gagal memuat data kategori:", err));
  }, []);

  return (
    <Sidebard>
      <div className="data-kategori">
        <h2>Data Kategori</h2>
        <button
          onClick={() => navigate("/admin/tambah-kategori")}
          className="tambah-kategori-btn"
        >
          + Tambah Kategori
        </button>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Kategori</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>
                  <button
                    className="hapus-btn"
                    onClick={() => handleHapus(item.id)}
                  >
                    Hapus
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

export default DataKategoriAdmin;
