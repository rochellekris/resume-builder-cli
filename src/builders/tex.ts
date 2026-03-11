// Builds a .tex file from a Resume object and compiles it to PDF via pdflatex.

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import type { Resume } from "../types/resume.js";
import { toTitleCase, capitalizeDate } from "../utils/formatters.js";

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
                `\\textbf{${esc(toTitleCase(job.title))}} \\hfill \\textit{${esc(capitalizeDate(job.startDate))} -- ${esc(capitalizeDate(job.endDate))}}\\\\`,
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
                `\\textbf{${esc(toTitleCase(edu.degree))}} \\hfill ${esc(capitalizeDate(edu.graduationDate))}\\\\`,
                `\\textit{${esc(edu.school)}}${gpaPart}`
            );
            if (edu.coursework && edu.coursework.length > 0) {
                lines.push(
                    `\\begin{itemize}`,
                    `  \\item \\textbf{Relevant Coursework:} ${edu.coursework.map(esc).join(", ")}`,
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
            lines.push(`  \\item \\textbf{${esc(toTitleCase(s.category))}:} ${s.items.map(esc).join(", ")}`);
        }
        lines.push(`\\end{itemize}`, ``);
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    if (projects && projects.length > 0) {
        lines.push(`\\section{Projects}`);
        for (const proj of projects) {
            lines.push(
                ``,
                `\\textbf{${esc(toTitleCase(proj.name))}} --- \\textit{${esc(proj.type)}}\\\\`,
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

    // ── Compile to PDF ────────────────────────────────────────────────────────
    const pdflatex = resolvePdflatex();

    if (!pdflatex) {
        console.warn(`⚠️   pdflatex not found — skipping PDF compilation.`);
        console.warn(`    Install a TeX distribution or set the PDFLATEX_PATH environment variable:`);
        console.warn(`      macOS:   brew install --cask mactex-no-gui`);
        console.warn(`      Windows: https://miktex.org/download`);
        console.warn(`      Linux:   sudo apt install texlive-latex-base`);
        return;
    }

    console.log(`\n🔧  Compiling PDF...`);
    const result = spawnSync(pdflatex, ["-interaction=nonstopmode", outputPath], {
        cwd: dir,
        encoding: "utf8",
    });

    if (result.status === 0) {
        const pdfPath = outputPath.replace(/\.tex$/, ".pdf");
        console.log(`📄  PDF saved: ${pdfPath}`);
    } else {
        console.error(`❌  pdflatex failed (exit ${result.status})`);
        console.error(result.stdout?.split("\n").filter((l) => l.startsWith("!")).join("\n"));
    }
}

// ── Resolve pdflatex path ─────────────────────────────────────────────────────
function resolvePdflatex(): string | null {
    // 1. Explicit override always wins
    if (process.env.PDFLATEX_PATH) return process.env.PDFLATEX_PATH;

    // 2. Check if it's already on PATH (works after a fresh install on any OS)
    const onPath = spawnSync("pdflatex", ["--version"], { encoding: "utf8" });
    if (onPath.status === 0) return "pdflatex";

    // 3. Fallback to known default install locations per platform
    const candidates: string[] =
        process.platform === "win32"
            ? [
                "C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe",
                "C:\\Program Files (x86)\\MiKTeX\\miktex\\bin\\pdflatex.exe",
            ]
            : process.platform === "darwin"
                ? [
                    "/usr/local/texlive/2026/bin/universal-darwin/pdflatex",
                    "/usr/local/texlive/2025/bin/universal-darwin/pdflatex",
                    "/usr/local/texlive/2024/bin/universal-darwin/pdflatex",
                    "/Library/TeX/texbin/pdflatex",
                ]
                : [
                    "/usr/bin/pdflatex",
                    "/usr/local/bin/pdflatex",
                ];

    return candidates.find((p) => fs.existsSync(p)) ?? null;
}
