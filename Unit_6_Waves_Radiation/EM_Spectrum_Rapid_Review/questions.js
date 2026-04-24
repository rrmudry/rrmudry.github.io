// EM Spectrum Rapid-Fire Review Game - Question Bank
// Covering: Sequencing, Ionizing vs Non-Ionizing, Applications, and Hazards

const questionBank = [
    // --- Sequencing / Ordering (Subset Interactive Type) ---
    {
        type: "order",
        en: "Order these 3 from LOWEST to HIGHEST energy:",
        es: "Ordena estos 3 de MENOR a MAYOR energía:",
        items: ["Radio", "Microwaves", "Infrared", "Visible", "Ultraviolet", "X-Ray", "Gamma"],
        correctOrder: ["Radio", "Microwaves", "Infrared", "Visible", "Ultraviolet", "X-Ray", "Gamma"]
    },
    {
        type: "order",
        en: "Order these 3 from LONGEST to SHORTEST wavelength:",
        es: "Ordena estos 3 de la longitud de onda más LARGA a la más CORTA:",
        items: ["Radio", "Microwaves", "Infrared", "Visible", "Ultraviolet", "X-Ray", "Gamma"],
        correctOrder: ["Radio", "Microwaves", "Infrared", "Visible", "Ultraviolet", "X-Ray", "Gamma"]
    },
    {
        type: "order",
        en: "Order these 3 from HIGHEST to LOWEST frequency:",
        es: "Ordena estos 3 de la frecuencia más ALTA a la más BAJA:",
        items: ["Radio", "Microwaves", "Infrared", "Visible", "Ultraviolet", "X-Ray", "Gamma"],
        correctOrder: ["Gamma", "X-Ray", "Ultraviolet", "Visible", "Infrared", "Microwaves", "Radio"]
    },

    // --- Visual Sequencing (Missing Link Type) ---
    {
        type: "missing_link",
        en: "As wavelength INCREASES, fill in the next wave:",
        es: "A medida que AUMENTA la longitud de onda, completa la siguiente onda:",
        sequence: ["Visible Light", null],
        correct: "Infrared",
        choices: ["Ultraviolet", "Infrared", "X-Rays", "Gamma Rays"]
    },
    {
        type: "missing_link",
        en: "As energy INCREASES, fill in the next wave:",
        es: "A medida que AUMENTA la energía, completa la siguiente onda:",
        sequence: ["Visible Light", null],
        correct: "Ultraviolet",
        choices: ["Infrared", "Ultraviolet", "Microwaves", "Radio Waves"]
    },
    {
        type: "missing_link",
        en: "Identify the missing wave in this sequence:",
        es: "Identifica la onda que falta en esta secuencia:",
        sequence: ["Microwaves", null, "Visible Light"],
        correct: "Infrared",
        choices: ["Infrared", "Ultraviolet", "Radio Waves", "X-Rays"]
    },
    {
        type: "missing_link",
        en: "Identify the missing wave in this sequence:",
        es: "Identifica la onda que falta en esta secuencia:",
        sequence: ["Ultraviolet", null, "Gamma Rays"],
        correct: "X-Rays",
        choices: ["X-Rays", "Visible Light", "Infrared", "Microwaves"]
    },
    {
        type: "missing_link",
        en: "Identify the missing wave in this sequence:",
        es: "Identifica la onda que falta en esta secuencia:",
        sequence: ["Radio", null, "Infrared"],
        correct: "Microwaves",
        choices: ["Microwaves", "Visible Light", "Ultraviolet", "X-Rays"]
    },
    {
        type: "missing_link",
        en: "As frequency INCREASES, fill in the next wave:",
        es: "A medida que AUMENTA la frecuencia, completa la siguiente onda:",
        sequence: ["Radio", null],
        correct: "Microwaves",
        choices: ["Microwaves", "Gamma Rays", "Visible Light", "Infrared"]
    },
    {
        type: "missing_link",
        en: "As energy INCREASES, fill in the next wave:",
        es: "A medida que AUMENTA la energía, completa la siguiente onda:",
        sequence: ["X-Ray", null],
        correct: "Gamma Rays",
        choices: ["Gamma Rays", "Visible Light", "Radio", "Microwaves"]
    },

    // --- Ionizing vs Non-Ionizing (Multiple Choice) ---
    {
        en: "What is the primary difference between ionizing and non-ionizing radiation?",
        es: "¿Cuál es la principal diferencia entre la radiación ionizante y la no ionizante?",
        choices: [
            "Ionizing radiation has enough energy to remove electrons from atoms.",
            "Non-ionizing radiation is faster than ionizing radiation.",
            "Ionizing radiation only comes from the sun.",
            "There is no real difference."
        ],
        correct: 0
    },
    {
        en: "Which of these is the FIRST type of ionizing radiation on the spectrum?",
        es: "¿Cuál de estos es el PRIMER tipo de radiación ionizante en el espectro?",
        choices: ["Ultraviolet (UV)", "Visible Light", "Infrared", "Microwaves"],
        correct: 0
    },
    {
        en: "Which group of waves is entirely NON-IONIZING?",
        es: "¿Qué grupo de ondas es completamente NO IONIZANTE?",
        choices: [
            "Radio, Microwaves, Infrared",
            "Ultraviolet, X-Rays, Gamma Rays",
            "X-Rays, Visible Light, Radio",
            "Gamma Rays, Infrared, Microwaves"
        ],
        correct: 0
    },
    {
        en: "Ionizing radiation is dangerous because it can damage ______.",
        es: "La radiación ionizante es peligrosa porque puede dañar ______.",
        choices: ["Cellular DNA", "Clothing", "Radio signals", "Mirror glass"],
        correct: 0
    },

    // --- Zone 1: Radio ---
    {
        en: "Which EM wave has the lowest energy and longest wavelength?",
        es: "¿Qué onda EM tiene la energía más baja y la longitud de onda más larga?",
        choices: ["Radio Waves", "Gamma Rays", "Visible Light", "Ultraviolet"],
        correct: 0
    },
    {
        en: "Radio waves are used primarily for:",
        es: "Las ondas de radio se utilizan principalmente para:",
        choices: ["Broadcasting and communication", "Heating food", "Medical imaging", "Sterilizing equipment"],
        correct: 0
    },
    {
        en: "What is the hazard level of Radio Waves?",
        es: "¿Cuál es el nivel de peligro de las ondas de radio?",
        choices: ["Zero (Non-Ionizing)", "Medium", "High", "Extreme"],
        correct: 0
    },

    // --- Zone 2: Microwaves ---
    {
        en: "Which wave is used for both cell phone signals and heating water molecules?",
        es: "¿Qué onda se usa tanto para señales de celular como para calentar moléculas de agua?",
        choices: ["Microwaves", "Infrared", "Radio Waves", "X-Rays"],
        correct: 0
    },
    {
        en: "Microwaves have ______ frequency than Radio waves.",
        es: "Las microondas tienen una frecuencia ______ que las ondas de Radio.",
        choices: ["Higher", "Lower", "The same", "Zero"],
        correct: 0
    },

    // --- Zone 3: Infrared ---
    {
        en: "We experience Infrared radiation primarily as:",
        es: "Experimentamos la radiación infrarroja principalmente como:",
        choices: ["Heat", "Visible colors", "Sound", "Sunburns"],
        correct: 0
    },
    {
        en: "Which technology uses Infrared radiation?",
        es: "¿Qué tecnología utiliza radiación infrarroja?",
        choices: ["Night-vision goggles", "X-ray machines", "FM Radio", "Nuclear power"],
        correct: 0
    },

    // --- Zone 4: Visible Light ---
    {
        en: "The only part of the EM spectrum humans can see is:",
        es: "La única parte del espectro EM que los humanos pueden ver es:",
        choices: ["Visible Light", "Ultraviolet", "Infrared", "Radio Waves"],
        correct: 0
    },
    {
        en: "What happens when visible light hits a mirror?",
        es: "¿Qué sucede cuando la luz visible golpea un espejo?",
        choices: ["Reflection", "Absorption", "Diffraction", "Refraction"],
        correct: 0
    },
    {
        en: "In the acronym ROYGBIV, what does the 'B' stand for?",
        es: "En el acrónimo ROYGBIV, ¿qué representa la 'B'?",
        choices: ["Blue", "Black", "Brown", "Bright"],
        correct: 0
    },

    // --- Zone 5: Ultraviolet ---
    {
        en: "Which type of radiation causes sunburns and can damage DNA?",
        es: "¿Qué tipo de radiación causa quemaduras solares y puede dañar el ADN?",
        choices: ["Ultraviolet (UV)", "Visible Light", "Infrared", "Microwaves"],
        correct: 0
    },
    {
        en: "Which part of the spectrum is used to sterilize medical equipment by killing bacteria?",
        es: "¿Qué parte del espectro se usa para esterilizar equipos médicos matando bacterias?",
        choices: ["Ultraviolet (UV)", "Radio Waves", "Visible Light", "Microwaves"],
        correct: 0
    },

    // --- Zone 6: X-Rays ---
    {
        en: "X-Rays are easily absorbed by ______ but pass through soft tissue.",
        es: "Los rayos X son absorbidos fácilmente por ______ pero pasan a través de los tejidos blandos.",
        choices: ["Dense materials like Bone or Lead", "Water", "Air", "Plastic"],
        correct: 0
    },
    {
        en: "Why do doctors put a lead apron on you during an X-ray?",
        es: "¿Por qué los médicos te ponen un delantal de plomo durante una radiografía?",
        choices: [
            "To shield vital organs from ionizing radiation.",
            "To keep you warm.",
            "To make the image clearer.",
            "To prevent reflection."
        ],
        correct: 0
    },

    // --- Zone 7: Gamma Rays ---
    {
        en: "Which EM wave has the highest energy and shortest wavelength?",
        es: "¿Qué onda EM tiene la energía más alta y la longitud de onda más corta?",
        choices: ["Gamma Rays", "Radio Waves", "Visible Light", "Ultraviolet"],
        correct: 0
    },
    {
        en: "Gamma rays are produced by:",
        es: "Los rayos gamma son producidos por:",
        choices: ["Nuclear reactions and stars", "Radio stations", "Flashlights", "Tanning beds"],
        correct: 0
    },
    {
        en: "Which of these requires the thickest concrete or lead shielding to block?",
        es: "¿Cuál de estos requiere el blindaje de hormigón o plomo más grueso para bloquearlo?",
        choices: ["Gamma Rays", "X-Rays", "Ultraviolet", "Microwaves"],
        correct: 0
    },

    // --- General Physics & Relationships ---
    {
        en: "As frequency increases, what happens to photon energy?",
        es: "A medida que aumenta la frecuencia, ¿qué sucede con la energía de los fotones?",
        choices: ["It increases", "It decreases", "It stays the same", "It disappears"],
        correct: 0
    },
    {
        en: "As wavelength increases, what happens to frequency?",
        es: "A medida que aumenta la longitud de onda, ¿qué sucede con la frecuencia?",
        choices: ["It decreases", "It increases", "It stays the same", "It doubles"],
        correct: 0
    },
    {
        en: "All electromagnetic waves travel at the same ______ in a vacuum.",
        es: "Todas las ondas electromagnéticas viajan a la misma ______ en el vacío.",
        choices: ["Speed (Speed of Light)", "Frequency", "Wavelength", "Energy level"],
        correct: 0
    },
    {
        en: "What is the speed of light approximately?",
        es: "¿Cuál es aproximadamente la velocidad de la luz?",
        choices: ["300,000,000 m/s", "300,000 m/s", "1,000 m/s", "340 m/s"],
        correct: 0
    },
    {
        en: "The distance between two consecutive crests of an EM wave is its:",
        es: "La distancia entre dos crestas consecutivas de una onda EM es su:",
        choices: ["Wavelength", "Frequency", "Amplitude", "Period"],
        correct: 0
    },
    {
        en: "Which wave property determines the 'color' of visible light?",
        es: "¿Qué propiedad de la onda determina el 'color' de la luz visible?",
        choices: ["Frequency or Wavelength", "Amplitude", "Speed", "Polarization"],
        correct: 0
    },
    {
        en: "High frequency EM waves have ______ energy than low frequency waves.",
        es: "Las ondas EM de alta frecuencia tienen ______ energía que las de baja frecuencia.",
        choices: ["More", "Less", "The same", "Zero"],
        correct: 0
    },

    // --- Mix & Match / Critical Thinking ---
    {
        en: "Which of these is NOT an electromagnetic wave?",
        es: "¿Cuál de estos NO es una onda electromagnética?",
        choices: ["Sound Wave", "Light Wave", "X-Ray", "Radio Wave"],
        correct: 0
    },
    {
        en: "Sunlight contains which three parts of the EM spectrum primarily?",
        es: "¿Qué tres partes del espectro EM contiene principalmente la luz solar?",
        choices: [
            "Infrared, Visible, and Ultraviolet",
            "Radio, X-Ray, and Gamma",
            "Microwaves, IR, and Visible",
            "UV, X-Ray, and Gamma"
        ],
        correct: 0
    },
    {
        en: "Which type of wave is used by a remote control to change TV channels?",
        es: "¿Qué tipo de onda utiliza un control remoto para cambiar los canales de televisión?",
        choices: ["Infrared", "Ultraviolet", "X-Ray", "Radio Waves"],
        correct: 0
    },
    {
        en: "Radar technology uses which type of EM wave?",
        es: "¿La tecnología de radar utiliza qué tipo de onda EM?",
        choices: ["Radio or Microwaves", "Gamma Rays", "Visible Light", "Infrared"],
        correct: 0
    },
    {
        en: "Which part of the spectrum is used in 'Heat Lamps' at restaurants?",
        es: "¿Qué parte del espectro se utiliza en las 'lámparas de calor' en los restaurantes?",
        choices: ["Infrared", "Ultraviolet", "X-Ray", "Visible Light"],
        correct: 0
    },
    {
        en: "An EM wave with a very high frequency would have a ______ wavelength.",
        es: "Una onda EM con una frecuencia muy alta tendría una longitud de onda ______.",
        choices: ["Very short", "Very long", "Medium", "Infinite"],
        correct: 0
    },
    {
        en: "The 'Hazard Level: EXTREME' in Spectrum City refers to which zone?",
        es: "El 'Nivel de peligro: EXTREMO' en Spectrum City se refiere a ¿qué zona?",
        choices: ["Gamma Rays", "Radio Waves", "Visible Light", "Microwaves"],
        correct: 0
    }
];
