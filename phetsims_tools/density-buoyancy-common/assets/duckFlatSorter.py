## VERTEX SHAPE SORTER
## @author AgustinVallejo

## This file takes an array of 2d vertices, allegedly sorted randomly, and sorts them by proximity to properly build
## a polygon. It's not flawless, and it might stall if it's done and finds duplicate vertices.

# Original array of vertices
vertices = [] # Put here the tuples of vertex coordinates, i.e. ( 0.53, 1.22 )

# New vertices empty array
vertices2 = []

c = vertices[0] # First vertex

# Distance function
dist = lambda a,b: ((a[0] - b[0])**2 + (a[1] - b[1])**2)**.5

count = 0

print("If the following percentage stalls, feel free to interrupt the code.")
while ( len(vertices2) < len(vertices) ) or ( count > len( vertices ) * 5):
    if c not in vertices2:
        print(f"Percentage of vertices added {100*len(vertices2)/len(vertices)}%")
        # NOTE: If this percentage stalls, feel free to interrupt the code.
        # There were likely repeated vertices and you can proceed with vertices2
        vertices2.append(c)

    minim = 100 # Minimum distance, will change
    ctemp = () # New coordinates to be added
    for v in vertices:
        # Check all the vertices for distance
        if v != c:
            d = dist(v,c)
            if d < minim and v not in vertices2:
                minim = d
                ctemp = v
    if ctemp:
        c = ctemp

    count += 1