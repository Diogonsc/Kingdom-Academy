export type QuestionType = "multiple_choice" | "essay";
export type AttemptStatus = "in_progress" | "submitted" | "graded";

export interface Exam {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number;
  available_from: string | null;
  available_until: string | null;
  is_published: boolean;
  show_feedback_after_grading: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  type: QuestionType;
  order_index: number;
  statement: string;
  points: number;
  expected_answer?: string | null;
  options?: ExamQuestionOption[];
}

export interface ExamQuestionOption {
  id: string;
  question_id: string;
  label: "A" | "B" | "C" | "D" | "E";
  text: string;
  is_correct?: boolean;
  order_index: number;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  attempt_number: number;
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  final_score: number | null;
  passed: boolean | null;
  admin_feedback: string | null;
}

export interface ExamAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  essay_answer: string | null;
  is_correct: boolean | null;
  score_earned: number;
  admin_feedback: string | null;
}

export interface ExamWithAttempt extends Exam {
  attempt: ExamAttempt | null;
  attemptHistory: ExamAttempt[];
  attemptsUsed: number;
  attemptsRemaining: number;
  canStartNew: boolean;
}

export interface QuestionWithAnswer extends ExamQuestion {
  answer: ExamAnswer | null;
}

export interface AttemptWithDetails extends ExamAttempt {
  exam: Exam;
  answers: (ExamAnswer & {
    question: ExamQuestion & { options?: ExamQuestionOption[] };
  })[];
  profile: { name: string; avatar_url: string | null };
}

export interface ExamAdminListItem extends Exam {
  course: { id: string; title: string } | null;
  question_count: number;
  submitted_count: number;
}

export interface StudentExamItem extends ExamWithAttempt {
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
  };
}
