import { z } from "zod";

export const sceneObjectSchema = z.object({
  name: z.string().min(1),
  direction: z.enum(["left", "center", "right", "unknown"]),
  priority: z.enum(["high", "medium", "low"]),
});

export const sceneAnalysisSchema = z.object({
  sceneSummary: z.string(),
  objects: z.array(sceneObjectSchema).max(20),
  narration: z.string(),
});

export type SceneAnalysis = z.infer<typeof sceneAnalysisSchema>;
