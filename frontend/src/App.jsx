import { HashRouter, Routes, Route } from "react-router-dom"; // Change BrowserRouter to HashRouter
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import BookDetails from "./pages/BookDetails";
import PDFReader from "./pages/PDFReader";
import ArrangeLibrary from "./pages/ArrangeLibrary";

function App() {
  return (
    <HashRouter> {/* Change BrowserRouter to HashRouter and remove basename */}
      <div className="app">
        <Sidebar />

        <div className="main-area">
          <TopBar />

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/arrange" element={<ArrangeLibrary />} />
            <Route path="/books/:bookId" element={<BookDetails />} />
            <Route path="/books/:bookId/read" element={<PDFReader />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;