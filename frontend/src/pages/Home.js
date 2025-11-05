import React, { useEffect, useState, useCallback } from "react";
import Carousel from "../components/Carousel";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import "../styles/Home.css";

const API_URL = "http://localhost/Online_Shop";

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

  const loadProducts = useCallback(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const loadCart = useCallback(() => {
    fetch(`${API_URL}/cart?user_id=${userId}`).then((res) => res.json());
  }, [userId]);

  useEffect(() => {
    loadProducts();
    loadCart();
  }, [loadProducts, loadCart]);

  return (
    <div className="home-container">
      <Carousel />
      {Object.entries(
        products.reduce((acc, item) => {
          const category = item.category_name || "Lainnya";
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        }, {})
      ).map(([category, items]) => (
        <section key={category} className="home-section">
          <div className="section-header">
            <h2 className="section-title">{category}</h2>
            <button
              className="see-all-btn"
              onClick={() => navigate("/belanja")}
            >
              Lihat Semua
            </button>
          </div>

          <div className="product-grid-home">
            {items.map((p) => (
              <div
                key={p.id}
                className="product-card clickable-card"
                onClick={() => navigate(`/products/${p.id}`)}
              >
                <img
                  src={p.image_url || "https://via.placeholder.com/200"}
                  alt={p.name}
                />
                <div className="rating">
                  {"★".repeat(Math.round(p.rating || 0))}
                  {"☆".repeat(5 - Math.round(p.rating || 0))}
                  <span className="rating-text">
                    ({(parseFloat(p.rating) || 0).toFixed(1)})
                  </span>
                </div>
                <h3 className="product-name-card">{p.name}</h3>
                <p className="product-price-card-home">
                  Rp{parseInt(p.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
      <Footer />
    </div>
  );
};

export default Home;
