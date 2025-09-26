// components/Carousel.js
import React, { useState, useEffect } from "react";
import "../styles/Carousel.css";

const images = [
  "https://i.pinimg.com/736x/03/c5/08/03c50814e232b11007f5e63cdc815bb7.jpg",
  "https://i.pinimg.com/736x/40/71/eb/4071eb545944084e2a0a9a3f2f013b73.jpg",
  "https://i.pinimg.com/736x/17/3c/4d/173c4d4e4caf4cffb5ae553afd4150f4.jpg"
];

const Carousel = () => {
  const [index, setIndex] = useState(0);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000); // otomatis ganti setiap 3 detik
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="carousel-container">
      <img src={images[index]} alt={`Slide ${index}`} />
      <button className="carousel-btn prev" onClick={prevSlide}>❮</button>
      <button className="carousel-btn next" onClick={nextSlide}>❯</button>
    </div>
  );
};

export default Carousel;
