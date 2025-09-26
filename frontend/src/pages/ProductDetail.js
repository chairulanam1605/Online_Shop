import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/ProductDetail.css";
import Footer from "../components/Footer";

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
      body: JSON.stringify({ user_id: userId, product_id: product.id, quantity: 1 }),
    }).then(() => alert("Produk ditambahkan ke keranjang!"));
  };

  if (!product) return <p>Loading...</p>;

  return (
    <>
      <div className="product-detail-container">
        <div className="product-detail-card">
          <div className="product-image-section">
            <img src={product.image_url} alt={product.name} className="main-image" />
          </div>

          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>
            <p className="product-price-details">Rp{parseInt(product.price).toLocaleString()}</p>
            <p className="product-desc">{product.description}</p>
            <p><strong>Kategori:</strong> {product.category_name}</p>
            <p><strong>Stock:</strong> {product.unit_label}</p>

            <button onClick={addToCart} className="add-to-cart-btn">Tambah ke Keranjang</button>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default ProductDetail;
