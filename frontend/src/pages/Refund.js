// src/pages/Refund.js
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Refund.css";

const API_URL = "http://localhost/Online_Shop";

export default function Refund() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (e) => setFiles(Array.from(e.target.files || []));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!reason) return alert("Pilih alasan refund");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("transaction_id", id);
      fd.append("reason", reason);
      fd.append("description", description);

      const uid = localStorage.getItem("user_id");
      if (uid) fd.append("user_id", uid);
      files.forEach((f) => fd.append("media[]", f));

      const res = await fetch(`${API_URL}/refunds`, {
        method: "POST",
        body: fd,
        headers: uid ? { "X-User-Id": uid } : {},
      });
      const json = await res.json();
      if (json.success) {
        alert("Permintaan refund dikirim. Status: pending");
        navigate(`/transaction/${id}`);
      } else alert("Gagal: " + (json.error || "unknown"));
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat kirim refund");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="refund-container">
        <div className="refund-card">
          <h2 className="refund-title">Form Refund — Transaksi #{id}</h2>
          <form onSubmit={handleSubmit} className="refund-form">
            <div className="form-group">
              <label>Alasan Refund</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">-- Pilih Alasan --</option>
                <option value="Barang rusak">Barang rusak</option>
                <option value="Salah kirim">Salah kirim</option>
                <option value="Kurang jumlah">Kurang jumlah</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="form-group">
              <label>Deskripsi singkat</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Jelaskan secara singkat permasalahan barang..."
              />
            </div>

            <div className="form-group">
              <label>Unggah bukti (gambar/video)</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFiles}
              />
              {files.length > 0 && (
                <div className="file-list">
                  {files.map((f, i) => (
                    <div key={i} className="file-item">
                      📎 {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="refund-buttons">
              <button
                disabled={submitting}
                type="submit"
                className="btn-submit"
              >
                Kirim Refund
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(-1)}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
