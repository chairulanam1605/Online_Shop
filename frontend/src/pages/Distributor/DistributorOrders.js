// src/pages/distributor/DistributorOrders.js
import React, { useEffect, useState, useRef } from "react";
import DistributorSidebar from "../../components/Distributor/DistributorSidebar";
import "../../styles/Distributor/Orders.css";

const API_URL = "http://localhost/Online_Shop";

const DistributorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Kamera
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // fetch list orders
  const fetchOrders = () => {
    fetch(`${API_URL}/distributor/orders`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else if (Array.isArray(data)) {
          setOrders(data);
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
      .then((data) => {
        if (data.success) {
          setSelectedOrder(data.order);
        } else {
          alert(data.error || "Gagal memuat detail order");
        }
      })
      .catch((err) => console.error("Error fetching order detail:", err));
  };

  // update status order
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

  // === Kamera ===
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Tidak bisa akses kamera:", err);
      alert("Tidak bisa akses kamera. Pastikan izinnya sudah diberikan.");
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
    setPhoto(null);
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    const imageData = canvasRef.current.toDataURL("image/png");
    setPhoto(imageData);

    // Stop kamera setelah foto diambil
    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const handleConfirmPhoto = () => {
    if (!photo || !selectedOrder) return;

    const formData = new FormData();
    formData.append("distributor_order_id", selectedOrder.distributor_order_id);

    // Convert base64 → blob
    fetch(photo)
      .then((res) => res.blob())
      .then((blob) => {
        formData.append("proof_image", blob, "proof.png");

        return fetch(`${API_URL}/distributor/orders/complete`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Pesanan ditandai selesai dengan bukti foto!");
          setShowCamera(false);
          setPhoto(null);
          setSelectedOrder(null);
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
              <th>No</th>
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
                  {/* Nomor urut */}
                  <td>{i + 1}</td>
                  <td>{order.customer_name}</td>
                  <td>
                    Rp {parseInt(order.total_price || 0).toLocaleString("id-ID")}
                  </td>
                  <td>
                    {order.assigned_at
                      ? new Date(order.assigned_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
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
                Rp {Number(selectedOrder.total_price || 0).toLocaleString("id-ID")}
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
                  <button
                    onClick={() => {
                      setShowCamera(true);
                      openCamera();
                    }}
                  >
                    Upload Bukti
                  </button>
                )}
                <button onClick={() => setSelectedOrder(null)}>Tutup</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Kamera */}
        {showCamera && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Ambil Foto Bukti</h2>

              {!photo ? (
                <video ref={videoRef} autoPlay playsInline style={{ width: "100%" }} />
              ) : (
                <img src={photo} alt="Preview" style={{ width: "100%" }} />
              )}

              <canvas ref={canvasRef} style={{ display: "none" }} />

              <div className="modal-actions">
                {!photo ? (
                  <button onClick={handleTakePhoto}>📸 Ambil Foto</button>
                ) : (
                  <>
                    <button onClick={handleConfirmPhoto}>✅ Konfirmasi</button>
                    <button
                      onClick={() => {
                        setPhoto(null);
                        openCamera(); // restart kamera untuk foto ulang
                      }}
                    >
                      🔄 Foto Ulang
                    </button>
                  </>
                )}
                <button onClick={closeCamera}>Batal</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DistributorSidebar>
  );
};

export default DistributorOrders;
