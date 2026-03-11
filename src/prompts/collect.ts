// Interactive CLI prompts that collect Resume data section by section.
// Uses Inquirer.js v13 (ESM). Returns a fully typed Resume object.

import inquirer from "inquirer";
import type {
    Resume,
    PersonalInfo,
    ExperienceEntry,
    EducationEntry,
    SkillCategory,
    ProjectEntry,
} from "../types/resume.js";

// ── Personal Info ─────────────────────────────────────────────────────────

async function collectPersonal(): Promise<PersonalInfo> {
    console.log("\n── Personal Info ─────────────────────────────────");
    const answers = await inquirer.prompt([
        { name: "name", message: "Full name:", type: "input" },
        { name: "city", message: "City:", type: "input" },
        { name: "state", message: "State (e.g. CA):", type: "input" },
        { name: "zip", message: "ZIP code (optional):", type: "input" },
        { name: "phone", message: "Phone:", type: "input" },
        { name: "email", message: "Email:", type: "input" },
        { name: "linkedin", message: "LinkedIn URL (optional):", type: "input" },
        { name: "github", message: "GitHub URL (optional):", type: "input" },
        { name: "website", message: "Website (optional):", type: "input" },
    ]);
    return answers as PersonalInfo;
}

// ── Summary ───────────────────────────────────────────────────────────────

async function collectSummary(): Promise<string | undefined> {
    console.log("\n── Summary ───────────────────────────────────────");
    const { summary } = await inquirer.prompt([
        { name: "summary", message: "Professional summary (leave blank to skip):", type: "input" },
    ]);
    return summary || undefined;
}

// ── Experience ────────────────────────────────────────────────────────────

async function collectOneJob(index: number): Promise<ExperienceEntry> {
    console.log(`\n  Job #${index + 1}`);
    const base = await inquirer.prompt([
        { name: "title", message: "Job title:", type: "input" },
        { name: "company", message: "Company:", type: "input" },
        { name: "location", message: "Location:", type: "input" },
        { name: "startDate", message: "Start date (e.g. June 2022):", type: "input" },
        { name: "endDate", message: "End date (e.g. Present):", type: "input" },
    ]);

    const bullets: string[] = [];
    console.log(`  Enter bullet points (blank line to finish):`);
    while (true) {
        const { bullet } = await inquirer.prompt([
            { name: "bullet", message: `  Bullet ${bullets.length + 1}:`, type: "input" },
        ]);
        if (!bullet.trim()) break;
        bullets.push(bullet.trim());
    }

    return { ...base, bullets } as ExperienceEntry;
}

async function collectExperience(): Promise<ExperienceEntry[]> {
    console.log("\n── Experience ────────────────────────────────────");
    const jobs: ExperienceEntry[] = [];
    let addMore = true;
    while (addMore) {
        jobs.push(await collectOneJob(jobs.length));
        const { more } = await inquirer.prompt([
            { name: "more", message: "Add another position?", type: "confirm", default: false },
        ]);
        addMore = more;
    }
    return jobs;
}

// ── Education ─────────────────────────────────────────────────────────────

async function collectOneEdu(index: number): Promise<EducationEntry> {
    console.log(`\n  Education #${index + 1}`);
    const base = await inquirer.prompt([
        { name: "degree", message: "Degree (e.g. B.S. Computer Science):", type: "input" },
        { name: "school", message: "School:", type: "input" },
        { name: "location", message: "Location:", type: "input" },
        { name: "graduationDate", message: "Graduation date (e.g. May 2020):", type: "input" },
        { name: "gpa", message: "GPA (optional):", type: "input" },
    ]);

    const coursework: string[] = [];
    const { addCourses } = await inquirer.prompt([
        { name: "addCourses", message: "Add relevant coursework?", type: "confirm", default: false },
    ]);
    if (addCourses) {
        console.log(`  Enter courses (blank line to finish):`);
        while (true) {
            const { course } = await inquirer.prompt([
                { name: "course", message: `  Course ${coursework.length + 1}:`, type: "input" },
            ]);
            if (!course.trim()) break;
            coursework.push(course.trim());
        }
    }

    return { ...base, gpa: base.gpa || undefined, coursework: coursework.length ? coursework : undefined } as EducationEntry;
}

async function collectEducation(): Promise<EducationEntry[]> {
    console.log("\n── Education ─────────────────────────────────────");
    const entries: EducationEntry[] = [];
    let addMore = true;
    while (addMore) {
        entries.push(await collectOneEdu(entries.length));
        const { more } = await inquirer.prompt([
            { name: "more", message: "Add another education entry?", type: "confirm", default: false },
        ]);
        addMore = more;
    }
    return entries;
}

// ── Skills ────────────────────────────────────────────────────────────────

async function collectSkills(): Promise<SkillCategory[]> {
    console.log("\n── Skills ────────────────────────────────────────");
    const categories: SkillCategory[] = [];
    let addMore = true;
    while (addMore) {
        const { category, itemsRaw } = await inquirer.prompt([
            { name: "category", message: "Skill category (e.g. Languages):", type: "input" },
            { name: "itemsRaw", message: "Skills (comma-separated):", type: "input" },
        ]);
        categories.push({ category, items: itemsRaw.split(",").map((s: string) => s.trim()).filter(Boolean) });
        const { more } = await inquirer.prompt([
            { name: "more", message: "Add another skill category?", type: "confirm", default: false },
        ]);
        addMore = more;
    }
    return categories;
}

// ── Projects ──────────────────────────────────────────────────────────────

async function collectOneProject(index: number): Promise<ProjectEntry> {
    console.log(`\n  Project #${index + 1}`);
    const base = await inquirer.prompt([
        { name: "name", message: "Project name:", type: "input" },
        { name: "type", message: "Type (e.g. Personal Project):", type: "input" },
        { name: "description", message: "One-line description:", type: "input" },
    ]);

    const bullets: string[] = [];
    console.log(`  Enter bullet points (blank line to finish):`);
    while (true) {
        const { bullet } = await inquirer.prompt([
            { name: "bullet", message: `  Bullet ${bullets.length + 1}:`, type: "input" },
        ]);
        if (!bullet.trim()) break;
        bullets.push(bullet.trim());
    }

    return { ...base, bullets } as ProjectEntry;
}

async function collectProjects(): Promise<ProjectEntry[] | undefined> {
    console.log("\n── Projects ──────────────────────────────────────");
    const { hasProjects } = await inquirer.prompt([
        { name: "hasProjects", message: "Add projects section?", type: "confirm", default: false },
    ]);
    if (!hasProjects) return undefined;

    const projects: ProjectEntry[] = [];
    let addMore = true;
    while (addMore) {
        projects.push(await collectOneProject(projects.length));
        const { more } = await inquirer.prompt([
            { name: "more", message: "Add another project?", type: "confirm", default: false },
        ]);
        addMore = more;
    }
    return projects;
}

// ── Certifications ────────────────────────────────────────────────────────

async function collectCertifications(): Promise<string[] | undefined> {
    console.log("\n── Certifications ────────────────────────────────");
    const { hasCerts } = await inquirer.prompt([
        { name: "hasCerts", message: "Add certifications?", type: "confirm", default: false },
    ]);
    if (!hasCerts) return undefined;

    const certs: string[] = [];
    console.log(`  Enter certifications (blank line to finish):`);
    while (true) {
        const { cert } = await inquirer.prompt([
            { name: "cert", message: `  Cert ${certs.length + 1}:`, type: "input" },
        ]);
        if (!cert.trim()) break;
        certs.push(cert.trim());
    }
    return certs.length ? certs : undefined;
}

// ── Main export ───────────────────────────────────────────────────────────

export async function collectResume(): Promise<Resume> {
    console.log("\n🗂  Resume Builder — let's build your resume.\n");
    const personal = await collectPersonal();
    const summary = await collectSummary();
    const experience = await collectExperience();
    const education = await collectEducation();
    const skills = await collectSkills();
    const projects = await collectProjects();
    const certifications = await collectCertifications();

    return { personal, summary, experience, education, skills, projects, certifications };
}
