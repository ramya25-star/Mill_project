// Service layer for Procurement & Order Tracking System
// Decouples UI components from data persistence, allowing easy swapping of REST APIs

import { CONFIG } from '../config';

// Date difference utility in days
export const getDaysDifference = (dateStr1, dateStr2) => {
  try {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    d1.setHours(0,0,0,0);
    d2.setHours(0,0,0,0);
    const diffTime = d1 - d2;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (e) {
    return 0;
  }
};

// Delay start date utility (the day after due date)
export const getDelayStartDate = (dueDateStr) => {
  try {
    const d = new Date(dueDateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return dueDateStr;
  }
};

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

const validateUserData = (userData, existingUsers) => {
  if (!userData.name || !userData.name.trim()) {
    throw new Error("Full name is required.");
  }
  const nameRegex = /^[a-zA-Z\s.\-']+$/;
  if (!nameRegex.test(userData.name.trim())) {
    throw new Error("Full name contains invalid characters.");
  }

  if (!userData.email || !userData.email.trim()) {
    throw new Error("Email address is required.");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email.trim())) {
    throw new Error("Invalid email format.");
  }

  const duplicateEmail = existingUsers.some(u => u.email?.toLowerCase() === userData.email.toLowerCase() && u.id !== userData.id);
  if (duplicateEmail) {
    throw new Error("Email address is already in use by another user.");
  }

  if (!userData.phone || !userData.phone.trim()) {
    throw new Error("Phone number is required.");
  }
  const phoneRegex = /^(?:\+91)?\d{10}$/;
  if (!phoneRegex.test(userData.phone.trim())) {
    throw new Error("Invalid Indian mobile number (must be a 10-digit number, optionally starting with +91).");
  }

  if (!userData.role) {
    throw new Error("Role is required.");
  }
  if (!userData.department) {
    throw new Error("Department is required.");
  }
};

export const apiService = {
  // ------------------------------------------------
  // MATERIAL REQUESTS / ORDERS API
  // ------------------------------------------------
  async getRequests() {
    const baseUrl = getApiBaseUrl();
    let requests;
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/requests`);
      if (!res.ok) throw new Error("Failed to fetch requests from live API");
      requests = await res.json();
    } else {
      requests = mockDb.getRequests();
    }

    const todayStr = new Date().toLocaleDateString('en-CA'); // Format: yyyy-mm-dd
    let changed = false;
    const updated = requests.map(r => {
      const isOverdue = r.dueDate && r.dueDate < todayStr;
      const isNotCompleted = r.status !== "Delivered" && r.status !== "Rejected" && r.status !== "Cancelled";

      if (isOverdue && isNotCompleted) {
        const days = getDaysDifference(todayStr, r.dueDate);
        const delayStart = r.delayStartDate || getDelayStartDate(r.dueDate);

        if (r.status !== "Delayed") {
          changed = true;
          const updatedHistory = [...(r.history || []), {
            status: "Delayed",
            updatedBy: "System",
            role: "Automated",
            timestamp: new Date().toISOString(),
            remarks: `Order automatically flagged as Delayed. Due date (${r.dueDate}) has passed. Overdue: ${days} days.`
          }];
          return {
            ...r,
            status: "Delayed",
            delayedStatus: true,
            delayStartDate: delayStart,
            delayedDays: days,
            history: updatedHistory
          };
        } else if (r.delayedDays !== days) {
          changed = true;
          return {
            ...r,
            delayedDays: days
          };
        }
      }
      return r;
    });

    if (changed) {
      if (!baseUrl) {
        mockDb.saveRequests(updated);
      }
      return updated;
    }
    return requests;
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
    
    // Check if the order is being marked as Delivered
    if (updatedRequest.status === "Delivered") {
      const wasDelayed = updatedRequest.delayedStatus === true || 
                         (updatedRequest.history && updatedRequest.history.some(h => h.status === "Delayed"));
      
      const todayStr = new Date().toLocaleDateString('en-CA');
      const isOverdue = updatedRequest.dueDate && updatedRequest.dueDate < todayStr;

      if (wasDelayed || isOverdue) {
        updatedRequest.delayedStatus = true;
        if (!updatedRequest.actualDeliveryDate) {
          updatedRequest.actualDeliveryDate = new Date().toISOString();
        }
        
        const deliveryDateStr = updatedRequest.actualDeliveryDate.split('T')[0];
        const days = getDaysDifference(deliveryDateStr, updatedRequest.dueDate);
        updatedRequest.delayedDays = days > 0 ? days : updatedRequest.delayedDays || 0;
        
        // Find the "Delivered" history entry and update its remarks with the note
        if (updatedRequest.history && updatedRequest.history.length > 0) {
          const lastEntryIdx = updatedRequest.history.length - 1;
          const lastEntry = updatedRequest.history[lastEntryIdx];
          if (lastEntry.status === "Delivered") {
            const note = `Delivered ${updatedRequest.delayedDays} days after the Due Date.`;
            if (lastEntry.remarks) {
              if (!lastEntry.remarks.includes("after the Due Date")) {
                lastEntry.remarks = `${lastEntry.remarks} (${note})`;
              }
            } else {
              lastEntry.remarks = note;
            }
          }
        }
      }
    }

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

  async createUser(userData) {
    await initializeUsers();
    const users = mockDb.getUsers();
    
    validateUserData(userData, users);
    
    const exists = users.some(u => u.username.toLowerCase() === userData.username.toLowerCase());
    if (exists) {
      throw new Error("Username already exists. Please choose another.");
    }

    const tempPassword = `alagiri${userData.username.toLowerCase()}`;
    const hash = await hashPassword(tempPassword);
    
    const newUserData = {
      ...userData,
      passwordHash: hash,
      mustChangePassword: true,
      enabled: true
    };
    
    users.push(newUserData);
    mockDb.saveUsers(users);
    return tempPassword;
  },

  async saveUser(userData) {
    await initializeUsers();
    const users = mockDb.getUsers();

    if (userData.role !== "Main Admin") {
      validateUserData(userData, users);
    }

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
    
    let tempPassword = newTempPassword;
    if (!tempPassword) {
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      tempPassword = "";
      for (let i = 0; i < 12; i++) {
        tempPassword += charset.charAt(Math.floor(Math.random() * charset.length));
      }
    }

    const hash = await hashPassword(tempPassword);
    users[userIndex] = {
      ...users[userIndex],
      passwordHash: hash,
      mustChangePassword: true
    };
    mockDb.saveUsers(users);
    return tempPassword;
  },

  async getDepartments() {
    const saved = localStorage.getItem("pms_departments");
    if (saved) return JSON.parse(saved);
    const initial = [
      { name: "Kraft Mill", disabled: false },
      { name: "Maintenance", disabled: false },
      { name: "Production", disabled: false },
      { name: "Utility", disabled: false },
      { name: "Logistics", disabled: false },
      { name: "Executive Office", disabled: false }
    ];
    localStorage.setItem("pms_departments", JSON.stringify(initial));
    return initial;
  },

  async saveDepartments(depts) {
    localStorage.setItem("pms_departments", JSON.stringify(depts));
    return depts;
  },

  async addDepartment(name) {
    const depts = await this.getDepartments();
    const normalized = name.trim();
    if (depts.some(d => d.name.toLowerCase() === normalized.toLowerCase())) {
      throw new Error("Department already exists.");
    }
    const updated = [...depts, { name: normalized, disabled: false }];
    await this.saveDepartments(updated);
    return updated;
  },

  async renameDepartment(oldName, newName) {
    const depts = await this.getDepartments();
    const normalized = newName.trim();
    if (depts.some(d => d.name.toLowerCase() === normalized.toLowerCase() && d.name.toLowerCase() !== oldName.toLowerCase())) {
      throw new Error("Target department name already exists.");
    }
    const updated = depts.map(d => d.name === oldName ? { ...d, name: normalized } : d);
    await this.saveDepartments(updated);
    
    // Also update all users with this department!
    const users = mockDb.getUsers();
    const updatedUsers = users.map(u => u.department === oldName ? { ...u, department: normalized } : u);
    mockDb.saveUsers(updatedUsers);

    return updated;
  },

  async toggleDepartmentDisabled(name) {
    const depts = await this.getDepartments();
    const updated = depts.map(d => d.name === name ? { ...d, disabled: !d.disabled } : d);
    await this.saveDepartments(updated);
    return updated;
  }
};
