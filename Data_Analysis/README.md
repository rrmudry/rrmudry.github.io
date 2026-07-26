# 📊 CAST Science Data Studio

An interactive, NGSS-aligned web application designed for middle and high school science students to create scientific graphs, perform linear regression data analysis, and construct Claims, Evidence, and Reasoning (CER) lab responses for the California Science Test (CAST).

👉 **Live Demo:** [https://rrmudry.github.io/Data_Analysis/](https://rrmudry.github.io/Data_Analysis/)

---

## 🌟 Key Features

### 1. 📈 Interactive Scientific Graphing & Multi-Series Analysis
* **Multiple Chart Types**: Scatter plots, connected line graphs, and categorical bar charts.
* **Multi-Series Data Support**: Compare multiple $Y$-variables against a single $X$-variable ($Y_1$, $Y_2$, etc.) on the same grid.
* **Custom Plot Styling**: Personalize individual data series with:
  * Native color picker choices
  * Datapoint shape selections (**Circle ●**, **Triangle ▲**, **Square ■**, **Star ★**, **Cross ✖**)
  * Custom point marker radius sizes ($2\text{px}$ to $20\text{px}$)

### 2. 🧮 Automatic Linear Regression & Trendlines
* Calculates slope ($m$), $y$-intercept ($b$), line equation ($y = mx + b$), and coefficient of determination ($R^2$).
* Displays trendline overlays styled per dataset.
* Trendlines are strictly clipped to the plot grid boundaries.

### 3. 🔍 Fullscreen Data Table Studio
* Expandable modal view (`🔍 Expand Table`) for easily editing and inspecting large multi-column datasets without scrolling in small sidebar boxes.
* Synchronized real-time with the main sidebar table.

### 4. 📝 CER (Claim, Evidence, Reasoning) Writing Studio
* Dedicated workspace for students to draft scientific arguments.
* **⚡ Auto-Generate Evidence**: Automatically extracts mathematical statistics (min, max, slope, trend direction, $R^2$) directly into the student's evidence field.

### 5. 🎯 Practice Presets & Lab Utilities
* **Built-in Practice Datasets**: Photosynthesis Rate, Seafloor Spreading Age Comparison, Heating Curve of Water, Pendulum Period, and Enzymes.
* **Save & Load**: Export student work to `.json` files and re-import anytime.
* **Image & Print Export**: Save high-resolution `.png` graph images or generate formal printable lab reports with student header lines.
* **Dark / Light Theme**: Full CSS variable-driven dark mode toggle.

---

## ⚙️ Global Axis Scaling & Tick Label Rules

The graphing engine implements strict global rules for axis range calculations and tick label formatting to ensure graphs always look mathematically accurate and readable:

### 1. 📐 110% Upper Bound Scaling (`suggestedMax = dataMax * 1.1`)
* **110% Buffer Rule**: The axis upper bounds are automatically calculated at **110% of the maximum X and Y data values** ($x_{\text{sugMax}} = x_{\text{max}} \times 1.1$ and $y_{\text{sugMax}} = y_{\text{max}} \times 1.1$).
* **Why this matters**: In standard graphing libraries, setting scale maximums equal to data maximums (e.g. $500\text{ km}$ or $25\text{ Ma}$) causes tick labels on boundary pixels to be dropped by edge-collision algorithms. By scaling the axis bounds to 110% ($550\text{ km}$ / $27.5\text{ Ma}$), maximum data values are positioned as clean interior tick marks rather than boundary pixels, guaranteeing all maximum tick labels remain fully visible.

### 2. 📍 Origin Anchoring (`suggestedMin: 0`)
* When **"Always Include (0,0)"** is checked, `suggestedMin` is set to `0`. Both axes start at $0$ for positive data without generating artificial negative tick marks (e.g. $-5$ or $-100$).

### 3. 🔤 Clean Tick Formatting
* **Integers**: Whole numbers display as clean integers without trailing decimals (`0`, `50`, `100`, `500`).
* **Decimals**: Fractional numbers round to a maximum of 2 decimal places (`14.14`).

### 4. 🖼️ Element Clipping & Layout Padding
* **Datapoint Markers (`clip: false`)**: Set to `clip: false` so point icons sitting on grid lines render without being chopped.
* **Trendlines (`clip: true`)**: Trendline datasets use `clip: true` so dashed regression lines stop cleanly at the plot grid border.

### 5. 🎛️ Manual Overrides
* If a student manually enters an **Axis Min** or **Axis Max** in the styling controls, their explicit values override automatic 110% scale calculations.

---

## 🛠️ Technology Stack

* **Core**: HTML5, Vanilla JavaScript (ES6+)
* **Styling**: Modern CSS3 with HSL colors, Glassmorphism, CSS Grid/Flexbox, and CSS Custom Properties for theme toggling
* **Charting Library**: [Chart.js](https://www.chartjs.org/)
* **Authentication & Storage**: Firebase SDK integration ready

---

## 🚀 Local Setup & Development

No build steps or complex dependencies required. Simply open `index.html` in any web browser or host with a static web server:

```bash
# Clone repository
git clone https://github.com/rrmudry/rrmudry.github.io.git

# Navigate to project directory
cd rrmudry.github.io/Data_Analysis

# Open in browser or serve locally
python3 -m http.server 8000
```
