import React, { useState, useEffect } from "react";
import DistributorSidebar from "../../components/Distributor/DistributorSidebar";
import "../../styles/Distributor/ProfileDistributor.css";

const API_URL = "http://localhost/Online_Shop";

const DistributorProfile = () => {
  const [user, setUser] = useState(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPhoto, setNewPhoto] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Ambil user_id dari localStorage (disimpan waktu login)
  const user_id = localStorage.getItem("user_id");

  // ambil data user distributor
  useEffect(() => {
    fetch(`${API_URL}/distributor/profile?user_id=${user_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "error") {
          console.error("API Error:", data.message);
          return;
        }
        setUser(data);
        setEditData({
          name: data.name,
          email: data.email,
          phone: data.phone,
        });
      })
      .catch((err) => console.error("Error fetching profile:", err));
  }, [user_id]);

  // upload foto profile baru
  const handleUploadPhoto = () => {
    if (!newPhoto) {
      alert("Pilih foto terlebih dahulu!");
      return;
    }
    const formData = new FormData();
    formData.append("profile_picture", newPhoto);
    formData.append("user_id", user_id); // ⬅️ WAJIB

    fetch(`${API_URL}/distributor/upload-photo`, {
      method: "POST",
      body: formData
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Foto profile berhasil diubah!");
          setUser({ ...user, profile_picture: data.file });
          setNewPhoto(null);
        } else {
          alert(data.message || "Gagal upload foto.");
        }
      })
      .catch((err) => console.error("Upload photo error:", err));
  };

  // hapus foto profile
  const handleDeletePhoto = () => {
    if (!window.confirm("Yakin ingin menghapus foto profile?")) return;

    fetch(`${API_URL}/distributor/delete-photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }) // ⬅️ WAJIB
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Foto profile berhasil dihapus!");
          setUser({ ...user, profile_picture: null });
          setShowFullImage(false);
        } else {
          alert(data.message || "Gagal hapus foto.");
        }
      })
      .catch((err) => console.error("Delete photo error:", err));
  };

  // update data profile
  const handleSaveEdit = () => {
    fetch(`${API_URL}/distributor/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editData, user_id }) // ⬅️ WAJIB
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Profil berhasil diperbarui!");
          setUser({ ...user, ...editData });
          setShowEditModal(false);
        } else {
          alert(data.message || "Gagal memperbarui profil.");
        }
      })
      .catch((err) => console.error("Update profile error:", err));
  };

  if (!user) return <p>Loading...</p>;

  return (
    <DistributorSidebar>
      <div className="distributor-profile-container">
        {/* Foto Profile */}
        <div className="profile-photo-section">
          <img
            src={
              user.profile_picture
                ? `${API_URL}/uploads/${user.profile_picture}`
                : "/default-avatar.png"
            }
            alt="Foto Profile"
            className="profile-photo"
            onClick={() => setShowFullImage(true)}
          />
          <div className="photo-actions">
            <label className="upload-image">
              Ubah Foto Profile
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPhoto(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>
            {newPhoto && (
              <button className="btn-save-photo" onClick={handleUploadPhoto}>
                Simpan Foto
              </button>
            )}
          </div>
        </div>

        {/* Data Diri */}
        <div className="profile-info">
          <p>
            <strong>Nama:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>No HP:</strong> {user.phone}
          </p>
          <button className="btn-edit-profile" onClick={() => setShowEditModal(true)}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Modal Full Foto */}
      {showFullImage && (
        <div className="modal">
          <div className="modal-content">
            <img
              src={
                user.profile_picture
                  ? `${API_URL}/uploads/${user.profile_picture}`
                  : "/default-avatar.png"
              }
              alt="Foto Penuh"
              className="full-photo"
            />
            <div className="modal-actions">
              <button className="btn-delete-photo" onClick={handleDeletePhoto}>
                Hapus Foto
              </button>
              <button onClick={() => setShowFullImage(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Profile */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Profile</h2>
            <input
              type="text"
              placeholder="Nama"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="Email"
              value={editData.email}
              onChange={(e) =>
                setEditData({ ...editData, email: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="No HP"
              value={editData.phone}
              onChange={(e) =>
                setEditData({ ...editData, phone: e.target.value })
              }
            />
            <div className="modal-actions">
              <button onClick={handleSaveEdit}>Simpan</button>
              <button onClick={() => setShowEditModal(false)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </DistributorSidebar>
  );
};

export default DistributorProfile;
