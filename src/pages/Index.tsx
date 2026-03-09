import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  Bot,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Store,
  LineChart,
  Wallet,
  Globe,
  AlertTriangle,
  Play,
  Layers,
  Cpu,
  Activity
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import HeroVideoPlayer from '@/components/HeroVideoPlayer';
import logo from '@/assets/logo.png';

const exchanges = ['Binance', 'Bybit', 'Bitget', 'KuCoin', 'MEXC', 'BingX', 'BitMart'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const navLinks = [
  { label: 'Features', href: '#features', active: true },
  { label: 'Insights', href: '#about' },
  { label: 'About', href: '#disclaimer' },
  { label: 'Case Studies', href: '#', strikethrough: true },
  { label: 'Contact', href: '#cta' },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="LoveWithTrade" className="h-10 w-auto" />
            <span className="text-lg font-medium tracking-tight text-white">LoveWithTrade</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-4 py-2 text-sm rounded-full transition-all ${
                  link.active
                    ? 'bg-white/10 border border-white/20 text-white'
                    : link.strikethrough
                    ? 'text-white/40 line-through cursor-not-allowed'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {loading ? null : user ? (
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-white text-black hover:bg-white/90 rounded-full px-5 text-sm font-medium"
              >
                Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-white to-white/80 text-black hover:from-white/90 hover:to-white/70 rounded-full px-5 text-sm font-medium"
              >
                Get Started for Free
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
        {/* Background Video */}
        <HeroVideoPlayer />

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-10"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            {[
              { icon: Layers, label: 'Integrated with Binance' },
              { icon: Cpu, label: 'AI-Powered Strategies' },
              { icon: Activity, label: 'Real-time Execution' },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white/80"
              >
                <badge.icon className="h-4 w-4 text-white/60" />
                <span>{badge.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tight leading-[1.05] mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
          >
            Where Innovation
            <br />
            Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Execution</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
          >
            Automate your crypto trading with powerful bots and strategy tools.
            <br className="hidden sm:block" />
            Test, deploy, and scale — without monitoring charts all day.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-black text-white border border-white/30 hover:bg-white/10 rounded-full px-8 text-base font-medium"
            >
              Get Started for Free
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => {
                document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-white/80 border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full px-8 text-base font-medium"
            >
              Let's Get Connected
            </Button>
          </motion.div>

          {/* Returns disclaimer */}
          <motion.p
            className="text-xs text-white/30 max-w-md mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
          >
            Average users may expect around 6%–9% returns depending on strategy and market conditions.
            Trading always involves risk and profits are never guaranteed.
          </motion.p>
        </div>

        {/* Logo Marquee */}
        <motion.div
          className="relative z-10 mt-16 w-full border-t border-white/5 pt-8 pb-10"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={5}
        >
          <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-6">
            Supported Exchanges
          </p>
          <div className="flex justify-center items-center gap-10 flex-wrap px-6 opacity-40">
            {exchanges.map((exchange) => (
              <span key={exchange} className="text-white/60 text-sm font-medium tracking-wide">
                {exchange}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Rest of the page uses themed colors ── */}
      <div className="bg-background text-foreground">
        {/* About Platform */}
        <section id="about" className="py-20 px-6 bg-accent/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary mb-2">About Platform</p>
              <h2 className="text-3xl font-bold mb-4">What is LoveWithTrade?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                LoveWithTrade is a crypto trading automation platform designed for traders who want to:
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                { icon: Bot, text: 'Automate trading strategies' },
                { icon: Wallet, text: 'Manage portfolios across exchanges' },
                { icon: TrendingUp, text: 'Use smart trailing features' },
                { icon: Store, text: 'Discover strategies from other traders' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
              Whether you are a beginner or an experienced trader, the platform gives you the tools to trade efficiently without monitoring charts all day.
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section id="disclaimer" className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500 mb-1">Important Disclaimer</p>
                    <h3 className="text-xl font-bold mb-3 text-foreground">No Profit Guarantee</h3>
                    <p className="text-muted-foreground mb-2">
                      LoveWithTrade does not promise or guarantee profits. All strategies depend on market conditions and user configuration.
                    </p>
                    <p className="text-muted-foreground mb-2">
                      Average returns from many users may range between <span className="font-semibold">6% – 9%</span>, but results can vary.
                    </p>
                    <p className="text-muted-foreground font-medium">
                      Trading cryptocurrencies involves risk. Always trade responsibly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Strategy Marketplace */}
        <section id="features" className="py-20 px-6 bg-accent/30">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-medium text-primary mb-2">Strategy Marketplace</p>
                <h2 className="text-3xl font-bold mb-4">Earn by Selling Your Strategy</h2>
                <p className="text-muted-foreground mb-6">
                  Create your own trading strategy and publish it on the marketplace. If other traders find your strategy profitable and choose to use it, they can subscribe to it — and you earn from every user who uses your strategy.
                </p>
                <div className="space-y-3">
                  {['Create strategy', 'Publish on marketplace', 'Earn when users subscribe'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="size-5 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Store className="h-24 w-24 text-primary/40" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trading Bots */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-medium text-primary mb-2">Trading Bots</p>
              <h2 className="text-3xl font-bold mb-4">Powerful Automated Trading Bots</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our bots help execute trades automatically based on your selected strategy.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Zap, title: 'Smart automated trading' },
                { icon: BarChart3, title: 'Strategy based execution' },
                { icon: Shield, title: 'Risk management tools' },
                { icon: LineChart, title: 'Continuous market monitoring' },
              ].map((item, i) => (
                <Card key={i} className="bg-card hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-lg font-medium text-foreground">{item.title}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8">
              Let the bots handle the trades while you focus on strategy.
            </p>
          </div>
        </section>

        {/* Trailing Features */}
        <section className="py-20 px-6 bg-accent/30">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center order-2 md:order-1">
                <div className="w-64 h-64 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-24 w-24 text-primary/40" />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <p className="text-sm font-medium text-primary mb-2">Trailing Features</p>
                <h2 className="text-3xl font-bold mb-4">Advanced Trailing Tools</h2>
                <p className="text-muted-foreground mb-6">
                  Maximize profits with smart trailing features.
                </p>
                <div className="space-y-3 mb-6">
                  {['Trailing Stop Loss', 'Trailing Take Profit', 'Dynamic market tracking'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="size-5 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground">
                  These features help capture gains while protecting your portfolio from sudden market movements.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Management */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-medium text-primary mb-2">Portfolio Management</p>
                <h2 className="text-3xl font-bold mb-4">Manage Your Crypto Portfolio</h2>
                <p className="text-muted-foreground mb-6">
                  Track and manage your assets across multiple exchanges from a single dashboard.
                </p>
                <div className="space-y-3 mb-6">
                  {['Real-time portfolio tracking', 'Multi-exchange support', 'Performance monitoring'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="size-5 text-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground">Stay in control of your investments.</p>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Wallet className="h-24 w-24 text-primary/40" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Exchanges */}
        <section className="py-20 px-6 bg-accent/30">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-sm font-medium text-primary mb-2">Supported Exchanges</p>
            <h2 className="text-3xl font-bold mb-4">Trade on Major Exchanges</h2>
            <p className="text-muted-foreground mb-10">
              LoveWithTrade supports major cryptocurrency exchanges. Connect securely using API keys and start trading.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {exchanges.map((exchange) => (
                <div key={exchange} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border">
                  <Globe className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">{exchange}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-20 px-6 bg-primary/5">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Try the Platform With a Demo</h2>
            <p className="text-muted-foreground mb-2">Want to see how it works?</p>
            <p className="text-muted-foreground mb-8">
              Request a demo and explore automated trading with LoveWithTrade. Start trading smarter today.
            </p>
            <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
              Request Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="LoveWithTrade" className="h-16 w-auto" />
              <span className="font-semibold">LoveWithTrade</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LoveWithTrade. All rights reserved. Developed by{' '}
              <a href="https://www.arenaitech.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Arenaitech
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
