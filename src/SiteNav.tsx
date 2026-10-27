import { NavLink, useLocation } from 'react-router-dom';
import { roleLabel } from './format';
import { ThemeToggle, confirmAction } from './FinalFeatures';
import { roleNavItems } from './navigation';

type User = { id: string; display_name: string; role: string; avatar_path?: string | null };

export function SiteNav({ user, cartCount, onLogout }: { user: User | null; cartCount: number; onLogout: () => Promise<void> }) {
  const { pathname } = useLocation();
  const active = ({ isActive }: { isActive: boolean }) => isActive ? 'active' : undefined;
  return <nav aria-label="Main navigation">
    <NavLink to="/" end className={active}>Explore</NavLink>
    {roleNavItems(user?.role).map(item => item.children ? <details className={`nav-menu ${pathname.startsWith('/admin') ? 'active-group' : ''}`} key={item.label}><summary>{item.label}</summary><div className="nav-menu-items">
      {item.children.map(child => <NavLink key={child.to} to={child.to} className={active}>{child.label}</NavLink>)}
    </div></details> : <NavLink key={item.to} to={item.to} end={item.to === '/seller'} className={active}>{item.label}</NavLink>)}
    <NavLink to="/orders" className={active}>Orders</NavLink>
    <NavLink to="/wallet" className={`wallet-link ${pathname === '/wallet' ? 'active' : ''}`}>Me-Wallet</NavLink>
    <NavLink to="/cart" className={`cartlink ${pathname === '/cart' ? 'active' : ''}`} aria-label={`Cart, ${cartCount} items`}>
      <svg className="cart-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <b>{cartCount}</b>
    </NavLink>
    <ThemeToggle />
    {user ? <details className="nav-menu account-menu"><summary aria-label={`Profile menu for ${user.display_name}`}>
      {user.avatar_path ? <img className="nav-avatar" src={user.avatar_path} alt="" /> : <span className="avatar-fallback">{user.display_name.slice(0, 1).toUpperCase()}</span>}
      <span className="account-name">{user.display_name}<small className={`role-badge ${user.role}`}>{roleLabel(user.role)}</small></span>
    </summary><div className="nav-menu-items account-items"><NavLink to="/profile" className={active}>Profile</NavLink>
      <button type="button" onClick={() => void (async () => { if (await confirmAction('Are you sure you want to log out?')) await onLogout(); })()}>Logout</button>
    </div></details> : <span className="auth-nav"><NavLink to="/login" className={active}>Login</NavLink><NavLink to="/register" className="button small">Register</NavLink></span>}
  </nav>;
}
