import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, Wallet } from 'lucide-react';

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <Wallet size={20} strokeWidth={2.2} />
          </span>
          <span className="brand-text">
            <strong>InvoiceTrack</strong>
            <small>Payment tracking</small>
          </span>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>
          <NavLink
            to="/invoices"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <ReceiptText size={18} />
            Invoices
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <span className="sidebar-dot" />
          Single-business workspace
        </div>
      </aside>

      <main className="main">
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
