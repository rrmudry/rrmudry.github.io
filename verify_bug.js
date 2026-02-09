
const points = [
    { x: 0, y: 300 },
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 300, y: 100 },
];

function pointsToPathSegments(points) {
    const segments = [];

    for (let i = 0; i < points.length - 1; i++) {
        const pPrev = points[Math.max(0, i - 1)];
        const pStart = points[i];
        const pEnd = points[i + 1];
        const pNext = points[Math.min(points.length - 1, i + 2)];

        const tension = 1;

        let cp1x = pStart.x + ((pEnd.x - pPrev.x) / 6) * tension;
        let cp1y = pStart.y + ((pEnd.y - pPrev.y) / 6) * tension;

        let cp2x = pEnd.x - ((pNext.x - pStart.x) / 6) * tension;
        let cp2y = pEnd.y - ((pNext.y - pStart.y) / 6) * tension;

        // Fix: Clamp y-coordinates to prevent Catmull-Rom "overshoot" loops
        const minY = Math.min(pStart.y, pEnd.y);
        const maxY = Math.max(pStart.y, pEnd.y);
        cp1y = Math.max(minY, Math.min(maxY, cp1y));
        cp2y = Math.max(minY, Math.min(maxY, cp2y));

        segments.push({
            p0: pStart,
            p1: { x: cp1x, y: cp1y },
            p2: { x: cp2x, y: cp2y },
            p3: pEnd,
        });
    }
    return segments;
}

const segments = pointsToPathSegments(points);
console.log(JSON.stringify(segments, null, 2));

// Check for y-overshoot
segments.forEach((seg, i) => {
    console.log(`Segment ${i}:`);
    const minY = Math.min(seg.p0.y, seg.p3.y);
    const maxY = Math.max(seg.p0.y, seg.p3.y);

    if (seg.p1.y < minY || seg.p1.y > maxY || seg.p2.y < minY || seg.p2.y > maxY) {
        console.log(`  OVERSHOOT DETECTED in Segment ${i}!`);
        console.log(`  Range: [${minY}, ${maxY}]`);
        console.log(`  cp1.y: ${seg.p1.y.toFixed(2)}, cp2.y: ${seg.p2.y.toFixed(2)}`);
    } else {
        console.log(`  No overshoot.`);
    }
});
