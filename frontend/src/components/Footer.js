// src/components/Footer.js
import React from "react";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <h2 className="footer-title">Warung Bu Roisah</h2>
        <p className="footer-address">
            Jln. Pejagalan Kulon RT 02, RW No.05, Dusun II Sokaraja Tengah, Sokaraja Tengah,<br/>
            Kec. Sokaraja, Kabupaten Banyumas, Jawa Tengah <br/>
            53181
        </p>
        <p className="footer-copy">
          Copyright © 2025 Warung Bu Roisah. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
