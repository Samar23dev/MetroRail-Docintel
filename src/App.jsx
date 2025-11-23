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
  const [viewingDocument, setViewingDocument] = useState(null); // State for modal

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

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchDocuments();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [fetchDocuments]);

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
        alert("Alert feature: Set up notifications for specific document types or departments!");
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
      setTotalDocuments(prev => prev - 1);
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
      const response = await fetch(`http://localhost:5000/api/documents/${doc._id}/download`);

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and click it
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title.replace(/\s+/g, '_')}_${doc._id}.txt`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Successfully downloaded: ${doc.title}`);
    } catch (error) {
      console.error('Download error:', error);
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
        throw new Error("Failed to update document.");
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
        }!`
      );
    } catch (error) {
      console.error("Error starring document:", error);
      alert(error.message);
    }
  };

  // --- UI Components ---
  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Documents Today
              </p>
              <p className="text-3xl font-bold text-gray-900">247</p>
              <p className="text-sm text-green-600">↗ 12% from yesterday</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgent Items</p>
              <p className="text-3xl font-bold text-red-600">8</p>
              <p className="text-sm text-red-600">Requires attention</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg Processing Time
              </p>
              <p className="text-3xl font-bold text-gray-900">2.3h</p>
              <p className="text-sm text-green-600">↘ 15% improvement</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">156</p>
              <p className="text-sm text-blue-600">Across 8 departments</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleQuickAction("upload")}
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Upload className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Upload Document
            </span>
          </button>
          <button
            onClick={() => handleQuickAction("search")}
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <Search className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Advanced Search
            </span>
          </button>
          <button
            onClick={() => handleQuickAction("report")}
            className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Generate Report
            </span>
          </button>
          <button
            onClick={() => handleQuickAction("alert")}
            className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <Bell className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">
              Set Alert
            </span>
          </button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.txt"
      />

      {/* Department Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Department Activity
        </h3>
        <div className="space-y-4">
          {departments.slice(1).map((dept) => (
            <div
              key={dept.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`${dept.color} p-2 rounded-lg`}>
                  <dept.icon className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-gray-900">{dept.name}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{Math.floor(Math.random() * 50) + 10} docs</span>
                <span className="text-red-600">
                  {Math.floor(Math.random() * 5) + 1} urgent
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {docTypes.map((type) => (
                <option
                  key={type}
                  value={type.toLowerCase().replace(/\s+/g, "-")}
                >
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
            disabled={loading}
          >
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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.txt"
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
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {doc.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        doc.status
                      )}`}
                    >
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
                        onClick={() => setSearchQuery(tag)}
                      >
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
                    title="View Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleStarDocument(doc)}
                    className={`p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 ${doc.starred ? "text-yellow-500" : ""
                      }`}
                    title="Star Document"
                  >
                    <Star
                      className="h-4 w-4"
                      fill={doc.starred ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Delete Document"
                  >
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
        const response = await fetch("http://localhost:5000/api/search/semantic", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: semanticQuery }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Search failed: ${response.status}`);
        }

        const data = await response.json();
        setSemanticResults(data.results || []);

        if (!data.results || data.results.length === 0) {
          setSemanticError("No matching documents found. Try different search terms.");
        }
      } catch (error) {
        console.error("Semantic search error:", error);
        setSemanticError(error.message || "Failed to perform search. Please try again.");
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
            Ask questions in natural language. Our AI will understand context and find relevant documents.
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
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
                Found {semanticResults.length} relevant document{semanticResults.length !== 1 ? "s" : ""}
              </h4>
              <div className="space-y-4">
                {semanticResults.map((result) => (
                  <div
                    key={result._id}
                    onClick={() => handleViewDocument(result)}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{result.title}</h5>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex-shrink-0 ml-2">
                        {Math.round((result.similarity || 0) * 100)}% match
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 group-hover:text-gray-900 transition-colors">{result.summary}</p>
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
                        <span>{new Date(result.date).toLocaleDateString()}</span>
                      </span>
                    </div>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {result.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-white text-gray-700 text-xs rounded-md border border-gray-200 group-hover:bg-blue-50 transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Click to view full document</span>
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
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
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
                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-200"
              >
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
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
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

  const AnalyticsContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Document Volume Trends
          </h3>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-dashed border-blue-200">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-600">
                Chart: Document processing volume over time
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Integration with charting library needed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Department Distribution
          </h3>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border-2 border-dashed border-green-200">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-green-400 mx-auto mb-2" />
              <p className="text-gray-600">Chart: Documents by department</p>
              <p className="text-sm text-gray-500 mt-1">
                Pie/Bar chart visualization
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Processing Efficiency
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
            <div className="text-sm text-gray-600">Auto-processed</div>
            <div className="text-xs text-green-600 mt-1">↗ 2.1% this week</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">2.3h</div>
            <div className="text-sm text-gray-600">Avg. Processing Time</div>
            <div className="text-xs text-blue-600 mt-1">↘ 15 min faster</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">85%</div>
            <div className="text-sm text-gray-600">Compliance Rate</div>
            <div className="text-xs text-orange-600 mt-1">Target: 90%</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">12</div>
            <div className="text-sm text-gray-600">Languages Detected</div>
            <div className="text-xs text-purple-600 mt-1">ML/EN primary</div>
          </div>
        </div>
      </div>
    </div>
  );

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
                    }`}
                >
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

// --- [UPDATED] Modal Component ---
const DocumentViewModal = ({ doc, onClose, getStatusColor }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [expandedTableIndex, setExpandedTableIndex] = React.useState(null);

  // Color schemes for table headers - rotates through different colors
  const headerColors = [
    { bg: "bg-blue-600", text: "text-white", light: "bg-blue-50" },
    { bg: "bg-emerald-600", text: "text-white", light: "bg-emerald-50" },
    { bg: "bg-purple-600", text: "text-white", light: "bg-purple-50" },
    { bg: "bg-rose-600", text: "text-white", light: "bg-rose-50" },
    { bg: "bg-orange-600", text: "text-white", light: "bg-orange-50" },
    { bg: "bg-cyan-600", text: "text-white", light: "bg-cyan-50" },
  ];

  const getHeaderColor = (index) => headerColors[index % headerColors.length];

  // Helper function to parse numeric values from strings like "₹25 Cr", "1.2M", "95%"
  const parseNumericValue = (value) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const str = String(value).trim();

    // Extract numeric part
    let numericPart = str.replace(/[^\d.,-]/g, '').replace(/,/g, '');
    if (!numericPart) return 0;

    let num = parseFloat(numericPart) || 0;

    // Handle multipliers (M, Cr, K, B, Lakhs)
    if (str.includes('M') || str.includes('m')) num *= 1000000;
    else if (str.includes('Cr')) num *= 10000000;
    else if (str.includes('K') || str.includes('k')) num *= 1000;
    else if (str.includes('B') || str.includes('b')) num *= 1000000000;
    else if (str.includes('Lakhs') || str.includes('lakhs')) num *= 100000;

    return Math.round(num * 100) / 100;
  };

  // Generate chart data object for Chart.js
  const generateChartData = (chart) => {
    if (!chart || !chart.data_points) return null;

    const labels = chart.data_points.map(p => p.label || 'N/A');
    const values = chart.data_points.map(p => parseNumericValue(p.value));

    const colors = {
      bar: { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgb(59, 130, 246)' },
      line: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgb(34, 197, 94)' },
      pie: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
      area: { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgb(168, 85, 247)' }
    };

    switch (chart.chart_type) {
      case 'bar':
        return {
          labels,
          datasets: [{
            label: chart.title,
            data: values,
            backgroundColor: colors.bar.bg,
            borderColor: colors.bar.border,
            borderWidth: 2,
            borderRadius: 8,
            tension: 0.1
          }]
        };
      case 'line':
        return {
          labels,
          datasets: [{
            label: chart.title,
            data: values,
            borderColor: colors.line.border,
            backgroundColor: colors.line.bg,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: colors.line.border,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          }]
        };
      case 'pie':
        return {
          labels,
          datasets: [{
            label: chart.title,
            data: values,
            backgroundColor: colors.pie.slice(0, labels.length),
            borderColor: '#fff',
            borderWidth: 2
          }]
        };
      case 'area':
        return {
          labels,
          datasets: [{
            label: chart.title,
            data: values,
            fill: true,
            backgroundColor: colors.area.bg,
            borderColor: colors.area.border,
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: colors.area.border
          }]
        };
      default:
        return null;
    }
  };

  const handleDownloadWithLoading = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${doc._id}/download`);

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title.replace(/\s+/g, '_')}_${doc._id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(`❌ Failed to download: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `Check out this document: ${doc.title}`;
    if (navigator.share) {
      navigator.share({
        title: doc.title,
        text: text,
      });
    } else {
      alert(`Document: ${doc.title}\nDepartment: ${doc.department}\nType: ${doc.type}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[98vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== ENHANCED HEADER ===== */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-300 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-600 text-white rounded-lg shadow-md">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{doc.title}</h2>
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mt-2">
                <span className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{doc.department}</span>
                </span>
                <span className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{doc.type}</span>
                </span>
                <span className="flex items-center space-x-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">{new Date(doc.date).toLocaleDateString()}</span>
                </span>
                <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusColor(doc.status)}`}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200 flex-shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* ===== SCROLLABLE CONTENT - SPLIT VIEW ===== */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 sm:p-8 space-y-8">
            {/* AI Summary Section - Full Width */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-5 sm:p-6 rounded-xl shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-base sm:text-lg">
                <Zap className="h-5 w-5 text-blue-600" />
                AI-Generated Summary
              </h4>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{doc.summary}</p>
            </div>

            {/* SPLIT VIEW: Charts (Left) vs Tables (Right) */}
            {(doc.charts?.length > 0 || doc.tables_data?.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT PANEL: Charts & Visualizations */}
                {doc.charts && doc.charts.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-gray-900 text-lg sm:text-xl flex items-center gap-2">
                      <BarChart3 className="h-6 w-6 text-rose-600" />
                      Charts & Visualizations
                    </h3>
                    <div className="space-y-8">
                      {doc.charts.map((chart, idx) => {
                        if (!chart || !chart.title || !chart.data_points) return null;
                        const chartData = generateChartData(chart);
                        if (!chartData) return null;

                        const chartOptions = {
                          responsive: true,
                          maintainAspectRatio: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: { font: { size: 12 }, padding: 15 }
                            }
                          }
                        };

                        return (
                          <div
                            key={idx}
                            className="bg-white p-5 rounded-lg border-2 border-rose-200 hover:border-rose-400 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-bold text-gray-900">{chart.title}</h5>
                              <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg">
                                {chart.chart_type.charAt(0).toUpperCase() + chart.chart_type.slice(1)}
                              </span>
                            </div>

                            {/* Chart Rendering */}
                            <div className="h-64 w-full flex items-center justify-center">
                              {chart.chart_type === 'bar' && (
                                <Bar data={chartData} options={chartOptions} />
                              )}
                              {chart.chart_type === 'line' && (
                                <Line data={chartData} options={chartOptions} />
                              )}
                              {chart.chart_type === 'pie' && (
                                <div className="w-64 h-64">
                                  <Pie data={chartData} options={chartOptions} />
                                </div>
                              )}
                              {chart.chart_type === 'area' && (
                                <Line data={chartData} options={chartOptions} />
                              )}
                            </div>

                            {/* Data Points Table */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Data Points:</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {chart.data_points.map((point, pIdx) => (
                                  <div key={pIdx} className="flex justify-between text-xs text-gray-700">
                                    <span className="font-medium">{point.label}</span>
                                    <span className="text-rose-600 font-bold">{point.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* RIGHT PANEL: Key Figures & Tables */}
                <div className="space-y-6">
                  {/* Key Figures & Metrics */}
                  {doc.figures_data && doc.figures_data.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg sm:text-xl flex items-center gap-2 mb-4">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                        Key Figures & Metrics
                      </h3>
                      <div className="space-y-3">
                        {doc.figures_data.map((figure, idx) => {
                          if (!figure || !figure.description) return null;

                          const getIcon = (type) => {
                            switch (type) {
                              case 'percentage': return '📊';
                              case 'currency': return '�';
                              case 'metric': return '📏';
                              case 'ratio': return '⚖️';
                              case 'number':
                              default: return '�';
                            }
                          };

                          const figureValue = figure.values && figure.values.length > 0
                            ? figure.values[0]
                            : 'N/A';

                          return (
                            <div
                              key={idx}
                              className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {figure.type}
                                  </p>
                                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                    {figure.description}
                                  </p>
                                </div>
                                <div className="text-2xl flex-shrink-0">
                                  {getIcon(figure.type)}
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-lg font-bold text-orange-600">
                                  {figureValue}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tables Summary */}
                  {doc.tables_data && doc.tables_data.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg sm:text-xl flex items-center gap-2 mb-4">
                        <BarChart3 className="h-6 w-6 text-emerald-600" />
                        Tables Summary
                      </h3>
                      <div className="space-y-3">
                        {doc.tables_data.map((tableObject, idx) => {
                          if (!tableObject || !tableObject.data || tableObject.data.length === 0) return null;
                          const rows = tableObject.data.length - 1;
                          const cols = tableObject.data[0]?.length || 0;
                          return (
                            <div key={idx} className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-lg border-2 border-emerald-200 hover:border-emerald-400 transition-colors">
                              <p className="font-medium text-gray-900 text-sm">
                                {tableObject.caption || `Table ${idx + 1}`}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                📊 {rows} row{rows !== 1 ? 's' : ''} × {cols} column{cols !== 1 ? 's' : ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Tables - Full Width */}
            {doc.tables_data && doc.tables_data.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-6 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                  Detailed Tabular Data
                </h3>
                <div className="space-y-8">
                  {doc.tables_data.map((tableObject, tableIndex) => {
                    if (!tableObject || !tableObject.data || tableObject.data.length === 0) {
                      return null;
                    }

                    const tableData = tableObject.data;
                    const headerRow = tableData[0];
                    const dataRows = tableData.slice(1);
                    const headerColor = getHeaderColor(tableIndex);
                    const isExpanded = expandedTableIndex === tableIndex;

                    return (
                      <div
                        key={tableIndex}
                        className="border-2 border-gray-300 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
                      >
                        {/* Table Caption */}
                        <div className={`${headerColor.bg} ${headerColor.text} border-b-2 border-gray-300 px-6 py-4`}>
                          <div className="flex items-center justify-between">
                            <h5 className="text-lg font-bold">
                              📋 {tableObject.caption || `Table ${tableIndex + 1}`}
                            </h5>
                            <button
                              onClick={() => setExpandedTableIndex(isExpanded ? null : tableIndex)}
                              className={`p-2 rounded-lg ${headerColor.light} text-gray-700 hover:opacity-80 transition-all`}
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              <ChevronDown className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                          <p className="text-sm opacity-90 mt-1">
                            📊 {dataRows.length} row{dataRows.length !== 1 ? 's' : ''} • {headerRow.length} column{headerRow.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Table Content */}
                        {(isExpanded || tableIndex === 0) && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className={`${headerColor.bg} divide-x divide-gray-300`}>
                                  {headerRow.map((headerCell, cellIndex) => (
                                    <th
                                      key={cellIndex}
                                      scope="col"
                                      className={`${headerColor.text} px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold uppercase tracking-wider`}
                                    >
                                      {headerCell}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {dataRows.map((row, rowIndex) => (
                                  <tr
                                    key={rowIndex}
                                    className={`hover:${headerColor.light} transition-colors divide-x divide-gray-200 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                      }`}
                                  >
                                    {row.map((cell, cellIndex) => (
                                      <td
                                        key={cellIndex}
                                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-700 font-medium"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Collapsed view hint */}
                        {!isExpanded && tableIndex !== 0 && (
                          <div className={`${headerColor.light} px-6 py-4 text-center text-sm text-gray-600 font-medium`}>
                            Click expand button to view table
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full Content Section */}
            {doc.content ? (
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg sm:text-xl">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                  Full Extracted Text
                </h4>
                <pre className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 sm:p-6 rounded-xl border-2 border-gray-300 max-h-96 overflow-y-auto whitespace-pre-wrap font-mono">
                  {doc.content}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
                <p className="text-gray-500 italic flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  No full text content available for this document.
                </p>
              </div>
            )}

            {/* Tags Section */}
            {doc.tags && doc.tags.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg sm:text-xl">
                  <Tag className="h-5 w-5 text-pink-600" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-4 py-2 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 text-xs sm:text-sm font-medium rounded-full border-2 border-pink-300 hover:border-pink-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Document Details Section */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl p-6">
              <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="h-5 w-5 text-slate-600" />
                Document Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-300 hover:border-slate-400 transition-colors">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Source</p>
                  <p className="text-sm text-gray-900 font-medium">{doc.source}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-300 hover:border-slate-400 transition-colors">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Language</p>
                  <p className="text-sm text-gray-900 font-medium">{doc.language}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-gray-300 hover:border-slate-400 transition-colors md:col-span-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Document ID</p>
                  <p className="text-xs text-gray-600 font-mono break-all">{doc._id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== ENHANCED ACTION FOOTER ===== */}
        <div className="border-t-2 border-gray-300 bg-gradient-to-r from-gray-50 to-blue-50 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs sm:text-sm text-gray-600">
              <span className="font-semibold">📌 Ready to take action?</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownloadWithLoading}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
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

              {/* Close Button */}
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default App;
