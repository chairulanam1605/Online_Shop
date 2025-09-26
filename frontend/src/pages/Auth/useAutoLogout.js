// src/pages/Auth/useAutoLogout.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const useAutoLogout = (timeout = 86400000) => {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const isLoggedIn = localStorage.getItem("user_id");

    // Hanya berlaku untuk user biasa yang sedang login
    if (!isLoggedIn || role === "admin") return;

    // ⏳ Cek waktu terakhir akses saat tab dibuka
    const lastClose = localStorage.getItem("last_close_time");
    if (lastClose) {
      const diff = Date.now() - parseInt(lastClose, 10);
      if (diff > timeout) {
        // Logout otomatis
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_role");
        localStorage.removeItem("last_close_time");
        alert("Sesi anda telah berakhir. Silakan login kembali.");
        navigate("/");
        return;
      }
    }

    // 📝 Simpan waktu saat tab ditutup
    const handleTabClose = () => {
      localStorage.setItem("last_close_time", Date.now().toString());
    };

    window.addEventListener("beforeunload", handleTabClose);

    setIsChecked(true); // menandakan pengecekan selesai

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, [navigate, timeout]);

  return isChecked;
};

export default useAutoLogout;
