import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/TambahBarangMasuk.css";

const API_URL = "http://localhost/Online_Shop";

const TambahBarangMasuk = () => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([
    { product_id: "", quantity_incoming: "", date_incoming: "" },
  ]);
  const navigate = useNavigate();

  // Ambil daftar produk
  useEffect(() => {
    fetch(`${API_URL}/Admin/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Gagal memuat produk:", err));
  }, []);

  // Handler input perubahan
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...items];
    newItems[index][name] = value;
    setItems(newItems);
  };

  // Tambah baris input baru
  const addRow = () => {
    setItems([
      ...items,
      { product_id: "", quantity_incoming: "", date_incoming: "" },
    ]);
  };

  // Hapus baris input
  const removeRow = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Kirim data ke backend
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/Admin/tambah-barang-masuk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(items),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Barang masuk berhasil ditambahkan!");
          navigate("/admin/barang-masuk");
        } else {
          alert(`Gagal menambahkan barang: ${data.message}`);
        }
      })
      .catch((err) => {
        console.error("Kesalahan saat menyimpan data:", err);
        alert("Terjadi kesalahan saat menyimpan data.");
      });
  };

  return (
    <Sidebard>
      <div className="tambah-barang-masuk">
        <h2>Tambah Barang Masuk</h2>
        <form onSubmit={handleSubmit}>
          {items.map((item, index) => (
            <div key={index} className="row-item">
              <select
                name="product_id"
                value={item.product_id}
                onChange={(e) => handleChange(index, e)}
                required
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                name="quantity_incoming"
                placeholder="Jumlah Masuk"
                value={item.quantity_incoming}
                onChange={(e) => handleChange(index, e)}
                required
              />

              <input
                type="date"
                name="date_incoming"
                placeholder="Tanggal Masuk"
                value={item.date_incoming}
                onChange={(e) => handleChange(index, e)}
                required
              />

              {items.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeRow(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button type="button" className="add-row-btn" onClick={addRow}>
            + Tambah Produk
          </button>

          <button type="submit" className="submit-btn">
            Simpan Semua
          </button>
        </form>
      </div>
    </Sidebard>
  );
};

export default TambahBarangMasuk;