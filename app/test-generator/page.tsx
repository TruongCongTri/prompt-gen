// app/page.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import katex from "katex";

import {
  Layers,
  Upload,
  Cpu,
  Play,
  Loader2,
  AlertCircle,
  X,
  Eye,
  FileCode,
  Download,
  BookOpen,
  Clock,
  List,
  FileText,
  FileType,
  ChevronDown,
  History,
  Trash2,
  RotateCcw,
  Clock3,
} from "lucide-react";

import { FormData, HistoryItem } from "@/types/types";
import {
  NLS_DATABASE,
  SUBJECT_OPTIONS,
  DURATION_OPTIONS,
  DIFFICULTY_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
} from "@/enum/constants";

import SelectorModel from "@/components/SelectorModel";
import LatexPreview from "@/components/LatexPreview";

const TestGenerator: React.FC = () => {
  // UI State
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Logic State
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [checkingModel, setCheckingModel] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | ArrayBuffer | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const previewRef = useRef<HTMLDivElement>(null);

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
    mixRatio: 70,
    difficulty: "Trung bình",
    digitalCompetence: false,
    academicYear: "2025-2026",
    selectedCompetencies: [],
    digitalQuestionCount: 2,
    inputType: "topic",
    model: "gemini-3-flash-preview",
  });

  // --- Helpers ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFriendlyErrorMessage = (err: any): string => {
    const msg = err.message || "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("limit")) {
      return "API Key đã hết hạn mức sử dụng trong ngày (Free Tier). Vui lòng đổi Key mới để tiếp tục.";
    }
    if (
      msg.includes("400") ||
      msg.includes("API key not valid") ||
      msg.includes("key")
    ) {
      return "API Key không hợp lệ. Vui lòng kiểm tra lại.";
    }
    if (msg.includes("503") || msg.includes("overloaded")) {
      return "Server Gemini đang quá tải. Đang thử lại...";
    }
    if (msg.includes("fetch failed")) {
      return "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
    }
    return `Lỗi: ${msg.substring(0, 100)}...`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "questionCount") {
        const newTotal = parseInt(value as string) || 0;
        if (prev.digitalQuestionCount > newTotal) {
          newData.digitalQuestionCount = newTotal;
        }
      }
      return newData;
    });
  };

  const toggleCompetency = (code: string) => {
    setFormData((prev) => {
      const current = prev.selectedCompetencies;
      return current.includes(code)
        ? { ...prev, selectedCompetencies: current.filter((c) => c !== code) }
        : { ...prev, selectedCompetencies: [...current, code] };
    });
  };

  const handleSelectAllCompetencies = () => {
    const currentList = NLS_DATABASE[formData.academicYear] || [];
    const allCodes = currentList.map((c) => c.code);
    setFormData((prev) => {
      const isAllSelected = allCodes.every((code) =>
        prev.selectedCompetencies.includes(code),
      );
      return {
        ...prev,
        selectedCompetencies: isAllSelected
          ? prev.selectedCompetencies.filter((c) => !allCodes.includes(c))
          : [...new Set([...prev.selectedCompetencies, ...allCodes])],
      };
    });
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // --- API & Key Management ---
  const checkConnection = async (keyToTest?: string) => {
    const key = keyToTest || apiKey;
    if (!key) return setError("Vui lòng nhập API Key.");
    setCheckingModel(true);
    setError(null);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: formData.model });
      await model.generateContent("Ping");
      setConnectionStatus("success");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setConnectionStatus("error");
      setError(getFriendlyErrorMessage(err));
    } finally {
      setCheckingModel(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("gemini_api_key");
      if (storedKey) {
        setApiKey(storedKey);
        checkConnection(storedKey);
      }
      const savedHistory = localStorage.getItem("exam_history");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("History error", e);
        }
      }
    }
  }, []);


  // --- File ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setFileContent(event.target?.result || null);
      reader.readAsDataURL(file);
    }
  };
  const removeFile = () => {
    setUploadedFile(null);
    setFileContent(null);
  };

  // --- Generate ---
  const buildPrompt = () => {
    const currentCompetencies = NLS_DATABASE[formData.academicYear] || [];
    let digitalReq = "";
    const selectedDetails = currentCompetencies.filter((c) =>
      formData.selectedCompetencies.includes(c.code),
    );
    if (formData.digitalCompetence && selectedDetails.length > 0) {
      digitalReq = `
        YÊU CẦU ĐẶC BIỆT: TÍCH HỢP NĂNG LỰC SỐ (Khung ${formData.academicYear})
        - Số lượng câu hỏi tích hợp: ${formData.digitalQuestionCount} câu.
        - Các chỉ báo cần kiểm tra: ${selectedDetails.map((c) => `- Mã [${c.code}] ${c.label}: ${c.desc}`).join("\n")}
        *YÊU CẦU ĐỊNH DẠNG:* 1. Nội dung lồng ghép. 2. NHÃN HIỂN THỊ: Ghi nhãn là \\textbf{[Năng lực số]}.
        `;
    }
    return `
      Role: Expert Teacher & LaTeX Typesetter. Task: Create a test.
      Cấu hình: ${formData.questionType} (${formData.mixRatio}% TN), ${formData.questionCount} câu, độ khó ${formData.difficulty}.
      ${digitalReq}
      ${uploadedFile ? "Dùng file đính kèm làm nguồn." : `Chủ đề: ${formData.topic}`}
      YÊU CẦU LATEX:
      - Header dùng minipage. 
      - Bắt buộc dùng môi trường cases cho hệ phương trình.
      - Output ONLY LaTeX code inside document class article.
      `;
  };

  const saveToHistory = (
    latex: string,
    currentFormData: FormData,
    file?: File | null,
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      formData: { ...currentFormData },
      result: latex,
      fileName: file ? file.name : undefined,
    };
    const newHistory = [newItem, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem("exam_history", JSON.stringify(newHistory));
  };

  const handleGenerate = async () => {
    if (!apiKey) return setError("Vui lòng nhập API Key.");
    if (connectionStatus === "error")
      return setError("Vui lòng đổi API Key khác trước khi tạo.");
    setLoading(true);
    setError(null);
    setResult(null);
    setRetryCount(0);
    setViewMode("code");

    const prompt = buildPrompt();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: formData.model });

    let attempt = 0;
    let success = false;
    while (attempt < 3 && !success) {
      try {
        attempt++;
        setRetryCount(attempt);
        let resultText = "";
        if (uploadedFile && fileContent && typeof fileContent === "string") {
          const base64Data = fileContent.split(",")[1];
          const res = await model.generateContent([
            prompt,
            { inlineData: { data: base64Data, mimeType: uploadedFile.type } },
          ]);
          resultText = res.response.text();
        } else {
          const res = await model.generateContent(prompt);
          resultText = res.response.text();
        }
        resultText = resultText
          .replace(/```latex/g, "")
          .replace(/```/g, "")
          .trim();
        setResult(resultText);
        saveToHistory(resultText, formData, uploadedFile);
        success = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const errorMsg = err.message || "";
        if (errorMsg.includes("429") || errorMsg.includes("quota")) {
          setError(getFriendlyErrorMessage(err));
          setConnectionStatus("error");
          break;
        }
        if (
          attempt < 3 &&
          (errorMsg.includes("503") || errorMsg.includes("overloaded"))
        ) {
          await sleep(2000);
        } else {
          setError(getFriendlyErrorMessage(err));
          setConnectionStatus("error");
          break;
        }
      }
    }
    setLoading(false);
  };

  // --- Download ---
  const handleDownloadWord = () => {
    if (!result) return;
    let html = result;
    if (html.includes("\\begin{document}")) {
      html = html.split("\\begin{document}")[1];
      html = html.split("\\end{document}")[0];
    }

    // Header & Table processing
    html = html.replace(
      /\\begin{minipage}.*?{(.*?)\\textwidth}([\s\S]*?)\\end{minipage}\s*(&|\\hfill)?\s*\\begin{minipage}.*?{(.*?)\\textwidth}([\s\S]*?)\\end{minipage}/g,
      (match, w1, c1, sep, w2, c2) => {
        return `<table style="width:100%; border:none; margin-bottom: 20px;"><tr><td style="width:${parseFloat(w1) * 100}%; vertical-align:top; text-align:center;">${c1.replace(/\\centering/g, "").replace(/\\rule{.*?}{.*?}/g, "<hr/>")}</td><td style="width:${parseFloat(w2) * 100}%; vertical-align:top; text-align:center;">${c2.replace(/\\centering/g, "").replace(/\\rule{.*?}{.*?}/g, "<hr/>")}</td></tr></table>`;
      },
    );
    html = html.replace(
      /\\begin{center}\s*\\begin{tabular}{.*?}([\s\S]*?)\\end{tabular}\s*\\end{center}|\\begin{tabular}{.*?}([\s\S]*?)\\end{tabular}/g,
      (match, c1, c2) => {
        const rows = (c1 || c2)
          .replace(/\\hline/g, "")
          .split("\\\\")
          .filter((r: string) => r.trim().length > 0);
        let tableHtml =
          '<table style="width:100%; border-collapse: collapse; border: 1px solid black; margin: 10px auto;">';
        rows.forEach((row: string) => {
          tableHtml += "<tr>";
          row.split("&").forEach((cell: string) => {
            tableHtml += `<td style="border: 1px solid black; padding: 5px; text-align: center;">${cell.trim()}</td>`;
          });
          tableHtml += "</tr>";
        });
        return tableHtml + "</table>";
      },
    );

    html = html
      .replace(/\[\d+\.\d+\.TC[^\]]+\]/g, "<strong>[Năng lực số]</strong>")
      .replace(/\\section\*?{(.*?)}/g, "<h3>$1</h3>")
      .replace(/\\textbf{(.*?)}/g, "<b>$1</b>")
      .replace(/\\\\/g, "<br/>")
      .replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$)/g, (match) => {
        try {
          const clean = match
            .replace(/^\$\$|\$\$$/g, "")
            .replace(/^\\\[|\\\]$/g, "")
            .replace(/^\$|\$$/g, "");
          return katex.renderToString(clean, {
            throwOnError: false,
            output: "mathml",
          });
        } catch (e) {
          return match;
        }
      });

    const preHtml =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Doc</title></head><body>";
    const blob = new Blob(["\ufeff", preHtml + html + "</body></html>"], {
      type: "application/msword",
    });
    const url =
      "data:application/vnd.ms-word;charset=utf-8," +
      encodeURIComponent(preHtml + html + "</body></html>");
    const link = document.createElement("a");
    document.body.appendChild(link);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((navigator as any).msSaveOrOpenBlob)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).msSaveOrOpenBlob(
        blob,
        `De_Thi_${formData.examCode}.doc`,
      );
    else {
      link.href = url;
      link.download = `De_Thi_${formData.examCode}.doc`;
      link.click();
    }
    document.body.removeChild(link);
    setShowDownloadMenu(false);
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("exam_history", JSON.stringify(newHistory));
  };

  const restoreHistory = (item: HistoryItem) => {
    setResult(item.result);
    setFormData(item.formData);
    setViewMode("preview");
    setShowHistory(false);
  };

  // --- RENDER ---
  return (
      <div className="bg-slate-50 font-sans text-slate-800 mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Page specific toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Cấu hình đề thi
            </h2>
            <p className="text-sm text-slate-500">
              Tùy chỉnh thông số để tạo đề tự động
            </p>
          </div>
          {/* Nút Lịch sử (Đã chuyển vào Content) */}
          <button
            onClick={() => setShowHistory(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-indigo-700 font-bold text-sm hover:bg-indigo-50 shadow-sm transition-colors"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Lịch sử tạo đề</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* LEFT: Config Panel */}
          <div className="xl:col-span-4 space-y-6">
            <div
              className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 transition-opacity ${loading ? "opacity-70 pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-800">Cấu trúc đề thi</h2>
              </div>

              {/* A. THÔNG TIN TIÊU ĐỀ */}
              <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="text-xs font-bold text-indigo-900 uppercase mb-2 block">
                  A. Thông tin tiêu đề
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">
                      Sở / Phòng GD&ĐT
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">
                      Trường
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={formData.school}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-semibold">
                      Mã đề
                    </label>
                    <input
                      type="text"
                      name="examCode"
                      value={formData.examCode}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* INPUT TYPE (Chủ đề / File) */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() =>
                    setFormData((p) => ({ ...p, inputType: "topic" }))
                  }
                  disabled={loading}
                  className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${formData.inputType === "topic" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-slate-100"} disabled:opacity-50`}
                >
                  Chủ đề
                </button>
                <button
                  onClick={() =>
                    setFormData((p) => ({ ...p, inputType: "file" }))
                  }
                  disabled={loading}
                  className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${formData.inputType === "file" ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-slate-100"} disabled:opacity-50`}
                >
                  Upload File
                </button>
              </div>

              {formData.inputType === "topic" ? (
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">
                    Chủ đề trọng tâm
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                    placeholder="VD: Số nguyên tố..."
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">
                    Chọn file nội dung
                  </label>
                  {!uploadedFile ? (
                    <label
                      className={`flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">
                        PDF, Ảnh, Word
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.txt,image/*"
                        disabled={loading}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <span className="text-sm font-medium text-indigo-900 truncate w-4/5">
                        {uploadedFile.name}
                      </span>
                      <button
                        onClick={removeFile}
                        disabled={loading}
                        className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Subject & Grade */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">
                    Môn học
                  </label>

                  <SelectorModel
                    value={formData.subject}
                    options={SUBJECT_OPTIONS}
                    onChange={(val) =>
                      setFormData((p) => ({ ...p, subject: val }))
                    }
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1">
                    Lớp
                  </label>
                  <input
                    type="text"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* B. LOẠI CÂU HỎI & CẤU TRÚC */}
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">
                      Thời lượng
                    </label>
                    <SelectorModel
                      value={formData.duration}
                      options={DURATION_OPTIONS}
                      onChange={(val) =>
                        setFormData((p) => ({ ...p, duration: val }))
                      }
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1">
                      Tổng số câu
                    </label>
                    <input
                      type="number"
                      name="questionCount"
                      value={formData.questionCount}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none disabled:bg-slate-100"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                {/* Question Type Logic */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="text-xs font-bold text-indigo-900 uppercase mb-2 block">
                    B. Loại câu hỏi
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <SelectorModel
                      value={formData.questionType}
                      options={QUESTION_TYPE_OPTIONS}
                      onChange={(val) =>
                        setFormData((p) => ({ ...p, questionType: val }))
                      }
                      disabled={loading}
                    />

                    {/* Mix Slider Input */}
                    {formData.questionType === "Hỗn hợp" && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-indigo-600">
                            Trắc nghiệm: {formData.mixRatio}%
                          </span>
                          <span className="font-bold text-emerald-600">
                            Tự luận: {100 - formData.mixRatio}%
                          </span>
                        </div>
                        <input
                          type="range"
                          name="mixRatio"
                          min="10"
                          max="90"
                          step="5"
                          value={formData.mixRatio}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              mixRatio: parseInt(e.target.value),
                            }))
                          }
                          disabled={loading}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:accent-slate-400"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold mb-1 block">
                        Độ khó
                      </label>
                      <SelectorModel
                        value={formData.difficulty}
                        options={DIFFICULTY_OPTIONS}
                        onChange={(val) =>
                          setFormData((p) => ({ ...p, difficulty: val }))
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* C. NĂNG LỰC SỐ */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label
                    className={`flex items-center gap-2 cursor-pointer ${loading ? "opacity-50" : ""}`}
                  >
                    <input
                      type="checkbox"
                      name="digitalCompetence"
                      checked={formData.digitalCompetence}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-4 h-4 text-indigo-600 rounded disabled:bg-slate-200"
                    />
                    <span className="text-sm font-bold text-indigo-900 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" /> C. Năng lực số
                    </span>
                  </label>

                  {formData.digitalCompetence && (
                    <SelectorModel
                      value={formData.academicYear}
                      options={ACADEMIC_YEAR_OPTIONS}
                      onChange={(val) =>
                        setFormData((p) => ({ ...p, academicYear: val }))
                      }
                      disabled={loading}
                      className="text-xs"
                    />
                  )}
                </div>

                {formData.digitalCompetence && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    {/* Digital Question Count Input */}
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                      <label className="text-xs font-semibold text-slate-600">
                        Số lượng câu hỏi NLS:
                      </label>
                      <input
                        type="number"
                        name="digitalQuestionCount"
                        value={formData.digitalQuestionCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const max = parseInt(formData.questionCount) || 0;
                          setFormData((p) => ({
                            ...p,
                            digitalQuestionCount:
                              val > max ? max : val < 0 ? 0 : val,
                          }));
                        }}
                        disabled={loading}
                        className="w-16 p-1 text-center text-sm font-bold border rounded outline-none focus:border-indigo-500 disabled:bg-slate-100"
                        min="0"
                        max={formData.questionCount}
                      />
                    </div>

                    {/* Select All Checkbox */}
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-xs text-slate-500 italic">
                        Chỉ báo cần tích hợp:
                      </span>
                      <button
                        onClick={handleSelectAllCompetencies}
                        disabled={loading}
                        className="text-[10px] font-bold text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                      >
                        {NLS_DATABASE[formData.academicYear]?.every((c) =>
                          formData.selectedCompetencies.includes(c.code),
                        )
                          ? "(Bỏ chọn tất cả)"
                          : "(Chọn tất cả)"}
                      </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300">
                      {(NLS_DATABASE[formData.academicYear] || []).map((c) => (
                        <label
                          key={c.code}
                          className={`flex items-start gap-2 p-2 bg-white rounded border border-slate-100 transition-colors group ${loading ? "opacity-60 cursor-not-allowed" : "hover:border-indigo-200 cursor-pointer"}`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedCompetencies.includes(
                              c.code,
                            )}
                            onChange={() => toggleCompetency(c.code)}
                            disabled={loading}
                            className="mt-1 w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 disabled:bg-slate-200"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">
                              {c.code} - {c.label}
                            </div>
                            <div className="text-[10px] text-slate-500 leading-tight">
                              {c.desc}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                // --- CẬP NHẬT ĐIỀU KIỆN DISABLED ---
                // Case 3: Vô hiệu hóa nút nếu đang tải HOẶC kết nối bị lỗi (Quota/Key sai)
                disabled={
                  loading || checkingModel || connectionStatus === "error"
                }
                className={`w-full py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed ${connectionStatus === "error" ? "bg-red-500 hover:bg-red-600" : ""}`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                {loading
                  ? retryCount > 0
                    ? `Thử lại (${retryCount})...`
                    : "Đang tạo LaTeX..."
                  : connectionStatus === "error"
                    ? "Vui lòng đổi API Key" // Nhắc người dùng
                    : "Tạo Mã LaTeX"}
              </button>
            </div>
          </div>

          {/* RIGHT: Presentation Panel */}
          <div className="xl:col-span-8 flex flex-col ">
            {/* 1. SELECTION SUMMARY CARD */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <List className="w-4 h-4" /> Cấu trúc đã chọn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Cột 1: Thông tin hành chính */}
                <div className="space-y-2 pr-2 pt-2 md:pt-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Tiêu đề
                  </div>
                  <div className="group relative">
                    <div
                      className="text-sm font-bold text-slate-800 truncate"
                      title={formData.department}
                    >
                      {formData.department}
                    </div>
                    <div
                      className="text-xs text-slate-500 truncate"
                      title={formData.school}
                    >
                      {formData.school}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
                      Mã đề: <b>{formData.examCode}</b>
                    </span>
                  </div>
                </div>

                {/* Cột 2: Nội dung & Môn học */}
                <div className="space-y-2 px-0 md:px-4 pt-4 md:pt-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Nội dung
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="font-bold">{formData.subject}</span>
                    <span className="text-slate-400">|</span>
                    <span>{formData.grade}</span>
                  </div>
                  {formData.inputType === "file" && uploadedFile ? (
                    <div
                      className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 p-1.5 rounded-lg border border-blue-100"
                      title={uploadedFile.name}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate font-medium">
                        {uploadedFile.name}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="text-xs font-medium text-slate-800 bg-slate-50 p-1.5 rounded-lg truncate border border-slate-100"
                      title={formData.topic}
                    >
                      {formData.topic || "Chưa nhập chủ đề"}
                    </div>
                  )}
                </div>

                {/* Cột 3: Cấu trúc câu hỏi */}
                <div className="space-y-2 px-0 md:px-4 pt-4 md:pt-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Cấu trúc
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Loại:</span>
                      <span className="font-bold text-slate-800">
                        {formData.questionType}
                      </span>
                    </div>
                    {formData.questionType === "Hỗn hợp" && (
                      <div className="text-[10px] flex gap-1 w-full mt-1">
                        <div
                          className="bg-indigo-100 text-indigo-700 px-1 rounded flex-1 text-center font-bold"
                          style={{ flex: formData.mixRatio }}
                        >
                          {formData.mixRatio}% TN
                        </div>
                        <div
                          className="bg-emerald-100 text-emerald-700 px-1 rounded flex-1 text-center font-bold"
                          style={{
                            flex: 100 - (formData.mixRatio || 70),
                          }}
                        >
                          {100 - (formData.mixRatio || 70)}% TL
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs mt-1 pt-1 border-t border-slate-50">
                      <span>
                        <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                        {formData.duration}
                      </span>
                      <span className="font-bold bg-slate-100 px-1.5 rounded text-slate-600">
                        {formData.questionCount} câu
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cột 4: Năng lực số */}
                <div className="space-y-2 pl-0 md:pl-2 pt-4 md:pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Năng lực số
                    </div>
                    {formData.digitalCompetence ? (
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1 py-0.5 rounded font-bold">
                        {formData.academicYear}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded">
                        OFF
                      </span>
                    )}
                  </div>

                  {formData.digitalCompetence ? (
                    <div className="animate-in fade-in">
                      <div className="text-xs text-slate-700 mb-1.5 flex justify-between items-center">
                        <span>SL Tích hợp:</span>
                        <span className="font-bold text-white bg-indigo-500 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">
                          {formData.digitalQuestionCount || 0}
                        </span>
                      </div>
                      <div className="max-h-16 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                        {formData.selectedCompetencies.length > 0 ? (
                          formData.selectedCompetencies.map((code) => (
                            <div
                              key={code}
                              className="text-[10px] bg-indigo-50 p-1 rounded text-indigo-900 border border-indigo-100 truncate font-mono"
                            >
                              {code}
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Chưa chọn chỉ báo
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-16 flex flex-col items-center justify-center text-slate-300 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <Cpu className="w-5 h-5 mb-1 opacity-50" />
                      <span className="text-[10px]">Không áp dụng</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. RESULT AREA */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("code")}
                    className={`px-3 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2 ${viewMode === "code" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
                  >
                    <FileCode className="w-4 h-4" /> Mã Nguồn (LaTeX)
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    disabled={!result}
                    className={`px-3 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2 ${viewMode === "preview" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:bg-slate-200 disabled:opacity-50"}`}
                  >
                    <Eye className="w-4 h-4" /> Xem trước
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    disabled={!result || viewMode !== "preview"}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1 disabled:opacity-50 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download{" "}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showDownloadMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                      {/* <button
                                      onClick={handleDownloadPDF}
                                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                    >
                                      <FileText className="w-4 h-4 text-red-500" /> Export PDF
                                    </button> */}
                      <button
                        onClick={handleDownloadWord}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <FileType className="w-4 h-4 text-blue-600" /> Export
                        Word
                      </button>
                      <div className="h-px bg-slate-100 my-0"></div>
                      <p className="px-4 py-2 text-[10px] text-slate-400">
                        Yêu cầu chuyển sang tab &quot;Xem trước&quot; để tải.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 relative overflow-hidden">
                {/* CODE VIEW */}
                <div
                  className={`absolute inset-0 p-0 ${viewMode === "code" ? "block" : "hidden"}`}
                >
                  <textarea
                    value={result || ""}
                    readOnly
                    className="w-full h-full p-4 font-mono text-sm text-slate-700 bg-white resize-none outline-none"
                    placeholder={
                      loading
                        ? "Đang viết mã LaTeX..."
                        : "Mã LaTeX sẽ hiển thị ở đây."
                    }
                  />
                </div>

                {/* PREVIEW VIEW */}
                <div
                  ref={previewRef}
                  className={`absolute inset-0 p-8 overflow-y-auto bg-white ${viewMode === "preview" ? "block" : "hidden"}`}
                >
                  {!result ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                      <Eye className="w-12 h-12 mb-2 opacity-50" />
                      <p>Chưa có dữ liệu</p>
                    </div>
                  ) : (
                    <div className="prose max-w-none text-slate-800">
                      {/* Native KaTeX Rendering */}
                      <LatexPreview content={result} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HISTORY MODAL OVERLAY */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-lg text-slate-800">
                    Lịch sử tạo đề
                  </h3>
                  <span className="text-xs font-medium px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                    {history.length} bản ghi
                  </span>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <History className="w-12 h-12 mb-3 opacity-20" />
                    <p>Chưa có lịch sử nào.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-indigo-900 text-sm mb-0.5">
                            {item.formData.subject} - {item.formData.grade}
                          </h4>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">
                              Mã: {item.formData.examCode}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock3 className="w-3 h-3" />{" "}
                              {new Date(item.timestamp).toLocaleString("vi-VN")}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => deleteHistory(item.id, e)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded mb-3 border border-slate-100">
                        <div className="line-clamp-2">
                          <span className="font-semibold">Chủ đề:</span>{" "}
                          {item.fileName
                            ? `File: ${item.fileName}`
                            : item.formData.topic}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {item.formData.questionCount} câu •{" "}
                          {item.formData.duration} •{" "}
                          {item.formData.questionType}
                        </div>
                      </div>

                      <button
                        onClick={() => restoreHistory(item)}
                        className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Xem lại & Tải
                        xuống
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
};

export default TestGenerator;
