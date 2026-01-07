import { LucideIcon } from "lucide-react";

// 2. Props for the reusable InputGroup component
interface InputGroupProps {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}

const InputGroup: React.FC<InputGroupProps> = ({
    icon: Icon,
    label,
    children,
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <Icon className="w-4 h-4 text-indigo-500" /> {label}
      </label>
      {children}
    </div>
  );

  export default InputGroup;