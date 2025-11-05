// components/Carousel.js
import React, { useState, useEffect, useRef } from "react";
import "../styles/Carousel.css";

const images = [
  "https://i.pinimg.com/736x/03/c5/08/03c50814e232b11007f5e63cdc815bb7.jpg",
  "https://i.pinimg.com/736x/40/71/eb/4071eb545944084e2a0a9a3f2f013b73.jpg",
  "https://i.pinimg.com/736x/17/3c/4d/173c4d4e4caf4cffb5ae553afd4150f4.jpg"
];

const Carousel = ({ fullWidth = false }) => {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef(null);
  const wrapperRef = useRef(null);

  const nextSlide = () => setIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () =>
    setIndex((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    startAuto();
    return () => stopAuto();
  }, []);

  const startAuto = () => {
    stopAuto();
    intervalRef.current = setInterval(nextSlide, 4000);
  };

  const stopAuto = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div
      className={`carousel-container ${fullWidth ? "full-width" : ""}`}
      onMouseEnter={stopAuto}
      onMouseLeave={startAuto}
      ref={wrapperRef}
    >
      <div className="carousel-image-wrapper" aria-live="polite">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Slide ${i + 1}`}
            className={`carousel-image ${i === index ? "active" : ""}`}
            loading="lazy"
            draggable="false"
          />
        ))}
      </div>

      <button
        className="carousel-btn prev"
        onClick={() => {
          prevSlide();
          startAuto();
        }}
        aria-label="Previous slide"
      >
        ❮
      </button>
      <button
        className="carousel-btn next"
        onClick={() => {
          nextSlide();
          startAuto();
        }}
        aria-label="Next slide"
      >
        ❯
      </button>

      <div className="carousel-indicators">
        {images.map((_, i) => (
          <button
            key={i}
            className={`indicator ${i === index ? "active" : ""}`}
            onClick={() => {
              setIndex(i);
              startAuto();
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
