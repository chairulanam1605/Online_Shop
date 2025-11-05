// src/pages/StatusTransaksiDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebard from "../../components/Admin/Sidebar";
import "../../styles/Admin/StatusTransaksiDetail.css";

const API_URL = "http://localhost/Online_Shop";

const StatusBadge = ({ status }) => {
  const raw = (status ?? "").toString();
  const s = raw.toLowerCase();

  const getStatusIcon = () => {
    if (s.includes("dipesan")) return "📝";
    if (s.includes("diproses")) return "🔄";
    if (s.includes("dikirim")) return "📦";
    if (s.includes("completed") || s.includes("selesai")) return "✅";
    return "📋";
  };

  return (
    <span className={`status-badge badge-${s.replace(/\s+/g, "-")}`}>
      {getStatusIcon()} {raw}
    </span>
  );
};

export default function StatusTransaksiDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // form shipping
  const [ship, setShip] = useState({
    distributor_id: "",
    distributor_name: "",
    tracking_number: "",
    shipped_at: new Date().toISOString().slice(0, 10),
    notes: ""
  });

  // daftar distributor (untuk dropdown)
  const [distributors, setDistributors] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/Admin/distributors`)
      .then(res => res.json())
      .then(data => setDistributors(data))
      .catch(err => console.error("Error fetching distributors:", err));
  }, []);

  const normalizeResponse = (res) => {
    let header = res.header ?? {};
    let items = res.items ?? [];
    let shipping = res.shipping ?? null;

    if (!header || Object.keys(header).length === 0) {
      header = {
        id: res.transaction_id ?? res.id ?? res.order_id ?? null,
        buyer_name: res.user_name ?? res.name ?? "",
        buyer_address: res.address ?? "",
        buyer_phone: res.phone ?? "",
        buyer_email: res.email ?? "",
        payment_method: res.payment_method ?? "",
        total_price: res.total_price ?? 0,
        status: res.status ?? "",
        created_at: res.created_at ?? ""
      };
    }

    if ((!items || items.length === 0) && (res.product_name || res.product)) {
      items = [{
        product_name: res.product_name ?? res.product ?? "",
        quantity: res.quantity ?? 1,
        price: res.price ?? 0
      }];
    }

    if ((!shipping || Object.keys(shipping).length === 0) &&
        (res.tracking_number || res.distributor_name || res.shipped_at || res.notes)) {
      shipping = {
        distributor_name: res.distributor_name ?? "",
        tracking_number: res.tracking_number ?? "",
        shipped_at: res.shipped_at ?? "",
        notes: res.notes ?? ""
      };
    }

    items = Array.isArray(items) ? items : [];
    return { header, items, shipping };
  };

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/Admin/status-transaksi/${id}`);
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Server returned error:", txt);
        throw new Error(`Server error ${resp.status}`);
      }
      const json = await resp.json();
      const normalized = normalizeResponse(json);
      setData(normalized);

      setShip((prev) => ({
        ...prev,
        distributor_name: normalized.shipping?.distributor_name ?? prev.distributor_name ?? "",
        tracking_number: normalized.shipping?.tracking_number ?? prev.tracking_number ?? "",
        shipped_at: normalized.shipping?.shipped_at ?? prev.shipped_at ?? new Date().toISOString().slice(0, 10),
        notes: normalized.shipping?.notes ?? prev.notes ?? ""
      }));
    } catch (err) {
      console.error("Gagal load detail:", err);
      alert("Gagal memuat detail transaksi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line
  }, [id]);

  const changeStatus = async (newStatus) => {
    if (newStatus === "Dikirim" || newStatus.toLowerCase().includes("dikirim")) {
      setShowModal(true);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/Admin/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: Number(id), status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        await fetchDetail();
      } else {
        alert(result.message || "Gagal update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Terjadi kesalahan saat memperbarui status");
    }
  };

  const submitShipping = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/Admin/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: Number(id),
          status: "Dikirim",
          shipping: {
            distributor_id: ship.distributor_id,   // <--- WAJIB
            distributor_name: ship.distributor_name,
            shipped_at: ship.shipped_at,
            notes: ship.notes
          }
        })
      });
      const result = await response.json();
      if (result.success) {
        setShip((s) => ({
          ...s,
          tracking_number: result.tracking_number ?? s.tracking_number ?? "—"
        }));
        setShowModal(false);
        await fetchDetail();
      } else {
        alert(result.message || "Gagal simpan data pengiriman");
      }
    } catch (err) {
      console.error("Error submitting shipping:", err);
      alert("Terjadi kesalahan saat menyimpan data pengiriman");
    }
  };

  const printLabel = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <Sidebard>
        <div className="detail-container">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Memuat data transaksi...</p>
          </div>
        </div>
      </Sidebard>
    );
  }

  const { header, items, shipping } = data;
  const subtotal = items.reduce((a, b) => a + (Number(b.price || 0) * Number(b.quantity || 0)), 0);

  return (
    <Sidebard>
      <div className="detail-container">
        <div className="detail-header">
          <h2>Detail Transaksi #{header?.id ?? "-"}</h2>
          <div className="right">
            <StatusBadge status={header?.status ?? "-"} />
            <select
              className="status-chooser"
              value={header?.status ?? ""}
              onChange={(e) => changeStatus(e.target.value)}
            >
              <option value="Dipesan">Dipesan</option>
              <option value="Diproses">Diproses</option>
              <option value="Dikirim">Dikirim</option>
              <option value="Completed">Completed</option>
            </select>
            <button className="btn-outline" onClick={() => navigate(-1)}>
              ← Kembali
            </button>
          </div>
        </div>

        <div className="cards-grid">
          <div className="card">
            <h4>👤 Data Pembeli</h4>
            <p><b>Nama:</b> {header?.buyer_name ?? "-"}</p>
            <p><b>Alamat:</b> {header?.buyer_address ?? "-"}</p>
            <p><b>Telp/Email:</b> {header?.buyer_phone ?? "-"} / {header?.buyer_email ?? "-"}</p>
            <p><b>Tanggal:</b> {header?.created_at ? new Date(header.created_at).toLocaleString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : "-"}</p>
          </div>

          <div className="card">
            <h4>💳 Pembayaran</h4>
            <p><b>Metode:</b> {header?.payment_method ?? "-"}</p>
            <p><b>Total:</b> Rp {Number(header?.total_price ?? 0).toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="card">
          <h4>🛍️ Barang Dibeli</h4>
          <table className="items-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Qty</th>
                <th>Harga</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td>{it.product_name ?? "-"}</td>
                  <td>{it.quantity ?? 0}</td>
                  <td>Rp {Number(it.price ?? 0).toLocaleString("id-ID")}</td>
                  <td>Rp {(Number(it.price ?? 0) * Number(it.quantity ?? 0)).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ textAlign: "right" }}><b>Subtotal</b></td>
                <td><b>Rp {subtotal.toLocaleString("id-ID")}</b></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {(header?.status?.toLowerCase().includes("dikirim") || header?.status?.toLowerCase().includes("completed")) && (
          <div className="card print-area" id="print-area">
            <div className="print-header">
              <h4>📦 Shipping Label</h4>
              <button className="btn" onClick={printLabel}>🖨️ Print Label</button>
            </div>

            <div className="label-grid">
              <div className="label-left">
                <p><b>Distributor:</b> {shipping?.distributor_name ?? "-"}</p>
                <p><b>No. Resi:</b> {shipping?.tracking_number ?? ship.tracking_number ?? "-"}</p>
                <p><b>Tanggal Kirim:</b> {shipping?.shipped_at ? new Date(shipping.shipped_at).toLocaleDateString('id-ID') : (ship.shipped_at ? new Date(ship.shipped_at).toLocaleDateString('id-ID') : "-")}</p>
                <p><b>Catatan:</b> {shipping?.notes ?? ship.notes ?? "-"}</p>
              </div>

              <div className="label-right">
                <p><b>Kepada:</b> {header?.buyer_name ?? "-"}</p>
                <p><b>Alamat:</b> {header?.buyer_address ?? "-"}</p>
                <p><b>Kontak:</b> {header?.buyer_phone ?? header?.buyer_email ?? "-"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal input pengiriman */}
        {showModal && (
          <div className="modal-backdrop-admin" onClick={() => setShowModal(false)}>
            <div className="modal-admin" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={submitShipping} className="modal-form-admin">
                <div className="form-section-title-admin">📦 Data Distributor (Pengiriman)</div>

                <div className="form-row-admin">
                  <div className="form-group-admin">
                    <label>Nama Distributor</label>
                    <select
                      value={ship.distributor_id}
                      onChange={(e) => setShip(s => ({ ...s, distributor_id: e.target.value }))}
                      required
                    >
                      <option value="">-- Pilih Distributor --</option>
                      {distributors.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-admin">
                    <label>No. Resi (otomatis)</label>
                    <input
                      type="text"
                      value={ship.tracking_number || "Akan dibuat otomatis"}
                      readOnly
                    />
                  </div>
                </div>

                <div className="form-row-admin">
                  <div className="form-group-admin">
                    <label>Tanggal Kirim</label>
                    <input
                      type="date"
                      value={ship.shipped_at}
                      onChange={(e) => setShip(s => ({ ...s, shipped_at: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group-admin">
                    <label>Catatan</label>
                    <textarea
                      rows={3}
                      value={ship.notes}
                      onChange={(e) => setShip(s => ({ ...s, notes: e.target.value }))}
                      placeholder="Masukkan catatan pengiriman (opsional)"
                    />
                  </div>
                </div>

                <div className="modal-actions-admin">
                  <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                  <button type="submit" className="btn">Simpan & Set Dikirim</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Sidebard>
  );
}
