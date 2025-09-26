// src/pages/admin/TambahProduk.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/TambahProduk.css";

const API_URL = "http://localhost/Online_Shop";

const TambahProduk = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    unit_type: "satuan",
    image_url: null,
  });

  useEffect(() => {
    fetch(`${API_URL}/Admin/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Gagal ambil kategori:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    Object.entries(formData).forEach(([key, val]) => payload.append(key, val));

    try {
      const res = await fetch(`${API_URL}/Admin/tambah-produk`, {
        method: "POST",
        body: payload,
      });

      if (!res.ok) throw new Error("Gagal menyimpan produk");

      const data = await res.json();
      alert(data.message || "Produk berhasil ditambahkan");
      navigate("/admin/products");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan produk");
    }
  };

  return (
    <Sidebard>
      <div className="tambah-produk">
        <h2>Tambah Produk</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <label>Nama Produk:</label>
          <input type="text" name="name" onChange={handleChange} required />

          <label>Kategori:</label>
          <select name="category" onChange={handleChange} required>
            <option value="">-- Pilih Kategori --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <label>Deskripsi:</label>
          <textarea name="description" onChange={handleChange} required />

          <label>Harga:</label>
          <input type="number" name="price" onChange={handleChange} required />

          <label>Tipe Satuan:</label>
          <select name="unit_type" onChange={handleChange} required>
            <option value="satuan">Satuan</option>
            <option value="berat">Berat</option>
          </select>

          <label>Gambar Produk:</label>
          <input type="file" name="image_url" accept="image/*" onChange={handleChange} required />

          <button type="submit" className="submit-btn">Tambah Produk</button>
        </form>
      </div>
    </Sidebard>
  );
};

export default TambahProduk;
