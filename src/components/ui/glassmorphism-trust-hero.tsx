import React from "react";
import {
  ArrowRight,
  Play,
  Zap,
  CheckCircle2,
  Hexagon,
  Triangle,
  Command,
  Ghost,
  Gem,
  Cpu,
  TrendingUp,
  Crown,
  Target,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const PARTNERS = [
  { name: "Binance", icon: Hexagon },
  { name: "TradingView", icon: Triangle },
  { name: "PineScript", icon: Command },
  { name: "MetaTrader", icon: Ghost },
  { name: "CoinGecko", icon: Gem },
  { name: "Blockchain", icon: Cpu },
];

const StatItem = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

interface HeroSectionProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
  isLoggedIn?: boolean;
}

export default function HeroSection({ onGetStarted, onLearnMore, isLoggedIn }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Scoped Animations */}
      <style>{`
        @keyframes heroFadeSlideIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes heroPulseGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .hero-animate-in {
          animation: heroFadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .hero-marquee {
          animation: heroMarquee 40s linear infinite;
        }
        .hero-glow {
          animation: heroPulseGlow 3s ease-in-out infinite;
        }
        .hero-delay-100 { animation-delay: 0.1s; }
        .hero-delay-200 { animation-delay: 0.2s; }
        .hero-delay-300 { animation-delay: 0.3s; }
        .hero-delay-400 { animation-delay: 0.4s; }
        .hero-delay-500 { animation-delay: 0.5s; }
        .hero-delay-600 { animation-delay: 0.6s; }
      `}</style>

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/70 to-background/90" />

      {/* Decorative glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl hero-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl hero-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-28 pb-16 md:pt-32 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* --- LEFT COLUMN --- */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="hero-animate-in hero-delay-100">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-sm font-medium text-primary">
                  Pine Script-Powered Trading
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="hero-animate-in hero-delay-200 space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                <span className="text-foreground">Automate Your</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Crypto Trading
                </span>
                <br />
                <span className="text-foreground">With Pine Script</span>
              </h1>
            </div>

            {/* Description */}
            <p className="hero-animate-in hero-delay-300 text-lg text-muted-foreground max-w-lg leading-relaxed">
              Write your own trading strategies, connect your Binance wallet, and let
              the bot execute trades automatically. Full control. Zero manual intervention.
            </p>

            {/* CTA Buttons */}
            <div className="hero-animate-in hero-delay-400 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base px-8 h-12 shadow-lg shadow-primary/20" onClick={onGetStarted}>
                {isLoggedIn ? "Go to Dashboard" : "Start Trading Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-12 backdrop-blur-sm bg-background/30 border-border/50"
                onClick={onLearnMore}
              >
                <Play className="mr-2 h-4 w-4" />
                Learn More
              </Button>
            </div>

            {/* Trust text */}
            <div className="hero-animate-in hero-delay-500">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-primary fill-primary" />
                Trusted by 1,000+ traders worldwide
              </p>
              <div className="flex flex-wrap items-center gap-5 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>5 Free Trades</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Encrypted API Keys</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="hero-animate-in hero-delay-300 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl blur-xl" />
              <div className="relative glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">1,200+</p>
                    <p className="text-sm text-muted-foreground">Trades Executed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-semibold text-primary">94%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[94%] bg-gradient-to-r from-primary to-primary/70 rounded-full" />
                  </div>
                </div>

                <div className="border-t border-border" />

                <div className="grid grid-cols-3 gap-4">
                  <StatItem value="50+" label="Active Bots" />
                  <StatItem value="24/7" label="Uptime" />
                  <StatItem value="<1s" label="Execution" />
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    LIVE
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                    <Crown className="h-3 w-3" />
                    PREMIUM
                  </span>
                </div>
              </div>
            </div>

            {/* Marquee Card */}
            <div className="hero-animate-in hero-delay-500 glass rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Powered By Industry Leaders
              </p>
              <div className="overflow-hidden">
                <div className="flex hero-marquee w-max">
                  {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((partner, i) => (
                    <div key={i} className="flex items-center gap-2 px-5 shrink-0">
                      <partner.icon className="h-5 w-5 text-muted-foreground/60" />
                      <span className="text-sm font-medium text-muted-foreground/80 whitespace-nowrap">
                        {partner.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
