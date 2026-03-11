// Builds a .tex file from a Resume object.
// Produces a standard LaTeX article document the user can compile with
// pdflatex or paste into Overleaf. No LaTeX installation needed to generate.

import fs from "fs";
import path from "path";
import type { Resume } from "../types/resume.js";

// ── Escape special LaTeX characters ─────────────────────────────────────────
function esc(text: string): string {
    return text
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/&/g, "\\&")
        .replace(/%/g, "\\%")
        .replace(/\$/g, "\\$")
        .replace(/#/g, "\\#")
        .replace(/_/g, "\\_")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        .replace(/~/g, "\\textasciitilde{}")
        .replace(/\^/g, "\\textasciicircum{}")
        .replace(/–/g, "--")
        .replace(/—/g, "---")
        .replace(/·/g, "\\textperiodcentered{}");
}

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildTex(resume: Resume, outputPath: string): void {
    const { personal, summary, experience, education, skills, projects, certifications } = resume;

    const lines: string[] = [];

    // ── Preamble ──────────────────────────────────────────────────────────────
    lines.push(
        `\\documentclass[10pt,letterpaper]{article}`,
        `\\usepackage[margin=0.75in]{geometry}`,
        `\\usepackage{enumitem}`,
        `\\usepackage{titlesec}`,
        `\\usepackage{hyperref}`,
        `\\usepackage{parskip}`,
        `\\usepackage[T1]{fontenc}`,
        `\\usepackage{lmodern}`,
        ``,
        `\\hypersetup{colorlinks=true, urlcolor=black, linkcolor=black}`,
        `\\setlength{\\parindent}{0pt}`,
        `\\setlist[itemize]{leftmargin=0.25in, itemsep=1pt, topsep=2pt}`,
        `\\titleformat{\\section}{\\normalfont\\small\\bfseries\\uppercase}{}{0em}{}[\\titlerule]`,
        `\\titlespacing*{\\section}{0pt}{8pt}{4pt}`,
        ``,
        `\\begin{document}`,
        `\\pagestyle{empty}`,
        ``
    );

    // ── Header ────────────────────────────────────────────────────────────────
    const locationParts = [personal.city, personal.state, personal.zip].filter(Boolean).join(", ");
    const contactLine = [locationParts, personal.phone, esc(personal.email)].join(" \\textperiodcentered{} ");
    const linkParts: string[] = [];
    if (personal.linkedin) linkParts.push(`\\href{https://${personal.linkedin}}{${esc(personal.linkedin)}}`);
    if (personal.github) linkParts.push(`\\href{https://${personal.github}}{${esc(personal.github)}}`);
    if (personal.website) linkParts.push(`\\href{${personal.website}}{${esc(personal.website)}}`);

    lines.push(
        `{\\centering`,
        `  {\\LARGE \\textbf{${esc(personal.name)}}}\\\\[4pt]`,
        `  ${contactLine}\\\\[2pt]`,
        ...(linkParts.length > 0 ? [`  ${linkParts.join(" \\textperiodcentered{} ")}\\\\`] : []),
        `}`,
        ``
    );

    // ── Summary ───────────────────────────────────────────────────────────────
    if (summary) {
        lines.push(`\\section{Summary}`, esc(summary), ``);
    }

    // ── Experience ────────────────────────────────────────────────────────────
    if (experience.length > 0) {
        lines.push(`\\section{Experience}`);
        for (const job of experience) {
            lines.push(
                ``,
                `\\textbf{${esc(job.title)}} \\hfill \\textit{${esc(job.startDate)} -- ${esc(job.endDate)}}\\\\`,
                `\\textit{${esc(job.company)}, ${esc(job.location)}}`,
                `\\begin{itemize}`,
                ...job.bullets.map((b) => `  \\item ${esc(b)}`),
                `\\end{itemize}`
            );
        }
        lines.push(``);
    }

    // ── Education ─────────────────────────────────────────────────────────────
    if (education.length > 0) {
        lines.push(`\\section{Education}`);
        for (const edu of education) {
            const gpaPart = edu.gpa ? ` \\textperiodcentered{} GPA: ${edu.gpa}/4.0` : "";
            lines.push(
                ``,
                `\\textbf{${esc(edu.degree)}} \\hfill ${esc(edu.graduationDate)}\\\\`,
                `\\textit{${esc(edu.school)}}${gpaPart}`
            );
            if (edu.coursework && edu.coursework.length > 0) {
                lines.push(
                    `\\begin{itemize}`,
                    `  \\item \\textbf{Relevant coursework:} ${edu.coursework.map(esc).join(", ")}`,
                    `\\end{itemize}`
                );
            }
        }
        lines.push(``);
    }

    // ── Skills ────────────────────────────────────────────────────────────────
    if (skills.length > 0) {
        lines.push(`\\section{Skills}`, `\\begin{itemize}`);
        for (const s of skills) {
            lines.push(`  \\item \\textbf{${esc(s.category)}:} ${s.items.map(esc).join(", ")}`);
        }
        lines.push(`\\end{itemize}`, ``);
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    if (projects && projects.length > 0) {
        lines.push(`\\section{Projects}`);
        for (const proj of projects) {
            lines.push(
                ``,
                `\\textbf{${esc(proj.name)}} --- \\textit{${esc(proj.type)}}\\\\`,
                esc(proj.description),
                `\\begin{itemize}`,
                ...proj.bullets.map((b) => `  \\item ${esc(b)}`),
                `\\end{itemize}`
            );
        }
        lines.push(``);
    }

    // ── Certifications ────────────────────────────────────────────────────────
    if (certifications && certifications.length > 0) {
        lines.push(`\\section{Certifications}`, `\\begin{itemize}`);
        for (const cert of certifications) {
            lines.push(`  \\item ${esc(cert)}`);
        }
        lines.push(`\\end{itemize}`, ``);
    }

    lines.push(`\\end{document}`);

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
}
