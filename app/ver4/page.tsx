"use client";
import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import katex from "katex";

import {
  Layers,
  Upload,
  Cpu,
  Code,
  Check,
  Play,
  Loader2,
  AlertCircle,
  X,
  Bot,
  Wifi,
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
  Menu,
  FileSignature,
  Users,
  LayoutDashboard,
  GraduationCap,
  ChevronLeft,
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
  questionType: string; // "Trắc nghiệm", "Tự luận", "Hỗn hợp"
  mixRatio: number; // Tỉ lệ % Trắc nghiệm (nếu là Hỗn hợp)
  difficulty: string;
  digitalCompetence: boolean;
  academicYear: string;
  selectedCompetencies: string[];
  digitalQuestionCount: number; // Số câu hỏi năng lực số
  inputType: "topic" | "file";
  model: string;
}

interface Competency {
  code: string;
  label: string;
  desc: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  formData: FormData; // Lưu lại cấu hình để khôi phục context
  result: string; // Mã LaTeX
  fileName?: string; // Tên file nếu có
}

// --- Data: Categorized by Period ---
const NLS_DATABASE: Record<string, Competency[]> = {
  "2025-2026": [
    {
      code: "1.1.TC1a",
      label: "Khai thác dữ liệu",
      desc: "Xác định và giải thích nhu cầu thông tin.",
    },
    {
      code: "1.2.TC1b",
      label: "Đánh giá thông tin",
      desc: "Phân tích độ tin cậy của nguồn dữ liệu số.",
    },
    {
      code: "2.1.TC1a",
      label: "Giao tiếp số",
      desc: "Tương tác qua các công cụ kỹ thuật số cơ bản.",
    },
    {
      code: "3.1.TC1a",
      label: "Sáng tạo nội dung",
      desc: "Tạo và chỉnh sửa văn bản/dữ liệu ở định dạng số.",
    },
    {
      code: "5.1.TC1a",
      label: "Giải quyết sự cố",
      desc: "Xử lý lỗi kỹ thuật đơn giản khi dùng thiết bị.",
    },
  ],
  "2026-2027": [
    {
      code: "1.3.TC2a",
      label: "Quản lý dữ liệu lớn",
      desc: "Tổ chức và lưu trữ dữ liệu phức tạp.",
    },
    {
      code: "4.1.TC2a",
      label: "An toàn mạng nâng cao",
      desc: "Bảo vệ danh tính và dữ liệu cá nhân.",
    },
    {
      code: "6.1.TC1a",
      label: "AI Cơ bản",
      desc: "Hiểu và ứng dụng AI để giải quyết vấn đề đơn giản.",
    },
  ],
};
const SUBJECT_OPTIONS = [
  "Toán học",
  "Vật lý",
  "Hóa học",
  "Tin học",
  "Ngữ văn",
  "Lịch sử",
  "Địa lý",
  "Sinh học",
].map((s) => ({ value: s, label: s }));
const DURATION_OPTIONS = [
  "15 phút",
  "45 phút",
  "60 phút",
  "90 phút",
  "120 phút",
].map((t) => ({ value: t, label: t }));
const DIFFICULTY_OPTIONS = ["Cơ bản", "Trung bình", "Khó", "Nâng cao"].map(
  (d) => ({ value: d, label: d }),
);
const QUESTION_TYPE_OPTIONS = [
  { value: "Trắc nghiệm", label: "1. Trắc nghiệm (100%)" },
  { value: "Tự luận", label: "2. Tự luận (100%)" },
  { value: "Hỗn hợp", label: "3. Hỗn hợp (TN + TL)" },
];
const ACADEMIC_YEAR_OPTIONS = ["2025-2026", "2026-2027"].map((y) => ({
  value: y,
  label: y,
}));

// --- CUSTOM LATEX RENDERER COMPONENT ---
// Updated: Xử lý sạch các lệnh LaTeX thừa và hỗ trợ chia cột (Multicols)
// Updated: Bảo vệ công thức toán (Math protection) trước khi xử lý văn bản
// const LatexPreview = ({ content }: { content: string }) => {
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!containerRef.current || !content) return;

//     // A. BẢO VỆ CÔNG THỨC TOÁN
//     // Chúng ta sẽ tạm thay thế các công thức toán bằng Placeholder để không bị code xử lý text làm hỏng
//     const mathExpressions: string[] = [];
//     let protectedContent = content;

//     // Regex tìm công thức: $$...$$, \[...\], $...$ (chú ý thứ tự ưu tiên)
//     // Cần flag 's' (dotAll) để match cả xuống dòng trong công thức
//     protectedContent = protectedContent.replace(
//       /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$)/g,
//       (match) => {
//         mathExpressions.push(match);
//         return `___MATH_PLACEHOLDER_${mathExpressions.length - 1}___`;
//       },
//     );

//     // B. XỬ LÝ ĐỊNH DẠNG VĂN BẢN (TRÊN PHẦN TEXT ĐÃ ĐƯỢC BẢO VỆ)
//     let html = protectedContent;

//     // 1. Loại bỏ phần khai báo
//     if (html.includes("\\begin{document}")) {
//       html = html.split("\\begin{document}")[1];
//       html = html.split("\\end{document}")[0];
//     }

//     // 2. Xử lý các lệnh cấu trúc & làm sạch
//     html = html
//       .replace(/\\noindent/g, "")
//       .replace(/\\hfill/g, "")
//       .replace(
//         /\\newpage/g,
//         '<div class="my-8 border-t-2 border-dashed border-slate-300 relative"><span class="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-slate-400 font-mono">Trang mới</span></div>',
//       )

//       .replace(/\\vspace{(.*?)}/g, (match, size) => {
//         const height = size.includes("cm") ? parseFloat(size) * 37.8 : 20;
//         return `<div style="height:${height}px"></div>`;
//       })

//       // Header Layout
//       .replace(
//         /\\begin{minipage}(\[.*?\])?{(.*?)\\textwidth}/g,
//         (match, opt, width) => {
//           const pct = parseFloat(width) * 100;
//           return `<div class="inline-block align-top text-center px-2" style="width: ${pct}%">`;
//         },
//       )
//       .replace(/\\end{minipage}/g, "</div>")
//       .replace(/\\centering/g, "")
//       .replace(
//         /\\rule{(.*?)}{(.*?)}/g,
//         '<hr class="border-t border-black mx-auto my-1" style="width: $1; height: $2; background-color: black; border: none;">',
//       )

//       // Typography
//       .replace(
//         /\\section\*?{(.*?)}/g,
//         '<h3 class="text-lg font-bold mt-6 mb-3 text-indigo-900 border-b pb-1 uppercase">$1</h3>',
//       )
//       .replace(
//         /\\subsection\*?{(.*?)}/g,
//         '<h4 class="font-bold mt-4 mb-2 text-slate-800">$1</h4>',
//       )
//       // --- UPDATE: Thay thế mã Năng lực số bằng nhãn hiển thị ---
//       .replace(/\[\d+\.\d+\.TC[^\]]+\]/g, "<strong>[Năng lực số]</strong>")
//       // ---------------------------------------------------------
//       .replace(/\\textbf{(.*?)}/g, "<strong>$1</strong>")
//       .replace(/\\textit{(.*?)}/g, "<em>$1</em>")
//       .replace(/\\underline{(.*?)}/g, "<u>$1</u>")

//       // Lists & Multicols
//       .replace(
//         /\\begin{multicols}{(.*?)}/g,
//         '<div class="grid gap-4 my-2" style="grid-template-columns: repeat($1, minmax(0, 1fr));">',
//       )
//       .replace(/\\end{multicols}/g, "</div>")
//       .replace(
//         /\\begin{enumerate}(\[.*?\])?/g,
//         '<ol class="list-decimal pl-5 space-y-1 mb-3">',
//       )
//       .replace(/\\end{enumerate}/g, "</ol>")
//       .replace(
//         /\\begin{itemize}(\[.*?\])?/g,
//         '<ul class="list-disc pl-5 space-y-1 mb-3">',
//       )
//       .replace(/\\end{itemize}/g, "</ul>")
//       .replace(/\\item\s/g, "<li>")

//       // Tables
//       .replace(
//         /\\begin{tabular}{(.*?)}/g,
//         '<div class="overflow-x-auto my-2"><table class="min-w-full border-collapse border border-slate-300">',
//       )
//       .replace(/\\end{tabular}/g, "</table></div>")
//       .replace(/\\hline/g, "")

//       // QUAN TRỌNG: Chỉ replace \\ thành <br/> ở ngoài công thức toán
//       .replace(/\\\\/g, "<br/>");

//     // C. KHÔI PHỤC CÔNG THỨC TOÁN & RENDER
//     // Chúng ta sẽ khôi phục lại các placeholder thành thẻ span để Katex render vào đó
//     containerRef.current.innerHTML = html;

//     // Helper function để thay thế placeholder trong DOM
//     const restoreAndRenderMath = () => {
//       if (!containerRef.current) return;

//       // Tìm tất cả các text node có chứa placeholder
//       const walker = document.createTreeWalker(
//         containerRef.current,
//         NodeFilter.SHOW_TEXT,
//         null,
//       );
//       const nodesToProcess: { node: Node; text: string }[] = [];

//       while (walker.nextNode()) {
//         if (walker.currentNode.nodeValue?.includes("___MATH_PLACEHOLDER_")) {
//           nodesToProcess.push({
//             node: walker.currentNode,
//             text: walker.currentNode.nodeValue,
//           });
//         }
//       }

//       // Xử lý từng node
//       nodesToProcess.forEach(({ node, text }) => {
//         const fragment = document.createDocumentFragment();
//         const parts = text.split(/(___MATH_PLACEHOLDER_\d+___)/g);

//         parts.forEach((part) => {
//           const match = part.match(/___MATH_PLACEHOLDER_(\d+)___/);
//           if (match) {
//             const index = parseInt(match[1]);
//             const mathOriginal = mathExpressions[index];

//             const span = document.createElement("span");
//             // Render Katex
//             try {
//               const isDisplay =
//                 mathOriginal.startsWith("$$") || mathOriginal.startsWith("\\[");
//               const cleanMath = mathOriginal
//                 .replace(/^\$\$|\$\$$/g, "")
//                 .replace(/^\\\[|\\\]$/g, "")
//                 .replace(/^\$|\$$/g, "");

//               katex.render(cleanMath, span, {
//                 throwOnError: false,
//                 displayMode: isDisplay,
//                 output: "html",
//               });
//             } catch (e) {
//               span.textContent = mathOriginal;
//             }
//             fragment.appendChild(span);
//           } else if (part) {
//             fragment.appendChild(document.createTextNode(part));
//           }
//         });

//         node.parentNode?.replaceChild(fragment, node);
//       });
//     };

//     restoreAndRenderMath();
//   }, [content]);

//   return (
//     <div
//       ref={containerRef}
//       className="leading-relaxed text-justify text-slate-800"
//     />
//   );
// };
// --- CUSTOM LATEX RENDERER COMPONENT ---
// const LatexPreview = ({ content }: { content: string }) => {
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (!containerRef.current || !content) return;

//     // A. BẢO VỆ CÔNG THỨC TOÁN
//     const mathExpressions: string[] = [];
//     let protectedContent = content;

//     protectedContent = protectedContent.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$)/g, (match) => {
//         mathExpressions.push(match);
//         return `___MATH_PLACEHOLDER_${mathExpressions.length - 1}___`;
//     });

//     let html = protectedContent;

//     // 1. Loại bỏ phần khai báo
//     if (html.includes("\\begin{document}")) {
//       html = html.split("\\begin{document}")[1];
//       html = html.split("\\end{document}")[0];
//     }

//     // 2. Làm sạch cơ bản
//     html = html
//       .replace(/\\noindent/g, '')
//       .replace(/\\hfill/g, '')
//       .replace(/\\newpage/g, '<div class="my-8 border-t-2 border-dashed border-slate-300 relative"><span class="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-slate-400 font-mono">Trang mới</span></div>')
//       .replace(/\\vspace{(.*?)}/g, (match, size) => {
//          const height = size.includes('cm') ? parseFloat(size) * 37.8 : 20;
//          return `<div style="height:${height}px"></div>`;
//       });

//     // B. XỬ LÝ HEADER (MINIPAGE)
//     html = html
//       .replace(/\\begin{minipage}(\[.*?\])?{(.*?)\\textwidth}/g, (match, opt, width) => {
//           const pct = parseFloat(width) * 100;
//           return `<div class="inline-block align-top text-center px-2" style="width: ${pct}%">`;
//       })
//       .replace(/\\end{minipage}/g, '</div>')
//       .replace(/\\centering/g, '')
//       .replace(/\\rule{(.*?)}{(.*?)}/g, '<hr class="border-t border-black mx-auto my-1" style="width: $1; height: $2; background-color: black; border: none;">');

//     // C. XỬ LÝ BẢNG (TABULAR) - PHẦN QUAN TRỌNG MỚI CẬP NHẬT
//     // Tìm khối tabular và biến nó thành HTML Table hoàn chỉnh
//     html = html.replace(/\\begin{center}\s*\\begin{tabular}{.*?}([\s\S]*?)\\end{tabular}\s*\\end{center}|\\begin{tabular}{.*?}([\s\S]*?)\\end{tabular}/g, (match, c1, c2) => {
//         const tableContent = c1 || c2; // Lấy nội dung bên trong
//         if (!tableContent) return match;

//         // Xóa \hline
//         const cleanContent = tableContent.replace(/\\hline/g, '');

//         // Tách dòng dựa vào \\
//         const rows = cleanContent.split('\\\\').filter((r: string) => r.trim().length > 0);

//         let tableHtml = '<div class="overflow-x-auto my-4 flex justify-center"><table class="border-collapse border border-slate-400 min-w-[50%]">';

//         rows.forEach((row: string, index: number) => {
//              // Tách cột dựa vào &
//              const cells = row.split('&');
//              tableHtml += `<tr class="${index === 0 ? 'bg-slate-100 font-bold' : ''}">`; // Dòng đầu in đậm
//              cells.forEach((cell: string) => {
//                  tableHtml += `<td class="border border-slate-300 p-2 text-center text-sm">${cell.trim()}</td>`;
//              });
//              tableHtml += '</tr>';
//         });

//         tableHtml += '</table></div>';
//         return tableHtml;
//     });

//     // D. ĐỊNH DẠNG VĂN BẢN KHÁC
//     html = html
//       .replace(/\[\d+\.\d+\.TC[^\]]+\]/g, '<strong>[Năng lực số]</strong>')
//       .replace(/\\section\*?{(.*?)}/g, '<h3 class="text-lg font-bold mt-6 mb-3 text-indigo-900 border-b pb-1 uppercase">$1</h3>')
//       .replace(/\\subsection\*?{(.*?)}/g, '<h4 class="font-bold mt-4 mb-2 text-slate-800">$1</h4>')
//       .replace(/\\textbf{(.*?)}/g, '<strong>$1</strong>')
//       .replace(/\\textit{(.*?)}/g, '<em>$1</em>')
//       .replace(/\\underline{(.*?)}/g, '<u>$1</u>')

//       // Multicols
//       .replace(/\\begin{multicols}{(.*?)}/g, '<div class="grid gap-4 my-2" style="grid-template-columns: repeat($1, minmax(0, 1fr));">')
//       .replace(/\\end{multicols}/g, '</div>')

//       // Lists
//       .replace(/\\begin{enumerate}(\[.*?\])?/g, '<ol class="list-decimal pl-5 space-y-1 mb-3">')
//       .replace(/\\end{enumerate}/g, '</ol>')
//       .replace(/\\begin{itemize}(\[.*?\])?/g, '<ul class="list-disc pl-5 space-y-1 mb-3">')
//       .replace(/\\end{itemize}/g, '</ul>')
//       .replace(/\\item\s/g, '<li>')

//       // Thay thế xuống dòng còn lại (ngoài bảng)
//       .replace(/\\\\/g, '<br/>');

//     // E. KHÔI PHỤC MATH
//     containerRef.current.innerHTML = html;
//     const restoreAndRenderMath = () => {
//         if (!containerRef.current) return;
//         const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, null);
//         const nodesToProcess: { node: Node, text: string }[] = [];
//         while (walker.nextNode()) {
//             if (walker.currentNode.nodeValue?.includes('___MATH_PLACEHOLDER_')) {
//                 nodesToProcess.push({ node: walker.currentNode, text: walker.currentNode.nodeValue });
//             }
//         }
//         nodesToProcess.forEach(({ node, text }) => {
//             const fragment = document.createDocumentFragment();
//             const parts = text.split(/(___MATH_PLACEHOLDER_\d+___)/g);
//             parts.forEach(part => {
//                 const match = part.match(/___MATH_PLACEHOLDER_(\d+)___/);
//                 if (match) {
//                     const index = parseInt(match[1]);
//                     const mathOriginal = mathExpressions[index];
//                     const span = document.createElement("span");
//                     try {
//                         const isDisplay = mathOriginal.startsWith('$$') || mathOriginal.startsWith('\\[');
//                         const cleanMath = mathOriginal.replace(/^\$\$|\$\$$/g, '').replace(/^\\\[|\\\]$/g, '').replace(/^\$|\$$/g, '');
//                         katex.render(cleanMath, span, { throwOnError: false, displayMode: isDisplay, output: 'html' });
//                     } catch (e) { span.textContent = mathOriginal; }
//                     fragment.appendChild(span);
//                 } else if (part) fragment.appendChild(document.createTextNode(part));
//             });
//             node.parentNode?.replaceChild(fragment, node);
//         });
//     };
//     restoreAndRenderMath();

//   }, [content]);

//   return <div ref={containerRef} className="leading-relaxed text-justify text-slate-800" />;
// };
// --- CUSTOM LATEX RENDERER COMPONENT (MathML) ---
const LatexPreview = ({ content }: { content: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // A. BẢO VỆ CÔNG THỨC TOÁN
    const mathExpressions: string[] = [];
    let protectedContent = content;

    protectedContent = protectedContent.replace(
      /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$)/g,
      (match) => {
        mathExpressions.push(match);
        return `___MATH_PLACEHOLDER_${mathExpressions.length - 1}___`;
      },
    );

    let html = protectedContent;

    // 1. Loại bỏ phần khai báo
    if (html.includes("\\begin{document}")) {
      html = html.split("\\begin{document}")[1];
      html = html.split("\\end{document}")[0];
    }

    // 2. Làm sạch & Định dạng văn bản
    html = html
      .replace(/\\noindent/g, "")
      .replace(/\\hfill/g, "")
      .replace(
        /\\newpage/g,
        '<div class="my-8 border-t-2 border-dashed border-slate-300 relative"><span class="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-slate-400 font-mono">Trang mới</span></div>',
      )
      .replace(/\\vspace{(.*?)}/g, (match, size) => {
        const height = size.includes("cm") ? parseFloat(size) * 37.8 : 20;
        return `<div style="height:${height}px"></div>`;
      })
      // Header
      .replace(
        /\\begin{minipage}(\[.*?\])?{(.*?)\\textwidth}/g,
        (match, opt, width) => {
          const pct = parseFloat(width) * 100;
          return `<div class="inline-block align-top text-center px-2" style="width: ${pct}%">`;
        },
      )
      .replace(/\\end{minipage}/g, "</div>")
      .replace(/\\centering/g, "")
      .replace(
        /\\rule{(.*?)}{(.*?)}/g,
        '<hr class="border-t border-black mx-auto my-1" style="width: $1; height: $2; background-color: black; border: none;">',
      )

      // Table (Ma trận & Đáp án)
      .replace(
        /\\begin{center}\s*\\begin{tabular}{.*?}([\s\S]*?)\\end{tabular}\s*\\end{center}|\\begin{tabular}{.*?}([\s\S]*?)\\end{tabular}/g,
        (match, c1, c2) => {
          const tableContent = c1 || c2;
          if (!tableContent) return match;
          const cleanContent = tableContent.replace(/\\hline/g, "");
          const rows = cleanContent
            .split("\\\\")
            .filter((r: string) => r.trim().length > 0);
          let tableHtml =
            '<div class="overflow-x-auto my-4 flex justify-center"><table class="border-collapse border border-slate-400 min-w-[50%]">';
          rows.forEach((row: string, index: number) => {
            const cells = row.split("&");
            tableHtml += `<tr class="${index === 0 ? "bg-slate-100 font-bold" : ""}">`;
            cells.forEach((cell: string) => {
              tableHtml += `<td class="border border-slate-300 p-2 text-center text-sm">${cell.trim()}</td>`;
            });
            tableHtml += "</tr>";
          });
          tableHtml += "</table></div>";
          return tableHtml;
        },
      )

      // Typography
      .replace(/\[\d+\.\d+\.TC[^\]]+\]/g, "<strong>[Năng lực số]</strong>")
      .replace(
        /\\section\*?{(.*?)}/g,
        '<h3 class="text-lg font-bold mt-6 mb-3 text-indigo-900 border-b pb-1 uppercase">$1</h3>',
      )
      .replace(
        /\\subsection\*?{(.*?)}/g,
        '<h4 class="font-bold mt-4 mb-2 text-slate-800">$1</h4>',
      )
      .replace(/\\textbf{(.*?)}/g, "<strong>$1</strong>")
      .replace(/\\textit{(.*?)}/g, "<em>$1</em>")
      .replace(/\\underline{(.*?)}/g, "<u>$1</u>")

      // Multicols & Lists
      .replace(
        /\\begin{multicols}{(.*?)}/g,
        '<div class="grid gap-4 my-2" style="grid-template-columns: repeat($1, minmax(0, 1fr));">',
      )
      .replace(/\\end{multicols}/g, "</div>")
      .replace(
        /\\begin{enumerate}(\[.*?\])?/g,
        '<ol class="list-decimal pl-5 space-y-1 mb-3">',
      )
      .replace(/\\end{enumerate}/g, "</ol>")
      .replace(
        /\\begin{itemize}(\[.*?\])?/g,
        '<ul class="list-disc pl-5 space-y-1 mb-3">',
      )
      .replace(/\\end{itemize}/g, "</ul>")
      .replace(/\\item\s/g, "<li>")
      .replace(/\\\\/g, "<br/>");

    // B. KHÔI PHỤC VÀ RENDER
    containerRef.current.innerHTML = html;

    const restoreAndRenderMath = () => {
      if (!containerRef.current) return;

      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        null,
      );
      const nodesToProcess: { node: Node; text: string }[] = [];

      while (walker.nextNode()) {
        if (walker.currentNode.nodeValue?.includes("___MATH_PLACEHOLDER_")) {
          nodesToProcess.push({
            node: walker.currentNode,
            text: walker.currentNode.nodeValue,
          });
        }
      }

      nodesToProcess.forEach(({ node, text }) => {
        const fragment = document.createDocumentFragment();
        const parts = text.split(/(___MATH_PLACEHOLDER_\d+___)/g);

        parts.forEach((part) => {
          const match = part.match(/___MATH_PLACEHOLDER_(\d+)___/);
          if (match) {
            const index = parseInt(match[1]);
            const mathOriginal = mathExpressions[index];
            const span = document.createElement("span");

            // Reset CSS để MathML hiển thị tự nhiên
            span.style.lineHeight = "normal";
            span.style.fontSize = "1.1em";

            try {
              const isDisplay =
                mathOriginal.startsWith("$$") || mathOriginal.startsWith("\\[");
              const cleanMath = mathOriginal
                .replace(/^\$\$|\$\$$/g, "")
                .replace(/^\\\[|\\\]$/g, "")
                .replace(/^\$|\$$/g, "");

              // --- QUAN TRỌNG: SỬ DỤNG MATHML THAY VÌ HTML (SVG) ---
              katex.render(cleanMath, span, {
                throwOnError: false,
                displayMode: isDisplay,
                output: "mathml", // Chuyển sang MathML Native
              });
            } catch (e) {
              span.textContent = mathOriginal;
            }
            fragment.appendChild(span);
          } else if (part) {
            fragment.appendChild(document.createTextNode(part));
          }
        });
        node.parentNode?.replaceChild(fragment, node);
      });
    };

    restoreAndRenderMath();
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="leading-relaxed text-justify text-slate-800"
    />
  );
};

// --- CONSTANTS ---
const MENU_ITEMS = [
  { id: "test-generator", label: "Tạo Đề Thi", icon: FileCode },
  { id: "lesson-plan", label: "Soạn Giáo Án", icon: FileSignature },
  { id: "class-management", label: "Quản Lý Lớp", icon: Users },
  { id: "student-evaluation", label: "Đánh Giá HS", icon: GraduationCap },
  { id: "dashboard", label: "Tổng Quan", icon: LayoutDashboard },
];

// --- CUSTOM MODEL SELECTOR COMPONENT ---
const ModelSelector = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const models = [
    { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Preview)" },
  ];

  const selectedLabel =
    models.find((m) => m.value === value)?.label || "Chọn Model";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border transition-all w-full md:w-auto outline-none ${
          disabled
            ? "opacity-50 border-slate-200 cursor-not-allowed"
            : "border-slate-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer"
        } ${isOpen ? "ring-2 ring-indigo-100 border-indigo-300" : ""}`}
      >
        <Bot
          className={`w-4 h-6 ml-1 flex-shrink-0 ${disabled ? "text-slate-400" : "text-emerald-500"}`}
        />
        <span className="text-xs font-medium text-slate-700 w-32 md:w-40 text-left truncate">
          {selectedLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {models.map((model) => (
            <button
              key={model.value}
              onClick={() => {
                onChange(model.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex items-center justify-between group ${
                value === model.value
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-700"
              }`}
            >
              <span className="truncate">{model.label}</span>
              {value === model.value && (
                <Check className="w-3 h-3 text-indigo-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- CUSTOM SELECTOR COMPONENT (Generic) ---
const SelectorModel = ({
  value,
  options,
  onChange,
  disabled,
  placeholder = "Chọn...",
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full px-3 py-2.5 bg-white rounded-lg border transition-all outline-none text-sm ${
          disabled
            ? "opacity-60 border-slate-200 cursor-not-allowed bg-slate-50"
            : "border-slate-200 hover:border-indigo-300 hover:shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
        } ${isOpen ? "border-indigo-500 ring-2 ring-indigo-100" : ""}`}
      >
        <span
          className={`truncate ${!value ? "text-slate-400" : "text-slate-700"}`}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between group ${
                value === option.value
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-700"
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- SIDEBAR COMPONENT ---
const Sidebar = ({
  isCollapsed,
  activeTab,
  setActiveTab,
}: {
  isCollapsed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  return (
    <div
      className={`bg-indigo-900 text-white transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-16" : "w-64"
      } h-screen fixed left-0 top-0 z-50 shadow-xl border-r border-indigo-800`}
    >
      {/* Sidebar Header - Fixed Height h-16 to match Global Header */}
      <div className="h-16 flex items-center justify-center border-b border-indigo-800 transition-all duration-300 overflow-hidden">
        <div
          className={`flex items-center gap-2 font-bold text-lg tracking-tight whitespace-nowrap ${isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}
        >
          <Code className="w-6 h-6 text-indigo-400 flex-shrink-0" />
          <span>
            Edu<span className="text-indigo-400">Tools</span>
          </span>
        </div>
        {isCollapsed && <Code className="w-8 h-8 text-indigo-400" />}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 space-y-2 px-2 overflow-x-hidden">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 font-bold"
                : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
            } ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? item.label : ""}
          >
            <item.icon
              className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? "text-white" : "text-indigo-400 group-hover:text-white"}`}
            />

            <span
              className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-indigo-800 text-xs text-indigo-400 text-center overflow-hidden whitespace-nowrap">
        {!isCollapsed && <p>© 2025 EduTools AI</p>}
      </div>
    </div>
  );
};

// --- PLACEHOLDER COMPONENT ---
const FeaturePlaceholder = ({
  title,
  icon: Icon,
}: {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
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

// --- MAIN APP COMPONENT ---
const TestGenerator: React.FC = () => {
  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("test-generator");
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
    mixRatio: 70, // Mặc định 70% Trắc nghiệm
    difficulty: "Trung bình",
    digitalCompetence: false,
    academicYear: "2025-2026",
    selectedCompetencies: [],
    digitalQuestionCount: 2, // Mặc định 2 câu
    inputType: "topic",
    model: "gemini-3-flash-preview",
  });

  // --- Helper xử lý lỗi thân thiện (MỚI) ---
  // Hàm này giúp chuyển đổi mã lỗi kỹ thuật sang tiếng Việt dễ hiểu cho giáo viên
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
    return `Lỗi không xác định: ${msg.substring(0, 100)}...`;
  };

  // --- Helpers ---
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

      // Ràng buộc logic: Nếu thay đổi tổng số câu hỏi (questionCount)
      if (name === "questionCount") {
        const newTotal = parseInt(value as string) || 0;
        // Nếu số câu NLS hiện tại lớn hơn tổng số mới -> Giảm NLS xuống bằng tổng số mới
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

  // --- Helpers Mới: Xử lý chọn tất cả ---
  const handleSelectAllCompetencies = () => {
    const currentList = NLS_DATABASE[formData.academicYear] || [];
    const allCodes = currentList.map((c) => c.code);

    setFormData((prev) => {
      // Kiểm tra xem đã chọn hết chưa
      const isAllSelected = allCodes.every((code) =>
        prev.selectedCompetencies.includes(code),
      );

      return {
        ...prev,
        selectedCompetencies: isAllSelected
          ? prev.selectedCompetencies.filter((c) => !allCodes.includes(c)) // Bỏ chọn hết của năm hiện tại
          : [...new Set([...prev.selectedCompetencies, ...allCodes])], // Chọn tất cả
      };
    });
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // --- API & Key Management ---
  // --- Check Connection (CẬP NHẬT) ---
  // Case 1: Kiểm tra kết nối và hạn mức ngay khi nhập Key
  const checkConnection = async (keyToTest?: string) => {
    const key = keyToTest || apiKey;
    if (!key) return setError("Vui lòng nhập API Key.");

    setCheckingModel(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: formData.model });
      await model.generateContent("Ping"); // Test nhẹ
      setConnectionStatus("success");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setConnectionStatus("error");
      // Hiển thị lỗi thân thiện
      setError(getFriendlyErrorMessage(err));
    } finally {
      setCheckingModel(false);
    }
  };

  // --- Effects ---
  // --- MỚI: Tự động load API Key từ LocalStorage ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("gemini_api_key");
      if (storedKey) {
        setApiKey(storedKey);
        checkConnection(storedKey); // Kiểm tra ngay khi load trang
      }
    }
  }, []);

  // 2. MỚI: Load History từ LocalStorage khi mở app
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("exam_history");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Lỗi đọc lịch sử", e);
        }
      }
    }
  }, []);

  // --- MỚI: Hàm xử lý nhập và lưu API Key ---
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    localStorage.setItem("gemini_api_key", value);
    if (connectionStatus === "success") setConnectionStatus("idle"); // Reset trạng thái nếu sửa key
  };

  // Hàm xử lý khi bấm nút "Đổi Key"
  const handleResetKey = () => {
    setConnectionStatus("idle");
    setTimeout(() => {
      // Focus vào input sau khi hiện lại (nếu cần xử lý ref)
    }, 100);
  };

  // --- File Handling ---
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

  // --- Prompt Builder (Strict LaTeX) ---
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
        - Các chỉ báo cần kiểm tra:
        ${selectedDetails.map((c) => `- Mã [${c.code}] ${c.label}: ${c.desc}`).join("\n")}
        
        *YÊU CẦU ĐỊNH DẠNG (QUAN TRỌNG):* 1. Nội dung câu hỏi phải lồng ghép vào kiến thức môn học.
        2. NHÃN HIỂN THỊ: Tại đầu mỗi câu hỏi năng lực số, thay vì ghi mã số (ví dụ [1.1.TC1a]), hãy ghi nhãn là: \\textbf{[Năng lực số]}.
        `;
    }

    // Xử lý yêu cầu cấu trúc câu hỏi
    let structureReq = "";
    if (formData.questionType === "Hỗn hợp") {
      structureReq = `Cấu trúc đề: ${formData.mixRatio}% Trắc nghiệm và ${100 - formData.mixRatio}% Tự luận.`;
    } else {
      structureReq = `Cấu trúc đề: 100% ${formData.questionType}.`;
    }

    const fileContext = uploadedFile
      ? `Tài liệu tham khảo: Sử dụng nội dung trong file đính kèm làm nguồn kiến thức chính.`
      : `Chủ đề trọng tâm: ${formData.topic}`;

    // STRICT INSTRUCTIONS
    return `
      Role: Expert Teacher & LaTeX Typesetter.
      Task: Create a standard test based on the configurations below.
      
      THÔNG TIN CẤU HÌNH:
      - Loại câu hỏi: ${formData.questionType === "Hỗn hợp" ? `${formData.mixRatio}% Trắc nghiệm, ${100 - formData.mixRatio}% Tự luận` : formData.questionType}
      - Tổng số câu: ${formData.questionCount}
      - Độ khó: ${formData.difficulty}
      ${digitalReq}

      YÊU CẦU ĐỊNH DẠNG QUAN TRỌNG (LATEX):
      Toàn bộ đề thi phải được trình bày theo định dạng LaTeX (\`\\documentclass[12pt]{article}\`) chuẩn mẫu.

      1. Thiết kế Header (Tiêu đề) BẮT BUỘC dùng cấu trúc minipage sau:
         \\noindent
         \\begin{minipage}[t]{0.4\\textwidth}
             \\centering
             \\textbf{SỞ GD\\&ĐT ${formData.department.toUpperCase()}} \\\\
             \\textbf{TRƯỜNG ${formData.school.toUpperCase()}} \\\\
             \\rule{3cm}{1pt}
         \\end{minipage}
         \\hfill
         \\begin{minipage}[t]{0.55\\textwidth}
             \\centering
             \\textbf{ĐỀ KIỂM TRA ${formData.subject.toUpperCase()}} \\\\
             \\textbf{NĂM HỌC ${formData.academicYear}} \\\\
             \\textit{Thời gian làm bài: ${formData.duration}} \\\\
             \\textbf{Mã đề thi: ${formData.examCode}}
         \\end{minipage}
         
         \\vspace{0.5cm}
         \\noindent
         Họ và tên thí sinh: ........................................ Lớp: ....................
         \\vspace{0.5cm}

      2. Cấu trúc nội dung:
         - Sử dụng các gói: geometry, amsmath, amssymb, enumitem, tikz (nếu cần vẽ hình), multicol, array.
         - Các công thức toán học BẮT BUỘC nằm trong cặp dấu $...$ hoặc $$...$$.
         - Bao gồm 3 phần chính: 
           + Phần 1: "MA TRẬN ĐỀ" (Bảng mô tả mức độ nhận thức).
           + Phần 2: "NỘI DUNG ĐỀ THI".
           + Phần 3: "ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT" (ở cuối).

      3. Yêu cầu nội dung chi tiết:
         - Đề thi viết bằng Tiếng Việt.
         - KHÔNG giải thích thêm, chỉ xuất mã LaTeX thuần túy.
         - Output ONLY the LaTeX code.
      `;
  };

  // --- History Functions ---
  const saveToHistory = (
    latex: string,
    currentFormData: FormData,
    file?: File | null,
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      formData: { ...currentFormData }, // Copy object
      result: latex,
      fileName: file ? file.name : undefined,
    };

    const newHistory = [newItem, ...history].slice(0, 50); // Giới hạn 50 mục gần nhất
    setHistory(newHistory);
    localStorage.setItem("exam_history", JSON.stringify(newHistory));
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Tránh kích hoạt sự kiện click của dòng
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem("exam_history", JSON.stringify(newHistory));
  };

  const restoreHistory = (item: HistoryItem) => {
    setResult(item.result);
    setFormData(item.formData);
    // Nếu có file cũ thì ta không khôi phục được file object thực tế,
    // nhưng có thể hiển thị tên file hoặc reset về mode topic.
    // Ở đây ta ưu tiên hiển thị kết quả.
    setViewMode("preview");
    setShowHistory(false);
  };

  // --- Generation (CẬP NHẬT) ---
  // Case 2 & 3: Xử lý lỗi khi đang tạo và vô hiệu hóa nếu lỗi Quota
  const handleGenerate = async () => {
    if (!apiKey) return setError("Vui lòng nhập Gemini API Key.");
    if (connectionStatus === "error")
      return setError("Vui lòng đổi API Key khác trước khi tạo."); // Chặn nếu đang lỗi

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
    const maxRetries = 3;

    while (attempt < maxRetries && !success) {
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

        // Clean up markdown code blocks if Gemini adds them
        resultText = resultText
          .replace(/```latex/g, "")
          .replace(/```/g, "")
          .trim();
        setResult(resultText);

        // --- MỚI: LƯU VÀO LỊCH SỬ ---
        saveToHistory(resultText, formData, uploadedFile);

        success = true;
        console.log(resultText);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        const errorMsg = err.message || "";

        // --- XỬ LÝ LỖI QUOTA KHI ĐANG GENERATE ---
        if (errorMsg.includes("429") || errorMsg.includes("quota")) {
          const friendlyMsg = getFriendlyErrorMessage(err);
          setError(friendlyMsg);
          setConnectionStatus("error"); // Chuyển trạng thái sang lỗi để khóa nút Generate
          break; // Dừng ngay, không retry
        }

        // Retry logic cho lỗi quá tải (503)
        if (
          attempt < maxRetries &&
          (errorMsg.includes("503") || errorMsg.includes("overloaded"))
        ) {
          await sleep(2000);
        } else {
          // Các lỗi khác
          setError(getFriendlyErrorMessage(err));
          setConnectionStatus("error"); // Coi như kết nối hỏng nếu lỗi nặng
          break;
        }
      }
    }
    setLoading(false);
  };

  // --- Download Functions ---

  // 2. Download Word (Bản chuẩn: Fix lỗi TS + Hỗ trợ MathML & Table)
  const handleDownloadWord = () => {
    // Sử dụng 'result' (source LaTeX) thay vì 'previewRef' để đảm bảo định dạng
    if (!result) return;

    let html = result;

    // A. XỬ LÝ SƠ BỘ (Loại bỏ preamble)
    if (html.includes("\\begin{document}")) {
      html = html.split("\\begin{document}")[1];
      html = html.split("\\end{document}")[0];
    }

    // B. XỬ LÝ HEADER & MINIPAGE (Chuyển thành Bảng HTML)
    const minipageRegex =
      /\\begin{minipage}.*?{(.*?)\\textwidth}([\s\S]*?)\\end{minipage}\s*(&|\\hfill)?\s*\\begin{minipage}.*?{(.*?)\\textwidth}([\s\S]*?)\\end{minipage}/g;
    html = html.replace(
      minipageRegex,
      (match, w1, content1, sep, w2, content2) => {
        const clean1 = content1
          .replace(/\\centering/g, "")
          .replace(/\\rule{.*?}{.*?}/g, "<hr/>");
        const clean2 = content2
          .replace(/\\centering/g, "")
          .replace(/\\rule{.*?}{.*?}/g, "<hr/>");
        return `
        <table style="width:100%; border:none; margin-bottom: 20px;">
            <tr>
                <td style="width:${parseFloat(w1) * 100}%; vertical-align:top; text-align:center;">${clean1}</td>
                <td style="width:${parseFloat(w2) * 100}%; vertical-align:top; text-align:center;">${clean2}</td>
            </tr>
        </table>`;
      },
    );

    // C. XỬ LÝ BẢNG (TABULAR - Ma trận đề & Đáp án)
    // Chuyển đổi \begin{tabular} thành <table> HTML có viền cho Word
    html = html.replace(
      /\\begin{center}\s*\\begin{tabular}{.*?}([\s\S]*?)\\end{tabular}\s*\\end{center}|\\begin{tabular}{.*?}([\s\S]*?)\\end{tabular}/g,
      (match, c1, c2) => {
        const tableContent = c1 || c2;
        if (!tableContent) return match;

        // Xóa lệnh \hline và tách dòng
        const cleanContent = tableContent.replace(/\\hline/g, "");
        const rows = cleanContent
          .split("\\\\")
          .filter((r: string) => r.trim().length > 0);

        // Tạo bảng HTML với style inline (Word nhận style này)
        let tableHtml =
          '<table style="width:100%; border-collapse: collapse; border: 1px solid black; margin: 10px auto;">';

        rows.forEach((row: string) => {
          const cells = row.split("&");
          tableHtml += "<tr>";
          cells.forEach((cell: string) => {
            tableHtml += `<td style="border: 1px solid black; padding: 5px; text-align: center;">${cell.trim()}</td>`;
          });
          tableHtml += "</tr>";
        });

        tableHtml += "</table>";
        return tableHtml;
      },
    );

    // D. XỬ LÝ VĂN BẢN KHÁC (Cập nhật nhãn Năng lực số)
    html = html
      .replace(/\[\d+\.\d+\.TC[^\]]+\]/g, "<strong>[Năng lực số]</strong>") // Nhãn NLS
      .replace(
        /\\section\*?{(.*?)}/g,
        '<h3 style="font-size:16pt; font-weight:bold; color:#000; margin-top:20px; margin-bottom:10px;">$1</h3>',
      )
      .replace(
        /\\subsection\*?{(.*?)}/g,
        '<h4 style="font-size:14pt; font-weight:bold; color:#000; margin-top:15px; margin-bottom:5px;">$1</h4>',
      )
      .replace(/\\textbf{(.*?)}/g, "<strong>$1</strong>")
      .replace(/\\textit{(.*?)}/g, "<em>$1</em>")
      .replace(/\\underline{(.*?)}/g, "<u>$1</u>")
      .replace(/\\begin{enumerate}(\[.*?\])?/g, "<ol>")
      .replace(/\\end{enumerate}/g, "</ol>")
      .replace(/\\begin{itemize}(\[.*?\])?/g, "<ul>")
      .replace(/\\end{itemize}/g, "</ul>")
      .replace(/\\item\s/g, "<li>")
      .replace(/\\\\/g, "<br/>");

    // E. XỬ LÝ MATHML (Để công thức toán không bị lỗi ký tự lạ)
    html = html.replace(
      /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$)/g,
      (match) => {
        try {
          const isDisplay = match.startsWith("$$") || match.startsWith("\\[");
          const cleanMath = match
            .replace(/^\$\$|\$\$$/g, "")
            .replace(/^\\\[|\\\]$/g, "")
            .replace(/^\$|\$$/g, "");

          // Render MathML cho Word
          return katex.renderToString(cleanMath, {
            throwOnError: false,
            output: "mathml",
            displayMode: isDisplay,
          });
        } catch (e) {
          return match;
        }
      },
    );

    // F. TẠO FILE WORD VÀ TẢI VỀ
    const preHtml =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
    const postHtml = "</body></html>";
    const finalHtml = preHtml + html + postHtml;

    const blob = new Blob(["\ufeff", finalHtml], {
      type: "application/msword",
    });

    const url =
      "data:application/vnd.ms-word;charset=utf-8," +
      encodeURIComponent(finalHtml);

    // Create download link
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);

    // --- FIX LỖI TYPE SCRIPT TẠI ĐÂY ---
    // Ép kiểu (navigator as any) để TS không báo lỗi
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((navigator as any).msSaveOrOpenBlob) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).msSaveOrOpenBlob(
        blob,
        `De_Thi_${formData.examCode}.doc`,
      );
    } else {
      downloadLink.href = url;
      downloadLink.download = `De_Thi_${formData.examCode}.doc`;
      downloadLink.click();
    }

    document.body.removeChild(downloadLink);
    setShowDownloadMenu(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* MAIN CONTENT AREA */}
      <div
        className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarCollapsed ? "ml-16" : "ml-64"}`}
      >
        {/* GLOBAL HEADER (Fixed h-16) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between pl-4 pr-10 sticky top-0 z-40 shadow-sm flex-shrink-0">
          {/* Left: Toggle & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              {isSidebarCollapsed ? (
                <Menu className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
            <h1 className="font-bold text-lg text-indigo-900 uppercase tracking-wide hidden md:block">
              {MENU_ITEMS.find((i) => i.id === activeTab)?.label}
            </h1>
          </div>

          {/* Right: Global API Controls */}
          <div className="flex items-center gap-2">
            <ModelSelector
              value={formData.model}
              onChange={(newValue) =>
                setFormData((prev) => ({ ...prev, model: newValue }))
              }
              disabled={loading || checkingModel}
            />

            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${connectionStatus === "success" ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"} ${loading ? "opacity-50 pointer-events-none" : ""}`}
            >
              {connectionStatus === "success" ? (
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-xs font-bold text-emerald-700">
                    Đã kết nối
                  </span>
                  <button
                    onClick={handleResetKey}
                    disabled={loading}
                    className="text-[10px] bg-white text-emerald-700 border border-emerald-200 px-2 py-1 rounded font-bold whitespace-nowrap"
                  >
                    Đổi Key
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="password"
                    placeholder="Nhập API Key..."
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    disabled={loading}
                    onKeyDown={(e) => e.key === "Enter" && checkConnection()}
                    className="outline-none text-xs w-24 md:w-32 bg-transparent"
                  />
                  <button
                    onClick={() => checkConnection()}
                    disabled={checkingModel || !apiKey || loading}
                    className="flex items-center justify-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 transition-all whitespace-nowrap"
                  >
                    {checkingModel ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wifi className="w-3 h-3" />
                    )}
                    {checkingModel ? "Check..." : "Kết nối"}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT SCROLLABLE AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
          {/* TAB: TẠO ĐỀ THI */}
          {activeTab === "test-generator" && (
            <div className=" mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                      <h2 className="font-bold text-slate-800">
                        Cấu trúc đề thi
                      </h2>
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
                                const max =
                                  parseInt(formData.questionCount) || 0;
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
                            {(NLS_DATABASE[formData.academicYear] || []).map(
                              (c) => (
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
                              ),
                            )}
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
                              <FileType className="w-4 h-4 text-blue-600" />{" "}
                              Export Word
                            </button>
                            <div className="h-px bg-slate-100 my-0"></div>
                            <p className="px-4 py-2 text-[10px] text-slate-400">
                              Yêu cầu chuyển sang tab &quot;Xem trước&quot; để
                              tải.
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
                                  {item.formData.subject} -{" "}
                                  {item.formData.grade}
                                </h4>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">
                                    Mã: {item.formData.examCode}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock3 className="w-3 h-3" />{" "}
                                    {new Date(item.timestamp).toLocaleString(
                                      "vi-VN",
                                    )}
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
                              <RotateCcw className="w-3.5 h-3.5" /> Xem lại &
                              Tải xuống
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "lesson-plan" && (
            <FeaturePlaceholder title="Soạn Giáo Án" icon={FileSignature} />
          )}

          {activeTab === "class-management" && (
            <FeaturePlaceholder title="Quản Lý Lớp & Học Sinh" icon={Users} />
          )}

          {activeTab === "student-evaluation" && (
            <FeaturePlaceholder
              title="Đánh Giá & Xếp Loại"
              icon={GraduationCap}
            />
          )}

          {activeTab === "dashboard" && (
            <FeaturePlaceholder
              title="Tổng Quan & Thống Kê"
              icon={LayoutDashboard}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default TestGenerator;
