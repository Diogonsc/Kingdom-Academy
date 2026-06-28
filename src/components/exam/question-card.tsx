import { cn } from "@/lib/utils";
import type { ExamAnswer, ExamQuestion } from "@/types/exam";
import { Label } from "@/components/ui/label";

type QuestionCardProps = {
  question: ExamQuestion;
  answer: ExamAnswer | null;
  questionNumber: number;
  totalQuestions: number;
  onAnswerChange: (payload: {
    selected_option_id?: string;
    essay_answer?: string;
  }) => void;
  isActive: boolean;
};

export function QuestionCard({
  question,
  answer,
  questionNumber,
  totalQuestions,
  onAnswerChange,
  isActive,
}: QuestionCardProps) {
  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          Questão {questionNumber} de {totalQuestions}
        </p>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {question.points} {question.points === 1 ? "pt" : "pts"}
        </span>
      </div>

      <p className="text-base font-medium leading-relaxed">{question.statement}</p>

      {question.type === "multiple_choice" ? (
        <div className="space-y-3">
          {(question.options ?? []).map((option) => {
            const selected = answer?.selected_option_id === option.id;

            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={selected}
                  onChange={() =>
                    onAnswerChange({ selected_option_id: option.id })
                  }
                  className="mt-1"
                />
                <span className="text-sm leading-relaxed">
                  <span className="font-semibold">{option.label})</span> {option.text}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`essay-${question.id}`}>Sua resposta</Label>
          <textarea
            id={`essay-${question.id}`}
            defaultValue={answer?.essay_answer ?? ""}
            placeholder="Digite sua resposta aqui..."
            rows={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onBlur={(event) =>
              onAnswerChange({ essay_answer: event.target.value })
            }
          />
          <p className="text-xs text-muted-foreground">
            {(answer?.essay_answer ?? "").length} caracteres
          </p>
        </div>
      )}
    </div>
  );
}
