import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "../../components/ui/button";

export const MacbookAir = (): JSX.Element => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  
  // Transform scroll progress to scale and position values
  const pinkDivScale = useTransform(scrollYProgress, [0, 0.5], [1, 3]);
  const pinkDivY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculateEyePosition = (eyeCenterX: number, eyeCenterY: number) => {
    const deltaX = mousePosition.x - eyeCenterX;
    const deltaY = mousePosition.y - eyeCenterY;
    const angle = Math.atan2(deltaY, deltaX);
    const distance = Math.min(35, Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 8);
    
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  };

  const navigationItems = [
    { label: "Features", id: "features" },
    { label: "Home", id: "home" },
    { label: "About Us", id: "about" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <div className="bg-black w-full min-h-[200vh] relative overflow-x-hidden">
      {/* Header */}
      <header className="relative z-20 px-4 sm:px-6 lg:px-24 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
              alt="Logo"
              src="/frame.svg"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="font-['Instrument_Sans'] font-bold text-white text-xs tracking-[0] leading-normal cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {item.label}
                </a>
                {index < navigationItems.length - 1 && (
                  <div className="w-[3px] h-[3px] bg-[#d9d9d9] rounded-full" />
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="flex-shrink-0">
            <Button className="px-4 py-2 bg-[#d9d9d9] rounded-[31px] hover:bg-[#c9c9c9] transition-colors">
              <span className="font-['Instrument_Sans'] font-bold text-[#272635] text-xs tracking-[0] leading-normal">
                Join us!
              </span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="lg:hidden mt-4 flex flex-wrap justify-center gap-4">
          {navigationItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="font-['Instrument_Sans'] font-bold text-white text-xs tracking-[0] leading-normal cursor-pointer hover:opacity-80 transition-opacity"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-24">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row items-center justify-between py-8 lg:py-16">
            <div className="text-center lg:text-left mb-8 lg:mb-0">
              <h1 className="font-['Instrument_Serif'] font-normal text-4xl sm:text-6xl lg:text-8xl xl:text-9xl tracking-[0] leading-tight lg:leading-[87.1px] mb-6 lg:mb-8">
                <span className="text-white block">
                  Quantum
                </span>
                <span className="text-[#ff7bc0]">Market</span>
              </h1>
              
              <div className="lg:hidden">
                <Button className="px-6 py-3 bg-[#ff7bc0] rounded-[31px] hover:bg-[#ff6bb5] transition-colors">
                  <span className="font-['Instrument_Sans'] font-bold text-black text-sm tracking-[0] leading-normal">
                    Get Started →
                  </span>
                </Button>
              </div>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:block">
              <Button className="px-6 py-3 bg-[#ff7bc0] rounded-[31px] hover:bg-[#ff6bb5] transition-colors">
                <span className="font-['Instrument_Sans'] font-bold text-black text-sm tracking-[0] leading-normal">
                  Get Started →
                </span>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Section with Pink Background and Eyes */}
      <div className="relative mt-8 lg:mt-16 h-screen">
        {/* Animated Pink Background */}
        <motion.div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[1066px] h-[200px] sm:h-[250px] lg:h-[359px] bg-[#ff7bc0] rounded-t-[50px] origin-bottom"
          style={{
            scale: pinkDivScale,
            y: pinkDivY,
          }}
        />

        {/* Eyes Container - Positioned on right side */}
        <div className="absolute bottom-8 lg:bottom-16 right-4 sm:right-8 lg:right-24 z-20">
          <div className="flex space-x-4 sm:space-x-6 lg:space-x-8">
            {/* Left Eye */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white rounded-full flex items-center justify-center">
                <div 
                  className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-black rounded-full transition-transform duration-100 ease-out"
                  style={{
                    transform: `translate(${calculateEyePosition(
                      window.innerWidth - (window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 120 : 200), 
                      window.innerHeight - (window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 120 : 150)
                    ).x}px, ${calculateEyePosition(
                      window.innerWidth - (window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 120 : 200), 
                      window.innerHeight - (window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 120 : 150)
                    ).y}px)`
                  }}
                ></div>
              </div>
            </div>

            {/* Right Eye */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white rounded-full flex items-center justify-center">
                <div 
                  className="w-10 h-10 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-black rounded-full transition-transform duration-100 ease-out"
                  style={{
                    transform: `translate(${calculateEyePosition(
                      window.innerWidth - (window.innerWidth < 640 ? 40 : window.innerWidth < 1024 ? 60 : 100), 
                      window.innerHeight - (window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 120 : 150)
                    ).x}px, ${calculateEyePosition(
                      window.innerWidth - (window.innerWidth < 640 ? 40 : window.innerWidth < 1024 ? 60 : 100), 
                      window.innerHeight - (window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 120 : 150)
                    ).y}px)`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional content to enable scrolling */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-24 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-['Instrument_Serif'] font-normal text-3xl sm:text-4xl lg:text-6xl text-white mb-8">
            Scroll to see the magic
          </h2>
          <p className="font-['Instrument_Sans'] text-white text-lg sm:text-xl max-w-2xl mx-auto">
            Watch as the pink background expands to fill the entire screen as you scroll down. 
            The eyes will continue to follow your mouse movement throughout the experience.
          </p>
        </div>
      </div>
    </div>
  );
};