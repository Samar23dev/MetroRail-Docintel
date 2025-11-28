import React from "react";
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

const Dashboard = ({ handleQuickAction }) => {
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
};

export default Dashboard;