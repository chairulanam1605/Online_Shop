import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Cart.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_URL = "http://localhost/Online_Shop";

const getUserId = () => localStorage.getItem("user_id");

const Cart = () => {
  const userId = getUserId();
  const [cart, setCart] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const navigate = useNavigate();

  const loadCart = () => {
    fetch(`${API_URL}/cart?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setCart(data));
  };

  const removeFromCart = (id) => {
    fetch(`${API_URL}/cart/${id}`, { method: "DELETE" }).then(loadCart);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;

    fetch(`${API_URL}/carts/update/${id}`, {
      method: "POST", // ganti dari PUT ke POST
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQuantity }),
    }).then(loadCart);
  };


  useEffect(() => {
    loadCart();
  },);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    // Simpan metode pembayaran yang dipilih ke localStorage agar dibaca di Checkout.js
    localStorage.setItem("payment_method", selectedPayment);
    navigate("/checkout"); // redirect ke halaman checkout
  };

  return (
    <>
      <Navbar />
      <div style={{marginTop: 70}}>      
        <div className="cart-container">
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-card" key={item.id}>
                <input type="checkbox" />
                <img
                  src={item.image_url}
                  alt={item.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/200"; // fallback kalau error
                  }}
                />
                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p className="price">Rp{item.price.toLocaleString()}</p>
                  <p>Jumlah : {item.unit_label}</p>
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(item.id, parseInt(item.quantity) - 1)}>-</button>
                    <span>{parseInt(item.quantity)}</span>
                    <button onClick={() => updateQuantity(item.id, parseInt(item.quantity) + 1)}>+</button>
                  </div>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => removeFromCart(item.id)}
                  title="Hapus"
                >
                  <span role="img" aria-label="hapus">🗑️</span>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="payment-method">
              <h4>Metode Pembayaran</h4>
              <label>
                <input
                  type="checkbox"
                  name="payment"
                  checked={selectedPayment === "cod"}
                  onChange={() => setSelectedPayment("cod")}
                />
                Cash on Delivery
                <span className="payment-type">COD</span>
              </label>
            </div>

            <div className="summary-box">
              <h5>Ringkasan Pembayaran</h5>
              <p>
                Subtotal harga <span>Rp{total.toLocaleString()}</span>
              </p>
              <p>
                Subtotal pembayaran <span>Rp{total.toLocaleString()}</span>
              </p>
              <button className="checkout-btn" onClick={handleCheckout}>
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
