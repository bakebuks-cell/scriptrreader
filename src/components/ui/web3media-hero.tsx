import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CryptoIcon {
  icon: React.ReactNode;
  label: string;
  position: { x: string; y: string };
}

interface Web3MediaHeroProps {
  logo?: string;
  logoImage?: string;
  navigation?: Array<{
    label: string;
    href?: string;
    active?: boolean;
    strikethrough?: boolean;
    onClick?: () => void;
  }>;
  contactButton?: {
    label: string;
    onClick: () => void;
  };
  title: string;
  highlightedText?: string;
  subtitle: string;
  ctaButton?: {
    label: string;
    onClick: () => void;
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
  };
  cryptoIcons?: CryptoIcon[];
  trustedByText?: string;
  brands?: Array<{
    name: string;
    logo: React.ReactNode;
  }>;
  disclaimerText?: string;
  className?: string;
  children?: React.ReactNode;
  navRight?: React.ReactNode;
  backgroundElement?: React.ReactNode;
}

export function Web3MediaHero({
  logo = "Web3 Media",
  logoImage,
  navigation = [],
  contactButton,
  title,
  highlightedText = "Web3 Visibility",
  subtitle,
  ctaButton,
  secondaryButton,
  cryptoIcons = [],
  trustedByText = "Trusted by",
  brands = [],
  disclaimerText,
  className,
  children,
  navRight,
  backgroundElement,
}: Web3MediaHeroProps) {
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
    }),
  };

  return (
    <div className={cn("relative min-h-screen bg-[#000000] text-white overflow-hidden", className)}>
      {/* Radial Glow Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-amber-500/8 via-orange-500/4 to-transparent blur-3xl" />
      </div>

      {/* Custom Background Element (e.g. video) */}
      {backgroundElement}

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {logoImage && (
              <img src={logoImage} alt={logo} className="h-10 w-auto" />
            )}
            <span className="text-lg font-medium tracking-tight text-white">
              <span className="font-bold">{logo.split(" ")[0]}</span>
              {logo.split(" ").length > 1 && (
                <span className="text-white/70"> {logo.split(" ").slice(1).join(" ")}</span>
              )}
            </span>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item, index) => (
              <a
                key={index}
                href={item.href || "#"}
                onClick={item.onClick}
                className={cn(
                  "px-4 py-2 text-sm rounded-full transition-all",
                  item.active
                    ? "bg-white/10 border border-white/20 text-white"
                    : item.strikethrough
                    ? "text-white/40 line-through cursor-not-allowed"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {navRight}
            {contactButton && (
              <button
                onClick={contactButton.onClick}
                className="bg-gradient-to-r from-white to-white/80 text-black hover:from-white/90 hover:to-white/70 rounded-full px-5 py-2 text-sm font-medium transition-all"
              >
                {contactButton.label}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children ? (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20">
          {children}
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20">
          {/* Floating Crypto Icons */}
          {cryptoIcons.map((crypto, index) => (
            <motion.div
              key={index}
              className="absolute hidden lg:flex flex-col items-center gap-1"
              style={{ left: crypto.position.x, top: crypto.position.y }}
              animate={{
                y: [0, -12, 0],
              }}
              transition={{
                duration: 3 + index * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg shadow-orange-500/5">
                {crypto.icon}
              </div>
              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                {crypto.label}
              </span>
            </motion.div>
          ))}

          <div className="max-w-4xl mx-auto px-6 text-center">
            {/* Logo Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm text-white/70 mb-8"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              {logoImage && <img src={logoImage} alt="" className="h-5 w-auto" />}
              <span>{logo}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tight leading-[1.05] mb-6"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              {title}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300">
                {highlightedText}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              {subtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-wrap justify-center gap-4 mb-8"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
            >
              {ctaButton && (
                <button
                  onClick={ctaButton.onClick}
                  className="bg-black text-white border border-white/30 hover:bg-white/10 rounded-full px-8 py-3 text-base font-medium transition-all"
                >
                  {ctaButton.label}
                </button>
              )}
              {secondaryButton && (
                <button
                  onClick={secondaryButton.onClick}
                  className="text-white/80 border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:text-white rounded-full px-8 py-3 text-base font-medium transition-all"
                >
                  {secondaryButton.label}
                </button>
              )}
            </motion.div>

            {/* Disclaimer */}
            {disclaimerText && (
              <motion.p
                className="text-xs text-white/30 max-w-md mx-auto"
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={4}
              >
                {disclaimerText}
              </motion.p>
            )}
          </div>
        </div>
      )}

      {/* Brand Slider */}
      {brands.length > 0 && (
        <div className="relative z-10 w-full border-t border-white/5 pt-8 pb-10">
          {/* "Trusted by" Text */}
          <motion.p
            className="text-center text-xs text-white/30 uppercase tracking-widest mb-6"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={5}
          >
            {trustedByText}
          </motion.p>

          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

          {/* Scrolling Brands */}
          <div className="flex items-center gap-12 animate-[scroll_20s_linear_infinite] w-max px-6 opacity-40">
            {[...brands, ...brands].map((brand, index) => (
              <div
                key={index}
                className="flex items-center gap-2 shrink-0"
              >
                {brand.logo}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
