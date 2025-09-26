import React, { useEffect, useState } from "react";
import Carousel from "../components/Carousel";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../App.css";

const API_URL = "http://localhost/Online_Shop";

// Simpan user_id user di localStorage
const getUserId = () => {
  let id = localStorage.getItem("user_id");
  if (!id) {
    id = Math.random().toString(36).substr(2, 9);
    localStorage.setItem("user_id", id);
  }
  return id;
};

const Home = () => {
  const userId = getUserId();
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const loadProducts = () => {
  fetch(`${API_URL}/products`)
    .then((res) => res.json())
    .then((data) => setProducts(data));
};

  const loadCart = () => {
    fetch(`${API_URL}/cart?user_id=${userId}`)
      .then((res) => res.json())
  };

  const addToCart = (product_id) => {
    const userId = localStorage.getItem("user_id");
    fetch(`${API_URL}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, product_id, quantity: 1 }),
    }).then(() => alert("Produk ditambahkan ke keranjang!"));
  };

  useEffect(() => {
    loadProducts();
    loadCart();
  },);

  return (
    <div className="main-container">
          <Carousel />
            {Object.entries(
              products.reduce((acc, item) => {
                  const category = item.category_name || "Lainnya";
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(item);
                  return acc;
              }, {})

            ).map(([category, items]) => (
              <div key={category} className="category-section">
                <div className="category-header">
                  <h2 className="category-title">{category}</h2>
                  <button className="see-all-button" onClick={() => navigate("/belanja")}>
                    Lihat Semua
                  </button>
                </div>
                <div className="product-grid">
                  {items.map((p) => (
                    <div key={p.id} className="product-card">
                      <img src={p.image_url || "https://via.placeholder.com/200"} alt={p.name} />
                      <h3>{p.name}</h3>
                      <div className="rating">
                        {(() => {
                          const rating = parseFloat(p.rating) || 0;
                          return (
                            <>
                              {"★".repeat(Math.round(rating))}
                              {"☆".repeat(5 - Math.round(rating))}
                              <span style={{ marginLeft: "5px", fontSize: "0.9em", color:"black" }}>
                                ({rating.toFixed(1)})
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <p className="product-price">Rp{parseInt(p.price).toLocaleString()}</p>
                      <div className="product-buttons">
                        <button onClick={() => addToCart(p.id)} className="btn-primary">Tambah Keranjang</button>
                        <button onClick={() => navigate(`/products/${p.id}`)} className="btn-secondary">Detail</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
      <Footer/>
    </div>
  );
};

export default Home;
