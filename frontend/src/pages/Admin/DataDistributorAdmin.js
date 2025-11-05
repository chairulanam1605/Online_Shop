import React, { useEffect, useState } from "react";
import "../../styles/Admin/DataDistributorAdmin.css";
import Sidebard from "../../components/Admin/Sidebar";
import { FaUsers, FaTrash } from "react-icons/fa";

const API_URL = "http://localhost/Online_Shop";

const DataDistributorAdmin = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/Admin/distributors`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Data dari backend:", data);
        setUsers(data);
      })
      .catch((err) => console.error("Gagal memuat data users:", err));
  }, []);

  const handleDeleteUser = (id) => {
    const konfirmasi = window.confirm("Apakah Anda yakin ingin menghapus user ini?");
    if (!konfirmasi) return;

    fetch(`${API_URL}/Admin/distributors/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        alert("User berhasil dihapus.");
        setUsers(users.filter((user) => user.id !== id));
      })
      .catch((err) => {
        console.error("Gagal menghapus user:", err);
        alert("Terjadi kesalahan saat menghapus user.");
      });
  };

  return (
    <Sidebard>
      <div className="data-user-wrapper">
        <header className="datauser-header">
          <div className="title-section">
            <FaUsers className="header-icon" />
            <div>
              <h2>Daftar Distributor</h2>
              <p>Kelola informasi distributor dan akun mereka</p>
            </div>
          </div>
        </header>

        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Telepon</th>
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
                    <td>{user.phone}</td>
                    <td>
                      {user.profile_picture ? (
                        <img
                          src={`${API_URL}/uploads/${user.profile_picture}`}
                          alt="Foto Profil"
                          className="profile-image"
                        />
                      ) : (
                        <span className="no-photo">Tidak ada foto</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="hapus-button"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <FaTrash /> Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan="6">Belum ada data distributor</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Sidebard>
  );
};

export default DataDistributorAdmin;
