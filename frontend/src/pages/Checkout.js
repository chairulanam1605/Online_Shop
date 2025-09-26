import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Checkout.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_URL = "http://localhost/Online_Shop";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Ambil user_id dan paymentMethod dari localStorage atau state yang dikirim dari Cart
  const user_id = localStorage.getItem("user_id");
  const paymentMethod = location.state?.paymentMethod || "cod";

  const [checkoutData, setCheckoutData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/checkout/${user_id}`)
      .then((res) => res.json())
      .then((data) => setCheckoutData(data))
      .catch(() => setError("Gagal memuat data checkout"));
  }, [user_id]);

  const handleConfirm = async () => {
    try {
      const response = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id,
          name: checkoutData.user.name,
          address: checkoutData.user.address,
          payment_method: paymentMethod,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("Pesanan berhasil dikonfirmasi!");
        navigate("/");
      } else {
        setError(result.message || "Checkout gagal");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat konfirmasi pesanan");
    }
  };

  if (!checkoutData) {
    return (
      <div>
        <Navbar />
        <p style={{ padding: 20 }}>Memuat data checkout...</p>
      </div>
    );
  }

  return (
    <div className="main-checkout-container">
      <Navbar />
      <div style={{flex: 1}}>
        <div className="checkout-container">
          <h2>Konfirmasi Pesanan</h2>
          {error && <p className="error-text">{error}</p>}

          {/* Data User */}
          <div className="checkout-card">
            <p><strong>Nama Pembeli:</strong> {checkoutData.user.name}</p>
            <p><strong>Alamat:</strong> {checkoutData.user.address}</p>
          </div>

          {/* Barang yang dibeli */}
          <div className="checkout-card">
            <h3>Barang yang Dibeli:</h3>
            <ul className="checkout-list">
              {checkoutData.items.map((item, index) => (
                <li key={index}>
                  <span>{item.name} ({parseInt(item.quantity)} x)</span>
                  <strong>Rp{(item.price * item.quantity).toLocaleString()}</strong>
                </li>
              ))}
            </ul>
          </div>

          {/* Total Harga */}
          <div className="checkout-total">
            <h3>Total yang harus dibayar: <span>Rp{checkoutData.total_price.toLocaleString()}</span></h3>
          </div>

          {/* Metode Pembayaran */}
          <div className="checkout-card">
            <p><strong>Metode Pembayaran:</strong> {paymentMethod.toUpperCase()}</p>
          </div>

          <button onClick={handleConfirm} className="btn-primary-checkout">
            Konfirmasi Pesanan
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
