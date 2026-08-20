import { FileBadge, ShieldCheck, Clock, Lock } from 'lucide-react';

const badges = [
  {
    icon: FileBadge,
    title: 'Accurate Results',
    desc: 'High accuracy with advanced equipment',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  {
    icon: ShieldCheck,
    title: 'Quality Assurance',
    desc: 'Double verification process',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  {
    icon: Clock,
    title: 'Fast Turnaround',
    desc: 'Quick and reliable reporting',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  {
    icon: Lock,
    title: 'Secure & Compliant',
    desc: 'HIPAA compliant & secure data',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  }
];

const LabFeatureBadges = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-100/50">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${badge.iconBg}`}>
            <badge.icon className={`w-5 h-5 ${badge.iconColor}`} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 leading-tight">{badge.title}</h4>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{badge.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LabFeatureBadges;
