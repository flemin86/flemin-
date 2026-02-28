import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardProject } from "../types";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
你是一位精通“爽文短剧”的分镜导演。
你的任务是将用户提供的剧本或创意，拆解为一系列 **10-15秒** 为一组的镜头序列（Group）。

**核心要求 (Seedance 2.0 + 短剧风格)：**
1.  **总时长控制**：严格按照用户输入的总时长（默认120秒）来规划。
2.  **分组结构**：将整个故事切分为多个 10-15秒 的片段。每个片段必须是一个小的叙事单元，且必须包含一个“钩子”或“爽点”（反转、打脸、高潮、悬念）。
3.  **详略得当**：
    *   **略**：过场戏、无意义的对话直接跳过或用快节奏蒙太奇。
    *   **详**：情绪爆发点、动作戏、关键线索特写要给足镜头。
4.  **丝滑衔接**：组与组之间、镜头与镜头之间，必须使用高级转场（J-Cut, L-Cut, Match Cut, Whip Pan等）。
5.  **视听语言**：
    *   **镜头拆分（重要）**：拒绝流水账！**必须将连续动作拆分为多个镜头**。例如：“听到异响后拨开芦苇”不能是一个镜头，必须拆分为：镜头1（特写，听到异响，眼神警觉，停止动作）+ 镜头2（肩后/跟随，拨开芦苇向前走）。
    *   **台词对话**：剧本中的台词必须体现在镜头卡片的 \`audio\` 字段中。
    *   **运镜术语**：运镜描述必须使用**中文**（如：推、拉、摇、移、跟、升、降、甩、手持），但 **J-Cut** 和 **L-Cut** 保留英文。
    *   **音效**：配合剧情节奏（重音、耳鸣声、心跳声等）。

6. **Seedance 提示词生成**：
   在每一组（Group）的最后，生成一个符合 Seedance 格式的纯文本提示词字段 \`seedancePrompt\`。
   格式要求：
   - **时间戳重置**：每一组的时间戳都必须从 **0秒** 开始重新计算（例如：0-2秒，2-5秒...），**绝对不要**累加上一组的时间。
   - **一致性**：提示词中的 \`[切换方式]\` 必须与该镜头对象中的 \`transition\` 字段完全一致。
   - **包含台词**：如果该镜头有台词，必须在 \`[画面描述]\` 中体现（例如：...嘴唇微动，神情焦急地喊道：“快跑！”）。
   - 第一行固定为：\`不出现字幕，不出现BGM 光影唯美，电影质感。\` (可根据剧情调整氛围词，如：悬疑紧张、赛博朋克等)
   - 后续每一行对应一个镜头，格式为：\`[开始秒]-[结束秒]秒，[切换方式]，[景别]，[运镜]，[画面描述]\`。
   - **重要**：画面描述中，关键角色要标记 \`@角色名\`，关键道具要标记 \`@道具\`，关键场景要标记 \`@场景\`。
   - 描述要画面感强，包含动作、神态、光影。

请以 JSON 格式返回结果。
`;

export async function generateStoryboard(prompt: string, duration: number = 120): Promise<StoryboardProject> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please configure it in the AI Studio secrets.");
  }

  const model = "gemini-3.1-pro-preview";

  const userPrompt = `
剧本/创意内容：
${prompt}

要求总时长：${duration}秒。
请生成分镜脚本，每组 10-15 秒。
**特别注意**：短剧节奏极快，请根据剧情密度自动规划镜头数量。对于冲突激烈或情绪高昂的段落，请增加镜头数量（快切）以提升爽感。
`;

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Project Title" },
          groups: {
            type: Type.ARRAY,
            description: "List of 10-15s storyboard groups",
            items: {
              type: Type.OBJECT,
              properties: {
                groupNumber: { type: Type.INTEGER },
                timeRange: { type: Type.STRING, description: "e.g., '00:00-00:12'" },
                summary: { type: Type.STRING, description: "The core 'hook' or plot point of this 15s block" },
                seedancePrompt: { type: Type.STRING, description: "The consolidated Seedance format prompt string for this group" },
                shots: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      shotNumber: { type: Type.INTEGER },
                      duration: { type: Type.STRING, description: "e.g., '2s'" },
                      visualDescription: { type: Type.STRING },
                      cameraMovement: { type: Type.STRING },
                      audio: { type: Type.STRING },
                      transition: { type: Type.STRING },
                      reasoning: { type: Type.STRING },
                    },
                    required: ["shotNumber", "duration", "visualDescription", "cameraMovement", "audio", "transition", "reasoning"],
                  },
                },
              },
              required: ["groupNumber", "timeRange", "summary", "seedancePrompt", "shots"],
            },
          },
        },
        required: ["title", "groups"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  try {
    const data = JSON.parse(text);
    return {
      ...data,
      id: crypto.randomUUID(),
      totalDurationInput: duration,
      groups: data.groups.map((group: any) => ({
        ...group,
        id: crypto.randomUUID(),
        shots: group.shots.map((shot: any) => ({ ...shot, id: crypto.randomUUID() })),
      })),
    };
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to parse AI response");
  }
}

export async function regenerateGroup(
  originalPrompt: string, 
  groupSummary: string, 
  timeRange: string, 
  targetShotCount: number
): Promise<any> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing.");
  }

  const model = "gemini-3.1-pro-preview";

  const userPrompt = `
原剧本/创意：
${originalPrompt}

任务：重写其中一个分镜组。
时间段：${timeRange}
本段摘要：${groupSummary}

**修改要求**：
1. 将本段的镜头数量严格调整为 **${targetShotCount}** 个镜头。
2. 保持短剧的快节奏和爽感。
3. 重新生成该组的所有镜头内容及 Seedance 提示词。
`;

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shots: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                shotNumber: { type: Type.INTEGER },
                duration: { type: Type.STRING, description: "e.g., '2s'" },
                visualDescription: { type: Type.STRING },
                cameraMovement: { type: Type.STRING },
                audio: { type: Type.STRING },
                transition: { type: Type.STRING },
                reasoning: { type: Type.STRING },
              },
              required: ["shotNumber", "duration", "visualDescription", "cameraMovement", "audio", "transition", "reasoning"],
            },
          },
          seedancePrompt: { type: Type.STRING, description: "The consolidated Seedance format prompt string for this group" },
        },
        required: ["shots", "seedancePrompt"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  try {
    const data = JSON.parse(text);
    return {
      ...data,
      shots: data.shots.map((shot: any) => ({ ...shot, id: crypto.randomUUID() })),
    };
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to parse AI response");
  }
}
