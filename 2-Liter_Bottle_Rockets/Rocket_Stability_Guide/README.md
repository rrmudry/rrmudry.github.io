# Bottle Rocket Stability Guide

An interactive tool designed to help physics students calculate and verify the aerodynamic stability of 2-liter bottle rockets. This guide provides a step-by-step workflow for finding the **Center of Mass (CM)** and **Center of Pressure (CP)** before flight.

## Features

### 🚀 Digital CP Tool
The core of this application is a high-fidelity Center of Pressure calculation tool with two modes:
- **Auto Scan**: Uses real-time background subtraction to isolate the rocket's silhouette and calculate its geometric centroid.
- **Manual Trace**: Allows users to manually outline the rocket in a still photo—perfect for clear or complex-shaped bottles that are difficult to scan automatically.

### 📏 Step-by-Step Stability Protocol
1. **Find Center of Mass (CM)**: Guided instructions and interactive diagrams for balancing the rocket.
2. **Find Center of Pressure (CP)**: Utilizing the Digital CP Tool (Auto or Manual).
3. **The Swing Test**: A physical verification procedure to ensure the CM is sufficiently forward of the CP.

### 🛠️ Troubleshooting Guide
Practical fixes for unstable rockets, including advice on adding nose weight and modifying fin geometry.

## Technical Implementation
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript.
- **Styling**: Tailwind CSS for a modern, responsive interface.
- **Imaging**: HTML5 Canvas API for pixel-level image processing and coordinate-based polygon centroid calculations.
- **Icons**: Feather Icons for intuitive UI controls.

## Relevant Info
- **Flight Condition**: Perform all tests with the rocket completely assembled but **empty of water**.
- **The Golden Rule**: For a stable flight, the Center of Mass (CM) must be closer to the nose than the Center of Pressure (CP).

---
*Built for Physics Students • Fly Safe!*
