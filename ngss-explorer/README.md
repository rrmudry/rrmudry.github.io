# 📚 NGSS 9-12 Science Standards Explorer

An interactive, database-driven web application and API helper designed for high school science educators and students to search, filter, reference, and integrate **Next Generation Science Standards (NGSS)** and the **California Science Framework for Physics of the Universe**.

👉 **Live Explorer:** [https://rrmudry.github.io/ngss-explorer/](https://rrmudry.github.io/ngss-explorer/)

---

## 🌟 Key Features

### 1. 🔍 Instant Search & 4-Domain Filtering
* **Search Engine**: Search by standard code (e.g. `HS-PS2-1`), title, performance expectation text, 3D practices, or keywords.
* **Domain Filtering**:
  * ⚡ **Physical Science (`HS-PS`)**: All 24 High School Physical Science Performance Expectations.
  * 🌍 **Earth & Space Science (`HS-ESS`)**: All 19 High School Earth & Space Science Performance Expectations.
  * 🧬 **Life Science (`HS-LS`)**: All 24 High School Life Science Performance Expectations.
  * 🛠️ **Engineering Design (`HS-ETS`)**: All 4 High School Engineering Design Performance Expectations.

### 2. 🏛️ California Physics of the Universe Framework Integration (IS1 – IS6)
Aligned with Chapter 7 of the *2016 California Science Framework*, allowing teachers to filter standards by High School Physics Instructional Segments:
* **IS1**: Forces and Motion (`HS-PS2-1`, `HS-PS2-2`, `HS-PS2-3`, `HS-ETS1-1`, `HS-ETS1-2`)
* **IS2**: Forces at a Distance (`HS-PS2-4`, `HS-PS2-6`, `HS-ESS1-4`)
* **IS3**: Energy Conversion and Renewable Energy (`HS-PS2-5`, `HS-PS3-1`, `HS-PS3-2`, `HS-PS3-3`, `HS-PS3-5`, `HS-PS4-5`, `HS-ESS3-2`, `HS-ESS3-3`)
* **IS4**: Nuclear Processes (`HS-PS1-8`, `HS-ESS1-5`, `HS-ESS1-6`, `HS-ESS2-1`)
* **IS5**: Waves and Electromagnetic Radiation (`HS-PS4-1`, `HS-PS4-2`, `HS-PS4-3`, `HS-PS4-4`, `HS-ESS2-3`)
* **IS6**: Stars and the Origin of the Universe (`HS-ESS1-1`, `HS-ESS1-2`, `HS-ESS1-3`)

### 3. 🧩 Three-Dimensional (3D) Learning Inspector
Highlights the 3 core pillars of NGSS for every standard:
* 🔵 **Science & Engineering Practices (SEPs)**: *Asking Questions, Developing Models, Analyzing Data, Using Mathematics, Constructing Explanations, etc.*
* 🟠 **Disciplinary Core Ideas (DCIs)**: *PS1.A, PS2.A, PS3.B, ESS1.A, LS1.C, ETS1.B, etc.*
* 🟢 **Crosscutting Concepts (CCCs)**: *Patterns, Cause & Effect, Systems & System Models, Energy & Matter, Structure & Function, etc.*

### 4. ⭐ Bookmarking & LocalStorage Persistence
Save favorite standards with a single click (`★ Bookmark Standard`). Bookmarks persist across sessions in the browser's `localStorage`.

---

## 🛠️ Cross-Site Integration API (`NGSSHelper`)

The standards database (`standards-data.js`) and integration helper (`assets/ngss-helper.js`) can be embedded into any unit dashboard, lesson plan, or web application across `rrmudry.github.io`.

### How to Embed Standards in Unit Dashboards

Include the script files in your HTML page:

```html
<!-- Load Database & Helper -->
<script src="ngss-explorer/standards-data.js"></script>
<script src="assets/ngss-helper.js"></script>
```

#### 1. Get a Single Standard by Code:
```javascript
const std = NGSSHelper.getStandard('HS-PS2-1');
console.log(std.title); // "Newton's Second Law of Motion"
console.log(std.pe);    // Full Performance Expectation text
```

#### 2. Get Standards for an Instructional Segment:
```javascript
const unit7Standards = NGSSHelper.getStandardsByIS('IS3');
// Returns all IS3 standards (HS-PS2-5, HS-PS3-1, etc.)
```

#### 3. Render Interactive Standard Badges in HTML:
```html
<div id="unit-standards-container"></div>

<script>
  window.addEventListener('load', () => {
    NGSSHelper.renderStandardsBanner(
      ['HS-PS2-4', 'HS-PS2-5', 'HS-PS3-5', 'HS-PS4-5'], 
      'unit-standards-container'
    );
  });
</script>
```

---

## 📁 File Structure

```
ngss-explorer/
├── index.html                           # Main Explorer Dashboard SPA
├── style.css                            # Glassmorphism dark mode styles & domain accent colors
├── app.js                               # Search engine, multi-category filters, & modal drawer
├── standards-data.js                    # Database of ALL 70+ High School NGSS Performance Expectations
├── CA_Physics_of_the_Universe_Framework.md # California Framework Chapter 7 Reference Document
└── README.md                            # Documentation & Integration Guide
```

---

## 🤝 Standards Data Format Specification

Each standard object in `standards-data.js` follows this JSON structure:

```json
{
  "code": "HS-PS2-1",
  "domain": "Physical Science",
  "domainCode": "PS",
  "is": "IS1",
  "topic": "Forces and Motion",
  "title": "Newton's Second Law of Motion",
  "pe": "Analyze data to support the claim that Newton's second law of motion describes...",
  "clarification": "Examples of data could include tables or graphs of position or velocity...",
  "boundary": "Assessment is limited to one-dimensional motion, with constant forces.",
  "sep": "Analyzing and Interpreting Data",
  "dci": "PS2.A: Forces and Motion",
  "ccc": "Cause and Effect",
  "unitLink": "../unit1-dashboard.html",
  "keywords": ["force", "mass", "acceleration", "newton", "motion", "f=ma"]
}
```
