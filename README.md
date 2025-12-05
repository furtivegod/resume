# Resume Analyzer

A Next.js application that analyzes your resume against job descriptions using Anthropic's Claude API.

## Features

- 📝 Add Job Description (JD) and Personal Information
- 🤖 AI-powered analysis using Anthropic Claude API
- 📊 Structured results display (Summary, Experience, Skills, Education, Recommendations)
- 🎨 Modern, responsive UI with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - The `.env.local` file has been created with your Anthropic API key
   - If needed, you can update it manually

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter the Job Description in the left panel
2. Enter your Personal Information (experience, skills, education, etc.) in the left panel
3. Click "Analyze Resume" to get AI-powered analysis
4. View the structured results in the right panel

## Project Structure

- `app/page.tsx` - Main page component
- `app/api/analyze/route.ts` - API route for Anthropic integration
- `components/ResumeForm.tsx` - Form component for input
- `components/ResultDisplay.tsx` - Component for displaying results

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API

