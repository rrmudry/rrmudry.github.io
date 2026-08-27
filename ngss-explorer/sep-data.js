/**
 * NGSS Science & Engineering Practices (SEPs) Database (Grades 9–12)
 * Comprehensive definitions, grade-band expectations from NGSS Appendix F,
 * key student competencies, physics lab connections, and standard mappings.
 */

const NGSS_SEP_DATA = [
    {
        id: "sep-1",
        number: 1,
        code: "SEP-1",
        name: "Asking Questions and Defining Problems",
        icon: "❓",
        color: "#38bdf8",
        tagline: "Inspiring scientific inquiry and clarifying engineering challenges.",
        summary: "Scientists ask questions to clarify phenomena, challenge existing models, and guide empirical investigations. Engineers define problems with specified criteria, constraints, and societal impacts.",
        essentialQuestion: "What questions need to be answered to explain this phenomenon, or what constraints must our engineered solution satisfy?",
        highSchoolExpectations: [
            "Ask questions that arise from careful observation of phenomena, models, or unexpected results to clarify and/or seek additional information.",
            "Ask questions that clarify relationships, including cause and effect, and determine whether claims are supported by empirical evidence.",
            "Ask questions to determine relationships, including quantitative relationships, between independent and dependent variables.",
            "Ask questions that can be investigated within the scope of a high school laboratory or field setting, considering available resources and safety.",
            "Define a design problem that involves the development of a process or system with interacting components and multiple criteria and constraints."
        ],
        keySkills: [
            "Distinguishing testable scientific questions from non-testable queries",
            "Identifying independent, dependent, and controlled variables",
            "Defining engineering criteria (what makes it successful) and constraints (limits like cost, safety, materials)",
            "Challenging assumptions and probing experimental anomalies"
        ],
        physicsApplications: [
            "Observing an accelerating roller coaster and asking how mass impacts final velocity.",
            "Investigating why an electric current deflected a nearby magnetic compass needle in Oersted's experiment.",
            "Defining the technical constraints and safety criteria for an impact-resistant vehicle crumple zone."
        ],
        keywords: ["question", "problem", "criteria", "constraints", "variables", "inquiry", "investigate", "testable", "sep 1", "sep1"]
    },
    {
        id: "sep-2",
        number: 2,
        code: "SEP-2",
        name: "Developing and Using Models",
        icon: "📐",
        color: "#60a5fa",
        tagline: "Representing unobservable mechanisms, testing systems, and predicting outcomes.",
        summary: "Models in physics (conceptual diagrams, free-body diagrams, mathematical formulas, simulations) represent systems and processes to predict behaviors and test hypothetical conditions.",
        essentialQuestion: "How can we create a visual, mathematical, or computational representation that explains how this system behaves?",
        highSchoolExpectations: [
            "Evaluate merits and limitations of two different models of the same proposed tool, process, or system in order to choose the best fit.",
            "Design a test of a model to ascertain its reliability.",
            "Develop, revise, and/or use a model based on evidence to illustrate and/or predict the relationships between systems or between components of a system.",
            "Use models (including mathematical and computational) to generate data to support explanations, predict phenomena, analyze systems, and solve problems."
        ],
        keySkills: [
            "Drawing and analyzing Free-Body Diagrams (FBDs) with vector arrows representing balanced/unbalanced forces",
            "Constructing ray diagrams for wave optics and field lines for electric/magnetic interactions",
            "Developing energy bar charts (LOL diagrams) to model conservation of mechanical energy",
            "Identifying the boundaries, simplifications, and limitations of physical models (e.g. neglecting air resistance)"
        ],
        physicsApplications: [
            "Free-Body force diagrams modeling normal force, friction, and gravity on an inclined plane.",
            "Field line diagrams representing electrostatic repulsion between like point charges.",
            "Interactive digital simulations modeling planetary gravitational orbits."
        ],
        keywords: ["model", "free-body diagram", "vector", "simulation", "system", "predict", "representation", "sep 2", "sep2"]
    },
    {
        id: "sep-3",
        number: 3,
        code: "SEP-3",
        name: "Planning and Carrying Out Investigations",
        icon: "🧪",
        color: "#818cf8",
        tagline: "Designing fair, controlled experiments to collect reliable empirical evidence.",
        summary: "Students design controlled investigations, manipulate variables, calibrate instruments, and gather systematic evidence to test hypotheses or evaluate engineered prototypes.",
        essentialQuestion: "How can we design a reliable, controlled experiment to produce conclusive evidence about a physical relationship?",
        highSchoolExpectations: [
            "Plan an investigation or test a design individually and collaboratively to produce data to serve as the basis for evidence.",
            "Decide on types, how much, and accuracy of data needed to produce reliable measurements, considering limitations on the precision of the data (e.g., number of trials, cost, risk, time).",
            "Select appropriate tools to collect, record, analyze, and evaluate data with appropriate levels of accuracy and precision.",
            "Plan and conduct an investigation or test a design solution in a safe and ethical manner including considerations of environmental, social, and personal impacts.",
            "Manipulate variables and collect data about a complex model of a proposed process or system to identify failure points or optimize performance."
        ],
        keySkills: [
            "Isolating variables: ensuring only one independent variable is altered while holding all other parameters constant",
            "Instrument calibration: selecting calipers, photogates, force sensors, or stopwatches matched to the required measurement precision",
            "Replication & multi-trial sampling to reduce experimental uncertainty",
            "Lab safety protocols, equipment management, and data integrity recording"
        ],
        physicsApplications: [
            "Using photogates and track gliders to determine the empirical relationship between cart mass and acceleration under a constant hanging force.",
            "Constructing an electromagnet with insulated copper wire, iron cores, and varying battery voltages to test magnetic field strength.",
            "Dropping objects of varying surface areas in vacuum tubes vs. air to isolate gravitational acceleration from aerodynamic drag."
        ],
        keywords: ["investigation", "experiment", "fair test", "trials", "variables", "tools", "calibration", "measurement", "sep 3", "sep3"]
    },
    {
        id: "sep-4",
        number: 4,
        code: "SEP-4",
        name: "Analyzing and Interpreting Data",
        icon: "📊",
        color: "#38bdf8",
        tagline: "Evaluating data quality, analyzing spread, and identifying error sources.",
        summary: "Raw data must be organized, graphed, and evaluated. High school students distinguish between systematic error (accuracy offset) and random error (precision scatter), evaluate measurement uncertainty, and identify patterns that support scientific claims.",
        essentialQuestion: "What does this data tell us, how trustworthy and repeatable are our measurements, and what are the sources of error?",
        highSchoolExpectations: [
            "Analyze data using tools, technologies, and/or models (e.g., computational, mathematical) in order to make valid and reliable scientific claims or determine an optimal design solution.",
            "Evaluate the impact of new data on a working explanation and/or model of a proposed process or system.",
            "Consider limitations of data analysis (e.g., measurement error, precision, accuracy, sample selection) when analyzing and interpreting data.",
            "Compare and contrast various types of data sets (e.g., self-generated, archival) to examine consistency of measurements and observations.",
            "Evaluate data to determine whether an error is systematic (calibration bias, tool offset) or random (measurement jitter, user reaction time)."
        ],
        keySkills: [
            "Accuracy vs. Precision: Distinguishing between proximity to true value (accuracy) vs. clustering/repeatability (precision)",
            "Error Analysis: Identifying systematic errors (zero-offset on scale, parallax error) vs. random errors (stopwatch thumb jitter, thermal noise)",
            "Graphing & Best-Fit Trends: Interpreting slopes, y-intercepts, linearizations, and correlation coefficients (R²)",
            "Uncertainty Propagation: Accounting for instrument precision limits (e.g., ±0.5 mm on a meter stick)",
            "Anomaly Detection: Identifying outliers and determining whether they indicate experimental breakdown or novel phenomena"
        ],
        physicsApplications: [
            "Emoji Finger Painting Studio: Graphing and classifying 4-quadrant measurement states (Accurate & Precise, Accurate NOT Precise, Precise NOT Accurate, Neither).",
            "Linearizing position vs. time² graphs for a rolling cart to extract experimental gravitational acceleration (g).",
            "Determining percent error and calculating experimental standard deviation across 10 trials of a pendulum period."
        ],
        keywords: ["data", "accuracy", "precision", "error", "systematic", "random", "uncertainty", "graph", "slope", "scatter", "sep 4", "sep4"]
    },
    {
        id: "sep-5",
        number: 5,
        code: "SEP-5",
        name: "Using Mathematics and Computational Thinking",
        icon: "🧮",
        color: "#06b6d4",
        tagline: "Applying algebra, calculus, unit conversions, and computational simulations.",
        summary: "Mathematics is the language of physics. Students apply algebraic formulas, dimensional analysis, unit conversions, and computer simulations to express physical relationships quantitatively and predict system behavior.",
        essentialQuestion: "How do mathematical formulas, unit dimensional analysis, and computer algorithms model this physical law?",
        highSchoolExpectations: [
            "Apply techniques of algebra and functions to represent and solve scientific and engineering problems.",
            "Use mathematical representations to describe and/or support scientific conclusions and design solutions.",
            "Apply ratios, rates, percentages, and unit conversions (dimensional analysis) to ensure mathematical and dimensional consistency.",
            "Use digital tools, mathematical models, or computational simulations to model complex phenomena and analyze interactions within physical systems."
        ],
        keySkills: [
            "Factor-Label Method: Performing single and multi-step dimensional analysis (e.g., converting km/h to m/s)",
            "Algebraic Rearrangement: Isolating variables before calculating (e.g., solving v = d/t for t, or F = ma for a)",
            "Inverse-Square Law Computations: Calculating changes in gravitational or electrostatic force when distance doubles or triples",
            "Dimensional Consistency: Verifying that equations have matching fundamental SI base units (kg, m, s) on both sides"
        ],
        physicsApplications: [
            "Calculating velocity and momentum before and after an elastic collision using conservation equations (p = mv).",
            "Running a 2D projectile trajectory simulation to calculate range and peak altitude based on initial launch angle and speed.",
            "Converting imperial units to metric SI units to calculate mechanical work (Joules) and power (Watts)."
        ],
        keywords: ["math", "computation", "algebra", "units", "conversion", "dimensional analysis", "formula", "equation", "calculation", "sep 5", "sep5"]
    },
    {
        id: "sep-6",
        number: 6,
        code: "SEP-6",
        name: "Constructing Explanations and Designing Solutions",
        icon: "💡",
        color: "#f59e0b",
        tagline: "Connecting evidence to scientific theories and optimizing engineered designs.",
        summary: "Students construct evidence-based explanations of physical phenomena using accepted physics theories, and apply principles to engineer, refine, and optimize practical solutions to real-world problems.",
        essentialQuestion: "Why did this phenomenon happen based on physics laws, or how can we design a device that solves this challenge?",
        highSchoolExpectations: [
            "Make a quantitative and/or qualitative claim regarding the relationship between dependent and independent variables.",
            "Construct and revise an explanation based on valid and reliable evidence obtained from a variety of sources and the assumption that natural laws operate today as they did in the past.",
            "Apply scientific ideas, principles, and/or evidence to provide an explanation of phenomena and solve design problems, taking into account possible unanticipated effects.",
            "Design, evaluate, and/or refine a solution to a complex real-world problem, based on scientific knowledge, student-generated sources of evidence, prioritized criteria, and tradeoff considerations."
        ],
        keySkills: [
            "Claim-Evidence-Reasoning (CER): Writing scientific explanations that explicitly link evidence to fundamental physics laws",
            "Iterative Engineering: Prototyping, testing, identifying failure points, and modifying designs to meet criteria",
            "Trade-Off Analysis: Balancing competing constraints such as structural mass, durability, financial cost, and safety factors",
            "Applying Newton's laws and thermodynamic principles to explain everyday experiences"
        ],
        physicsApplications: [
            "Designing an egg-drop or cell phone case crash structure that lengthens impact duration (Δt) to minimize peak force (F = Δp / Δt).",
            "Explaining why passengers lurch forward when a bus suddenly brakes using Newton's First Law of Inertia.",
            "Optimizing an electric circuit layout to maximize light output while remaining within maximum battery amperage safety limits."
        ],
        keywords: ["explanation", "design", "solution", "claim", "evidence", "reasoning", "cer", "engineering", "optimize", "trade-off", "sep 6", "sep6"]
    },
    {
        id: "sep-7",
        number: 7,
        code: "SEP-7",
        name: "Engaging in Argument from Evidence",
        icon: "⚖️",
        color: "#ec4899",
        tagline: "Defending claims, evaluating peer methodologies, and critiquing reasoning.",
        summary: "Science progresses through rigorous argument based on empirical data rather than opinions. Students defend conclusions, evaluate competing design alternatives, critique peer experimental setups, and identify flaws in reasoning.",
        essentialQuestion: "Which claim is best supported by the experimental evidence, and what are the counter-arguments?",
        highSchoolExpectations: [
            "Compare and evaluate competing arguments or design solutions in light of currently accepted explanations, new evidence, limitations, constraints, and ethical considerations.",
            "Evaluate the claims, evidence, and/or reasoning behind currently accepted explanations or solutions to determine the merits of arguments.",
            "Respectfully provide and/or receive critiques on scientific arguments by probing reasoning and evidence, challenging premises, and responding thoughtfully to diverse perspectives.",
            "Construct, use, and/or present an oral and written argument or counter-arguments based on data and evidence."
        ],
        keySkills: [
            "Peer Critique: Evaluating classmates' lab procedures and pointing out uncontrolled variables or calibration oversights",
            "Data Sufficiency: Judging whether an experiment conducted enough trials to justify a generalized claim",
            "Distinguishing Correlation from Causation in experimental findings",
            "Decision Matrices: Scoring competing engineering prototypes against weighted criteria to make an evidence-backed selection"
        ],
        physicsApplications: [
            "Debating whether a heavier cart rolls down an incline faster than a light cart by presenting photogate timing data and analyzing rolling resistance.",
            "Evaluating competing energy storage designs (chemical batteries vs. pumped hydroelectric) using efficiency data and environmental impact criteria.",
            "Defending why light exhibits both wave interference patterns (Double-slit experiment) and particle-like properties (Photoelectric effect)."
        ],
        keywords: ["argument", "evidence", "critique", "claim", "counterargument", "debate", "rebuttal", "justification", "sep 7", "sep7"]
    },
    {
        id: "sep-8",
        number: 8,
        code: "SEP-8",
        name: "Obtaining, Evaluating, and Communicating Information",
        icon: "📢",
        color: "#10b981",
        tagline: "Critically reading scientific texts, synthesizing media, and sharing findings.",
        summary: "Scientists communicate findings through peer-reviewed papers, presentations, and technical diagrams. Students critically evaluate scientific claims in media, synthesize information from multiple formats, and present findings persuasively.",
        essentialQuestion: "How do we critically evaluate scientific information in media and communicate our own physics findings clearly?",
        highSchoolExpectations: [
            "Critically read scientific literature adapted for classroom use to determine the central ideas and synthesize multiple sources.",
            "Evaluate the validity and reliability of multiple claims that appear in scientific and technical texts or media reports, verifying data when possible.",
            "Communicate scientific and/or technical information or ideas in multiple formats (including orally, graphically, textually, and mathematically).",
            "Synthesize information from various sources (tables, graphs, equations, diagrams, written texts) to communicate a coherent understanding of a physical process."
        ],
        keySkills: [
            "Media Literacy: Identifying pseudoscience, misleading graphs, biased statistics, and missing control groups in online articles",
            "Technical Writing: Writing structured formal lab reports with clear methodology, data tables, and error analyses",
            "Multi-Modal Communication: Presenting physics findings using slideshows, interactive digital dashboards, posters, and spoken presentations",
            "Translating between equations, prose, and graphical representations of motion and force"
        ],
        physicsApplications: [
            "Creating a scientific poster and executive briefing explaining how a magnetic levitation (MagLev) train operates.",
            "Reading conflicting claims regarding cellular radiation safety and evaluating the empirical validity of high-frequency vs. low-frequency EM wave research.",
            "Publishing and presenting student-engineered crash safety bumper test results with high-speed video evidence and force graphs."
        ],
        keywords: ["communication", "information", "evaluate", "read", "present", "publish", "media", "poster", "report", "sep 8", "sep8"]
    }
];

if (typeof window !== 'undefined') {
    window.NGSS_SEP_DATA = NGSS_SEP_DATA;
}
