import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BsTrashFill } from "react-icons/bs";
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

  // Gunakan useCallback agar fungsi tidak berubah di setiap render
  const loadCart = useCallback(() => {
    fetch(`${API_URL}/cart?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Gagal memuat keranjang:", err));
  }, [userId]);

  const removeFromCart = (id) => {
    fetch(`${API_URL}/cart/${id}`, { method: "DELETE" })
      .then(loadCart)
      .catch((err) => console.error("Gagal menghapus item:", err));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;

    fetch(`${API_URL}/carts/update/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQuantity }),
    })
      .then(loadCart)
      .catch((err) => console.error("Gagal memperbarui jumlah:", err));
  };

  // Sekarang dependensi aman karena loadCart stabil
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = () => {
    localStorage.setItem("payment_method", selectedPayment);
    navigate("/checkout");
  };

  return (
    <>
      <Navbar />
      <div className="cart-page">
        <div className="cart-container">
          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Keranjang kamu masih kosong 😅</p>
            ) : (
              cart.map((item) => (
                <div className="cart-card" key={item.id}>
                  <img
                    src={item.image_url || "https://via.placeholder.com/200"}
                    alt={item.name}
                    className="cart-image"
                  />
                  <div className="cart-info">
                    <h4>{item.name}</h4>
                    <p className="price">Rp{item.price.toLocaleString()}</p>
                    <p className="unit">Satuan: {item.unit_label}</p>
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, parseInt(item.quantity) - 1)
                        }
                      >
                        -
                      </button>
                      <span>{parseInt(item.quantity)}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, parseInt(item.quantity) + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => removeFromCart(item.id)}
                    title="Hapus"
                  >
                    <BsTrashFill size={20}/>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="cart-summary">
            <div className="payment-method">
              <h4>Metode Pembayaran</h4>
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={selectedPayment === "cod"}
                  onChange={() => setSelectedPayment("cod")}
                />
                <span>Cash on Delivery (COD)</span>
              </label>
            </div>

            <div className="summary-box">
              <h5>Ringkasan Pembayaran</h5>
              <p>
                Subtotal harga <span>Rp{total.toLocaleString()}</span>
              </p>
              <p className="total">
                Total Pembayaran <span>Rp{total.toLocaleString()}</span>
              </p>
              <button
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Checkout Sekarang
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
