import React, { useState } from "react";
import { MdAccountCircle } from "react-icons/md";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const userName = localStorage.getItem("user_name");
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img 
            src="http://localhost/Online_Shop/uploads/Logo/Logo.png" 
            alt="Warung Bu Roisah" 
            className="navbar-logo" 
          />
        </div>

        <div className="burger-icon" onClick={toggleMenu}>
          ☰
        </div>

        <div className={`navbar-right ${menuOpen ? "open" : ""}`}>
          <div className="navbar-links">
            <Link to="/" className="nav-item" onClick={() => setMenuOpen(false)}>Beranda</Link>
            <Link to="/belanja" className="nav-item" onClick={() => setMenuOpen(false)}>Belanja</Link>
            <Link to="/cart" className="nav-item" onClick={() => setMenuOpen(false)}>Keranjang</Link>
            <Link to="/transaksi" className="nav-item" onClick={() => setMenuOpen(false)}>Transaksi</Link>
          </div>
          <div className="navbar-auth">
            {userName ? (
              <div className="profile-wrapper">
                <Link to="/profile" className="profile-icon" onClick={() => setMenuOpen(false)}>
                <MdAccountCircle size={32}/>
                </Link>
                <span className="profile-name">{userName}</span>
              </div>
            ) : (
              <Link to="/login" className="nav-item auth-button" onClick={() => setMenuOpen(false)}>
                <span className="auth-icon">
                <MdAccountCircle size={32}/>  
                </span> Masuk
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
