// src/pages/admin/DataProdukAdmin.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/DataProdukAdmin.css"

const API_URL = "http://localhost/Online_Shop"; // sesuaikan

const DataProdukAdmin = () => {
  const [products, setProduk] = useState([]);
  const navigate = useNavigate();

  // Ambil data produk
  const fetchProducts = () => {
    fetch(`${API_URL}/Admin/products`)
      .then((res) => res.json())
      .then((data) =>{
        setProduk(data);
      })
      .catch((err) => console.error("Gagal memuat data produk:", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Hapus produk
  const handleDelete = (id) => {
    if (window.confirm("Yakin ingin menghapus produk ini?")) {
      fetch(`${API_URL}/Admin/delete-produk/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message) {
            alert(data.message);
            fetchProducts(); // refresh data setelah hapus
          } else {
            alert(data.error || "Gagal menghapus produk");
          }
        })
        .catch((err) => console.error("Gagal menghapus produk:", err));
    }
  };


  return (
    <Sidebard>
      <div className="data-produk">
        <h2>Data Produk</h2>
        <button 
          onClick={() => navigate("/admin/tambah-produk")} 
          className="tambah-barang-btn"
        >
          + Tambah Barang
        </button>
        <table>
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
            {products.map((items, index) => (
              <tr key={items.id}>
                <td>{index + 1}</td>
                <td>{items.name}</td>
                <td>{items.category_name}</td>
                <td>{items.description}</td>
                <td>Rp {parseInt(items.price).toLocaleString()}</td>
                <td>{items.unit_label}</td>
                <td>
                  <img
                    src={items.image_url}
                    alt={items.name}
                    width="60"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/60"; }}
                  />
                </td>
                <td className="aksi">
                  <button 
                    className="edit-btn" 
                    onClick={() => navigate(`/admin/edit-produk/${items.id}`)}
                  >
                    Edit
                  </button>
                  <button 
                    className="hapus-btn" 
                    onClick={() => handleDelete(items.id)}
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

export default DataProdukAdmin;
