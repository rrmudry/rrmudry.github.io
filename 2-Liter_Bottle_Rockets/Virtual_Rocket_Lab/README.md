# Virtual Rocket Design Lab

An interactive physics simulation for designing and testing 2-liter bottle rockets. This lab focuses on the relationship between the **Center of Mass (CM)** and the **Center of Pressure (CP)** to determine aerodynamic stability.

## 🚀 Features

- **Dynamic SVG Visualization**: Real-time rendering of rocket configurations, including multi-bottle heights, various fin sizes, and nose weighting.
- **Physics-Based Stability Model**:
  - Calculates **Center of Mass (CM)** based on component weights and positions.
  - Calculates **Center of Pressure (CP)** using aerodynamic silhouette area and lift coefficients.
  - Determines flight status (**Stable**, **Marginal**, or **Unstable**) based on the "Golden Rule" of stability (CM must be ahead of CP).
- **Interactive Engineering Missions**: Four guided tasks that require students to manipulate rocket variables to achieve specific stability goals.
- **Post-Mission Debrief (Quiz)**: A 10-question multiple-choice assessment that unlocks upon completing all missions.
- **Supabase Integration**: Secure student authentication and real-time progress syncing to the teacher dashboard.
- **20-Point Assessment System**: Scoring is split between mission completion (10 points) and quiz performance (10 points).

## 🧪 Educational Objectives

- Understand how adding mass to the nose shifts the CM forward.
- Observe how larger or lower-positioned fins pull the CP backward.
- Learn the importance of the **Static Margin** (the distance between CM and CP) in rocket design.
- Challenge students to optimize designs for weight efficiency without sacrificing stability.

## 🛠️ Built With

- **React & Babel**: UI and State management.
- **Tailwind CSS**: Modern, glassmorphic styling.
- **Supabase**: Backend-as-a-Service for student data persistence.
- **Lucide Icons**: Standardized engineering iconography.

## 📖 How to Use

1. **Login**: Enter your 6-digit Student ID.
2. **Design**: Use the sliders to adjust height, nose weight, fin size, and fin position.
3. **Analyze**: Watch the CM (yellow) and CP (red) markers move as you adjust sliders. Monitor the **Static Margin** (in Calibers) for technical feedback.
4. **Missions**: Complete all 4 engineering objectives in the sidebar.
5. **Debrief**: Once missions are complete, finish the 10-question quiz.
6. **Improve**: If you aren't satisfied with your score, use the **Restart Engineering Mission** button to reset and try again.

## 📊 Scoring Breakdown

| Category | Points | Description |
| :--- | :--- | :--- |
| **Engineering Missions** | 10 pts | 2.5 pts for each verified configuration task. |
| **Post-Mission Quiz** | 10 pts | 1.0 pt for each correct answer on the debrief. |
| **TOTAL** | **20 pts** | Final grade synced to Supabase. |
