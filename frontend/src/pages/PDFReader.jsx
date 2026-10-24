import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useNavigate, useParams } from "react-router-dom";
import { getBookById } from "../api/books";
import "./PDFReader.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PDFReader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [book, setBook] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await getBookById(bookId);
        setBook(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load book");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const previousPage = () => {
    setPageNumber((page) => Math.max(page - 1, 1));
  };

  const nextPage = () => {
    setPageNumber((page) =>
      Math.min(page + 1, numPages)
    );
  };

  if (loading) {
    return (
      <main className="pdf-reader">
        <h2>Opening your book...</h2>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="pdf-reader">
        <h2>{error || "Book not found"}</h2>
      </main>
    );
  }

  if (!book.pdf_path) {
    return (
      <main className="pdf-reader">
        <button
          className="reader-back"
          onClick={() => navigate(`/books/${bookId}`)}
        >
          ← Back
        </button>

        <div className="no-pdf">
          <h2>No PDF available</h2>
          <p>Upload a PDF for this book first.</p>
        </div>
      </main>
    );
  }

  const pdfUrl =
  `${API_URL}/books/${bookId}/pdf`;

  return (
    <main className="pdf-reader">
      <header className="reader-header">
        <button
          className="reader-back"
          onClick={() => navigate(`/books/${bookId}`)}
        >
          ← Back
        </button>

        <div className="reader-title">
          <span className="eyebrow">READING</span>
          <h1>{book.title}</h1>
        </div>

        <div className="page-count">
          {pageNumber} / {numPages || "..."}
        </div>
      </header>

      <section className="reader-content">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<p>Loading PDF...</p>}
          error={<p>Unable to load PDF.</p>}
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            width={800}
          />
        </Document>
      </section>

      <footer className="reader-controls">
        <button
          onClick={previousPage}
          disabled={pageNumber <= 1}
        >
          ← Previous
        </button>

        <span>
          Page {pageNumber} of {numPages || "..."}
        </span>

        <button
          onClick={nextPage}
          disabled={
            !numPages || pageNumber >= numPages
          }
        >
          Next →
        </button>
      </footer>
    </main>
  );
}
export default PDFReader;

