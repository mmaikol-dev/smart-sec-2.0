import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const processAIQuery = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const functionsUsed: string[] = [];

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=YOUR_API_KEY",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: args.query }],
              },
            ],
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "getGuardDogs",
                    description: "Get list of guard dogs, optionally filtered by patrol time",
                    parameters: {
                      type: "object",
                      properties: {
                        onPatrolSince: {
                          type: "string",
                          description: "A timestamp or relative phrase like 'last_night', '24h', etc.",
                        },
                      },
                      required: [],
                    },
                  },
                  {
                    name: "getSecurityEvents",
                    description: "Get recent or suspicious security events",
                    parameters: {
                      type: "object",
                      properties: {
                        since: { type: "string", description: "Relative time like '24h'" },
                        unresolvedOnly: { type: "boolean" },
                      },
                      required: [],
                    },
                  },
                  {
                    name: "getCCTVCameras",
                    description: "Get list of CCTV cameras and statuses",
                    parameters: {
                      type: "object",
                      properties: {},
                      required: [],
                    },
                  },
                  {
                    name: "getDashboardStats",
                    description: "Get overall system summary",
                    parameters: {
                      type: "object",
                      properties: {},
                      required: [],
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 300,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const functionCall = data.candidates?.[0]?.content?.parts?.[0]?.functionCall;

      if (!functionCall) {
        return {
          response: "Sorry, I couldn't understand the request.",
          executionTime: Date.now() - startTime,
          functionsUsed,
        };
      }

      const { name: functionName, args: functionArgs = {} } = functionCall;
      let responseText = "";
      const now = Date.now();

      switch (functionName) {
        case "getGuardDogs": {
          const dogs = await ctx.runQuery(api.security.getGuardDogs);
          functionsUsed.push("getGuardDogs");

          if (functionArgs.onPatrolSince === "last_night") {
            const lastNightStart = now - 12 * 60 * 60 * 1000; // 12 hours ago
            const patrollingDogs = dogs.filter((d: any) => d.lastPatrol >= lastNightStart);
            responseText = `🐕 Dogs on patrol last night: ${patrollingDogs.map((d: any) => d.name).join(", ") || "None"}.`;
          } else {
            responseText = `🐕 Total dogs found: ${dogs.map((d: any) => d.name).join(", ")}`;
          }
          break;
        }

        case "getSecurityEvents": {
          const events = await ctx.runQuery(api.security.getSecurityEvents, {});
          functionsUsed.push("getSecurityEvents");

          let filtered = events;
          if (functionArgs.since === "24h") {
            const since = now - 24 * 60 * 60 * 1000;
            filtered = filtered.filter((e: any) => e._creationTime >= since);
          }

          if (functionArgs.unresolvedOnly) {
            filtered = filtered.filter((e: any) => !e.isResolved);
          }

          responseText = `⚠️ Found ${filtered.length} relevant events:\n${filtered.map((e: any) => e.type).join(", ")}`;
          break;
        }

        case "getCCTVCameras": {
          const cameras = await ctx.runQuery(api.security.getCCTVCameras);
          functionsUsed.push("getCCTVCameras");

          const online = cameras.filter((c: any) => c.status === "online").length;
          const offline = cameras.filter((c: any) => c.status === "offline").length;
          responseText = `📷 Cameras: ${online} online, ${offline} offline out of ${cameras.length}.`;
          break;
        }

        case "getDashboardStats": {
          const stats = await ctx.runQuery(api.security.getDashboardStats);
          functionsUsed.push("getDashboardStats");

          responseText = `📊 **System Overview**:\n• Dogs Active: ${stats.dogs.active}/${stats.dogs.total}\n• Guards On Duty: ${stats.guards.onDuty}/${stats.guards.total}\n• Cameras Online: ${stats.cameras.online}/${stats.cameras.total}\n• Critical Events: ${stats.events.critical}`;
          break;
        }

        default:
          responseText = "Unrecognized function requested by AI.";
      }

      return {
        response: responseText,
        executionTime: Date.now() - startTime,
        functionsUsed,
      };

    } catch (error) {
      console.error("AI query processing error:", error);
      return {
        response: "I'm experiencing technical difficulties. Please try again later.",
        executionTime: Date.now() - startTime,
        functionsUsed,
      };
    }
  },
});
