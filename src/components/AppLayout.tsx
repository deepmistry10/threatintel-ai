import { motion } from "framer-motion";
import { Shield, BarChart3, Search, Brain, Settings, LogOut, Menu, X, AlertTriangle, Rss, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Incidents", href: "/dashboard/incidents", icon: AlertTriangle },
    { name: "IOCs", href: "/dashboard/iocs", icon: Shield },
    { name: "Security Logs", href: "/dashboard/logs", icon: Search },
    { name: "AI Analysis", href: "/dashboard/analysis", icon: Brain },
    { name: "Threat Hunt", href: "/dashboard/hunt", icon: Search },
    { name: "Threat Feeds", href: "/dashboard/feeds", icon: Rss },
    { name: "MITRE Coverage", href: "/dashboard/mitre", icon: Target },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-cyber dark">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-glow transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-glow">
            <motion.div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/dashboard")}
              whileHover={{ scale: 1.05 }}
            >
              <Shield className="h-8 w-8 text-neon-green glow-green" />
              <span className="text-xl font-bold text-neon-green">ThreatIntel</span>
            </motion.div>
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <motion.button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                    isActive 
                      ? "bg-primary/20 text-neon-green border border-primary/30 glow-green" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-glow">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-neon-green">
                  {user?.name?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role || "user"}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full border-glow"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-glow">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2 lg:hidden">
              <Shield className="h-6 w-6 text-neon-green" />
              <span className="font-bold text-neon-green">ThreatIntel</span>
            </div>
            
            <div className="hidden lg:block" />
          </div>
        </div>

        {/* Page content */}
        <main className="p-0 m-0 w-full flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}