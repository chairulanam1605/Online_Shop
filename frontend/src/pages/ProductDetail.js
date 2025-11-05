// src/pages/ProductDetail.js
import React, { useEffect, useState } from "react";
import { BsCart4 } from "react-icons/bs";
import { useParams } from "react-router-dom";
import "../styles/ProductDetail.css";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost/Online_Shop";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data));
  }, [id]);

  const addToCart = () => {
    const userId = localStorage.getItem("user_id");
    fetch(`${API_URL}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        product_id: product.id,
        quantity: 1,
      }),
    }).then(() => alert("Produk ditambahkan ke keranjang!"));
  };

  if (!product) return <p>Memuat detail produk...</p>;

  return (
    <>
      <Navbar />
      <div className="product-detail-page">
        <div className="product-card-detail">
          {/* Gambar Produk */}
          <div className="product-image">
            <img
              src={product.image_url}
              alt={product.name}
              className="main-image"
            />
          </div>

          {/* Informasi Produk */}
          <div className="product-info">
            <h1 className="product-name">{product.name}</h1>
            <h2 className="product-price">
              Rp {parseInt(product.price).toLocaleString("id-ID")}
            </h2>

            <p className="product-description">{product.description}</p>

            <div className="product-meta">
              <p>
                <strong>Kategori:</strong> {product.category_name}
              </p>
              <p>
                <strong>Stok:</strong> {product.unit_label}
              </p>
            </div>

            <button onClick={addToCart} className="btn-add-cart">
              <BsCart4 size={25}/>Tambah ke Keranjang
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductDetail;
