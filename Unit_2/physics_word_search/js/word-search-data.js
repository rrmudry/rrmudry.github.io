/**
 * Physics Word Search Quest - Curriculum Data & Concept Clues
 * Aligned with NGSS HS-PS2-1, HS-PS2-2 & California Science Test (CAST)
 */

const WORD_SEARCH_MISSIONS = [
  {
    id: 'kinematics',
    title: 'Mission 1: Kinematics & 1D Motion',
    subtitle: 'Describing Position, Rate of Motion, Vectors & Projectiles',
    icon: '🚀',
    badge: 'HS-PS2-1',
    description: 'Master the fundamental language of motion, coordinate frames, rates of change, and graphical vectors.',
    gridSize: 14,
    words: [
      {
        word: 'VELOCITY',
        clue: 'The vector rate of displacement over time, specifying both speed and direction of travel (v = Δx / Δt).',
        formula: 'v = Δx / Δt [m/s]',
        category: 'Vector Motion'
      },
      {
        word: 'ACCELERATION',
        clue: 'The rate at which an object changes its velocity with respect to time (a = Δv / Δt).',
        formula: 'a = Δv / Δt [m/s²]',
        category: 'Kinematics'
      },
      {
        word: 'DISPLACEMENT',
        clue: 'The straight-line vector distance and direction from an initial starting position to a final position (Δx = x - x₀).',
        formula: 'Δx = x - x₀ [m]',
        category: 'Vector Motion'
      },
      {
        word: 'SCALAR',
        clue: 'A physical quantity that is completely described by magnitude alone, with no spatial direction (e.g. mass, speed, time).',
        formula: 'Magnitude only',
        category: 'Measurement'
      },
      {
        word: 'VECTOR',
        clue: 'A physical quantity that possesses both a numerical magnitude and an arrow-like spatial direction (e.g. velocity, force).',
        formula: 'Magnitude + Direction',
        category: 'Measurement'
      },
      {
        word: 'FREEFALL',
        clue: 'The motion of a falling body subjected solely to gravitational attraction, accelerating downward at 9.8 m/s².',
        formula: 'a = -g = -9.8 m/s²',
        category: 'Gravity'
      },
      {
        word: 'TRAJECTORY',
        clue: 'The curved, parabolic geometric flight path carved out by a moving projectile influenced by gravity.',
        formula: 'Parabolic Arc',
        category: 'Projectiles'
      },
      {
        word: 'INTERVAL',
        clue: 'The discrete span or difference of elapsed time occurring between two recorded physical timestamps (Δt = t₂ - t₁).',
        formula: 'Δt = t₂ - t₁ [s]',
        category: 'Timing'
      },
      {
        word: 'ORIGIN',
        clue: 'The fixed reference point (0, 0) on a coordinate axis system from which all positions and displacements are measured.',
        formula: 'Reference Point (0, 0)',
        category: 'Coordinates'
      },
      {
        word: 'DECELERATION',
        clue: 'Negative acceleration in the direction of travel; the physical process of reducing forward speed over time.',
        formula: 'a < 0 (Slowing)',
        category: 'Kinematics'
      }
    ]
  },
  {
    id: 'dynamics',
    title: "Mission 2: Newton's Laws & Dynamics",
    subtitle: 'Interactions, Net Forces, Friction & Equilibrium',
    icon: '⚖️',
    badge: 'HS-PS2-1',
    description: "Investigate Newton's three laws of motion, balanced vs. unbalanced forces, friction, and action-reaction pairs.",
    gridSize: 14,
    words: [
      {
        word: 'INERTIA',
        clue: "The intrinsic property of matter to resist any change in its velocity; directly proportional to an object's mass.",
        formula: "Newton's 1st Law",
        category: 'Dynamics'
      },
      {
        word: 'NETFORCE',
        clue: 'The combined vector sum of all external forces acting upon a single body simultaneously, dictating its acceleration.',
        formula: 'F_net = m · a [N]',
        category: "Newton's 2nd Law"
      },
      {
        word: 'FRICTION',
        clue: 'A contact resistance force acting parallel to surfaces that opposes the relative sliding or rolling of objects.',
        formula: 'F_f = μ · F_N [N]',
        category: 'Contact Forces'
      },
      {
        word: 'NORMAL',
        clue: 'The perpendicular contact support force exerted by a solid surface to balance pressing loads (F_N).',
        formula: 'F_N ⊥ Surface [N]',
        category: 'Support Forces'
      },
      {
        word: 'ACTION',
        clue: "The initial interaction force exerted by object A upon object B, paired with an equal and opposite partner force.",
        formula: "F_A_on_B",
        category: "Newton's 3rd Law"
      },
      {
        word: 'REACTION',
        clue: "The simultaneous, equal-magnitude, and opposite-direction force returned by object B onto object A.",
        formula: "F_B_on_A = -F_A_on_B",
        category: "Newton's 3rd Law"
      },
      {
        word: 'EQUILIBRIUM',
        clue: 'The physical state in which the net external force on a system is zero, maintaining zero acceleration (steady speed or rest).',
        formula: 'ΣF = 0, a = 0',
        category: 'Statics & Dynamics'
      },
      {
        word: 'TERMINAL',
        clue: 'The constant maximum speed attained by a falling body when aerodynamic drag equals the gravitational downward weight.',
        formula: 'F_drag = F_g, v = constant',
        category: 'Fluid Drag'
      },
      {
        word: 'AIRRESISTANCE',
        clue: 'Fluid drag force that opposes the motion of a vehicle or object traveling through atmospheric gases.',
        formula: 'F_drag ∝ v² [N]',
        category: 'Aerodynamics'
      },
      {
        word: 'TENSION',
        clue: 'The axial pulling force transmitted continuously along the length of a taut string, rope, wire, or cable.',
        formula: 'F_T along Axis [N]',
        category: 'Forces'
      }
    ]
  },
  {
    id: 'aerospace',
    title: 'Mission 3: Aerospace, Momentum & Safety',
    subtitle: 'Rocket Telemetry, Impact Impulse & Vehicle Safety Design',
    icon: '🛡️',
    badge: 'HS-PS2-2',
    description: 'Explore the physics of rocketry flight telemetry, impact impulse mitigation, crumple zones, and automotive safety.',
    gridSize: 14,
    words: [
      {
        word: 'MOMENTUM',
        clue: "Quantity of motion possessed by a moving object; calculated as the vector product of mass and velocity (p = m·v).",
        formula: 'p = m · v [kg·m/s]',
        category: 'Conservation'
      },
      {
        word: 'IMPULSE',
        clue: 'The product of average net impact force and contact duration, producing a change in momentum (J = F_avg · Δt = Δp).',
        formula: 'F_avg · Δt = m · Δv',
        category: 'Impact Mechanics'
      },
      {
        word: 'APOGEE',
        clue: 'The highest altitude point of maximum vertical flight reached by a rocket before descending toward Earth.',
        formula: 'v_y = 0 at Max Height',
        category: 'Rocket Telemetry'
      },
      {
        word: 'AERODYNAMICS',
        clue: 'The branch of physics studying how atmospheric airflow interacts with solid objects like rocket fuselages and cars.',
        formula: 'Fluid Flow & Drag',
        category: 'Aerospace'
      },
      {
        word: 'BALLAST',
        clue: 'Dense weight placed in the nose of a rocket or bow of a vehicle to intentionally move the Center of Mass forward.',
        formula: 'Shifts Center of Mass',
        category: 'Vehicle Design'
      },
      {
        word: 'CRUMPLE',
        clue: 'A sacrificial structural zone in a vehicle designed to deform during collisions, extending impact duration and reducing force.',
        formula: 'Increases Δt -> Reduces F',
        category: 'Crash Safety'
      },
      {
        word: 'STABILITY',
        clue: 'The passive aerodynamic tendency of a rocket to self-correct its flight angle, requiring Center of Pressure behind Center of Mass.',
        formula: 'CP Behind CM',
        category: 'Rocketry'
      },
      {
        word: 'PRESSURE',
        clue: 'The amount of perpendicular force distributed per unit surface area, measured in Pascals or PSI (P = F / A).',
        formula: 'P = F / A [Pa, PSI]',
        category: 'Fluids & Pneumatics'
      },
      {
        word: 'RESTORING',
        clue: 'Aerodynamic torque produced by stabilizing fins that turns a deflected rocket back toward its forward flight path.',
        formula: 'Torque = F_fin · lever arm',
        category: 'Aerodynamics'
      },
      {
        word: 'TOLERANCE',
        clue: 'The acceptable engineering margin of physical variation in dimension or mass when fabricating precision flight prototypes.',
        formula: 'Acceptable Deviation ±Δ',
        category: 'Engineering'
      }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WORD_SEARCH_MISSIONS };
}
