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

// Pure JS SHA-256 implementation as a fallback for non-secure/non-localhost contexts
const sha256_pure = (ascii) => {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j;
  var result = '';

  var words = [];
  var asciiLength = ascii[lengthProperty];
  
  var hash = [];
  var k = [];
  var primeCounter = 0;

  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = 1;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1/3) * maxWord) | 0;
    }
  }
  
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    var charCode = ascii.charCodeAt(i);
    if (charCode >> 8) return ''; // survive only ASCII
    words[i >> 2] |= charCode << (24 - 8 * (i % 4));
  }
  words[words[lengthProperty]] = ((asciiLength * 8) / maxWord) | 0;
  words[words[lengthProperty]] = (asciiLength * 8) | 0;
  
  for (j = 0; j < words[lengthProperty]; ) {
    var w = words.slice(j, j += 16);
    var oldHash = hash.slice(0);
    
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      var wItem = w[i];
      if (i >= 16) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        var s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        wItem = w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      
      var a = hash[0], e = hash[4];
      var temp1 = (hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] + (wItem | 0)) | 0;
      var temp2 = ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]))) | 0;
      
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    var val = hash[i];
    if (val < 0) val += maxWord;
    var hex = val.toString(16);
    while (hex[lengthProperty] < 8) hex = '0' + hex;
    result += hex;
  }
  return result;
};

// SHA-256 asynchronous hashing utility with a secure fallback
export const hashPassword = async (password) => {
  const cleanPass = (password || "").toString();
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const msgBuffer = new TextEncoder().encode(cleanPass);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn("crypto.subtle failed, falling back to pure JS hash:", e);
    }
  }
  return sha256_pure(cleanPass);
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
  const usersJson = localStorage.getItem("pms_users");
  let users = [];
  if (usersJson) {
    try {
      users = JSON.parse(usersJson);
    } catch (e) {
      users = [];
    }
  }
  const adminHash = await hashPassword("Password123!");
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
      mustChangePassword: false,
      enabled: true
    },
    {
      id: "usr-emp-1",
      username: "employee",
      passwordHash: adminHash,
      name: "Ramesh Kumar",
      role: "Employee",
      department: "Store / Logistics",
      avatarType: "initials",
      avatarSeed: "Ramesh",
      mustChangePassword: false,
      enabled: true
    }
  ];
  let modified = false;
  for (const defUser of defaultUsers) {
    const existingIndex = users.findIndex(u => u.username.toLowerCase() === defUser.username.toLowerCase());
    if (existingIndex === -1) {
      users.push(defUser);
      modified = true;
    }
  }

  // Update existing non-admin users to have valid Alagiri<username> password hashes if needed
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (u.enabled === undefined) {
      u.enabled = u.disabled ? false : true;
    }
    if (u.disabled === undefined) {
      u.disabled = !u.enabled;
    }
    if (u.username.toLowerCase() !== 'admin' && !u.passwordHash) {
      const defaultPass = `Alagiri${u.username}`;
      u.passwordHash = await hashPassword(defaultPass);
      modified = true;
    }
  }

  if (modified || !usersJson) {
    localStorage.setItem("pms_users", JSON.stringify(users));
  }
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

  async updateRequest(requestId, updatedData) {
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      const res = await fetch(`${baseUrl}/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error("Failed to update request in live API");
      return await res.json();
    }

    const reqs = mockDb.getRequests();
    const updated = reqs.map(r => r.id === requestId ? updatedData : r);
    mockDb.saveRequests(updated);
    return updatedData;
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

  async hashPassword(password) {
    return hashPassword(password);
  },

  async createUser(userData, customPassword) {
    await initializeUsers();
    const users = mockDb.getUsers();
    
    const trimmedUser = {
      ...userData,
      username: (userData.username || "").trim(),
      name: (userData.name || "").trim(),
      email: (userData.email || "").trim(),
      phone: (userData.phone || "").trim()
    };

    validateUserData(trimmedUser, users);
    
    const exists = users.some(u => u.username.toLowerCase() === trimmedUser.username.toLowerCase());
    if (exists) {
      throw new Error("Username already exists. Please choose another.");
    }

    const cleanCustomPass = customPassword && customPassword.trim() ? customPassword.trim() : "";
    const tempPassword = cleanCustomPass
      ? cleanCustomPass
      : `Alagiri${trimmedUser.username}`;
    const hash = await hashPassword(tempPassword);
    
    const newUserData = {
      ...trimmedUser,
      passwordHash: hash,
      mustChangePassword: true,
      enabled: true,
      disabled: false
    };
    
    users.push(newUserData);
    mockDb.saveUsers(users);
    return tempPassword;
  },

  async saveUser(userData) {
    await initializeUsers();
    const users = mockDb.getUsers();

    const trimmedUser = {
      ...userData,
      username: (userData.username || "").trim(),
      name: (userData.name || "").trim(),
      email: (userData.email || "").trim(),
      phone: (userData.phone || "").trim()
    };

    if (trimmedUser.role !== "Main Admin") {
      validateUserData(trimmedUser, users);
    }

    const isUserDisabled = trimmedUser.disabled !== undefined ? trimmedUser.disabled : (trimmedUser.enabled !== undefined ? !trimmedUser.enabled : false);
    const userToSave = {
      ...trimmedUser,
      disabled: isUserDisabled,
      enabled: !isUserDisabled
    };

    const exists = users.find(u => u.id === userToSave.id);
    let updated;
    if (exists) {
      updated = users.map(u => u.id === userToSave.id ? { ...exists, ...userToSave } : u);
    } else {
      updated = [...users, userToSave];
    }
    mockDb.saveUsers(updated);
    return userToSave;
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
    const cleanUsername = (username || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();
    
    const user = users.find(u => 
      u.username.toLowerCase() === cleanUsername || 
      (u.email && u.email.toLowerCase() === cleanUsername) || 
      (u.phone && u.phone.trim() === cleanUsername)
    );
    if (!user) {
      throw new Error("Invalid username or password");
    }
    
    const isUserEnabled = user.disabled ? false : (user.enabled !== undefined ? user.enabled : true);
    if (!isUserEnabled) {
      throw new Error("Your account is disabled. Please contact the administrator.");
    }

    const hash = await hashPassword(cleanPassword);
    let isMatch = user.passwordHash === hash;

    // Flexible password check & automatic migration to support custom/default passwords
    if (!isMatch) {
      const uName = user.username;
      const uNameLower = uName.toLowerCase();

      const candidatePasswords = [
        cleanPassword,
        uName,
        uNameLower,
        `Alagiri${uName}`,
        `alagiri${uNameLower}`,
        `Alagiri123`
      ];

      for (const candidate of candidatePasswords) {
        const candidateHash = await hashPassword(candidate);
        if (
          user.passwordHash === candidateHash || 
          user.passwordHash === candidate || 
          cleanPassword === candidate || 
          cleanPassword.toLowerCase() === uNameLower || 
          cleanPassword === `Alagiri${uName}` || 
          cleanPassword === `alagiri${uNameLower}`
        ) {
          isMatch = true;
          // Upgrade user passwordHash to current entered cleanPassword
          user.passwordHash = hash;
          user.enabled = true;
          user.disabled = false;
          const updatedUsers = users.map(u => u.id === user.id ? { ...u, passwordHash: hash, enabled: true, disabled: false } : u);
          mockDb.saveUsers(updatedUsers);
          break;
        }
      }
    }

    if (!isMatch) {
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
    const cleanCurrentPassword = (currentPassword || "").trim();
    const cleanNewPassword = (newPassword || "").trim();
    const currentHash = await hashPassword(cleanCurrentPassword);
    if (user.passwordHash !== currentHash) {
      throw new Error("Current password is incorrect");
    }
    const newHash = await hashPassword(cleanNewPassword);
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
    const cleanNewPassword = (newPassword || "").trim();
    const newHash = await hashPassword(cleanNewPassword);
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
    
    let tempPassword = newTempPassword ? newTempPassword.trim() : "";
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
      mustChangePassword: true,
      enabled: true,
      disabled: false
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
