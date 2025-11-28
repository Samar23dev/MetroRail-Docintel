import {
  Building,
  Zap,
  Settings,
  Shield,
  FileText,
  Users,
  BarChart3,
  BookOpen,
} from "lucide-react";

export const departments = [
  {
    id: "all",
    name: "All Departments",
    icon: Building,
    color: "bg-slate-500",
  },
  { id: "operations", name: "Operations", icon: Zap, color: "bg-blue-500" },
  {
    id: "engineering",
    name: "Engineering",
    icon: Settings,
    color: "bg-green-500",
  },
  { id: "safety", name: "Safety", icon: Shield, color: "bg-red-500" },
  {
    id: "procurement",
    name: "Procurement",
    icon: FileText,
    color: "bg-purple-500",
  },
  { id: "hr", name: "Human Resources", icon: Users, color: "bg-orange-500" },
  {
    id: "finance",
    name: "Finance",
    icon: BarChart3,
    color: "bg-emerald-500",
  },
  {
    id: "environment",
    name: "Environment",
    icon: BookOpen,
    color: "bg-teal-500",
  },
];

export const docTypes = [
  "All Types",
  "Safety Circular",
  "Invoice",
  "Engineering Drawing",
  "Maintenance Report",
  "Policy",
  "Regulatory Directive",
  "Impact Study",
  "Board Minutes",
  "Training Material",
  "Incident Report",
];

export const API_BASE_URL = "http://localhost:5000/api";

export const popularSearchTerms = [
  "safety circular",
  "maintenance report",
  "vendor invoice",
  "regulatory directive",
  "phase 2 extension",
  "environmental impact",
];