import React, { useEffect, useState } from "react"; 
import DistributorSidebar from "../../components/Distributor/DistributorSidebar";
import "../../styles/Distributor/RefundDistributor.css";

const API_URL = "http://localhost/Online_Shop";

const RefundDistributor = () => {
  const [refunds, setRefunds] = useState([]);
  const [selectedRefund, setSelectedRefund] = useState(null);

  useEffect(() => {
    const distributorId = localStorage.getItem("user_id");
    fetch(`${API_URL}/distributor/refunds/${distributorId}`)
      .then((res) => res.json())
      .then((data) => setRefunds(data))
      .catch((err) => console.error("Gagal memuat data refund:", err));
  }, []);

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";
    const tgl = new Date(tanggal);
    return tgl.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <DistributorSidebar>
      <div className="refund-wrapper">
        <h2 className="refund-title">Daftar Refund Pembeli</h2>

        <div className="refund-table-container">
          <table className="refund-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Pembeli</th>
                <th>Produk</th>
                <th>Alasan</th>
                <th>Tanggal Pengajuan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {refunds.length > 0 ? (
                refunds.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.user_name}</td>
                    <td>{r.product_name}</td>
                    <td>{r.reason}</td>
                    <td>{formatTanggal(r.created_at)}</td>
                    <td>
                      <button
                        className="btn-detail"
                        onClick={() => setSelectedRefund(r)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    Belum ada data refund
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Modal modern */}
        {selectedRefund && (
          <div className="modal-overlay" onClick={() => setSelectedRefund(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Detail Refund</h3>
                <button
                  className="modal-close"
                  onClick={() => setSelectedRefund(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-section">
                  <h4>Informasi Pembeli</h4>
                  <p><strong>Nama:</strong> {selectedRefund.user_name}</p>
                  <p><strong>Alamat:</strong> {selectedRefund.user_address || "Tidak tersedia"}</p>
                </div>

                <div className="modal-section">
                  <h4>Produk & Transaksi</h4>
                  <p><strong>Nama Produk:</strong> {selectedRefund.product_name}</p>
                  <p><strong>Total Harga:</strong> Rp {selectedRefund.total_price?.toLocaleString("id-ID")}</p>
                  <p><strong>Tanggal Pengajuan:</strong> {formatTanggal(selectedRefund.created_at)}</p>
                </div>

                <div className="modal-section">
                  <h4>Alasan Refund</h4>
                  <p>{selectedRefund.reason}</p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-close-modern"
                  onClick={() => setSelectedRefund(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DistributorSidebar>
  );
};

export default RefundDistributor;
