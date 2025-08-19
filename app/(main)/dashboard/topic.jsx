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

      if (!topic.trim()) {
        setLoading(false);
        return;
      }
      const result = await axios.post("/api/generate-script", { topic });
      setScripts(result.data?.scripts || []);
    } catch (error) {
      // Silent failure
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
    <div className="space-y-6">
      {/* Project Title Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold">
              📝
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">Project Title</h3>
        </div>
        <Input
          placeholder="Enter a compelling title for your video..."
          onChange={(event) =>
            onHandleInputChange("title", event?.target.value)
          }
          className="h-12 text-base border-2 border-gray-700 focus:border-blue-500 rounded-lg transition-colors duration-200 bg-gray-800 text-white placeholder-gray-400"
        />
      </div>

      {/* Video Topic Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
            <span className="text-purple-600 dark:text-purple-400 text-xs font-semibold">
              🎯
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Video Topic</h3>
            <p className="text-gray-400 text-sm">
              Choose from suggestions or write your own
            </p>
          </div>
        </div>

        <Tabs defaultValue="suggestion" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10 bg-gray-800 rounded-lg p-1">
            <TabsTrigger
              value="suggestion"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 rounded-md transition-all duration-200"
            >
              Suggestions
            </TabsTrigger>
            <TabsTrigger
              value="your_topic"
              className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300 rounded-md transition-all duration-200"
            >
              Your Topic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestion" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {suggestions.map((suggestion) => (
                <Button
                  variant={suggestion === selectTopic ? "default" : "outline"}
                  key={suggestion}
                  className={`relative h-12 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-300 ${
                    suggestion === selectTopic
                      ? "bg-purple-200 text-black shadow-lg scale-105 border-2 border-purple-500"
                      : "hover:scale-105 hover:shadow-md border-2 bg-gray-800 border-gray-700 text-white hover:text-white hover:border-blue-500"
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="your_topic" className="mt-4">
            <div className="space-y-3">
              <h4 className="text-base font-medium text-white">
                Enter your own topic
              </h4>
              <Textarea
                placeholder="Describe your video idea in detail..."
                value={customTopic}
                onChange={(event) =>
                  handleCustomTopicChange(event.target.value)
                }
                className={`min-h-[100px] text-base border-2 transition-all duration-300 rounded-lg resize-none bg-gray-800 text-white placeholder-gray-400 ${
                  customTopic.trim()
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-gray-700 focus:border-blue-500"
                }`}
              />

              {/* Custom Topic Indicator */}
              {customTopic.trim() && (
                <div className="flex items-center gap-2 p-2 bg-blue-900/20 rounded-lg border border-blue-800">
                  <span className="text-blue-400">✓</span>
                  <span className="text-blue-300 text-sm font-medium">
                    Custom topic selected
                  </span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate Script Button */}
      <div className="pt-2">
        <Button
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
      </div>

      {/* Script Selection */}
      {scripts.length > 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Choose Your Script
            </h3>
            <p className="text-gray-400 text-sm">
              Select the script that best fits your vision
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scripts.map((item, index) => (
              <div
                key={index}
                onClick={() => handleScriptSelect(index)}
                className={`
                  relative p-4 rounded-xl whitespace-pre-wrap text-sm shadow-lg border-2 cursor-pointer 
                  transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] outline-none 
                  focus-visible:ring-2 focus-visible:ring-blue-500 hover:-translate-y-1 
                  hover:shadow-xl hover:bg-gray-800
                  ${
                    selectedScriptIndex === index
                      ? "border-blue-500 bg-gray-800 shadow-xl"
                      : "border-gray-700 hover:border-blue-500 bg-gray-900"
                  }
                `}
              >
                {/* Script Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedScriptIndex === index
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span
                      className={`text-sm font-semibold ${
                        selectedScriptIndex === index
                          ? "text-blue-300"
                          : "text-gray-400"
                      }`}
                    >
                      Script {index + 1}
                    </span>
                    {selectedScriptIndex === index && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-blue-400 text-xs">
                          ✓ Selected
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Script Content */}
                <div className="text-gray-200 leading-relaxed">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Topic;
