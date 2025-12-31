/**
 * HADEROS Brand Story & Identity
 * 
 * This file contains the official brand story, name meaning,
 * and identity elements for the HADEROS platform.
 * 
 * @module brand-story
 * @version 1.0.0
 */

export const BRAND_STORY = {
  name: "HADEROS AI CLOUD",
  tagline: "The Operating System for Emerging Market Businesses",
  
  nameComponents: [
    {
      component: "HAD",
      meaning: "It is done.",
      significance: "Our enterprise-grade platform is not a future promise; it is built, tested, and ready today.",
      language: "English"
    },
    {
      component: "ER",
      meaning: "The one that does.",
      significance: "HADEROS is an active system, an enabler, the engine that powers our clients' growth.",
      language: "English"
    },
    {
      component: "OS",
      meaning: "Operating System",
      significance: "We provide the fundamental Operating System for Business in emerging markets.",
      language: "English"
    },
    {
      component: "حاضر",
      romanization: "Hader",
      meaning: "Present / Ready",
      significance: "The Arabic word for 'present' or 'ready,' signifying our market readiness and our commitment to being present for our customers.",
      language: "Arabic"
    },
    {
      component: "ض",
      romanization: "Dhad",
      meaning: "The Arabic Letter 'ض'",
      significance: "The 'D' in our name represents the unique Arabic letter 'ض', a symbol of our deep local roots and our commitment to building for our culture.",
      language: "Arabic",
      isUnique: true
    },
    {
      component: "准备就绪",
      romanization: "Zhǔnbèi jiùxù",
      meaning: "Completely ready and prepared",
      significance: "The Chinese expression combining preparation (准备) with full readiness (就绪), symbolizing our absolute readiness to serve Asian markets.",
      language: "Chinese"
    }
  ],
  
  vision: {
    short: "An AI-powered Operating System, delivered via the Cloud, that is already built (Had) and ready (Hader), with a soul that is authentically local (ض).",
    long: "HADEROS is more than software—it's a platform for digital transformation in emerging markets. We combine world-class technology with deep local understanding to empower businesses across the Middle East, Southeast Asia, and Africa."
  },
  
  mission: "To democratize enterprise technology by providing affordable, high-performance, and culturally adapted business solutions to SMBs in the world's fastest-growing economies.",
  
  values: [
    {
      title: "Excellence",
      description: "We deliver enterprise-grade quality with A+ security and <200ms performance."
    },
    {
      title: "Accessibility",
      description: "We make world-class technology affordable, with pricing 60-95% lower than global competitors."
    },
    {
      title: "Local Soul",
      description: "We build for our markets, with full language support, cultural understanding, and local teams."
    },
    {
      title: "Innovation",
      description: "We leverage cutting-edge AI and cloud technology to solve real business problems."
    },
    {
      title: "Transparency",
      description: "We operate with complete openness, providing clear metrics and honest communication."
    }
  ],
  
  vision2028: {
    factories: 20000,
    merchants: 60000,
    jobsCreated: 600000,
    ordersProcessed: 15000000,
    strategicAlliances: 3
  },
  
  technicalExcellence: {
    securityGrade: "A+",
    securityScore: 95,
    performanceMs: 200,
    validationCoverage: 100,
    cacheHitRate: 75,
    mttdMinutes: 5
  },
  
  markets: {
    phase1: ["Saudi Arabia", "Egypt", "UAE"],
    phase2: ["Indonesia", "Malaysia", "Qatar", "Kuwait"],
    phase3: ["North Africa", "South Asia", "China & East Asia"]
  },
  
  languages: ["Arabic", "English", "Bahasa Indonesia", "Malay", "Chinese (中文)"],
  
  founded: "2024",
  headquarters: "Middle East",
  
  socialLinks: {
    github: "https://github.com/ka364/haderos-mvp",
    website: "https://haderos.ai",
    email: "hello@haderos.ai"
  }
};

export const getBrandStory = () => BRAND_STORY;

export const getNameMeaning = () => BRAND_STORY.nameComponents;

export const getVision2028 = () => BRAND_STORY.vision2028;

export const getTechnicalMetrics = () => BRAND_STORY.technicalExcellence;

export default BRAND_STORY;
