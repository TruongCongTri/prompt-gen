// components/LatexPreview.tsx
"use client";
import React, { useRef, useEffect } from "react";
import katex from "katex";
// import "katex/dist/katex.min.css"; // Ensure you have this imported globally or here

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

export default LatexPreview;