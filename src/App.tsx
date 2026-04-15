import { Sun, Moon, MapPin, Menu, X } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const galleries = [
  {
    title: "Floral",
    genre: "SCI-FI / BOTANICAL",
    date: "OCT 12 - NOV 24, 2025",
    location: "NEO-TOKYO SECTOR 4",
    isPast: false,
    items: [
      {
        id: 1,
        src: "https://picsum.photos/seed/art1/800/800",
        title: "VENENATA PULCHRITUDO",
        desc1: "A rare specimen found in the ruins of Sector 4.",
        desc2: "Exhibits bioluminescent properties when exposed to toxins.",
        desc3: "Requires a specialized containment unit.",
        price: "$45,000 USD"
      },
      {
        id: 2,
        src: "https://picsum.photos/seed/art2/800/800",
        title: "URBAN OVERGROWTH",
        desc1: "The concrete has been completely consumed.",
        desc2: "Nature reclaims what was once a bustling metropolis.",
        desc3: "Contains traces of ancient synthetic materials.",
        price: "$32,500 USD"
      },
      {
        id: 3,
        src: "https://picsum.photos/seed/art3/800/800",
        title: "SYNTHETIC BLOOM",
        desc1: "Artificial petals that mimic organic life.",
        desc2: "Powered by a micro-fusion core.",
        desc3: "Never wilts, never dies.",
        price: "$88,000 USD"
      },
      {
        id: 4,
        src: "https://picsum.photos/seed/art4/800/800",
        title: "TOXIC BEAUTY",
        desc1: "Beautiful but deadly to the touch.",
        desc2: "Emits a faint humming sound.",
        desc3: "Handle only with Class-4 protective gear.",
        price: "$115,000 USD"
      },
      {
        id: 5,
        src: "https://picsum.photos/seed/art5/800/800",
        title: "ECHOES OF EARTH",
        desc1: "A memory of a world that no longer exists.",
        desc2: "Preserved in a stasis field.",
        desc3: "The last of its kind.",
        price: "$250,000 USD"
      }
    ]
  },
  {
    title: "Neon",
    genre: "CYBERPUNK / URBAN",
    date: "DEC 01 - JAN 15, 2027",
    location: "UNDERGROUND ARCHIVES",
    isPast: true,
    items: [
      {
        id: 6,
        src: "https://picsum.photos/seed/neon1/800/800",
        title: "CHROMATIC DRIFTER",
        desc1: "Recovered from the lower levels of Neo-Tokyo.",
        desc2: "Constantly shifting color spectrum.",
        desc3: "Emits a low-frequency hum.",
        price: "$22,000 USD"
      },
      {
        id: 7,
        src: "https://picsum.photos/seed/neon2/800/800",
        title: "SYNTH-WAVE",
        desc1: "A physical manifestation of sound.",
        desc2: "Reacts to audio input in real-time.",
        desc3: "Fragile crystalline structure.",
        price: "$64,000 USD"
      },
      {
        id: 8,
        src: "https://picsum.photos/seed/neon3/800/800",
        title: "NEURAL NET",
        desc1: "An obsolete AI core.",
        desc2: "Still processes fragmented memories.",
        desc3: "Handle with extreme caution.",
        price: "$150,000 USD"
      },
      {
        id: 9,
        src: "https://picsum.photos/seed/neon4/800/800",
        title: "HOLOGRAPHIC ECHO",
        desc1: "A glitch in the visual spectrum.",
        desc2: "Appears differently to each observer.",
        desc3: "Cannot be captured on standard cameras.",
        price: "$89,000 USD"
      },
      {
        id: 10,
        src: "https://picsum.photos/seed/neon5/800/800",
        title: "VOID FRAGMENT",
        desc1: "Origin unknown.",
        desc2: "Absorbs all surrounding light.",
        desc3: "Cold to the touch.",
        price: "$300,000 USD"
      }
    ]
  }
];

const archiveItems = [
  { id: 101, title: "FLORAL", src: "https://picsum.photos/seed/arch1/400/400", story: "The floral series was an exploration of organic decay and synthetic rebirth. Each piece was carefully cultivated in a controlled environment before being crystallized in resin.", top: '5%', left: '5%', width: '250px', price: "$12,000 USD", sold: true },
  { id: 102, title: "ECHO", src: "https://picsum.photos/seed/arch2/400/400", story: "Echo represents the sound of silence in a post-apocalyptic world. The visual representation of a soundwave that no longer exists.", top: '12%', left: '55%', width: '200px', price: "$8,500 USD", sold: false },
  { id: 103, title: "VOID", src: "https://picsum.photos/seed/arch3/400/400", story: "A deep dive into the nothingness. Void was created using a proprietary light-absorbing pigment that reflects zero photons.", top: '25%', left: '5%', width: '180px', price: "$15,000 USD", sold: true },
  { id: 104, title: "SYNTH", src: "https://picsum.photos/seed/arch4/400/400", story: "Synthetic lifeforms captured in stasis. This piece explores the boundary between artificial intelligence and organic consciousness.", top: '35%', left: '55%', width: '220px', price: "$22,000 USD", sold: false },
  { id: 105, title: "NEON", src: "https://picsum.photos/seed/arch5/400/400", story: "The bright lights of the underground. Neon captures the chaotic energy of Neo-Tokyo's lower sectors.", top: '45%', left: '10%', width: '150px', price: "$6,000 USD", sold: true },
  { id: 106, title: "RUST", src: "https://picsum.photos/seed/arch6/400/400", story: "Decay as a form of beauty. Rust is a study of oxidation on ancient metallic structures found in the wasteland.", top: '55%', left: '65%', width: '120px', price: "$4,500 USD", sold: false },
  { id: 107, title: "CHROME", src: "https://picsum.photos/seed/arch7/400/400", story: "Reflections of a metallic future. Chrome uses highly polished surfaces to distort the viewer's perception of space.", top: '65%', left: '20%', width: '160px', price: "$18,000 USD", sold: true },
  { id: 108, title: "DUST", src: "https://picsum.photos/seed/arch8/400/400", story: "What remains after the storm. Dust is composed of actual particulate matter collected from the upper atmosphere.", top: '75%', left: '50%', width: '190px', price: "$9,000 USD", sold: false },
  { id: 109, title: "FRACTAL", src: "https://picsum.photos/seed/arch9/400/400", story: "A mathematical anomaly rendered in physical space. Fractal explores the infinite complexity hidden within simple equations.", top: '85%', left: '15%', width: '210px', price: "$25,000 USD", sold: true },
  { id: 110, title: "PRISM", src: "https://picsum.photos/seed/arch10/400/400", story: "Light bent and fractured into its component parts. Prism serves as a reminder of the spectrum of possibilities that exist just beyond our perception.", top: '92%', left: '60%', width: '170px', price: "$11,500 USD", sold: false },
  { id: 111, title: "MONOLITH", src: "https://picsum.photos/seed/arch11/400/400", story: "A monument to forgotten gods. Monolith stands as a testament to the enduring power of belief in a secular age.", top: '18%', left: '55%', width: '140px', price: "$35,000 USD", sold: true },
  { id: 112, title: "AETHER", src: "https://picsum.photos/seed/arch12/400/400", story: "Capturing the invisible currents of energy that flow through the universe. Aether visualizes the unseen forces that connect us all.", top: '8%', left: '60%', width: '130px', price: "$14,000 USD", sold: false },
  { id: 113, title: "PULSE", src: "https://picsum.photos/seed/arch13/400/400", story: "The heartbeat of a dying star. Pulse translates cosmic radiation into a visual rhythm that resonates with the viewer.", top: '30%', left: '65%', width: '160px', price: "$19,500 USD", sold: true },
  { id: 114, title: "MIRAGE", src: "https://picsum.photos/seed/arch14/400/400", story: "An illusion of water in a desert of data. Mirage challenges our perception of reality in an increasingly digital world.", top: '48%', left: '10%', width: '180px', price: "$7,500 USD", sold: false },
  { id: 115, title: "NEXUS", src: "https://picsum.photos/seed/arch15/400/400", story: "The point where all timelines converge. Nexus represents the singularity at the center of the multiverse.", top: '60%', left: '15%', width: '200px', price: "$42,000 USD", sold: true },
  { id: 116, title: "ZENITH", src: "https://picsum.photos/seed/arch16/400/400", story: "The highest point of achievement. Zenith is a celebration of human potential and the relentless pursuit of perfection.", top: '70%', left: '70%', width: '150px', price: "$28,000 USD", sold: false },
  { id: 117, title: "ABYSS", src: "https://picsum.photos/seed/arch17/400/400", story: "A glimpse into the darkest depths of the ocean. Abyss reveals the strange and terrifying creatures that lurk in the shadows.", top: '88%', left: '40%', width: '170px', price: "$16,500 USD", sold: true },
  { id: 118, title: "ECLIPSE", src: "https://picsum.photos/seed/arch18/400/400", story: "The moment when the sun is obscured by the moon. Eclipse captures the awe and terror of a celestial event.", top: '95%', left: '10%', width: '190px', price: "$13,000 USD", sold: false },
];

export default function App() {
  const [theme, setTheme] = useState<'green' | 'dark' | 'light'>('green');
  const [currentView, setCurrentView] = useState<'gallery' | 'about' | 'archive' | 'story' | 'buy'>('gallery');
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [buyItem, setBuyItem] = useState<any>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<'prev' | 'next' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => {
      if (t === 'green') return 'dark';
      if (t === 'dark') return 'light';
      return 'green';
    });
  };

  const activeGallery = galleries[galleryIndex];
  const galleryData = activeGallery.items;

  const paginate = (direction: number) => {
    setCurrentIndex(prev => prev + direction);
  };

  const paginateGallery = (direction: number) => {
    setGalleryIndex(prev => {
      const nextIndex = prev + direction;
      if (nextIndex >= 0 && nextIndex < galleries.length) {
        setCurrentIndex(0);
        return nextIndex;
      }
      return prev;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeout.current) return;
    
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 20) paginate(1);
      else if (e.deltaX < -20) paginate(-1);
    } else {
      if (e.deltaY > 20) paginate(1);
      else if (e.deltaY < -20) paginate(-1);
    }

    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = null;
    }, 500);
  };

  const handleDragEnd = (e: any, { offset }: any) => {
    if (offset.x < -50) paginate(1);
    else if (offset.x > 50) paginate(-1);
  };

  const numVisible = 4; // 9 items total (4 left, 1 center, 4 right)
  const visibleItems = [];
  for (let i = -numVisible; i <= numVisible; i++) {
    const absoluteIndex = currentIndex + i;
    const dataIndex = ((absoluteIndex % galleryData.length) + galleryData.length) % galleryData.length;
    visibleItems.push({
      offset: i,
      absoluteIndex,
      data: galleryData[dataIndex]
    });
  }

  const activeDataIndex = ((currentIndex % galleryData.length) + galleryData.length) % galleryData.length;
  const activeItem = galleryData[activeDataIndex];

  return (
    <div className="h-screen bg-bg text-text-base font-sans flex flex-col overflow-hidden selection:bg-text-strong selection:text-bg transition-colors duration-500">
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={zoomedImage} 
                alt="Zoomed view" 
                className="max-w-full max-h-[90vh] object-contain shadow-2xl border border-border-color/30"
              />
              <button 
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 text-text-muted hover:text-text-strong transition-colors flex items-center gap-2 text-xs tracking-widest uppercase"
              >
                CLOSE <X size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Cursor */}
      {currentView === 'gallery' && (
        <div 
          className={`fixed pointer-events-none z-50 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
          style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, -50%)' }}
        >
          <div className="bg-action-bg text-action-text rounded-full px-4 py-2 text-[10px] font-bold flex items-center gap-2 tracking-widest shadow-lg whitespace-nowrap">
            <span>&larr;</span> DRAG <span>&rarr;</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center p-6 shrink-0 z-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('gallery')}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
            <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
          </svg>
          <div className="text-xs leading-tight tracking-widest text-text-strong uppercase">
            Seifu<br/>arts
          </div>
        </div>

        <div className="hidden md:flex border border-border-color rounded-full px-6 py-2 gap-8 text-xs tracking-widest z-50">
          <span 
            className={`cursor-pointer transition-colors ${currentView === 'gallery' ? 'text-text-strong' : 'text-text-muted hover:text-text-base'}`}
            onClick={() => setCurrentView('gallery')}
          >
            001/EXHIBITION
          </span>
          <span 
            className={`cursor-pointer transition-colors ${currentView === 'archive' ? 'text-text-strong' : 'text-text-muted hover:text-text-base'}`}
            onClick={() => setCurrentView('archive')}
          >
            002/ARCHIVE
          </span>
          <span 
            className={`cursor-pointer transition-colors ${currentView === 'about' ? 'text-text-strong' : 'text-text-muted hover:text-text-base'}`}
            onClick={() => setCurrentView('about')}
          >
            003/ABOUT
          </span>
        </div>

        <div className="flex items-center gap-4 z-50">
          <div onClick={toggleTheme} className="w-10 h-10 border border-border-color rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:border-text-muted transition-colors cursor-pointer">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </div>
          <div onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden w-10 h-10 border border-border-color rounded-full flex items-center justify-center text-text-muted hover:text-text-strong hover:border-text-muted transition-colors cursor-pointer">
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-bg flex flex-col items-center justify-center gap-8 text-xl tracking-widest uppercase"
          >
            <span 
              className={`cursor-pointer transition-colors ${currentView === 'gallery' ? 'text-text-strong' : 'text-text-muted'}`}
              onClick={() => { setCurrentView('gallery'); setIsMobileMenuOpen(false); }}
            >
              001/EXHIBITION
            </span>
            <span 
              className={`cursor-pointer transition-colors ${currentView === 'archive' ? 'text-text-strong' : 'text-text-muted'}`}
              onClick={() => { setCurrentView('archive'); setIsMobileMenuOpen(false); }}
            >
              002/ARCHIVE
            </span>
            <span 
              className={`cursor-pointer transition-colors ${currentView === 'about' ? 'text-text-strong' : 'text-text-muted'}`}
              onClick={() => { setCurrentView('about'); setIsMobileMenuOpen(false); }}
            >
              003/ABOUT
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {currentView === 'about' ? (
        <main className="flex-1 overflow-y-auto w-full z-10 no-scrollbar">
          <div className="max-w-4xl mx-auto p-8 md:p-16 flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center w-full"
            >
              <h2 className="font-sans text-text-strong text-2xl md:text-3xl tracking-widest font-bold uppercase mb-12">ABOUT</h2>
              
              <div className="space-y-16 text-sm md:text-base leading-relaxed text-text-base w-full text-left">
                
                {/* Mission Statement */}
                <section className="flex flex-col items-center text-center space-y-6">
                  <p className="text-xl md:text-2xl font-bold leading-relaxed">Seifu arts is a premier digital and physical gallery specializing in the intersection of organic life and synthetic futures.</p>
                  <p>Founded in 2026, we curate exhibitions that challenge the boundaries of reality, bringing together artists who envision the next epoch of planetary evolution. Our collections span across multiple dimensions, capturing the essence of what it means to exist in a post-natural world.</p>
                  <p className="text-text-muted italic pt-4">"We do not preserve the past; we archive the future."</p>
                </section>

                <div className="w-full h-px bg-border-color opacity-50"></div>

                {/* About the Artist */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="aspect-square bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => setZoomedImage("https://picsum.photos/seed/artist/800/800")}>
                    <img src="https://picsum.photos/seed/artist/800/800" alt="Aris Seifu" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl text-text-strong tracking-widest font-bold">// ABOUT THE ARTIST</h3>
                    <p>Aris Seifu began his career as a bio-engineer in the lower sectors before discovering a method to crystallize decaying organic matter using synthetic resins. His work explores the fragile dichotomy between the natural world we lost and the artificial one we built to replace it. Seifu's pieces are held in private collections across three star systems.</p>
                  </div>
                </section>

                <div className="w-full h-px bg-border-color opacity-50"></div>

                {/* Reviews */}
                <section className="space-y-8">
                  <h3 className="text-xl text-text-strong tracking-widest font-bold">// REVIEWS</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="w-full aspect-video bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => setZoomedImage("https://picsum.photos/seed/review1/600/400")}>
                        <img src="https://picsum.photos/seed/review1/600/400" alt="Happy Client" className="w-full h-full object-cover transition-all duration-500 hover:scale-105" />
                      </div>
                      <blockquote className="border-l-2 border-accent pl-4">
                        <p className="italic text-text-muted">"A hauntingly beautiful reflection on our synthetic existence. Seifu captures the ghost in the machine."</p>
                        <footer className="mt-2 text-xs text-text-strong">— Neo-Art Quarterly</footer>
                      </blockquote>
                    </div>
                    <div className="space-y-4">
                      <div className="w-full aspect-video bg-border-color/20 overflow-hidden cursor-zoom-in" onClick={() => setZoomedImage("https://picsum.photos/seed/review2/600/400")}>
                        <img src="https://picsum.photos/seed/review2/600/400" alt="Happy Client" className="w-full h-full object-cover transition-all duration-500 hover:scale-105" />
                      </div>
                      <blockquote className="border-l-2 border-accent pl-4">
                        <p className="italic text-text-muted">"The Floral exhibition left me breathless. It's as if nature itself was paused in a digital stasis."</p>
                        <footer className="mt-2 text-xs text-text-strong">— Curator, The High Orbit Museum</footer>
                      </blockquote>
                    </div>
                  </div>
                </section>

                <div className="w-full h-px bg-border-color opacity-50"></div>

                {/* Location & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h3 className="text-xl text-text-strong tracking-widest font-bold">// LOCATION</h3>
                    <p className="flex items-start gap-2">
                      <MapPin size={16} className="mt-1 shrink-0 text-accent" />
                      <span>
                        Level 134, Sector 4<br/>
                        Neo-Tokyo Commercial District<br/>
                        Earth, Sol System
                      </span>
                    </p>
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-xl text-text-strong tracking-widest font-bold">// CONTACT US</h3>
                    <ul className="space-y-2">
                      <li><span className="text-text-muted">COMM-LINK:</span> +1 (800) 555-0199</li>
                      <li><span className="text-text-muted">DATA-STREAM:</span> contact@seifuarts.net</li>
                      <li><span className="text-text-muted">SECURE-CHANNEL:</span> 0x8F9A...3B2C</li>
                    </ul>
                  </section>
                </div>

              </div>

              <button 
                onClick={() => setCurrentView('gallery')}
                className="mt-16 border border-border-color rounded-full px-8 py-3 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-xs font-bold"
              >
                RETURN TO EXHIBITION
              </button>

              <div className="w-full h-px bg-border-color opacity-50 mt-24 mb-16"></div>
            </motion.div>
          </div>

          {/* Instagram Gallery */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-8 pb-16 px-4 md:px-8"
          >
            <h3 className="text-xl text-text-strong tracking-widest font-bold text-center">// COMMUNITY & CLIENTS</h3>
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                const seeds = [600, 400, 800, 500, 400, 700, 500, 600];
                const src = `https://picsum.photos/seed/ig${i}/400/${seeds[i-1]}`;
                return (
                  <img 
                    key={`ig-${i}`}
                    src={src} 
                    alt="Client" 
                    className="w-full rounded-none opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 cursor-zoom-in hover:scale-[1.02]" 
                    onClick={() => setZoomedImage(src)}
                  />
                );
              })}
            </div>
          </motion.section>
        </main>
      ) : currentView === 'archive' ? (
        <main className="flex-1 relative w-full h-full overflow-hidden z-10 bg-bg">
          {/* Fixed Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
            <div className="font-sans text-text-muted text-sm md:text-base mb-1 tracking-widest px-4 py-1 rounded-full">({archiveItems.length})</div>
            <div className="font-sans text-text-strong text-2xl md:text-3xl tracking-widest font-bold px-6 py-2 rounded-full mt-2">ARCHIVE</div>
          </div>
          
          {/* Scrollable Area */}
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar z-10">
            <div className="relative w-full min-h-screen pt-32 pb-32 px-4 md:px-12">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-12 gap-y-16 md:gap-y-32">
                {archiveItems.map((item, i) => {
                  const justify = ['justify-start', 'justify-center', 'justify-end'][(i * 7) % 3];
                  const marginTop = [0, 60, 120, 30, 90][i % 5];
                  
                  return (
                    <motion.div
                      key={`archive-${item.id}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: (i % 10) * 0.05 }}
                      className={`flex ${justify} group cursor-pointer`}
                      style={{ marginTop: `${marginTop}px` }}
                      onClick={() => {
                        setSelectedStory({
                          ...item,
                          sourceView: 'archive',
                          exhibitionTitle: 'ARCHIVE COLLECTION'
                        });
                        setCurrentView('story');
                      }}
                    >
                      <div className="flex flex-col items-center" style={{ width: item.width, maxWidth: '100%' }}>
                        <div className="relative w-full aspect-square overflow-hidden mb-3">
                          <img 
                            src={item.src} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-all duration-500 hover:scale-110 cursor-zoom-in"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImage(item.src);
                            }}
                          />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center bg-bg/80 px-3 py-1 rounded-full backdrop-blur-sm mt-2">
                          <span className="font-sans text-text-strong text-xs md:text-sm tracking-widest uppercase">{item.title}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      ) : currentView === 'story' && selectedStory ? (
        <main className="flex-1 flex flex-col relative overflow-hidden bg-bg">
          {/* Top Navigation */}
          <div className="flex justify-between px-6 py-4 text-xs tracking-widest shrink-0 text-text-strong uppercase border-b border-border-color/20">
            <button 
              onClick={() => setCurrentView(selectedStory.sourceView || 'archive')}
              className="flex items-center gap-2 hover:text-accent transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              BACK TO {selectedStory.sourceView === 'gallery' ? 'EXHIBITION' : 'ARCHIVE'}
            </button>
            <span>{selectedStory.exhibitionTitle}</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
            {/* Summary Header */}
            <div className="shrink-0 border-b border-border-color/20">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 px-6 py-8 text-[11px] leading-relaxed">
                <div className="col-span-1">
                  <div className="mb-2 text-text-muted text-xs">// TITLE</div>
                  <p className="text-text-strong font-bold text-sm tracking-widest font-sans">{selectedStory.title}</p>
                </div>
                <div className="col-span-1">
                  <div className="mb-2 text-text-muted text-xs">// DIMENSION</div>
                  <p className="text-sm">100cm x 100cm</p>
                </div>
                <div className="col-span-1">
                  <div className="mb-2 text-text-muted text-xs">// ACQUISITION</div>
                  <p className="text-accent font-bold tracking-widest text-sm">{selectedStory.sold ? 'SOLD' : selectedStory.price}</p>
                </div>
                <div className="col-span-1">
                  {/* Spacer */}
                </div>
                <div className="flex col-span-1 flex-col justify-center items-start md:items-end">
                  {!selectedStory.sold && (
                    <button 
                      onClick={() => {
                        setBuyItem({ ...selectedStory, returnTo: 'story' });
                        setCurrentView('buy');
                      }}
                      className="w-full md:w-48 bg-action-bg text-action-text rounded-full px-6 py-2.5 hover:opacity-80 transition-opacity tracking-widest text-[11px] font-bold"
                    >
                      BUY NOW
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content: Image Left, Details Right */}
            <div className="flex flex-col md:flex-row w-full flex-1">
              {/* Image Side */}
              <div className="w-full md:w-1/2 p-8 md:p-16 flex items-start justify-center border-b md:border-b-0 md:border-r border-border-color/20">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full aspect-square max-w-[600px] shadow-2xl cursor-zoom-in"
                  onClick={() => setZoomedImage(selectedStory.src)}
                >
                  <img 
                    src={selectedStory.src} 
                    alt={selectedStory.title} 
                    className="w-full h-full object-contain transition-transform duration-500 hover:scale-105" 
                    draggable={false}
                  />
                </motion.div>
              </div>
              
              {/* Details Side */}
              <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col">
                <div className="max-w-xl">
                  <div className="mb-8 text-text-muted text-xs tracking-widest uppercase">// THE STORY</div>
                  <div className="text-sm md:text-base leading-relaxed text-text-base space-y-6 font-sans">
                    <p>{selectedStory.story}</p>
                    <p>
                      This piece represents a pivotal moment in the artist's exploration of synthetic-organic synthesis. 
                      By isolating the core structural elements and exposing them to controlled environmental stressors, 
                      a unique patina was achieved that cannot be replicated. 
                    </p>
                    <p>
                      The materials used were sourced from decommissioned orbital habitats, carrying with them the history 
                      of early off-world colonization efforts. Each scratch and imperfection tells a story of survival in 
                      the harsh vacuum of space, now preserved forever in this static form.
                    </p>
                    {selectedStory.sold && (
                      <p className="text-text-muted italic mt-8 pt-8 border-t border-border-color/20">
                        This piece was acquired by a private collector shortly after its initial exhibition. Its current whereabouts are unknown, though rumors suggest it resides in a secure facility in the upper atmosphere.
                      </p>
                    )}
                  </div>
                  
                  {/* Mobile Bottom Buy Button */}
                  {!selectedStory.sold && (
                    <div className="mt-12 md:hidden flex justify-center">
                      <button 
                        onClick={() => {
                          setBuyItem({ ...selectedStory, returnTo: 'story' });
                          setCurrentView('buy');
                        }}
                        className="w-full bg-action-bg text-action-text rounded-full px-6 py-4 hover:opacity-80 transition-opacity tracking-widest text-[11px] font-bold"
                      >
                        BUY NOW
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : currentView === 'buy' && buyItem ? (
        <main className="flex-1 flex flex-col relative overflow-hidden bg-bg">
          {/* Top Navigation */}
          <div className="flex justify-between px-6 py-4 text-xs tracking-widest shrink-0 text-text-strong uppercase border-b border-border-color/20">
            <button 
              onClick={() => setCurrentView(buyItem.returnTo || 'gallery')}
              className="flex items-center gap-2 hover:text-accent transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              BACK TO {buyItem.returnTo === 'story' ? 'STORY' : 'EXHIBITION'}
            </button>
            <span>SECURE CHECKOUT</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar flex justify-center">
            <div className="flex flex-col md:flex-row w-full max-w-6xl min-h-full border-x border-border-color/20">
              {/* Left Side: Item Summary */}
              <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col border-b md:border-b-0 md:border-r border-border-color/20">
                <div className="mb-8 text-text-muted text-xs tracking-widest uppercase">// ACQUISITION SUMMARY</div>
                <div className="relative w-full aspect-square max-w-[400px] mb-8">
                  <img 
                    src={buyItem.src} 
                    alt={buyItem.title} 
                    className="w-full h-full object-contain" 
                    draggable={false}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-text-muted text-xs mb-1">// TITLE</div>
                    <div className="text-text-strong font-bold text-xl tracking-widest font-sans">{buyItem.title}</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">// DIMENSION</div>
                    <div className="text-text-base">100cm x 100cm</div>
                  </div>
                  <div>
                    <div className="text-text-muted text-xs mb-1">// PRICE</div>
                    <div className="text-accent font-bold text-xl tracking-widest">{buyItem.price}</div>
                  </div>
                </div>
              </div>
              
              {/* Right Side: Checkout Form */}
              <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col bg-bg/50">
                <div className="max-w-md w-full mx-auto">
                  <div className="mb-8 text-text-muted text-xs tracking-widest uppercase">// PAYMENT DETAILS</div>
                  
                  <form className="space-y-6 font-sans" onSubmit={(e) => { e.preventDefault(); alert('Purchase successful! (Mocked)'); setCurrentView('gallery'); }}>
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h3 className="text-text-strong font-bold tracking-widest text-sm uppercase">Contact Information</h3>
                      <div>
                        <input type="email" placeholder="Email Address" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-4 pt-4 border-t border-border-color/20">
                      <h3 className="text-text-strong font-bold tracking-widest text-sm uppercase">Shipping Address</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="First Name" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                        <input type="text" placeholder="Last Name" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                      </div>
                      <input type="text" placeholder="Address" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="City" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                        <input type="text" placeholder="Postal Code" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                      </div>
                      <input type="text" placeholder="Country" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-4 pt-4 border-t border-border-color/20">
                      <h3 className="text-text-strong font-bold tracking-widest text-sm uppercase">Payment Method</h3>
                      <input type="text" placeholder="Card Number" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="MM/YY" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                        <input type="text" placeholder="CVC" required className="w-full bg-transparent border border-border-color rounded-none px-4 py-3 text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-text-strong transition-colors" />
                      </div>
                    </div>

                    <div className="pt-8">
                      <button type="submit" className="w-full bg-action-bg text-action-text rounded-full px-6 py-4 hover:opacity-80 transition-opacity tracking-widest text-xs font-bold uppercase">
                        CONFIRM PURCHASE - {buyItem.price}
                      </button>
                      <p className="text-center text-text-muted text-xs mt-4">
                        <svg className="inline-block w-3 h-3 mr-1 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Secure, encrypted transaction
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <>
          {/* Main Content */}
          <main className="flex-1 flex flex-col relative overflow-hidden">
            {/* Top Labels */}
            <div className="flex justify-between px-6 py-2 text-xs tracking-widest shrink-0 text-text-strong uppercase">
              <span>EXHIBITION</span>
              <span>[{String(activeDataIndex + 1).padStart(2, '0')}/{String(galleryData.length).padStart(2, '0')}]</span>
              <span>{activeGallery.title}</span>
            </div>

            {/* Gallery */}
            <div className="flex-1 relative w-full flex items-center justify-center overflow-hidden">
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                onWheel={handleWheel}
                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="absolute inset-0 flex items-start justify-center gap-1 md:gap-2 cursor-none pt-4 md:pt-8"
              >
                <AnimatePresence mode="popLayout">
                  {visibleItems.map((item) => {
                    const isCenter = item.offset === 0;
                    return (
                      <motion.div
                        layout
                        key={`${galleryIndex}-${item.absoluteIndex}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isCenter ? 1 : 0.4, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`shrink-0 origin-top aspect-square ${
                          isCenter 
                            ? 'h-[35vh] md:h-[40vh] max-h-[400px] z-10 shadow-2xl' 
                            : 'h-[17.5vh] md:h-[20vh] max-h-[200px] z-0'
                        }`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="w-full h-full cursor-zoom-in"
                          onClick={() => setZoomedImage(item.data.src)}
                        >
                          <img 
                            src={item.data.src} 
                            alt={item.data.title} 
                            className={`w-full h-full object-contain transition-all duration-500`} 
                            draggable={false}
                          />
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          </main>

          {/* Footer Area */}
          <footer className="shrink-0 flex flex-col">
            {/* Mobile Footer */}
            <div className="flex flex-col md:hidden px-6 pb-4 gap-6">
              {/* Buttons side by side */}
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => {
                    setSelectedStory({
                      id: activeItem.id,
                      title: activeItem.title,
                      src: activeItem.src,
                      story: `${activeItem.desc1} ${activeItem.desc2} ${activeItem.desc3}`,
                      price: activeItem.price,
                      sold: false,
                      sourceView: 'gallery',
                      exhibitionTitle: activeGallery.title
                    });
                    setCurrentView('story');
                  }}
                  className="flex-1 border border-border-color rounded-full px-4 py-2.5 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-[10px] font-bold text-text-strong text-center"
                >
                  DISCOVER FULL STORY
                </button>
              </div>
            </div>

            {/* Text Columns */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-8 px-6 py-8 text-[11px] leading-relaxed min-h-[160px]">
              <div className="col-span-1">
                <div className="mb-2 text-text-muted text-xs">// TITLE</div>
                <p className="text-text-strong font-bold text-sm tracking-widest font-sans">{activeItem.title}</p>
              </div>
              <div className="col-span-1 hidden lg:block">
                <div className="mb-2 text-text-muted text-xs">// DIMENSION</div>
                <p className="text-sm">100cm x 100cm</p>
              </div>
              <div className="col-span-1 hidden lg:block">
                <div className="mb-2 text-text-muted text-xs">// DETAILS</div>
                <p className="text-sm line-clamp-2" title={`${activeItem.desc2} ${activeItem.desc3}`}>{activeItem.desc2} {activeItem.desc3}</p>
              </div>
              <div className="col-span-1 hidden lg:block">
                <div className="mb-2 text-text-muted text-xs">// ACQUISITION</div>
                <p className="text-accent font-bold tracking-widest text-sm">{activeItem.price}</p>
              </div>
              <div className="col-span-1 flex flex-col justify-start items-end gap-2" style={{ height: '89.833px' }}>
                <button 
                  onClick={() => {
                    setSelectedStory({
                      id: activeItem.id,
                      title: activeItem.title,
                      src: activeItem.src,
                      story: `${activeItem.desc1} ${activeItem.desc2} ${activeItem.desc3}`,
                      price: activeItem.price,
                      sold: false, // Assuming exhibition items are not sold yet
                      sourceView: 'gallery',
                      exhibitionTitle: activeGallery.title
                    });
                    setCurrentView('story');
                  }}
                  className="w-[196px] border border-border-color rounded-full px-6 py-2.5 hover:bg-text-strong hover:text-bg transition-colors tracking-widest text-[11px]"
                >
                  DISCOVER FULL STORY
                </button>
                <button 
                  onClick={() => {
                    setBuyItem({
                      id: activeItem.id,
                      title: activeItem.title,
                      src: activeItem.src,
                      price: activeItem.price,
                      returnTo: 'gallery',
                      exhibitionTitle: activeGallery.title
                    });
                    setCurrentView('buy');
                  }}
                  className="w-[196px] bg-action-bg text-action-text rounded-full px-6 py-2.5 hover:opacity-80 transition-opacity tracking-widest text-[11px] font-bold"
                >
                  BUY NOW
                </button>
              </div>
            </div>

            {/* Big Text */}
            <div className="flex justify-between items-end px-6 pb-4">
              <div className="flex flex-col">
                <div className="flex items-stretch gap-4 md:gap-6">
                  <h1 className="font-cursive text-7xl md:text-9xl text-text-strong leading-none tracking-normal pt-0 pl-0">{activeGallery.title}</h1>
                  <div className="flex flex-col items-start justify-between py-2" style={{ height: '114px', paddingTop: '0px' }}>
                    {!activeGallery.isPast ? (
                      <a href="#" className="flex items-center gap-1 text-text-strong hover:text-accent transition-colors tracking-widest text-xs whitespace-nowrap underline-offset-4 hover:underline cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                        </svg>
                        VIEW 360
                      </a>
                    ) : (
                      <div className="h-[12px]"></div>
                    )}
                    <div className="flex flex-col text-xs tracking-widest text-text-muted uppercase gap-1">
                      <span>{activeGallery.date}</span>
                      <a href="#" className="flex items-center gap-1 hover:text-text-strong transition-colors underline-offset-4 hover:underline cursor-pointer">
                        <MapPin size={10} />
                        {activeGallery.location}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-text-muted flex items-center gap-4 h-8">
                  {galleryIndex < galleries.length - 1 ? (
                    <button 
                      className="hover:text-text-strong transition-colors cursor-pointer group flex items-center"
                      onClick={() => paginateGallery(1)}
                      onMouseEnter={() => setHoveredNav('next')}
                      onMouseLeave={() => setHoveredNav(null)}
                    >
                      <svg width="48" height="16" viewBox="0 0 64 24" fill="currentColor" className="group-hover:-translate-x-2 transition-transform rotate-180">
                        <path d="M0 10h40v4H0z M40 6h4v12h-4z M44 2h4v20h-4z M48 6h4v12h-4z M52 10h4v4h-4z" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-[48px]"></div>
                  )}
                  
                  <div className="text-[10px] tracking-widest font-mono text-center w-40 opacity-100 transition-opacity">
                    {hoveredNav === 'prev' && galleryIndex > 0 ? 'NEWER EXHIBITION' : hoveredNav === 'next' && galleryIndex < galleries.length - 1 ? 'PAST EXHIBITION' : ''}
                  </div>

                  {galleryIndex > 0 ? (
                    <button 
                      className="hover:text-text-strong transition-colors cursor-pointer group flex items-center"
                      onClick={() => paginateGallery(-1)}
                      onMouseEnter={() => setHoveredNav('prev')}
                      onMouseLeave={() => setHoveredNav(null)}
                    >
                      <svg width="48" height="16" viewBox="0 0 64 24" fill="currentColor" className="group-hover:translate-x-2 transition-transform">
                        <path d="M0 10h40v4H0z M40 6h4v12h-4z M44 2h4v20h-4z M48 6h4v12h-4z M52 10h4v4h-4z" />
                      </svg>
                    </button>
                  ) : (
                    <div className="w-[48px]"></div>
                  )}
                </div>
              </div>
              <div className="hidden md:block font-mono text-5xl md:text-7xl text-text-faint tracking-tighter">
                ({String(activeDataIndex + 1).padStart(2, '0')})
              </div>
            </div>

            {/* Marquee */}
            <a href="#" className={`marquee-container block border-t border-border-color py-1.5 text-[10px] tracking-[0.2em] text-text-muted bg-marquee-bg hover:text-text-strong transition-colors hover:[&>div]:[animation-duration:240s] uppercase ${activeGallery.isPast ? 'invisible' : ''}`}>
              <div className="marquee-content">
                {Array(20).fill(`${activeGallery.isPast ? 'PAST EXHIBITION' : 'NOW EXHIBITING'} ✶ ${activeGallery.title} ✶ ${activeGallery.location} ✶ `).join("")}
              </div>
              <div className="marquee-content" aria-hidden="true">
                {Array(20).fill(`${activeGallery.isPast ? 'PAST EXHIBITION' : 'NOW EXHIBITING'} ✶ ${activeGallery.title} ✶ ${activeGallery.location} ✶ `).join("")}
              </div>
            </a>
          </footer>
        </>
      )}
    </div>
  );
}
