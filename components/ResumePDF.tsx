"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import { UpdatedResume } from "@/app/page";

interface ResumePDFProps {
  resume: UpdatedResume;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica", // Using Helvetica as it's built-in and similar to Calibri
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #2563eb",
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1e40af",
  },
  contactInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    fontSize: 9,
    color: "#4b5563",
    marginTop: 5,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1e40af",
    borderBottom: "1 solid #e5e7eb",
    paddingBottom: 3,
  },
  summary: {
    fontSize: 10,
    lineHeight: 1.3,
    color: "#374151",
    textAlign: "justify",
  },
  experienceItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "0.5 solid #e5e7eb",
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  experienceHeaderLeft: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#111827",
    lineHeight: 1.3,
    marginBottom: 3,
  },
  company: {
    fontSize: 11,
    color: "#4b5563",
    lineHeight: 1.3,
  },
  dateRange: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "normal",
    marginTop: 2,
    textAlign: "right",
  },
  achievements: {
    marginTop: 8,
    paddingLeft: 0,
  },
  achievementItem: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 1.4,
    paddingLeft: 12,
    textAlign: "left",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillCategory: {
    marginBottom: 8,
  },
  skillCategoryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 4,
  },
  skillList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillTag: {
    fontSize: 8,
    color: "#4b5563",
    backgroundColor: "#f3f4f6",
    padding: "2 6",
    borderRadius: 3,
  },
  educationItem: {
    marginBottom: 10,
  },
  educationDegree: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 3,
  },
  educationSchool: {
    fontSize: 10,
    color: "#4b5563",
    marginBottom: 3,
  },
  educationDate: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 2,
  },
  educationGPA: {
    fontSize: 10,
    color: "#374151",
    marginBottom: 2,
  },
  certificationItem: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 3,
  },
  projectItem: {
    marginBottom: 10,
  },
  projectName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 3,
  },
  projectDescription: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 3,
  },
  projectTech: {
    fontSize: 8,
    color: "#6b7280",
    fontStyle: "italic",
  },
});

export const ResumePDFDocument = ({ resume }: ResumePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{resume.name || "Name"}</Text>
        <View style={styles.contactInfo}>
          {resume.email && <Text>{resume.email}</Text>}
          {resume.phone && <Text>• {resume.phone}</Text>}
          {resume.location && <Text>• {resume.location}</Text>}
          {resume.linkedin && (
            <Link src={resume.linkedin} style={{ color: "#2563eb" }}>
              LinkedIn
            </Link>
          )}
        </View>
      </View>

      {/* Summary */}
      {resume.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.summary}>{resume.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Experience</Text>
          {resume.experience.map((exp, index) => {
            const isLast = index === (resume.experience?.length ?? 0) - 1;
            return (
              <View
                key={index}
                style={
                  isLast
                    ? {
                        ...styles.experienceItem,
                        borderBottom: "none",
                        paddingBottom: 0,
                      }
                    : styles.experienceItem
                }
              >
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceHeaderLeft}>
                    <Text style={styles.jobTitle}>{exp.title}</Text>
                    <Text style={styles.company}>{exp.company}</Text>
                  </View>
                  <Text style={styles.dateRange}>
                    {exp.startDate} - {exp.endDate}
                  </Text>
                </View>
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.achievements}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.achievementItem}>
                        • {achievement}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Skills */}
      {resume.skills && Object.keys(resume.skills).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {Object.entries(resume.skills).map(([category, skills], index) => (
            <View key={index} style={styles.skillCategory}>
              <Text style={styles.skillCategoryTitle}>{category}</Text>
              <View style={styles.skillList}>
                {skills.map((skill, idx) => (
                  <Text key={idx} style={styles.skillTag}>
                    {skill}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {resume.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              <Text style={styles.educationDegree}>{edu.degree}</Text>
              <Text style={styles.educationSchool}>{edu.school}</Text>
              <Text style={styles.educationDate}>{edu.graduationDate}</Text>
              {edu.gpa && (
                <Text style={styles.educationGPA}>GPA: {edu.gpa}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Certifications */}
      {resume.certifications && resume.certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certifications</Text>
          {resume.certifications.map((cert, index) => (
            <Text key={index} style={styles.certificationItem}>
              • {cert}
            </Text>
          ))}
        </View>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {resume.projects.map((project, index) => (
            <View key={index} style={styles.projectItem}>
              <Text style={styles.projectName}>{project.name}</Text>
              {project.description && (
                <Text style={styles.projectDescription}>
                  {project.description}
                </Text>
              )}
              {project.technologies && project.technologies.length > 0 && (
                <Text style={styles.projectTech}>
                  Technologies: {project.technologies.join(", ")}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);
