"use client";

import React, { useState } from "react";

export type InfoTab = "privacy" | "terms" | "disclaimer" | "contact" | "about";

export function FooterInfoModal() {
  const [activeTab, setActiveTab] = useState<InfoTab | null>(null);

  const closeModal = () => setActiveTab(null);

  return (
    <>
      {/* Persistent Bottom Footer Bar */}
      <footer className="w-full border-t border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-sm py-4 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400 text-center md:text-left">
          <div>
            <p className="font-medium text-stone-700 dark:text-stone-300">
              UPSC Preparation Tracker is part of the{" "}
              <span className="font-semibold text-stone-900 dark:text-white">
                MG-XI Technologies ecosystem
              </span>
              , an independent technology and innovation collective.
            </p>
            <p className="mt-0.5 text-stone-400 dark:text-stone-500">
              © 2026 UPSC Preparation Tracker. All Rights Reserved.
            </p>
          </div>

          {/* Interactive Modal Triggers */}
          <div className="flex items-center flex-wrap justify-center gap-2 font-medium text-stone-600 dark:text-stone-300">
            <button
              onClick={() => setActiveTab("privacy")}
              className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab("terms")}
              className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Terms
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab("disclaimer")}
              className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Disclaimer
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab("contact")}
              className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab("about")}
              className="hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
          </div>
        </div>
      </footer>

      {/* Pop-up Information Modal */}
      {activeTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header & Navigation Bar */}
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-4 bg-stone-50 dark:bg-stone-900/50">
              <nav className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
                {(["privacy", "terms", "disclaimer", "contact", "about"] as InfoTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                        activeTab === tab
                          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                          : "text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800"
                      }`}
                    >
                      {tab === "privacy" && "Privacy Policy"}
                      {tab === "terms" && "Terms of Use"}
                      {tab === "disclaimer" && "Disclaimer"}
                      {tab === "contact" && "Contact Us"}
                      {tab === "about" && "About Platform"}
                    </button>
                  )
                )}
              </nav>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {/* 1. PRIVACY POLICY */}
              {activeTab === "privacy" && (
                <div className="space-y-4">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-2">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                      Privacy Policy
                    </h3>
                    <p className="text-xs text-stone-400">Last Updated: August 2026</p>
                  </div>
                  <p>
                    UPSC Preparation Tracker is an independent educational and productivity platform developed under the <strong>MG-XI Technologies ecosystem</strong>. We collect and manage data strictly to operate, maintain, and optimize preparation tracking.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                        1. Information Collected
                      </h4>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-600 dark:text-stone-400">
                        <li>
                          <strong>Account Details:</strong> Name, verified email address, and authentication credentials.
                        </li>
                        <li>
                          <strong>Study Records:</strong> Task logs, spaced revision intervals, mock scores, answer writing evaluations, and syllabus completion states.
                        </li>
                        <li>
                          <strong>Technical Logs:</strong> IP address, browser signatures, timestamps, and session tokens essential for system security and role verification.
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                        2. Purpose Limitation & DPDP Compliance
                      </h4>
                      <p className="text-stone-600 dark:text-stone-400">
                        In accordance with India&apos;s <strong>Digital Personal Data Protection (DPDP)</strong> framework, data collection is limited strictly to operational needs. We do not sell or commercialize personal preparation data.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                        3. Storage, Security & User Rights
                      </h4>
                      <p className="text-stone-600 dark:text-stone-400">
                        All passwords and tokens are hashed and encrypted. Users retain complete rights to access, rectify, or request deletion of their preparation data by contacting the technical team.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. TERMS OF USE */}
              {activeTab === "terms" && (
                <div className="space-y-4">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-2">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                      Terms of Use
                    </h3>
                    <p className="text-xs text-stone-400">Last Updated: August 2026</p>
                  </div>
                  <p>
                    By using UPSC Preparation Tracker, you agree to comply with platform usage guidelines and integrity rules.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                        1. Educational Utility Scope
                      </h4>
                      <p className="text-stone-600 dark:text-stone-400">
                        The platform functions as an organizational study companion. It does not substitute for official Union Public Service Commission notifications, gazettes, or authoritative guidance.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                        2. User Responsibilities & Acceptable Use
                      </h4>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-600 dark:text-stone-400">
                        <li>Maintain credential confidentiality; unauthorized tenant access is strictly prohibited.</li>
                        <li>Do not introduce malicious code, run unauthorized penetration tests, or disrupt infrastructure.</li>
                        <li>Respect platform design, software logic, and proprietary dashboard architectures.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                        3. Governing Law & Availability
                      </h4>
                      <p className="text-stone-600 dark:text-stone-400">
                        These terms are governed by the laws of India. Services are provided on an &quot;as available&quot; basis to support continuous aspirant study routines.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. DISCLAIMER */}
              {activeTab === "disclaimer" && (
                <div className="space-y-4">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-2">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                      Disclaimer
                    </h3>
                    <p className="text-xs text-stone-400">Last Updated: August 2026</p>
                  </div>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg text-amber-900 dark:text-amber-300">
                    <p className="font-semibold">Non-Affiliation Notice:</p>
                    <p className="text-xs mt-0.5">
                      UPSC Preparation Tracker is an independent project and is <strong>not</strong> affiliated with, endorsed by, or operated on behalf of the Union Public Service Commission (UPSC) or the Government of India.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                        1. Verification of Official Data
                      </h4>
                      <p className="text-stone-600 dark:text-stone-400">
                        While syllabus structures and PYQ tags are rigorously cataloged, examination schedules, eligibility criteria, and syllabus modifications must always be verified directly from official UPSC notifications.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                        2. Analytical Estimates & Outcomes
                      </h4>
                      <p className="text-stone-600 dark:text-stone-400">
                        Progress percentages, completion metrics, and mock averages serve solely as self-monitoring tools and do not guarantee examination qualification or ranking.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CONTACT */}
              {activeTab === "contact" && (
                <div className="space-y-4">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-2">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                      Contact & Technical Support
                    </h3>
                    <p className="text-xs text-stone-400">
                      Reach out for assistance, bug reports, or feedback
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-lg space-y-1">
                      <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">
                        Technical Inquiries & Support
                      </span>
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        mgxi.technologies@gmail.com
                      </p>
                      <p className="text-xs text-stone-500">
                        Account issues, sync errors, or calculation bugs
                      </p>
                    </div>

                    <div className="p-3 bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-lg space-y-1">
                      <span className="text-[11px] font-mono uppercase text-stone-400 font-bold block">
                        Privacy & Ecosystem Helpdesk
                      </span>
                      <p className="font-semibold text-stone-900 dark:text-stone-100">
                        +91 9135571488
                      </p>
                      <p className="text-xs text-stone-500">
                        Data inquiries & MG-XI Collective communications
                      </p>
                    </div>
                  </div>

                  <div className="p-3 border border-stone-200 dark:border-stone-800 rounded-lg text-xs space-y-1 text-stone-600 dark:text-stone-400">
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      Reporting an Issue Effectively:
                    </p>
                    <p>
                      Please provide the affected feature URL, device/browser details, and reproducible error steps when reporting technical glitches.
                    </p>
                  </div>
                </div>
              )}

              {/* 5. ABOUT */}
              {activeTab === "about" && (
                <div className="space-y-4">
                  <div className="border-b border-stone-100 dark:border-stone-800 pb-2">
                    <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                      About UPSC Preparation Tracker
                    </h3>
                    <p className="text-xs text-stone-400">
                      An MG-XI Technologies Initiative
                    </p>
                  </div>

                  <p>
                    UPSC Preparation Tracker was built to solve a fundamental challenge in civil services preparation: providing structure, measurable progress, and automated revision workflows within a single, dedicated platform.
                  </p>

                  <div className="p-3.5 bg-stone-50 dark:bg-stone-900/60 border-l-2 border-stone-900 dark:border-stone-100 rounded-r-lg space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-semibold block">
                      Inspiration Behind The Platform
                    </span>
                    <p className="text-xs italic text-stone-800 dark:text-stone-200">
                      &quot;The idea for UPSC Preparation Tracker was inspired by Kaushal Kishan, an alumnus in Political Science from the University of Delhi. His early preparation highlighted that competitive exam success requires not just study resources, but a structured digital infrastructure to organize targets, monitor weak areas, and maintain daily discipline.&quot;
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-stone-900 dark:text-stone-200">
                      Core Platform Capabilities
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-400 font-mono">
                      <div className="p-2 border border-stone-200 dark:border-stone-800 rounded">
                        ✓ Spaced Revision Engine
                      </div>
                      <div className="p-2 border border-stone-200 dark:border-stone-800 rounded">
                        ✓ Multi-Stage Syllabus Tree
                      </div>
                      <div className="p-2 border border-stone-200 dark:border-stone-800 rounded">
                        ✓ Micro-Task Execution Hub
                      </div>
                      <div className="p-2 border border-stone-200 dark:border-stone-800 rounded">
                        ✓ Weakness & Error Analytics
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Close Action */}
            <div className="border-t border-stone-200 dark:border-stone-800 px-6 py-3 bg-stone-50 dark:bg-stone-900/50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}