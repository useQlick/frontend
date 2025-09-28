import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { WaitlistPage } from "./waitlistPage";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LandingPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const pinRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);
  const initialEyesOffsetRef = useRef<number>(Number.NaN);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animate rectangle-2 background to expand and fill the screen while pinned
  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    const pinEl = pinRef.current;
    const bgEl = backgroundRef.current;
    const txtEl = overlayRef.current;
    const eyesEl = eyesRef.current;
    if (!pinEl || !bgEl) return;

    // Compute scale required to cover viewport from current size
    const computeTargetScale = () => {
      const rect = bgEl.getBoundingClientRect();
      const scaleX = window.innerWidth / rect.width;
      const scaleY = window.innerHeight / rect.height;
      // Increased overshoot to ensure full coverage without edges and add extra height
      return Math.max(scaleX, scaleY) * 1.1;
    };

    gsap.set(bgEl, { transformOrigin: "50% 100%" });
    if (txtEl) gsap.set(txtEl, { opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pinEl,
        start: "top bottom",
        end: "+=250%",
        scrub: true,
        pin: true,
        anticipatePin: 1,
      },
    });

    tl.to(bgEl, { scale: computeTargetScale(), ease: "none", duration: 1, delay: 0.8 }, 0);

    // Keep eyes locked to the pink shape's top with the same initial offset
    const positionEyes = () => {
      if (!eyesEl) return;
      const pinRect = pinEl.getBoundingClientRect();
      const bgRect = bgEl.getBoundingClientRect();
      if (Number.isNaN(initialEyesOffsetRef.current)) {
        const eyesRect = eyesEl.getBoundingClientRect();
        initialEyesOffsetRef.current = eyesRect.top - bgRect.top;
      }
      const newTop = bgRect.top - pinRect.top + initialEyesOffsetRef.current - 250;
      eyesEl.style.top = `${newTop}px`;
    };

    // Position once and on every scrubbed frame
    positionEyes();
    tl.eventCallback("onUpdate", positionEyes);
    if (txtEl) {
      tl.fromTo(
        txtEl,
        { opacity: 0 },
        { opacity: 1, ease: "none", duration: 0.3, delay: 0.2 },
        1.2
      );
    }

    const onResize = () => {
      const target = computeTargetScale();
      tl.clear();
      tl.to(bgEl, { scale: target, ease: "none", duration: 1, delay: 0.6 }, 0);
      if (txtEl) {
        tl.fromTo(
          txtEl,
          { opacity: 0 },
          { opacity: 1, ease: "none", duration: 0.3, delay: 0.2 },
          1.2
        );
      }
      // Recompute eyes offset after layout changes
      initialEyesOffsetRef.current = Number.NaN;
      positionEyes();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
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
    { label: "Home", id: "home" },
    { label: "Market", id: "about" },
  ];

  return (
    <div className="bg-black w-full min-h-screen relative overflow-x-hidden">
      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 lg:px-24 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-20 lg:h-20 pt-5"
              alt="Logo"
              src="/logo(2).svg"
            />
          </div>

          {/* Desktop Navigation */}
          

          {/* CTA Button */}
          <div className="flex-shrink-0">
            <Popover open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
              <PopoverTrigger asChild>
                <Button className="px-4 py-2 bg-[#d9d9d9] rounded-[31px] hover:bg-[#c9c9c9] transition-colors">
                  <span className="font-['Instrument_Sans'] font-bold text-[#272635] text-xs tracking-[0] leading-normal">
                    Waitlist
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 border-none bg-transparent shadow-none"
                centerScreen={true}
                backdropBlur={true}
                sideOffset={0}
                onBackdropClick={() => setIsWaitlistOpen(false)}
              >
                <WaitlistPage onClose={() => setIsWaitlistOpen(false)} />
              </PopoverContent>
            </Popover>
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
          <div className="flex flex-col lg:flex-row items-center justify-between py-8 lg:py-8">
            <div className="text-center lg:text-left mb-8 lg:mb-0">
              <h1 className="font-['Instrument_Serif'] font-normal text-4xl sm:text-6xl lg:text-8xl xl:text-9xl tracking-[0] leading-tight lg:leading-[87.1px] mb-3 lg:mb-8">
                <span className="text-white block">
                  Why pick one market
                </span>
                <span className="text-white block">
                when you can
                </span>
                <span className="text-white block">
                   <span className="text-[#64C967]">Qlick</span> them all?
                </span>
              </h1>
            </div>

            {/* Desktop Scroll Indicator */}
            <div className="hidden lg:block">
              <div className="flex flex-col items-center">
                <ChevronDown className="w-8 h-8 text-white mb-2" />
                <span className="font-['Instrument_Sans'] font-medium text-white text-xs tracking-[0] leading-normal opacity-80">
                  Scroll Down
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Section with Eyes (Pinned Scroll Animation) */}
      <div ref={pinRef} className="relative mt-8 lg:mt-30">
        {/* Background Shape */}
        <div
          ref={backgroundRef}
          className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-[966px] h-full max-h-[600px] sm:h-[250px] lg:h-[359px] will-change-transform bg-[#64C967] rounded-t-[79px]"
        />

        {/* Eyes Container */}
        <div ref={eyesRef} className="absolute left-1/2 transform -translate-x-1/2 z-10 flex justify-center items-start pt-4 lg:pt-30">
          <div
            className="relative flex space-x-4 sm:space-x-8 lg:space-x-16"
            style={{ left: "30%" }}
          >
            {/* Left Eye */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white rounded-full flex items-center justify-center">
                <div 
                  className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-black rounded-full transition-transform duration-100 ease-out"
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
                ></div>
              </div>
            </div>

            {/* Right Eye */}
            <div className="relative">
              <div className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white rounded-full flex items-center justify-center">
                <div 
                  className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-black rounded-full transition-transform duration-100 ease-out"
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
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay content during pinned animation */}
        <div ref={overlayRef} className="absolute inset-0 z-30">
          {/* Bottom-left copy block */}
          <div className="absolute left-6 lg:left-24 bottom-24 sm:bottom-28 lg:bottom-32 max-w-4xl">
            <h2 className="font-['Instrument_Serif'] font-normal text-3xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-[0] leading-tight text-black mb-4">
              Quantum Markets & Info-Finance
            </h2>
            <p className="font-['Instrument_Sans'] text-black text-xs sm:text-sm lg:text-base max-w-xl opacity-90">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>

          {/* Bottom-right CTA */}
          <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 pointer-events-auto">
            <Button 
              onClick={() => navigate('/markets')}
              className="px-6 py-3 bg-black rounded-[31px] hover:bg-black/80 transition-colors"
            >
              <span className="font-['Instrument_Sans'] font-bold text-white text-sm tracking-[0] leading-normal">
                Get Started →
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};