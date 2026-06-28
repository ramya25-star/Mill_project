// Service layer for Procurement & Order Tracking System
// Decouples UI components from data persistence, allowing easy swapping of REST APIs

import { CONFIG } from '../config';

// Load API base URL from localStorage configuration
const getApiBaseUrl = () => {
  return localStorage.getItem("pms_api_base_url") || "";
};

// SHA-256 asynchronous hashing utility
export const hashPassword = async (password) => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Local storage fallback mock DB
const mockDb = {
  getRequests: () => JSON.parse(localStorage.getItem("pms_requests")) || CONFIG.initialRequests,
  saveRequests: (reqs) => localStorage.setItem("pms_requests", JSON.stringify(reqs)),
  getSuppliers: () => JSON.parse(localStorage.getItem("pms_suppliers")) || CONFIG.initialSuppliers,
  saveSuppliers: (sups) => localStorage.setItem("pms_suppliers", JSON.stringify(sups)),
  getLogs: () => JSON.parse(localStorage.getItem("pms_logs")) || CONFIG.initialLogs,
  saveLogs: (logs) => localStorage.setItem("pms_logs", JSON.stringify(logs)),
  getUsers: () => JSON.parse(localStorage.getItem("pms_users")) || [],
  saveUsers: (users) => localStorage.setItem("pms_users", JSON.stringify(users))
};

const initializeUsers = async () => {
  if (localStorage.getItem("pms_users")) return;
  const adminHash = await hashPassword("Password123!");
  const subAdminHash = await hashPassword("Password123!");
  const employeeHash = await hashPassword("Password123!");
  const defaultUsers = [
    {
      id: "usr-admin",
      username: "admin",
      passwordHash: adminHash,
      name: "Johnson",
      role: "Main Admin",
      department: "Executive Office",
      avatarType: "initials",
      avatarSeed: "Johnson",
      mustChangePassword: true,
      enabled: true
    },
    {
      id: "usr-subadmin",
      username: "subadmin",
      passwordHash: subAdminHash,
      name: "Sarah Connor",
      role: "Sub Admin",
      department: "Purchasing",
      avatarType: "initials",
      avatarSeed: "Sarah Connor",
      mustChangePassword: true,
      enabled: true,
      permissions: {
        approve_requests: true,
        manage_suppliers: true,
        view_logs: true,
        edit_orders: false
      }
    },
    {
      id: "usr-employee",
      username: "employee",
      passwordHash: employeeHash,
      name: "John Doe",
      role: "Employee",
      department: "Maintenance",
      avatarType: "initials",
      avatarSeed: "John Doe",
      mustChangePassword: true,
      enabled: true
    }
  ];
  localStorage.setItem("pms_users", JSON.stringify(defaultUsers));
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
  },

  // ------------------------------------------------
  // USER MANAGEMENT & AUTHENTICATION API
  // ------------------------------------------------
  async initializeDefaultUsers() {
    await initializeUsers();
  },

  async getUsers() {
    await initializeUsers();
    return mockDb.getUsers();
  },

  async saveUser(userData) {
    await initializeUsers();
    const users = mockDb.getUsers();
    const exists = users.find(u => u.id === userData.id);
    let updated;
    if (exists) {
      updated = users.map(u => u.id === userData.id ? userData : u);
    } else {
      updated = [...users, userData];
    }
    mockDb.saveUsers(updated);
    return userData;
  },

  async deleteUser(userId) {
    await initializeUsers();
    const users = mockDb.getUsers();
    const updated = users.filter(u => u.id !== userId);
    mockDb.saveUsers(updated);
    return true;
  },

  async authenticate(username, password) {
    await initializeUsers();
    const users = mockDb.getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error("Invalid username or password");
    }
    if (!user.enabled) {
      throw new Error("Your account is disabled. Please contact the administrator.");
    }
    const hash = await hashPassword(password);
    if (user.passwordHash !== hash) {
      throw new Error("Invalid username or password");
    }
    // Return safe user session
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },

  async changePassword(userId, currentPassword, newPassword) {
    await initializeUsers();
    const users = mockDb.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    const user = users[userIndex];
    const currentHash = await hashPassword(currentPassword);
    if (user.passwordHash !== currentHash) {
      throw new Error("Current password is incorrect");
    }
    const newHash = await hashPassword(newPassword);
    users[userIndex] = {
      ...user,
      passwordHash: newHash,
      mustChangePassword: false
    };
    mockDb.saveUsers(users);
    const { passwordHash, ...safeUser } = users[userIndex];
    return safeUser;
  },

  async forceChangePassword(userId, newPassword) {
    await initializeUsers();
    const users = mockDb.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    const user = users[userIndex];
    const newHash = await hashPassword(newPassword);
    users[userIndex] = {
      ...user,
      passwordHash: newHash,
      mustChangePassword: false
    };
    mockDb.saveUsers(users);
    const { passwordHash, ...safeUser } = users[userIndex];
    return safeUser;
  },

  async resetUserPassword(userId, newTempPassword) {
    await initializeUsers();
    const users = mockDb.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    const hash = await hashPassword(newTempPassword);
    users[userIndex] = {
      ...users[userIndex],
      passwordHash: hash,
      mustChangePassword: true
    };
    mockDb.saveUsers(users);
    return true;
  }
};
