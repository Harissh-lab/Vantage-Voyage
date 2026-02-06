import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { 
  LogOut, 
  CalendarDays, 
  Users, 
  Settings, 
  Sparkles,
  LayoutDashboard
} from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    // Only show Events link if on mobile or if needed as a dedicated route
    // { icon: CalendarDays, label: "Events", href: "/events" }, 
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Navigation />
      <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground hidden md:flex flex-col fixed inset-y-0 top-[52px]">
        <div className="p-8">
          <h1 className="text-2xl font-serif italic text-secondary">Vantage Voyage</h1>
          <p className="text-xs text-primary-foreground/60 mt-1 uppercase tracking-widest">Hospitality</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                location === item.href 
                  ? "bg-white/10 text-white" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}>
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
              {user?.firstName?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      </div>
    </div>
  );
}
