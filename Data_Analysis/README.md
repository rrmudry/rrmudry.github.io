# 📊 CAST Science Data Studio

An interactive, NGSS-aligned web application designed for middle and high school science students to create scientific graphs, perform linear regression data analysis, and construct Claims, Evidence, and Reasoning (CER) lab responses for the California Science Test (CAST).

👉 **Live Demo:** [https://rrmudry.github.io/Data_Analysis/](https://rrmudry.github.io/Data_Analysis/)

---

## 🌟 Key Features

### 1. 📈 Interactive Scientific Graphing & Multi-Series Analysis
* **Default Launch State**: Automatically initializes with a clean **Custom Blank Dataset** (`✏️ Custom Blank Dataset`) so students can enter custom lab data immediately.
* **Multiple Chart Types**: Scatter plots (continuous data), connected line graphs, and categorical bar charts.
* **Multi-Series Data Support**: Compare multiple series against a single $X$-variable ($Y_1$, $Y_2$, etc.) on the same grid.
* **Custom Plot Styling**: Personalize individual data series with native color pickers, point shapes (**Circle ●**, **Triangle ▲**, **Square ■**, **Star ★**, **Cross ✖**), and custom point radius sizes.

### 2. 🧮 Linear Regression, Trendlines & Rate Analysis
* **Full-Scale Trendline Extension**: Dashed linear regression lines extend seamlessly across the **entire visible scale range** (from scale minimum to 110% maximum bound).
* **Linear Model Statistics**: Calculates slope ($m$), $y$-intercept ($b$), line equation ($y = mx + b$), and coefficient of determination ($R^2$).
* **Disabled by Default**: Best-fit lines are unchecked by default across all practice presets to keep graphs uncluttered, allowing students to turn on trendline analysis when needed under the **Trend & Slope** tab.
* **📐 CAST Point-to-Point Rate Tool ($\Delta Y / \Delta X$)**: Computes interval slope ($\text{Rate} = \Delta Y / \Delta X$) between any two selected data points with units and step breakdowns ($\Delta Y$, $\Delta X$).

### 3. 🏷️ Decoupled Axis Titles & Custom Item / Datapoint Labels
* **Independent Y-Axis Title**: The **Y-Axis Label / Name** field controls *only* the physical Y-axis title on the graph canvas (e.g., *"Water Temperature"* or *"Crust Age"*).
* **Independent Series Names**: Data Table column headers represent **Data Series Names** (e.g., *"Mid-Atlantic Ridge"* vs *"East Pacific Rise"*). Renaming a series updates legend labels without mutating the Y-axis title.
* **🏷️ Custom Item / Datapoint Names**: Dedicated **Item / Label** column to the left of the $X$-column for assigning custom names (e.g., *"Student A"*, *"Trial 1"*, *"Sample B"*). Point names reflect automatically in graph tooltips, Point-to-Point Rate dropdown selectors, and Bar Chart category labels.

### 4. 🔍 Fullscreen Data Table Studio & Synchronized Views
* Expandable modal view (`🔍 Expand Table`) for editing and inspecting large multi-column datasets without scrolling in small sidebar boxes.
* **Real-time Synchronization**: Edits to data points, X/Y values, or series names in either the collapsed sidebar table or the expanded modal table update both views in real-time.

### 5. 📝 CER (Claim, Evidence, Reasoning) Writing Studio
* Dedicated workspace for students to draft scientific arguments.
* **⚡ Auto-Generate Evidence**: Automatically extracts mathematical statistics (min, max, slope, trend direction, $R^2$) directly into the student's evidence field.

### 6. 🎯 Practice Presets & Lab Utilities
* **Built-in Practice Datasets**: Photosynthesis Rate, Seafloor Spreading Age Comparison, Heating Curve of Water, Pendulum Period, and Enzymes.
* **Save & Load**: Export student work to `.json` files and re-import anytime.
* **Image & Print Export**: Save high-resolution `.png` graph images or generate formal printable lab reports with student header lines.
* **Dark / Light Theme**: Full CSS variable-driven dark mode toggle.

---

## ⚙️ Global Axis Scaling & Tick Label Considerations

The graphing engine implements strict global rules for axis range calculations and tick label formatting:

### 1. 📐 110% Upper Bound Scaling (`suggestedMax = dataMax * 1.1`)
* **110% Buffer Rule**: Axis upper bounds automatically scale to **110% of maximum X and Y data values** ($x_{\text{sugMax}} = x_{\text{max}} \times 1.1$ and $y_{\text{sugMax}} = y_{\text{max}} \times 1.1$).
* **Why this matters**: Setting scale maximums equal to data maximums (e.g., $500\text{ km}$ or $25\text{ Ma}$) causes tick labels on boundary pixels to be dropped by edge-collision algorithms. Scaling axis bounds to 110% ($550\text{ km}$ / $27.5\text{ Ma}$) positions maximum data values as clean interior tick marks, guaranteeing all maximum tick labels remain fully visible.

### 2. 📍 Origin Anchoring (`beginAtZero: true`)
* When **"Always Include (0,0) Origin"** is checked (on by default), `beginAtZero: true` and `min: 0` are passed directly to Chart.js scale tick options.
* Guarantees $(0,0)$ origin inclusion for non-negative datasets without generating negative ticks. Unchecking the box enables dynamic zooming around the data range.

### 3. 📊 Categorical Bar Chart Scaling
* When rendering bar charts (`type: 'bar'`), the X-axis switches to a `category` scale. Category labels (`Item / Label` or text $X$-values) are mapped directly to ticks using Chart.js `this.getLabelForValue(val)`.

### 4. 🔤 Clean Tick Formatting
* **Integers**: Whole numbers display as clean integers without trailing decimals (`0`, `50`, `100`, `500`).
* **Decimals**: Fractional numbers round to a maximum of 2 decimal places (`14.14`), stripping unnecessary trailing zeros.

### 5. 🖼️ Element Clipping & Dimensions
* **Datapoint Markers (`clip: false`)**: Point icons sitting directly on grid boundary ticks render fully without being cropped.
* **Trendlines (`clip: false`)**: Dashed trendlines extend cleanly across the grid container.
* **Aspect Ratio**: Graph container fixed to **720px × 420px** aspect ratio for consistent presentation across screens and printouts.

---

## 🛠️ Technology Stack

* **Core**: HTML5, Vanilla JavaScript (ES6+)
* **Styling**: Modern CSS3 with HSL colors, Glassmorphism, CSS Grid/Flexbox, and CSS Custom Properties for theme toggling
* **Charting Library**: [Chart.js](https://www.chartjs.org/)
* **Authentication & Storage**: Firebase SDK integration ready

---

## 🚀 Local Setup & Development

No build steps or complex dependencies required. Open `index.html` in any browser or host with a static server:

```bash
# Clone repository
git clone https://github.com/rrmudry.github.io.git

# Navigate to project directory
cd rrmudry.github.io/Data_Analysis

# Open in browser or serve locally
python3 -m http.server 8000
```
