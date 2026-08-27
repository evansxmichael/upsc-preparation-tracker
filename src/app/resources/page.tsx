"use client";

import { useState, useEffect, useMemo } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export type ResourceType =
  | "BOOK"
  | "PDF"
  | "YOUTUBE"
  | "DRIVE"
  | "CLOUDINARY"
  | "WEBSITE"
  | "NOTES";

interface SubjectOption {
  id: string;
  name: string;
  topics: { id: string; title: string }[];
}

interface ResourceItem {
  id: string;
  title: string;
  type: ResourceType;
  url?: string | null;
  sourceName?: string | null;
  notes?: string | null;
  createdAt: string;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; title: string } | null;
}

const TYPE_CONFIG: Record<
  ResourceType,
  { label: string; badgeClass: string; icon: string }
> = {
  YOUTUBE: {
    label: "YouTube Video/Playlist",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    icon: "▶️",
  },
  DRIVE: {
    label: "Google Drive",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "📁",
  },
  CLOUDINARY: {
    label: "Cloudinary Cloud",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    icon: "☁️",
  },
  WEBSITE: {
    label: "Website / Portal",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "🌐",
  },
  PDF: {
    label: "PDF Document",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "📄",
  },
  BOOK: {
    label: "Physical Book",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-300",
    icon: "📖",
  },
  NOTES: {
    label: "Self / Revision Notes",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "📝",
  },
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("ALL");

  // Modal & Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("YOUTUBE");
  const [url, setUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRes, sylRes] = await Promise.all([
        fetch("/api/resources"),
        fetch("/api/syllabus"),
      ]);

      if (resRes.ok) setResources(await resRes.json());
      if (sylRes.ok) {
        const sylData = await sylRes.json();
        const extracted: SubjectOption[] = sylData.flatMap(
          (c: any) => c.subjects || []
        );
        setSubjects(extracted);
      }
    } catch (e) {
      console.error("Failed to load study resources", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Normalize URL
    let formattedUrl = url.trim();
    if (formattedUrl && !formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          url: formattedUrl || null,
          sourceName: sourceName.trim() || null,
          notes: notes.trim() || null,
          subjectId: selectedSubjectId || null,
          topicId: selectedTopicId || null,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        setResources((prev) => [saved, ...prev]);
        setTitle("");
        setUrl("");
        setSourceName("");
        setNotes("");
        setSelectedSubjectId("");
        setSelectedTopicId("");
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Failed to save resource", err);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/resources?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error("Failed to delete resource", err);
    }

    setDeleteTarget(null);
  };

  // Filter Engine
  const filteredResources = useMemo(() => {
    return resources.filter((item) => {
      if (selectedTypeFilter !== "ALL" && item.type !== selectedTypeFilter) {
        return false;
      }
      if (
        selectedSubjectFilter !== "ALL" &&
        item.subject?.id !== selectedSubjectFilter
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSource = item.sourceName?.toLowerCase().includes(q);
        const matchSubject = item.subject?.name.toLowerCase().includes(q);
        const matchTopic = item.topic?.title.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        if (!matchTitle && !matchSource && !matchSubject && !matchTopic && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [resources, selectedTypeFilter, selectedSubjectFilter, searchQuery]);

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        Loading study material repository...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            EXTERNAL REPOSITORY & BOOKLIST
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            Material & Cloud Resource Manager
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a] text-white rounded text-xs font-mono hover:bg-black shadow-2xs transition cursor-pointer font-medium"
        >
          <span>+</span> Add Study Link
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">
            Total Resources
          </span>
          <p className="text-2xl font-serif font-bold text-[#0f172a] mt-1">
            {resources.length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">
            YouTube & Drive Links
          </span>
          <p className="text-2xl font-bold text-blue-800 mt-1">
            {
              resources.filter(
                (r) => r.type === "YOUTUBE" || r.type === "DRIVE" || r.type === "CLOUDINARY"
              ).length
            }
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">
            Standard Books
          </span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {resources.filter((r) => r.type === "BOOK").length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">
            Filtered Match
          </span>
          <p className="text-2xl font-serif font-bold text-[#991b1b] mt-1">
            {filteredResources.length}
          </p>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search by title, author, YouTube playlist, topic notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden font-sans text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
            >
              <option value="ALL">All Types</option>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            {(searchQuery || selectedTypeFilter !== "ALL" || selectedSubjectFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTypeFilter("ALL");
                  setSelectedSubjectFilter("ALL");
                }}
                className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.map((item) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.WEBSITE;

          return (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col justify-between gap-3 relative group"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-mono uppercase text-[#991b1b] font-bold">
                    {item.subject?.name || "General Study"}
                  </span>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 border rounded-full font-medium flex items-center gap-1 ${cfg.badgeClass}`}
                  >
                    <span>{cfg.icon}</span> {cfg.label}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-gray-900 text-base leading-snug">
                  {item.title}
                </h3>

                {item.topic && (
                  <div className="text-[11px] font-mono text-gray-500">
                    Topic: <span className="text-gray-800">{item.topic.title}</span>
                  </div>
                )}

                {item.sourceName && (
                  <p className="text-xs text-gray-600 font-sans">
                    <span className="font-mono text-gray-400">Author / Source:</span>{" "}
                    {item.sourceName}
                  </p>
                )}

                {item.notes && (
                  <p className="text-xs text-gray-500 italic bg-[#fbfbf9] p-2 rounded border border-gray-100">
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons: Direct Redirection Link & Delete */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 font-mono text-xs">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a] text-white rounded hover:bg-black transition text-xs font-semibold shadow-2xs"
                  >
                    <span>🔗</span> Open {item.type === "YOUTUBE" ? "Watch Video" : item.type === "DRIVE" ? "Open Drive" : "Study Material"} →
                  </a>
                ) : (
                  <span className="text-gray-400 text-[11px] italic">
                    Physical copy / Offline resource
                  </span>
                )}

                <button
                  onClick={() => setDeleteTarget(item)}
                  className="text-gray-300 hover:text-red-600 p-1.5 transition cursor-pointer text-base"
                  title="Delete Resource"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-lg">
          <p className="text-xs font-mono text-gray-400">
            No study resources or links found matching your active filter.
          </p>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-gray-900 text-lg">
              Add Study Link / Repository Source
            </h3>
            <form onSubmit={handleAdd} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-mono text-gray-500 mb-1">Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern History Spectrum Complete Playlist / Drive Folder"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">Resource Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ResourceType)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    <option value="YOUTUBE">YouTube (Video / Playlist)</option>
                    <option value="DRIVE">Google Drive (Folder / PDF)</option>
                    <option value="CLOUDINARY">Cloudinary Cloud Document</option>
                    <option value="WEBSITE">Website / Portal URL</option>
                    <option value="PDF">Direct PDF URL</option>
                    <option value="BOOK">Physical Book / Offline</option>
                    <option value="NOTES">Self Handwritten / Revision Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Author / Channel / Source</label>
                  <input
                    type="text"
                    placeholder="e.g. Vision IAS, Mrinal Patel, Spectrum"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              {/* Direct URL Input */}
              {type !== "BOOK" && (
                <div>
                  <label className="block font-mono text-gray-500 mb-1">
                    Direct Web / YouTube / Drive Link
                  </label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?... or https://drive.google.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs font-mono"
                  />
                  <span className="text-[10px] text-gray-400 font-mono">
                    Clicking the card opens this link in a new tab without uploading heavy files.
                  </span>
                </div>
              )}

              {/* Link to Syllabus Subject & Topic */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">Link Subject (Optional)</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedTopicId("");
                    }}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    <option value="">-- None --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Link Topic (Optional)</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    <option value="">-- None --</option>
                    {currentSubjectObj?.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-gray-500 mb-1">Notes / Key Chapters Covered</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chapters 1 to 14 only, contains high-yield PYQ maps..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 font-mono">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#0f172a] text-white hover:bg-black font-bold cursor-pointer"
                >
                  Save Resource Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Resource"
        message={`Are you sure you want to remove "${deleteTarget?.title}" from your repository?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}