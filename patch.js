const fs = require('fs');
const file = 'rocket-cart-lab/readable.html';
let content = fs.readFileSync(file, 'utf8');

const searchStr = `        zD = ({ position: e, velocity: t, isFiring: n, engines: a }) => {`;

const startIdx = content.indexOf(searchStr);
if (startIdx !== -1) {
  const endMarker = '            }, [e, t, n, a]),';
  const endIdx = content.indexOf(endMarker, startIdx);
  
  if (endIdx !== -1) {
    const matched = content.substring(startIdx, endIdx + endMarker.length - 1);
    
    // Create the replacement string using refs
    const replaceStr = `        zD = ({ position: e, velocity: t, isFiring: n, engines: a }) => {
          const posRef = O.useRef(e);
          const velRef = O.useRef(t);
          const firingRef = O.useRef(n);
          const engRef = O.useRef(a);
          posRef.current = e;
          velRef.current = t;
          firingRef.current = n;
          engRef.current = a;
          const u = O.useRef(null),
            o = O.useRef(null),
            f = O.useRef([]);
          return (
            O.useEffect(() => {
              const s = u.current,
                h = o.current;
              if (!s || !h) return;
              const d = s.getContext("2d");
              if (!d) return;
              let m;
              const p = () => {
                const b = h.getBoundingClientRect();
                (s.width !== b.width || s.height !== b.height) &&
                  ((s.width = b.width), (s.height = b.height));
              };
              p();
              const g = () => {
                p();
                const b = s.width,
                  S = s.height,
                  w = d.createLinearGradient(0, 0, 0, S);
                (w.addColorStop(0, "#0f172a"),
                  w.addColorStop(1, "#1e293b"),
                  (d.fillStyle = w),
                  d.fillRect(0, 0, b, S));
                const A = S * 0.75,
                  _ = 100,
                  M = 40;
                d.fillStyle = "#334155";
                const C = (posRef.current * 10) % 400;
                for (let Q = -1; Q < b / 400 + 2; Q++) {
                  const ee = Q * 400 - C;
                  (d.beginPath(),
                    d.moveTo(ee + 50, A),
                    d.lineTo(ee + 100, A - 100),
                    d.lineTo(ee + 150, A),
                    d.fill(),
                    d.fillRect(ee + 200, A - 150, 40, 150));
                }
                const z = (posRef.current * 50) % 300;
                for (let Q = -1; Q < b / 300 + 2; Q++) {
                  const ee = Q * 300 - z;
                  ((d.fillStyle = "#475569"),
                    d.fillRect(ee, A - 120, 10, 120),
                    (d.fillStyle = "#fbbf24"),
                    d.fillRect(ee + 2, A - 100, 6, 4));
                }
                const N = (posRef.current * 100) % 100;
                ((d.fillStyle = "#1e293b"),
                  d.fillRect(0, A, b, S - A),
                  (d.strokeStyle = "#64748b"),
                  (d.lineWidth = 2),
                  d.beginPath(),
                  d.moveTo(0, A),
                  d.lineTo(b, A),
                  d.stroke());
                for (let Q = -N; Q < b + 100; Q += 100)
                  ((d.strokeStyle = "#475569"),
                    d.beginPath(),
                    d.moveTo(Q, A),
                    d.lineTo(Q - 20, S),
                    d.stroke(),
                    (d.fillStyle = "#94a3b8"),
                    (d.font = "10px monospace"),
                    d.fillText(\`\${Math.floor(posRef.current + Q / 100)}m\`, Q + 5, A + 15));
                const j = b * 0.2;
                if (firingRef.current) {
                  const Q = Math.min(velRef.current / 20, 1),
                    ee = 15 + engRef.current * 10;
                  for (let $ = 0; $ < ee; $++)
                    f.current.push({
                      x: j,
                      y: A - M / 2 + (Math.random() - 0.5) * M * 0.9,
                      life: 1,
                      vx: -Math.random() * (10 + velRef.current * 0.6) - (5 + velRef.current * 0.3),
                      vy: (Math.random() - 0.5) * (5 * (1 - Q * 0.75)),
                    });
                }
                ((f.current = f.current.filter((Q) => Q.life > 0)),
                  f.current.forEach((Q) => {
                    ((Q.x += Q.vx), (Q.y += Q.vy), (Q.life -= 0.035));
                    const ee = 255,
                      $ = Math.floor(Q.life * 255),
                      pe = Math.floor(Q.life * 100);
                    ((d.fillStyle = \`rgba(\${ee}, \${$}, \${pe}, \${Q.life})\`),
                      d.beginPath());
                    const ce = 2 + Math.random() * 5,
                      ye = 1 - Math.min(velRef.current, 40) / 120,
                      q = ce * ye * (0.5 + Q.life * 0.5);
                    (d.arc(Q.x, Q.y, Math.max(0.5, q), 0, Math.PI * 2),
                      d.fill());
                  }),
                  (d.fillStyle = "#94a3b8"));
                const k = 10,
                  J = M / (engRef.current + 1);
                for (let Q = 1; Q <= engRef.current; Q++) {
                  const ee = A - M + Q * J;
                  (d.fillRect(j - 8, ee - k / 2, 12, k),
                    (d.fillStyle = "#0f172a"),
                    d.fillRect(j - 10, ee - k / 4, 4, k / 2),
                    (d.fillStyle = "#94a3b8"));
                }
                const F = d.createLinearGradient(j, A - M, j, A);
                (F.addColorStop(0, "#818cf8"),
                  F.addColorStop(1, "#4f46e5"),
                  (d.fillStyle = F),
                  d.beginPath(),
                  d.roundRect
                    ? d.roundRect(j, A - M, _, M, 6)
                    : d.rect(j, A - M, _, M),
                  d.fill(),
                  (d.fillStyle = "#0f172a"),
                  d.beginPath(),
                  d.arc(j + 20, A, 10, 0, Math.PI * 2),
                  d.moveTo(j + 90, A),
                  d.arc(j + 80, A, 10, 0, Math.PI * 2),
                  d.fill(),
                  (d.fillStyle = "#64748b"),
                  d.beginPath(),
                  d.arc(j + 20, A, 4, 0, Math.PI * 2),
                  d.moveTo(j + 84, A),
                  d.arc(j + 80, A, 4, 0, Math.PI * 2),
                  d.fill(),
                  (d.fillStyle = "rgba(255, 255, 255, 0.3)"),
                  d.fillRect(j + 10, A - M + 5, _ - 20, 4),
                  (m = requestAnimationFrame(g)));
              };
              return (
                (m = requestAnimationFrame(g)),
                () => cancelAnimationFrame(m)
              );
            }, [])`;
            
    content = content.replace(matched, replaceStr);
    
    // Now minify it again slightly just by replacing index.html
    // but the fastest approach is to just use readable.html and move it to index.html
    const indexHtmlPattern = file.replace('readable', 'index');
    fs.writeFileSync(indexHtmlPattern, content);
    console.log("Successfully patched and updated index.html!");
  } else {
    console.log("Found start but not end marker");
  }
} else {
  console.log("Could not find start substring");
}

