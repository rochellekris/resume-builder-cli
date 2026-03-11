// Builds a .docx file from a Resume object.
// Mirrors the formatting established in sample/generate_sample.py,
// but driven entirely by typed data — no hardcoded content.

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    BorderStyle,
    convertInchesToTwip,
    LevelFormat,
} from "docx";
import fs from "fs";
import path from "path";
import type { Resume } from "../types/resume.js";
import { toTitleCase, capitalizeDate } from "../utils/formatters.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function hRule(): Paragraph {
    return new Paragraph({
        spacing: { before: 40, after: 40 },
        border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 },
        },
    });
}

function sectionHeading(text: string): Paragraph[] {
    return [
        new Paragraph({
            spacing: { before: 140, after: 30 },
            children: [
                new TextRun({
                    text: text.toUpperCase(),
                    bold: true,
                    size: 20, // half-points: 20 = 10pt
                    color: "464646",
                    font: "Calibri",
                }),
            ],
        }),
        hRule(),
    ];
}

function bullet(text: string, boldPrefix?: string): Paragraph {
    const children: TextRun[] = [];
    if (boldPrefix) {
        children.push(new TextRun({ text: boldPrefix, bold: true, size: 21, font: "Calibri" }));
    }
    children.push(new TextRun({ text, size: 21, font: "Calibri" }));

    return new Paragraph({
        bullet: { level: 0 },
        indent: { left: convertInchesToTwip(0.25) },
        spacing: { after: 40 },
        children,
    });
}

// ── Builder ──────────────────────────────────────────────────────────────────

export async function buildDocx(resume: Resume, outputPath: string): Promise<void> {
    const { personal, summary, experience, education, skills, projects, certifications } = resume;

    const children: Paragraph[] = [];

    // ── Header ────────────────────────────────────────────────────────────────
    children.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 50 },
            children: [new TextRun({ text: personal.name, bold: true, size: 44, font: "Calibri", color: "1E1E1E" })],
        })
    );

    const locationParts = [personal.city, personal.state, personal.zip].filter(Boolean).join(", ");
    children.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
                new TextRun({
                    text: [locationParts, personal.phone, personal.email].join("  ·  "),
                    size: 21,
                    color: "3C3C3C",
                    font: "Calibri",
                }),
            ],
        })
    );

    const links = [personal.linkedin, personal.github, personal.website].filter(Boolean) as string[];
    if (links.length > 0) {
        children.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [new TextRun({ text: links.join("  ·  "), size: 21, color: "3C3C3C", font: "Calibri" })],
            })
        );
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    if (summary) {
        children.push(...sectionHeading("Summary"));
        children.push(
            new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: summary, size: 21, font: "Calibri" })],
            })
        );
    }

    // ── Experience ────────────────────────────────────────────────────────────
    if (experience.length > 0) {
        children.push(...sectionHeading("Experience"));
        for (const job of experience) {
            const dateRange = `${capitalizeDate(job.startDate)} – ${capitalizeDate(job.endDate)}`;
            children.push(
                new Paragraph({
                    spacing: { before: 80, after: 0 },
                    children: [new TextRun({ text: toTitleCase(job.title), bold: true, size: 22, font: "Calibri" })],
                }),
                new Paragraph({
                    spacing: { before: 0, after: 50 },
                    children: [
                        new TextRun({
                            text: `${job.company}, ${job.location}  ·  ${dateRange}`,
                            italics: true,
                            size: 21,
                            color: "5A5A5A",
                            font: "Calibri",
                        }),
                    ],
                }),
                ...job.bullets.map((b) => bullet(b))
            );
        }
    }

    // ── Education ─────────────────────────────────────────────────────────────
    if (education.length > 0) {
        children.push(...sectionHeading("Education"));
        for (const edu of education) {
            const meta = [edu.school, capitalizeDate(edu.graduationDate), edu.gpa ? `GPA: ${edu.gpa} / 4.0` : undefined]
                .filter(Boolean)
                .join("  ·  ");
            children.push(
                new Paragraph({
                    spacing: { before: 80, after: 0 },
                    children: [new TextRun({ text: toTitleCase(edu.degree), bold: true, size: 22, font: "Calibri" })],
                }),
                new Paragraph({
                    spacing: { before: 0, after: 50 },
                    children: [new TextRun({ text: meta, italics: true, size: 21, color: "5A5A5A", font: "Calibri" })],
                })
            );
            if (edu.coursework && edu.coursework.length > 0) {
                children.push(bullet(edu.coursework.join(", "), "Relevant coursework: "));
            }
        }
    }

    // ── Skills ────────────────────────────────────────────────────────────────
    if (skills.length > 0) {
        children.push(...sectionHeading("Skills"));
        for (const s of skills) {
            children.push(bullet(s.items.join(", "), `${toTitleCase(s.category)}: `));
        }
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    if (projects && projects.length > 0) {
        children.push(...sectionHeading("Projects"));
        for (const proj of projects) {
            children.push(
                new Paragraph({
                    spacing: { before: 80, after: 20 },
                    children: [
                        new TextRun({ text: toTitleCase(proj.name), bold: true, size: 22, font: "Calibri" }),
                        new TextRun({ text: `  —  ${proj.type}`, italics: true, size: 21, color: "5A5A5A", font: "Calibri" }),
                    ],
                }),
                new Paragraph({
                    spacing: { before: 0, after: 50 },
                    children: [new TextRun({ text: proj.description, size: 21, font: "Calibri" })],
                }),
                ...proj.bullets.map((b) => bullet(b))
            );
        }
    }

    // ── Certifications ────────────────────────────────────────────────────────
    if (certifications && certifications.length > 0) {
        children.push(...sectionHeading("Certifications"));
        for (const cert of certifications) {
            children.push(bullet(cert));
        }
    }

    // ── Assemble document ────────────────────────────────────────────────────
    const doc = new Document({
        numbering: {
            config: [
                {
                    reference: "default-bullet",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.BULLET,
                            text: "\u2022",
                            alignment: AlignmentType.LEFT,
                            style: {
                                paragraph: {
                                    indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.15) },
                                },
                            },
                        },
                    ],
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: convertInchesToTwip(0.75),
                            bottom: convertInchesToTwip(0.75),
                            left: convertInchesToTwip(0.85),
                            right: convertInchesToTwip(0.85),
                        },
                    },
                },
                children,
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, buffer);
}
