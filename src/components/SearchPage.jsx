import React, { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { popularSearchTerms, departments, docTypes } from "../constants/config";

const SearchPage = ({ searchQuery, setSearchQuery, setActiveTab }) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchType: "keyword", // keyword or semantic
    department: "all",
    docType: "all",
    status: "all",
    language: "all",
    dateFrom: "",
    dateTo: "",
    tags: "",
    relevanceThreshold: 0.5,
  });

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleSearch = () => {
    // Trigger search with filters
    const endpoint = filters.searchType === "semantic" ? "/api/search/semantic" : "/api/search";
    setActiveTab("documents");
  };

  const resetFilters = () => {
    setFilters({
      searchType: "keyword",
      department: "all",
      docType: "all",
      status: "all",
      language: "all",
      dateFrom: "",
      dateTo: "",
      tags: "",
      relevanceThreshold: 0.5,
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Search Box */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Search Documents
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

          {/* Search Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors" style={{ borderColor: filters.searchType === "keyword" ? "#3b82f6" : "#d1d5db" }}>
              <input
                type="radio"
                name="searchType"
                value="keyword"
                checked={filters.searchType === "keyword"}
                onChange={(e) => handleFilterChange("searchType", e.target.value)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Keyword Search</span>
            </label>
            <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors" style={{ borderColor: filters.searchType === "semantic" ? "#3b82f6" : "#d1d5db" }}>
              <input
                type="radio"
                name="searchType"
                value="semantic"
                checked={filters.searchType === "semantic"}
                onChange={(e) => handleFilterChange("searchType", e.target.value)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Semantic Search</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {filters.searchType === "semantic" ? "Semantic Search" : "Search"}
            </button>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Advanced Filters</h4>
            <button
              onClick={() => setShowAdvancedFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={filters.docType}
                onChange={(e) => handleFilterChange("docType", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {docTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="urgent">Urgent</option>
                <option value="review">Review</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange("language", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Languages</option>
                <option value="English">English</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Bilingual">Bilingual</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tags Filter */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g., safety, circular, urgent"
                value={filters.tags}
                onChange={(e) => handleFilterChange("tags", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Relevance Threshold (for semantic search) */}
            {filters.searchType === "semantic" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relevance: {Math.round(filters.relevanceThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={filters.relevanceThreshold}
                  onChange={(e) => handleFilterChange("relevanceThreshold", parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Filter Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSearch}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 className="text-md font-semibold text-gray-900 mb-3">
          Popular Searches
        </h4>
        <div className="flex flex-wrap gap-2">
          {popularSearchTerms.map((term) => (
            <button
              key={term}
              onClick={() => setSearchQuery(term)}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h4 className="text-md font-semibold text-blue-900 mb-3">Search Tips</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• <strong>Keyword Search:</strong> Searches in title, summary, and content for exact matches</li>
          <li>• <strong>Semantic Search:</strong> Uses AI to find conceptually similar documents even with different wording</li>
          <li>• <strong>Advanced Filters:</strong> Combine multiple filters to narrow down results</li>
          <li>• <strong>Relevance:</strong> Adjust threshold in semantic search to control match precision (higher = stricter)</li>
          <li>• <strong>Date Range:</strong> Leave dates blank to include all documents</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchPage;