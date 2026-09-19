import React, { useState } from 'react';
import {
    mockPatients,
    mockDashboardStats,
    mockTimeline,
    mockAIPrediction,
    mockUsers
} from '../mocks';
import {
    Button,
    Input,
    Card,
    Badge,
    PatientCard,
    StatBlock,
    AIInsight,
    EditorialTimeline
} from '../components/design/Editorial';

export default function DesignShowcase() {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="flex h-screen bg-[#FAF8F5] overflow-hidden selection:bg-[#C5D4C2] selection:text-[#2D5A3D]">

            {/* Editorial Sidebar */}
            <aside className="hidden md:flex flex-col justify-between w-[280px] border-r border-[#E5E0D8] p-8 shrink-0 relative bg-[#FDFCFA] z-20">
                <div className="flex flex-col gap-12">
                    {/* Logo */}
                    <div className="text-display-sm tracking-tighter text-[#2D5A3D]">
                        ArogyaSakhi.<span className="text-[#C4704B]">*</span>
                    </div>

                    <nav className="flex flex-col gap-6">
                        {['Dashboard', 'Community Health', 'Maternal Care', 'Emergency SOS'].map((item, i) => (
                            <button
                                key={item}
                                onClick={() => setActiveTab(item.toLowerCase())}
                                className={`text-left font-sans text-sm tracking-wide transition-all
                  ${i === 0 ? 'text-[#2C2C2C] font-semibold' : 'text-[#6B6B6B] hover:text-[#C4704B]'}
                `}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4 pt-8 border-t border-[#E5E0D8]">
                    <div className="w-10 h-10 rounded-full bg-[#E8C4B0] text-[#2C2C2C] flex items-center justify-center font-serif text-xl border border-[#C4704B]">
                        P
                    </div>
                    <div className="flex flex-col">
                        <span className="font-sans text-sm font-medium text-[#2C2C2C]">Dr. Priya Iyer</span>
                        <span className="text-label text-[#A3B8A0]">Primary Health</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto scroll-smooth relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-6 border-b border-[#E5E0D8] sticky top-0 bg-[#FAF8F5]/80 backdrop-blur z-30">
                    <div className="text-display-sm tracking-tighter text-[#2D5A3D]">ArogyaSakhi.</div>
                    <div className="w-8 h-8 rounded-full bg-[#E8C4B0] flex items-center justify-center font-serif">P</div>
                </header>

                <div className="max-w-[1400px] mx-auto p-6 md:p-16 lg:p-24 flex flex-col gap-16 md:gap-24 page-enter">

                    {/* Section: Typography & Tone */}
                    <section className="stagger max-w-3xl">
                        <h1 className="text-display-xl mb-6">Good morning, Priya.</h1>
                        <p className="text-display-sm text-[#4A4A4A] leading-relaxed">
                            Your community is generally stable today. However, there are <span className="text-[#B5403A] font-serif italic">3 urgent alerts</span> requiring your immediate attention.
                        </p>
                    </section>

                    {/* Section: Stats & Hierarchy */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 items-end stagger">
                        <StatBlock
                            number={mockDashboardStats.totalPatients}
                            label="TOTAL PATIENTS"
                            subtext="Across 6 villages"
                        />
                        <StatBlock
                            number={mockDashboardStats.highRisk}
                            label="HIGH RISK"
                            subtext="Critical follow-up needed"
                        />
                        <StatBlock
                            number={mockDashboardStats.pregnantWomen}
                            label="MATERNAL"
                            subtext="Currently enrolled"
                        />
                        <StatBlock
                            number={mockDashboardStats.pendingAlerts}
                            label="SOS ALERTS"
                            subtext="Unresolved in 24h"
                        />
                    </section>

                    <hr className="divider-thick" />

                    {/* Section: AI Insight & Editorial Layout */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start pb-8">
                        <div className="lg:col-span-5 flex flex-col gap-6 stagger">
                            <h2 className="text-display-md text-[#2C2C2C]">Clinical Insight</h2>
                            <p className="text-body text-[#6B6B6B]">
                                Based on continuous community monitoring, the intelligence system has aggregated symptoms from recent visits indicating a potential cluster.
                            </p>
                            <div className="mt-4">
                                <EditorialTimeline items={mockTimeline} />
                            </div>
                        </div>

                        <div className="lg:col-span-7 pt-4">
                            <AIInsight insight={mockAIPrediction} />
                        </div>
                    </section>

                    <hr className="divider" />

                    {/* Section: Patient Matrix / Tables */}
                    <section className="flex flex-col gap-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <h2 className="text-display-lg text-[#2C2C2C]">Priority Matrix</h2>
                                <p className="text-body text-[#6B6B6B] mt-2">Active cases requiring intervention across your covered districts.</p>
                            </div>
                            <Button variant="outline" className="shrink-0">View All Encounters</Button>
                        </div>

                        <div className="flex flex-col border-t border-[#E5E0D8]">
                            {mockPatients.slice(0, 4).map((patient, idx) => (
                                <PatientCard key={patient.id} index={idx + 1} patient={patient} />
                            ))}
                        </div>
                    </section>

                    <hr className="divider" />

                    {/* Section: Components Showcase */}
                    <section className="flex flex-col gap-12 pb-24">
                        <h2 className="text-display-md">Component Anatomy</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <Card className="flex flex-col gap-8">
                                <h3 className="text-display-sm">Forms & Actions</h3>
                                <div className="flex flex-col gap-6">
                                    <Input label="PATIENT ID OR NAME" id="search" placeholder="E.g., HID-0001" />
                                    <div className="flex flex-wrap gap-4 mt-4">
                                        <Button variant="primary">Register Encounter</Button>
                                        <Button variant="secondary">Cancel</Button>
                                        <Button variant="ghost">Skip</Button>
                                    </div>
                                </div>
                            </Card>

                            <Card className="flex flex-col gap-8">
                                <h3 className="text-display-sm">Status & Indication</h3>
                                <div className="flex flex-wrap gap-4">
                                    <Badge variant="red">Critical Risk</Badge>
                                    <Badge variant="yellow">Monitoring</Badge>
                                    <Badge variant="green">Stable</Badge>
                                    <Badge variant="neutral">Discharged</Badge>
                                </div>
                                <p className="text-body-sm text-[#6B6B6B]">
                                    Badges eschew heavy gradients for refined, low-opacity organic backgrounds. Used to quickly parse vast patient lists.
                                </p>
                            </Card>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
