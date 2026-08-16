import { DropObjectConfig, PlanetLocation, AtmosphereMode, GuidedChallenge } from './types';

// Pre-configured realistic physical objects
export const OBJECT_PRESETS: DropObjectConfig[] = [
  {
    id: 'bowling-ball',
    name: 'Bowling Ball',
    icon: '🎳',
    mass: 5.0,            // 5 kg (approx 11 lbs)
    radius: 0.108,        // 10.8 cm radius
    dragCoefficient: 0.47,// smooth sphere
    color: '#f97316',     // orange
    accentBg: 'rgba(249, 115, 22, 0.15)'
  },
  {
    id: 'feather',
    name: 'Feather',
    icon: '🪶',
    mass: 0.005,          // 5 grams
    radius: 0.06,         // 6 cm effective spread
    dragCoefficient: 1.2, // flat/irregular high drag
    color: '#38bdf8',     // sky blue
    accentBg: 'rgba(56, 189, 248, 0.15)'
  },
  {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    mass: 0.62,           // 620 grams
    radius: 0.12,         // 12 cm radius
    dragCoefficient: 0.47,// sphere
    color: '#ea580c',
    accentBg: 'rgba(234, 88, 12, 0.15)'
  },
  {
    id: 'baseball',
    name: 'Baseball',
    icon: '⚾',
    mass: 0.145,          // 145 grams
    radius: 0.037,        // 3.7 cm radius
    dragCoefficient: 0.35,// stitched sphere
    color: '#fbbf24',
    accentBg: 'rgba(251, 191, 36, 0.15)'
  },
  {
    id: 'coffee-filter',
    name: 'Coffee Filter',
    icon: '☕',
    mass: 0.001,          // 1 gram
    radius: 0.09,         // 9 cm open bowl
    dragCoefficient: 1.5, // parachute shape
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.15)'
  },
  {
    id: 'lead-sphere',
    name: 'Lead Sphere',
    icon: '⚖️',
    mass: 10.0,           // 10 kg dense lead
    radius: 0.06,         // 6 cm compact radius
    dragCoefficient: 0.47,// smooth sphere
    color: '#94a3b8',
    accentBg: 'rgba(148, 163, 184, 0.15)'
  },
  {
    id: 'ping-pong',
    name: 'Ping Pong Ball',
    icon: '🏓',
    mass: 0.0027,         // 2.7 grams
    radius: 0.02,         // 2 cm radius
    dragCoefficient: 0.47,// smooth sphere
    color: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.15)'
  },
  {
    id: 'skydiver-freefall',
    name: 'Skydiver (Freefall / No Chute)',
    icon: '🧍',
    mass: 75.0,           // 75 kg human
    radius: 0.45,         // ~0.64 m^2 belly-to-earth cross-section
    dragCoefficient: 1.0, // spread-eagle human (terminal vel ~44 m/s / 100 mph)
    color: '#ec4899',
    accentBg: 'rgba(236, 72, 153, 0.15)'
  },
  {
    id: 'skydiver-chute',
    name: 'Skydiver (Open Parachute)',
    icon: '🪂',
    mass: 85.0,           // 75 kg human + 10 kg parachute rig
    radius: 2.2,          // ~15 m^2 open parachute canopy
    dragCoefficient: 1.5, // open parachute (terminal vel ~6 m/s / 13 mph)
    color: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.15)'
  },
  {
    id: 'custom',
    name: 'Custom Object',
    icon: '⚙️',
    mass: 1.0,
    radius: 0.1,
    dragCoefficient: 0.47,
    color: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.15)'
  }
];

// Planetary Gravitational Accelerations (in m/s^2)
export const PLANET_PRESETS: Record<PlanetLocation, { name: string; gravity: number; icon: string; defaultAirDensity: number }> = {
  earth: {
    name: 'Earth',
    gravity: 10.0,
    icon: '🌍',
    defaultAirDensity: 1.225
  },
  moon: {
    name: 'Moon',
    gravity: 1.6,
    icon: '🌙',
    defaultAirDensity: 0
  },
  mars: {
    name: 'Mars',
    gravity: 3.7,
    icon: '🪐',
    defaultAirDensity: 0.020
  },
  jupiter: {
    name: 'Jupiter',
    gravity: 24.8,
    icon: '⭐',
    defaultAirDensity: 1.3
  },
  custom: {
    name: 'Custom World',
    gravity: 10.0,
    icon: '🛸',
    defaultAirDensity: 1.225
  }
};

// Atmosphere Density Presets (in kg/m^3)
export const ATMOSPHERE_PRESETS: Record<AtmosphereMode, { name: string; density: number; badge: string; description: string }> = {
  'vacuum': {
    name: 'Vacuum Chamber',
    density: 0.0,
    badge: 'Zero Drag (Air = 0)',
    description: 'Complete vacuum. No atmospheric drag acts on either object.'
  },
  'earth-sea-level': {
    name: 'Earth Atmosphere (Sea Level)',
    density: 1.225,
    badge: '1.225 kg/m³',
    description: 'Standard atmospheric pressure at 15°C sea level.'
  },
  'high-altitude': {
    name: 'High Altitude (10,000 m)',
    density: 0.4135,
    badge: '0.414 kg/m³',
    description: 'Thinner air corresponding to commercial jet flight altitude.'
  },
  'custom': {
    name: 'Custom Density',
    density: 1.225,
    badge: 'Custom',
    description: 'User-specified fluid or atmospheric medium density.'
  }
};

// Guided Inquiry & Misconception Challenges
export const GUIDED_CHALLENGES: GuidedChallenge[] = [
  {
    id: 'galileo-vacuum',
    title: 'The Galileo Vacuum Test',
    subtitle: 'Bowling Ball vs. Feather in a Vacuum',
    description: 'Drop a 5 kg Bowling Ball and a 0.005 kg Feather inside a complete vacuum (Zero Drag). Does the 1,000x heavier bowling ball hit the ground first?',
    obj1PresetId: 'bowling-ball',
    obj2PresetId: 'feather',
    height: 100,
    atmosphereMode: 'vacuum',
    planet: 'earth',
    keyQuestion: 'Why do both objects hit the ground at the exact same millisecond despite having drastically different masses?',
    explanation: 'Although gravity exerts 1,000x more force on the bowling ball, the bowling ball also has 1,000x more mass resisting acceleration (a = F / m = mg / m = g). The extra force and extra inertia cancel out perfectly!'
  },
  {
    id: 'air-resistance-reveal',
    title: 'The Air Resistance Reality',
    subtitle: 'Bowling Ball vs. Feather in Atmosphere',
    description: 'Now turn on Earth Atmosphere (1.225 kg/m³). Drop the same Bowling Ball and Feather from 100m. What happens when air drag opposes gravity?',
    obj1PresetId: 'bowling-ball',
    obj2PresetId: 'feather',
    height: 100,
    atmosphereMode: 'earth-sea-level',
    planet: 'earth',
    keyQuestion: 'Why does the feather quickly slow down to a crawl while the bowling ball continues accelerating?',
    explanation: 'The light feather has a huge surface area relative to its tiny mass, so its drag force quickly equals its tiny weight (Fdrag = Fg), reaching a slow terminal velocity of ~1.5 m/s. The heavy bowling ball needs much more speed to build enough drag to balance its 49 N weight!'
  },
  {
    id: 'mass-only-comparison',
    title: 'Same Size, Different Mass',
    subtitle: 'Lead Sphere vs. Basketball in Air',
    description: 'Compare a 10 kg Lead Sphere with a 0.62 kg Basketball in standard air. Both are large spheres. How does mass affect terminal velocity when size is similar?',
    obj1PresetId: 'lead-sphere',
    obj2PresetId: 'basketball',
    height: 100,
    atmosphereMode: 'earth-sea-level',
    planet: 'earth',
    keyQuestion: 'Why does the heavier lead sphere pull ahead even though both face aerodynamic air resistance?',
    explanation: 'Terminal velocity formula is vt = sqrt(2mg / (rho * A * Cd)). Because mass (m) is in the numerator, heavier objects require a higher speed to generate enough drag to equal their greater weight.'
  },
  {
    id: 'surface-area-drag',
    title: 'Surface Area & Shape Effect',
    subtitle: 'Baseball vs. Coffee Filter (Equal Fall Race)',
    description: 'Drop a dense baseball vs an ultra-light, wide coffee filter. Observe the live force vector arrows as the coffee filter hits terminal velocity within 0.5 seconds.',
    obj1PresetId: 'baseball',
    obj2PresetId: 'coffee-filter',
    height: 50,
    atmosphereMode: 'earth-sea-level',
    planet: 'earth',
    keyQuestion: 'When an object reaches terminal velocity, what is its net force and acceleration?',
    explanation: 'At terminal velocity, upward air resistance equals downward gravity (Fdrag = Fg). Net force is exactly ZERO, meaning acceleration is ZERO and velocity remains perfectly constant!'
  }
];
