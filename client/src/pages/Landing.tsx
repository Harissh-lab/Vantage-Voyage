import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Star, Shield, Globe } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-foreground">
      {/* Simple Nav */}
      <nav className="absolute top-0 w-full z-10 px-6 py-6 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-serif italic font-bold text-primary">Vantage Voyage</div>
          {user && (
            <div className="flex gap-4">
              <Link href="/dashboard">
                <button className="px-6 py-2 bg-white/50 backdrop-blur border border-primary/10 rounded-full font-medium text-primary hover:bg-white transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            className="text-5xl md:text-7xl font-serif font-medium leading-tight text-primary mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Tiered Hospitality <br />
            <span className="italic text-accent-foreground/80">Reimagined.</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Empower agents and clients to manage complex event logistics with a specialized permission system. Streamlined workflows for hosts and service providers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/agent/signin">
              <button className="px-8 py-4 bg-primary text-white rounded-full font-medium text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                Agent Login
              </button>
            </Link>
            <Link href="/auth/client/signin">
              <button className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-full font-medium text-lg hover:bg-primary hover:text-white transition-all">
                Client Login
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white/50 backdrop-blur-sm border-t border-border/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          {[
            { 
              icon: Globe, 
              title: "Global Logistics", 
              desc: "Seamlessly manage travel itineraries, transfers, and accommodations for guests worldwide." 
            },
            { 
              icon: Shield, 
              title: "Tiered Permissions", 
              desc: "Granular control over what guests see. VIPs get exclusive perks, staff get logistics." 
            },
            { 
              icon: Star, 
              title: "Concierge Service", 
              desc: "A personalized add-on marketplace for guests to request upgrades and amenities." 
            }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              className="p-8 rounded-2xl bg-white border border-border/40 shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center text-primary mb-6">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stock Image Section - Styled */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative h-[500px]">
          {/* scenic event landscape luxury */}
          <img 
            src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Event" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-12">
            <div className="max-w-2xl text-white">
              <h2 className="text-4xl font-serif font-bold mb-4">Curate Unforgettable Moments</h2>
              <p className="text-white/80 text-lg">Every detail matters. Give your guests the seamless experience they deserve.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
