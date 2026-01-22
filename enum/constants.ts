// constants.ts
import { Competency } from "@/types/types";
import { 
  FileCode, 
  FileSignature, 
  Users, 
  GraduationCap, 
  LayoutDashboard 
} from "lucide-react";

export const NLS_DATABASE: Record<string, Competency[]> = {
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

export const SUBJECT_OPTIONS = [
  "Toán học", "Vật lý", "Hóa học", "Tin học",
  "Ngữ văn", "Lịch sử", "Địa lý", "Sinh học",
].map((s) => ({ value: s, label: s }));

export const DURATION_OPTIONS = [
  "15 phút", "45 phút", "60 phút", "90 phút", "120 phút",
].map((t) => ({ value: t, label: t }));

export const DIFFICULTY_OPTIONS = ["Cơ bản", "Trung bình", "Khó", "Nâng cao"].map(
  (d) => ({ value: d, label: d }),
);

export const QUESTION_TYPE_OPTIONS = [
  { value: "Trắc nghiệm", label: "1. Trắc nghiệm (100%)" },
  { value: "Tự luận", label: "2. Tự luận (100%)" },
  { value: "Hỗn hợp", label: "3. Hỗn hợp (TN + TL)" },
];

export const ACADEMIC_YEAR_OPTIONS = ["2025-2026", "2026-2027"].map((y) => ({
  value: y,
  label: y,
}));

export const MENU_ITEMS = [
  { id: "dashboard", label: "Tổng Quan", icon: LayoutDashboard, href: "/" },
  { id: "test-generator", label: "Tạo Đề Thi", icon: FileCode, href: "/test-generator" },
  { id: "lesson-plan", label: "Soạn Giáo Án", icon: FileSignature, href: "/lesson-plan" },
  { id: "class-management", label: "Quản Lý Lớp", icon: Users, href: "/class-management" },
  { id: "student-evaluation", label: "Đánh Giá HS", icon: GraduationCap, href: "/student-evaluation" },
];