
// 3. Props for the reusable Select component (inherits standard select props)
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select: React.FC<SelectProps> = (props) => (
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none rounded-xl border-slate-200 border bg-slate-50 px-4 py-3 pr-8 text-sm font-medium text-slate-700 transition-all hover:border-indigo-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none"
      />
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );

  export default Select;