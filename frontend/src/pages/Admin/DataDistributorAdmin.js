// src/pages/DataUser.js
import React, { useEffect, useState } from "react";
import "../../styles/Admin/DataDistributorAdmin.css";
import Sidebard from "../../components/Admin/Sidebar";

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
      .then((data) => {
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
      <div className="data-user-container">
        <h2 style={{ marginBottom: "20px", fontSize: "24px", color: "#333" }}>Daftar Distributor</h2>
        <table className="user-table">
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
            {users.map((user, index) => (
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
                      width="50"
                      height="50"
                    />
                  ) : (
                    "Tidak ada foto"
                  )}
                </td>
                <td>
                  <button
                    className="hapus-button"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebard>
  );
};

export default DataDistributorAdmin;
