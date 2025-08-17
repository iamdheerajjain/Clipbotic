"use client";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Loader2Icon, Sparkles, FileText } from "lucide-react";
import axios from "axios";

const suggestions = [
  "History Story",
  "Kids Story",
  "Movie Story",
  "AI Innovation",
  "Space Mystery",
  "Horror Story",
  "Mythological Tales",
  "Tech Breakthrough",
  "True Crime Story",
  "Fantasy Adventure",
  "Science Experiment",
  "Motivational Story",
];

function Topic({ onHandleInputChange, currentTopic = "" }) {
  const [selectTopic, setSelectedTopic] = useState(currentTopic);
  const [selectedScriptIndex, setSelectedScriptIndex] = useState(null);
  const [customTopic, setCustomTopic] = useState("");
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync local state with parent's form data
  useEffect(() => {
    if (currentTopic && currentTopic !== selectTopic) {
      setSelectedTopic(currentTopic);
    }
  }, [currentTopic, selectTopic]);

  const GenerateScript = async () => {
    setLoading(true);
    setSelectedScriptIndex(null);

    try {
      const topic = customTopic || selectTopic;

      // Check if topic is provided
      if (!topic.trim()) {
        console.error("Please select or enter a topic first.");
        setLoading(false);
        return;
      }

      console.log("Sending topic:", topic);
      const result = await axios.post("/api/generate-script", { topic });
      console.log("Generated Scripts:", result.data);
      setScripts(result.data?.scripts || []);
    } catch (error) {
      console.error("Script generation failed:");

      // Better error logging
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);
      } else if (error.request) {
        console.error("Request made but no response:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      // More specific error messages for user
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";

      console.error(`Failed to generate script: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSelectedTopic(suggestion);
    setCustomTopic("");
    onHandleInputChange("topic", suggestion);
  };

  const handleCustomTopicChange = (value) => {
    setCustomTopic(value);
    setSelectedTopic("");
    onHandleInputChange("topic", value);
  };

  const handleScriptSelect = (index) => {
    setSelectedScriptIndex(index);
    // Pass the selected script to parent component
    onHandleInputChange("script", scripts[index].content);
  };

  return (
    <div>
      <h2 className="mb-1">Project Title</h2>
      <Input
        placeholder="Enter project Title"
        onChange={(event) => onHandleInputChange("title", event?.target.value)}
      />

      <div className="mt-5">
        <h2>Video Topic</h2>
        <p className="text-sm text-muted-foreground">
          Select topic for your video
        </p>
        <Tabs defaultValue="suggestion" className="w-full mt-2">
          <TabsList>
            <TabsTrigger value="suggestion">Suggestions</TabsTrigger>
            <TabsTrigger value="your_topic">Your Topic</TabsTrigger>
          </TabsList>

          <TabsContent value="suggestion">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {suggestions.map((suggestion) => (
                <Button
                  variant={suggestion === selectTopic ? "secondary" : "outline"}
                  key={suggestion}
                  className={`relative h-12 outline-none focus-visible:ring-2 focus-visible:ring-[--brand-from] transition-all duration-300 hover:!text-white ${
                    suggestion === selectTopic
                      ? "border-[--brand-from] border-2 !text-white"
                      : ""
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="your_topic">
            <div>
              <h2>Enter your own topic</h2>
              <Textarea
                placeholder="Enter your topic"
                value={customTopic}
                onChange={(event) =>
                  handleCustomTopicChange(event.target.value)
                }
                className={`transition-all duration-300 ${
                  customTopic.trim()
                    ? "border-[--brand-from] ring-[--brand-from]/20"
                    : ""
                }`}
              />

              {/* Custom Topic Indicator */}
              {customTopic.trim() && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[--brand-from]">
                  <span>Custom topic selected</span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Button
        className="mt-3 w-full"
        disabled={loading || (!selectTopic && !customTopic.trim())}
        onClick={GenerateScript}
      >
        {loading ? (
          <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Generate Script
      </Button>

      {scripts.length > 0 && (
        <div className="mt-5">
          <h2 className="text-center text-xl font-semibold mb-4">
            Select the Script
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scripts.map((item, index) => (
              <div
                key={index}
                onClick={() => handleScriptSelect(index)}
                className={`
                  relative p-4 rounded-xl whitespace-pre-wrap text-sm shadow-md border 
                  cursor-pointer transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none focus-visible:ring-2 focus-visible:ring-[--brand-from] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.28)] hover:bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] hover:border-[color-mix(in_oklab,var(--primary)_25%,transparent)]
                  ${
                    selectedScriptIndex === index
                      ? "border-[--brand-from] border-2"
                      : "border-border"
                  }
                `}
              >
                {/* Script Icon */}
                <div className="flex items-center gap-2 mb-2">
                  <FileText
                    className={`w-4 h-4 ${
                      selectedScriptIndex === index
                        ? "text-[--brand-from]"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    Script {index + 1}
                  </span>
                </div>

                {item.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Topic;
