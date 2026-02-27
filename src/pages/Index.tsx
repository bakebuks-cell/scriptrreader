import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Code, 
  Shield, 
  Zap, 
  Wallet, 
  Bot,
  ArrowRight,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import logo from '@/assets/logo.png';

const features = [
  {
    icon: Code,
    title: 'Pine Script Powered',
    description: 'Write your own trading strategies using Pine Script. Full control over entry, exit, stop loss, and take profit.'
  },
  {
    icon: Bot,
    title: 'Automated Trading',
    description: 'Connect your Binance account and let the bot execute trades automatically based on your Pine Script logic.'
  },
  {
    icon: Wallet,
    title: 'Direct Exchange Integration',
    description: 'Trade directly from your own Binance wallet. Spot and futures trading supported.'
  },
  {
    icon: Shield,
    title: 'Secure & Encrypted',
    description: 'Your API keys are encrypted. Role-based access ensures your data stays protected.'
  },
  {
    icon: Zap,
    title: 'Real-time Execution',
    description: 'Pine Script signals trigger instant trade execution on Binance with no manual intervention.'
  },
  {
    icon: TrendingUp,
    title: 'Track Performance',
    description: 'Monitor your trades, PnL, wallet balance, and coin usage from a unified dashboard.'
  }
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Love With Trade" className="h-14 w-auto" />
            <span className="text-xl font-bold">Love With Trade</span>
          </div>
          <div className="flex items-center gap-4">
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
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Pine Script-Powered Trading</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Automate Your Crypto Trading with Pine Script
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Write your own trading strategies, connect your Binance wallet, and let PineTrader execute trades automatically. 
            Full control. Zero manual intervention.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
              Start Trading Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
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
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Trade Smarter</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              PineTrader gives you the tools to automate your trading with your own custom Pine Script strategies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">Get started in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Write Your Strategy</h3>
              <p className="text-muted-foreground">Create your Pine Script trading strategy with custom entry, exit, SL, and TP rules.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Binance</h3>
              <p className="text-muted-foreground">Securely connect your Binance API keys. Your keys are encrypted and never exposed.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Enable & Trade</h3>
              <p className="text-muted-foreground">Turn on your bot and watch it execute trades automatically based on your strategy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Automate Your Trading?</h2>
          <p className="text-muted-foreground mb-8">
            Start with 5 free trades. No credit card required. Full Pine Script control.
          </p>
          <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Love With Trade" className="h-12 w-auto" />
            <span className="font-semibold">Love With Trade</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Love With Trade. All rights reserved. Developed by{' '}
            <a href="https://www.arenaitech.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Arenaitech
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
