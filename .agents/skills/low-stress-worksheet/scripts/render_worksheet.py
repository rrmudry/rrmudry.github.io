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


def format_inline_markdown(text: str) -> str:
    """Converts *italic constraints* and `code/math` into clean HTML."""
    escaped = html.escape(text)
    escaped = re.sub(r"\*(.+?)\*", r"<em class='constraint'>\1</em>", escaped)
    escaped = re.sub(r"`(.+?)`", r"<code>\1</code>", escaped)
    return escaped


def render_zone(zone: dict, ruled_lines: int) -> str:
    pattern = zone.get("surface_pattern", "blank_open")
    width = zone.get("width_pct", 100)
    header = html.escape(zone.get("zone_header", ""))
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
        <span class="checkbox">☐</span>
        <span class="part-label">({part})</span>
        <strong class="verb-badge">{verb}</strong>
        <span class="prompt-body">{text}</span>
      </div>
      <div class="workspace-box" style="min-height: {height_in}in;">
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
    ref_bank = data.get("header_reference_bank", {})
    eqs = " &nbsp;|&nbsp; ".join(
        f"<code>{html.escape(e)}</code>" for e in ref_bank.get("equations", [])
    )
    consts = " &nbsp;|&nbsp; ".join(
        f"<code>{html.escape(c)}</code>" for c in ref_bank.get("constants", [])
    )
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
  }}
  .header-top {{
    display: flex; justify-content: space-between; align-items: baseline;
  }}
  h1 {{ font-size: 1.35rem; margin: 0; }}
  .student-meta {{ font-size: 0.9rem; color: #334155; }}
  .reference-bar {{
    margin-top: 8px; padding: 6px 10px; background: #f1f5f9;
    border-radius: 4px; font-size: 0.85rem; display: flex;
    justify-content: space-between; flex-wrap: wrap; gap: 8px;
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
  .prompt-line {{ font-size: 0.95rem; margin-bottom: 6px; }}
  .checkbox {{ color: #64748b; margin-right: 4px; }}
  .part-label {{ font-weight: 600; margin-right: 4px; }}
  .verb-badge {{
    background: #0f172a; color: #fff; padding: 1px 6px;
    border-radius: 3px; font-size: 0.85rem; margin-right: 4px;
  }}
  .constraint {{
    font-style: italic; text-decoration: underline;
    text-decoration-color: #94a3b8;
  }}
  .workspace-box {{
    display: flex; border: 1.5px solid #94a3b8; border-radius: 4px;
    position: relative; overflow: hidden;
  }}
  .ws-zone {{
    padding: 6px 10px; border-right: 1px dashed #cbd5e1; position: relative;
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
    <div class="header-top">
      <h1>{title}</h1>
      <div class="student-meta">Name: ______________________ &nbsp; Period: ____ &nbsp; Date: ________</div>
    </div>
    <div class="reference-bar">
      <div><strong>Equations:</strong> {eqs or "None"}</div>
      <div><strong>Constants:</strong> {consts or "None"}</div>
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
