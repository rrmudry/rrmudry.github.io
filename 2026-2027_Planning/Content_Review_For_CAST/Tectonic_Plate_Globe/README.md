# 🌍 Tectonic Plate & Earth Explorer 3D (CAST Science Review)

An interactive, 3D WebGL web application designed for middle and high school Earth Science students preparing for the **California Science Test (CAST)**. This tool provides visual exploration of plate boundaries, real-time USGS seismicity, intraplate mantle plume hotspots, cross-sectional fault mechanics, and an interactive quiz.

---

## 🌟 Key Application Features

### 1. 3D Globe & Plate Boundary Explorer (Three.js)
* **Photorealistic NASA Satellite Earth**: Rendered with elevation bump mapping, specular ocean reflections, atmospheric glow shader, and orbiting cloud layers.
* **3D Plate Boundary Tubes & Motion Vector Arrows**:
  * **Convergent Boundaries (Red)**: Opposing arrows pointing towards each other across collision/subduction zones.
  * **Divergent Boundaries (Cyan)**: Spreading arrows pulling apart across seafloor ridges and rift valleys.
  * **Transform Boundaries (Amber)**: Parallel sliding arrows indicating strike-slip motion.
* **Geological Hotspots HUD Pins**: Interactive 3D pins projected onto screen coordinates with click-to-fly camera focusing.

### 2. Live USGS Real-Time Seismicity Feed
* **Live Earthquakes (M2.5+)**: Fetches real-time seismic events directly from the [USGS Earthquake Feed API](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php).
* **Focal Depth Color-Coding (Wadati-Benioff Subduction Proof)**:
  * 🔴 **Shallow (< 70 km)**: Rendered in Orange
  * 🟡 **Intermediate (70–300 km)**: Rendered in Yellow
  * 🟣 **Deep (> 300 km)**: Rendered in Purple (found almost exclusively along subducting slabs into the mantle)
* **Seismic Event Side-Panel**: View magnitude, exact depth, place name, and timestamp upon clicking any earthquake sphere.

### 3. Intraplate Hotspots vs. Boundary Volcanism
* **Hawaiian Hotspot Plume**: Explains how stationary mantle plumes punch through the moving Pacific Plate to create volcanic island trails (e.g., Kīlauea & Mauna Loa).
* **Yellowstone Supercaldera**: Demonstrates continental intraplate volcanism and the Snake River Plain caldera trail across the North American Plate.

### 4. Interactive Fault Mechanics Cross-Section Lab (2D Canvas)
* **Subduction Zone Simulator**: Demonstrates dense oceanic crust subducting under buoyant continental granite crust, generating frictional melting, magma plumes, and Wadati-Benioff quake hypocenters.
* **Seafloor Spreading & Continental Rifting**: Illustrates mantle thermal convection currents driving plates apart and forming new oceanic crust.
* **Transform Strike-Slip Simulator**: Demonstrates strain accumulation along locked fault planes with user-triggered earthquake slip pulses.
* **Mantle Convection Cells**: Live animated circulation loops showing thermal mantle density convection.

### 5. CAST Student Practice Quiz
* 5-question conceptual quiz with instant explanations, audio feedback, scoring, and retake options.

### 6. Classroom Usability Controls
* **Fullscreen Mode Toggle**: Header button utilizing the HTML Fullscreen API for classroom smartboards and student Chromebooks.
* **Touchscreen Tuning**: Optimized `OrbitControls` touch gestures (`ONE: ROTATE`, `TWO: DOLLY_PAN`) for iPads and touchscreen laptops.

---

## 🎯 NGSS & CAST Performance Expectations Alignment

This application directly addresses the following Next Generation Science Standards (NGSS) assessed on the **California Science Test (CAST)**:

### Middle School (MS-ESS2)
* **MS-ESS2-2**: *Construct an explanation based on evidence for how geoscience processes have changed Earth's surface at varying time and spatial scales.*
  * **App Connection**: Students observe how slow plate movement ($\text{cm/year}$) creates large-scale landforms like mountain chains (Himalayas), ocean trenches (Mariana Trench), and rift valleys (East Africa).
* **MS-ESS2-3**: *Analyze and interpret data on the distribution of fossils and rocks, continental shapes, and seafloor structures to provide evidence of past plate motions.*
  * **App Connection**: Seafloor spreading at the Mid-Atlantic Ridge demonstrates continuous creation of fresh oceanic crust, providing evidence for continental drift.

### High School (HS-ESS2)
* **HS-ESS2-1**: *Develop a model to illustrate how Earth's internal and surface processes operate at different spatial and temporal scales to form continental and ocean-floor features.*
  * **App Connection**: The 3D globe and cross-sectional lab simulate how deep interior mantle convection operates over millions of years to generate mountain arcs, subduction trenches, and transform faults.
* **HS-ESS2-3**: *Develop a model based on evidence of Earth's interior to describe the cycling of matter by thermal convection.*
  * **App Connection**: Asthenosphere convection cell animations in the Fault Mechanics Lab model how heat transfer from the core drives slab pull and ridge push.

---

## 🚀 Future Roadmap & Planned Enhancements

The following features are planned for future integration into the district gradebook system:

1. **Google Sign-In & Email Filtering**:
   * Integrate Firebase Auth to restrict sign-ins strictly to `@orangeusd.org` student accounts.
2. **Firestore Gradebook Synchronization**:
   * Automatically submit student CAST Quiz scores ($0\text{--}100\%$) to Firestore, maintaining highest attempt records for sync with Google Classroom.
3. **Guided Scavenger Hunt / Challenge Task List**:
   * Interactive inquiry task list (e.g. *"Find a deep-focus earthquake along a subduction trench"*, *"Identify why Yellowstone is not on a plate boundary"*).
