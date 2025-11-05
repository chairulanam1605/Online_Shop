import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/DetailRefundAdmin.css";
import { FaArrowLeft, FaReceipt, FaStore, FaImage } from "react-icons/fa";

const API_URL = "http://localhost/Online_Shop";

const DetailRefundAdmin = () => {
  const { id } = useParams();
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/admin/refunds/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setRefund(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat detail refund:", err);
        setLoading(false);
      });
  }, [id]);

  const updateStatus = (newStatus) => {
    if (!window.confirm(`Ubah status refund menjadi "${newStatus}"?`)) return;
    const action =
      newStatus === "approved"
        ? "approve"
        : newStatus === "rejected"
        ? "reject"
        : newStatus;

    fetch(`${API_URL}/admin/refunds/${id}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message || "Status refund diperbarui");
        navigate("/admin/refund-admin");
      })
      .catch(() => alert("Terjadi kesalahan server"));
  };

  const formatTanggal = (tgl) =>
    tgl
      ? new Date(tgl).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

  if (loading)
    return (
      <Sidebard>
        <div className="refund-container">
          <div className="loading">Memuat data...</div>
        </div>
      </Sidebard>
    );

  if (!refund || refund.error)
    return (
      <Sidebard>
        <div className="refund-container">
          <p>Data refund tidak ditemukan.</p>
        </div>
      </Sidebard>
    );

  const buktiList = Array.isArray(refund.proof_files)
    ? refund.proof_files
    : JSON.parse(refund.proof_files || "[]");

  const handleNext = () => {
    if (buktiList.length === 0) return;
    setPreviewIndex((prev) => (prev + 1) % buktiList.length);
  };

  const handlePrev = () => {
    if (buktiList.length === 0) return;
    setPreviewIndex((prev) =>
      prev === 0 ? buktiList.length - 1 : prev - 1
    );
  };

  return (
    <Sidebard>
      <div className="detail-refund-container">
        <div className="detail-refund-header">
          <div className="header-left">
            <FaReceipt className="icon-title" />
            <div>
              <h2>Detail Refund Pembeli</h2>
              <p>Informasi lengkap mengenai permintaan refund</p>
            </div>
          </div>
          <button className="btn-back" onClick={() => navigate("/admin/refund-admin")}>
            <FaArrowLeft /> Kembali
          </button>
        </div>

        <div className="detail-refund-grid">
          {/* Informasi Refund */}
          <div className="detail-refund-card">
            <h3>Informasi Refund</h3>
            <div className="detail-list">
              <p><strong>Nama Pembeli:</strong> {refund.username}</p>
              <p><strong>Tanggal Pengajuan:</strong> {formatTanggal(refund.created_at)}</p>
              <p>
                <strong>Status:</strong>{" "}
                <select
                  value={refund.status}
                  onChange={(e) => updateStatus(e.target.value)}
                  className={`status-dropdown status-${refund.status}`}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </p>
              <p><strong>Alasan Refund:</strong> {refund.reason}</p>
              <p><strong>Deskripsi:</strong> {refund.description || "-"}</p>
            </div>
          </div>

          {/* Data Transaksi */}
          <div className="detail-refund-card">
            <h3>Data Transaksi</h3>
            <div className="detail-list">
              <p><strong>ID Transaksi:</strong> {refund.transaction_id}</p>
              <p><strong>Total Harga:</strong> Rp {parseInt(refund.total_price).toLocaleString()}</p>
            </div>
          </div>

          {/* Data Distributor */}
          <div className="detail-refund-card">
            <h3><FaStore className="icon-inline" /> Data Distributor</h3>
            {refund.distributor_name ? (
              <>
                <p><strong>Nama Distributor:</strong> {refund.distributor_name}</p>
                <p><strong>No. HP:</strong> {refund.distributor_phone || "-"}</p>
              </>
            ) : (
              <p>Belum ada data distributor.</p>
            )}
          </div>

          {/* Bukti Refund */}
          <div className="detail-refund-card">
            <h3><FaImage className="icon-inline" /> Bukti Refund</h3>
            {buktiList.length > 0 ? (
              <div className="bukti-container">
                {buktiList.map((file, i) => (
                  <img
                    key={i}
                    src={`${API_URL}/uploads/refunds/${file}`}
                    alt={`Bukti ${i + 1}`}
                    onClick={() => setPreviewIndex(i)}
                  />
                ))}
              </div>
            ) : (
              <p>Tidak ada bukti refund yang diunggah.</p>
            )}
          </div>
        </div>

        {/* Preview Gambar */}
        {previewIndex !== null && (
          <div
            className="image-preview-overlay"
            onClick={() => setPreviewIndex(null)}
          >
            <div
              className="image-preview-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="nav-btn prev" onClick={handlePrev}>❮</button>
              <img
                src={`${API_URL}/uploads/refunds/${buktiList[previewIndex]}`}
                alt={`Preview ${previewIndex + 1}`}
              />
              <button className="nav-btn next" onClick={handleNext}>❯</button>
              <button className="close-preview" onClick={() => setPreviewIndex(null)}>✕</button>
            </div>
          </div>
        )}
      </div>
    </Sidebard>
  );
};

export default DetailRefundAdmin;
