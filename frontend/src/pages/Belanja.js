import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BsSearch } from "react-icons/bs";
import "../styles/Belanja.css";
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

  const loadProducts = useCallback(() => {
    fetch(`${API_URL}/products?search=${search}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setFilteredProducts(data);
        const uniqueCategories = [
          ...new Set(data.map((item) => item.category_name || "Lainnya")),
        ];
        setCategories(uniqueCategories);
      });
  }, [search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
  }, [filterOption, products, categories]);

  return (
    <div className="belanja-wrapper">
      <Navbar />

      <main className="belanja-container">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <span className="search-icon">
              <BsSearch size={24} />
            </span>
            <input
              type="text"
              placeholder="Masukkan pencarian"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="filter-belanja-container">
          <select
            className="filter-belanja-dropdown"
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
          >
            <option value="">-- Filter Produk --</option>
            <option value="murah">Harga Termurah</option>
            <option value="mahal">Harga Termahal</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Product Grid */}
        <div className="product-grid-belanja">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="product-card"
              onClick={() => navigate(`/products/${p.id}`)}
            >
              <img
                src={p.image_url || "https://via.placeholder.com/200"}
                alt={p.name}
              />
              <div className="rating">
                {(() => {
                  const rating = parseFloat(p.rating) || 0;
                  return (
                    <>
                      {"★".repeat(Math.round(rating))}
                      {"☆".repeat(5 - Math.round(rating))}
                      <span>({rating.toFixed(1)})</span>
                    </>
                  );
                })()}
              </div>
              <h3>{p.name}</h3>
              <p className="product-price-card-shop">
                Rp{parseInt(p.price).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Belanja;
 