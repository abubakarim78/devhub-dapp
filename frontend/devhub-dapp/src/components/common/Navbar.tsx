import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Menu,
  Moon,
  Sun,
  X,
  FolderKanban,
  Home,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { SignInButton } from "../SignInButton";
import { useTheme } from "@/contexts/ThemeContext";
import { useContract } from "@/hooks/useContract";

interface NavbarProps {
  isAdmin?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
}

const NavLink = ({
  href,
  children,
  icon: Icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ElementType;
}) => {
  const location = useLocation();
  const isActive = location.pathname === href;
  return (
    <Link
      to={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </Link>
  );
};

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-secondary text-secondary-foreground"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

const Navbar: React.FC<NavbarProps> = ({ isAdmin = false }) => {
  const currentAccount = useCurrentAccount();
  const { isSuperAdmin } = useContract();
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [isScrolling, setIsScrolling] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (currentAccount) {
      // Only show Super Admin link to the publisher address (super_admin)
      isSuperAdmin(currentAccount.address).then(setIsSuperAdminUser);
    } else {
      setIsSuperAdminUser(false);
    }
  }, [currentAccount, isSuperAdmin]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolling(true);
      } else {
        setIsScrolling(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Explore", icon: Search },
    ...(currentAccount
      ? [
          { href: "/opportunities", label: "Opportunities", icon: FolderKanban },
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
      : []),
    // Publisher (super admin) should NOT see regular Admin link - only Super Admin
    // Regular admins see Admin link, publisher sees Super Admin link (mutually exclusive)
    ...(currentAccount && isAdmin && !isSuperAdminUser ? [{ href: "/admin", label: "Admin" }] : []),
    // Only show Super Admin link to the publisher address (super_admin)
    ...(currentAccount && isSuperAdminUser ? [{ href: "/super-admin", label: "Super Admin" }] : []),
  ];

  // Get first 4 nav items for mobile icon display
  // Always show 4 icons: Home, Explore, Opportunities, Dashboard
  const mobileNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Explore", icon: Search },
    { href: "/opportunities", label: "Opportunities", icon: FolderKanban },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolling
          ? "bg-background/95 backdrop-blur-lg border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8 xl:px-10">
        <div className="flex justify-between items-start lg:items-center py-2 lg:py-0 min-h-[64px] lg:h-16 sm:lg:h-20">
          <Link to="/" className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 group flex-shrink-0 pt-1 lg:pt-0">
            <img 
              src="/DevHub.jpg" 
              alt="TumaHub Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg object-cover"
            />
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground hidden xs:inline">TumaHub</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile Right Side with Icons - Two Rows */}
          <div className="lg:hidden flex flex-col items-end gap-1.5 min-w-0 flex-shrink-0 pt-1">
            {/* Top Row: Home + Explore + Dashboard (Stats) + Connect + Theme + Menu */}
            <div className="flex items-center gap-0.5 flex-shrink-0" style={{ maxWidth: '100%', flexWrap: 'nowrap' }}>
              {mobileNavItems.slice(0, 2).map((item) => {
                const Icon = item.icon || Home;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    title={item.label}
                  >
                    <Icon size={16} />
                  </Link>
                );
              })}
              {/* Dashboard (Stats) icon - before Connect */}
              {mobileNavItems[3] && (
                <Link
                  to={mobileNavItems[3].href}
                  className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                    isActive(mobileNavItems[3].href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  title={mobileNavItems[3].label}
                >
                  <LayoutDashboard size={16} />
                </Link>
              )}
              <div className="flex-shrink-0" style={{ fontSize: '0.7rem', lineHeight: '1' }}>
                <SignInButton />
              </div>
              <div className="flex-shrink-0 p-1">
                <ThemeSwitcher />
              </div>
              <button
                aria-label="Toggle menu"
                className="inline-flex items-center justify-center rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-accent flex-shrink-0"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
            {/* Bottom Row: Opportunities icon */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {mobileNavItems[2] && (
                <Link
                  to={mobileNavItems[2].href}
                  className={`p-1 sm:p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                    isActive(mobileNavItems[2].href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                  title={mobileNavItems[2].label}
                >
                  <FolderKanban size={16} className="sm:w-[18px] sm:h-[18px]" />
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
            <SignInButton />
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile Nav Panel */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden pb-4 px-4 bg-background/95 backdrop-blur-lg border-b border-border"
        >
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.icon && <item.icon size={18} />}
                {item.label}
              </Link>
            ))}
            <div className="pt-2">
              <SignInButton />
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Navbar;
