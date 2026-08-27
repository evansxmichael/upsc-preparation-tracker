"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface TopicItem {
  id: string;
  title: string;
  completed: boolean;
  orderIndex?: number;
}

interface SubjectItem {
  id: string;
  name: string;
  topics: TopicItem[];
}

interface CategoryItem {
  id: string;
  title: string;
  subTitle?: string | null;
  tier: string;
  subjects: SubjectItem[];
}

export default function CompleteSyllabusPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [optionalSubjectName, setOptionalSubjectName] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");

  // Accordion collapsed state per subject
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});

  // Input states for adding new topics per subject
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});

  // Input states for adding new custom subjects per category
  const [newSubjectInputs, setNewSubjectInputs] = useState<Record<string, string>>({});
  const [showSubjectAddBox, setShowSubjectAddBox] = useState<Record<string, boolean>>({});

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "topic" | "subject";
    categoryId: string;
    subjectId: string;
    topicId?: string;
    title: string;
  } | null>(null);

  const fetchSyllabusFromDb = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/syllabus");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error("Failed to load syllabus from DB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabusFromDb();
    const savedOptional = localStorage.getItem("upsc_optional_subject_name");
    if (savedOptional) setOptionalSubjectName(savedOptional);
  }, []);

  const toggleSubjectCollapse = (subjectId: string) => {
    setCollapsedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  // Instant DB toggle on checkbox click
  const toggleTopicCheck = async (categoryId: string, subjectId: string, topicId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    // Optimistic UI Update
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          subjects: cat.subjects.map((sub) => {
            if (sub.id !== subjectId) return sub;
            return {
              ...sub,
              topics: sub.topics.map((top) => {
                if (top.id !== topicId) return top;
                return { ...top, completed: nextStatus };
              }),
            };
          }),
        };
      })
    );

    try {
      await fetch("/api/syllabus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, completed: nextStatus }),
      });
    } catch (e) {
      console.error("Failed to update topic status in DB", e);
    }
  };

  const handleAddTopic = async (categoryId: string, subjectId: string) => {
    const text = newTopicInputs[subjectId]?.trim();
    if (!text) return;

    try {
      const res = await fetch("/api/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, title: text }),
      });

      if (res.ok) {
        const newTopic: TopicItem = await res.json();
        setCategories((prev) =>
          prev.map((cat) => {
            if (cat.id !== categoryId) return cat;
            return {
              ...cat,
              subjects: cat.subjects.map((sub) => {
                if (sub.id !== subjectId) return sub;
                return {
                  ...sub,
                  topics: [...sub.topics, { ...newTopic, completed: false }],
                };
              }),
            };
          })
        );
        setNewTopicInputs((prev) => ({ ...prev, [subjectId]: "" }));
      }
    } catch (e) {
      console.error("Failed to add topic to DB", e);
    }
  };

  const handleAddSubject = (categoryId: string) => {
    const text = newSubjectInputs[categoryId]?.trim();
    if (!text) return;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          subjects: [...cat.subjects, { id: `sub-${Date.now()}`, name: text, topics: [] }],
        };
      })
    );
    setNewSubjectInputs((prev) => ({ ...prev, [categoryId]: "" }));
    setShowSubjectAddBox((prev) => ({ ...prev, [categoryId]: false }));
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "topic" && deleteTarget.topicId) {
      // 1. Delete from database if it's a persisted custom topic
      try {
        await fetch(`/api/syllabus?id=${deleteTarget.topicId}`, {
          method: "DELETE",
        });
      } catch (e) {
        console.error("Failed to delete topic from DB", e);
      }

      // 2. Remove from local UI state
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id !== deleteTarget.categoryId) return cat;
          return {
            ...cat,
            subjects: cat.subjects.map((sub) => {
              if (sub.id !== deleteTarget.subjectId) return sub;
              return {
                ...sub,
                topics: sub.topics.filter((t) => t.id !== deleteTarget.topicId),
              };
            }),
          };
        })
      );
    } else if (deleteTarget.type === "subject") {
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id !== deleteTarget.categoryId) return cat;
          return {
            ...cat,
            subjects: cat.subjects.filter((s) => s.id !== deleteTarget.subjectId),
          };
        })
      );
      setHasUnsavedChanges(true);
      setSaveStatus("unsaved");
    }

    setDeleteTarget(null);
  };

  const handleSaveAll = () => {
    setSaveStatus("saving");
    localStorage.setItem("upsc_optional_subject_name", optionalSubjectName);
    setTimeout(() => {
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
    }, 400);
  };

  const handleBackup = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(categories, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `upsc_syllabus_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleReset = async () => {
    if (window.confirm("Discard unsaved edits and restore latest syllabus?")) {
      await fetchSyllabusFromDb();
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-800 border-t-transparent" />
        <span className="font-mono text-xs text-stone-400">Loading your syllabus...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none pb-24">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            RELATIONAL PROGRESS REGISTER
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            UPSC Preparation Tracker
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer"
          >
            <span>📥</span> Backup
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer"
          >
            <span>🔄</span> Sync DB
          </button>
        </div>
      </div>

      {/* Main Categories */}
      {categories.map((cat) => (
        <div key={cat.id} className="space-y-4">
          {/* Category Banner */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-[#991b1b] uppercase tracking-wider font-bold">
              {cat.title} {cat.subTitle ? `• ${cat.subTitle}` : ""}
            </span>
            <button
              onClick={() =>
                setShowSubjectAddBox((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
              }
              className="text-xs font-mono text-gray-600 hover:text-[#0f172a] bg-white border border-gray-200 px-2.5 py-1 rounded cursor-pointer"
            >
              + Add Subject Section
            </button>
          </div>

          {/* Add Subject Section Input Form */}
          {showSubjectAddBox[cat.id] && (
            <div className="p-3 bg-white border border-dashed border-gray-300 rounded flex gap-2">
              <input
                type="text"
                placeholder="Enter Subject Section Name (e.g. Science & Technology)..."
                value={newSubjectInputs[cat.id] || ""}
                onChange={(e) =>
                  setNewSubjectInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSubject(cat.id);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden font-sans"
              />
              <button
                onClick={() => handleAddSubject(cat.id)}
                className="px-3 py-1.5 text-xs font-mono font-medium rounded bg-[#0f172a] text-white hover:bg-gray-800 cursor-pointer"
              >
                Create Section
              </button>
              <button
                onClick={() =>
                  setShowSubjectAddBox((prev) => ({ ...prev, [cat.id]: false }))
                }
                className="px-2 py-1.5 text-xs font-mono text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Optional Subject Input Box */}
          {cat.tier === "MAINS" && (
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1.5">
              <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                OPTIONAL SUBJECT
              </span>
              <input
                type="text"
                value={optionalSubjectName}
                onChange={(e) => {
                  setOptionalSubjectName(e.target.value);
                  setHasUnsavedChanges(true);
                  setSaveStatus("unsaved");
                }}
                placeholder="e.g. Sociology, PSIR, Geography, History..."
                className="w-full px-3 py-2 text-sm bg-[#fbfbf9] border border-gray-200 rounded text-gray-800 focus:outline-hidden focus:border-gray-400 font-sans"
              />
            </div>
          )}

          {/* Subjects in this category */}
          <div className="space-y-4">
            {cat.subjects?.map((sub) => {
              const isCollapsed = !!collapsedSubjects[sub.id];
              const completedCount = sub.topics?.filter((t) => t.completed).length || 0;
              const totalCount = sub.topics?.length || 0;
              const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={sub.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs transition-shadow"
                >
                  {/* Subject Title Bar */}
                  <div
                    onClick={() => toggleSubjectCollapse(sub.id)}
                    className="flex justify-between items-center cursor-pointer border-b border-gray-100 pb-3"
                  >
                    <div>
                      <h3 className="font-serif font-bold text-gray-900 text-lg">
                        {sub.name}
                      </h3>
                      <span className="text-xs font-mono text-gray-500">
                        {completedCount}/{totalCount} topics • {percent}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({
                            type: "subject",
                            categoryId: cat.id,
                            subjectId: sub.id,
                            title: sub.name,
                          });
                        }}
                        className="text-gray-300 hover:text-red-600 text-sm p-1 transition cursor-pointer"
                        title="Delete Entire Section"
                      >
                        🗑️
                      </button>
                      <button className="text-gray-400 hover:text-gray-700 text-xs font-mono px-2">
                        {isCollapsed ? "▼" : "▲"}
                      </button>
                    </div>
                  </div>

                  {/* Subtopics List */}
                  {!isCollapsed && (
                    <div className="mt-4 space-y-1">
                      {sub.topics?.map((topic) => (
                        <div
                          key={topic.id}
                          className="group flex items-center justify-between p-2 rounded hover:bg-[#fbfbf9] transition-colors"
                        >
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={topic.completed}
                              onChange={() =>
                                toggleTopicCheck(cat.id, sub.id, topic.id, topic.completed)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-[#0f172a] focus:ring-0 cursor-pointer"
                            />
                            <span
                              className={`text-sm ${
                                topic.completed
                                  ? "text-gray-400 line-through"
                                  : "text-gray-800"
                              }`}
                            >
                              {topic.title}
                            </span>
                          </label>

                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: "topic",
                                categoryId: cat.id,
                                subjectId: sub.id,
                                topicId: topic.id,
                                title: topic.title,
                              })
                            }
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 px-2 text-base font-bold transition-opacity cursor-pointer"
                            title="Delete Topic"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {/* Add Topic Input */}
                      <div className="flex gap-2 pt-3 mt-2 border-t border-gray-100">
                        <input
                          type="text"
                          placeholder="Add a topic..."
                          value={newTopicInputs[sub.id] || ""}
                          onChange={(e) =>
                            setNewTopicInputs((prev) => ({
                              ...prev,
                              [sub.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleAddTopic(cat.id, sub.id);
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden focus:border-gray-400 font-sans"
                        />
                        <button
                          onClick={() => handleAddTopic(cat.id, sub.id)}
                          className="px-3 py-1.5 text-xs font-mono font-medium rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 flex items-center gap-1 cursor-pointer"
                        >
                          <span>+</span> Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Floating Save Status Bar at Bottom */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-[#fbfbf9]/95 backdrop-blur-xs border-t border-gray-200 p-4 flex justify-between items-center px-6 md:px-8 z-40">
        <span className="text-xs font-mono text-gray-500">
          {saveStatus === "saved" ? (
            <span className="text-emerald-700 font-medium">✓ All changes saved</span>
          ) : saveStatus === "saving" ? (
            <span className="text-blue-700 font-medium">● Saving...</span>
          ) : (
            <span className="text-amber-700 font-medium">● Unsaved local changes</span>
          )}
        </span>
        <button
          onClick={handleSaveAll}
          disabled={!hasUnsavedChanges}
          className={`flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold rounded shadow-xs transition ${
            hasUnsavedChanges
              ? "bg-[#0f172a] text-white hover:bg-black cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <span>💾</span> Save
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === "subject"
            ? "Confirm Section Deletion"
            : "Confirm Topic Deletion"
        }
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All progress inside will be lost.`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}