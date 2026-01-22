// components/FeaturePlaceholder.tsx
import React from "react";

interface FeaturePlaceholderProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
}

const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({
  title,
  icon: Icon,
}) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in zoom-in duration-300">
    <div className="bg-slate-100 p-8 rounded-full mb-6">
      <Icon className="w-20 h-20 text-slate-300" />
    </div>
    <h2 className="text-2xl font-bold text-slate-600 mb-2">{title}</h2>
    <p className="max-w-md text-center text-slate-500">
      Tính năng này đang được phát triển. Vui lòng quay lại sau!
    </p>
    <button className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium text-sm">
      Nhận thông báo khi ra mắt
    </button>
  </div>
);

export default FeaturePlaceholder;