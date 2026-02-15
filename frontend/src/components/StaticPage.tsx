import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./StaticPage.css";

const API_URL = "http://localhost:3000/api";

interface PageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface StaticPageProps {
  slug: string;
}

const StaticPage = ({ slug }: StaticPageProps) => {
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  useEffect(() => {
    if (page) {
      // Update document title and meta tags
      document.title = page.metaTitle || page.title;

      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      if (metaDescription && page.metaDescription) {
        metaDescription.setAttribute("content", page.metaDescription);
      }
    }
  }, [page]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/pages/slug/${slug}`);
      setPage(response.data);
    } catch (err: any) {
      console.error("Error fetching page:", err);
      if (err.response?.status === 404) {
        setError("Page not found");
      } else {
        setError("Failed to load page content");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="static-page-container">
        <div className="static-page-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="static-page-container">
        <div className="static-page-error">
          <h1>Oops!</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  return (
    <div className="static-page-container">
      <div className="static-page-header">
        <h1>{page.title}</h1>
      </div>
      <div
        className="static-page-content"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
};

export default StaticPage;
