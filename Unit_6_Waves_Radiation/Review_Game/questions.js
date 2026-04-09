// Unit 6 Rapid-Fire Review Game - Question Bank
// Covering: Mechanical Waves, Electromagnetic Waves, Interference, Boundary Behaviors, EM Spectrum, Duality, Digital Tech

const questionBank = [
    // --- Wave Basics ---
    {
        en: "What do waves transfer from one place to another?",
        es: "¿Qué transfieren las ondas de un lugar a otro?",
        choices: ["Energy", "Matter", "Both Energy and Matter", "Empty Space"],
        correct: 0
    },
    {
        en: "What type of wave requires a physical medium to travel?",
        es: "¿Qué tipo de onda requiere un medio físico para viajar?",
        choices: ["Mechanical wave", "Electromagnetic wave", "Photon", "Light wave"],
        correct: 0
    },
    {
        en: "In a Transverse wave, particle motion is ______ to wave direction.",
        es: "En una Transverse wave, el movimiento de las partículas es ______ a la dirección de la onda.",
        choices: ["Perpendicular", "Parallel", "Circular", "Stationary"],
        correct: 0
    },
    {
        en: "In a Longitudinal wave, particle motion is ______ to wave direction.",
        es: "En una Longitudinal wave, el movimiento de las partículas es ______ a la dirección de la onda.",
        choices: ["Parallel", "Perpendicular", "Circular", "Zero"],
        correct: 0
    },
    {
        en: "A sound wave is classified as a:",
        es: "Una onda de sonido se clasifica como:",
        choices: ["Longitudinal mechanical wave", "Transverse electromagnetic wave", "Pulse wave", "Light wave"],
        correct: 0
    },
    
    // --- Properties & Math ---
    {
        en: "What is the peak, or highest point, of a Transverse wave called?",
        es: "¿Cómo se llama el punto más alto de una Transverse wave?",
        choices: ["Crest", "Trough", "Compression", "Amplitude"],
        correct: 0
    },
    {
        en: "What is the lowest point of a Transverse wave called?",
        es: "¿Cómo se llama el punto más bajo de una Transverse wave?",
        choices: ["Trough", "Crest", "Rarefaction", "Frequency"],
        correct: 0
    },
    {
        en: "Amplitude is a direct measure of a wave's:",
        es: "La Amplitude es una medida directa de la ______ de una onda:",
        choices: ["Energy", "Speed", "Wavelength", "Direction"],
        correct: 0
    },
    {
        en: "The time it takes for ONE complete cycle to pass is the:",
        es: "El tiempo que tarda en pasar UN ciclo completo es el:",
        choices: ["Period", "Frequency", "Wavelength", "Velocity"],
        correct: 0
    },
    {
        en: "The number of cycles that pass per second is the:",
        es: "El número de ciclos que pasan por segundo es la:",
        choices: ["Frequency", "Period", "Amplitude", "Wavelength"],
        correct: 0
    },
    {
        en: "Period and Frequency have an ______ relationship.",
        es: "Period y Frequency tienen una relación ______.",
        choices: ["Inverse", "Direct", "Linear", "Equal"],
        correct: 0
    },
    {
        en: "If a wave's Frequency is 4 Hz, what is its Period?",
        es: "Si la Frequency de una onda es de 4 Hz, ¿cuál es su Period?",
        choices: ["0.25 s", "4.0 s", "1.0 s", "0.5 s"],
        correct: 0
    },
    {
        en: "If a wave is traveling at 10 m/s with a Wavelength of 2 m, what is the Frequency?",
        es: "Si una onda viaja a 10 m/s con una Wavelength de 2 m, ¿cuál es su Frequency?",
        choices: ["5 Hz", "20 Hz", "0.2 Hz", "12 Hz"],
        correct: 0
    },
    {
        en: "Assuming constant speed, if Wavelength increases, Frequency must:",
        es: "Asumiendo una velocidad constante, si la Wavelength aumenta, la Frequency debe:",
        choices: ["Decrease", "Increase", "Remain equal", "Double"],
        correct: 0
    },

    // --- Boundary Behaviors ---
    {
        en: "When a wave bounces off a hard boundary, it is called:",
        es: "Cuando una onda choca contra un límite y rebota, se llama:",
        choices: ["Reflection", "Refraction", "Diffraction", "Absorption"],
        correct: 0
    },
    {
        en: "When a wave bends as it enters a new medium, changing speed, it is:",
        es: "Cuando una onda se dobla al entrar en un nuevo medio, cambiando su velocidad, es:",
        choices: ["Refraction", "Reflection", "Diffraction", "Interference"],
        correct: 0
    },
    {
        en: "When a wave bends around an obstacle or through an opening, it is:",
        es: "Cuando una onda se dobla alrededor de un obstáculo o a través de una abertura, es:",
        choices: ["Diffraction", "Refraction", "Absorption", "Reflection"],
        correct: 0
    },
    {
        en: "When wave energy is taken in by a material and converted to heat, it is:",
        es: "Cuando la energía de la onda es tomada por un material y convertida en calor, es:",
        choices: ["Absorption", "Diffraction", "Refraction", "Reflection"],
        correct: 0
    },

    // --- Interference & Superposition ---
    {
        en: "What phenomenon occurs when two waves occupy the same space?",
        es: "¿Qué fenómeno ocurre cuando dos ondas ocupan el mismo espacio al mismo tiempo?",
        choices: ["Interference", "Refraction", "Diffraction", "Absorption"],
        correct: 0
    },
    {
        en: "When two crests meet and add together to make a larger wave, it is:",
        es: "Cuando dos crestas se encuentran y se suman para hacer una gran onda, es:",
        choices: ["Constructive Interference", "Destructive Interference", "Refraction", "Standing Wave"],
        correct: 0
    },
    {
        en: "When a crest and a trough meet and cancel each other out, it is:",
        es: "Cuando una cresta y un valle se encuentran y se cancelan entre sí, es:",
        choices: ["Destructive Interference", "Constructive Interference", "Reflection", "Resonance"],
        correct: 0
    },
    {
        en: "Two sound waves of slightly different frequencies will alternate loud and soft to create:",
        es: "Dos ondas de sonido con frecuencias ligeramente diferentes se alternarán para crear:",
        choices: ["Beats", "Refraction", "Photons", "X-Rays"],
        correct: 0
    },

    // --- Standing Waves & Resonance ---
    {
        en: "A wave that appears to stay in one place, caused by interference of reflected waves, is a:",
        es: "Una onda que parece quedarse en un lugar, causada por la interferencia de ondas reflejadas, es una:",
        choices: ["Standing Wave", "Pulse Wave", "Electromagnetic Wave", "Light Wave"],
        correct: 0
    },
    {
        en: "The points of zero movement on a Standing Wave are called:",
        es: "Los puntos de movimiento cero en una Standing Wave se llaman:",
        choices: ["Nodes", "Antinodes", "Crests", "Troughs"],
        correct: 0
    },
    {
        en: "When an object is forced to vibrate at its natural frequency, multiplying amplitude, it is:",
        es: "Cuando un objeto se ve obligado a vibrar a su frecuencia natural, multiplicando la amplitud, es:",
        choices: ["Resonance", "Diffraction", "Refraction", "Duality"],
        correct: 0
    },

    // --- Electromagnetic Waves ---
    {
        en: "Which type of wave does NOT need a physical medium?",
        es: "¿Qué tipo de onda NO necesita un medio físico?",
        choices: ["Electromagnetic Wave", "Mechanical Wave", "Sound Wave", "Water Wave"],
        correct: 0
    },
    {
        en: "At what speed do all Electromagnetic Waves travel in a vacuum?",
        es: "¿A qué velocidad viajan todas las Electromagnetic Waves en el vacío?",
        choices: ["Speed of light (c)", "Speed of sound", "100 m/s", "Instantaneously"],
        correct: 0
    },
    {
        en: "Which of the following has the LOWEST frequency on the EM spectrum?",
        es: "¿Cuál de los siguientes tiene la Frequency más BAJA en el espectro electromagnético?",
        choices: ["Radio Waves", "Visible Light", "X-Rays", "Gamma Rays"],
        correct: 0
    },
    {
        en: "Which of the following has the HIGHEST energy on the EM spectrum?",
        es: "¿Cuál de los siguientes tiene la ENERGÍA más ALTA en el espectro electromagnético?",
        choices: ["Gamma Rays", "Microwaves", "Infrared", "Ultraviolet"],
        correct: 0
    },
    {
        en: "True or False: Red light has a longer Wavelength than Blue light.",
        es: "Verdadero o Falso: La luz roja tiene una Wavelength más larga que la luz azul.",
        choices: ["True", "False"],
        correct: 0
    },
    
    // --- Radiation & Dangers ---
    {
        en: "Radiation strong enough to knock electrons off atoms and damage DNA is called:",
        es: "La radiación lo suficientemente fuerte como para arrancar electrones de los átomos y dañar el ADN se llama:",
        choices: ["Ionizing Radiation", "Non-Ionizing Radiation", "Thermal Radiation", "Radioactive decay"],
        correct: 0
    },
    {
        en: "Which type of wave is considered Ionizing?",
        es: "¿Qué tipo de onda se considera Ionizing?",
        choices: ["X-Rays", "Radio Waves", "Microwaves", "Visible Light"],
        correct: 0
    },
    {
        en: "Why are cell phones considered safe from causing genetic DNA damage?",
        es: "¿Por qué se considera que los teléfonos celulares son seguros y no causan daño genético al ADN?",
        choices: ["Microwaves are non-ionizing", "They use mechanical waves", "They are shielded with lead", "They use destructive interference"],
        correct: 0
    },

    // --- Duality & Particles ---
    {
        en: "The Double-Slit experiment proved that light behaves as a:",
        es: "El experimento de la doble rendija demostró que la luz se comporta como una:",
        choices: ["Wave", "Particle", "Liquid", "Magnetic monopole"],
        correct: 0
    },
    {
        en: "The Photoelectric effect proved that light acts as discrete packets called:",
        es: "El efecto fotoeléctrico demostró que la luz actúa como paquetes individuales llamados:",
        choices: ["Photons", "Electrons", "Protons", "Neutrinos"],
        correct: 0
    },
    {
        en: "Light acting as both a continuous wave and a discrete particle is called:",
        es: "La luz actuando tanto como una onda continua como una partícula individual se llama:",
        choices: ["Wave-Particle Duality", "Electromagnetism", "Superposition", "Resonance"],
        correct: 0
    },
    {
        en: "In the Photoelectric effect, what determines if an electron is ejected from the metal?",
        es: "En el efecto fotoeléctrico, ¿qué determina si un electrón es expulsado del metal?",
        choices: ["Frequency (Color)", "Amplitude (Brightness)", "Time exposed", "Distance from source"],
        correct: 0
    },

    // --- Tech & Signals ---
    {
        en: "A continuous, smoothly varying signal is known as:",
        es: "Una señal continua que varía suavemente se conoce como:",
        choices: ["Analog", "Digital", "Mechanical", "Binary"],
        correct: 0
    },
    {
        en: "A signal composed of discrete 1s and 0s is known as:",
        es: "Una señal compuesta por 1s y 0s discretos se conoce como:",
        choices: ["Digital", "Analog", "Continuous", "Waveform"],
        correct: 0
    },
    {
        en: "Why is Digital transmission generally better than Analog across long distances?",
        es: "¿Por qué la transmisión Digital es generalmente mejor que la Analog a largas distancias?",
        choices: ["It is immune to signal noise/degradation", "It travels faster than light", "It requires a physical medium", "It uses higher amplitude"],
        correct: 0
    },
    {
        en: "Optical fibers transmit data by using the principle of total internal ______.",
        es: "Las fibras ópticas transmiten datos utilizando el principio de ______ interna total.",
        choices: ["Reflection", "Refraction", "Diffraction", "Absorption"],
        correct: 0
    }
];

// Verify we have at least 40 questions
if (questionBank.length < 40) {
    console.warn(`Only ${questionBank.length} questions in bank. Need >= 40.`);
}
