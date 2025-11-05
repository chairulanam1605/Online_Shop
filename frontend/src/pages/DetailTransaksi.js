import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../styles/DetailTransaksi.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_URL = "http://localhost/Online_Shop";

export default function DetailTransaksi() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/transaction/${id}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error load transaksi:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading">Memuat data transaksi...</div>;
  if (!data) return <div className="not-found">Data transaksi tidak ditemukan.</div>;

  const { header, items, shipping, refunds } = data;
  const hasRefund = refunds && refunds.length > 0;

  return (
    <>
      <Navbar />
      <div className="detail-transaksi-page">
        <div className="detail-transaksi-container">
          {/* === HEADER JUDUL === */}
          <div className="detail-header">
            <h2>Detail Transaksi #{header.id}</h2>
            <span className={`status-badge ${header.status}`}>{header.status}</span>
          </div>

          <div className="detail-content">
            {/* === KOLOM KIRI === */}
            <div className="detail-left">
              {/* INFORMASI PEMBELI */}
              <section className="section info-pembeli">
                <h3>Informasi Pembeli</h3>
                <div className="info-grid">
                  <p><strong>Nama:</strong> {header.buyer_name}</p>
                  <p><strong>Alamat:</strong> {header.buyer_address}</p>
                  <p><strong>Metode Pembayaran:</strong> {header.payment_method}</p>
                  <p><strong>Status Transaksi:</strong> {header.status}</p>
                  <p><strong>Total:</strong> Rp {Number(header.total_price).toLocaleString("id-ID")}</p>
                  <p><strong>Tanggal:</strong> {new Date(header.created_at).toLocaleString("id-ID")}</p>
                </div>
              </section>

              {/* DAFTAR BARANG */}
              <section className="section daftar-barang">
                <h3>Barang yang Dibeli</h3>
                <ul className="item-list">
                  {items.map((it, idx) => (
                    <li key={idx} className="item-card">
                      <img
                        src={it.image_url || "https://via.placeholder.com/80"}
                        alt={it.product_name}
                        className="item-image"
                      />
                      <div className="item-info">
                        <p className="item-name">{it.product_name}</p>
                        <p className="item-detail">
                          {it.quantity} x Rp {Number(it.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* === KOLOM KANAN === */}
            <div className="detail-right">
              {/* INFORMASI PENGIRIMAN */}
              <section className="section info-pengiriman">
                <h3>Pengiriman / Distributor</h3>
                {shipping ? (
                  <div>
                    <p><strong>Distributor:</strong> {shipping.distributor_name || "-"}</p>
                    <p><strong>Resi:</strong> {shipping.tracking_number || "-"}</p>
                    <p><strong>Status Distributor:</strong> {shipping.distributor_status || "-"}</p>
                  </div>
                ) : (
                  <p>Belum ada data pengiriman</p>
                )}
              </section>

              {/* REFUND */}
              {hasRefund && (
                <section className="section info-refund">
                  <h3>Riwayat Refund</h3>
                  {refunds.map((r) => (
                    <div key={r.id} className="refund-card-detail-transaksi">
                      <p><strong>Tanggal:</strong> {new Date(r.created_at).toLocaleString("id-ID")}</p>
                      <p><strong>Alasan:</strong> {r.reason}</p>
                      <p><strong>Deskripsi:</strong> {r.description}</p>
                      <p><strong>Status:</strong> {r.status}</p>
                      <div className="refund-media">
                        {r.media && JSON.parse(r.media).map((f, i) => (
                          <a
                            key={i}
                            href={`${API_URL}/uploads/refunds/${f}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Bukti #{i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>

          {/* === TOMBOL AKSI === */}
          <div className="button-group-detail">
            {header.status === "Completed" && !hasRefund && (
              <button
                className="btn-primary-detail"
                onClick={() => navigate(`/refund/${header.id}`)}
              >
                Ajukan Refund
              </button>
            )}
            <Link to="/">
              <button className="btn-secondary-detail">Kembali</button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
