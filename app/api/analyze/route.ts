import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import Mustache from "mustache";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  // Declare resumeData outside try block so it's accessible in catch block
  let resumeData: any = undefined;

  try {
    const {
      account,
      jd,
      resumeContent,
      template: requestedTemplate,
      profileData,
      apiProvider = "anthropic", // Default to Anthropic if not specified
    } = await request.json();

    if (!jd || !resumeContent) {
      return NextResponse.json(
        { error: "Job description and resume content are required" },
        { status: 400 }
      );
    }

    // Check API key based on selected provider
    if (apiProvider === "openai" && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }
    if (apiProvider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key is not configured" },
        { status: 500 }
      );
    }

    // Master prompt that combines JD and resume content
    const masterPrompt = `You are a professional resume writer. Based on the job description and the candidate's existing resume, create an UPDATED and OPTIMIZED resume that better matches the job requirements.

========================================
CRITICAL: THIS IS NOT A STYLING EXERCISE
========================================
Your task is to GENERATE AN UPDATED RESUME that matches the target job, NOT to style the existing resume.

YOU MUST:
1. REWRITE all experience entries - Do NOT copy bullets verbatim from input
2. UPDATE achievements to highlight JD-relevant skills, technologies, and accomplishments
3. ADD JD-required technologies, tools, and responsibilities even if not in original resume
4. REORGANIZE experience bullets to prioritize JD-relevant work
5. REMOVE or DE-EMPHASIZE experience that doesn't align with the JD
6. ENSURE every experience bullet point is rewritten to better match the JD requirements
7. GENERATE NEW experience content - Do NOT simply copy the default resume experience entries

The input resume is a REFERENCE for:
- Job titles, companies, and dates (keep these)
- Overall career trajectory and seniority level
- Professional tone and style

CRITICAL: PRESERVE CONTACT INFORMATION EXACTLY
- You MUST preserve the exact contact information from the input resume:
  - name: Use the EXACT name from the input resume
  - email: Use the EXACT email from the input resume
  - phone: Use the EXACT phone number from the input resume
  - location: Use the EXACT location/address from the input resume (DO NOT change or update it)
  - linkedin: Use the EXACT LinkedIn URL from the input resume
- DO NOT modify, update, or change any contact information
- DO NOT infer or generate new contact details

The input resume is NOT a template to copy from. You must GENERATE NEW CONTENT that aligns with the JD.
========================================

Job Description:
${jd}

Existing Resume Content (USE AS REFERENCE ONLY - DO NOT COPY VERBATIM):
${resumeContent}

Please provide ONLY the updated resume in the following JSON format (return ONLY this JSON object, nothing else):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "Phone Number",
  "location": "City, State/Country",
  "linkedin": "LinkedIn URL",
  "summary": "Professional summary optimized for this job",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "hardSkills": {
    "skill category": ["skill 1", "skill 2", "skill 3"]
  },
  "softSkills": ["skill 1", "skill 2", "skill 3"],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "graduationDate": "MM/YYYY",
      "gpa": "GPA if applicable"
    }
  ],
  "certifications": ["Certification 1", "Certification 2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["Tech 1", "Tech 2"]
    }
  ]
}

Important: 
----------------------------------------
OUTPUT (STRICT)
----------------------------------------
- Return VALID JSON ONLY
- Must follow the provided reference JSON structure exactly
- No extra keys
- No comments
- No explanations
- Field ordering must match the reference JSON
- Arrays must preserve ordering

----------------------------------------
JOB DESCRIPTION (JD) INPUT
----------------------------------------
- JD will be provided as raw text
- You must:
  - Parse mandatory, optional, preferred, and nice-to-have, bonus requirements
  - Extract tools, technologies, methodologies, and domain language
  - Align the resume perfectly to the JD

----------------------------------------
REFERENCE BASELINE (UPDATED DEFINITION)
----------------------------------------
- The reference JSON is used only for:
  - Resume format
  - Seniority level
  - Professional tone
  - Career profile consistency
  - Job titles and company names (keep same, but update content)
- The reference does NOT constrain:
  - Exact tools (ADD JD-required tools even if not in original)
  - Exact responsibilities (REWRITE to match JD)
  - Exact achievements (UPDATE to highlight JD-relevant work)
- The generated resume must:
  - Perfectly align with the JD (THIS IS THE PRIMARY GOAL)
  - REWRITE experience content to match JD requirements
  - Still sound realistic for a senior IC with comparable experience
- Do not downgrade seniority or introduce managerial scope unless JD explicitly requires it
- CRITICAL: Use the input resume as a REFERENCE for structure and timeline, but REWRITE all content to match the JD

----------------------------------------
TITLE RULES (STRICT)
----------------------------------------
- Parse the JD and select ONE title
- If multiple JD titles exist:
  - Select the closest senior IC title
  - Must be non-managerial
  - Must align with baseline seniority
- Use the same title in:
  - Root-level "title"
  - Luxoft job title
- No drastic career shifts (Engineer → Architect → Manager)

----------------------------------------
SUMMARY RULES (STRICT)
----------------------------------------
- Fewer than 100 words
- Fully aligned with the JD and experience sections
- Include EXACTLY two unique metrics
- Metrics must:
  - Appear elsewhere in the resume
  - Not contradict experience sections
- Avoid verbs already used 3 times elsewhere

----------------------------------------
WORK HISTORY RULES (GLOBAL) - CRITICAL UPDATE REQUIREMENTS
----------------------------------------
- YOU MUST REWRITE ALL EXPERIENCE ENTRIES - DO NOT COPY FROM INPUT
- CRITICAL: The experience section in the input resume is ONLY a reference for:
  - Job titles, company names, and date ranges (keep these)
  - Overall work history structure
- CRITICAL: You MUST GENERATE NEW achievement bullets for each experience entry
- DO NOT copy achievement bullets from the input resume
- DO NOT use the default resume experience content as-is
- Each experience entry must be COMPLETELY REWRITTEN to:
  - Highlight JD-relevant technologies, tools, and methodologies
  - Emphasize achievements that align with JD requirements
  - Include JD-required skills even if not in original resume
  - Reorder bullets to prioritize JD-relevant work
  - Generate fresh, JD-optimized content
- Include all JD-required tools and technologies (add them even if not in original)
- Optional / preferred/ bonus / nice-to-have JD items must also be included
- Experience bullets must reflect:
  - Realistic timelines
  - Natural technical evolution
  - JD alignment (this is the PRIMARY goal)
- Cross-functional collaboration is required in all roles
- Stakeholder interaction must be explicit
- CRITICAL: Do NOT duplicate experience entries. Each job (title + company + startDate) must appear only ONCE in the experience array
- CRITICAL: Do NOT copy experience bullets verbatim - GENERATE NEW content that matches the JD

----------------------------------------
TECHNOLOGY TIMELINE RULES (STRICT)
----------------------------------------
- Technologies must be realistic for the role's date range
- No anachronistic tooling
- Cloud, DevOps, and frontend evolution must follow industry timelines

----------------------------------------
METRICS RULES (STRICT)
----------------------------------------
Metrics must be mixed across the resume with uneven distribution across roles allowed.

Metric Types (ALL REQUIRED)
1) Exact Metrics
   - Percentages not divisible by 5
   - Must include measurement context
2) Approximate Metrics
   - Percentages divisible by 5
   - Must use approximation language
3) Phrase-Based Metrics
   - Non-numeric (e.g., doubled, cut in half, one-third)

Global Constraints
- No reused metric values or phrases
- Metrics must be believable and contextual
- Metrics must align with described work

----------------------------------------
SKILLS RULES (UPDATED – STRICT)
----------------------------------------
Hard Skills (MANDATORY)
- Must be organized by category:
  - Backend
  - Frontend
  - Cloud
  - Data
  - Tools
  - Industry
  - Mobile (ONLY if JD includes mobile tone)
- Each included category must contain 6–10 skills
- Mobile category:
  - Included only if JD has mobile focus
  - Otherwise omitted
- Industry category:
  - Always included
  - Must reflect healthcare, fintech, or eCommerce
- Hard skills must:
  - Appear in experience bullets
  - Align with JD
  - Reflect senior-level breadth
  - Be technical, measurable, and job-specific

Soft Skills (MANDATORY)
- Must include 8–12 soft skills
- Should include a mix of:
  - Leadership: Team Leadership, Mentoring, Cross-functional Collaboration
  - Communication: Stakeholder Management, Technical Communication, Presentation Skills
  - Problem-solving: Critical Thinking, Analytical Thinking, Strategic Planning
  - Adaptability: Agile Methodologies, Change Management, Fast-paced Environments
- Soft skills must:
  - Align with JD requirements
  - Reflect senior-level competencies
  - Be relevant to the role

----------------------------------------
LANGUAGE RULES (STRICT)
----------------------------------------
Action Verbs
- Across the entire resume, each action verb may appear at most 3 times
- Applies to:
  - Summary
  - Responsibilities
  - Achievements

Forbidden Verbs
- helped
- assisted
- participated
- supported
- worked on
- collaborated
- contributed

Style Rules
- Each bullet must start with a strong action verb
- Avoid filler words:
  - very, highly, really, various, multiple, numerous, significant, some, many, things, stuff
- Prefer precise verbs:
  - re-architected, instrumented, standardized, orchestrated, stabilized, automated

----------------------------------------
CONSISTENCY & REALISM
----------------------------------------
- No contradictions between:
  - Skills and experience
  - Metrics and responsibilities
- Resume must:
  - Read as a refined, senior-level profile
  - Align tightly with the JD
  - Remain recruiter-trustworthy

----------------------------------------
INDUSTRY BUZZWORDS (MANDATORY VOCABULARY)
----------------------------------------

Healthcare Interoperability & Standards
• HL7 v2
• FHIR (Fast Healthcare Interoperability Resources) – FHIR R4
• CCD / C-CDA
• SMART on FHIR
• FHIR APIs
• Clinical Data Exchange
• Healthcare Messaging
• Interoperability

EMR / EHR & Clinical Systems
• EMR / EHR Systems
• Epic
• Cerner (Oracle Health)
• Athenahealth
• Allscripts
• Clinical Workflows
• Longitudinal Patient Records
• Care Coordination
• Provider Directory
• Clinical Decision Support (CDS)

Healthcare Compliance & Security
• HIPAA Compliance
• PHI / PII
• Audit Logging
• Privacy-by-Design
• Role-Based Access Control (RBAC)
• Data Encryption (At Rest / In Transit)
• SOC 2 (Healthcare SaaS)

Claims, Payers & Revenue Cycle
• Claims Processing
• Eligibility & Benefits
• Prior Authorization
• Utilization Management
• Claims Adjudication
• Revenue Cycle Management (RCM)
• Explanation of Benefits (EOB)

Digital Health & Virtual Care
• Digital Health Platforms
• Virtual Care
• Telehealth / Telemedicine
• Mental Health Platforms
• Patient Engagement
• Asynchronous Care
• Remote Care
• Behavioral Health Technology

Healthcare Architecture & Platform Engineering
• Event-Driven Architecture
• CQRS
• Microservices
• FHIR-First Architecture
• Real-Time Clinical Data Streaming
• High Availability Healthcare Systems
• Patient-Facing Applications
• Clinician-Facing Applications

Fintech Buzzwords
Payments & Transaction Processing
• Payment Processing
• Payment Orchestration
• Authorization, Capture, Settlement
• Payment Gateways
• Payment Rails
• ACH / SEPA / SWIFT
• Real-Time Payments (RTP)
• Idempotent Payments
• Transaction Lifecycle
• Reconciliation

FinTech Compliance & Security
• PCI DSS Compliance
• PSD2
• Strong Customer Authentication (SCA)
• Tokenization
• Encryption (At Rest / In Transit)
• Fraud Prevention
• Risk Controls
• Secure Payment Flows
• Audit Trails
• Financial Data Security

Banking & Financial Systems
• Core Banking Systems
• Ledger Systems
• Double-Entry Accounting
• Account Balances
• Clearing & Settlement
• Transaction Journals
• Funds Availability
• Interest Calculation
• Fee Calculation Engines

Fraud, Risk & Trust
• Fraud Detection
• Risk Scoring
• Transaction Monitoring
• Velocity Checks
• Anomaly Detection
• Chargebacks
• Dispute Management
• AML (Anti-Money Laundering)
• KYC (Know Your Customer)
• KYB (Know Your Business)

FinTech Architecture & Platform Engineering
• Event-Driven Architecture
• CQRS
• Microservices
• Distributed Transactions
• Idempotency
• Exactly-Once Processing
• High-Throughput Systems
• Low-Latency Systems
• Scalable Payment Platforms
• Financial Data Pipelines

Digital Wallets, Lending & Consumer FinTech
• Digital Wallets
• Balance Management
• Peer-to-Peer Payments
• Buy Now, Pay Later (BNPL)
• Credit Scoring
• Loan Origination
• Repayment Schedules
• Interest Accrual
• Consumer Financial Products

ECommerce Buzzwords
Core eCommerce Platform Concepts
• Product Catalog
• SKU Management
• Inventory Management
• Pricing Engine
• Promotions & Discounts
• Cart & Checkout
• Order Management System (OMS)
• Order Lifecycle
• Fulfillment
• Returns & Refunds

Checkout, Payments & Conversion
• Checkout Optimization
• Payment Orchestration
• Payment Gateways
• Authorization & Settlement
• Conversion Rate Optimization (CRO)
• Abandoned Cart Recovery
• Fraud Prevention
• Taxes & Duties
• Multi-Currency Payments

Marketplace & Merchandising
• Marketplace Platforms
• Third-Party Sellers
• Catalog Ingestion
• Search & Discovery
• Product Recommendations
• Personalization
• Merchandising Rules
• A/B Testing

Order Fulfillment & Logistics
• Warehouse Management Systems (WMS)
• Shipping Rate Calculation
• Carrier Integrations
• Order Routing
• Split Shipments
• Last-Mile Delivery
• Reverse Logistics

eCommerce Architecture & Scale
• High-Traffic Systems
• Event-Driven Architecture
• Microservices
• CQRS
• Distributed Transactions
• Idempotency
• Scalable Retail Platforms
• Peak Traffic Handling

Customer Experience & Analytics
• Customer Journey
• User Session Management
• Behavioral Analytics
• Clickstream Data
• Real-Time Dashboards
• Customer Retention
• Loyalty Programs

----------------------------------------
JSON SCHEMA
----------------------------------------
- Follow the provided reference JSON exactly
- No additional schema definitions will be provided
- Deviations are not allowed

Return ONLY valid JSON, no additional text, no markdown formatting, no code blocks.`;

    // Handle API provider selection
    let jsonText: string;
    let analysisResult: any;

    if (apiProvider === "openai") {
      // OpenAI API call
      const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
      const OPENAI_FALLBACK_MODELS = [
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
      ];

      let openaiResponse;
      let lastError: any = null;
      const openaiModelsToTry = [
        OPENAI_MODEL,
        ...OPENAI_FALLBACK_MODELS.filter((m) => m !== OPENAI_MODEL),
      ];

      for (const modelToTry of openaiModelsToTry) {
        try {
          console.log(`Attempting to use OpenAI model: ${modelToTry}`);
          openaiResponse = await openai.chat.completions.create({
            model: modelToTry,
            messages: [
              {
                role: "system",
                content:
                  "You are a professional resume writer. Return ONLY valid JSON, no additional text, no markdown formatting, no code blocks.",
              },
              {
                role: "user",
                content: masterPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: "json_object" },
          });
          console.log(`Successfully used OpenAI model: ${modelToTry}`);
          break; // Success, exit the loop
        } catch (openaiError: any) {
          lastError = openaiError;
          console.error(
            `OpenAI model ${modelToTry} failed:`,
            openaiError.status || openaiError.statusCode,
            openaiError.message
          );

          // If it's not a 403 (access denied), don't try other models
          if (openaiError.status !== 403 && openaiError.statusCode !== 403) {
            break;
          }
          // Continue to next model if it's a 403
        }
      }

      // If all models failed, return error
      if (!openaiResponse) {
        console.error("All OpenAI models failed. Last error:", lastError);
        const errorStatus = lastError?.status || lastError?.statusCode || 500;
        const errorMessage =
          lastError?.message || lastError?.error?.message || "Unknown error";

        if (errorStatus === 403) {
          return NextResponse.json(
            {
              error: `OpenAI API access denied. Your account may not have access to the requested models. Tried: ${openaiModelsToTry.join(
                ", "
              )}. Error: ${errorMessage}. Please check your OpenAI account access or try a different model in OPENAI_MODEL.`,
            },
            { status: 403 }
          );
        }
        if (errorStatus === 401) {
          return NextResponse.json(
            {
              error:
                "OpenAI API authentication failed. Please check your OPENAI_API_KEY in .env.local.",
            },
            { status: 401 }
          );
        }
        // Re-throw other errors to be handled by outer catch
        throw lastError;
      }

      // Extract the text content from OpenAI response
      jsonText = openaiResponse.choices[0]?.message?.content || "";
    } else {
      // Anthropic API call (default)
      const ANTHROPIC_MODEL =
        process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
      const ANTHROPIC_FALLBACK_MODELS = [
        "claude-3-5-sonnet-20241022",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
      ];

      let message;
      let lastError: any = null;
      const modelsToTry = [
        ANTHROPIC_MODEL,
        ...ANTHROPIC_FALLBACK_MODELS.filter((m) => m !== ANTHROPIC_MODEL),
      ];

      for (const modelToTry of modelsToTry) {
        try {
          console.log(`Attempting to use Anthropic model: ${modelToTry}`);
          message = await anthropic.messages.create({
            model: modelToTry,
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: masterPrompt,
              },
            ],
          });
          console.log(`Successfully used Anthropic model: ${modelToTry}`);
          break; // Success, exit the loop
        } catch (anthropicError: any) {
          lastError = anthropicError;
          console.error(
            `Anthropic model ${modelToTry} failed:`,
            anthropicError.status || anthropicError.statusCode,
            anthropicError.message
          );

          // If it's not a 403 (access denied), don't try other models
          if (
            anthropicError.status !== 403 &&
            anthropicError.statusCode !== 403
          ) {
            break;
          }
          // Continue to next model if it's a 403
        }
      }

      // If all models failed, return error
      if (!message) {
        console.error("All Anthropic models failed. Last error:", lastError);
        const errorStatus = lastError?.status || lastError?.statusCode || 500;
        const errorMessage =
          lastError?.message || lastError?.error?.message || "Unknown error";

        if (errorStatus === 403) {
          return NextResponse.json(
            {
              error: `Anthropic API access denied. Your account may not have access to the requested models. Tried: ${modelsToTry.join(
                ", "
              )}. Error: ${errorMessage}. Please check your Anthropic account access or try a different model in ANTHROPIC_MODEL.`,
            },
            { status: 403 }
          );
        }
        if (errorStatus === 401) {
          return NextResponse.json(
            {
              error:
                "Anthropic API authentication failed. Please check your ANTHROPIC_API_KEY in .env.local.",
            },
            { status: 401 }
          );
        }
        // Re-throw other errors to be handled by outer catch
        throw lastError;
      }

      // Extract the text content from Anthropic response
      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type from Anthropic API");
      }
      jsonText = content.text.trim();
    }

    // Parse the JSON response (works for both APIs)
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedJsonText = jsonText.trim();
      if (cleanedJsonText.startsWith("```json")) {
        cleanedJsonText = cleanedJsonText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "");
      } else if (cleanedJsonText.startsWith("```")) {
        cleanedJsonText = cleanedJsonText.replace(/```\n?/g, "");
      }
      analysisResult = JSON.parse(cleanedJsonText);
    } catch (parseError) {
      // If parsing fails, return a structured error response
      console.error("Failed to parse JSON response:", jsonText);
      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          rawResponse: jsonText,
        },
        { status: 500 }
      );
    }

    // Return only the resume JSON (remove any analysis fields if present)
    resumeData = analysisResult.updatedResume || analysisResult;

    // Merge profile data (company details, skills, education, etc.) to ensure they're always included
    if (profileData) {
      // Merge company details into experience
      if (
        profileData.company_1 ||
        profileData.company_2 ||
        profileData.company_3
      ) {
        const profileCompanies = [
          profileData.company_1,
          profileData.company_2,
          profileData.company_3,
        ].filter(Boolean);

        if (profileCompanies.length > 0) {
          // Merge profile companies with AI-generated experience
          const existingExperience = resumeData.experience || [];
          const profileExperience = profileCompanies.map((comp: any) => ({
            title: comp.title || "",
            company: comp.company || "",
            startDate: comp.startDate || "",
            endDate: comp.endDate || "",
            achievements: comp.achievements || [],
          }));

          // Combine and deduplicate - AI-generated experience takes priority (it's optimized for JD)
          // SIMPLE RULE: First occurrence wins, all others with same company+dates are skipped
          // AI-generated experience comes first, so it takes priority over profile experience
          const combined = [...existingExperience, ...profileExperience];
          const finalMerged: any[] = [];
          const seenCompanyDates = new Set<string>();

          for (const exp of combined) {
            // Key: company + dates (same company, same dates = duplicate, even if title differs)
            const companyDateKey = `${exp.company || ""}|${
              exp.startDate || ""
            }|${exp.endDate || ""}`
              .toLowerCase()
              .trim();

            // Simple check: if we've seen this company+date combo, skip it entirely
            // Since AI-generated experience comes first, it takes priority over profile experience
            if (!seenCompanyDates.has(companyDateKey)) {
              seenCompanyDates.add(companyDateKey);
              finalMerged.push(exp);
            } else {
              // Duplicate - skip it (AI-generated experience already in array takes priority)
              console.log(
                `Merge phase: Skipping duplicate experience (AI-generated takes priority):`,
                exp.title,
                exp.company,
                exp.startDate,
                exp.endDate
              );
            }
          }

          resumeData.experience = finalMerged;
        }
      }

      // Merge hardSkills from profile
      if (profileData.default_resume?.hardSkills) {
        resumeData.hardSkills = {
          ...profileData.default_resume.hardSkills,
          ...(resumeData.hardSkills || {}),
        };
      } else if (profileData.default_resume?.skills) {
        // Backward compatibility: if profile has old "skills" format, convert to hardSkills
        resumeData.hardSkills = {
          ...profileData.default_resume.skills,
          ...(resumeData.hardSkills || {}),
        };
      }
      // Merge softSkills from profile
      if (profileData.default_resume?.softSkills) {
        const profileSoftSkills = profileData.default_resume.softSkills;
        const existingSoftSkills = resumeData.softSkills || [];
        const combined = [...profileSoftSkills, ...existingSoftSkills];
        resumeData.softSkills = Array.from(
          new Set(combined.map((s: string) => s.trim().toLowerCase()))
        ).map((skill) => {
          const original = [...profileSoftSkills, ...existingSoftSkills].find(
            (s) => s.trim().toLowerCase() === skill
          );
          return original || skill;
        });
      }

      // Merge education from profile - aggressive deduplication: same school + date = duplicate
      if (
        profileData.default_resume?.education &&
        profileData.default_resume.education.length > 0
      ) {
        const profileEdu = profileData.default_resume.education;
        const existingEdu = resumeData.education || [];
        const combined = [...profileEdu, ...existingEdu]; // Profile first (priority)
        const finalEdu: any[] = [];
        const seen = new Set<string>();

        for (const edu of combined) {
          // Key: school + graduation date (same school, same date = duplicate, regardless of degree wording)
          const key = `${edu.school || ""}|${edu.graduationDate || ""}`
            .toLowerCase()
            .trim();

          if (!seen.has(key)) {
            seen.add(key);
            finalEdu.push(edu);
          } else {
            // Duplicate found - check if current is from profile (priority)
            const isFromProfile = profileEdu.some(
              (p: any) =>
                (p.school || "").toLowerCase().trim() ===
                  (edu.school || "").toLowerCase().trim() &&
                (p.graduationDate || "").toLowerCase().trim() ===
                  (edu.graduationDate || "").toLowerCase().trim()
            );

            if (isFromProfile) {
              // Replace existing with profile version
              const index = finalEdu.findIndex((e: any) => {
                const eKey = `${e.school || ""}|${e.graduationDate || ""}`
                  .toLowerCase()
                  .trim();
                return eKey === key;
              });
              if (index >= 0) {
                finalEdu[index] = edu;
                console.log(
                  `Replacing duplicate education with profile version:`,
                  edu.school
                );
              }
            } else {
              console.log(
                `Removing duplicate education:`,
                edu.school,
                edu.graduationDate
              );
            }
          }
        }

        resumeData.education = finalEdu;
      }

      // Merge certifications from profile
      if (
        profileData.default_resume?.certifications &&
        profileData.default_resume.certifications.length > 0
      ) {
        const profileCerts = profileData.default_resume.certifications;
        const existingCerts = resumeData.certifications || [];
        const combined = [...profileCerts, ...existingCerts];
        resumeData.certifications = Array.from(
          new Set(
            combined.map((c: any) => {
              // Handle both string and object formats
              const certStr =
                typeof c === "string" ? c : c.name || c.title || String(c);
              return certStr.trim().toLowerCase();
            })
          )
        ).map((certLower) => {
          const original = [...profileCerts, ...existingCerts].find(
            (c: any) => {
              const certStr =
                typeof c === "string" ? c : c.name || c.title || String(c);
              return certStr.trim().toLowerCase() === certLower;
            }
          );
          // Return string format for templates
          return typeof original === "string"
            ? original
            : original?.name || original?.title || String(original || "");
        });
      }

      // Merge projects from profile
      if (
        profileData.default_resume?.projects &&
        profileData.default_resume.projects.length > 0
      ) {
        const profileProjects = profileData.default_resume.projects;
        const existingProjects = resumeData.projects || [];
        const combined = [...profileProjects, ...existingProjects];
        const seen = new Set<string>();
        resumeData.projects = combined.filter((proj: any) => {
          const key = (proj.name || "").toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      // Ensure contact info from profile is preserved (profile data takes priority)
      if (profileData.default_resume) {
        // Preserve contact info - profile data takes priority, then AI-generated, then fallback
        resumeData.name = profileData.default_resume.name || resumeData.name;
        resumeData.email = profileData.default_resume.email || resumeData.email;
        resumeData.phone = profileData.default_resume.phone || resumeData.phone;
        resumeData.location =
          profileData.default_resume.location || resumeData.location;
        resumeData.linkedin =
          profileData.default_resume.linkedin || resumeData.linkedin;
      }
    }

    // Remove location and description from experience if present, deduplicate, and ensure correct order
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      resumeData.experience = resumeData.experience.map((exp: any) => {
        const { location, description, ...rest } = exp;
        return rest;
      });

      // Final aggressive deduplication: same company + same dates = duplicate (regardless of title)
      // SIMPLE RULE: First occurrence wins, all others with same company+dates are skipped
      const finalExperience: any[] = [];
      const seenCompanyDates = new Set<string>();

      for (const exp of resumeData.experience) {
        // Key: company + dates ONLY (same company, same dates = duplicate, even if title differs)
        const companyDateKey = `${exp.company || ""}|${exp.startDate || ""}|${
          exp.endDate || ""
        }`
          .toLowerCase()
          .trim();

        // Simple check: if we've seen this company+date combo, skip it entirely
        if (!seenCompanyDates.has(companyDateKey)) {
          // First time seeing this company+date combination
          seenCompanyDates.add(companyDateKey);
          finalExperience.push(exp);
        } else {
          // Duplicate found - skip it (first occurrence already in array)
          console.log(
            `Skipping duplicate experience:`,
            exp.title,
            exp.company,
            exp.startDate,
            exp.endDate
          );
        }
      }

      resumeData.experience = finalExperience;

      // Deduplicate and limit achievements within each experience entry
      resumeData.experience = resumeData.experience.map((exp: any) => {
        if (exp.achievements && Array.isArray(exp.achievements)) {
          // Deduplicate achievements (case-insensitive, trimmed)
          const seenAchievements = new Set<string>();
          const uniqueAchievements = exp.achievements.filter((ach: string) => {
            const normalized = ach.trim().toLowerCase();
            if (seenAchievements.has(normalized)) {
              return false; // Duplicate, filter it out
            }
            seenAchievements.add(normalized);
            return true;
          });

          // Limit to maximum 5 achievements per company to ensure 1 page per role
          exp.achievements = uniqueAchievements.slice(0, 10);
        }
        return exp;
      });

      // Sort experience from latest (most recent) to oldest
      resumeData.experience.sort((a: any, b: any) => {
        // Parse dates (MM/YYYY format)
        const parseDate = (dateStr: string) => {
          if (dateStr === "Present" || dateStr === "present") {
            return new Date(9999, 11, 31); // Far future date for "Present"
          }
          const [month, year] = dateStr.split("/");
          return new Date(parseInt(year), parseInt(month) - 1);
        };

        // Compare by endDate first (most recent endDate comes first)
        const aEndDate = parseDate(a.endDate || a.startDate);
        const bEndDate = parseDate(b.endDate || b.startDate);

        if (aEndDate.getTime() !== bEndDate.getTime()) {
          return bEndDate.getTime() - aEndDate.getTime(); // Descending order
        }

        // If endDates are equal, sort by startDate (more recent startDate comes first)
        const aStartDate = parseDate(a.startDate);
        const bStartDate = parseDate(b.startDate);
        return bStartDate.getTime() - aStartDate.getTime(); // Descending order
      });

      // Limit to 4 most recent positions
      if (resumeData.experience.length > 10) {
        resumeData.experience = resumeData.experience.slice(0, 10);
      }
    }

    // Template is provided in the request; default to 'standard' if missing
    const template = requestedTemplate || "standard";

    // Generate a PDF from the resume JSON using the chosen template with PDFShift
    // This function is wrapped in error handling to prevent PDF failures from breaking the entire request
    const generatePdfBase64 = async (
      resume: any,
      tmpl: string
    ): Promise<string | null> => {
      try {
        // Read template file
        const tplPath = path.join(process.cwd(), "templates", `${tmpl}.html`);
        let tpl = "";
        try {
          tpl = await fs.readFile(tplPath, "utf8");
        } catch (e) {
          // fallback to standard template if missing
          const fallback = path.join(
            process.cwd(),
            "templates",
            "standard.html"
          );
          tpl = await fs.readFile(fallback, "utf8");
        }

        // Prepare view for Mustache
        // Create a clean view object explicitly to avoid any duplication issues
        // Contact info is already merged from profileData earlier, so use resume directly
        const view: any = {
          name: resume.name || "",
          email: resume.email || "",
          phone: resume.phone || "",
          location: resume.location || "", // Already merged from profileData if available
          linkedin: resume.linkedin || "",
          summary: resume.summary || "",
        };

        // Add boolean flag for summary to prevent repetition
        view.hasSummary = !!(
          resume.summary && resume.summary.trim().length > 0
        );

        // Handle hardSkills (categorized skills) - add boolean flag for existence check
        if (
          resume.hardSkills &&
          typeof resume.hardSkills === "object" &&
          Object.keys(resume.hardSkills).length > 0
        ) {
          view.hasHardSkills = true;
          view.hardSkills = Object.entries(resume.hardSkills).map(([k, v]) => {
            const skillsArray = Array.isArray(v) ? v : [String(v)];
            return {
              key: k,
              value: skillsArray, // Array for templates that iterate
              valueString: skillsArray.join(", "), // String for templates that display directly
            };
          });
        } else {
          view.hasHardSkills = false;
          view.hardSkills = [];
        }

        // Handle softSkills (array of skills) - add boolean flag for existence check
        if (Array.isArray(resume.softSkills) && resume.softSkills.length > 0) {
          view.hasSoftSkills = true;
          view.softSkills = resume.softSkills;
        } else {
          view.hasSoftSkills = false;
          view.softSkills = [];
        }

        // Backward compatibility: also provide skills if templates still use it
        if (resume.hardSkills && typeof resume.hardSkills === "object") {
          view.skills = Object.entries(resume.hardSkills).map(([k, v]) => {
            const skillsArray = Array.isArray(v) ? v : [String(v)];
            return {
              key: k,
              value: skillsArray,
              valueString: skillsArray.join(", "),
            };
          });
        } else {
          view.skills = [];
        }

        // Experience - add boolean flag for existence check, keep array for iteration
        // Final deduplication pass before rendering - same company + dates = duplicate
        // SIMPLE RULE: First occurrence wins, all others with same company+dates are skipped
        if (Array.isArray(resume.experience) && resume.experience.length > 0) {
          // Final aggressive deduplication: same company + same dates = duplicate
          const seenCompanyDates = new Set<string>();
          const uniqueExperience: any[] = [];

          console.log(
            `[DEDUP] Starting final pass with ${resume.experience.length} experience entries`
          );

          for (let i = 0; i < resume.experience.length; i++) {
            const exp = resume.experience[i];
            // Key: company + dates ONLY (same company, same dates = duplicate)
            // Normalize: trim and lowercase all parts
            const company = (exp.company || "").trim().toLowerCase();
            const startDate = (exp.startDate || "").trim().toLowerCase();
            const endDate = (exp.endDate || "").trim().toLowerCase();
            const companyDateKey = `${company}|${startDate}|${endDate}`;

            // Simple check: if we've seen this company+date combo, skip it entirely
            if (!seenCompanyDates.has(companyDateKey)) {
              seenCompanyDates.add(companyDateKey);
              uniqueExperience.push(exp);
              console.log(
                `[DEDUP] Added experience ${i + 1}: ${exp.title} at ${
                  exp.company
                } (${startDate} - ${endDate})`
              );
            } else {
              // Duplicate - skip it (first occurrence already in array)
              console.log(
                `[DEDUP] SKIPPING duplicate experience ${i + 1}: ${
                  exp.title
                } at ${
                  exp.company
                } (${startDate} - ${endDate}) - key: ${companyDateKey}`
              );
            }
          }

          console.log(
            `[DEDUP] Final pass complete: ${uniqueExperience.length} unique entries out of ${resume.experience.length} total`
          );

          view.hasExperience = uniqueExperience.length > 0;
          view.experience = uniqueExperience;
        } else {
          view.hasExperience = false;
          view.experience = [];
        }

        // Education - add boolean flag for existence check, final deduplication
        if (Array.isArray(resume.education) && resume.education.length > 0) {
          // Final deduplication: same school + date = duplicate
          const seenSchoolDate = new Set<string>();
          const uniqueEducation = resume.education.filter((edu: any) => {
            const key = `${edu.school || ""}|${edu.graduationDate || ""}`
              .toLowerCase()
              .trim();
            if (seenSchoolDate.has(key)) {
              console.log(
                `Final pass: Removing duplicate education:`,
                edu.school,
                edu.graduationDate
              );
              return false;
            }
            seenSchoolDate.add(key);
            return true;
          });

          view.hasEducation = uniqueEducation.length > 0;
          view.education = uniqueEducation;
        } else {
          view.hasEducation = false;
          view.education = [];
        }

        // Certifications - ensure strings, not objects, add boolean flag
        if (
          Array.isArray(resume.certifications) &&
          resume.certifications.length > 0
        ) {
          view.hasCertifications = true;
          view.certifications = resume.certifications.map((c: any) => {
            return typeof c === "string" ? c : c.name || c.title || String(c);
          });
        } else {
          view.hasCertifications = false;
          view.certifications = [];
        }

        // Projects - add boolean flag for existence check, keep array for iteration
        if (Array.isArray(resume.projects) && resume.projects.length > 0) {
          view.hasProjects = true;
          // Pre-process projects to create comma-separated technology strings
          view.projects = resume.projects.map((proj: any) => {
            if (proj.technologies && Array.isArray(proj.technologies)) {
              return {
                ...proj,
                technologiesString: proj.technologies.join(", "),
                technologies: proj.technologies, // Keep array for backward compatibility
              };
            }
            return proj;
          });
        } else {
          view.hasProjects = false;
          view.projects = [];
        }

        // Mustache render
        const html = Mustache.render(tpl, view);

        // Use PDFShift API to generate PDF
        const pdfShiftApiKey = process.env.PDFSHIFT_API_KEY;
        if (!pdfShiftApiKey) {
          console.warn(
            "PDFShift API key is not configured - PDF generation will be skipped"
          );
          return null;
        }

        // Validate API key format (basic check)
        if (pdfShiftApiKey.length < 10) {
          throw new Error("PDFShift API key appears to be invalid (too short)");
        }

        console.log("Starting PDF generation with PDFShift...");
        console.log(
          `Template: ${tmpl}, HTML length: ${html.length} characters`
        );

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
          const response = await fetch(
            "https://api.pdfshift.io/v3/convert/pdf",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": pdfShiftApiKey,
              },
              body: JSON.stringify({
                source: html,
                format: "A4",
                margin: {
                  top: "15mm",
                  bottom: "15mm",
                  left: "10mm",
                  right: "10mm",
                },
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            let errorText = "";
            try {
              errorText = await response.text();
              // Try to parse as JSON for better error messages
              try {
                const errorJson = JSON.parse(errorText);
                // Handle PDFShift error format: { error: { type: 'forbidden', message: '...' } }
                if (errorJson.error) {
                  if (errorJson.error.message) {
                    errorText = errorJson.error.message;
                  } else if (errorJson.error.type) {
                    errorText = `${errorJson.error.type}: ${
                      errorJson.error.message || "Request not allowed"
                    }`;
                  } else {
                    errorText = JSON.stringify(errorJson.error);
                  }
                } else if (typeof errorJson === "string") {
                  errorText = errorJson;
                } else {
                  errorText = JSON.stringify(errorJson);
                }
              } catch {
                // Not JSON, use as-is
              }
            } catch {
              errorText = `HTTP ${response.status}: Request not allowed`;
            }
            console.error(`PDFShift API error: ${response.status}`, errorText);
            throw new Error(
              `PDF generation failed (${
                response.status
              }): ${errorText.substring(0, 200)}`
            );
          }

          const pdfBuffer = await response.arrayBuffer();
          const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");
          console.log(
            "PDF generated successfully, size:",
            pdfBuffer.byteLength,
            "bytes"
          );
          return pdfBase64;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === "AbortError") {
            throw new Error("PDF generation timed out after 30 seconds");
          }
          // Re-throw the error so it can be caught by the outer handler
          throw fetchError;
        }
      } catch (err) {
        // Re-throw to be caught by the outer try-catch in the main handler
        throw err;
      }
    };

    let pdfBase64: string | undefined = undefined;
    let pdfError: string | undefined = undefined;
    try {
      console.log("Attempting PDF generation...");
      const pdfResult = await generatePdfBase64(resumeData, template);
      pdfBase64 = pdfResult ?? undefined;
      if (pdfBase64) {
        console.log("PDF generation successful");
      } else {
        console.log("PDF generation returned null (likely API key missing)");
      }
    } catch (pdfErr: any) {
      console.error("PDF generation failed - caught in outer handler", pdfErr);
      // Extract error message more carefully
      try {
        if (pdfErr instanceof Error) {
          pdfError = pdfErr.message;
        } else if (typeof pdfErr === "string") {
          pdfError = pdfErr;
        } else if (pdfErr?.message) {
          pdfError = pdfErr.message;
        } else if (pdfErr?.error?.message) {
          // Handle nested error objects (PDFShift format)
          pdfError = pdfErr.error.message;
        } else if (pdfErr?.error?.error?.message) {
          // Handle double-nested error objects
          pdfError = pdfErr.error.error.message;
        } else {
          pdfError =
            "PDF generation failed. Please check your PDFShift API key configuration.";
        }
        console.log("PDF error message extracted:", pdfError);
      } catch (parseErr) {
        // If we can't parse the error, use a generic message
        console.error("Error parsing PDF error:", parseErr);
        pdfError =
          "PDF generation failed. Please check your PDFShift API key configuration.";
      }
      // Don't fail the entire request if PDF generation fails - still return the resume
    }

    // Always return the resume, even if PDF generation failed
    return NextResponse.json({
      resume: resumeData,
      ...(pdfBase64 && { pdfBase64 }),
      ...(pdfError && { pdfError }),
    });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    // If we have resumeData, still return it even if there was an error
    // This handles cases where the error occurred after resume generation
    if (typeof resumeData !== "undefined") {
      console.warn("Returning resume despite error:", error);
      return NextResponse.json({
        resume: resumeData,
        pdfError: error instanceof Error ? error.message : "An error occurred",
      });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while analyzing the resume",
      },
      { status: 500 }
    );
  }
}
