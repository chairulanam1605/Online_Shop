// src/pages/distributor/DistributorOrders.js
import React, { useEffect, useState } from "react";
import DistributorSidebar from "../../components/Distributor/DistributorSidebar";
import "../../styles/Distributor/Orders.css";

const API_URL = "http://localhost/Online_Shop";

const DistributorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // fetch list orders
  const fetchOrders = () => {
    fetch(`${API_URL}/distributor/orders`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        console.log("Orders response:", data); // DEBUG

        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders); // kalau backend pakai {success, orders}
        } else if (Array.isArray(data)) {
          setOrders(data); // kalau backend langsung return array
        } else {
          setOrders([]);
        }
      })
      .catch((err) => console.error("Error fetching orders:", err));
  };


  useEffect(() => {
    fetchOrders();
  }, []);

  // fetch detail order
  const fetchOrderDetail = (id) => {
    fetch(`${API_URL}/distributor/orders/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setSelectedOrder(data))
      .catch((err) => console.error("Error fetching order detail:", err));
  };

  // update status order (untuk assigned → dikirim)
  const updateOrderStatus = (orderId, status) => {
    fetch(`${API_URL}/distributor/orders/update`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ distributor_order_id: orderId, status }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Status berhasil diperbarui");
          fetchOrders();
          setSelectedOrder(null);
        } else {
          alert(data.error || "Gagal memperbarui status");
        }
      })
      .catch((err) => console.error("Error updating status:", err));
  };

  // klik "Tandai Selesai" → buka modal upload
  const handleCompleteClick = () => {
    setShowUploadModal(true);
  };

  // upload bukti foto
  const handleUploadProof = () => {
    if (!uploadFile) {
      alert("Harap pilih foto terlebih dahulu!");
      return;
    }

    const formData = new FormData();
    formData.append("distributor_order_id", selectedOrder.distributor_order_id);
    formData.append("proof_image", uploadFile);

    fetch(`${API_URL}/distributor/orders/complete`, {
      method: "POST",
      body: formData,
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Pesanan ditandai selesai dengan bukti foto!");
          setShowUploadModal(false);
          setSelectedOrder(null);
          setUploadFile(null);
          fetchOrders();
        } else {
          alert(data.error || "Gagal upload bukti.");
        }
      })
      .catch((err) => console.error("Upload proof error:", err));
  };

  return (
    <DistributorSidebar>
      <div className="orders-container">
        <h1>Daftar Pesanan</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pelanggan</th>
              <th>Total</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order, i) => (
                <tr key={i}>
                  <td>#{order.distributor_order_id}</td>
                  <td>{order.customer_name}</td>
                  <td>
                    Rp {parseInt(order.total_price || 0).toLocaleString("id-ID")}
                  </td>
                  <td>
                    {order.assigned_at
                      ? new Date(order.assigned_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{order.status}</td>
                  <td>
                    <button
                      onClick={() =>
                        fetchOrderDetail(order.distributor_order_id)
                      }
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">Belum ada pesanan</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Modal Detail */}
        {selectedOrder && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Detail Pesanan</h2>
              <p>
                <strong>Pelanggan:</strong> {selectedOrder.customer_name}
              </p>
              <p>
                <strong>Alamat:</strong> {selectedOrder.customer_address}
              </p>
              <p>
                <strong>No HP:</strong> {selectedOrder.customer_phone}
              </p>
              <p>
                <strong>Status:</strong> {selectedOrder.status}
              </p>
              <p>
                <strong>Total:</strong>{" "}
                Rp {parseInt(selectedOrder.total_price).toLocaleString("id-ID")}
              </p>

              <h3>Item Pesanan</h3>
              <ul>
                {selectedOrder.items?.map((item, idx) => (
                  <li key={idx}>
                    {item.product_name} - {item.quantity} x Rp{" "}
                    {parseInt(item.price).toLocaleString("id-ID")} = Rp{" "}
                    {parseInt(item.subtotal).toLocaleString("id-ID")}
                  </li>
                ))}
              </ul>

              <div className="modal-actions">
                {selectedOrder.status === "assigned" && (
                  <button
                    onClick={() =>
                      updateOrderStatus(
                        selectedOrder.distributor_order_id,
                        "dikirim"
                      )
                    }
                  >
                    Tandai Dikirim
                  </button>
                )}
                {selectedOrder.status === "dikirim" && (
                  <button onClick={handleCompleteClick}>Tandai Selesai</button>
                )}
                <button onClick={() => setSelectedOrder(null)}>Tutup</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Upload Bukti */}
        {showUploadModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Upload Bukti Pengiriman</h2>

              {/* Preview Foto */}
              <div className="file-preview">
                {uploadFile ? (
                  <img
                    src={URL.createObjectURL(uploadFile)}
                    alt="Preview"
                    className="preview-img"
                  />
                ) : (
                  <p className="no-preview">Belum ada foto dipilih</p>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files[0])}
              />

              <div className="modal-actions">
                <button onClick={handleUploadProof} className="btn-upload">
                  Upload & Selesai
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="btn-cancel"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DistributorSidebar>
  );
};

export default DistributorOrders;
