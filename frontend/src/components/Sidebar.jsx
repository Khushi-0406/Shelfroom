import { useState } from "react";
import { NavLink } from "react-router-dom";

function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      {/* MOBILE MENU BUTTON */}

      <button
        className="mobile-menu-btn"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation"
      >
        ☰
      </button>


      {/* MOBILE OVERLAY */}

      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
        />
      )}


      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          menuOpen ? "mobile-open" : ""
        }`}
      >

        {/* LOGO */}

        <div className="logo">
          <div className="logo-icon">
            ◒
          </div>

          <div>
            <h2>Shelfroom</h2>
            <span>YOUR QUIET CORNER</span>
          </div>
        </div>


        {/* MOBILE CLOSE */}

        <button
          className="mobile-close-btn"
          onClick={closeMenu}
          aria-label="Close navigation"
        >
          ×
        </button>


        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          <NavLink
            to="/"
            onClick={closeMenu}
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>▦</span>
            Overview
          </NavLink>


          <NavLink
            to="/library"
            onClick={closeMenu}
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>▥</span>
            My Library
          </NavLink>

          <NavLink
            to="/arrange"
            onClick={closeMenu}
            className={({ isActive }) =>
              `nav-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span>▤</span>
            Arrange Library
          </NavLink>

        </nav>

      </aside>
    </>
  );
}

export default Sidebar;