import { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Avatar } from "@mui/material";

interface Activity {
  id: string;
  name: string;
  initials: string;
  action: "paid" | "withdrew" | "joined";
  amount: number;
  timestamp: Date;
}

// Finite list of sample names
const SAMPLE_NAMES = [
  { name: "John P.", initials: "JP", color: "#4F46E5" },
  { name: "Sarah A.", initials: "SA", color: "#EC4899" },
  { name: "Michael R.", initials: "MR", color: "#10B981" },
  { name: "Emily T.", initials: "ET", color: "#F59E0B" },
  { name: "David L.", initials: "DL", color: "#8B5CF6" },
  { name: "Jessica M.", initials: "JM", color: "#EF4444" },
  { name: "James W.", initials: "JW", color: "#06B6D4" },
  { name: "Lisa K.", initials: "LK", color: "#84CC16" },
  { name: "Robert H.", initials: "RH", color: "#F97316" },
  { name: "Maria S.", initials: "MS", color: "#14B8A6" },
  { name: "Chris B.", initials: "CB", color: "#6366F1" },
  { name: "Amanda D.", initials: "AD", color: "#A855F7" },
  { name: "Daniel F.", initials: "DF", color: "#22C55E" },
  { name: "Nicole G.", initials: "NG", color: "#EAB308" },
  { name: "Kevin C.", initials: "KC", color: "#3B82F6" },
];

const ACTIONS = ["paid", "withdrew", "joined"] as const;
const AMOUNTS = [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000];

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Generate initial activities
    const initial = Array.from({ length: 5 }, () => generateActivity());
    setActivities(initial);

    // Add new activity every 3-5 seconds
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities((prev) => [newActivity, ...prev].slice(0, 10)); // Keep only last 10
    }, Math.random() * 2000 + 3000); // Random between 3-5 seconds

    return () => clearInterval(interval);
  }, []);

  const generateActivity = (): Activity => {
    const person = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const amount = AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)];

    return {
      id: `${Date.now()}-${Math.random()}`,
      name: person.name,
      initials: person.initials,
      action,
      amount,
      timestamp: new Date(),
    };
  };

  const getActionText = (activity: Activity) => {
    switch (activity.action) {
      case "paid":
        return "just got paid";
      case "withdrew":
        return "just withdrew";
      case "joined":
        return "just joined with";
      default:
        return "";
    }
  };

  const getActionColor = (action: Activity["action"]) => {
    switch (action) {
      case "paid":
        return "text-success";
      case "withdrew":
        return "text-primary";
      case "joined":
        return "text-warning";
      default:
        return "text-text-primary";
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="flex flex-col gap-4">
        <Box className="flex items-center justify-between">
          <Typography variant="h6" component="h6">
            🔔 Live Activity
          </Typography>
          <Box className="h-2 w-2 rounded-full bg-success animate-pulse" />
        </Box>

        <Box className="flex flex-col gap-3 max-h-[500px] overflow-hidden">
          {activities.map((activity, index) => (
            <Box
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-background-default border border-divider transition-all duration-500 ease-in-out"
              style={{
                animation: index === 0 ? "slideDown 0.5s ease-out" : undefined,
                opacity: 1 - index * 0.1,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: SAMPLE_NAMES.find((n) => n.initials === activity.initials)?.color || "#94A3B8",
                  width: 40,
                  height: 40,
                  fontSize: "0.875rem",
                }}
              >
                {activity.initials}
              </Avatar>
              <Box className="flex-1 min-w-0">
                <Typography variant="body2" className="font-semibold">
                  {activity.name}
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  {getActionText(activity)}{" "}
                  <span className={`font-semibold ${getActionColor(activity.action)}`}>
                    ${activity.amount.toLocaleString()}
                  </span>
                </Typography>
                <Typography variant="caption" className="text-text-secondary">
                  {getTimeAgo(activity.timestamp)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {activities.length === 0 && (
          <Box className="flex flex-col items-center justify-center py-12 text-center">
            <Typography variant="body2" className="text-text-secondary">
              Waiting for activity...
            </Typography>
          </Box>
        )}
      </CardContent>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  );
}

function getTimeAgo(timestamp: Date): string {
  const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
