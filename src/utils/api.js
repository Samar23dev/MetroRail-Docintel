import { API_BASE_URL } from '../constants/config';

export const fetchDocuments = async (searchQuery, selectedDepartment, selectedDocType) => {
  const params = new URLSearchParams();
  if (searchQuery) params.append("search", searchQuery);
  if (selectedDepartment !== "all") params.append("department", selectedDepartment);
  if (selectedDocType !== "all-types") params.append("type", selectedDocType);

  const response = await fetch(`${API_BASE_URL}/documents?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "File upload failed");
  }

  return response.json();
};

export const deleteDocument = async (docId) => {
  const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete the document.");
  }

  return response.json();
};