/**
 * CASTGraphEngine v1.0 - Standalone Scientific Graphing & Data Analysis API Engine
 * Author: CAST Science Studio
 * License: MIT
 *
 * Lightweight Chart.js wrapper providing:
 * - Scatter plots, connected line graphs, and categorical bar charts
 * - Full-scale linear regression trendlines (y = mx + b, R², slope, intercept)
 * - Point-to-point rate of change analysis (ΔY / ΔX)
 * - Multi-series support with custom markers, colors, and point radius sizes
 * - Decoupled axis titles & custom point/item labels
 * - Automatic 110% upper-bound tick scaling & clip boundary management
 * - Dark & Light theme modes
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CASTGraphEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // --- Linear Regression Engine ---
  function calculateLinearRegression(points, minX, maxX) {
    const validPts = points.filter(p => p && !isNaN(p.x) && !isNaN(p.y));
    const n = validPts.length;
    if (n < 2) return null;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      const x = validPts[i].x;
      const y = validPts[i].y;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    }

    const denom = (n * sumX2 - sumX * sumX);
    if (denom === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const meanY = sumY / n;
    let ssTot = 0, ssRes = 0;
    for (let i = 0; i < n; i++) {
      const x = validPts[i].x;
      const y = validPts[i].y;
      const predY = slope * x + intercept;
      ssRes += Math.pow(y - predY, 2);
      ssTot += Math.pow(y - meanY, 2);
    }

    const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot));

    const startX = minX !== undefined ? minX : Math.min(...validPts.map(p => p.x));
    const endX = maxX !== undefined ? maxX : Math.max(...validPts.map(p => p.x));

    const trendlineData = [
      { x: startX, y: slope * startX + intercept },
      { x: endX, y: slope * endX + intercept }
    ];

    const relationship = slope > 0 ? "Direct Positive Trend" : (slope < 0 ? "Inverse / Negative Trend" : "No Linear Trend");
    const formula = `y = ${slope.toFixed(2)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(2)}`;

    return {
      slope: slope,
      intercept: intercept,
      r2: r2,
      relationship: relationship,
      formula: formula,
      trendlineData: trendlineData
    };
  }

  // --- CASTGraphEngine Main Class ---
  class CASTGraphEngine {
    constructor(target, options = {}) {
      this.target = typeof target === 'string' ? document.querySelector(target) : target;
      if (!this.target) {
        throw new Error(`[CASTGraphEngine] Target container '${target}' not found in DOM.`);
      }

      this.canvas = null;
      this.chartInstance = null;
      this.initCanvasContainer();

      this.options = this.mergeDefaults(options);
      this.render();
    }

    mergeDefaults(userOpts) {
      const defaults = {
        title: "Scientific Graph",
        chartType: "scatter", // "scatter", "line", "bar"
        showBestFit: false,
        showGrid: true,
        theme: "light", // "light" or "dark"
        xAxis: {
          label: "Independent Variable (X)",
          unit: "",
          min: undefined,
          max: undefined,
          beginAtZero: true
        },
        yAxis: {
          label: "Dependent Variable (Y)",
          unit: "",
          min: undefined,
          max: undefined,
          beginAtZero: true
        },
        pointLabels: [],
        xValues: [1, 2, 3, 4, 5],
        series: [
          {
            id: "s1",
            label: "Data Series 1",
            unit: "",
            color: "#0284c7",
            pointStyle: "circle",
            pointRadius: 6,
            values: [10, 20, 30, 40, 50]
          }
        ]
      };

      return {
        ...defaults,
        ...userOpts,
        xAxis: { ...defaults.xAxis, ...(userOpts.xAxis || {}) },
        yAxis: { ...defaults.yAxis, ...(userOpts.yAxis || {}) },
        series: (userOpts.series && userOpts.series.length) ? userOpts.series : defaults.series
      };
    }

    initCanvasContainer() {
      if (this.target.tagName.toLowerCase() === 'canvas') {
        this.canvas = this.target;
      } else {
        this.target.innerHTML = '';
        this.canvas = document.createElement('canvas');
        this.target.appendChild(this.canvas);
      }
    }

    getThemeColors() {
      const isDark = this.options.theme === 'dark';
      return {
        textColor: isDark ? '#f1f5f9' : '#1e293b',
        mutedColor: isDark ? '#94a3b8' : '#64748b',
        gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
      };
    }

    render() {
      if (typeof Chart === 'undefined') {
        console.error("[CASTGraphEngine] Chart.js is required but not loaded on window.");
        return;
      }

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const { title, chartType, showBestFit, showGrid, xAxis, yAxis, pointLabels, xValues, series } = this.options;
      const { textColor, mutedColor, gridColor } = this.getThemeColors();
      const isBar = chartType === 'bar';

      // Axis formatting & title helpers
      const xTitle = xAxis.unit ? `${xAxis.label} (${xAxis.unit})` : xAxis.label;
      const yTitle = yAxis.unit ? `${yAxis.label} (${yAxis.unit})` : yAxis.label;

      // Extract min & max values for scale calculation & 110% bounds
      const numericX = xValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const xDataMin = numericX.length ? Math.min(...numericX) : 0;
      const xDataMax = numericX.length ? Math.max(...numericX) : 10;

      let allYValues = [];
      series.forEach(s => {
        const nums = s.values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        allYValues = allYValues.concat(nums);
      });
      const yDataMin = allYValues.length ? Math.min(...allYValues) : 0;
      const yDataMax = allYValues.length ? Math.max(...allYValues) : 10;

      // 110% Suggested Upper Bound Rule
      const xSugMax = (xDataMax > 0) ? xDataMax * 1.1 : (xDataMax < 0 ? xDataMax * 0.9 : undefined);
      const ySugMax = (yDataMax > 0) ? yDataMax * 1.1 : (yDataMax < 0 ? yDataMax * 0.9 : undefined);

      const userXMin = xAxis.min !== "" && xAxis.min !== undefined ? parseFloat(xAxis.min) : undefined;
      const userXMax = xAxis.max !== "" && xAxis.max !== undefined ? parseFloat(xAxis.max) : undefined;
      const userYMin = yAxis.min !== "" && yAxis.min !== undefined ? parseFloat(yAxis.min) : undefined;
      const userYMax = yAxis.max !== "" && yAxis.max !== undefined ? parseFloat(yAxis.max) : undefined;

      const trendMinX = userXMin !== undefined ? userXMin : xDataMin;
      const trendMaxX = userXMax !== undefined ? userXMax : (xSugMax !== undefined ? xSugMax : xDataMax);

      const chartDatasets = [];

      series.forEach((s) => {
        const sColor = s.color || "#0284c7";
        const pStyle = s.pointStyle || "circle";
        const pRadius = parseInt(s.pointRadius) || 6;
        const seriesLabel = s.unit ? `${s.label} (${s.unit})` : s.label;

        if (isBar) {
          chartDatasets.push({
            label: seriesLabel,
            data: s.values.map(v => parseFloat(v) || 0),
            backgroundColor: sColor,
            borderColor: sColor,
            borderWidth: 1
          });
        } else {
          const pts = xValues.map((x, idx) => ({
            x: parseFloat(x) || 0,
            y: parseFloat(s.values[idx]) || 0
          }));

          chartDatasets.push({
            label: seriesLabel,
            data: pts,
            backgroundColor: sColor,
            borderColor: sColor,
            pointStyle: pStyle,
            pointRadius: pRadius,
            pointHoverRadius: pRadius + 3,
            showLine: chartType === 'line'
          });

          // Trendline Dataset
          const reg = calculateLinearRegression(pts, trendMinX, trendMaxX);
          if (showBestFit && reg && !isNaN(reg.slope)) {
            chartDatasets.push({
              label: `${s.label} Trend (${reg.formula})`,
              data: reg.trendlineData,
              type: 'line',
              borderColor: sColor,
              borderWidth: 2,
              borderDash: [6, 6],
              pointRadius: 0,
              fill: false,
              clip: false
            });
          }
        }
      });

      const barLabels = xValues.map((x, idx) => {
        const pLabel = (pointLabels && pointLabels[idx] !== undefined) ? pointLabels[idx] : undefined;
        if (pLabel && pLabel.trim() !== "" && !pLabel.startsWith("Pt ")) {
          return pLabel;
        }
        return x !== undefined ? String(x) : `Cat ${idx + 1}`;
      });

      const ctx = this.canvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: isBar ? 'bar' : 'scatter',
        data: {
          labels: isBar ? barLabels : undefined,
          datasets: chartDatasets.map(ds => ({ ...ds, clip: ds.clip !== undefined ? ds.clip : false }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { left: 5, right: 15, top: 10, bottom: 5 }
          },
          plugins: {
            title: {
              display: !!title,
              text: title,
              color: textColor,
              font: { size: 15, weight: 'bold' }
            },
            legend: {
              labels: { color: mutedColor, usePointStyle: true }
            },
            tooltip: {
              callbacks: {
                title: function (context) {
                  if (!context || !context.length) return '';
                  const dataIdx = context[0].dataIndex;
                  const ptLabel = (pointLabels && pointLabels[dataIdx] !== undefined) ? pointLabels[dataIdx] : '';
                  return ptLabel ? ptLabel : `Pt ${dataIdx + 1}`;
                }
              }
            }
          },
          scales: {
            x: {
              type: isBar ? 'category' : 'linear',
              title: { display: true, text: xTitle, color: textColor, font: { weight: 'bold' } },
              grid: { display: showGrid !== false, color: gridColor },
              min: isBar ? undefined : (userXMin !== undefined ? userXMin : (xAxis.beginAtZero ? 0 : undefined)),
              suggestedMax: isBar ? undefined : xSugMax,
              max: isBar ? undefined : userXMax,
              ticks: {
                display: true,
                beginAtZero: isBar ? undefined : xAxis.beginAtZero,
                color: mutedColor,
                font: { size: 11 },
                callback: function (val) {
                  if (isBar) return this.getLabelForValue(val);
                  return Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
                }
              }
            },
            y: {
              title: { display: true, text: yTitle, color: textColor, font: { weight: 'bold' } },
              grid: { display: showGrid !== false, color: gridColor },
              min: userYMin !== undefined ? userYMin : (yAxis.beginAtZero ? 0 : undefined),
              suggestedMax: ySugMax,
              max: userYMax,
              ticks: {
                display: true,
                beginAtZero: yAxis.beginAtZero,
                padding: 6,
                color: mutedColor,
                font: { size: 11 },
                callback: function (val) {
                  return Number.isInteger(val) ? val : parseFloat(val.toFixed(2));
                }
              }
            }
          }
        }
      });
    }

    update(newOpts = {}) {
      this.options = this.mergeDefaults({ ...this.options, ...newOpts });
      this.render();
    }

    setTheme(themeName) {
      if (themeName === 'light' || themeName === 'dark') {
        this.options.theme = themeName;
        this.render();
      }
    }

    getRegression(seriesIndex = 0) {
      const s = this.options.series[seriesIndex];
      if (!s) return null;

      const pts = this.options.xValues.map((x, idx) => ({
        x: parseFloat(x) || 0,
        y: parseFloat(s.values[idx]) || 0
      }));

      const numericX = this.options.xValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const xDataMin = numericX.length ? Math.min(...numericX) : 0;
      const xDataMax = numericX.length ? Math.max(...numericX) : 10;
      const xSugMax = (xDataMax > 0) ? xDataMax * 1.1 : (xDataMax < 0 ? xDataMax * 0.9 : undefined);

      const userXMin = this.options.xAxis.min !== "" && this.options.xAxis.min !== undefined ? parseFloat(this.options.xAxis.min) : undefined;
      const userXMax = this.options.xAxis.max !== "" && this.options.xAxis.max !== undefined ? parseFloat(this.options.xAxis.max) : undefined;

      const trendMinX = userXMin !== undefined ? userXMin : xDataMin;
      const trendMaxX = userXMax !== undefined ? userXMax : (xSugMax !== undefined ? xSugMax : xDataMax);

      return calculateLinearRegression(pts, trendMinX, trendMaxX);
    }

    getRate(indexA, indexB, seriesIndex = 0) {
      const s = this.options.series[seriesIndex];
      if (!s) return null;

      const xA = parseFloat(this.options.xValues[indexA]);
      const yA = parseFloat(s.values[indexA]);
      const xB = parseFloat(this.options.xValues[indexB]);
      const yB = parseFloat(s.values[indexB]);

      if (isNaN(xA) || isNaN(yA) || isNaN(xB) || isNaN(yB)) return null;

      const dx = xB - xA;
      const dy = yB - yA;
      if (dx === 0) return { slope: NaN, dy, dx, formattedText: "Vertical line (Undefined slope)" };

      const slope = dy / dx;
      const xUnit = this.options.xAxis.unit || 'X units';
      const yUnit = s.unit || this.options.yAxis.unit || 'Y units';

      return {
        slope: slope,
        dy: dy,
        dx: dx,
        xUnit: xUnit,
        yUnit: yUnit,
        formattedText: `Rate: ${slope.toFixed(3)} ${yUnit} per ${xUnit} (ΔY = ${dy.toFixed(2)}, ΔX = ${dx.toFixed(2)})`
      };
    }

    toBase64Image(type = 'image/png', quality = 1.0) {
      if (!this.chartInstance) return null;
      const isDark = this.options.theme === 'dark';
      const bgColor = isDark ? '#0f172a' : '#ffffff';

      const sourceCanvas = this.chartInstance.canvas;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sourceCanvas.width;
      tempCanvas.height = sourceCanvas.height;

      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = bgColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(sourceCanvas, 0, 0);

      return tempCanvas.toDataURL(type, quality);
    }

    exportPNG(filename) {
      const imageURI = this.toBase64Image();
      if (!imageURI) return;
      const link = document.createElement('a');
      link.download = filename || `${(this.options.title || 'graph').replace(/\s+/g, '_')}.png`;
      link.href = imageURI;
      link.click();
    }

    destroy() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
    }
  }

  // Static helper exporter
  CASTGraphEngine.calculateLinearRegression = calculateLinearRegression;

  return CASTGraphEngine;
}));
