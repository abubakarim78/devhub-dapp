import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Code2,
  Menu,
  Moon,
  Sun,
  X,
  FolderKanban,
} from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
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
      isSuperAdmin(currentAccount.address).then(setIsSuperAdminUser);
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
    { href: "/", label: "Home" },
    { href: "/browse", label: "Explore" },
    ...(currentAccount
      ? [
          { href: "/projects", label: "Opportunities", icon: FolderKanban },
          { href: "/dashboard", label: "Dashboard" },
        ]
      : []),
    ...(currentAccount && isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    ...(currentAccount && isSuperAdminUser ? [{ href: "/super-admin", label: "Super Admin" }] : []),
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
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 group">
            <div className="p-1.5 sm:p-2 bg-primary rounded-lg">
              <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">DevHub</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden sm:block">
              <ConnectButton />
            </div>
            <ThemeSwitcher />
            <button
              aria-label="Toggle menu"
              className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
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
              <ConnectButton />
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Navbar;
