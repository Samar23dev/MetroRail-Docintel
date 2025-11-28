import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Upload,
  Filter,
  Bell,
  User,
  Settings,
  FileText,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  Download,
  Eye,
  Tag,
  Calendar,
  Building,
  Zap,
  Shield,
  BookOpen,
  BarChart3,
  Mail,
  MessageSquare,
  Archive,
  ChevronRight,
  ChevronDown,
  Star,
  Loader2,
  Trash2,
  X,
  Printer, // Import for print functionality
} from "lucide-react";

// Chart.js imports
import { Bar, Line, Pie, Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

// --- Static configuration data ---
const departments = [
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

const docTypes = [
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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- Main App Component ---
const App = () => {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedDocType, setSelectedDocType] = useState("all-types");
  const [notifications, setNotifications] = useState(15);
  const [documents, setDocuments] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [tagsStats, setTagsStats] = useState([]);
  const [docTypesStats, setDocTypesStats] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [languageDistribution, setLanguageDistribution] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const fileInputRef = useRef(null);

  // --- Data Fetching from Backend ---
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedDepartment !== "all")
        params.append("department", selectedDepartment);
      if (selectedDocType !== "all-types")
        params.append("type", selectedDocType);

      const response = await fetch(
        `http://localhost:5000/api/documents?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDocuments(data.documents);
      setTotalDocuments(data.pagination.total);
    } catch (e) {
      console.error("Failed to fetch documents:", e);
      setError("Could not load documents. Please try again later.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDepartment, selectedDocType]);

  // --- Fetch Dashboard Statistics ---
  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [
        statsRes,
        deptRes,
        tagsRes,
        typesRes,
        statusRes,
        langRes,
        recentRes,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/dashboard/stats"),
        fetch("http://localhost:5000/api/dashboard/departments"),
        fetch("http://localhost:5000/api/dashboard/tags"),
        fetch("http://localhost:5000/api/dashboard/document-types"),
        fetch("http://localhost:5000/api/dashboard/status-distribution"),
        fetch("http://localhost:5000/api/dashboard/language-distribution"),
        fetch("http://localhost:5000/api/dashboard/recent-documents"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDashboardStats(statsData);
      }
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartmentStats(deptData.departments || []);
      }
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTagsStats(tagsData.tags || []);
      }
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setDocTypesStats(typesData.document_types || []);
      }
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatusDistribution(statusData.status_distribution || []);
      }
      if (langRes.ok) {
        const langData = await langRes.json();
        setLanguageDistribution(langData.language_distribution || []);
      }
      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentDocuments(recentData.recent_documents || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchDocuments();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [fetchDocuments]);

  useEffect(() => {
    fetchDashboardStats();
    const statsInterval = setInterval(fetchDashboardStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(statsInterval);
  }, [fetchDashboardStats]);

  // --- Helper Functions ---
  const getStatusColor = (status) => {
    switch (status) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "review":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "published":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // --- Event Handlers ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:5000/api/documents/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "File upload failed");
      }

      const newDocument = await response.json();
      alert(`Successfully uploaded and processed: ${newDocument.title}`);
      fetchDocuments(); // Refresh the document list
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(`File upload failed: ${error.message}`);
      alert(`File upload failed: ${error.message}`);
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "upload":
        fileInputRef.current?.click();
        break;
      case "search":
        setActiveTab("search");
        break;
      case "report":
        setActiveTab("analytics");
        break;
      case "alert":
        alert(
          "Alert feature: Set up notifications for specific document types or departments!"
        );
        break;
      default:
        break;
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this document?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/documents/${docId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete the document.");
      }

      setDocuments(documents.filter((doc) => doc._id !== docId));
      setTotalDocuments((prev) => prev - 1);
      alert("Document deleted successfully.");
    } catch (error) {
      console.error("Error deleting document:", error);
      alert(error.message);
    }
  };

  const handleViewDocument = (doc) => {
    setViewingDocument(doc); // Open the modal by setting the document
  };

  const handleDownloadDocument = async (doc) => {
    try {
      // Call backend download endpoint
      const response = await fetch(
        `http://localhost:5000/api/documents/${doc._id}/download`
      );

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and click it
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Successfully downloaded: ${doc.title}`);
    } catch (error) {
      console.error("Download error:", error);
      alert(`❌ Failed to download document: ${error.message}`);
    }
  };

  const handleStarDocument = async (docToUpdate) => {
    const newStarredState = !docToUpdate.starred;

    try {
      const response = await fetch(
        `http://localhost:5000/api/documents/${docToUpdate._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ starred: newStarredState }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update document.");
      }

      setDocuments((currentDocuments) =>
        currentDocuments.map((doc) =>
          doc._id === docToUpdate._id
            ? { ...doc, starred: newStarredState }
            : doc
        )
      );

      alert(
        `Document "${docToUpdate.title}" has been ${newStarredState ? "starred" : "unstarred"
        }`
      );
    } catch (error) {
      console.error("Error starring document:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // --- UI Components ---
  const DashboardContent = () => (
    <div className="space-y-8">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Documents Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border-l-4 border-blue-600 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                Total Documents
              </p>
              <p className="text-4xl font-bold text-blue-900 mt-2">
                {dashboardStats?.total_documents || 0}
              </p>
              <p className="text-xs text-blue-700 mt-2 font-medium">
                All documents in system
              </p>
            </div>
            <div className="bg-blue-600 p-4 rounded-full shadow-md">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Urgent Items Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border-l-4 border-red-600 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                Urgent Items
              </p>
              <p className="text-4xl font-bold text-red-900 mt-2">
                {dashboardStats?.urgent_items || 0}
              </p>
              <p className="text-xs text-red-700 mt-2 font-medium">
                Requires immediate attention
              </p>
            </div>
            <div className="bg-red-600 p-4 rounded-full shadow-md">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Today's Documents Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border-l-4 border-green-600 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">
                Today's Documents
              </p>
              <p className="text-4xl font-bold text-green-900 mt-2">
                {dashboardStats?.documents_today || 0}
              </p>
              <p className="text-xs text-green-700 mt-2 font-medium">
                Processed today
              </p>
            </div>
            <div className="bg-green-600 p-4 rounded-full shadow-md">
              <Calendar className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Approved Documents Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border-l-4 border-purple-600 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                Approved
              </p>
              <p className="text-4xl font-bold text-purple-900 mt-2">
                {dashboardStats?.approved_documents || 0}
              </p>
              <p className="text-xs text-purple-700 mt-2 font-medium">
                Ready for publication
              </p>
            </div>
            <div className="bg-purple-600 p-4 rounded-full shadow-md">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starred Documents */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Starred Documents
            </h3>
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {dashboardStats?.starred_documents || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Bookmarked for quick access
          </p>
        </div>

        {/* Processing Efficiency */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-cyan-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Processing Efficiency
            </h3>
            <TrendingUp className="h-6 w-6 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-cyan-600">
            {dashboardStats?.processing_efficiency || 0}%
          </p>
          <p className="text-sm text-gray-500 mt-2">Auto-processed documents</p>
        </div>

        {/* Avg Processing Time */}
        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Avg Processing Time
            </h3>
            <Clock className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {dashboardStats?.avg_processing_time || 0}h
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Average document processing
          </p>
        </div>
      </div>

      {/* Quick Actions & Department Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => handleQuickAction("upload")}
              className="w-full flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm text-blue-900 border border-blue-200">
              <Upload className="h-4 w-4" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => handleQuickAction("search")}
              className="w-full flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-medium text-sm text-green-900 border border-green-200">
              <Search className="h-4 w-4" />
              <span>Advanced Search</span>
            </button>
            <button
              onClick={() => handleQuickAction("report")}
              className="w-full flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors font-medium text-sm text-purple-900 border border-purple-200">
              <BarChart3 className="h-4 w-4" />
              <span>Generate Report</span>
            </button>
            <button
              onClick={() => handleQuickAction("alert")}
              className="w-full flex items-center space-x-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors font-medium text-sm text-orange-900 border border-orange-200">
              <Bell className="h-4 w-4" />
              <span>Set Alert</span>
            </button>
          </div>
        </div>

        {/* Department Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Building className="h-5 w-5 text-emerald-600" />
            Department Activity
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {departmentStats.length > 0 ? (
              departmentStats.map((dept) => (
                <div
                  key={dept.name}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-150 transition-all border border-gray-200">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="font-medium text-gray-900">
                      {dept.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {dept.total_docs}
                      </p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {dept.urgent_items}
                      </p>
                      <p className="text-xs text-gray-600">Urgent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {dept.approved_items}
                      </p>
                      <p className="text-xs text-gray-600">Approved</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No department data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Status Distribution
          </h3>
          <div className="space-y-4">
            {statusDistribution.length > 0 ? (
              statusDistribution.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item.status}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${item.status === "urgent"
                          ? "bg-red-600"
                          : item.status === "review"
                            ? "bg-yellow-600"
                            : item.status === "approved"
                              ? "bg-green-600"
                              : "bg-purple-600"
                        }`}
                      style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No status data available
              </p>
            )}
          </div>
        </div>

        {/* Top Tags */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Tag className="h-5 w-5 text-pink-600" />
            Top Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tagsStats.length > 0 ? (
              tagsStats.map((tag) => (
                <div
                  key={tag.tag}
                  className="px-4 py-2 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 rounded-full border-2 border-pink-300 hover:border-pink-500 transition-all cursor-pointer font-medium text-sm hover:shadow-md"
                  title={`${tag.count} documents`}>
                  #{tag.tag}
                  <span className="ml-2 text-xs bg-pink-200 px-2 py-0.5 rounded-full">
                    {tag.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 w-full">
                No tags available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Document Types & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Types */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Document Types
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {docTypesStats.length > 0 ? (
              docTypesStats.map((item, idx) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: [
                          "#3B82F6",
                          "#10B981",
                          "#F59E0B",
                          "#EF4444",
                          "#8B5CF6",
                          "#EC4899",
                        ][idx % 6],
                      }}></div>
                    <span className="font-medium text-gray-900 text-sm">
                      {item.type}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No document type data available
              </p>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Recent Documents
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentDocuments.length > 0 ? (
              recentDocuments.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => handleViewDocument(doc)}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border-l-4 border-blue-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {doc.department}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${doc.status === "urgent"
                          ? "bg-red-100 text-red-800"
                          : doc.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No recent documents
              </p>
            )}
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
      />
    </div>
  );

  const DocumentsContent = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {docTypes.map((type) => (
                <option
                  key={type}
                  value={type.toLowerCase().replace(/\s+/g, "-")}>
                  {type}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">
              Showing {documents.length} of {totalDocuments} documents
            </span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
            disabled={loading}>
            {loading && activeTab === "documents" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>{loading ? "Processing..." : "Upload Document"}</span>
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
        />
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="ml-4 text-gray-600">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600 bg-red-50 p-6 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">An Error Occurred</h3>
            <p>{error}</p>
          </div>
        ) : documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc._id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {doc.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        doc.status
                      )}`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{doc.summary}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>{doc.department}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{doc.type}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(doc.date).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{doc.language}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 cursor-pointer transition-colors"
                        onClick={() => setSearchQuery(tag)}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Source: {doc.source}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="View Document">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    title="Download Document">
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleStarDocument(doc)}
                    className={`p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 ${doc.starred ? "text-yellow-500" : ""
                      }`}
                    title="Star Document">
                    <Star
                      className="h-4 w-4"
                      fill={doc.starred ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Delete Document">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search criteria or uploading a new document.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const SearchContent = () => {
    const [semanticQuery, setSemanticQuery] = useState("");
    const [semanticResults, setSemanticResults] = useState([]);
    const [semanticLoading, setSemanticLoading] = useState(false);
    const [semanticError, setSemanticError] = useState(null);

    const handleSemanticSearch = async () => {
      if (!semanticQuery.trim()) {
        alert("Please enter a search query");
        return;
      }

      setSemanticLoading(true);
      setSemanticError(null);
      setSemanticResults([]);

      try {
        const response = await fetch(
          "http://localhost:5000/api/search/semantic",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: semanticQuery }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Search failed: ${response.status}`
          );
        }

        const data = await response.json();
        setSemanticResults(data.results || []);

        if (!data.results || data.results.length === 0) {
          setSemanticError(
            "No matching documents found. Try different search terms."
          );
        }
      } catch (error) {
        console.error("Semantic search error:", error);
        setSemanticError(
          error.message || "Failed to perform search. Please try again."
        );
      } finally {
        setSemanticLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Semantic Search Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Semantic Search
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Ask questions in natural language. Our AI will understand context
            and find relevant documents.
          </p>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g., 'What are the safety requirements for phase 2?' or 'Show me recent engineering reports'"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSemanticSearch()}
              />
            </div>
            <button
              onClick={handleSemanticSearch}
              disabled={semanticLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2">
              {semanticLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Semantic Search Results */}
          {semanticError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Search Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{semanticError}</p>
            </div>
          )}

          {semanticResults.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                Found {semanticResults.length} relevant document
                {semanticResults.length !== 1 ? "s" : ""}
              </h4>
              <div className="space-y-4">
                {semanticResults.map((result) => (
                  <div
                    key={result._id}
                    onClick={() => handleViewDocument(result)}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {result.title}
                      </h5>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex-shrink-0 ml-2">
                        {Math.round((result.similarity || 0) * 100)}% match
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 group-hover:text-gray-900 transition-colors">
                      {result.summary}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Building className="h-3 w-3" />
                        <span>{result.department}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{result.type}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(result.date).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {result.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200 group-hover:bg-blue-50 transition-colors">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Click to view full document
                      </span>
                      <Eye className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Traditional Search Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Traditional Search
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all documents, summaries, and metadata..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Languages</option>
                  <option>English</option>
                  <option>Malayalam</option>
                  <option>Bilingual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Priorities</option>
                  <option>Urgent</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("documents")}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              Search Documents
            </button>
          </div>
        </div>

        {/* Example Queries */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Example Semantic Queries
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              "What are the latest safety requirements?",
              "Show me maintenance reports from last month",
              "Find vendor invoices above 1 lakh",
              "Environmental impact studies for phase 2",
              "Recent regulatory directives",
              "HR policy updates",
            ].map((term) => (
              <button
                key={term}
                onClick={() => setSemanticQuery(term)}
                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-200">
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Keyword Search Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              "safety circular",
              "maintenance report",
              "vendor invoice",
              "regulatory directive",
              "phase 2 extension",
              "environmental impact",
            ].map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Recent Activity
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">
                Searched for "safety circular"
              </span>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">
                Filtered by Engineering department
              </span>
              <span className="text-xs text-gray-500">5 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AnalyticsContent = () => {
    const [chartsData, setChartsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
      const fetchChartsData = async () => {
        setAnalyticsLoading(true);
        try {
          const [statusRes, docTypesRes, deptRes, tagsRes] = await Promise.all([
            fetch("http://localhost:5000/api/dashboard/status-distribution"),
            fetch("http://localhost:5000/api/dashboard/document-types"),
            fetch("http://localhost:5000/api/dashboard/departments"),
            fetch("http://localhost:5000/api/dashboard/tags"),
          ]);

          let statusData = { status_distribution: [] };
          let typesData = { document_types: [] };
          let deptData = { departments: [] };
          let tagsData = { tags: [] };

          if (statusRes.ok) statusData = await statusRes.json();
          if (docTypesRes.ok) typesData = await docTypesRes.json();
          if (deptRes.ok) deptData = await deptRes.json();
          if (tagsRes.ok) tagsData = await tagsRes.json();

          setChartsData({
            status: statusData.status_distribution || [],
            types: typesData.document_types || [],
            departments: deptData.departments || [],
            tags: tagsData.tags || [],
          });
        } catch (err) {
          console.error("Error fetching analytics data:", err);
        } finally {
          setAnalyticsLoading(false);
        }
      };

      fetchChartsData();
    }, []);

    // Generate chart data for status distribution (Pie Chart)
    const getStatusChartData = () => {
      if (!chartsData?.status || chartsData.status.length === 0) return null;

      return {
        labels: chartsData.status.map(
          (s) => s.status.charAt(0).toUpperCase() + s.status.slice(1)
        ),
        datasets: [
          {
            data: chartsData.status.map((s) => s.count),
            backgroundColor: [
              "rgba(239, 68, 68, 0.8)",
              "rgba(251, 191, 36, 0.8)",
              "rgba(34, 197, 94, 0.8)",
            ],
            borderColor: ["#dc2626", "#d97706", "#16a34a"],
            borderWidth: 2,
          },
        ],
      };
    };

    // Generate chart data for document types (Bar Chart)
    const getTypesChartData = () => {
      if (!chartsData?.types || chartsData.types.length === 0) return null;

      const topTypes = chartsData.types.slice(0, 6);
      return {
        labels: topTypes.map((t) => t.type.substring(0, 12)),
        datasets: [
          {
            label: "Count",
            data: topTypes.map((t) => t.count),
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(34, 197, 94, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(168, 85, 247, 0.8)",
              "rgba(236, 72, 153, 0.8)",
              "rgba(20, 184, 166, 0.8)",
            ],
            borderColor: [
              "#1e40af",
              "#15803d",
              "#c2410c",
              "#6d28d9",
              "#be185d",
              "#0d9488",
            ],
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      };
    };

    // Generate chart data for departments (Bar Chart - Horizontal)
    const getDepartmentsChartData = () => {
      if (!chartsData?.departments || chartsData.departments.length === 0)
        return null;

      return {
        labels: chartsData.departments.map((d) => d.name),
        datasets: [
          {
            label: "Total",
            data: chartsData.departments.map((d) => d.total_docs),
            backgroundColor: "rgba(59, 130, 246, 0.8)",
            borderColor: "#1e40af",
            borderWidth: 2,
          },
          {
            label: "Urgent",
            data: chartsData.departments.map((d) => d.urgent_items),
            backgroundColor: "rgba(239, 68, 68, 0.8)",
            borderColor: "#dc2626",
            borderWidth: 2,
          },
          {
            label: "Approved",
            data: chartsData.departments.map((d) => d.approved_items),
            backgroundColor: "rgba(34, 197, 94, 0.8)",
            borderColor: "#16a34a",
            borderWidth: 2,
          },
        ],
      };
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 12 }, padding: 15 },
        },
      },
    };

    return (
      <div className="space-y-6">
        {analyticsLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="ml-4 text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Top Row - Status & Document Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution Pie Chart */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-rose-600" />
                  Status Distribution
                </h3>
                {getStatusChartData() ? (
                  <div className="h-64 flex items-center justify-center">
                    <Pie data={getStatusChartData()} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No status data available</p>
                  </div>
                )}
              </div>

              {/* Document Types Bar Chart */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  Document Types
                </h3>
                {getTypesChartData() ? (
                  <div className="h-64">
                    <Bar data={getTypesChartData()} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      No document type data available
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Row - Department Activity */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Building className="h-6 w-6 text-emerald-600" />
                Department Activity
              </h3>
              {getDepartmentsChartData() ? (
                <div className="h-80">
                  <Bar
                    data={getDepartmentsChartData()}
                    options={{
                      ...chartOptions,
                      indexAxis: "y",
                      scales: {
                        x: { stacked: false },
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No department data available</p>
                </div>
              )}
            </div>

            {/* Bottom Row - Processing Efficiency Stats */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-cyan-600" />
                Processing Efficiency Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border-2 border-green-300">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {dashboardStats?.processing_efficiency || 94.2}%
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    Auto-processed
                  </div>
                  <div className="text-xs text-green-600 mt-2">
                    ↗ 2.1% this week
                  </div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl border-2 border-blue-300">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {dashboardStats?.avg_processing_time || 2.3}h
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    Avg Processing Time
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    ↘ 15 min faster
                  </div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border-2 border-orange-300">
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    {(chartsData?.status.reduce((sum, s) => sum + s.count, 0) ||
                      0) > 0
                      ? Math.round(
                        ((chartsData.status.find(
                          (s) => s.status === "approved"
                        )?.count || 0) /
                          (chartsData.status.reduce(
                            (sum, s) => sum + s.count,
                            0
                          ) || 1)) *
                        100
                      )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    Approval Rate
                  </div>
                  <div className="text-xs text-orange-600 mt-2">
                    Target: 90%
                  </div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl border-2 border-purple-300">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {chartsData?.tags?.length || 0}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    Unique Tags
                  </div>
                  <div className="text-xs text-purple-600 mt-2">
                    Used in documents
                  </div>
                </div>
              </div>
            </div>

            {/* Top Tags Section */}
            {chartsData?.tags && chartsData.tags.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Tag className="h-6 w-6 text-pink-600" />
                  Top Tags
                </h3>
                <div className="flex flex-wrap gap-3">
                  {chartsData.tags.slice(0, 10).map((tag) => (
                    <div
                      key={tag.tag}
                      className="px-4 py-2 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 rounded-full border-2 border-pink-300 font-medium text-sm shadow-sm hover:shadow-md transition-all">
                      #{tag.tag}
                      <span className="ml-2 font-bold">{tag.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    KMRL DocIntel
                  </h1>
                  <p className="text-xs text-gray-500">
                    Document Intelligence System
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="pl-9 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  Admin User
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:space-x-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 mb-8 md:mb-0">
            <nav className="space-y-2">
              {[
                { id: "dashboard", name: "Dashboard", icon: BarChart3 },
                { id: "documents", name: "Documents", icon: FileText },
                { id: "search", name: "Search", icon: Search },
                { id: "analytics", name: "Analytics", icon: TrendingUp },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                    }`}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">
                Today's Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">New Documents</span>
                  <span className="font-medium text-gray-900">47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed</span>
                  <span className="font-medium text-green-600">42</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-orange-600">5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgent</span>
                  <span className="font-medium text-red-600">3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === "dashboard" && <DashboardContent />}
            {activeTab === "documents" && <DocumentsContent />}
            {activeTab === "search" && <SearchContent />}
            {activeTab === "analytics" && <AnalyticsContent />}
          </main>
        </div>
      </div>

      {/* --- [UPDATED] Document View Modal --- */}
      {viewingDocument && (
        <DocumentViewModal
          doc={viewingDocument}
          onClose={() => setViewingDocument(null)}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
};

// --- [UPDATED] Modal Component - COMPREHENSIVE VERSION ---
const DocumentViewModal = ({ doc, onClose, getStatusColor }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [expandedTableIndex, setExpandedTableIndex] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("summary");
  const viewerUrl = React.useMemo(() => {
    if (doc?.file_url) {
      return `${API_BASE_URL}${doc.file_url}`;
    }
    if (doc?._id) {
      return `${API_BASE_URL}/api/documents/${doc._id}/file`;
    }
    return null;
  }, [doc]);
  const isImagePreview = doc?.file_mime?.startsWith("image/");

  const tabs = [
    { id: "summary", label: "Summary", icon: FileText },
    { id: "charts", label: "Charts", icon: BarChart3 },
    { id: "tables", label: "Tables", icon: BookOpen },
    { id: "details", label: "Details", icon: Shield },
  ];

  const headerColors = [
    { bg: "bg-blue-600", text: "text-white", light: "bg-blue-50" },
    { bg: "bg-emerald-600", text: "text-white", light: "bg-emerald-50" },
    { bg: "bg-purple-600", text: "text-white", light: "bg-purple-50" },
    { bg: "bg-rose-600", text: "text-white", light: "bg-rose-50" },
    { bg: "bg-orange-600", text: "text-white", light: "bg-orange-50" },
    { bg: "bg-cyan-600", text: "text-white", light: "bg-cyan-50" },
  ];

  const getHeaderColor = (index) => headerColors[index % headerColors.length];

  const generateChartData = (chart) => {
    if (!chart || !chart.data_points) return null;

    const labels = chart.data_points.map((p) => p.label || "N/A");
    const values = chart.data_points.map((p) => {
      const val = p.value;
      if (typeof val === "number") return val;
      const str = String(val)
        .replace(/[^\d.,-]/g, "")
        .replace(/,/g, "");
      return parseFloat(str) || 0;
    });

    const colors = {
      bar: { bg: "rgba(59, 130, 246, 0.7)", border: "rgb(59, 130, 246)" },
      line: { bg: "rgba(34, 197, 94, 0.1)", border: "rgb(34, 197, 94)" },
      pie: [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#14B8A6",
        "#F97316",
      ],
      area: { bg: "rgba(168, 85, 247, 0.2)", border: "rgb(168, 85, 247)" },
    };

    switch (chart.chart_type) {
      case "bar":
        return {
          labels,
          datasets: [
            {
              label: chart.title,
              data: values,
              backgroundColor: colors.bar.bg,
              borderColor: colors.bar.border,
              borderWidth: 2,
              borderRadius: 8,
              tension: 0.1,
            },
          ],
        };
      case "line":
        return {
          labels,
          datasets: [
            {
              label: chart.title,
              data: values,
              borderColor: colors.line.border,
              backgroundColor: colors.line.bg,
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: colors.line.border,
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
            },
          ],
        };
      case "pie":
        return {
          labels,
          datasets: [
            {
              label: chart.title,
              data: values,
              backgroundColor: colors.pie.slice(0, labels.length),
              borderColor: "#fff",
              borderWidth: 2,
            },
          ],
        };
      case "area":
        return {
          labels,
          datasets: [
            {
              label: chart.title,
              data: values,
              fill: true,
              backgroundColor: colors.area.bg,
              borderColor: colors.area.border,
              borderWidth: 3,
              tension: 0.4,
              pointRadius: 4,
              pointBackgroundColor: colors.area.border,
            },
          ],
        };
      default:
        return null;
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: { font: { size: 12 }, padding: 15 },
      },
    },
  };

  const handleDownloadWithLoading = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/documents/${doc._id}/download`
      );

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert(`❌ Failed to download: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-300 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-md flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {doc.title}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {doc.summary?.substring(0, 80)}...
                  </p>
                </div>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="px-2 py-1 bg-white rounded border border-gray-200 font-medium">
                  {doc.department}
                </span>
                <span className="px-2 py-1 bg-white rounded border border-gray-200 font-medium">
                  {doc.type}
                </span>
                <span
                  className={`px-2 py-1 text-white rounded font-semibold ${doc.status === "urgent"
                      ? "bg-red-600"
                      : doc.status === "approved"
                        ? "bg-green-600"
                        : "bg-yellow-600"
                    }`}>
                  {doc.status.toUpperCase()}
                </span>
                <span className="px-2 py-1 bg-white rounded border border-gray-200 text-xs">
                  {new Date(doc.date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all flex-shrink-0">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* ===== TAB NAVIGATION ===== */}
        <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2 sm:gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                    ? "bg-blue-100 text-blue-700 border-b-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}>
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== CONTENT AREA ===== */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  {/* Main Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5 text-blue-600" />
                      AI-Generated Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{doc.summary}</p>
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-pink-600" />
                        Keywords & Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-4 py-2 bg-pink-100 text-pink-700 text-sm font-medium rounded-full border border-pink-300 hover:bg-pink-200 transition-colors">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Figures */}
                  {doc.figures_data && doc.figures_data.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4">
                        Key Figures & Metrics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doc.figures_data.map((fig, idx) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border-2 border-orange-200">
                            <p className="text-sm text-gray-600 mb-2">
                              {fig.description}
                            </p>
                            <p className="text-3xl font-bold text-orange-600">
                              {fig.values?.[0] || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                              Type: {fig.type}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 flex flex-col min-h-[24rem]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Original Document Preview
                    </h3>
                    {viewerUrl && (
                      <button
                        onClick={() => window.open(viewerUrl, "_blank", "noopener")}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Open in new tab
                      </button>
                    )}
                  </div>
                  <div className="flex-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {viewerUrl ? (
                      isImagePreview ? (
                        <img
                          src={viewerUrl}
                          alt="Original document preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <iframe
                          title="Document preview"
                          src={`${viewerUrl}#toolbar=0&navpanes=0`}
                          className="w-full h-full bg-white"
                        />
                      )
                    ) : (
                      <p className="text-sm text-gray-500 text-center px-4">
                        Original file preview unavailable for this document.
                      </p>
                    )}
                  </div>
                  {viewerUrl && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={viewerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                        View Full Document
                      </a>
                      <a
                        href={viewerUrl}
                        download={doc.file_name || "document.pdf"}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                        Download Original
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Charts Tab */}
            {activeTab === "charts" && (
              <div className="space-y-8">
                {doc.charts && doc.charts.length > 0 ? (
                  doc.charts.map((chart, idx) => {
                    const chartData = generateChartData(chart);
                    if (!chartData) return null;

                    return (
                      <div
                        key={idx}
                        className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {chart.title}
                            </h3>
                            {chart.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {chart.description}
                              </p>
                            )}
                          </div>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                            {chart.chart_type.toUpperCase()}
                          </span>
                        </div>

                        <div className="h-80 mb-6">
                          {chart.chart_type === "bar" && (
                            <Bar data={chartData} options={chartOptions} />
                          )}
                          {chart.chart_type === "line" && (
                            <Line data={chartData} options={chartOptions} />
                          )}
                          {chart.chart_type === "pie" && (
                            <div className="flex justify-center">
                              <div className="w-80 h-80">
                                <Pie data={chartData} options={chartOptions} />
                              </div>
                            </div>
                          )}
                          {chart.chart_type === "area" && (
                            <Line data={chartData} options={chartOptions} />
                          )}
                        </div>

                        {/* Data Points Table */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">
                            Data Points
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b-2 border-gray-300">
                                  <th className="text-left py-2 px-3 font-semibold text-gray-700">
                                    Label
                                  </th>
                                  <th className="text-right py-2 px-3 font-semibold text-gray-700">
                                    Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {chart.data_points.map((point, pidx) => (
                                  <tr
                                    key={pidx}
                                    className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-900">
                                      {point.label}
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold text-blue-600">
                                      {point.value}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p>No charts available for this document</p>
                  </div>
                )}
              </div>
            )}

            {/* Tables Tab */}
            {activeTab === "tables" && (
              <div className="space-y-8">
                {doc.tables_data && doc.tables_data.length > 0 ? (
                  doc.tables_data.map((tableObj, tableIdx) => {
                    if (!tableObj?.data || tableObj.data.length === 0)
                      return null;

                    const tableData = tableObj.data;
                    const headerRow = tableData[0];
                    const dataRows = tableData.slice(1);
                    const headerColor = getHeaderColor(tableIdx);
                    const isExpanded =
                      expandedTableIndex === tableIdx || dataRows.length <= 5;

                    return (
                      <div
                        key={tableIdx}
                        className="border-2 border-gray-300 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                        {/* Table Caption */}
                        <div
                          className={`${headerColor.bg} ${headerColor.text} border-b-2 border-gray-300 px-6 py-4`}>
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-bold">
                              📋 {tableObj.caption || `Table ${tableIdx + 1}`}
                            </h4>
                            {dataRows.length > 5 && (
                              <button
                                onClick={() =>
                                  setExpandedTableIndex(
                                    expandedTableIndex === tableIdx
                                      ? null
                                      : tableIdx
                                  )
                                }
                                className={`p-2 rounded-lg ${headerColor.light} text-gray-700 hover:opacity-80 transition-all`}
                                title={isExpanded ? "Collapse" : "Expand"}>
                                <ChevronDown
                                  className={`h-5 w-5 transform transition-transform ${isExpanded ? "rotate-180" : ""
                                    }`}
                                />
                              </button>
                            )}
                          </div>
                          <p className="text-sm opacity-90 mt-1">
                            📊 {dataRows.length} row
                            {dataRows.length !== 1 ? "s" : ""} •{" "}
                            {headerRow.length} column
                            {headerRow.length !== 1 ? "s" : ""}
                          </p>
                        </div>

                        {/* Table Content */}
                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr
                                  className={`${headerColor.bg} divide-x divide-gray-300`}>
                                  {headerRow.map((headerCell, cellIdx) => (
                                    <th
                                      key={cellIdx}
                                      className={`${headerColor.text} px-4 py-3 text-left text-xs font-bold uppercase tracking-wider`}>
                                      {headerCell}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {dataRows.map((row, rowIdx) => (
                                  <tr
                                    key={rowIdx}
                                    className={`hover:${headerColor.light
                                      } transition-colors divide-x divide-gray-200 ${rowIdx % 2 === 0
                                        ? "bg-white"
                                        : "bg-gray-50"
                                      }`}>
                                    {row.map((cell, cellIdx) => (
                                      <td
                                        key={cellIdx}
                                        className="px-4 py-3 text-sm text-gray-700 font-medium">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {!isExpanded && dataRows.length > 5 && (
                          <div
                            className={`${headerColor.light} px-6 py-4 text-center text-sm text-gray-600 font-medium`}>
                            Click expand to view {dataRows.length} rows
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p>No tables available for this document</p>
                  </div>
                )}
              </div>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-300">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                      Department
                    </p>
                    <p className="text-lg text-blue-900 font-bold mt-2">
                      {doc.department}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-300">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wide">
                      Document Type
                    </p>
                    <p className="text-lg text-green-900 font-bold mt-2">
                      {doc.type}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-300">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                      Status
                    </p>
                    <p className="text-lg text-purple-900 font-bold mt-2">
                      {doc.status}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border-2 border-orange-300">
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">
                      Language
                    </p>
                    <p className="text-lg text-orange-900 font-bold mt-2">
                      {doc.language}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg border-2 border-rose-300">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                      Source
                    </p>
                    <p className="text-lg text-rose-900 font-bold mt-2">
                      {doc.source}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg border-2 border-cyan-300">
                    <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide">
                      Date Created
                    </p>
                    <p className="text-lg text-cyan-900 font-bold mt-2">
                      {new Date(doc.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                    Document ID
                  </p>
                  <p className="text-xs text-gray-600 font-mono break-all bg-white p-3 rounded border border-gray-300">
                    {doc._id}
                  </p>
                </div>

                {doc.content && (
                  <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                      Full Extracted Content
                    </p>
                    <pre className="text-xs text-gray-700 bg-white p-4 rounded border border-gray-300 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono break-words">
                      {doc.content.substring(0, 1500)}
                      {doc.content.length > 1500 ? "..." : ""}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== ACTION FOOTER ===== */}
        <div className="border-t border-gray-300 bg-gray-50 p-4 flex-shrink-0 flex gap-2 justify-end flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleDownloadWithLoading}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all">
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-all">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
