#!/usr/bin/env node
// MCP server — exposes resume-building tools to Claude.
// Transport: stdio (works with Claude Desktop and VS Code Copilot).
//
// Tools:
//   load_resume    — read resume.json from the workspace
//   update_section — patch one field/section and write back to resume.json
//   export_resume  — render the current resume.json to .docx or .tex
//   build_resume   — one-shot: accept a full Resume object and export it

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { buildDocx } from "../builders/docx.js";
import { buildTex } from "../builders/tex.js";
import type { Resume } from "../types/resume.js";

const server = new McpServer({
    name: "resume-builder",
    version: "1.0.0",
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveResumePath(resumePath?: string): string {
    return path.resolve(resumePath ?? "resume.json");
}

function readResume(filePath: string): Resume {
    if (!fs.existsSync(filePath)) {
        throw new Error(`resume.json not found at ${filePath}. Run: resume-builder init`);
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Resume;
}

function writeResume(filePath: string, resume: Resume): void {
    fs.writeFileSync(filePath, JSON.stringify(resume, null, 2), "utf8");
}

// ── Tool: load_resume ─────────────────────────────────────────────────────────
// Why: Claude needs to read the current state before it can propose edits.

server.tool(
    "load_resume",
    "Load the resume.json from the workspace. Returns the full resume as JSON.",
    {
        resumePath: z.string().optional().describe("Path to resume.json (default: ./resume.json)"),
    },
    async ({ resumePath }) => {
        const filePath = resolveResumePath(resumePath);
        const resume = readResume(filePath);
        return {
            content: [{ type: "text", text: JSON.stringify(resume, null, 2) }],
        };
    }
);

// ── Tool: update_section ──────────────────────────────────────────────────────
// Why: Allows Claude to surgically update one field (e.g. an endDate) without
//      needing to rewrite the entire resume object. Uses a JSON Patch-style
//      path (dot-notation) so Claude can target deeply nested fields.
//
//  Examples:
//    path: "experience.1.endDate"    value: "December 2025"
//    path: "personal.email"          value: "new@email.com"
//    path: "experience.0.bullets.2"  value: "New bullet text"

server.tool(
    "update_section",
    `Update a single field in resume.json using dot-notation path.
Examples:
  path="experience.1.endDate"   value="December 2025"
  path="personal.email"         value="new@email.com"
  path="summary"                value="New summary text"
  path="experience.0.bullets.2" value="Updated bullet"`,
    {
        fieldPath: z.string().describe("Dot-notation path to the field, e.g. 'experience.1.endDate'"),
        value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
            .describe("The new value to set at the given path"),
        resumePath: z.string().optional().describe("Path to resume.json (default: ./resume.json)"),
    },
    async ({ fieldPath, value, resumePath }) => {
        const filePath = resolveResumePath(resumePath);
        const resume = readResume(filePath);

        // Walk the dot-notation path and set the value
        const parts = fieldPath.split(".");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let node: any = resume;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = isNaN(Number(parts[i])) ? parts[i] : Number(parts[i]);
            if (node[key] === undefined) {
                throw new Error(`Path segment "${parts[i]}" not found in resume`);
            }
            node = node[key];
        }
        const lastKey = isNaN(Number(parts[parts.length - 1]))
            ? parts[parts.length - 1]
            : Number(parts[parts.length - 1]);
        node[lastKey] = value;

        writeResume(filePath, resume);
        return {
            content: [{
                type: "text",
                text: `✅ Updated ${fieldPath} → ${JSON.stringify(value)}\nSaved to ${filePath}`,
            }],
        };
    }
);

// ── Tool: export_resume ───────────────────────────────────────────────────────
// Why: After Claude makes edits it can immediately re-render the .docx or .tex.

server.tool(
    "export_resume",
    "Render the current resume.json to a .docx or .tex file.",
    {
        format: z.enum(["docx", "tex"]).describe("Output format"),
        outputPath: z.string().optional().describe("Output file path (default: ./resume.<format>)"),
        resumePath: z.string().optional().describe("Path to resume.json (default: ./resume.json)"),
    },
    async ({ format, outputPath, resumePath }) => {
        const filePath = resolveResumePath(resumePath);
        const resume = readResume(filePath);

        const defaultName = resume.personal.name.toLowerCase().replace(/\s+/g, "_") + `_resume.${format}`;
        const out = path.resolve(outputPath ?? defaultName);

        if (format === "docx") {
            await buildDocx(resume, out);
        } else {
            buildTex(resume, out);
        }

        return {
            content: [{ type: "text", text: `✅ Exported resume to ${out}` }],
        };
    }
);

// ── Tool: build_resume ────────────────────────────────────────────────────────
// Why: One-shot tool — Claude can pass a complete Resume JSON object and get a
//      file back without needing a pre-existing resume.json on disk.

server.tool(
    "build_resume",
    "One-shot: build a resume from a full Resume JSON object and export to .docx or .tex.",
    {
        resume: z.string().describe("The full resume as a JSON string (must match Resume schema)"),
        format: z.enum(["docx", "tex"]).default("docx").describe("Output format"),
        outputPath: z.string().optional().describe("Output file path"),
        save: z.boolean().default(true).describe("Also save the JSON to resume.json"),
    },
    async ({ resume: resumeStr, format, outputPath, save }) => {
        let resume: Resume;
        try {
            resume = JSON.parse(resumeStr) as Resume;
        } catch {
            throw new Error("Invalid JSON passed to build_resume");
        }

        const defaultName = resume.personal.name.toLowerCase().replace(/\s+/g, "_") + `_resume.${format}`;
        const out = path.resolve(outputPath ?? defaultName);

        if (format === "docx") {
            await buildDocx(resume, out);
        } else {
            buildTex(resume, out);
        }

        const messages = [`✅ Built resume → ${out}`];

        if (save) {
            const jsonOut = path.resolve("resume.json");
            writeResume(jsonOut, resume);
            messages.push(`💾 Saved JSON → ${jsonOut}`);
        }

        return { content: [{ type: "text", text: messages.join("\n") }] };
    }
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
