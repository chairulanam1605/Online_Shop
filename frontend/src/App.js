import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation,Navigate } from "react-router-dom";
import useAutoLogout from "./pages/Auth/useAutoLogout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import DataUserAdmin from "./pages/Admin/DataUserAdmin";
import DataDistributorAdmin from "./pages/Admin/DataDistributorAdmin";
import DataProdukAdmin from "./pages/Admin/DataProdukAdmin";
import TambahProduk from "./pages/Admin/TambahProduk";
import EditProduk from "./pages/Admin/EditProduk";
import DataKategoriAdmin from "./pages/Admin/DataKategoriAdmin";
import TambahKategori from "./pages/Admin/TambahKategori";
import BarangMasukAdmin from "./pages/Admin/BarangMasukAdmin";
import TambahBarangMasuk from "./pages/Admin/TambahBarangMasuk";
import BarangKeluarAdmin from "./pages/Admin/BarangKeluarAdmin";
import RiwayatTransaksi from "./pages/Admin/RiwayatTransaksi";
import StatusTransaksi from "./pages/Admin/StatusTransaksi";
import StatusTransaksiDetail from "./pages/Admin/StatusTransaksiDetail";
import LaporanLogistikAdmin from "./pages/Admin/LaporanLogistikAdmin";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Cart from "./pages/Cart";
import Belanja from "./pages/Belanja";
import Transaksi from "./pages/Transaksi";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import DistributorDashboard from "./pages/Distributor/Dashboard";
import DistributorOrders from "./pages/Distributor/DistributorOrders";
import DistributorShipments from "./pages/Distributor/DistributorShipments";
import DistributorProfile from "./pages/Distributor/DistributorProfile";
import "./App.css";


// Komponen pembungkus yang menangani lokasi dan routing
const AppWrapper = () => {
  const location = useLocation();
  useAutoLogout(86400000);

  // Tentukan path yang tidak ingin menampilkan Navbar
 const hideNavbarPaths = [
    "/login", "/register", "/forgot-password",
    "/admin", "/admin/users", "/admin/products",
    "/admin/tambah-produk", "/admin/kategori",
    "/admin/tambah-kategori", "/admin/edit-produk",
    "/distributor"
  ];


  // Cek apakah path sekarang dimulai dengan salah satu hideNavbarPaths
  const showNavbar = !hideNavbarPaths.some(path => location.pathname.startsWith(path));


  return (
    <div>
      {showNavbar && <Navbar />}
      <div className="main-content">
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/belanja" element={<Belanja />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={ localStorage.getItem("user_role") === "admin" ? <AdminDashboard /> : <Navigate to="/" /> } />
            <Route path="/admin/users" element={<DataUserAdmin />} />
            <Route path="/admin/distributors" element={<DataDistributorAdmin />} />
            <Route path="/admin/products" element={<DataProdukAdmin />} />
            <Route path="/admin/tambah-produk" element={<TambahProduk />} />
            <Route path="/admin/edit-produk/:id" element={<EditProduk />} />
            <Route path="/admin/kategori" element={<DataKategoriAdmin />} />
            <Route path="/admin/tambah-kategori" element={<TambahKategori />} />
            <Route path="/admin/barang-masuk" element={<BarangMasukAdmin />} />
            <Route path="/admin/tambah-barang-masuk" element={<TambahBarangMasuk />} />
            <Route path="/admin/barang-keluar" element={<BarangKeluarAdmin />} />
            <Route path="/admin/riwayat-transaksi" element={<RiwayatTransaksi />} />
            <Route path="/admin/status-transaksi" element={<StatusTransaksi />} />
            <Route path="/admin/status-transaksi/:id" element={<StatusTransaksiDetail />} />
            <Route path="/admin/laporan-logistik" element={<LaporanLogistikAdmin />} />
            <Route path="/distributor/dashboard" element={localStorage.getItem("user_role") === "distributor" ? <DistributorDashboard /> : <Navigate to="/" /> } />
            <Route path="/distributor/pesanan" element={<DistributorOrders />} />
            <Route path="/distributor/riwayat-pengiriman" element={<DistributorShipments />} />
            <Route path="/distributor/profile" element={<DistributorProfile />} />
            </Routes>
      </div>
    </div>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;



