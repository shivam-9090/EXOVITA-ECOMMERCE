import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import "./BannerCarousel.css";

const API_URL = "http://localhost:3000/api";

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
  position: number;
  isActive: boolean;
}

const BannerCarousel = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [autoPlay, banners.length]);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API_URL}/banners/active`);
      setBanners(response.data);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const goToSlide = (index: number) => {
    setAutoPlay(false);
    setCurrentIndex(index);
  };

  if (loading) {
    return <div className="banner-carousel-loading">Loading...</div>;
  }

  if (banners.length === 0) {
    return null; // Don't render anything if no banners
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="banner-carousel">
      <div className="carousel-container">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div key={banner.id} className="carousel-slide">
              <div
                className="slide-background"
                style={{ backgroundImage: `url(${banner.image})` }}
              >
                <div className="slide-overlay"></div>
              </div>
              <div className="slide-content">
                {banner.subtitle && (
                  <span className="slide-subtitle">{banner.subtitle}</span>
                )}
                <h1 className="slide-title">{banner.title}</h1>
                {banner.link && banner.buttonText && (
                  <a href={banner.link} className="slide-button">
                    {banner.buttonText}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {banners.length > 1 && (
          <>
            <button
              className="carousel-button prev"
              onClick={goToPrevious}
              aria-label="Previous slide"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="carousel-button next"
              onClick={goToNext}
              aria-label="Next slide"
            >
              <ChevronRight size={32} />
            </button>

            <div className="carousel-indicators">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentIndex ? "active" : ""}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BannerCarousel;
