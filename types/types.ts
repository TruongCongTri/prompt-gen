// types.ts

export interface FormData {
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

export interface Competency {
  code: string;
  label: string;
  desc: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  formData: FormData; // Lưu lại cấu hình để khôi phục context
  result: string; // Mã LaTeX
  fileName?: string; // Tên file nếu có
}