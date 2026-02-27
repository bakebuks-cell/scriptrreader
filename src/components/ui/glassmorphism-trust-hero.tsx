import React from "react";
import {
  ArrowRight,
  Play,
  Target,
  Crown,
  Star,
  Hexagon,
  Triangle,
  Command,
  Ghost,
  Gem,
  Cpu,
  Bot,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Scoped Animations */}
      <style>{`
        @keyframes heroFadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .hero-animate-in {
          animation: heroFadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .hero-marquee {
          animation: heroMarquee 40s linear infinite;
        }
        .hero-delay-100 { animation-delay: 0.1s; }
        .hero-delay-200 { animation-delay: 0.2s; }
        .hero-delay-300 { animation-delay: 0.3s; }
        .hero-delay-400 { animation-delay: 0.4s; }
        .hero-delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Background Image with Gradient Mask */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* --- LEFT COLUMN --- */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="hero-animate-in hero-delay-100">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Pine Script-Powered Trading
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="hero-animate-in hero-delay-200 text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              <span className="text-foreground">Automate Your</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Crypto Trading
              </span>
              <br />
              <span className="text-foreground">With Pine Script</span>
            </h1>

            {/* Description */}
            <p className="hero-animate-in hero-delay-300 text-lg text-muted-foreground max-w-lg">
              Write your own trading strategies, connect your Binance wallet, and let
              the bot execute trades automatically. Full control. Zero manual intervention.
            </p>

            {/* CTA Buttons */}
            <div className="hero-animate-in hero-delay-400 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8" onClick={onGetStarted}>
                {isLoggedIn ? "Go to Dashboard" : "Start Trading Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 backdrop-blur-sm bg-background/50"
                onClick={onLearnMore}
              >
                <Play className="mr-2 h-4 w-4" />
                Learn More
              </Button>
            </div>

            {/* Trust Pills */}
            <div className="hero-animate-in hero-delay-500 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
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
                <span>Secure API</span>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="hero-animate-in hero-delay-200 relative">
              {/* Card Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-xl" />

              <div className="relative glass rounded-2xl p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">1,200+</p>
                    <p className="text-sm text-muted-foreground">Trades Executed</p>
                  </div>
                </div>

                {/* Progress Bar */}
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

                {/* Mini Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <StatItem value="50+" label="Active Bots" />
                  <StatItem value="24/7" label="Uptime" />
                  <StatItem value="<1s" label="Execution" />
                </div>

                {/* Tag Pills */}
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
            <div className="hero-animate-in hero-delay-400 glass rounded-2xl p-4 space-y-3">
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
