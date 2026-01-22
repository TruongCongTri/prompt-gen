/* eslint-disable @typescript-eslint/no-explicit-any */
// app/lesson-plan/page.tsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import katex from "katex";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

import {
  Layers,
  Upload,
  Cpu,
  Loader2,
  AlertCircle,
  X,
  Eye,
  FileCode,
  Download,
  BookOpen,
  FileType,
  ChevronDown,
  History,
  Trash2,
  RotateCcw,
  FileSignature,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";

// Giả sử các types và constants này vẫn dùng chung hoặc bạn có thể copy từ file cũ
import { FormData, HistoryItem } from "@/types/types";
import {
  NLS_DATABASE,
  SUBJECT_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
} from "@/enum/constants";

import SelectorModel from "@/components/SelectorModel";
import LatexPreview from "@/components/LatexPreview";

// --- TYPES RIÊNG CHO TRANG GIÁO ÁN ---
interface LessonFormData {
  department: string;
  school: string;
  teacher: string;
  subject: string;
  grade: string;
  academicYear: string;

  // Thông tin bài dạy
  week: string;
  period: string;
  lessonName: string;

  // Năng lực số
  digitalCompetence: boolean;
  selectedCompetencies: string[];

  model: string;
}

interface LessonHistoryItem {
  id: string;
  timestamp: number;
  formData: LessonFormData;
  result: string;
  ppctFileName?: string;
  contentFileName?: string;
}

// Type for Excel Row Data
interface PPCTRow {
  week: string | number;
  period: string | number;
  content: string;
  raw: any; // Keep original row data
}

const LessonPlanGenerator: React.FC = () => {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<"setup" | "preview">("setup"); // Main view tabs
  const [dataViewMode, setDataViewMode] = useState<"excel" | "word">("excel"); // File preview tabs
  const [viewMode, setViewMode] = useState<"code" | "preview">("code"); // Result tabs
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // --- Logic State ---
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [checkingModel, setCheckingModel] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- File & Data State ---
  const [ppctFile, setPpctFile] = useState<File | null>(null);
  const [ppctRows, setPpctRows] = useState<PPCTRow[]>([]); // Parsed Excel Data
  const [selectedPpctIndex, setSelectedPpctIndex] = useState<string>(""); // Selected Row Index

  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentPreview, setContentPreview] = useState<string>(""); // Word content text

  const [history, setHistory] = useState<LessonHistoryItem[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<LessonFormData>({
    department: "SỞ GD&ĐT Vũng Tàu",
    school: "TRƯỜNG THCS Trần Phú",
    teacher: "Nguyễn Văn A",
    subject: "Toán học",
    grade: "Lớp 6",
    academicYear: "2025-2026",
    week: "",
    period: "",
    lessonName: "",
    digitalCompetence: false,
    selectedCompetencies: [],
    model: "gemini-3-flash-preview",
  });

  // --- Helpers ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getFriendlyErrorMessage = (err: any): string => {
    const msg = err.message || "";
    if (msg.includes("429") || msg.includes("quota"))
      return "API Key hết hạn mức (Free Tier).";
    if (msg.includes("400")) return "Yêu cầu không hợp lệ (Kiểm tra file/Key).";
    return `Lỗi: ${msg.substring(0, 100)}...`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

  const toggleCompetency = (code: string) => {
    setFormData((prev) => {
      const current = prev.selectedCompetencies;
      return current.includes(code)
        ? { ...prev, selectedCompetencies: current.filter((c) => c !== code) }
        : { ...prev, selectedCompetencies: [...current, code] };
    });
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // --- API Connection ---
  const checkConnection = async (keyToTest?: string) => {
    const key = keyToTest || apiKey;
    if (!key) return setError("Vui lòng nhập API Key.");
    setCheckingModel(true);
    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: formData.model });
      await model.generateContent("Ping");
      setConnectionStatus("success");
      setError(null);
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
      const savedHistory = localStorage.getItem("lesson_plan_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    localStorage.setItem("gemini_api_key", e.target.value);
    if (connectionStatus === "success") setConnectionStatus("idle");
  };

  // --- 1. FILE PROCESSING LOGIC ---

  // Handle Excel Upload & Parsing
  const handlePpctFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPpctFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
          }) as any[];

          // Heuristic to find header row (look for 'Tuần', 'Tiết', 'Bài')
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
            const rowStr = JSON.stringify(jsonData[i]).toLowerCase();
            if (rowStr.includes("tuần") && rowStr.includes("tiết")) {
              headerRowIndex = i;
              break;
            }
          }

          // Process rows after header
          const parsedRows: PPCTRow[] = [];
          const headers = jsonData[headerRowIndex].map((h: any) =>
            String(h).toLowerCase().trim(),
          );

          // Identify column indices
          const weekIdx = headers.findIndex((h: string) => h.includes("tuần"));
          const periodIdx = headers.findIndex((h: string) =>
            h.includes("tiết"),
          );
          const contentIdx = headers.findIndex(
            (h: string) =>
              h.includes("bài") || h.includes("nội dung") || h.includes("tên"),
          );

          // Loop through data rows
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length > 0) {
              // Safety check for undefined columns
              const w = weekIdx > -1 ? row[weekIdx] : row[0];
              const p = periodIdx > -1 ? row[periodIdx] : row[1];
              const c = contentIdx > -1 ? row[contentIdx] : row[2];

              if (c) {
                // Only add if content exists
                parsedRows.push({
                  week: w,
                  period: p,
                  content: c,
                  raw: row,
                });
              }
            }
          }

          setPpctRows(parsedRows);
          setDataViewMode("excel"); // Switch preview to excel
        } catch (err) {
          console.error(err);
          setError("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng.");
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  // Handle Word Upload & Parsing
  const handleContentFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setContentFile(file);

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const arrayBuffer = evt.target?.result as ArrayBuffer;
          // Extract raw text for preview and context
          const result = await mammoth.extractRawText({ arrayBuffer });
          setContentPreview(result.value);
          setDataViewMode("word"); // Switch preview to word
        } catch (err) {
          console.error(err);
          setError("Lỗi đọc file Word.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // --- 2. SELECTOR LOGIC ---
  const handleLessonSelect = (indexStr: string) => {
    setSelectedPpctIndex(indexStr);
    const index = parseInt(indexStr);
    if (!isNaN(index) && ppctRows[index]) {
      const row = ppctRows[index];
      setFormData((prev) => ({
        ...prev,
        week: String(row.week || ""),
        period: String(row.period || ""),
        lessonName: String(row.content || ""),
      }));
    }
  };

  // --- Generate Logic ---
  const buildPrompt = () => {
    const currentCompetencies = NLS_DATABASE[formData.academicYear] || [];
    let digitalReq = "";

    // Lọc ra chi tiết các NLS đã chọn
    const selectedDetails = currentCompetencies.filter((c: any) =>
      formData.selectedCompetencies.includes(c.code),
    );

    if (formData.digitalCompetence && selectedDetails.length > 0) {
      digitalReq = `
        YÊU CẦU TÍCH HỢP NĂNG LỰC SỐ (NLS):
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        - Danh sách chỉ báo cần tích hợp: ${selectedDetails.map((c: any) => `[${c.code}] ${c.label}`).join(", ")}.
        - Hướng dẫn: KHÔNG nhồi nhét. Chỉ tích hợp vào hoạt động phù hợp (ví dụ: dùng phần mềm vẽ hình, tìm kiếm dữ liệu, xử lý số liệu...).
        - Đánh dấu: Tại hoạt động có tích hợp, ghi chú rõ: **[Tích hợp NLS: Mã - Tên]**.
      `;
    }

    return `
      Role: Bạn là một Giáo viên Giỏi và Chuyên gia soạn giáo án theo chương trình GDPT 2018.
      
      Nhiệm vụ: Soạn giáo án (Kế hoạch bài dạy) chi tiết.
      
      Thông tin hành chính:
      - Trường: ${formData.school}
      - Tổ/Nhóm chuyên môn: Toán - Tin
      - Giáo viên: ${formData.teacher}
      - Môn: ${formData.subject} - Lớp: ${formData.grade}
      - Bài dạy: ${formData.lessonName} (Tuần: ${formData.week}, Tiết PPCT: ${formData.period}).
      
      Dữ liệu đầu vào:
      1. File Kế hoạch dạy học (PPCT): Dùng để xác định vị trí bài học, thời lượng và yêu cầu cần đạt chung.
      2. File Tài liệu nguồn (Giáo án cũ/Sách): Dùng làm nội dung kiến thức, bài tập và ví dụ.
      
      ${digitalReq}
      
      Yêu cầu cấu trúc (Output format: LaTeX Article):
      - Sử dụng gói lệnh geometry, utf8, v.v. cơ bản.
      - Cấu trúc bài soạn gồm:
        I. MỤC TIÊU (Kiến thức, Năng lực, Phẩm chất).
        II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU.
        III. TIẾN TRÌNH DẠY HỌC.
          1. Hoạt động 1: Mở đầu/Khởi động (Mục tiêu, Nội dung, Sản phẩm, Tổ chức thực hiện).
          2. Hoạt động 2: Hình thành kiến thức mới.
          3. Hoạt động 3: Luyện tập.
          4. Hoạt động 4: Vận dụng.
      - Nội dung phải chi tiết, các hoạt động "Tổ chức thực hiện" chia rõ bước (Chuyển giao, Thực hiện, Báo cáo, Kết luận).
      - Output ONLY LaTeX code (no markdown code blocks latex).
    `;
  };

  const saveToHistory = (latex: string) => {
    const newItem: LessonHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      formData: { ...formData },
      result: latex,
      ppctFileName: ppctFile?.name,
      contentFileName: contentFile?.name,
    };
    const newHistory = [newItem, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem("lesson_plan_history", JSON.stringify(newHistory));
  };

  const handleGenerate = async () => {
    if (!apiKey) return setError("Vui lòng nhập API Key.");
    if (!ppctFile && !contentFile)
      return setError("Vui lòng upload ít nhất một file nguồn.");

    setLoading(true);
    setError(null);
    setResult(null);
    setViewMode("code");

    const prompt = buildPrompt();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: formData.model });

    // try {
    //   // Chuẩn bị dữ liệu gửi đi (Multi-part)
    //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //   const parts: any[] = [{ text: prompt }];

    //   // File 1: PPCT
    //   if (ppctFile && ppctContent && typeof ppctContent === "string") {
    //     const base64 = ppctContent.split(",")[1];
    //     parts.push({
    //       inlineData: {
    //         data: base64,
    //         mimeType: ppctFile.type || "application/pdf",
    //       }, // Fallback mime
    //     });
    //     parts.push({
    //       text: "\n^^^ Đây là File 1: Kế hoạch dạy học (PPCT) ^^^",
    //     });
    //   }

    //   // File 2: Content
    //   if (contentFile && contentContent && typeof contentContent === "string") {
    //     const base64 = contentContent.split(",")[1];
    //     parts.push({
    //       inlineData: {
    //         data: base64,
    //         mimeType: contentFile.type || "application/pdf",
    //       },
    //     });
    //     parts.push({
    //       text: "\n^^^ Đây là File 2: Tài liệu nội dung bài học (Giáo án/Sách) ^^^",
    //     });
    //   }

    //   const res = await model.generateContent(parts);
    //   let text = res.response.text();

    //   // Clean markdown formatting if present
    //   text = text
    //     .replace(/```latex/g, "")
    //     .replace(/```/g, "")
    //     .trim();

    //   setResult(text);
    //   saveToHistory(text);
    //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // } catch (err: any) {
    //   setError(getFriendlyErrorMessage(err));
    // } finally {
    //   setLoading(false);
    // }
  };

  // --- Download ---
  const handleDownloadWord = () => {
    if (!result) return;
    // Simple HTML wrapper for Word export
    // Note: This is a basic export. For complex LaTeX to Word, we usually need dedicated converters.
    // Here we wrap the content or rendered HTML.

    // For this demo, let's assume we render the LaTeX to HTML via KaTeX (stripped) or just text
    // A better approach for "Giáo án" is to export the raw text if it's LaTeX, or try to HTML-ify it.

    const preHtml =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='[http://www.w3.org/TR/REC-html40](http://www.w3.org/TR/REC-html40)'><head><meta charset='utf-8'><title>Lesson Plan</title></head><body>";
    const contentHtml = `<pre>${result}</pre>`; // Export raw LaTeX code for user to copy/paste into Overleaf/Word Editor
    // Or if we had a HTML converter, we'd use that.

    const blob = new Blob(
      ["\ufeff", preHtml + contentHtml + "</body></html>"],
      {
        type: "application/msword",
      },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Giao_An_${formData.lessonName.replace(/\s+/g, "_")}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadMenu(false);
  };

  const restoreHistory = (item: LessonHistoryItem) => {
    setResult(item.result);
    setFormData(item.formData);
    setViewMode("preview");
    setShowHistory(false);
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("lesson_plan_history", JSON.stringify(newHistory));
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-800 mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Thông tin bài dạy
          </h2>
          <p className="text-sm text-slate-500">
            Nhập PPCT và Tài liệu để AI soạn bài
          </p>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-indigo-700 font-bold text-sm shadow-sm hover:bg-indigo-50"
        >
          <History className="w-4 h-4" /> Lịch sử bài dạy
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT: Config Panel */}
        <div className="xl:col-span-4 space-y-6">
          <div
            className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 ${loading ? "opacity-70 pointer-events-none" : ""}`}
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">Cấu trúc bài dạy</h2>
            </div>
            {/* A. THÔNG TIN TIÊU ĐỀ */}

            {/* 1. Thông tin chung */}
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
              </div>
            </div>

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

            {/* 2. Upload Files */}
            <div className="mb-5 space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> 1. Kế
                hoạch dạy học (PPCT)
              </label>
              {!ppctFile ? (
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500">
                    Excel / CSV
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handlePpctFileChange}
                    accept=".xlsx,.csv,.xls"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-800 truncate w-4/5">
                    {ppctFile.name}
                  </span>
                  <button
                    onClick={() => {
                      setPpctFile(null);
                      setPpctRows([]);
                    }}
                    className="text-emerald-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mt-4">
                <BookOpen className="w-4 h-4 text-blue-600" /> 2. Tài liệu nguồn
                (Sách/Giáo án)
              </label>
              {!contentFile ? (
                <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500">Word / PDF</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleContentFileChange}
                    accept=".docx,.pdf,.doc,.txt"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100">
                  <span className="text-xs font-medium text-blue-800 truncate w-4/5">
                    {contentFile.name}
                  </span>
                  <button
                    onClick={() => {
                      setContentFile(null);
                      setContentPreview("");
                    }}
                    className="text-blue-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 3. Chi tiết bài dạy */}
            <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900 uppercase">
                  Chi tiết bài dạy
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold">
                    Tuần
                  </label>
                  <input
                    name="week"
                    type="number"
                    value={formData.week}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold">
                    Tiết PPCT
                  </label>
                  <input
                    name="period"
                    type="number"
                    value={formData.period}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold">
                  Tên bài / Chủ đề
                </label>
                <input
                  name="lessonName"
                  value={formData.lessonName}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded border text-sm"
                  placeholder="VD: Phép cộng số nguyên..."
                />
              </div>
            </div>

            {/* 4. Năng lực số */}
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
              disabled={loading || !apiKey}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <FileSignature className="w-5 h-5" />
              )}
              {loading ? "Đang soạn bài..." : "Soạn Giáo Án"}
            </button>
          </div>
        </div>

        {/* RIGHT PREVIEW */}
        <div className="xl:col-span-8 flex flex-col h-[85vh]">
          {/* Toolbar */}
          <div className="bg-white p-3 rounded-t-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("code")}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2 ${viewMode === "code" ? "bg-indigo-50 text-indigo-700" : "text-slate-500"}`}
              >
                <FileCode className="w-4 h-4" /> LaTeX
              </button>
              <button
                onClick={() => setViewMode("preview")}
                disabled={!result}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg flex items-center gap-2 ${viewMode === "preview" ? "bg-emerald-50 text-emerald-700" : "text-slate-500"}`}
              >
                <Eye className="w-4 h-4" /> Xem trước
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={!result}
                className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" /> Tải về{" "}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-10 overflow-hidden">
                  <button
                    onClick={handleDownloadWord}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <FileType className="w-4 h-4 text-blue-600" /> Word (.doc)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Editor/Preview Area */}
          <div className="flex-1 bg-white border-x border-b border-slate-200 shadow-sm relative overflow-hidden rounded-b-2xl">
            {viewMode === "code" ? (
              <textarea
                value={result || ""}
                readOnly
                className="w-full h-full p-4 font-mono text-sm text-slate-700 bg-white resize-none outline-none"
                placeholder={
                  loading
                    ? "AI đang suy nghĩ và viết giáo án..."
                    : "Kết quả LaTeX sẽ hiện ở đây..."
                }
              />
            ) : (
              <div
                ref={previewRef}
                className="absolute inset-0 p-8 overflow-y-auto bg-white prose max-w-none"
              >
                {result ? (
                  <LatexPreview content={result} />
                ) : (
                  <div className="text-center text-slate-400 mt-20">
                    Chưa có nội dung
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HISTORY MODAL */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Lịch sử soạn bài</h3>
              <button onClick={() => setShowHistory(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {history.length === 0 ? (
                <p className="text-center text-slate-400">Trống</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-xl border shadow-sm group"
                  >
                    <div className="flex justify-between">
                      <h4 className="font-bold text-indigo-900">
                        {item.formData.lessonName}
                      </h4>
                      <button
                        onClick={(e) => deleteHistory(item.id, e)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.formData.grade} • Tuần {item.formData.week} •{" "}
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => restoreHistory(item)}
                      className="mt-2 text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" /> Xem lại
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

export default LessonPlanGenerator;
