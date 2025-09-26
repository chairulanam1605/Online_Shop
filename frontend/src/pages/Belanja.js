import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_URL = "http://localhost/Online_Shop";

const Belanja = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filterOption, setFilterOption] = useState("");
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const loadProducts = () => {
    fetch(`${API_URL}/products?search=${search}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setFilteredProducts(data);

        // Ambil semua kategori unik
        const uniqueCategories = [
          ...new Set(data.map((item) => item.category_name || "Lainnya")),
        ];
        setCategories(uniqueCategories);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts();
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let sorted = [...products];

    if (filterOption === "murah") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (filterOption === "mahal") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (categories.includes(filterOption)) {
      sorted = products.filter((p) => p.category_name === filterOption);
    }

    setFilteredProducts(sorted);
  }, [filterOption, products]);

  const addToCart = (product_id) => {
    const userId = localStorage.getItem("user_id");
    fetch(`${API_URL}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, product_id, quantity: 1 }),
    }).then(() => alert("Produk ditambahkan ke keranjang!"));
  };

  return (
    <div className="main-container">
      <Navbar />

      {/* Search Bar */}
      <div className="search-container" style={{padding : 20}}>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Masukkan pencarian"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Dropdown */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingRight:"40px", marginBottom: "20px" }}>
        <select
          className="filter-dropdown"
          value={filterOption}
          onChange={(e) => setFilterOption(e.target.value)}
        >
          <option value="">-- Filter Produk --</option>
          <option value="murah">Harga Termurah</option>
          <option value="mahal">Harga Termahal</option>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="product-grid">
        {filteredProducts.map((p) => (
          <div key={p.id} className="product-card">
            <img
              src={p.image_url || "https://via.placeholder.com/200"}
              alt={p.name}
            />
            <h3>{p.name}</h3>
            <div className="rating">
              {(() => {
                const rating = parseFloat(p.rating) || 0; // pastikan number
                return (
                  <>
                    {"★".repeat(Math.round(rating))}
                    {"☆".repeat(5 - Math.round(rating))}
                    <span style={{ marginLeft: "5px", fontSize: "0.9em", color: "black"}}>
                      ({rating.toFixed(1)})
                    </span>
                  </>
                );
              })()}
            </div>
            <p className="product-price">Rp{parseInt(p.price).toLocaleString()}</p>
            <div className="product-buttons">
              <button onClick={() => addToCart(p.id)} className="btn-primary">
                Tambah Keranjang
              </button>
              <button onClick={() => navigate(`/products/${p.id}`)} className="btn-secondary">Detail</button>
            </div>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default Belanja;
