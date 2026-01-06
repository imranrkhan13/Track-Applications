import React from "react";

export default function Info({ onClose }) {
    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="absolute inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-[80vh] md:max-w-3xl
                      bg-gradient-to-br from-white to-green-50 border border-emerald-200
                      rounded-t-3xl md:rounded-3xl shadow-2xl p-6 sm:p-8
                      animate-[fadeUp_0.45s_ease-out_forwards]">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">🌿</div>
                        <div>
                            <h2 className="text-2xl font-semibold text-emerald-900">About Career Garden</h2>
                            <p className="text-sm text-emerald-700">Grow your job search with gentle structure.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-full text-sm bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                        aria-label="Close"
                    >
                        Close
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6 text-emerald-900 leading-relaxed overflow-y-auto pr-1 md:pr-2 h-[65vh] md:h-[60vh]">
                    <Section
                        title="How it works"
                        items={[
                            "Each application is a plant in your garden.",
                            "Use the Add (🌱) button to create a new entry.",
                            "Choose a stage: Applied, Interview, Accepted, or Rejected.",
                            "Add notes, dates, and update the stage as things progress."
                        ]}
                    />

                    <Section
                        title="Garden stages"
                        custom={
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <li className="p-3 rounded-xl bg-green-50 border border-green-200">
                                    <div className="font-semibold">🌱 Applied</div>
                                    <div className="text-emerald-700">Seedlings you’ve planted—follow up and nurture.</div>
                                </li>
                                <li className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                                    <div className="font-semibold">🌿 Interview</div>
                                    <div className="text-emerald-700">Sprouts that need extra care—prep and practice.</div>
                                </li>
                                <li className="p-3 rounded-xl bg-emerald-100 border border-emerald-300">
                                    <div className="font-semibold">🌳 Accepted</div>
                                    <div className="text-emerald-700">Flourishing trees—celebrate wins and capture notes.</div>
                                </li>
                                <li className="p-3 rounded-xl bg-stone-100 border border-stone-300">
                                    <div className="font-semibold">🍂 Rejected</div>
                                    <div className="text-emerald-700">Leaves that fell—keep learnings, keep growing.</div>
                                </li>
                            </ul>
                        }
                    />

                    <Section
                        title="Filters & search"
                        items={[
                            "Tap the status chips to filter by stage.",
                            "Use the search box to quickly find a company by name.",
                            "‘View all’ expands lists when you have many entries."
                        ]}
                    />

                    <Section
                        title="Tips for momentum"
                        items={[
                            "Add short notes after interviews to capture learnings.",
                            "Schedule gentle follow-ups 5–7 days after applying.",
                            "Keep your Accepted stories—they help for future interviews."
                        ]}
                    />

                    <Section
                        title="Privacy & storage"
                        items={[
                            "Your data is saved locally in your browser (localStorage).",
                            "Export features can be added later if you’d like."
                        ]}
                    />
                </div>
            </div>

            {/* keyframes local safeguard (in case the page is loaded standalone) */}
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    );
}

function Section({ title, items, custom }) {
    return (
        <div className="space-y-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {items && (
                <ul className="list-disc pl-5 text-sm text-emerald-800 space-y-1.5">
                    {items.map((t, i) => (
                        <li key={i}>{t}</li>
                    ))}
                </ul>
            )}
            {custom}
        </div>
    );
}
