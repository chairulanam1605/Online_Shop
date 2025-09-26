// src/pages/admin/EditProduk.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/TambahProduk.css";

const API_URL = "http://localhost/Online_Shop"; // sesuaikan dengan backend

const EditProduk = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    unit_type: "satuan",
    unit_label: "",
    image_url: null,
  });

  // Ambil kategori
  useEffect(() => {
    fetch(`${API_URL}/Admin/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Gagal memuat kategori:", err));
  }, []);

  // Ambil data produk berdasarkan ID
  useEffect(() => {
    fetch(`${API_URL}/Admin/get-produk/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          name: data.name,
          category: data.category,
          description: data.description,
          price: data.price,
          unit_type: data.unit_type,
          unit_label: data.unit_label,
          image_url: null, // tidak langsung tampilkan file
        });
      })
      .catch((err) => console.error("Gagal memuat produk:", err));
  }, [id]);

  // Handle input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (e.target.type === "file") {
      setFormData({ ...formData, image_url: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Submit form update
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("category", formData.category);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("unit_type", formData.unit_type);
    data.append("unit_label", formData.unit_label);
    if (formData.image_url) {
      data.append("image_url", formData.image_url);
    }

    fetch(`${API_URL}/Admin/update-produk/${id}`, {
      method: "POST",
      body: data,
    })
      .then((res) => res.json())
      .then((res) => {
        alert(res.message);
        navigate("/admin/products");
      })
      .catch((err) => console.error("Gagal update produk:", err));
  };

  return (
    <Sidebard>
      <div className="tambah-produk">
        <h2>Edit Produk</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <label>Nama Produk:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Kategori:</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">-- Pilih Kategori --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <label>Deskripsi:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />

          <label>Harga:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />

          <label>Stok:</label>
          <input
            type="text"
            name="unit_label"
            value={formData.unit_label}
            onChange={handleChange}
            required
          />

          <label>Tipe Satuan:</label>
          <select
            name="unit_type"
            value={formData.unit_type}
            onChange={handleChange}
            required
          >
            <option value="satuan">Satuan</option>
            <option value="berat">Berat</option>
          </select>

          <label>Gambar Produk (opsional):</label>
          <input
            type="file"
            name="image_url"
            accept="image/*"
            onChange={handleChange}
          />

          <button type="submit" className="submit-btn" style={{backgroundColor : "green"}}>
            Simpan Perubahan
          </button>
        </form>
      </div>
    </Sidebard>
  );
};

export default EditProduk;
