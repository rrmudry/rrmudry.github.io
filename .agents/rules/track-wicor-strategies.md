---
description: Always add WICOR strategies when modifying daily lessons
---
When updating daily lesson data (e.g., in `assets/lessons-data.js`) to reflect changes in the curriculum or scheduling, you MUST ensure that you also identify and track the WICOR (Writing, Inquiry, Collaboration, Organization, Reading) strategies being used in that lesson.

1. **Analyze the lesson**: Review the `summary`, `details`, and any provided links or resources for the new/updated lesson.
2. **Identify WICOR elements**: Determine which of the five WICOR components are present in the lesson activities.
    - **W**riting
    - **I**nquiry
    - **C**ollaboration
    - **O**rganization
    - **R**eading
3. **Format the `wicor` object**: Add a `wicor` property to the lesson object in `lessons-data.js`. The property should be an object with keys corresponding to the strategies used and values describing the implementation.

Example:
```javascript
  {
    date: "2026-02-25",
    day: 13,
    unit: 5,
    title: "Connections: Reading and Lab",
    summary: "Making connections between the reading and the lab.",
    details: "Students will collaborate with their group to make connections between the reading materials and the recent lab using a shared document.",
    type: "Activity",
    dok: 3,
    semester: 2,
    isFeatured: true,
    wicor: {
      collaboration: "Students work in groups to synthesize information.",
      reading: "Reviewing text materials and the shared document.",
      writing: "Documenting connections in the shared Google Doc."
    },
    links: {
      'Collaborative Document': 'https://docs.google.com/document/d/1dCXH40YVvT2zvgQBGSn-YRu4R8j7p8ardLDmhJd7KPU/edit?usp=sharing'
    }
  }
```

ALWAYS include this tracking when adding or modifying lesson entries.
