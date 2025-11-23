const API_BASE_URL = 'http://localhost:5000/api';

// Generic API call function
const apiCall = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Get dashboard statistics
export const getDashboardStats = async () => {
  return await apiCall('/dashboard/stats');
};

// Get upload trends data
export const getUploadTrends = async () => {
  return await apiCall('/dashboard/upload-trends');
};

// Get department distribution data
export const getDepartmentDistribution = async () => {
  return await apiCall('/dashboard/departments');
};

// Get processing efficiency data
export const getProcessingEfficiency = async () => {
  return await apiCall('/dashboard/processing-efficiency');
};

// Get all analytics data at once
export const getAllAnalyticsData = async () => {
  try {
    const [dashboard, trends, distribution, efficiency] = await Promise.all([
      getDashboardStats(),
      getUploadTrends(),
      getDepartmentDistribution(),
      getProcessingEfficiency()
    ]);

    return {
      dashboard,
      trends,
      distribution,
      efficiency
    };
  } catch (error) {
    console.error('Failed to fetch analytics data:', error);
    throw error;
  }
};