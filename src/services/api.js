// Service layer for Procurement & Order Tracking System
// Decouples UI components from data persistence, allowing easy swapping of REST APIs

import { CONFIG } from '../config';

// Load API base URL from localStorage configuration
const getApiBaseUrl = () => {
  return localStorage.getItem("pms_api_base_url") || "";
};

// Local storage fallback mock DB
const mockDb = {
  getRequests: () => JSON.parse(localStorage.getItem("pms_requests")) || CONFIG.initialRequests,
  saveRequests: (reqs) => localStorage.setItem("pms_requests", JSON.stringify(reqs)),
  getSuppliers: () => JSON.parse(localStorage.getItem("pms_suppliers")) || CONFIG.initialSuppliers,
  saveSuppliers: (sups) => localStorage.setItem("pms_suppliers", JSON.stringify(sups)),
  getLogs: () => JSON.parse(localStorage.getItem("pms_logs")) || CONFIG.initialLogs,
  saveLogs: (logs) => localStorage.setItem("pms_logs", JSON.stringify(logs))
};

export const apiService = {
  // ------------------------------------------------
  // MATERIAL REQUESTS / ORDERS API
  // ------------------------------------------------
  async getRequests() {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/requests`);
      if (!res.ok) throw new Error("Failed to fetch requests from live API");
      return await res.json();
    }
    return mockDb.getRequests();
  },

  async createRequest(requestData) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      if (!res.ok) throw new Error("Failed to create request in live API");
      return await res.json();
    }

    const reqs = mockDb.getRequests();
    const updated = [requestData, ...reqs];
    mockDb.saveRequests(updated);
    return requestData;
  },

  async updateRequest(requestId, updatedRequest) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRequest)
      });
      if (!res.ok) throw new Error(`Failed to update request ${requestId} in live API`);
      return await res.json();
    }

    const reqs = mockDb.getRequests();
    const updated = reqs.map(r => r.id === requestId ? updatedRequest : r);
    mockDb.saveRequests(updated);
    return updatedRequest;
  },

  // ------------------------------------------------
  // SUPPLIER MANAGEMENT API
  // ------------------------------------------------
  async getSuppliers() {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/suppliers`);
      if (!res.ok) throw new Error("Failed to fetch suppliers from live API");
      return await res.json();
    }
    return mockDb.getSuppliers();
  },

  async addSupplier(supplierData) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierData)
      });
      if (!res.ok) throw new Error("Failed to add supplier in live API");
      return await res.json();
    }

    const sups = mockDb.getSuppliers();
    const updated = [...sups, supplierData];
    mockDb.saveSuppliers(updated);
    return supplierData;
  },

  async updateSupplier(supplierId, updatedSupplier) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/suppliers/${supplierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSupplier)
      });
      if (!res.ok) throw new Error("Failed to update supplier in live API");
      return await res.json();
    }

    const sups = mockDb.getSuppliers();
    const updated = sups.map(s => s.id === supplierId ? updatedSupplier : s);
    mockDb.saveSuppliers(updated);
    return updatedSupplier;
  },

  // ------------------------------------------------
  // AUDIT TRAIL LOGS API
  // ------------------------------------------------
  async getLogs() {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/logs`);
      if (!res.ok) throw new Error("Failed to fetch logs from live API");
      return await res.json();
    }
    return mockDb.getLogs();
  },

  async addLog(logData) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      try {
        await fetch(`${baseUrl}/logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logData)
        });
      } catch (err) {
        console.error("Failed to post log event to live API:", err);
      }
    }

    const logs = mockDb.getLogs();
    const updated = [logData, ...logs];
    mockDb.saveLogs(updated);
    return logData;
  }
};
