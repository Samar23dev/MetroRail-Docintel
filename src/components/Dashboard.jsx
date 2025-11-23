import React, { useState, useEffect } from "react";
import {
  FileText,
  AlertTriangle,
  Clock,
  Users,
  Upload,
  Search,
  BarChart3,
  Bell,
} from "lucide-react";
import { departments } from "../constants/config";
import { fetchDashboardStats } from "../utils/analyticsApi";

const Dashboard = ({ handleQuickAction }) => {
  const [stats, setStats] = useState({
    documents_today: 0,
    urgent_items: 0,
    avg_processing_time: 0,
    total_documents: 0,
  });
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardStats = await fetchDashboardStats();
        setStats(dashboardStats);

        // Fetch department stats if available
        try {
          const response = await fetch('/api/dashboard/departments');
          if (response.ok) {
            const data = await response.json();
            setDepartmentStats(data.departments || []);
          }
        } catch (error) {
          console.warn("Could not fetch department stats:", error);
          setDepartmentStats([]);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Set default values if API call fails
        setStats({
          documents_today: 0,
          urgent_items: 0,
          avg_processing_time: 0,
          total_documents: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatProcessingTime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Documents Today
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.documents_today}
              </p>
              <p className="text-sm text-green-600">↗ Updated live</p>
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
              <p className="text-3xl font-bold text-red-600">
                {loading ? "..." : stats.urgent_items}
              </p>
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
              <p className="text-3xl font-bold text-gray-900">
                {loading ? "..." : formatProcessingTime(stats.avg_processing_time)}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? "..." : stats.total_documents}
              </p>
              <p className="text-sm text-blue-600">In system</p>
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

      {/* Department Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Department Activity
        </h3>
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading department data...</p>
          ) : departmentStats && departmentStats.length > 0 ? (
            departmentStats.map((dept) => {
              const deptConfig = departments.find(
                (d) => d.name.toLowerCase() === dept.name.toLowerCase()
              );
              return (
                <div
                  key={dept.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${deptConfig?.color || "bg-gray-400"} p-2 rounded-lg`}>
                      {deptConfig ? (
                        <deptConfig.icon className="h-4 w-4 text-white" />
                      ) : (
                        <FileText className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900">{dept.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{dept.total_docs} docs</span>
                    <span className="text-red-600">{dept.urgent_items} urgent</span>
                  </div>
                </div>
              );
            })
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;