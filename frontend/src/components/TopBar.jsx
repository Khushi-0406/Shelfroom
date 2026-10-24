function TopBar() {
  return (
    <header className="topbar">
      <div>
        <span></span>
        <span> • </span>
        <span>Welcome Reader, Khush</span>
      </div>

      <div className="topbar-right">
        <span className="search-icon">⌕</span>
        <div className="profile">K</div>
      </div>
    </header>
  );
}

export default TopBar;