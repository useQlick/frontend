import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";

export const MacbookAir = (): JSX.Element => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
    const distance = Math.min(15, Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 10);
    
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
    <div className="bg-black w-full min-h-screen relative overflow-x-hidden">
      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-24 py-6">
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
                  Prediction
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

      {/* Bottom Section with Eyes */}
      <div className="relative mt-8 lg:mt-16">
        {/* Background Shape */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[1066px] h-[200px] sm:h-[250px] lg:h-[359px]">
          <img
            className="w-full h-full object-cover"
            alt="Background shape"
            src="/rectangle-2.svg"
          />
        </div>

        {/* Eyes Container */}
        <div className="relative z-10 flex justify-center items-end pb-8 lg:pb-16">
          <div className="flex space-x-4 sm:space-x-8 lg:space-x-16">
            {/* Left Eye */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white rounded-full flex items-center justify-center">
                <div 
                  className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-black rounded-full transition-transform duration-100 ease-out flex items-center justify-center"
                  style={{
                    transform: `translate(${calculateEyePosition(
                      window.innerWidth < 640 ? window.innerWidth / 2 - 80 : 
                      window.innerWidth < 1024 ? window.innerWidth / 2 - 120 : 
                      window.innerWidth / 2 - 160, 
                      window.innerHeight - (window.innerWidth < 640 ? 100 : window.innerWidth < 1024 ? 150 : 200)
                    ).x}px, ${calculateEyePosition(
                      window.innerWidth < 640 ? window.innerWidth / 2 - 80 : 
                      window.innerWidth < 1024 ? window.innerWidth / 2 - 120 : 
                      window.innerWidth / 2 - 160, 
                      window.innerHeight - (window.innerWidth < 640 ? 100 : window.innerWidth < 1024 ? 150 : 200)
                    ).y}px)`
                  }}
                >
                  <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Right Eye */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white rounded-full flex items-center justify-center">
                <div 
                  className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-black rounded-full transition-transform duration-100 ease-out flex items-center justify-center"
                  style={{
                    transform: `translate(${calculateEyePosition(
                      window.innerWidth < 640 ? window.innerWidth / 2 + 80 : 
                      window.innerWidth < 1024 ? window.innerWidth / 2 + 120 : 
                      window.innerWidth / 2 + 160, 
                      window.innerHeight - (window.innerWidth < 640 ? 100 : window.innerWidth < 1024 ? 150 : 200)
                    ).x}px, ${calculateEyePosition(
                      window.innerWidth < 640 ? window.innerWidth / 2 + 80 : 
                      window.innerWidth < 1024 ? window.innerWidth / 2 + 120 : 
                      window.innerWidth / 2 + 160, 
                      window.innerHeight - (window.innerWidth < 640 ? 100 : window.innerWidth < 1024 ? 150 : 200)
                    ).y}px)`
                  }}
                >
                  <div className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};