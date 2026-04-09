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

    // --- Electromagnetic Waves (To Be Covered Later) ---
    /*
    {
        en: "Which type of wave does NOT need a physical medium?",
        es: "¿Qué tipo de onda NO necesita un medio físico?",
        choices: ["Electromagnetic Wave", "Mechanical Wave", "Sound Wave", "Water Wave"],
        correct: 0
    },
    ... (Advanced topics commented out for now) ...
    */
    
    // --- Visual Comparisons (Procedural Canvas) ---
    {
        en: "Analyze the diagram. Which wave has the greater Amplitude?",
        es: "Analiza el diagrama. ¿Qué onda tiene mayor Amplitude?",
        choices: ["Wave A", "Wave B", "They are equal", "Cannot be determined"],
        correct: 0,
        drawType: "transverse_amp" // Wave A high amp, B low amp
    },
    {
        en: "Analyze the diagram. Which wave has the greater Wavelength?",
        es: "Analiza el diagrama. ¿Qué onda tiene mayor Wavelength?",
        choices: ["Wave A", "Wave B", "They are equal", "Cannot be determined"],
        correct: 1,
        drawType: "transverse_wavelength" // Wave A short, B long
    },
    {
        en: "Analyze the diagram. Which wave has the higher Frequency?",
        es: "Analiza el diagrama. ¿Qué onda tiene mayor Frequency?",
        choices: ["Wave A", "Wave B", "They are equal", "Cannot be determined"],
        correct: 0,
        drawType: "transverse_wavelength" // A has short wavelength -> higher freq
    },
    {
        en: "Identify the type of wave shown.",
        es: "Identifica el tipo de onda que se muestra.",
        choices: ["Transverse Wave", "Longitudinal Wave", "Electromagnetic Wave", "Photon"],
        correct: 0,
        drawType: "transverse_single"
    },
    {
        en: "Identify the type of wave shown (representing sound compressions).",
        es: "Identifica el tipo de onda que se muestra (representando compresiones sonoras).",
        choices: ["Longitudinal Wave", "Transverse Wave", "Water Wave", "Electromagnetic Wave"],
        correct: 0,
        drawType: "longitudinal_single"
    },
    {
        en: "In the diagram, the areas where the lines are bunched together represent:",
        es: "En el diagrama, las áreas donde las líneas están agrupadas representan:",
        choices: ["Compressions", "Rarefactions", "Crests", "Troughs"],
        correct: 0,
        drawType: "longitudinal_single"
    },
    {
        en: "In the diagram, the areas where the lines are spread far apart represent:",
        es: "En el diagrama, las áreas donde las líneas están muy separadas representan:",
        choices: ["Rarefactions", "Compressions", "Nodes", "Antinodes"],
        correct: 0,
        drawType: "longitudinal_single"
    }
];

// Verify we have at least 40 questions
if (questionBank.length < 40) {
    console.warn(`Only ${questionBank.length} questions in bank. Need >= 40.`);
}
