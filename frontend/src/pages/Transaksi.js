import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Transaksi.css";

const API_URL = "http://localhost/Online_Shop";

const Transaksi = () => {
  const user_id = localStorage.getItem("user_id");
  const [pesanan, setPesanan] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Semua");

  useEffect(() => {
    fetch(`${API_URL}/riwayat-transaksi/${user_id}`)
      .then((res) => res.json())
      .then((data) => setPesanan(data))
      .catch(() => console.log("Gagal mengambil data"));
  }, [user_id]);

  const beriRating = (transaction_id, product_id, rating) => {
    fetch(`${API_URL}/beri-rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction_id, product_id, rating }),
    })
      .then((res) => res.json())
      .then(() => {
        alert("Terima kasih atas ratingnya!");
        setPesanan((prev) =>
          prev.map((p) =>
            p.transaction_id === transaction_id && p.product_id === product_id
              ? { ...p, rating }
              : p
          )
        );
      });
  };

  const filterPesanan =
    filterStatus === "Semua"
      ? pesanan
      : pesanan.filter((p) => p.status === filterStatus);

  return (
    <div>
      <Navbar />
      <div className="transaksi-container">
        {/* Tab Filter */}
        <div className="transaksi-tabs">
          {["Semua", "Dipesan", "Diproses", "Dikirim", "Completed"].map((status) => (
            <button
              key={status}
              className={filterStatus === status ? "active" : ""}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>

        {/* List Pesanan */}
        <div className="transaksi-list">
          {filterPesanan.length === 0 ? (
            <p className="empty">Belum ada pesanan</p>
          ) : (
            filterPesanan.map((p, index) => (
              <div key={index} className="transaksi-card">
                <div className="transaksi-header">
                  <span className="toko">Warung Bu Roisah</span>
                  <span className={`status ${p.status.toLowerCase()}`}>{p.status}</span>
                </div>

                <div className="produk">
                  <img src={p.image_url || "https://via.placeholder.com/80"} alt={p.product_name} />
                  <div className="info">
                    <p className="nama">{p.product_name}</p>
                    <p className="qty">{parseInt(p.quantity)}</p>
                    <p className="harga">Rp{parseInt(p.price).toLocaleString()}</p>
                  </div>
                </div>

                <div className="transaksi-footer">
                  <p className="total">
                    Total: <strong>Rp{parseInt(p.total_price).toLocaleString()}</strong>
                  </p>

                  {/* Rating */}
                  {p.status === "Completed" ? (
                    p.rating ? (
                      <div className="rating">
                        {"⭐".repeat(p.rating)}{"☆".repeat(5 - p.rating)}
                      </div>
                    ) : (
                      <div className="rating-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{ cursor: "pointer", fontSize: "20px" }}
                            onClick={() => beriRating(p.transaction_id, p.product_id, star)}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Transaksi;
