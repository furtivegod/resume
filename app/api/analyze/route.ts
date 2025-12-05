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
    const masterPrompt = `You are a professional resume writer and analyzer. Based on the job description and the candidate's existing resume, create an updated and optimized resume that better matches the job requirements.

Job Description:
${jd}

Existing Resume Content:
${resumeContent}

Please provide your response in the following JSON format:
{
  "summary": "A brief summary of how well the candidate matches the job requirements",
  "experience": "Detailed analysis of relevant experience",
  "skills": ["skill1", "skill2", "skill3"],
  "education": "Analysis of educational background and relevance",
  "recommendations": "Recommendations for improving the resume or better matching the job",
  "updatedResume": {
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
        "location": "City, State",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY or Present",
        "description": "Job description optimized for this role",
        "achievements": ["Achievement 1", "Achievement 2"]
      }
    ],
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
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
}

Important: The "updatedResume" field should be a JSON object containing all resume sections optimized for this job:
- Use keywords from the job description
- Highlight relevant experience and skills that match the job
- Maintain accuracy to the original resume while optimizing for the role
- Include all sections that exist in the original resume
- Format dates consistently (MM/YYYY)

Return ONLY valid JSON, no additional text or markdown formatting.`;

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

    return NextResponse.json(analysisResult);
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
