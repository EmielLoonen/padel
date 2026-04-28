import { useState, useEffect } from 'react';

const loadingScreens = [
  {
    emoji: '🍌',
    title: 'Waking up the banana farm...',
    subtitle: 'The database is stretching 🥱',
    animation: 'dance',
    isCommercial: false,
    backgroundImage: undefined as string | undefined,
  },
  {
    emoji: '🍸',
    title: 'Campari Negroni',
    subtitle: 'Negroni Love!! ❤️',
    animation: 'wiggle',
    isCommercial: true,
    backgroundImage: '/sponsors/campari.jpg' as string | undefined,
  },
  {
    emoji: '☕',
    title: 'Brewing fresh queries...',
    subtitle: 'The database needs its morning coffee',
    animation: 'steam',
    isCommercial: false,
    backgroundImage: undefined as string | undefined,
  },
  {
    emoji: '💋',
    title: 'Purol',
    subtitle: "Keeping Mark's lips smooth & soft for the last 20 years",
    animation: 'bounce',
    isCommercial: true,
    backgroundImage: '/sponsors/purol.jpg' as string | undefined,
  },
  {
    emoji: '🏃',
    title: 'Running to the server...',
    subtitle: "It's quite far away, be patient",
    animation: 'run',
    isCommercial: false,
    backgroundImage: undefined as string | undefined,
  },
  {
    emoji: '🍺',
    title: 'Walhalla Craft Beer',
    subtitle: 'Where legends are brewed!',
    animation: 'steam',
    isCommercial: true,
    backgroundImage: '/sponsors/walhalla.jpg' as string | undefined,
  },
  {
    emoji: '🎾',
    title: 'Warming up the padel courts...',
    subtitle: 'Making sure everything is ready for you',
    animation: 'bounce',
    isCommercial: false,
    backgroundImage: undefined as string | undefined,
  },
];

const carouselStyles = `
  @keyframes wiggle {
    0%, 100% { transform: rotate(-15deg); }
    50% { transform: rotate(15deg); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes steam {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes run {
    0%, 100% { transform: translateX(-20px); }
    50% { transform: translateX(20px); }
  }
  .dance { animation: wiggle 0.5s ease-in-out infinite, spin 2s linear infinite; display: inline-block; }
  .steam { animation: steam 1.5s ease-in-out infinite; display: inline-block; }
  .run { animation: run 1s ease-in-out infinite; display: inline-block; }
  .bounce { animation: bounce 1s infinite; display: inline-block; }
  .wiggle { animation: wiggle 0.5s ease-in-out infinite; display: inline-block; }
  .fade-in { animation: fadeIn 0.5s ease-in; }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
`;

interface SponsorCarouselProps {
  fullscreen?: boolean;
}

export default function SponsorCarousel({ fullscreen = true }: SponsorCarouselProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % loadingScreens.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const screen = loadingScreens[currentScreen];

  const inner = (
    <div className="text-center relative z-10">
      <style>{carouselStyles}</style>
      {screen.isCommercial && (
        <p className="text-xs text-gray-500 mb-2 fade-in italic">✨ A word from our sponsors ✨</p>
      )}
      <div className={`${screen.animation} text-8xl sm:text-9xl mb-6 fade-in`}>{screen.emoji}</div>
      <p className="text-xl sm:text-2xl font-bold text-padel-green mb-2 fade-in">{screen.title}</p>
      <p className="text-sm sm:text-base text-gray-400 fade-in">{screen.subtitle}</p>
      <div className="mt-6 flex justify-center gap-2">
        {loadingScreens.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentScreen ? 'bg-padel-green w-6' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <div className="w-2 h-2 bg-padel-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-padel-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-padel-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
        {screen.backgroundImage && (
          <img src={screen.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {screen.backgroundImage && <div className="absolute inset-0 bg-black/60" />}
        {inner}
      </div>
    );
  }

  return (
    <div className="py-16 flex items-center justify-center relative overflow-hidden rounded-xl">
      {screen.backgroundImage && (
        <img src={screen.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
      )}
      {screen.backgroundImage && <div className="absolute inset-0 bg-black/60 rounded-xl" />}
      {inner}
    </div>
  );
}
