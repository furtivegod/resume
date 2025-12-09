import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const { jd, resumeContent } = await request.json();

    if (!jd || !resumeContent) {
      return NextResponse.json(
        { error: "Job description and resume content are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key is not configured" },
        { status: 500 }
      );
    }

    // Master prompt that combines JD and resume content
    const masterPrompt = `You are a professional resume writer. Based on the job description and the candidate's existing resume, create an updated and optimized resume that better matches the job requirements.

Job Description:
${jd}

Existing Resume Content:
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
  "skills": {
    "skill category": ["skill 1", "skill 2", "skill 3"]
  },
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
- The "skills" field must be an object where keys are skill categories (like "Programming Languages", "AI/ML & Frameworks", etc.) and values are arrays of skills for that category
- CRITICAL: Keep the original "location" from the existing resume exactly as it is. Do NOT change the location based on the job description. The location represents where the candidate currently lives, not where the job is located.
- Keep the original "name", "email", "phone", and "linkedin" from the existing resume exactly as they are. Do NOT modify these contact details.
- Use keywords from the job description
- Highlight relevant experience and skills that match the job
- Maintain accuracy to the original resume while optimizing for the role
- Include all sections that exist in the original resume
- Format dates consistently (MM/YYYY)

Experience Writing Guidelines:
- CRITICAL: The "experience" array MUST be ordered from LATEST (most recent) to OLDEST. The first item in the array should be the most recent job, and the last item should be the oldest job. Always sort by endDate (or startDate if endDate is "Present") in descending order.
- CRITICAL: Every bullet point (achievement) must use a UNIQUE action verb. Do NOT repeat the same action verb across different bullet points in the same experience entry. Use varied action verbs like: Architected, Built, Developed, Engineered, Implemented, Optimized, Created, Designed, Led, Mentored, Collaborated, Integrated, Deployed, etc.
- Bullet point count per experience entry (CRITICAL):
  * For the MOST RECENT company (first in the experience array): Include exactly 6 bullet points (achievements)
  * For the MIDDLE company (if there are 3+ companies): Include 5 or 6 bullet points (achievements)
  * For the OLDEST company (last in the experience array): Include exactly 4 bullet points (achievements)
  * Ideal pattern: 6-5-4 or 6-6-4 bullets from most recent to oldest
- For the MOST RECENT company (first in the experience array): Write achievements that reflect SENIOR-LEVEL responsibilities. Use action verbs and language that demonstrate leadership, architecture, strategic thinking, mentoring, and advanced technical expertise. Examples: "Architected...", "Led...", "Mentored...", "Designed enterprise-scale...", "Engineered complex...", etc.
- For the MIDDLE company (if there are 3+ companies): Write achievements that reflect MID-TO-SENIOR level responsibilities. Show progression from junior to more independent work, some leadership elements, and growing technical depth. Examples: "Developed...", "Built...", "Implemented...", "Collaborated on...", etc.
- For the OLDEST company (last in the experience array): Write achievements that reflect BEGINNER-TO-MID level responsibilities. Use action verbs appropriate for entry/junior roles, showing learning, assistance, and foundational work. Examples: "Assisted with...", "Contributed to...", "Supported...", "Learned...", "Participated in...", "Helped develop...", etc.


Return ONLY valid JSON, no additional text, no markdown formatting, no code blocks.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: masterPrompt,
        },
      ],
    });

    // Extract the text content from the response
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic API");
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Clean the response - remove markdown code blocks if present
      let jsonText = content.text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "");
      }
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      // If parsing fails, return a structured error response
      console.error("Failed to parse JSON response:", content.text);
      return NextResponse.json(
        {
          error: "Failed to parse AI response",
          rawResponse: content.text,
        },
        { status: 500 }
      );
    }

    // Return only the resume JSON (remove any analysis fields if present)
    const resumeData = analysisResult.updatedResume || analysisResult;

    // Remove location and description from experience if present, and ensure correct order
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      resumeData.experience = resumeData.experience.map((exp: any) => {
        const { location, description, ...rest } = exp;
        return rest;
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
    }

    return NextResponse.json(resumeData);
  } catch (error) {
    console.error("Error analyzing resume:", error);
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
