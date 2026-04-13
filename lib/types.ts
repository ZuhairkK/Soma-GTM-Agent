// Shared types used by both API routes and the client component.
// Keeping them here avoids coupling the client bundle to server file paths.

export interface MockProfile {
  name: string;
  stressSources: string;
  burnoutSigns: string[];
  exerciseFrequency: number;
  copingMechanisms: string;
}

export interface EmailDraft {
  day: "Day 1" | "Day 4" | "Day 7";
  subject: string;
  body: string;
}

export interface GenerateResponse {
  profile: MockProfile;
  emails: EmailDraft[];
}
