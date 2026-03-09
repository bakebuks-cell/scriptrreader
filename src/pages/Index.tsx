import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Play
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import logo from '@/assets/logo.png';
import heroImage from '@/assets/hero-trading.jpg';

const exchanges = ['Binance', 'Bybit', 'Bitget', 'KuCoin', 'MEXC', 'BingX', 'BitMart'];

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="LoveWithTrade" className="h-16 w-auto" />
            <span className="text-xl font-bold">LoveWithTrade</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {loading ? null : user ? (
              <Button onClick={() => navigate('/dashboard')}>
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container relative mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
                <Bot className="size-5 text-primary" />
                <span className="text-sm font-medium text-primary">Smart Trading Automation</span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                Automate Your Crypto Trading With Smart Bots
              </h1>

              <p className="mb-4 text-xl font-semibold text-foreground">
                Trade smarter, not harder.
              </p>

              <p className="mb-6 max-w-xl text-lg text-muted-foreground">
                LoveWithTrade provides powerful automated trading bots and strategy tools that help you manage and grow your crypto portfolio efficiently.
              </p>

              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-5 text-primary" />
                  <span>No complicated setups</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-5 text-primary" />
                  <span>Works with multiple exchanges</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="size-5 text-primary" />
                  <span>Create, test, and sell your strategies</span>
                </div>
              </div>

              <p className="mb-2 text-sm text-muted-foreground">
                Start automating your trading today.
              </p>
              <p className="mb-2 text-sm text-muted-foreground">
                Average users may expect around <span className="font-semibold text-primary">6% – 9%</span> returns depending on strategy and market conditions.
              </p>
              <p className="mb-6 text-xs text-muted-foreground italic">
                However, trading always involves risk and profits are never guaranteed.
              </p>

              <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
                Request Demo
                <Play className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-border/50 shadow-2xl shadow-primary/10">
                <img src={heroImage} alt="LoveWithTrade - Automated crypto trading dashboard" className="w-full object-cover" />
              </div>
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* About Platform */}
      <section className="py-20 px-6 bg-accent/30">
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
      <section className="py-16 px-6">
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
      <section className="py-20 px-6 bg-accent/30">
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
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Try the Platform With a Demo</h2>
          <p className="text-muted-foreground mb-2">
            Want to see how it works?
          </p>
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
  );
}
