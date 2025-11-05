import React, { useEffect, useState } from "react";
import "../styles/Profile.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost/Online_Shop";
const userId = localStorage.getItem("user_id");

const Profile = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const preview = URL.createObjectURL(file);
    const confirmUpload = window.confirm("Apakah Anda yakin ingin mengubah foto profil?");
    if (confirmUpload) {
      const formData = new FormData();
      formData.append("profile_picture", file);
      formData.append("user_id", userId);

      fetch(`${API_URL}/upload-photo`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            alert("Foto profil berhasil diperbarui!");
            setPreviewImage(preview);
            loadProfile();
          } else {
            alert("Gagal mengunggah foto.");
          }
        });
    }
  }
};


  const loadProfile = () => {
    fetch(`${API_URL}/profile?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setForm({
            username: data.username || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            profile_picture: data.profile_picture || null,
          });
        }
      });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...form }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Profil berhasil diperbarui!");
          setShowModal(false);
          loadProfile();
        } else {
          alert("Gagal memperbarui profil.");
        }
      });
  };

  const handleDeletePhoto = () => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus foto profil?");
    if (confirmDelete) {
      fetch(`${API_URL}/delete-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            alert("Foto profil berhasil dihapus.");
            setPreviewImage(null);
            loadProfile();
            setShowImageModal(false);
          } else {
            alert("Gagal menghapus foto.");
          }
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    navigate("/login");
  };

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-card-customer">
          <div className="profile-image-customer">
            <img 
              src={
                previewImage
                  ? previewImage
                  : form.profile_picture
                  ? `${API_URL}/uploads/${form.profile_picture}`
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="Profile"
              onClick={() => {
                if (form.profile_picture || previewImage) setShowImageModal(true);
              }}
              style={{ cursor: "pointer" }}
            />
            <label className="upload-label-customer">
              <input type="file" accept="image/*" onChange={handleImageChange} />
              Ubah Foto Profile
            </label>
          </div>

          <form>
            <label>Username</label>
            <input type="text" value={form.username} disabled />

            <label>E-mail</label>
            <input type="email" value={form.email} disabled />

            <label>Nomor HP</label>
            <input type="text" value={form.phone} disabled />

            <label>Alamat</label>
            <textarea value={form.address} disabled></textarea>

            <button
              type="button"
              className="btn-update"
              onClick={() => setShowModal(true)}
            >
              Update
            </button>
            
            <button
              type="button"
              className="btn-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {showImageModal && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={
                previewImage
                  ? previewImage
                  : `${API_URL}/uploads/${form.profile_picture}`
              }
              alt="Foto Profil Full"
              style={{ width: "100%", borderRadius: "10px" }}
            />
            <button className="btn-delete" onClick={handleDeletePhoto}>
              Hapus Foto Profil
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Perbarui Profil</h3>
            <form onSubmit={handleUpdate}>
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
              />

              <label>E-mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />

              <label>Nomor HP</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />

              <label>Alamat</label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
              ></textarea>

              <div className="modal-buttons">
                <button type="submit" className="btn-update">Simpan</button>
                <button type="button" className="btn-logout" onClick={() => setShowModal(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default Profile;