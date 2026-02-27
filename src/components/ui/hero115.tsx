import { Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Hero115Props {
  icon?: React.ReactNode;
  heading: string;
  description: string;
  button: {
    text: string;
    icon?: React.ReactNode;
    onClick?: () => void;
  };
  trustText?: string;
  imageSrc?: string;
  imageAlt?: string;
}

const Hero115 = ({
  icon = <Bot className="size-6" />,
  heading = "Automate Your Crypto Trading with Pine Script",
  description = "Write your own trading strategies, connect your Binance wallet, and let the bot execute trades automatically. Full control. Zero manual intervention.",
  button = {
    text: "Start Trading Free",
    icon: <Zap className="ml-2 size-4" />,
    onClick: () => {},
  },
  trustText = "Trusted by traders worldwide",
  imageSrc,
  imageAlt = "Trading dashboard",
}: Hero115Props) => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      
      <div className="container relative mx-auto px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left content */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            {/* Icon badge */}
            <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <span className="text-primary">{icon}</span>
              <span className="text-sm font-medium text-primary">
                Pine Script-Powered Trading
              </span>
            </div>

            {/* Heading */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {heading}
            </h1>

            {/* Description */}
            <p className="mb-8 max-w-xl text-lg text-muted-foreground">
              {description}
            </p>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4 lg:items-start">
              <Button
                size="lg"
                className="text-lg px-8"
                onClick={button.onClick}
              >
                {button.text} {button.icon}
              </Button>
              {trustText && (
                <p className="text-sm text-muted-foreground">{trustText}</p>
              )}
            </div>
          </div>

          {/* Right image */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border/50 shadow-2xl shadow-primary/10">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full object-cover"
              />
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero115 };
