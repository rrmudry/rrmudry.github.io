"""Procedural Royal Navy 32-pounder (c. 1800s) on a truck carriage -> GLB.
Pure Python, no deps. Units: meters. +Y up, muzzle points +Z, origin on deck under carriage.
Two nodes: "Carriage", and "Barrel" with its origin on the trunnion axis so it can be elevated."""
import math, struct, json, sys

SEG = 48  # radial segments

class Mesh:
    def __init__(self):
        self.p, self.n, self.i = [], [], []
    def add(self, verts, norms, tris):
        b = len(self.p)
        self.p += verts; self.n += norms
        for t in tris:  # make winding agree with supplied normals
            A, B, C = (verts[k] for k in t)
            e1 = [B[k] - A[k] for k in range(3)]; e2 = [C[k] - A[k] for k in range(3)]
            fn = (e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0])
            vn = [sum(norms[k][j] for k in t) for j in range(3)]
            if sum(fn[j]*vn[j] for j in range(3)) < 0: t = (t[0], t[2], t[1])
            self.i.append(tuple(k + b for k in t))

meshes = {k: Mesh() for k in ("iron_barrel", "bore", "iron", "wood")}

def norm(v):
    l = math.sqrt(sum(c * c for c in v)) or 1
    return tuple(c / l for c in v)

# ---------- primitives ----------
def lathe(mesh, prof, axis="z", center=(0, 0, 0), seg=SEG):
    """prof: list of (r, t) along axis; each segment gets its own normal (crisp steps)."""
    cx, cy, cz = center
    def place(r, t, a):
        u, v = r * math.cos(a), r * math.sin(a)
        if axis == "z": return (cx + u, cy + v, cz + t)
        if axis == "x": return (cx + t, cy + u, cz + v)
    def placen(nr, nt, a):
        u, v = nr * math.cos(a), nr * math.sin(a)
        if axis == "z": return (u, v, nt)
        if axis == "x": return (nt, u, v)
    for (r0, t0), (r1, t1) in zip(prof, prof[1:]):
        dr, dt = r1 - r0, t1 - t0
        if dr == 0 and dt == 0: continue
        nr, nt = norm((dt, -dr))  # outward normal in (r,t) plane
        V, N, T = [], [], []
        for k in range(seg + 1):
            a = 2 * math.pi * k / seg
            V += [place(r0, t0, a), place(r1, t1, a)]
            N += [placen(nr, nt, a)] * 2
        for k in range(seg):
            a0, b0, a1, b1 = 2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 3
            T += [(a0, a1, b1), (a0, b1, b0)]
        mesh.add(V, N, T)

def box(mesh, x0, x1, y0, y1, z0, z1):
    faces = [
        ((1, 0, 0), [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]),
        ((-1, 0, 0), [(x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (x0, y0, z0)]),
        ((0, 1, 0), [(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)]),
        ((0, -1, 0), [(x0, y0, z1), (x0, y0, z0), (x1, y0, z0), (x1, y0, z1)]),
        ((0, 0, 1), [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]),
        ((0, 0, -1), [(x1, y0, z0), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0)]),
    ]
    for n, q in faces:
        mesh.add(q, [n] * 4, [(0, 1, 2), (0, 2, 3)])

def wedge(mesh, x0, x1, z0, z1, ylo, yhi_back, yhi_front):
    """Quoin: sloped top from yhi_back at z0 to yhi_front at z1."""
    P = {
        "a": (x0, ylo, z0), "b": (x1, ylo, z0), "c": (x1, ylo, z1), "d": (x0, ylo, z1),
        "e": (x0, yhi_back, z0), "f": (x1, yhi_back, z0), "g": (x1, yhi_front, z1), "h": (x0, yhi_front, z1),
    }
    quads = ["bcgf", "dahe", "ehgf", "abcd"[::-1], "cdhg", "abfe"[::-1]]
    for q in quads:
        v = [P[c] for c in q]
        e1 = [v[1][k] - v[0][k] for k in range(3)]; e2 = [v[2][k] - v[0][k] for k in range(3)]
        n = norm((e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]))
        cen = ((x0 + x1) / 2, (ylo + yhi_back) / 2, (z0 + z1) / 2)
        if sum(n[k] * (v[0][k] - cen[k]) for k in range(3)) < 0: n = tuple(-c for c in n)
        mesh.add(v, [n] * 4, [(0, 1, 2), (0, 2, 3)])

def torus(mesh, center, R, r, axis, seg=24, tseg=10):
    """Ring whose hole faces along `axis` ('x' or 'z')."""
    cx, cy, cz = center
    V, N, T = [], [], []
    for i in range(seg + 1):
        a = 2 * math.pi * i / seg
        for j in range(tseg + 1):
            b = 2 * math.pi * j / tseg
            radial = R + r * math.cos(b)
            u, v, w = radial * math.cos(a), radial * math.sin(a), r * math.sin(b)
            nu, nv, nw = math.cos(b) * math.cos(a), math.cos(b) * math.sin(a), math.sin(b)
            if axis == "x":
                V.append((cx + w, cy + u, cz + v)); N.append((nw, nu, nv))
            else:
                V.append((cx + u, cy + v, cz + w)); N.append((nu, nv, nw))
    for i in range(seg):
        for j in range(tseg):
            a = i * (tseg + 1) + j; b = a + tseg + 1
            T += [(a, b, b + 1), (a, b + 1, a + 1)] if axis == "z" else [(a, b + 1, b), (a, a + 1, b + 1)]
    mesh.add(V, N, T)

def sphere_profile(rad, t0, n=12, start=0.0, end=math.pi):
    """(r,t) points of a sphere arc, angle measured from the -t pole."""
    return [(rad * math.sin(start + (end - start) * k / n), t0 - rad * math.cos(start + (end - start) * k / n)) for k in range(n + 1)]

# ---------- barrel (32-pdr, ~2.9 m, 6.4 in bore) ----------
H = 0.86          # bore-axis height above deck
BZ = -0.15        # base-ring z (breech face)
iron, wood, bore = meshes["iron_barrel"], meshes["wood"], meshes["bore"]

prof = []
prof += sphere_profile(0.075, BZ - 0.36, n=12, start=0, end=math.pi * 0.78)       # cascabel button
prof += [(0.040, BZ - 0.27), (0.040, BZ - 0.22), (0.07, BZ - 0.205)]              # neck + fillet
# breech dome (cascabel) up to base ring
for k in range(1, 13):
    a = (math.pi / 2) * k / 12
    prof.append((0.07 + 0.20 * math.sin(a), BZ - 0.20 + 0.18 * (1 - math.cos(a)) + 0.0))
prof += [(0.27, BZ - 0.02), (0.30, BZ - 0.02), (0.30, BZ + 0.05), (0.285, BZ + 0.07)]  # base ring + ogee
prof += [(0.285, BZ + 0.08), (0.275, BZ + 0.08)]                                   # step to 1st reinforce
prof += [(0.272, BZ + 1.05), (0.285, BZ + 1.06), (0.285, BZ + 1.10), (0.262, BZ + 1.11)]  # 1st reinforce ring
prof += [(0.255, BZ + 1.50), (0.268, BZ + 1.51), (0.268, BZ + 1.55), (0.232, BZ + 1.57)]  # 2nd reinforce ring
prof += [(0.205, BZ + 2.45), (0.218, BZ + 2.46), (0.218, BZ + 2.49), (0.196, BZ + 2.50)]  # chase astragal
prof += [(0.185, BZ + 2.62)]                                                        # neck of muzzle
for k in range(1, 9):                                                               # muzzle swell
    a = (math.pi / 2) * k / 8
    prof.append((0.185 + 0.045 * math.sin(a), BZ + 2.62 + 0.18 * (1 - math.cos(a))))
prof += [(0.232, BZ + 2.82), (0.232, BZ + 2.86), (0.215, BZ + 2.88), (0.215, BZ + 2.90)]  # muzzle lip
prof += [(0.105, BZ + 2.90)]                                                        # muzzle face
lathe(iron, [(r, t) for r, t in prof], center=(0, H, 0))
# bore (inside-facing, so profile runs inward)
lathe(bore, [(0.105, BZ + 2.90), (0.082, BZ + 2.88), (0.082, BZ + 0.25), (0.0, BZ + 0.20)], center=(0, H, 0))

# trunnions + rimbases (axis slightly below bore centre, as on real guns)
TZ, TY = BZ + 1.25, H - 0.04
for s in (1, -1):
    xs = [0.20, 0.30, 0.31, 0.47]
    if s < 0:
        lathe(iron, [(0.0, -0.47), (0.082, -0.47), (0.082, -0.31), (0.12, -0.30), (0.12, -0.20)], axis="x", center=(0, TY, TZ))
    else:
        lathe(iron, [(0.12, 0.20), (0.12, 0.30), (0.082, 0.31), (0.082, 0.47), (0.0, 0.47)], axis="x", center=(0, TY, TZ))

# vent field / touch-hole patch
box(iron, -0.035, 0.035, H + 0.27, H + 0.30, BZ + 0.18, BZ + 0.30)
# breeching ring on cascabel
torus(iron, (0, H, BZ - 0.31), 0.06, 0.014, axis="x")
iron = meshes["iron"]  # everything below is carriage

# ---------- truck carriage ----------
CX0, CX1 = 0.31, 0.43           # cheek inner/outer |x|
DECK_CLEAR = 0.16
steps = [  # (z_back, z_front, top_y) -- stepped brackets
    (0.85, 1.45, TY - 0.08),
    (0.45, 0.85, TY - 0.20),
    (0.05, 0.45, TY - 0.32),
    (-0.40, 0.05, TY - 0.44),
]
for s in (1, -1):
    x0, x1 = sorted((s * CX0, s * CX1))
    for zb, zf, ty in steps:
        box(wood, x0, x1, DECK_CLEAR, ty, zb, zf)
    # cap square (iron strap over trunnion)
    box(iron, x0 - 0.005, x1 + 0.005, TY + 0.06, TY + 0.10, TZ - 0.11, TZ + 0.11)
    for zz in (TZ - 0.11, TZ + 0.07):
        box(iron, x0 - 0.005, x1 + 0.005, TY - 0.08, TY + 0.10, zz, zz + 0.04)
    # bolt heads along the cheek
    for zz, yy in ((1.2, 0.35), (0.65, 0.35), (0.25, 0.30), (-0.15, 0.25), (1.2, 0.60), (0.65, 0.50)):
        lathe(iron, [(0.0, 0.0), (0.03, 0.0), (0.03, 0.025), (0.0, 0.025)] if s > 0 else
              [(0.0, -0.025), (0.03, -0.025), (0.03, 0.0), (0.0, 0.0)],
              axis="x", center=(s * CX1, yy, zz), seg=12)
    # ring bolts for breeching / tackle
    torus(iron, (s * (CX1 + 0.03), 0.45, -0.22), 0.045, 0.011, axis="z")
    torus(iron, (s * (CX1 + 0.03), 0.30, 1.30), 0.045, 0.011, axis="z")

# front transom + bed / stool bed
box(wood, -CX0, CX0, 0.22, 0.48, 1.25, 1.45)
box(wood, -CX0, CX0, 0.30, 0.38, -0.30, 1.25)
# quoin (elevation wedge) under breech, with handle
breech_bottom = H - 0.30
wedge(wood, -0.16, 0.16, -0.42, 0.20, 0.38, breech_bottom - 0.005, 0.40)
lathe(wood, [(0.0, -0.52), (0.025, -0.52), (0.025, -0.42)], center=(0, 0.47, 0), seg=12)

# axletrees, axles, trucks (wheels)
for zc, rw in ((1.30, 0.24), (-0.20, 0.21)):
    box(wood, -0.56, 0.56, rw - 0.07, rw + 0.08, zc - 0.11, zc + 0.11)
    lathe(iron, [(0.0, -0.70), (0.035, -0.70), (0.035, 0.70), (0.0, 0.70)], axis="x", center=(0, rw, zc), seg=16)
    for s in (1, -1):
        xa, xb = (0.48, 0.60) if s > 0 else (-0.60, -0.48)
        lathe(wood, [(0.0, xa), (rw - 0.02, xa), (rw, xa + 0.015), (rw, xb - 0.015), (rw - 0.02, xb), (0.0, xb)],
              axis="x", center=(0, rw, zc))
        # iron linch-pin washer
        lathe(iron, [(0.0, xb if s > 0 else xa), (0.06, xb if s > 0 else xa)], axis="x", center=(0, rw, zc), seg=16)
        torus(iron, (s * 0.665, rw, zc), 0.045, 0.008, axis="x", seg=16)  # hub band

# ---------- GLB writer ----------
mats = {
    "iron": {"name": "CastIron", "pbrMetallicRoughness": {"baseColorFactor": [0.07, 0.07, 0.075, 1], "metallicFactor": 0.85, "roughnessFactor": 0.55}},
    "wood": {"name": "OakCarriage", "pbrMetallicRoughness": {"baseColorFactor": [0.25, 0.14, 0.07, 1], "metallicFactor": 0.0, "roughnessFactor": 0.85}},
    "iron_barrel": None,
    "bore": {"name": "BoreInterior", "pbrMetallicRoughness": {"baseColorFactor": [0.01, 0.01, 0.01, 1], "metallicFactor": 0.3, "roughnessFactor": 0.9}, "doubleSided": True},
}
mats["iron_barrel"] = mats["iron"]
order = ["iron", "wood", "bore"]
materials = [mats[k] for k in order]
binbuf = bytearray(); views = []; accs = []
def push(data, target):
    while len(binbuf) % 4: binbuf.append(0)
    off = len(binbuf); binbuf.extend(data)
    views.append({"buffer": 0, "byteOffset": off, "byteLength": len(data), "target": target})
    return len(views) - 1
def prim(m, mat, off=(0, 0, 0)):
    P = [tuple(v[k] - off[k] for k in range(3)) for v in m.p]
    pv = push(struct.pack(f"<{len(P)*3}f", *[c for v in P for c in v]), 34962)
    nv = push(struct.pack(f"<{len(m.n)*3}f", *[c for v in m.n for c in v]), 34962)
    iv = push(struct.pack(f"<{len(m.i)*3}I", *[c for t in m.i for c in t]), 34963)
    mins = [min(v[k] for v in P) for k in range(3)]; maxs = [max(v[k] for v in P) for k in range(3)]
    accs.extend([
        {"bufferView": pv, "componentType": 5126, "count": len(P), "type": "VEC3", "min": mins, "max": maxs},
        {"bufferView": nv, "componentType": 5126, "count": len(m.n), "type": "VEC3"},
        {"bufferView": iv, "componentType": 5125, "count": len(m.i) * 3, "type": "SCALAR"},
    ])
    return {"attributes": {"POSITION": len(accs) - 3, "NORMAL": len(accs) - 2}, "indices": len(accs) - 1, "material": order.index(mat)}
PIVOT = (0, TY, TZ)
gltf = {
    "asset": {"version": "2.0", "generator": "procedural make_cannon.py"},
    "scene": 0, "scenes": [{"nodes": [0]}],
    "nodes": [
        {"name": "RN_32pdr_TruckCarriage", "children": [1, 2]},
        {"name": "Carriage", "mesh": 0},
        {"name": "Barrel", "mesh": 1, "translation": list(PIVOT)},
    ],
    "meshes": [
        {"name": "Carriage", "primitives": [prim(meshes["iron"], "iron"), prim(meshes["wood"], "wood")]},
        {"name": "Barrel", "primitives": [prim(meshes["iron_barrel"], "iron", PIVOT), prim(meshes["bore"], "bore", PIVOT)]},
    ],
    "materials": materials, "accessors": accs, "bufferViews": views,
    "buffers": [{"byteLength": len(binbuf)}],
}
js = json.dumps(gltf, separators=(",", ":")).encode()
js += b" " * (-len(js) % 4)
while len(binbuf) % 4: binbuf.append(0)
out = sys.argv[1]
with open(out, "wb") as f:
    f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binbuf)))
    f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack("<II", len(binbuf), 0x004E4942)); f.write(binbuf)
print(out, sum(len(m.i) for m in meshes.values()), "tris", len(binbuf) // 1024, "KB")
