
import { ChevronsRight, Headphones, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import headphoneImg from "../assests/headphone.png";

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
    <div className="min-h-screen bg-[#3a3a3a] relative overflow-hidden">
      {/* Background headphone image */}
      <div 
        className="absolute inset-0 -z-20 opacity-50"
        style={{
          backgroundImage: `url('${headphoneImg}')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#3a3a3a]/70 via-[#3a3a3a]/85 to-[#3a3a3a]" />

      {/* About us button */}
      <div className="absolute top-8 right-8 z-50">
        <button className="flex items-center gap-4 bg-[#3a3a3a] text-white pl-6 pr-2 py-2 rounded-full transition-all border backdrop-blur-md group pointer-events-auto shadow-xl hover:shadow-2x border-white/10">
          <span className="font-montserrat text-sm font-normal text-gray-200">About us</span>
          <div className="w-8 h-8 rounded-full bg-[#4a4a4a] flex items-center justify-center group-hover:bg-[#5a5a5a] transition-colors">
             <User className="w-4 h-4 text-gray-300 group-hover:text-white" />
          </div>
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">

        {/* VIBEONE Logo */}
        <h1
          className="text-5xl md:text-7xl font-bold text-white tracking-wider mb-3 animate-slide-up"
          style={{ fontFamily: "'neomax', sans-serif", letterSpacing: "0.1em" }}
          data-testid="text-vibeone-logo"
        >
          VIBEONE
        </h1>

        {/* Tagline */}
        <p
          className="text-white text-sm tracking-wide mb-16 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
          data-testid="text-tagline"
        >
          Powered by Logical Loops
        </p>

        {/* Start Your Journey Section */}
        <div className="text-center mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2
            className="text-xl md:text-2xl font-bold text-white tracking-wider mb-3"
            style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em" }}
            data-testid="text-start-journey"
          >
            START YOUR JOURNEY
          </h2>
          <p className="text-white text-sm max-w-xs mx-auto">
            Connect, chat and stream together - music, movies,
            and new friends await.
          </p>
        </div>

        {/* CTA Button */}
        <div className="relative w-[300px] h-[72px] bg-transparent backdrop-blur-xl rounded-full p-2 cursor-pointer group shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] border overflow-hidden select-none transition-all border-white/20"
          onClick={handleStart}
        >
          {/* Track Content */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={`font-montserrat text-sm font-medium text-gray-300 tracking-wider pl-4 transition-opacity duration-300 ${isSliding ? 'opacity-0' : 'opacity-100'}`}>
              Turn on your music
            </span>
            {/* Right Icon on track */}
            <div className="absolute right-3 bg-white/10 backdrop-blur-md border border-white/20 w-12 h-12 rounded-full flex items-center justify-center">
              <Headphones className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* The Knob */}
          <div
            className={`
                  absolute top-2 bottom-2 left-2
                  w-[56px] rounded-full 
                  shadow-[0_0_20px_rgba(74,222,128,0.6)]
                  flex items-center justify-center 
                  transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)
                  z-20
                `}
            style={{
              transform: isSliding ? 'translateX(224px)' : 'translateX(0)',
              background:'linear-gradient(90deg, #22FB29 0%, #FFFFFF 100%)'
            }}
          >
            <ChevronsRight className={`text-black w-6 h-6 ${isSliding ? 'opacity-0' : 'animate-pulse'}`} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-white/30 text-xs" data-testid="text-copyright">
          Copyrights reserved - Logical Loops
        </p>
      </div>
    </div>
  );
}
