"use client";
import React, { useState, useMemo, ChangeEvent } from "react";
import {
  Copy,
  RefreshCw,
  BookOpen,
  Clock,
  Layers,
  FileText,
  CheckCircle,
  GraduationCap,
  Upload,
  Cpu,
  Code,
  School,
  Building2,
  Hash,
  Sparkles,
  ChevronDown,
  LayoutTemplate,
  FileInput,
} from "lucide-react";

// --- Types ---
interface FormData {
  department: string;
  school: string;
  examCode: string;
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  questionCount: string;
  questionType: string;
  difficulty: string;
  digitalCompetence: boolean;
  inputType: "topic" | "file";
}

// --- Reusable UI Components (Inline for portability) ---

// const StyledLabel = ({ icon: Icon, label }: { icon: any; label: string }) => (
//   <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
//     <Icon className="w-3.5 h-3.5 text-indigo-500" /> {label}
//   </label>
// );

// const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
//   <div className="relative group">
//     <input
//       {...props}
//       className={`w-full bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 px-4 py-3 outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 group-hover:border-slate-300 ${props.className}`}
//     />
//   </div>
// );

// const StyledSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
//   <div className="relative group">
//     <select
//       {...props}
//       className="w-full appearance-none bg-slate-50 text-slate-700 font-medium text-sm rounded-xl border border-slate-200 px-4 py-3 pr-10 outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 group-hover:border-slate-300"
//     />
//     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
//   </div>
// );

// --- Main Component ---

const TestPromptGenerator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    department: "SỞ GD&ĐT Vũng Tàu",
    school: "TRƯỜNG THCS Trần Phú",
    examCode: "101",
    subject: "Toán học",
    grade: "Lớp 6",
    topic: "Số Nguyên Tố",
    duration: "45 phút",
    questionCount: "20",
    questionType: "Trắc nghiệm",
    difficulty: "Trung bình",
    digitalCompetence: false,
    inputType: "topic",
  });

  const [copied, setCopied] = useState<boolean>(false);

  // --- Logic ---
  const generatedPrompt = useMemo(() => {
    let sourceContent = "";
    let contextNote = "";

    if (formData.inputType === "file") {
      sourceContent = `- Nguồn dữ liệu: Dựa TUYỆT ĐỐI vào nội dung tài liệu (PDF/Word) tôi cung cấp/đính kèm.`;
      contextNote = `2. Các câu hỏi cần rõ ràng, chính xác và bám sát nội dung tài liệu đính kèm.`;
      if (formData.topic) {
        sourceContent += `\n- Trọng tâm kiến thức: ${formData.topic}`;
      }
    } else {
      sourceContent = `- Chủ đề: ${formData.topic}`;
      contextNote = `2. Các câu hỏi cần rõ ràng, chính xác và bám sát chương trình học.`;
    }

    let digitalRequirement = "";
    if (formData.digitalCompetence) {
      digitalRequirement = `\n5. TÍCH HỢP NĂNG LỰC SỐ: Hãy thiết kế 10-20% câu hỏi liên quan đến năng lực số (phân tích dữ liệu số, bảo mật thông tin, hoặc giải quyết vấn đề bằng công cụ số).`;
    }

    return `Đóng vai trò là một giáo viên bộ môn ${
      formData.subject
    } giàu kinh nghiệm dạy ${formData.grade}.
    
Hãy soạn thảo một đề kiểm tra với các thông số sau:
${sourceContent}
- Thời gian làm bài: ${formData.duration}
- Đối tượng học sinh: ${formData.grade}
- Hình thức câu hỏi: ${formData.questionType}
- Số lượng câu hỏi: ${formData.questionCount} câu
- Mức độ khó: ${formData.difficulty}

YÊU CẦU ĐỊNH DẠNG QUAN TRỌNG (LATEX):
Toàn bộ đề thi phải được trình bày theo định dạng LaTeX (\\documentclass{article}) chuẩn mẫu Bộ GD&ĐT.

1. Thiết kế Header (Tiêu đề) chuẩn mẫu gồm 2 cột:
   - Cột trái: 
     \\textbf{${formData.department.toUpperCase()}}
     \\textbf{${formData.school.toUpperCase()}}
   - Cột phải: 
     \\textbf{ĐỀ KIỂM TRA MÔN ${formData.subject.toUpperCase()}}
     \\textit{Thời gian làm bài: ${formData.duration}}
     \\textbf{Mã đề thi: ${formData.examCode}}
   
2. Thêm dòng điền thông tin học sinh ngay dưới Header:
   "Họ và tên thí sinh: ........................................ Lớp: ...................."

3. Cấu trúc nội dung:
   - Sử dụng các gói: geometry, fontspec (nếu cần), amsmath, amssymb, enumitem.
   - Các công thức toán học bắt buộc nằm trong cặp dấu $...$ hoặc $$...$$.
   - Bao gồm: Ma trận đề (bảng), Nội dung đề thi, và Đáp án chi tiết (ở cuối).

Yêu cầu nội dung chi tiết:
1. Đề thi viết bằng Tiếng Việt.
${contextNote}
3. Sắp xếp các câu hỏi từ dễ đến khó.
4. Ma trận đề thi phân loại theo mức độ nhận biết, thông hiểu, vận dụng.${digitalRequirement}
6. Cung cấp ĐÁP ÁN CHI TIẾT và lời giải thích cho từng câu hỏi.
7. Đảm bảo mã LaTeX biên dịch được ngay, trình bày đẹp, chuyên nghiệp.`;
  }, [formData]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Failed to copy", err));
  };

  // Lists
  const subjects = [
    "Toán học",
    "Vật lý",
    "Hóa học",
    "Sinh học",
    "Ngữ văn",
    "Lịch sử",
    "Địa lý",
    "Tiếng Anh",
    "GDCD",
    "Tin học",
  ];
  const durations = [
    "15 phút",
    "30 phút",
    "45 phút (1 tiết)",
    "60 phút",
    "90 phút",
    "120 phút",
  ];
  const types = [
    "100% Trắc nghiệm",
    "100% Tự luận",
    "70% TN, 30% TL",
    "50% TN, 50% TL",
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg">
              <Code className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-indigo-900">
              AI Exam Prompt (LaTeX)
            </h1>
          </div>
          <p className="text-slate-600">
            Tạo đề thi chuẩn mẫu Bộ GD&ĐT với định dạng LaTeX
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="min-h-[700px] lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-800">
                Cấu hình đề thi
              </h2>
            </div>

            {/* Input Source Selection */}
            <div className="bg-slate-50 p-1 rounded-lg flex text-sm font-medium">
              <button
                onClick={() =>
                  setFormData((prev) => ({ ...prev, inputType: "topic" }))
                }
                className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all ${
                  formData.inputType === "topic"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText className="w-4 h-4" /> Nhập chủ đề
              </button>
              <button
                onClick={() =>
                  setFormData((prev) => ({ ...prev, inputType: "file" }))
                }
                className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all ${
                  formData.inputType === "file"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Upload className="w-4 h-4" /> Từ tài liệu SGK
              </button>
            </div>

            {/* Header Info Section */}
            <div className="space-y-3 bg-slate-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <School className="w-4 h-4 text-indigo-500" /> Thông tin tiêu đề
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sở / Phòng GD&ĐT
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-slate-200 border p-2 pl-9 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Trường
                  </label>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-slate-200 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Mã đề
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      name="examCode"
                      value={formData.examCode}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border-slate-200 border p-2 pl-6 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 1: Subject & Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Môn học
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-slate-200 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Khối / Lớp
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border-slate-200 border p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Topic */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {formData.inputType === "file"
                  ? "Phạm vi kiến thức trong file"
                  : "Chủ đề bài kiểm tra"}
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="VD: Chương 1: Số tự nhiên..."
                  className="w-full rounded-lg border-slate-200 border p-2.5 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Digital Competence Checkbox */}
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
              <label className="flex items-center cursor-pointer gap-3">
                <input
                  type="checkbox"
                  name="digitalCompetence"
                  checked={formData.digitalCompetence}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                    <Cpu className="w-4 h-4" />
                    Tích hợp &quot;Năng lực số&quot;
                  </div>
                  <p className="text-xs text-indigo-600/70">
                    Thiết kế câu hỏi về khai thác CNTT, dữ liệu...
                  </p>
                </div>
              </label>
            </div>

            {/* Row 4: Duration & Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Thời gian
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-slate-200 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                >
                  {durations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Số câu hỏi
                </label>
                <input
                  type="number"
                  name="questionCount"
                  value={formData.questionCount}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border-slate-200 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hình thức & Độ khó
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="questionType"
                  value={formData.questionType}
                  onChange={handleInputChange}
                  className="rounded-lg border-slate-200 border p-2 text-sm"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="rounded-lg border-slate-200 border p-2 text-sm"
                >
                  <option value="Cơ bản">Cơ bản</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Nâng cao">Nâng cao</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() =>
                  setFormData({
                    department: "SỞ GD&ĐT HÀ NỘI",
                    school: "TRƯỜNG THPT CHU VĂN AN",
                    examCode: "101",
                    subject: "Toán học",
                    grade: "Lớp 10",
                    topic: "",
                    duration: "45 phút",
                    questionCount: "20",
                    questionType: "Trắc nghiệm",
                    difficulty: "Trung bình",
                    digitalCompetence: false,
                    inputType: "topic",
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Khôi phục thiết lập
              </button>
            </div>
          </div>

          {/* Output Preview */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="bg-slate-900 rounded-t-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-mono text-sm">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-slate-400">exam_prompt.tex</span>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30"
                }`}
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Đã copy!" : "Sao chép Prompt"}
              </button>
            </div>

            <div className="flex-1 bg-slate-800 p-6 rounded-b-2xl shadow-2xl relative overflow-hidden">
              <textarea
                value={generatedPrompt}
                readOnly
                className="w-full h-[500px] bg-transparent text-emerald-400 font-mono text-xs md:text-sm leading-relaxed resize-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-700"
              />
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Code className="w-32 h-32 text-white" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-blue-900 font-bold text-sm mb-1 flex items-center gap-2">
                  <FileInput className="w-4 h-4" /> Lưu ý đính kèm
                </h4>
                <p className="text-xs text-blue-700">
                  Nếu bạn chọn &quot;Từ tài liệu SGK&quot;, hãy nhớ{" "}
                  <strong>tải file PDF/Word</strong> lên cùng lúc khi dán prompt
                  vào AI.
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <h4 className="text-emerald-900 font-bold text-sm mb-1 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Sử dụng LaTeX
                </h4>
                <p className="text-xs text-emerald-700">
                  Kết quả từ AI sẽ là mã LaTeX. Bạn có thể dán mã này vào{" "}
                  <strong>Canvas Tool</strong> để xem bản in đẹp mắt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPromptGenerator;
