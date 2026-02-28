export interface Shot {
  id: string;
  shotNumber: number;
  duration: string;
  visualDescription: string;
  cameraMovement: string;
  audio: string;
  transition: string;
  reasoning: string; // Why this shot/transition was chosen
}

export interface StoryboardGroup {
  id: string;
  groupNumber: number;
  timeRange: string; // e.g. "00:00 - 00:15"
  summary: string; // Summary of this 15s block (the "hook" or "climax" of this block)
  seedancePrompt: string; // Consolidated prompt in Seedance format
  shots: Shot[];
}

export interface StoryboardProject {
  id: string;
  title: string;
  totalDurationInput: number;
  groups: StoryboardGroup[];
}
