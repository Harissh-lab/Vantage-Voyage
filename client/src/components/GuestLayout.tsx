import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";

interface GuestLayoutProps {
  children: React.ReactNode;
  step: 1 | 2 | 3;
  bookingRef?: string;
}

export function GuestLayout({ children, step, bookingRef }: GuestLayoutProps) {
  const steps = [
    { num: 1, label: "Invitation", href: "/guest" },
    { num: 2, label: "Travel & Rooming", href: bookingRef ? `/guest/travel?ref=${bookingRef}` : "#" },
    { num: 3, label: "Concierge", href: bookingRef ? `/guest/concierge?ref=${bookingRef}` : "#" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-foreground font-sans selection:bg-accent/30">
      <Navigation />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-[52px] z-50 border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-baseline gap-1 cursor-pointer">
              <span className="font-serif text-2xl font-bold text-primary italic">Vantage Voyage</span>
            </div>
          </Link>

          {/* Stepper (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {steps.map((s) => {
              const isActive = s.num === step;
              const isCompleted = s.num < step;
              
              return (
                <div key={s.num} className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                    ${isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                      : isCompleted 
                        ? "bg-secondary text-primary" 
                        : "bg-muted text-muted-foreground"}
                  `}>
                    {s.num}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                  {s.num < 3 && (
                    <div className="w-12 h-[1px] bg-border mx-2" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content with Transition */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-sm text-muted-foreground border-t border-border/40 mt-12">
        <p>© 2024 Vantage Voyage Hospitality. All rights reserved.</p>
      </footer>
    </div>
  );
}
