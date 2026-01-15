import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { Menu, X, Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch, useGlobalSearch } from "@/components/search/GlobalSearch";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isOpen: isSearchOpen, setIsOpen: setSearchOpen } = useGlobalSearch();
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setSearchOpen(false)} />
      
      {/* Mobile header - Fixed at top */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 bg-card/95 backdrop-blur-md border-b border-border lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
          
          <span className="font-display font-bold text-gradient-gold">CreditWise</span>
          
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
        </header>
      )}
      
      {/* Search button - Desktop */}
      {!isMobile && (
        <button
          onClick={() => setSearchOpen(true)}
          className="fixed top-4 right-6 z-50 flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-border shadow-lg hover:border-primary/50 transition-colors"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Buscar...</span>
          <kbd className="ml-2 flex items-center gap-0.5 rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "lg:block",
        isMobile && !isMobileMenuOpen && "hidden",
        isMobile && isMobileMenuOpen && "block"
      )}>
        <Sidebar />
      </div>

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "flex-1 p-4 sm:p-6 lg:p-8 transition-all",
          !isMobile && "ml-64",
          isMobile && "ml-0 pt-14"
        )}
      >
        {/* Background glow effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/3 rounded-full blur-3xl" />
        </div>
        
        {children}
      </motion.main>
    </div>
  );
}
