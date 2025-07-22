"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      content:
        "🛡️ Welcome to Sentinel — your Smart AI Security Analyst.\n\nYou can ask things like:\n• \"Analyze threat level in Zone A\"\n• \"What is the safest area right now?\"\n• \"Give threat percentage for Mombasa\"\n• \"Which patrol units should be on shift tonight?\"\n• \"Summarize incidents in East Zone last week\"\n• Or click 'Capture Image' to assess threat visually.",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const GEMINI_API_KEY = "AIzaSyDnLvQqO_iVePah7p7jIVDDy9qCjV4Qrow";

  const processAIQuery = async ({ query }: { query: string }) => {
    const systemPrompt = `
      You are "bolt", a smart AI security assistant built for real-time threat assessment, patrol optimization, and zone monitoring.
      Respond clearly and concisely. If asked about threat percentage, simulate based on keywords (e.g. "riot", "intrusion", "offline cameras").
      Suggest actions like sending patrol, reviewing footage, or alerting authorities.
      Always prioritize safety. Assume there are zones (A, B, C...), units (dogs, bodyguards, drones), and cameras (active or offline).
    `;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemPrompt}\n\nUser: ${query}` },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json();
    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response from Gemini.";

    return { response: responseText };
  };

  const analyzeImage = async (imageBase64: string) => {
    const prompt = `
      You are an advanced AI trained to detect and describe security threats in images.
      Based on the photo, describe any suspicious activity, presence of people or weapons, and estimate a threat level: Low, Medium, High, Critical.
    `;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64.split(",")[1], // Remove the data URI prefix
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json();
    const responseText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response from image analysis.";

    return { response: responseText };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await processAIQuery({ query: input });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          type: "ai",
          content: "⚠️ Error processing that request.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageCapture = async () => {
    if (!webcamRef.current) return;

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: "📸 Captured image for threat analysis.",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowWebcam(false);
    setIsLoading(true);

    try {
      const result = await analyzeImage(screenshot);

      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        type: "ai",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 3).toString(),
          type: "ai",
          content: "⚠️ Failed to analyze image.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow h-[700px] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Cchef Security AI</h2>
            <p className="text-sm text-gray-600">Smart threat analysis powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={() => setShowWebcam(!showWebcam)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          {showWebcam ? "Cancel" : "Capture Image"}
        </button>
      </div>

      {/* Webcam */}
      {showWebcam && (
        <div className="flex flex-col items-center py-4 space-y-4 bg-gray-100 border-b">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="rounded shadow-lg"
            width={320}
          />
          <button
            onClick={handleImageCapture}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Analyze Image
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-4xl rounded-lg p-4 ${
                message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="mt-2 text-xs opacity-70">{message.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t bg-gray-50">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Analyze threat in Zone C"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-yellow-500 text-white rounded-lg hover:from-red-700 hover:to-yellow-600 disabled:opacity-50"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          🔐 Gemini Smart Security Model · Real-time zone awareness
        </p>
      </div>
    </div>
  );
}
