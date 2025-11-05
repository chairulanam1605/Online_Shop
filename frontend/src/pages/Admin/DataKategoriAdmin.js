import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/DataKategoriAdmin.css";
import { FaTags, FaPlus, FaTrash } from "react-icons/fa";

const API_URL = "http://localhost/Online_Shop";

const DataKategoriAdmin = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const handleHapus = (id) => {
    if (window.confirm("Yakin ingin menghapus kategori ini?")) {
      fetch(`${API_URL}/Admin/hapus-kategori/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => {
          alert("Kategori berhasil dihapus!");
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
      <div className="kategori-wrapper">
        <header className="kategori-header">
          <div className="kategori-title">
            <FaTags className="kategori-icon" />
            <div>
              <h2>Data Kategori</h2>
              <p>Kelola daftar kategori produk yang tersedia</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/tambah-kategori")}
            className="tambah-kategori-btn"
          >
            <FaPlus /> Tambah Kategori
          </button>
        </header>

        <div className="kategori-table-container">
          <table className="kategori-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Kategori</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.length > 0 ? (
                categories.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.name}</td>
                    <td>
                      <button
                        className="hapus-btn"
                        onClick={() => handleHapus(item.id)}
                      >
                        <FaTrash /> Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan="3">Belum ada data kategori</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Sidebard>
  );
};

export default DataKategoriAdmin;
