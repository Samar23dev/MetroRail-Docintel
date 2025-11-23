import React from "react";
import { BarChart3, FileText, Search, TrendingUp } from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const navigationItems = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3 },
    { id: "documents", name: "Documents", icon: FileText },
    { id: "search", name: "Search", icon: Search },
    { id: "analytics", name: "Analytics", icon: TrendingUp },
  ];

  return (
    <div className="w-full md:w-64 flex-shrink-0 mb-8 md:mb-0">
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === item.id
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
        <h4 className="font-semibold text-gray-900 mb-3">Today's Summary</h4>
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
  );
};

export default Sidebar;