import { Link } from 'react-router-dom';

/* Atomic Components */

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "inline-flex items-center justify-center px-6 py-3 rounded-full font-sans text-sm tracking-wide transition-all duration-300";
    const variants = {
        primary: "bg-[#2D5A3D] text-[#FAF8F5] hover:bg-[#1E3F2B] hover:shadow-md",
        secondary: "bg-[#F2EDE6] text-[#2C2C2C] hover:bg-[#DDD7CD]",
        outline: "border border-[#2C2C2C] text-[#2C2C2C] hover:bg-[#2C2C2C] hover:text-[#FAF8F5]",
        ghost: "text-[#2C2C2C] hover:bg-[#F2EDE6]"
    };
    return (
        <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

export const Input = ({ label, id, className = '', ...props }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
        {label && <label htmlFor={id} className="text-label">{label}</label>}
        <input
            id={id}
            className="bg-transparent border-b border-[#DDD7CD] py-2 font-sans text-[#2C2C2C] focus:outline-none focus:border-[#2D5A3D] transition-colors"
            {...props}
        />
    </div>
);

export const Card = ({ children, className = '', ...props }) => (
    <div className={`bg-[#FDFCFA] rounded-2xl p-6 shadow-[0_4px_12px_rgba(44,44,44,0.08)] border border-[#E5E0D8] ${className}`} {...props}>
        {children}
    </div>
);

export const Badge = ({ children, variant = 'neutral', className = '' }) => {
    const variants = {
        red: "bg-[#B5403A]/10 text-[#B5403A]",
        yellow: "bg-[#C49A3C]/10 text-[#C49A3C]",
        green: "bg-[#3A7350]/10 text-[#3A7350]",
        neutral: "bg-[#F2EDE6] text-[#6B6B6B]"
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

/* Domain Components */

export const StatBlock = ({ number, label, subtext }) => (
    <div className="flex flex-col gap-1">
        <div className="text-display-lg text-[#2C2C2C] tracking-tight">{number}</div>
        <div className="text-label">{label}</div>
        {subtext && <div className="text-body-xs text-[#6B6B6B] mt-1">{subtext}</div>}
    </div>
);

export const PatientCard = ({ index, patient }) => {
    const riskToVariant = { 'Red': 'red', 'Yellow': 'yellow', 'Green': 'green' };
    return (
        <div className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 bg-transparent border-b border-[#E5E0D8] hover:bg-[#F2EDE6]/50 transition-colors gap-4">
            <div className="flex items-start gap-6">
                <span className="text-number text-[#A3B8A0] text-xl mt-1">{(index).toString().padStart(2, '0')}</span>
                <div>
                    <h4 className="text-display-sm text-[#2C2C2C] group-hover:text-[#2D5A3D] transition-colors">{patient.name}</h4>
                    <p className="text-body-sm text-[#6B6B6B] mt-1">
                        {patient.weeks ? `${patient.weeks} weeks` : `${patient.age} years`} &middot; {patient.village}
                    </p>
                    <p className="text-body-sm text-[#2C2C2C] mt-2 italic">{patient.condition}</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                    <p className="text-label">BP</p>
                    <p className="font-serif text-lg">{patient.blood_pressure}</p>
                </div>
                <Badge variant={riskToVariant[patient.risk_level]}>{patient.risk_level}</Badge>
                <div className="text-[#C4704B] text-xl group-hover:translate-x-1 transition-transform">→</div>
            </div>
        </div>
    );
};

export const AIInsight = ({ insight }) => (
    <div className="relative overflow-hidden bg-[#2D5A3D] text-[#FAF8F5] rounded-3xl p-8 shadow-editorial-lg">
        {/* Subtle organic background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3A7350] rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#A3B8A0] rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <span className="text-label text-[#A3B8A0]">Arogya Intelligence</span>
                <Badge variant={insight.risk_level === 'Yellow' ? 'yellow' : 'red'} className="bg-[#FAF8F5] mix-blend-screen text-current">
                    Risk: {insight.risk_level}
                </Badge>
            </div>

            <div>
                <h3 className="text-display-md mb-2">{insight.probable_condition}</h3>
                <p className="text-body text-[#C5D4C2] opacity-90 max-w-2xl">{insight.recommendations}</p>
            </div>

            <div className="pt-4 border-t border-[#3A7350] flex gap-4">
                <Button variant="secondary" className="!bg-[#FAF8F5] !text-[#2D5A3D]">Accept Protocol</Button>
                <Button variant="outline" className="!border-[#A3B8A0] !text-[#FAF8F5] hover:!bg-[#A3B8A0] hover:!text-[#2D5A3D]">Consult Specialist</Button>
            </div>
        </div>
    </div>
);

export const EditorialTimeline = ({ items }) => (
    <div className="relative border-l border-[#DDD7CD] ml-4 py-2 flex flex-col gap-8">
        {items.map((item, i) => (
            <div key={i} className="relative pl-8 stagger">
                <div className="absolute w-3 h-3 bg-[#A3B8A0] rounded-full -left-[6.5px] top-1.5 ring-4 ring-[#FAF8F5]"></div>
                <div className="text-label text-[#C4704B]">{item.date}</div>
                <div className="text-display-sm text-[#2C2C2C] mt-1">{item.event}</div>
                <div className="text-body-sm text-[#6B6B6B] mt-2">{item.detail}</div>
            </div>
        ))}
    </div>
);
