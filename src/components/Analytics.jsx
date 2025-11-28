import React, { useState, useEffect } from "react";
import { TrendingUp, BarChart3, RefreshCw, AlertCircle } from "lucide-react";
import { DocumentTrendsChart, DepartmentDistributionChart, DocumentTypesChart, ProcessingTimeChart } from "./charts/ChartComponents";
import { getAllAnalyticsData } from "../utils/analyticsApi";

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllAnalyticsData();
      setAnalyticsData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const refreshData = () => {
    fetchAnalyticsData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Document Upload Trends
          </h3>
          <DocumentTrendsChart data={analyticsData?.trends} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Department Distribution
          </h3>
          <DepartmentDistributionChart data={analyticsData?.distribution} />
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Document Types
          </h3>
          <DocumentTypesChart data={analyticsData?.dashboard?.documentTypes} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Processing Time Trends
          </h3>
          <ProcessingTimeChart data={analyticsData?.efficiency?.processingTime} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Processing Efficiency
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analyticsData?.efficiency?.autoProcessedRate || '94.2%'}
            </div>
            <div className="text-sm text-gray-600">Auto-processed</div>
            <div className="text-xs text-green-600 mt-1">
              {analyticsData?.efficiency?.autoProcessedTrend || '↗ 2.1% this week'}
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analyticsData?.efficiency?.avgProcessingTime || '2.3h'}
            </div>
            <div className="text-sm text-gray-600">Avg. Processing Time</div>
            <div className="text-xs text-blue-600 mt-1">
              {analyticsData?.efficiency?.processingTimeTrend || '↘ 15 min faster'}
            </div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {analyticsData?.efficiency?.complianceRate || '85%'}
            </div>
            <div className="text-sm text-gray-600">Compliance Rate</div>
            <div className="text-xs text-orange-600 mt-1">
              {analyticsData?.efficiency?.complianceTarget || 'Target: 90%'}
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {analyticsData?.dashboard?.languagesDetected || '12'}
            </div>
            <div className="text-sm text-gray-600">Languages Detected</div>
            <div className="text-xs text-purple-600 mt-1">
              {analyticsData?.dashboard?.primaryLanguages || 'ML/EN primary'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;