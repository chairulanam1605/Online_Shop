// src/pages/admin/DataUserAdmin.js
import React, { useEffect, useState } from "react";
import "../../styles/Admin/DataUserAdmin.css";
import Sidebard from "../../components/Admin/Sidebar";
import { FaUserFriends, FaTrash } from "react-icons/fa";

const API_URL = "http://localhost/Online_Shop";

const DataUserAdmin = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/Admin/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((err) => console.error("Gagal memuat data users:", err));
  }, []);

  const handleDeleteUser = (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus user ini?")) return;

    fetch(`${API_URL}/Admin/users/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        alert("User berhasil dihapus.");
        setUsers((prev) => prev.filter((user) => user.id !== id));
      })
      .catch((err) => {
        console.error("Gagal menghapus user:", err);
        alert("Terjadi kesalahan saat menghapus user.");
      });
  };

  return (
    <Sidebard>
      <div className="user-wrapper">
        <header className="user-header">
          <div className="user-title">
            <FaUserFriends className="user-icon" />
            <div>
              <h2>Daftar Pelanggan</h2>
              <p>Kelola data pelanggan yang terdaftar di sistem</p>
            </div>
          </div>
        </header>

        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Alamat</th>
                <th>Foto Profil</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "-"}</td>
                    <td className="alamat">{user.address || "-"}</td>
                    <td>
                      {user.profile_picture ? (
                        <img
                          src={`${API_URL}/uploads/${user.profile_picture}`}
                          alt="Foto Profil"
                          className="user-image"
                          onError={(e) =>
                            (e.target.src =
                              "https://via.placeholder.com/50?text=User")
                          }
                        />
                      ) : (
                        <span className="no-photo">Tidak ada foto</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="hapus-btn"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <FaTrash /> Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan="7">Belum ada data pengguna</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Sidebard>
  );
};

export default DataUserAdmin;
