import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import {
  ACHIEVEMENT_LABELS,
  fetchUserAchievements,
  type Achievement,
} from "@/services/achievements";

export function AchievementsSection() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    async function load() {
      const data = await fetchUserAchievements();
      setAchievements(data);
    }
    void load();
  }, []);

  if (achievements.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="size-4 text-primary" />
          Conquistas
        </CardTitle>
        <CardDescription>
          Reconhecimentos pela sua dedicação nos estudos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {achievements.map((achievement) => {
          const meta = ACHIEVEMENT_LABELS[achievement.type];
          return (
            <Badge
              key={achievement.id}
              variant="outline"
              className="border-primary/30 bg-primary/5 px-3 py-1.5"
              title={meta.description}
            >
              {meta.title}
            </Badge>
          );
        })}
      </CardContent>
    </Card>
  );
}
