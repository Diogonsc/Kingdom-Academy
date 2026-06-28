import { cn } from "@/lib/utils";
import type { ExamAnswer, ExamQuestion } from "@/types/exam";

type QuestionNavProps = {
  questions: ExamQuestion[];
  answers: ExamAnswer[];
  activeIndex: number;
  onSelect: (index: number) => void;
};

function isAnswered(question: ExamQuestion, answers: ExamAnswer[]) {
  const answer = answers.find((item) => item.question_id === question.id);
  if (!answer) return false;

  if (question.type === "multiple_choice") {
    return Boolean(answer.selected_option_id);
  }

  return Boolean(answer.essay_answer?.trim());
}

export function QuestionNav({
  questions,
  answers,
  activeIndex,
  onSelect,
}: QuestionNavProps) {
  const answeredCount = questions.filter((question) =>
    isAnswered(question, answers),
  ).length;
  const blankCount = questions.length - answeredCount;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">
        Questões ({questions.length})
      </h3>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-4 lg:grid-cols-1">
        {questions.map((question, index) => {
          const answered = isAnswered(question, answers);
          const isActive = index === activeIndex;

          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "rounded-md border px-2 py-2 text-left text-xs transition-colors lg:px-3",
                isActive && "border-primary bg-primary/10 font-semibold text-primary",
                !isActive && answered && "border-primary/40 bg-primary/5 text-primary",
                !isActive && !answered && "border-border text-muted-foreground hover:border-primary/30",
              )}
            >
              Q{index + 1}
              <span className="ml-1 hidden lg:inline">
                {answered ? "✓ respondida" : "em branco"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-1 text-xs text-muted-foreground">
        <p>✓ {answeredCount} respondida{answeredCount !== 1 ? "s" : ""}</p>
        <p>○ {blankCount} em branco</p>
      </div>
    </div>
  );
}
