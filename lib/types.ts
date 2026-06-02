// Zajednički tipovi za sve module.

export interface OraScore {
  total: number;
  obecanje: number;
  radoznalost: number;
  autoritet: number;
  length: number;
  lengthOk: boolean;
  grade: string;
  tips: string[];
}

export interface HeadlineCheck {
  label: string;
  ok: boolean;
}
export interface HeadlineResult {
  score: number;
  checks: HeadlineCheck[];
  tips: string[];
}

export interface MonetizationModel {
  key: string;
  name: string;
  desc: string;
}
export interface Estimate {
  key: string;
  model: string;
  monthlyEur: number;
  yearlyEur: number;
  assumptions: string[];
  notes: string;
}

export interface PlanItem {
  date: string;
  title: string;
  thumbnailHeadline: string;
  hook: string;
  goal: string;
}

export interface Lesson {
  n: number;
  title: string;
  topic: string;
  summary: string;
  key_points: string[];
  frameworks: string[];
  quotes: string[];
}

export interface SearchHit {
  n: number;
  title: string;
  snippet: string;
  score: number;
}
