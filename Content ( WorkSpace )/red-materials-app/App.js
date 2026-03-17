import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Building2, Home, TreeDeciduous, Store, Briefcase, Stethoscope,
  ChevronDown, ChevronRight, Brain, Heart, User, Phone, MessageSquare,
  Target, Clock, Handshake, Award, Eye, Shirt, Watch, Gem, Sparkles,
  AlertTriangle, Users, Volume2, CheckCircle2, XCircle, ArrowRight,
  MapPin, DollarSign, Calendar, Palette, Star, History, Layers,
  Building, Castle, Hotel, Warehouse, LayoutGrid, Armchair
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from 'recharts';

// =====================================================
// ANIMATED BACKGROUND PARTICLES
// =====================================================
const ParticleBackground = () => {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-red-500/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-red-950/30" />
    </div>
  );
};

// =====================================================
// SCROLL PROGRESS BAR
// =====================================================
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 z-50 origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
};

// =====================================================
// NAVIGATION
// =====================================================
const Navigation = ({ activeSection }) => {
  const sections = [
    { id: 'hero', label: 'Home' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'market', label: 'Market' },
    { id: 'request', label: 'Request' },
    { id: 'psychology', label: 'Psychology' },
    { id: 'arsenal', label: 'Arsenal' },
    { id: 'calls', label: 'Calls' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-red-500/20"
    >
      <ul className="flex gap-6">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`text-sm font-medium transition-all duration-300 ${
                activeSection === section.id
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </motion.nav>
  );
};

// =====================================================
// SECTION WRAPPER WITH ANIMATIONS
// =====================================================
const Section = ({ id, children, className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`min-h-screen py-20 px-6 relative ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.section>
  );
};

// =====================================================
// CHAPTER HEADER
// =====================================================
const ChapterHeader = ({ number, title, subtitle }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="text-center mb-16"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
    >
      <motion.span
        className="text-red-500 text-sm font-mono tracking-widest"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
      >
        CHAPTER {number}
      </motion.span>
      <motion.h2
        className="text-5xl md:text-7xl font-bold mt-2 bg-gradient-to-r from-white via-gray-200 to-red-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
};

// =====================================================
// GLASS CARD COMPONENT
// =====================================================
const GlassCard = ({ children, className = '', hover = true }) => {
  return (
    <motion.div
      className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 ${className}`}
      whileHover={hover ? { 
        scale: 1.02, 
        borderColor: 'rgba(239, 68, 68, 0.5)',
        boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)'
      } : {}}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// =====================================================
// HERO SECTION
// =====================================================
const HeroSection = () => {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-black"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(220, 38, 38, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(220, 38, 38, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>
      
      <div className="text-center z-10 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.div
            className="inline-block mb-6"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-orange-500 bg-clip-text text-transparent">
              Red Materials
            </span>
          </motion.h1>
          
          <motion.p
            className="text-2xl md:text-4xl text-gray-300 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            The Ultimate Real Estate Mastery
          </motion.p>
          
          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {['Properties', 'Market', 'Psychology', 'Sales'].map((tag, i) => (
              <motion.span
                key={tag}
                className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
        
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-red-500/50" />
        </motion.div>
      </div>
    </section>
  );
};

// =====================================================
// CHAPTER I: THE INVENTORY
// =====================================================
const InventorySection = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFinishing, setActiveFinishing] = useState(0);
  
  const categories = {
    residential: {
      icon: Home,
      title: 'Residential',
      color: 'from-red-500 to-red-700',
      types: [
        {
          name: 'Apartments',
          subtypes: ['Duplex', 'Apartment', 'Penthouse'],
          icon: Building,
          details: 'Unit layout variations available'
        },
        {
          name: 'Service Apartment',
          subtypes: [],
          icon: Hotel,
          details: 'Fully serviced residential units'
        },
        {
          name: 'Stand Alone',
          subtypes: ['One Story'],
          icon: Castle,
          details: 'Independent residential structures'
        },
        {
          name: 'Villas',
          subtypes: ['Town House', 'Twin House'],
          icon: Home,
          details: 'Premium residential options'
        }
      ]
    },
    commercial: {
      icon: Store,
      title: 'Commercial',
      color: 'from-orange-500 to-red-600',
      types: [
        { name: 'Shops / Show Room', icon: Store, details: 'Retail spaces' },
        { name: 'Admin', icon: Briefcase, details: 'Administrative offices' },
        { name: 'Medical / Pharmacy', icon: Stethoscope, details: 'Healthcare facilities' }
      ]
    },
    land: {
      icon: TreeDeciduous,
      title: 'Land',
      color: 'from-green-500 to-emerald-700',
      types: [
        { name: 'Raw Land', icon: TreeDeciduous, details: 'Undeveloped plots' }
      ]
    }
  };
  
  const finishingTypes = [
    {
      name: 'Core & Shell',
      description: 'Basic structure without interior finishing',
      level: 25,
      color: 'from-gray-600 to-gray-800'
    },
    {
      name: 'Semi Finished',
      description: 'Partial interior work completed',
      level: 60,
      color: 'from-orange-500 to-red-600'
    },
    {
      name: 'Fully Finished',
      description: 'Complete interior finishing',
      level: 85,
      color: 'from-red-500 to-red-700'
    },
    {
      name: 'Fully Furnished',
      description: 'Ready to move with all furniture',
      level: 100,
      color: 'from-red-400 to-pink-600'
    }
  ];

  return (
    <Section id="inventory" className="bg-gradient-to-b from-black via-gray-950 to-black">
      <ChapterHeader 
        number="I" 
        title="The Inventory"
        subtitle="Properties Types & Finishing"
      />
      
      {/* Property Types */}
      <div className="max-w-7xl mx-auto">
        <motion.h3
          className="text-3xl font-bold text-white mb-8 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Properties Types
        </motion.h3>
        
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {Object.entries(categories).map(([key, category], index) => {
            const Icon = category.icon;
            const isActive = activeCategory === key;
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard
                  className={`cursor-pointer transition-all duration-500 ${
                    isActive ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <div onClick={() => setActiveCategory(isActive ? null : key)}>
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-2">{category.title}</h4>
                    <div className="flex items-center text-gray-400">
                      <span className="text-sm">Click to explore</span>
                      <motion.div
                        animate={{ rotate: isActive ? 90 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </motion.div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                          {category.types.map((type, i) => {
                            const TypeIcon = type.icon;
                            return (
                              <motion.div
                                key={type.name}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <TypeIcon className="w-5 h-5 text-red-400" />
                                  <span className="text-white font-medium">{type.name}</span>
                                </div>
                                {type.subtypes && type.subtypes.length > 0 && (
                                  <div className="mt-2 ml-8 flex flex-wrap gap-2">
                                    {type.subtypes.map((sub) => (
                                      <span
                                        key={sub}
                                        className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30"
                                      >
                                        {sub}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <p className="text-gray-500 text-sm mt-2 ml-8">{type.details}</p>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
        
        {/* Finishing Types */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Finishing Types</h3>
          
          <GlassCard className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {finishingTypes.map((type, index) => (
                <motion.div
                  key={type.name}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    activeFinishing === index 
                      ? 'bg-white/10 ring-1 ring-red-500/50' 
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => setActiveFinishing(index)}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{type.name}</h4>
                      <p className="text-sm text-gray-400">{type.description}</p>
                    </div>
                    <span className="text-2xl font-bold text-red-400">{type.level}%</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${type.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: activeFinishing === index ? `${type.level}%` : `${type.level}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </Section>
  );
};

// =====================================================
// CHAPTER II: THE MARKET BATTLEFIELD
// =====================================================
const MarketSection = () => {
  const [activeComparison, setActiveComparison] = useState('broker');
  
  const brokerVsDeveloper = {
    broker: {
      title: 'Broker',
      subtitle: 'Consultancy',
      color: 'from-red-500 to-orange-500',
      points: [
        'Working on diverse projects',
        'Less walk out',
        'More awareness with the market',
        'Calling with regards to opportunity'
      ]
    },
    developer: {
      title: 'Developer',
      subtitle: 'Sales',
      color: 'from-gray-600 to-gray-800',
      points: [
        'Working on their projects',
        'More walk out',
        'Less awareness with the market',
        'Calling with regards to type'
      ]
    }
  };
  
  const primaryVsResale = {
    primary: {
      title: 'Primary',
      points: [
        'Buy from developer',
        'Installments / cash',
        'Most of the primary are Off-plan'
      ],
      icon: Building2
    },
    resale: {
      title: 'Resale',
      points: [
        'Buy from client',
        'Cash payment',
        'Most of the resales are RTM (Ready To Move)'
      ],
      icon: Users
    }
  };

  return (
    <Section id="market" className="bg-gradient-to-b from-black via-red-950/10 to-black">
      <ChapterHeader 
        number="II" 
        title="The Market Battlefield"
        subtitle="Broker vs. Developer & Primary vs. Resale"
      />
      
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Broker vs Developer */}
        <div>
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Broker vs. Developer</h3>
          
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-full bg-gray-900 p-1">
              {['broker', 'developer'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveComparison(type)}
                  className={`px-8 py-3 rounded-full text-sm font-medium transition-all ${
                    activeComparison === type
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {brokerVsDeveloper[type].title}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {Object.entries(brokerVsDeveloper).map(([key, data]) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: key === 'broker' ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <GlassCard className={`${activeComparison === key ? 'ring-2 ring-red-500' : 'opacity-50'}`}>
                  <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${data.color} mb-4`}>
                    <span className="text-white font-semibold">{data.subtitle}</span>
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-6">{data.title}</h4>
                  <ul className="space-y-4">
                    {data.points.map((point, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="text-gray-300">{point}</span>
                      </motion.li>
                    ))}
                  </ul>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Primary vs Resale */}
        <div>
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Primary vs. Resale</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {Object.entries(primaryVsResale).map(([key, data], index) => {
              const Icon = data.icon;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                >
                  <GlassCard className="h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                        key === 'primary' ? 'from-red-500 to-orange-500' : 'from-blue-500 to-purple-600'
                      } flex items-center justify-center`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-white">{data.title}</h4>
                    </div>
                    <ul className="space-y-4">
                      {data.points.map((point, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                        >
                          <ArrowRight className="w-4 h-4 text-red-400" />
                          <span className="text-gray-300">{point}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
};

// =====================================================
// CHAPTER III: REQUEST & QUALIFICATION
// =====================================================
const RequestSection = () => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });
  
  const requestItems = [
    { icon: MapPin, label: 'Destination', description: 'Location preferences and area requirements' },
    { icon: LayoutGrid, label: 'Unit type / area', description: 'Property type and size specifications' },
    { icon: Calendar, label: 'Delivery', description: 'Timeline and handover expectations' },
    { icon: Palette, label: 'Finishing Specs', description: 'Interior finishing preferences' },
    { icon: Star, label: 'Developer Category', description: 'Preferred developer tier and reputation' },
    { icon: History, label: 'History (Viewed Prev / Objections)', description: 'Previous viewings and client concerns' },
    { icon: DollarSign, label: 'Budget / Down payment / Quarter', description: 'Financial capacity and payment structure' },
  ];

  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => {
          if (prev >= requestItems.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 400);
      return () => clearInterval(interval);
    } else {
      setActiveIndex(-1);
    }
  }, [isInView]);

  return (
    <Section id="request" className="bg-gradient-to-b from-black via-gray-950 to-black">
      <ChapterHeader 
        number="III" 
        title="The Request"
        subtitle="Client Qualification HUD"
      />
      
      <div className="max-w-4xl mx-auto" ref={ref}>
        <motion.h3
          className="text-3xl font-bold text-center text-white mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Request!
        </motion.h3>
        <motion.p
          className="text-gray-400 text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Essential data points for client qualification
        </motion.p>
        
        <GlassCard className="relative overflow-hidden">
          {/* HUD Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
          
          <div className="space-y-4">
            {requestItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = index <= activeIndex;
              
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0.3, x: -30 }}
                  animate={{ 
                    opacity: isActive ? 1 : 0.3,
                    x: isActive ? 0 : -30,
                  }}
                  transition={{ duration: 0.4 }}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-500/20 to-transparent border-l-2 border-red-500' 
                      : 'bg-white/5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isActive 
                      ? 'bg-red-500 shadow-lg shadow-red-500/30' 
                      : 'bg-gray-800'
                  }`}>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {item.label}
                    </h4>
                    <p className={`text-sm ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          <motion.div
            className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-center text-red-300 font-mono text-sm">
              SYSTEM STATUS: QUALIFICATION CHECKLIST ACTIVE
            </p>
          </motion.div>
        </GlassCard>
      </div>
    </Section>
  );
};

// =====================================================
// CHAPTER IV: PSYCHOLOGY OF THE BUY
// =====================================================
const PsychologySection = () => {
  const [showEmotional, setShowEmotional] = useState(true);
  
  const needsVsWants = {
    needs: {
      title: 'Needs',
      description: 'Everything that they (say, ask for)',
      color: 'from-blue-500 to-cyan-500'
    },
    wants: {
      title: 'Wants',
      description: 'Reasons Behind it',
      details: [
        'Can be emotional or rational',
        'Not tangible',
        'Is a concept'
      ],
      color: 'from-red-500 to-pink-500'
    }
  };

  return (
    <Section id="psychology" className="bg-gradient-to-b from-black via-red-950/10 to-black">
      <ChapterHeader 
        number="IV" 
        title="Psychology of the Buy"
        subtitle="Buying Motives"
      />
      
      <div className="max-w-5xl mx-auto space-y-20">
        {/* The Question */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-2xl text-gray-400 mb-6">The Question is why people tend to buy</h3>
          <GlassCard className="inline-block">
            <p className="text-xl text-gray-300">
              Answer would be <span className="text-red-400 font-semibold">People Don't Buy the Product.</span>
            </p>
          </GlassCard>
        </motion.div>
        
        {/* The Manifesto */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-red-500/20 blur-3xl" />
          <div className="relative bg-black/50 backdrop-blur-xl rounded-3xl p-12 border border-red-500/30 text-center">
            <motion.h2
              className="text-4xl md:text-6xl font-bold leading-tight"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <motion.span
                className="block text-white"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                People Buy to feel
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                Good
              </motion.span>
              <motion.span
                className="block text-gray-400 text-2xl md:text-3xl mt-4"
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
              >
                or to solve a problem.
              </motion.span>
            </motion.h2>
          </div>
        </motion.div>
        
        {/* Emotional vs Rational */}
        <div>
          <motion.h3
            className="text-2xl text-center text-gray-400 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Do you think people buy emotion or rational
          </motion.h3>
          
          <div className="flex justify-center mb-8">
            <motion.div
              className="relative w-64 h-32"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <motion.div
                className="absolute left-0 top-0 w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.1 }}
                onClick={() => setShowEmotional(true)}
                animate={{ 
                  scale: showEmotional ? 1.1 : 1,
                  boxShadow: showEmotional ? '0 0 40px rgba(239, 68, 68, 0.5)' : 'none'
                }}
              >
                <Heart className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.div
                className="absolute right-0 top-0 w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.1 }}
                onClick={() => setShowEmotional(false)}
                animate={{ 
                  scale: !showEmotional ? 1.1 : 1,
                  boxShadow: !showEmotional ? '0 0 40px rgba(59, 130, 246, 0.5)' : 'none'
                }}
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
              
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-white">
                VS
              </div>
            </motion.div>
          </div>
          
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <GlassCard className="inline-block">
              <p className="text-xl">
                <span className={showEmotional ? 'text-red-400' : 'text-blue-400'}>
                  {showEmotional ? 'Emotional' : 'Rational'}
                </span>
                <span className="text-gray-400"> buying decisions</span>
              </p>
            </GlassCard>
          </motion.div>
        </div>
        
        {/* Buying Motives VS Needs & Wants */}
        <div>
          <motion.h3
            className="text-3xl font-bold text-center text-white mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Buying Motives VS Needs & Wants
          </motion.h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="h-full">
                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${needsVsWants.needs.color} mb-4`}>
                  <span className="text-white font-semibold">{needsVsWants.needs.title}</span>
                </div>
                <p className="text-gray-300 text-lg">{needsVsWants.needs.description}</p>
              </GlassCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="h-full">
                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${needsVsWants.wants.color} mb-4`}>
                  <span className="text-white font-semibold">{needsVsWants.wants.title}</span>
                </div>
                <p className="text-gray-300 text-lg mb-4">{needsVsWants.wants.description}</p>
                <ul className="space-y-2">
                  {needsVsWants.wants.details.map((detail, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-gray-400"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      {detail}
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </Section>
  );
};

// =====================================================
// CHAPTER V: THE SALESMAN'S ARSENAL
// =====================================================
const ArsenalSection = () => {
  const [visibleAccessories, setVisibleAccessories] = useState(0);
  const accessoriesRef = useRef(null);
  const isInView = useInView(accessoriesRef, { once: false });
  
  const skills = [
    { skill: 'Confidence', value: 90 },
    { skill: 'Communication', value: 95 },
    { skill: 'Knowledge', value: 85 },
    { skill: 'Presentable', value: 88 },
    { skill: 'Time Management', value: 80 },
    { skill: 'Flexibility', value: 82 },
    { skill: 'Negotiation', value: 92 },
    { skill: 'Closure', value: 88 },
  ];
  
  const skillsList = [
    'Confidence',
    'Strong communication skills',
    'Knowledge',
    'Presentable',
    'Strong time management skills',
    'Flexibility',
    'Negotiation skills',
    'Strong closure techniques'
  ];
  
  const accessories = [
    { name: 'Bold patterns', icon: Shirt },
    { name: 'Non-conservative color', icon: Palette },
    { name: 'Pocket squares', icon: Gem },
    { name: 'Cufflinks', icon: Sparkles },
    { name: 'Watches', icon: Watch },
    { name: 'Brightly-colored neckties', icon: Shirt },
    { name: 'Waistcoats', icon: Shirt },
    { name: 'Boutonnieres', icon: Sparkles },
    { name: 'Braces', icon: Shirt },
    { name: 'Brass buttons (on blazer jackets)', icon: Gem },
    { name: 'Trendy eyeglasses', icon: Eye },
    { name: 'Necklace belt buckles', icon: Gem },
    { name: 'Facial hair', icon: User },
  ];

  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setVisibleAccessories((prev) => {
          if (prev >= accessories.length) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isInView]);

  return (
    <Section id="arsenal" className="bg-gradient-to-b from-black via-gray-950 to-black">
      <ChapterHeader 
        number="V" 
        title="The Salesman's Arsenal"
        subtitle="Skills & Appearance"
      />
      
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Skills Section */}
        <div>
          <motion.h3
            className="text-3xl font-bold text-center text-white mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Skills and qualities of a successful sales individual :
          </motion.h3>
          
          <div className="grid md:grid-cols-2 gap-12 mt-12">
            {/* Skills List */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard>
                <ul className="space-y-4">
                  {skillsList.map((skill, i) => (
                    <motion.li
                      key={skill}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-red-500/10 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-gray-300">{skill}</span>
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
            
            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={skills}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis 
                      dataKey="skill" 
                      tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: '#6B7280' }}
                    />
                    <Radar
                      name="Skills"
                      dataKey="value"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>
            </motion.div>
          </div>
        </div>
        
        {/* Dress Code Section */}
        <div>
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-white mb-4">Our Dress Code</h3>
            <GlassCard className="inline-block">
              <p className="text-xl text-red-400 font-semibold">
                You never have a second chance to make a first impression!
              </p>
            </GlassCard>
            <motion.p
              className="text-gray-400 mt-6 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Studies show it can take 21 repeated good experiences with a person to make up for a bad first impression
            </motion.p>
          </motion.div>
          
          {/* 7 Rules */}
          <motion.div
            ref={accessoriesRef}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <GlassCard>
              <div className="flex items-center justify-center mb-8">
                <motion.div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-5xl font-bold text-white"
                  animate={{ 
                    boxShadow: ['0 0 20px rgba(239, 68, 68, 0.3)', '0 0 60px rgba(239, 68, 68, 0.6)', '0 0 20px rgba(239, 68, 68, 0.3)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  7
                </motion.div>
              </div>
              
              <h4 className="text-2xl font-bold text-center text-white mb-4">7 Rules of Accessories</h4>
              <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">
                You shouldn't have more than 7 points of interest on your body.
              </p>
              
              <p className="text-center text-gray-300 mb-8 max-w-3xl mx-auto">
                Possible points for men include: bold patterns, non-conservative color, pocket squares, cufflinks, watches, brightly-colored neckties, waistcoats, boutonnieres, braces, brass buttons (on blazer jackets), trendy eyeglasses, necklace belt buckles, and even facial hair.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {accessories.map((item, i) => {
                  const Icon = item.icon;
                  const isVisible = i < visibleAccessories;
                  
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: isVisible ? 1 : 0.2,
                        scale: isVisible ? 1 : 0.9
                      }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 rounded-xl text-center ${
                        isVisible 
                          ? 'bg-gradient-to-br from-red-500/20 to-transparent border border-red-500/30' 
                          : 'bg-white/5'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${isVisible ? 'text-red-400' : 'text-gray-600'}`} />
                      <span className={`text-sm ${isVisible ? 'text-white' : 'text-gray-600'}`}>
                        {item.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              
              <motion.p
                className="text-center text-red-400 mt-8 font-semibold"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                The reason is that any more than seven points could be too overwhelming for the eyes.
              </motion.p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </Section>
  );
};

// =====================================================
// CHAPTER VI: THE ART OF THE CALL
// =====================================================
const CallsSection = () => {
  const communicationData = [
    { name: 'Words', value: 7, color: '#EF4444' },
    { name: 'Tonality', value: 38, color: '#F97316' },
    { name: 'Body Language', value: 55, color: '#DC2626' },
  ];
  
  const mistakes = [
    'Stop when you should proceed',
    'Asking wrong questions hi this Sara? Is this a good time to talk?',
    'Unclear benefits',
    'Length of message',
    'Talking like robots (Machine talk format)',
    'Practice & preparation'
  ];
  
  const rapportPoints = [
    'Building rapport is very important during the call.',
    "Its not about changing yourself it's about adapting yourself & your style to be like the other person.",
    'Speaking the same language & understand where he comes from, Mirror the same tone / volume.',
    'We like people who are like us (similar attracts and opposite to make it interesting)'
  ];

  return (
    <Section id="calls" className="bg-gradient-to-b from-black via-red-950/10 to-black">
      <ChapterHeader 
        number="VI" 
        title="The Art of the Call"
        subtitle="Calls - Communication & Closing"
      />
      
      <div className="max-w-6xl mx-auto space-y-20">
        {/* ABC Technique */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-xl text-gray-400 mb-4">How to qualify some one during the call</h3>
          <p className="text-gray-400 mb-8">Firstly, always use the</p>
          
          <motion.div
            className="relative inline-block"
            initial={{ scale: 0.8 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-red-500/30 blur-3xl" />
            <div className="relative bg-black/50 backdrop-blur-xl rounded-3xl p-12 border border-red-500/50">
              <motion.h2
                className="text-6xl md:text-8xl font-black tracking-wider"
                animate={{ 
                  textShadow: [
                    '0 0 20px rgba(239, 68, 68, 0.5)',
                    '0 0 60px rgba(239, 68, 68, 0.8)',
                    '0 0 20px rgba(239, 68, 68, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-red-500">A</span>
                <span className="text-white">.</span>
                <span className="text-red-500">B</span>
                <span className="text-white">.</span>
                <span className="text-red-500">C</span>
              </motion.h2>
              <p className="text-2xl text-gray-300 mt-4">technique that stands for :</p>
              <motion.p
                className="text-3xl md:text-4xl font-bold mt-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <span className="text-red-400">A</span>
                <span className="text-white">lways </span>
                <span className="text-red-400">B</span>
                <span className="text-white">e </span>
                <span className="text-red-400">C</span>
                <span className="text-white">losing</span>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Communication Stats - THE 7-38-55 RULE */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl text-center text-gray-400 mb-4">
            Always think about How communication is retained
          </h3>
          <h4 className="text-xl text-center text-white mb-8 font-semibold">Body Language</h4>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <GlassCard className="h-full">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={communicationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {communicationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value}%`, '']}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    formatter={(value, entry) => (
                      <span style={{ color: '#E5E7EB' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
            
            <div className="space-y-6">
              {communicationData.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <GlassCard>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-semibold text-lg">{item.name}</span>
                      <span className="text-4xl font-bold" style={{ color: item.color }}>
                        {item.value}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.2 }}
                      />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Common Mistakes */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <h3 className="text-2xl font-bold text-white">
              Avoid make the common mistakes during the call such as :
            </h3>
          </div>
          
          <GlassCard className="border-red-500/30">
            <div className="grid md:grid-cols-2 gap-4">
              {mistakes.map((mistake, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                >
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{mistake}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
        
        {/* Building Rapport */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-center text-white mb-8">Building Rapport</h3>
          
          <GlassCard>
            {/* Mirroring Visualization */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-8">
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center"
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <User className="w-10 h-10 text-white" />
                </motion.div>
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Volume2 className="w-8 h-8 text-red-400" />
                  </motion.div>
                  <span className="text-gray-500 text-sm mt-2">Mirror</span>
                </div>
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center"
                  animate={{ x: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <User className="w-10 h-10 text-white" />
                </motion.div>
              </div>
            </div>
            
            <ul className="space-y-4">
              {rapportPoints.map((point, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5"
                >
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-gray-300">{point}</span>
                </motion.li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>
      </div>
    </Section>
  );
};

// =====================================================
// FOOTER
// =====================================================
const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-white/10 bg-black">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
            Red Materials
          </h3>
          <p className="text-gray-500">The Ultimate Real Estate Mastery</p>
          <p className="text-gray-600 text-sm mt-6">
            © 2026 Red Materials. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

// =====================================================
// MAIN APP COMPONENT
// =====================================================
const App = () => {
  const [activeSection, setActiveSection] = useState('hero');
  
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'inventory', 'market', 'request', 'psychology', 'arsenal', 'calls'];
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">
      <ParticleBackground />
      <ScrollProgress />
      <Navigation activeSection={activeSection} />
      
      <main className="relative z-10">
        <HeroSection />
        <InventorySection />
        <MarketSection />
        <RequestSection />
        <PsychologySection />
        <ArsenalSection />
        <CallsSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default App;
