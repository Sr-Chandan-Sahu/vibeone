import { ChevronsRight, Headphones } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import headphoneImg from "../assets/headphone.png";
import logoImg from "../assets/logo.png";

export default function Home() {
  const navigate = useNavigate();
  const [isSliding, setIsSliding] = useState(false);

  const handleStart = () => {
    if (isSliding) return;
    setIsSliding(true);
    setTimeout(() => {
      navigate('/create');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient color glow effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/20 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-yellow-500/15 rounded-full blur-[120px] translate-x-1/2" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-green-500/15 rounded-full blur-[150px] translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />

      {/* Dotted world map pattern - Desktop only */}
      <div className="hidden md:block absolute inset-0 opacity-40 pointer-events-none world-map-pattern" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="VIBEONE" className="w-10 h-10 md:w-12 md:h-12" />
          <div className="flex flex-col">
            <span
              className="text-white text-2xl md:text-3xl font-bold tracking-wider"
              style={{ fontFamily: "'neomax', sans-serif" }}
            >
              VIBEONE
            </span>
            <span className="text-white/60 text-[10px] tracking-wide">Powered by Logical Loops</span>
          </div>
        </div>

        {/* About Link - Desktop only */}
        <nav className="hidden md:block">
          <a
            href="#about"
            className="text-white font-bold text-xl tracking-widest hover:text-white/80 transition-colors"
            style={{ fontFamily: "'neomax', sans-serif" }}
          >
            ABOUT
          </a>
        </nav>
      </header>

      {/* Main Content Container - Desktop */}
      <main className="hidden md:flex relative z-10 flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 md:px-12">

        {/* Headphone Image - Tilted and hanging over PLAY text */}
        <div className="absolute right-[5%] top-[-10%] z-0 pointer-events-none">
          <img
            src={headphoneImg}
            alt="Premium Headphones"
            className="w-[300px] lg:w-[400px] xl:w-[450px] h-auto object-contain"
            style={{
              filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))',
              transform: 'rotate(-35deg)',
            }}
          />
        </div>

        {/* Centered Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Big Typography */}
          <div className="mb-8">
            <h1
              className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight"
              style={{ fontFamily: "'neomax', sans-serif" }}
            >
              CONNECT. PLAY.
            </h1>
            <h2
              className="text-5xl lg:text-6xl xl:text-7xl font-black leading-tight tracking-tight text-stroke-white"
              style={{ fontFamily: "'neomax', sans-serif" }}
            >
              EXPERIENCE
            </h2>
            <h2
              className="text-5xl lg:text-6xl xl:text-7xl font-black leading-tight tracking-tight text-stroke-white"
              style={{ fontFamily: "'neomax', sans-serif" }}
            >
              TOGETHER.
            </h2>
          </div>

          {/* Start Your Journey Section */}
          <div className="text-center mb-6">
            <h3
              className="text-lg lg:text-xl font-bold text-white tracking-wider mb-2"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.15em" }}
              data-testid="text-start-journey"
            >
              START YOUR JOURNEY
            </h3>
            <p className="text-white/60 text-sm max-w-sm mx-auto">
              Connect, chat and stream together - music, movie<br />
              and new friends await.
            </p>
          </div>

          {/* CTA Button - Centered */}
          <div
            className="relative w-[280px] h-[60px] bg-black/50 backdrop-blur-xl rounded-full p-2 cursor-pointer group shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] border overflow-hidden select-none transition-all border-white/20 hover:border-white/30"
            onClick={handleStart}
          >
            {/* Track Content */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`font-sans text-sm font-medium text-gray-300 tracking-wider pl-4 transition-opacity duration-300 ${isSliding ? 'opacity-0' : 'opacity-100'}`}>
                Turn on your music
              </span>
              {/* Right Icon on track */}
              <div className="absolute right-2 bg-white/10 backdrop-blur-md border border-white/20 w-11 h-11 rounded-full flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* The Knob */}
            <div
              className={`
                absolute top-2 bottom-2 left-2
                w-[44px] rounded-full 
                shadow-[0_0_20px_rgba(74,222,128,0.6)]
                flex items-center justify-center 
                transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                z-20
              `}
              style={{
                background: 'linear-gradient(135deg, #22FB29 0%, #FFFFFF 100%)',
                transform: isSliding ? 'translateX(214px)' : 'translateX(0)',
              }}
            >
              <ChevronsRight className={`text-black w-5 h-5 ${isSliding ? 'opacity-0' : 'animate-pulse'}`} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Layout */}
      <main className="md:hidden relative z-10 flex flex-col items-center min-h-[calc(100vh-100px)] px-6">
        {/* Logo centered at top - Mobile */}
        <div className="flex flex-col items-center mt-4 mb-4">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="VIBEONE" className="w-10 h-10" />
            <span
              className="text-white text-3xl font-bold tracking-wider"
              style={{ fontFamily: "'neomax', sans-serif" }}
            >
              VIBEONE
            </span>
          </div>
          <span className="text-white/60 text-xs tracking-wide mt-1">Powered by Logical Loops</span>
        </div>

        {/* Headphone Image - Mobile */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src={headphoneImg}
            alt="Premium Headphones"
            className="w-[90vw] max-w-[400px] h-auto object-contain"
            style={{
              filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))',
            }}
          />
        </div>

        {/* Bottom Content - Mobile */}
        <div className="flex flex-col items-center text-center pb-8">
          {/* Start Your Journey Section */}
          <div className="mb-6">
            <h3
              className="text-xl font-bold text-white tracking-wider mb-3"
              style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.12em" }}
              data-testid="text-start-journey-mobile"
            >
              START YOUR JOURNEY
            </h3>
            <p className="text-white/60 text-sm max-w-xs mx-auto">
              Connect, chat and stream together - music, movie
              and new friends await.
            </p>
          </div>

          {/* CTA Button - Mobile */}
          <div
            className="relative w-[280px] h-[60px] bg-black/50 backdrop-blur-xl rounded-full p-2 cursor-pointer group shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] border overflow-hidden select-none transition-all border-white/20"
            onClick={handleStart}
          >
            {/* Track Content */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`font-sans text-sm font-medium text-gray-300 tracking-wider pl-4 transition-opacity duration-300 ${isSliding ? 'opacity-0' : 'opacity-100'}`}>
                Turn on your music
              </span>
              {/* Right Icon on track */}
              <div className="absolute right-2 bg-white/10 backdrop-blur-md border border-white/20 w-11 h-11 rounded-full flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* The Knob */}
            <div
              className={`
                absolute top-2 bottom-2 left-2
                w-[44px] rounded-full 
                shadow-[0_0_20px_rgba(74,222,128,0.6)]
                flex items-center justify-center 
                transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                z-20
              `}
              style={{
                background: 'linear-gradient(135deg, #22FB29 0%, #FFFFFF 100%)',
                transform: isSliding ? 'translateX(214px)' : 'translateX(0)',
              }}
            >
              <ChevronsRight className={`text-black w-5 h-5 ${isSliding ? 'opacity-0' : 'animate-pulse'}`} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
