#!/usr/bin/env python3
"""
Deterministic Low-Stress Worksheet Compiler for Antigravity IDE.
Usage: python3 render_worksheet.py <input.json> <output.html>
"""
import html
import json
import re
import sys
from pathlib import Path


def sanitize_math_subscripts(text: str) -> str:
    """Sanitizes programmer underscores (F_net -> F<sub>net</sub>) and chemical formulas."""
    if not text:
        return ""
    s = text
    # Clean duplicate prefix tokens like F_ F_net or F_ F
    s = re.sub(r"\bF_\s*F_net\b", "F<sub>net</sub>", s)
    s = re.sub(r"\bF_\s*F\b", "F", s)
    s = re.sub(r"\bF_net_([0-9]+)\b", r"F<sub>\1</sub>", s)
    s = re.sub(r"\bF_net([₀-₉]+)\b", r"F\1", s)
    s = re.sub(r"\bF_net\b", "F<sub>net</sub>", s)
    s = re.sub(r"\bP_rate\b", "R<sub>O₂</sub>", s)
    # General underscore variable: ([A-Za-z]+)_([A-Za-z0-9]+) -> \1<sub>\2</sub>
    s = re.sub(r"\b([A-Za-z]+)_([A-Za-z0-9]+)\b", r"\1<sub>\2</sub>", s)
    # Chemical formulas & common compounds (preserving proper element casing)
    s = re.sub(r"\bNaHCO3\b", "NaHCO<sub>3</sub>", s)
    s = re.sub(r"\bNaHCOs\b", "NaHCO<sub>3</sub>", s)
    s = re.sub(r"\bCO2\b", "CO<sub>2</sub>", s)
    s = re.sub(r"\bO2\b", "O<sub>2</sub>", s)
    s = re.sub(r"\bH2O\b", "H<sub>2</sub>O", s)
    s = re.sub(r"\bMgCl2\b", "MgCl<sub>2</sub>", s)
    s = re.sub(r"\bMgCl₂\b", "MgCl<sub>2</sub>", s)
    s = re.sub(r"\bH2\b", "H<sub>2</sub>", s)
    s = re.sub(r"\bH₂\b", "H<sub>2</sub>", s)
    # Sanitize stray characters before Heat in chemical equations
    s = re.sub(r"[+\s]+[a-zA-Z\?]\s+Heat\b", " + Heat", s)
    return s


def format_inline_markdown(text: str) -> str:
    """Converts *italic constraints*, `code/math`, and subscripts into clean HTML."""
    escaped = html.escape(text)
    escaped = sanitize_math_subscripts(escaped)
    escaped = re.sub(r"\*(.+?)\*", r"<em class='constraint'>\1</em>", escaped)
    escaped = re.sub(r"`(.+?)`", r"<code>\1</code>", escaped)
    return escaped


def sanitize_zone_header(header: str) -> str:
    """Enforces standard '☐ ZONE [A-C] — [LABEL]: ' formatting and prevents concatenated headers like 'ZONE BEVIDENCE'."""
    if not header:
        return ""
    h = header.strip()
    # Fix corrupted 'ZONE BEVIDENCE' or 'ZONE CREASONING' or 'ZONE ACLAIM'
    h = re.sub(r"^☐?\s*ZONE\s*A\s*[-—:]*\s*(?:CLAIM)?:?\s*(.*)$", r"☐ ZONE A — CLAIM: \1", h, flags=re.IGNORECASE)
    h = re.sub(r"^☐?\s*ZONE\s*B\s*[-—:]*\s*(?:EVIDENCE)?:?\s*(.*)$", r"☐ ZONE B — EVIDENCE: \1", h, flags=re.IGNORECASE)
    h = re.sub(r"^☐?\s*ZONE\s*C\s*[-—:]*\s*(?:REASONING)?:?\s*(.*)$", r"☐ ZONE C — REASONING: \1", h, flags=re.IGNORECASE)
    # If it was just '☐ ZONE B — EVIDENCE:' with empty trailing, clean up trailing space
    h = re.sub(r":\s*$", ":", h)
    return h


def render_zone(zone: dict, ruled_lines: int) -> str:
    pattern = zone.get("surface_pattern", "blank_open")
    width = zone.get("width_pct", 100)
    raw_header = zone.get("zone_header", "")
    sanitized_header = sanitize_zone_header(raw_header)
    header = html.escape(sanitized_header)
    scaffold = html.escape(zone.get("faded_scaffold_hint", ""))

    lines_html = ""
    if pattern == "ruled_lines" and ruled_lines > 0:
        lines_html = "".join(
            '<div class="ruled-line"></div>' for _ in range(ruled_lines)
        )

    scaffold_html = (
        f'<div class="faded-scaffold">{scaffold}</div>' if scaffold else ""
    )

    return f"""
    <div class="ws-zone surface-{pattern}" style="width: {width}%;">
      <div class="zone-header">{header}</div>
      {scaffold_html}
      {lines_html}
    </div>
    """


def render_sub_prompt(sp: dict) -> str:
    part = html.escape(sp.get("part_label", ""))
    verb = html.escape(sp.get("command_verb", ""))
    text = format_inline_markdown(sp.get("prompt_text", ""))
    ws = sp.get("workspace", {})
    archetype = html.escape(ws.get("archetype", ""))
    height_in = ws.get("height_in", 1.5)
    ruled_lines = ws.get("ruled_line_count", 0)
    unit_prompt = html.escape(ws.get("answer_unit_prompt", ""))

    zones_html = "".join(
        render_zone(z, ruled_lines) for z in ws.get("zones", [])
    )
    unit_html = (
        f'<div class="unit-prompt">{unit_prompt}</div>' if unit_prompt else ""
    )

    steps_html = "".join(
        f"<li>{html.escape(s)}</li>" for s in sp.get("teacher_solution_steps", [])
    )

    return f"""
    <div class="sub-prompt-block">
      <div class="prompt-line">
        <div class="prompt-badge-group">
          <span class="checkbox">☐</span>
          <span class="part-label">({part})</span>
          <strong class="verb-badge">{verb}</strong>
        </div>
        <div class="prompt-body">{text}</div>
      </div>
      <div class="workspace-box archetype-{archetype}" style="min-height: {height_in}in;">
        {zones_html}
        {unit_html}
      </div>
      <div class="teacher-key" hidden>
        <strong>Teacher Solution ({sp.get("step_count", 0)} steps):</strong>
        <ol>{steps_html}</ol>
      </div>
    </div>
    """


def render_problem(prob: dict) -> str:
    num = prob.get("problem_number", 1)
    is_worked = prob.get("is_worked_pair", False)
    stim = prob.get("stimulus", {})
    context = format_inline_markdown(stim.get("context_line", ""))
    givens = stim.get("extracted_givens", [])
    diag = stim.get("diagram_spec", {})

    badge = (
        '<span class="scaffold-badge">Guided Scaffold</span>' if is_worked else ""
    )
    givens_html = "".join(f"<li>{html.escape(g)}</li>" for g in givens)

    diag_html = ""
    if diag.get("needed"):
        labels = " • ".join(
            f'<span class="diag-tag">{html.escape(lbl)}</span>'
            for lbl in diag.get("embedded_labels", [])
        )
        desc = html.escape(diag.get("description", ""))
        diag_html = f"""
        <div class="diagram-box">
          <div class="diagram-placeholder">[Diagram: {desc}]</div>
          <div class="embedded-labels">{labels}</div>
        </div>
        """

    sub_html = "".join(
        render_sub_prompt(sp) for sp in prob.get("sub_prompts", [])
    )

    return f"""
    <section class="problem-card">
      <div class="problem-header">
        <h2>Problem {num}</h2>
        {badge}
      </div>
      <p class="context-line">{context}</p>
      <div class="stimulus-grid">
        <div class="givens-card">
          <div class="givens-title">Extracted Givens</div>
          <ul>{givens_html}</ul>
        </div>
        {diag_html}
      </div>
      <div class="sub-prompts-container">
        {sub_html}
      </div>
    </section>
    """


def build_html(data: dict) -> str:
    title = html.escape(data.get("worksheet_title", "Worksheet"))
    standard = html.escape(data.get("standard_code", ""))
    problems_html = "".join(
        render_problem(p) for p in data.get("problems", [])
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{title}</title>
<style>
  @page {{ size: letter; margin: 0.5in; }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: system-ui, -apple-system, sans-serif;
    color: #0f172a;
    line-height: 1.4;
    max-width: 8.0in;
    margin: 0 auto;
    padding: 0.25in;
    background: #fff;
  }}
  .toolbar {{
    display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 16px;
  }}
  .toolbar button {{
    padding: 6px 12px; border: 1px solid #334155; background: #f8fafc;
    border-radius: 4px; cursor: pointer; font-weight: 600;
  }}
  @media print {{ .toolbar {{ display: none; }} body {{ padding: 0; }} }}
  header {{
    border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }}
  .header-left h1 {{ font-size: 1.25rem; margin: 0 0 4px 0; }}
  .standard-tag {{
    font-size: 0.75rem; background: #f1f5f9; color: #475569;
    padding: 2px 6px; border-radius: 4px; font-weight: 600; font-family: monospace;
  }}
  .header-right {{
    text-align: right; font-size: 0.88rem; color: #334155; line-height: 1.5;
  }}
  .problem-card {{
    break-inside: avoid; page-break-inside: avoid;
    border: 1px solid #cbd5e1; border-radius: 6px;
    padding: 14px; margin-bottom: 20px; background: #ffffff;
  }}
  .problem-header {{
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;
  }}
  .problem-header h2 {{ font-size: 1.05rem; margin: 0; }}
  .scaffold-badge {{
    font-size: 0.75rem; background: #e0f2fe; color: #0369a1;
    padding: 2px 8px; border-radius: 12px; font-weight: 600;
  }}
  .context-line {{ margin: 0 0 10px 0; font-size: 0.95rem; }}
  .stimulus-grid {{
    display: flex; gap: 12px; margin-bottom: 12px; align-items: stretch;
  }}
  .givens-card {{
    flex: 1; background: #f8fafc; border-left: 3px solid #475569;
    padding: 8px 12px; font-size: 0.85rem;
  }}
  .givens-title {{ font-weight: 700; margin-bottom: 4px; color: #334155; }}
  .givens-card ul {{ margin: 0; padding-left: 18px; }}
  .diagram-box {{
    flex: 1.2; border: 1px dashed #94a3b8; border-radius: 4px;
    padding: 8px; display: flex; flex-direction: column;
    justify-content: center; align-items: center; background: #fcfcfd;
  }}
  .diagram-placeholder {{ font-size: 0.8rem; color: #64748b; margin-bottom: 6px; text-align: center; }}
  .diag-tag {{
    background: #e2e8f0; padding: 1px 6px; border-radius: 3px;
    font-size: 0.78rem; font-family: monospace;
  }}
  .sub-prompt-block {{ margin-top: 12px; }}
  .prompt-line {{
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 0.95rem; line-height: 1.35; margin-bottom: 8px;
  }}
  .prompt-badge-group {{
    display: inline-flex; align-items: center; gap: 4px;
    flex-shrink: 0; white-space: nowrap; padding-top: 1px;
  }}
  .checkbox {{ color: #64748b; font-family: monospace; font-weight: 700; }}
  .part-label {{ font-weight: 700; color: #0f172a; margin-right: 2px; }}
  .verb-badge {{
    background: #0f172a; color: #fff; padding: 1px 6px;
    border-radius: 3px; font-size: 0.75rem; font-weight: 800;
    letter-spacing: 0.5px; text-transform: uppercase;
  }}
  .prompt-body, .prompt-text {{
    flex: 1; min-width: 0; color: #0f172a; font-weight: 600;
  }}
  .constraint {{
    font-style: italic; text-decoration: underline;
    text-decoration-color: #94a3b8;
  }}
  .workspace-box {{
    display: flex; border: 1.5px solid #94a3b8; border-radius: 4px;
    position: relative; overflow: hidden; background: #ffffff;
  }}
  .archetype-claim_evidence_reasoning {{
    flex-direction: column;
  }}
  .archetype-claim_evidence_reasoning .ws-zone {{
    border-right: none;
    border-bottom: 1px dashed #cbd5e1;
    width: 100% !important;
  }}
  .archetype-claim_evidence_reasoning .ws-zone:last-of-type {{
    border-bottom: none;
  }}
  .ws-zone {{
    padding: 6px 10px; border-right: 1px dashed #cbd5e1; position: relative;
    box-sizing: border-box;
    font-variant-numeric: normal;
    font-feature-settings: "zero" 0;
  }}
  .ws-zone:last-of-type {{ border-right: none; }}
  .zone-header {{
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em;
    color: #475569; font-weight: 700; margin-bottom: 4px;
  }}
  .faded-scaffold {{
    color: #94a3b8; font-style: italic; font-size: 0.9rem; margin-top: 4px;
  }}
  .surface-dot_grid {{
    background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
    background-size: 14px 14px;
  }}
  .surface-pre_drawn_axes {{
    background-color: #f8fafc;
    position: relative;
  }}
  .ruled-line {{
    border-bottom: 1px solid #cbd5e1; height: 0.32in; width: 100%;
  }}
  .unit-prompt {{
    position: absolute; bottom: 6px; right: 10px;
    background: rgba(255,255,255,0.9); padding: 2px 6px;
    font-weight: 600; font-size: 0.9rem; border-radius: 3px;
  }}
  .teacher-key {{
    margin-top: 6px; padding: 8px 12px; background: #fef9c3;
    border-left: 3px solid #eab308; font-size: 0.82rem;
  }}
  .teacher-key ol {{ margin: 4px 0 0 0; padding-left: 18px; }}
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="document.querySelectorAll('.teacher-key').forEach(el => el.hidden = !el.hidden)">
      Toggle Teacher Key
    </button>
    <button onclick="window.print()">Print / Save PDF</button>
  </div>
  <header>
    <div class="header-left">
      <h1>{title}</h1>
      <div><span class="standard-tag">Standard: {standard}</span></div>
    </div>
    <div class="header-right">
      <div>Name: ______________________</div>
      <div>Period: ____ &nbsp; Date: ________</div>
    </div>
  </header>
  <main>
    {problems_html}
  </main>
</body>
</html>"""


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 render_worksheet.py <input.json> <output.html>")
        sys.exit(1)

    in_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2])

    data = json.loads(in_path.read_text(encoding="utf-8"))
    for p in data.get("problems", []):
        if p.get("estimated_total_height_in", 0) > 8.0:
            print(
                f"ERROR: Problem {p.get('problem_number')} exceeds 8.0in atomic page height.",
                file=sys.stderr,
            )
            sys.exit(2)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(build_html(data), encoding="utf-8")
    print(f"Successfully compiled low-stress worksheet to {out_path}")


if __name__ == "__main__":
    main()
    