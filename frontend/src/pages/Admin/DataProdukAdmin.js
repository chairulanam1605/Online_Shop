import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/DataProdukAdmin.css";
import { FaBoxOpen, FaPlus, FaTrash, FaEdit } from "react-icons/fa";

const API_URL = "http://localhost/Online_Shop";

const DataProdukAdmin = () => {
  const [products, setProduk] = useState([]);
  const navigate = useNavigate();

  const fetchProducts = () => {
    fetch(`${API_URL}/Admin/products`)
      .then((res) => res.json())
      .then((data) => setProduk(data))
      .catch((err) => console.error("Gagal memuat data produk:", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Yakin ingin menghapus produk ini?")) {
      fetch(`${API_URL}/Admin/delete-produk/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message) {
            alert(data.message);
            fetchProducts();
          } else {
            alert(data.error || "Gagal menghapus produk");
          }
        })
        .catch((err) => console.error("Gagal menghapus produk:", err));
    }
  };

  return (
    <Sidebard>
      <div className="produk-wrapper">
        <header className="produk-header">
          <div className="produk-title">
            <FaBoxOpen className="produk-icon" />
            <div>
              <h2>Data Produk</h2>
              <p>Kelola daftar produk dan informasi stok</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/tambah-produk")}
            className="tambah-produk-btn"
          >
            <FaPlus /> Tambah Produk
          </button>
        </header>

        <div className="produk-table-container">
          <table className="produk-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Kategori</th>
                <th>Deskripsi</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Gambar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((items, index) => (
                  <tr key={items.id}>
                    <td>{index + 1}</td>
                    <td>{items.name}</td>
                    <td>{items.category_name}</td>
                    <td className="deskripsi">{items.description}</td>
                    <td>Rp {parseInt(items.price).toLocaleString("id-ID")}</td>
                    <td>{items.unit_label}</td>
                    <td>
                      <img
                        src={items.image_url}
                        alt={items.name}
                        className="produk-image"
                        onError={(e) =>
                          (e.target.src = "https://via.placeholder.com/60")
                        }
                      />
                    </td>
                    <td className="aksi">
                      <button
                        className="edit-btn"
                        onClick={() => navigate(`/admin/edit-produk/${items.id}`)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="hapus-btn"
                        onClick={() => handleDelete(items.id)}
                      >
                        <FaTrash /> Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan="8">Belum ada data produk</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Sidebard>
  );
};

export default DataProdukAdmin;
