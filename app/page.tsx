"use client";
import React, { useState, useMemo, ChangeEvent } from 'react';
import { 
  Copy, RefreshCw, BookOpen, Layers, 
  FileText, CheckCircle, GraduationCap, 
  Upload, Cpu, FileInput, Code, Sparkles, 
  Clock, Hash, BarChart, LucideIcon 
} from 'lucide-react';
import InputGroup from '@/components/InputGroup';
import Select from '@/components/Select';

// ... (Interfaces remain the same) ...
interface FormData {
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  questionCount: string;
  questionType: string;
  difficulty: string;
  digitalCompetence: boolean;
  inputType: 'topic' | 'file';
}


const TestPromptGenerator: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    subject: 'Toán học',
    grade: 'Lớp 6',
    topic: 'Số nguyên',
    duration: '45 phút',
    questionCount: '20',
    questionType: 'Trắc nghiệm',
    difficulty: 'Trung bình',
    digitalCompetence: false,
    inputType: 'topic',
  });

  const [copied, setCopied] = useState<boolean>(false);

  // --- REPLACED USEEFFECT WITH USEMEMO ---
  // This calculates the prompt during render, avoiding the extra render cycle.
  const generatedPrompt = useMemo(() => {
    let sourceContent = '';
    let contextNote = '';

    if (formData.inputType === 'file') {
      sourceContent = `- Nguồn dữ liệu: Dựa TUYỆT ĐỐI vào nội dung tài liệu (PDF/Word) tôi cung cấp/đính kèm.`;
      contextNote = `2. Các câu hỏi cần rõ ràng, chính xác và bám sát nội dung tài liệu đính kèm.`;
      if (formData.topic) {
        sourceContent += `\n- Trọng tâm kiến thức: ${formData.topic}`;
      }
    } else {
      sourceContent = `- Chủ đề: ${formData.topic}`;
      contextNote = `2. Các câu hỏi cần rõ ràng, chính xác và bám sát chương trình học.`;
    }

    let digitalRequirement = '';
    if (formData.digitalCompetence) {
      digitalRequirement = `\n5. TÍCH HỢP NĂNG LỰC SỐ: Hãy thiết kế 10-20% câu hỏi liên quan đến năng lực số (phân tích dữ liệu số, bảo mật thông tin, hoặc giải quyết vấn đề bằng công cụ số).`;
    }

    return `Đóng vai trò là một giáo viên bộ môn ${formData.subject} giàu kinh nghiệm dạy ${formData.grade}.
    
Hãy soạn thảo một đề kiểm tra với các thông số sau:
${sourceContent}
- Thời gian làm bài: ${formData.duration}
- Đối tượng học sinh: ${formData.grade}
- Hình thức câu hỏi: ${formData.questionType}
- Số lượng câu hỏi: ${formData.questionCount} câu
- Mức độ khó: ${formData.difficulty}

YÊU CẦU ĐỊNH DẠNG QUAN TRỌNG:
Toàn bộ đề thi phải được trình bày theo định dạng LaTeX (\\document-class article). 
- Sử dụng các gói: geometry, fontspec (nếu cần), amsmath, amssymb, enumitem.
- Các công thức toán học bắt buộc nằm trong cặp dấu $...$ hoặc $$...$$.
- Trình bày cấu trúc đề rõ ràng: Tiêu đề, Ma trận đề, Nội dung đề, và Đáp án chi tiết.

Yêu cầu nội dung chi tiết:
1. Đề thi viết bằng Tiếng Việt.
${contextNote}
3. Sắp xếp các câu hỏi từ dễ đến khó.
4. Bao gồm ma trận đề thi theo mức độ nhận biết, thông hiểu, vận dụng.${digitalRequirement}
6. Cung cấp ĐÁP ÁN CHI TIẾT và lời giải thích cho từng câu hỏi ở cuối đề.
7. Đảm bảo mã LaTeX có thể biên dịch được và trình bày đẹp mắt.`;
  }, [formData]); // Recalculate only when formData changes

  // ... (Rest of the handlers and JSX remain exactly the same) ...

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => console.error('Copy failed', err));
  };

  const subjects: string[] = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'GDCD', 'Tin học'];
  const durations: string[] = ['15 phút', '30 phút', '45 phút (1 tiết)', '60 phút', '90 phút', '120 phút'];
  const types: string[] = ['100% Trắc nghiệm', '100% Tự luận', '70% TN, 30% TL', '50% TN, 50% TL'];


  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-3 px-6 py-2 bg-white rounded-full shadow-sm border border-slate-100">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="text-sm font-bold text-indigo-900 tracking-wide">SMART EXAM CREATOR</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            AI Exam Prompt <span className="text-indigo-600">Generator</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">
            Tạo đề thi chuẩn LaTeX tích hợp năng lực số chỉ trong vài giây.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* LEFT: Configuration Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  Cấu hình đề thi
                </h2>
              </div>

              {/* Toggle Input Type */}
              <div className="bg-slate-100 p-1 rounded-xl flex text-sm font-bold mb-8">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, inputType: 'topic' }))}
                  className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                    formData.inputType === 'topic' 
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Nhập chủ đề
                </button>
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, inputType: 'file' }))}
                  className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                    formData.inputType === 'file' 
                      ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="w-4 h-4" /> Từ tài liệu
                </button>
              </div>

              <div className="space-y-6">
                {/* Subject & Grade */}
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup icon={BookOpen} label="Môn học">
                    <Select name="subject" value={formData.subject} onChange={handleInputChange}>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </InputGroup>
                  <InputGroup icon={GraduationCap} label="Lớp">
                    <input 
                      type="text" name="grade" value={formData.grade} onChange={handleInputChange}
                      className="w-full rounded-xl border-slate-200 border bg-slate-50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </InputGroup>
                </div>

                {/* Topic Input */}
                <InputGroup icon={formData.inputType === 'file' ? FileInput : Layers} label={formData.inputType === 'file' ? 'Phạm vi kiến thức' : 'Chủ đề bài thi'}>
                  <input 
                    type="text" name="topic" value={formData.topic} onChange={handleInputChange}
                    placeholder={formData.inputType === 'file' ? "VD: Chương 1 (không bắt buộc)" : "VD: Số nguyên tố, Câu bị động..."}
                    className="w-full rounded-xl border-slate-200 border bg-slate-50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </InputGroup>

                {/* Digital Competence Card */}
                <label className={`block cursor-pointer relative group`}>
                  <input type="checkbox" name="digitalCompetence" checked={formData.digitalCompetence} onChange={handleInputChange} className="peer sr-only" />
                  <div className="p-4 rounded-xl border-2 transition-all duration-200 bg-white hover:bg-indigo-50/30 peer-checked:border-indigo-500 peer-checked:bg-indigo-50/50 border-slate-200">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${formData.digitalCompetence ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold text-sm mb-1 ${formData.digitalCompetence ? 'text-indigo-900' : 'text-slate-700'}`}>Tích hợp Năng lực số</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">AI sẽ tự động thêm 10-20% câu hỏi về xử lý dữ liệu, biểu đồ hoặc công nghệ.</p>
                      </div>
                      <div className={`ml-auto w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.digitalCompetence ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                        {formData.digitalCompetence && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                </label>

                {/* Params Row */}
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup icon={Clock} label="Thời gian">
                    <Select name="duration" value={formData.duration} onChange={handleInputChange}>
                      {durations.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                  </InputGroup>
                  <InputGroup icon={Hash} label="Số câu">
                    <input 
                      type="number" name="questionCount" value={formData.questionCount} onChange={handleInputChange}
                      className="w-full rounded-xl border-slate-200 border bg-slate-50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none"
                    />
                  </InputGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <InputGroup icon={Layers} label="Hình thức">
                    <Select name="questionType" value={formData.questionType} onChange={handleInputChange}>
                       {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                   </InputGroup>
                   <InputGroup icon={BarChart} label="Độ khó">
                    <Select name="difficulty" value={formData.difficulty} onChange={handleInputChange}>
                      <option value="Cơ bản">Cơ bản</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Nâng cao">Nâng cao</option>
                    </Select>
                   </InputGroup>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button 
                  onClick={() => setFormData({
                    subject: 'Toán học', grade: 'Lớp 10', topic: '', duration: '45 phút',
                    questionCount: '20', questionType: 'Trắc nghiệm', difficulty: 'Trung bình',
                    digitalCompetence: false, inputType: 'topic',
                  })}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Đặt lại mặc định
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Output Preview */}
          <div className="lg:col-span-7 flex flex-col h-full sticky top-8">
            <div className="bg-[#1E293B] rounded-t-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                </div>
                <div className="h-4 w-[1px] bg-slate-700 mx-2"></div>
                <span className="text-slate-400 text-xs font-mono flex items-center gap-2">
                  <Code className="w-3 h-3" /> prompt_output.tex
                </span>
              </div>
              <button
                onClick={handleCopy}
                className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                  copied 
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30'
                }`}
              >
                {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />}
                {copied ? 'COPIED!' : 'COPY PROMPT'}
              </button>
            </div>
            
            <div className="flex-1 bg-[#0F172A] p-6 rounded-b-2xl shadow-2xl relative group overflow-hidden border-t border-slate-800">
              <textarea
                value={generatedPrompt}
                readOnly
                spellCheck="false"
                className="w-full h-[600px] bg-transparent text-slate-300 font-mono text-sm leading-relaxed resize-none focus:outline-none scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 selection:bg-indigo-500/30 selection:text-indigo-200"
              />
              {/* Decorative faint code icon */}
              <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
                <Code className="w-40 h-40 text-white" />
              </div>
            </div>

            {/* Helper Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
               <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                 <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                   <Upload className="w-4 h-4" />
                 </div>
                 <div>
                   <h4 className="text-blue-900 font-bold text-sm">Chế độ Upload File</h4>
                   <p className="text-xs text-blue-700/80 mt-1">Khi dán prompt vào AI, hãy nhớ <strong>đính kèm file PDF/Word</strong> bài học để AI có dữ liệu tham chiếu.</p>
                 </div>
               </div>
               
               <div className="flex items-start gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                 <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                   <Layers className="w-4 h-4" />
                 </div>
                 <div>
                   <h4 className="text-emerald-900 font-bold text-sm">Kết quả LaTeX</h4>
                   <p className="text-xs text-emerald-700/80 mt-1">Dán mã kết quả vào <strong>Overleaf</strong> hoặc <strong>Canvas LaTeX Editor</strong> để hiển thị công thức toán học.</p>
                 </div>
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TestPromptGenerator;
