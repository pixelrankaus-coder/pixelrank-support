"use client";

import { useState } from "react";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import {
  HandThumbUpIcon as HandThumbUpSolid,
  HandThumbDownIcon as HandThumbDownSolid,
} from "@heroicons/react/24/solid";

export function ArticleFeedback({ articleId }: { articleId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"helpful" | "not_helpful" | null>(
    null
  );
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (isHelpful: boolean, userComment?: string) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/help/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          isHelpful,
          comment: userComment,
        }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedback = (isHelpful: boolean) => {
    setFeedback(isHelpful ? "helpful" : "not_helpful");

    if (!isHelpful) {
      setShowCommentForm(true);
    } else {
      submitFeedback(true);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFeedback(false, comment);
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 font-medium">
          Thank you for your feedback!
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Your input helps us improve our articles.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-gray-700 font-medium mb-4">
        Was this article helpful?
      </p>

      {!showCommentForm ? (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleFeedback(true)}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors ${
              feedback === "helpful"
                ? "bg-green-50 border-green-500 text-green-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {feedback === "helpful" ? (
              <HandThumbUpSolid className="w-5 h-5" />
            ) : (
              <HandThumbUpIcon className="w-5 h-5" />
            )}
            Yes
          </button>
          <button
            onClick={() => handleFeedback(false)}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors ${
              feedback === "not_helpful"
                ? "bg-red-50 border-red-500 text-red-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {feedback === "not_helpful" ? (
              <HandThumbDownSolid className="w-5 h-5" />
            ) : (
              <HandThumbDownIcon className="w-5 h-5" />
            )}
            No
          </button>
        </div>
      ) : (
        <form onSubmit={handleCommentSubmit} className="max-w-md mx-auto">
          <p className="text-sm text-gray-600 mb-3">
            We&apos;re sorry this article wasn&apos;t helpful. How can we improve it?
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us what was missing or unclear..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            rows={3}
          />
          <div className="flex gap-3 mt-3 justify-center">
            <button
              type="button"
              onClick={() => submitFeedback(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
