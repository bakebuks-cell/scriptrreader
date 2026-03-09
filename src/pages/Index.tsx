import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Web3MediaHero } from '@/components/ui/web3media-hero';
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
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import HeroVideoPlayer from '@/components/HeroVideoPlayer';
import logo from '@/assets/logo.png';

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

  const navRight = (
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
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Web3MediaHero
        logo="LoveWithTrade"
        logoImage={logo}
        navigation={[
          { label: 'Features', href: '#features', active: true },
          { label: 'Insights', href: '#about' },
          { label: 'About', href: '#disclaimer' },
          { label: 'Case Studies', href: '#', strikethrough: true },
          { label: 'Contact', href: '#cta' },
        ]}
        contactButton={
          !user
            ? { label: 'Get Started for Free', onClick: handleGetStarted }
            : undefined
        }
        navRight={navRight}
        title="Where Innovation Meets"
        highlightedText="Execution"
        subtitle="Automate your crypto trading with powerful bots and strategy tools. Test, deploy, and scale — without monitoring charts all day."
        ctaButton={{
          label: 'Get Started for Free',
          onClick: handleGetStarted,
        }}
        secondaryButton={{
          label: "Let's Get Connected",
          onClick: () => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' }),
        }}
        disclaimerText="Average users may expect around 6%–9% returns depending on strategy and market conditions. Trading always involves risk and profits are never guaranteed."
        backgroundElement={<HeroVideoPlayer />}
        cryptoIcons={[
          {
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#FF9900" />
                <path d="M12 6V18M8 9H13.5C14.163 9 14.7989 9.26339 15.2678 9.73223C15.7366 10.2011 16 10.837 16 11.5C16 12.163 15.7366 12.7989 15.2678 13.2678C14.7989 13.7366 14.163 14 13.5 14H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            label: 'BTC',
            position: { x: '8%', y: '25%' },
          },
          {
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 1.5L5.5 12.5L12 16.5L18.5 12.5L12 1.5Z" fill="#FF9900" />
                <path d="M12 1.5L5.5 12.5L12 16.5V1.5Z" fill="#FFB84D" />
                <path d="M12 18L5.5 14L12 22.5L18.5 14L12 18Z" fill="#FF9900" />
              </svg>
            ),
            label: 'ETH',
            position: { x: '12%', y: '62%' },
          },
          {
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#FF9900" />
                <circle cx="12" cy="12" r="3" fill="white" />
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white" />
              </svg>
            ),
            label: 'USDT',
            position: { x: '82%', y: '22%' },
          },
          {
            icon: (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="12" fill="#FF9900" />
                <path d="M7 12L10.5 8.5L14 12L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 9H17V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            label: 'BNB',
            position: { x: '78%', y: '65%' },
          },
        ]}
        trustedByText="Supported Exchanges"
        brands={exchanges.map((name) => ({
          name,
          logo: (
            <span className="text-white/60 text-sm font-medium tracking-wide whitespace-nowrap">
              {name}
            </span>
          ),
        }))}
      />

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
