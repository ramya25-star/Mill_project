import React, { useState, useEffect } from 'react';
import './App.css';
import { CONFIG } from './config';
import { apiService, getDaysDifference, getDelayStartDate } from './services/api';
import {
  HomeView,
  CreateRequestView,
  RequestedOrdersView,
  PoPreviewView,
  LiveOrdersView,
  OrderDetailsView,
  SettingsView,
  SuppliersView,
  NotificationPreferencesView,
  AuditLogsView,
  OrderHistoryView,
  LoginView,
  ForceChangePasswordView,
  UserManagementView,
  PendingOrdersView,
  DepartmentManagementView,
  Icons
} from './components/Views';

// Static overdue order classifier helper
const checkOverdueOrdersStatic = (currentRequests, suppliersList) => {
  const todayStr = new Date().toLocaleDateString('en-CA');
  let changed = false;
  const notificationsToTrigger = [];
  const eventsToLog = [];

  const updatedRequests = currentRequests.map(r => {
    const isOverdue = r.dueDate && r.dueDate < todayStr;
    const isNotCompleted = r.status !== "Delivered" && r.status !== "Rejected" && r.status !== "Cancelled";

    if (isOverdue && isNotCompleted) {
      const days = getDaysDifference(todayStr, r.dueDate);
      const delayStart = r.delayStartDate || getDelayStartDate(r.dueDate);

      if (r.status !== "Delayed") {
        changed = true;
        const supplier = suppliersList.find(s => s.id === r.supplierId) || { companyName: r.suggestedSupplier || "Not Assigned" };
        
        notificationsToTrigger.push({
          title: `Delayed Order Alert: ${r.id}`,
          body: `Order ${r.id} for "${r.productName}" from ${supplier.companyName} is overdue.\nDue Date: ${r.dueDate}\nOverdue: ${days} day(s).`,
          role: "Both"
        });

        eventsToLog.push({
          action: "Order Delayed Automatically",
          prevStatus: r.status,
          newStatus: "Delayed",
          details: `Order ${r.id} is overdue by ${days} days.`
        });

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

  return { updatedRequests, notificationsToTrigger, eventsToLog, changed };
};

export default function App() {
  // ----------------------------------------------------
  // GLOBAL STATE
  // ----------------------------------------------------
  const [requests, setRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [branding, setBranding] = useState(CONFIG.branding);
  const [activeRole, setActiveRole] = useState(() => {
    try {
      const savedUser = localStorage.getItem("pms_current_user");
      return savedUser ? JSON.parse(savedUser).role : "Employee";
    } catch {
      return "Employee";
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [toasts, setToasts] = useState([]);

  // User Session state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("pms_current_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [usersList, setUsersList] = useState([]);

  // Navigation Router state
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

  // Modal overlay state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  // Developer console state
  const [devConsoleOpen, setDevConsoleOpen] = useState(false);

  // WhatsApp Simulator state
  const [chatThread, setChatThread] = useState(null); // { requestId, messages: [], quickReplies: [] }

  // Clock
  const [clockTime, setClockTime] = useState("17:50");

  // ----------------------------------------------------
  // DATA LOAD & SEED ROUTINES
  // ----------------------------------------------------
  useEffect(() => {
    // Clock updater
    const updateTime = () => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 60000);

    const loadData = async () => {
      try {
        await apiService.initializeDefaultUsers();
        const uList = await apiService.getUsers();
        setUsersList(uList);

        const savedUser = localStorage.getItem("pms_current_user");
        if (savedUser) {
          const userObj = JSON.parse(savedUser);
          setCurrentUser(userObj);
          setActiveRole(userObj.role);
        }

        const reqs = await apiService.getRequests();
        const sups = await apiService.getSuppliers();
        const auditLogs = await apiService.getLogs();

        setRequests(reqs);
        setSuppliers(sups);
        setLogs(auditLogs);

        // Load custom branding if configured in local storage
        const savedBranding = localStorage.getItem("pms_branding");
        if (savedBranding) {
          try {
            const parsed = JSON.parse(savedBranding);
            if (parsed.appName && (parsed.appName.includes("Tamizhan") || parsed.companyName?.includes("Tamizhan"))) {
              localStorage.clear();
              window.location.reload();
              return;
            }
            setBranding(parsed);
          } catch (e) {
            setBranding(JSON.parse(savedBranding));
          }
        }

        // Webhook URL
        const whUrl = localStorage.getItem("pms_webhook_url") || "";
        setWebhookUrl(whUrl);

        // Notifications
        const savedNotifs = localStorage.getItem("pms_notifications");
        if (savedNotifs) {
          setNotifications(JSON.parse(savedNotifs));
        } else {
          const defaults = [
            {
              id: "notif-1",
              title: "Welcome to Alagiri System",
              body: "Get started by creating your first material request.",
              timestamp: new Date().toISOString(),
              read: false,
              role: "Both"
            }
          ];
          setNotifications(defaults);
          localStorage.setItem("pms_notifications", JSON.stringify(defaults));
        }
      } catch (err) {
        console.error("Error loading application state:", err);
      }
    };

    loadData();

    // Hash router listener
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#home');
      setModalOpen(false); // Close modals on route change
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      clearInterval(clockInterval);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update dynamic CSS theme rules
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-cream', branding.backgroundColor);
    root.style.setProperty('--primary-orange', branding.primaryColor);
    root.style.setProperty('--primary-orange-hover', branding.primaryColorHover);
    root.style.setProperty('--dark-charcoal', branding.darkCharcoal);
    document.title = branding.appName;
  }, [branding]);

  // Automatic Overdue Orders Check & Sync Effect
  useEffect(() => {
    if (requests.length === 0 || suppliers.length === 0) return;

    const { updatedRequests, notificationsToTrigger, eventsToLog, changed } = checkOverdueOrdersStatic(requests, suppliers);

    if (changed) {
      setRequests(updatedRequests);
      
      const baseUrl = localStorage.getItem("pms_api_base_url") || "";
      if (!baseUrl) {
        localStorage.setItem("pms_requests", JSON.stringify(updatedRequests));
      }

      notificationsToTrigger.forEach(n => {
        addNotification(n.title, n.body, n.role);
      });

      eventsToLog.forEach(e => {
        logEvent(e.action, e.prevStatus, e.newStatus, e.details);
      });
    }
  }, [requests, suppliers]);

  // Periodic Overdue Scan Interval
  useEffect(() => {
    if (suppliers.length === 0) return;

    const scanInterval = setInterval(() => {
      setRequests(prevRequests => {
        if (prevRequests.length === 0) return prevRequests;
        const { updatedRequests, notificationsToTrigger, eventsToLog, changed } = checkOverdueOrdersStatic(prevRequests, suppliers);
        
        if (changed) {
          const baseUrl = localStorage.getItem("pms_api_base_url") || "";
          if (!baseUrl) {
            localStorage.setItem("pms_requests", JSON.stringify(updatedRequests));
          }

          notificationsToTrigger.forEach(n => {
            addNotification(n.title, n.body, n.role);
          });

          eventsToLog.forEach(e => {
            logEvent(e.action, e.prevStatus, e.newStatus, e.details);
          });

          return updatedRequests;
        }
        return prevRequests;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(scanInterval);
  }, [suppliers]);

  // ----------------------------------------------------
  // EVENT TRAIL LOGGER & WEBHOOK TRIGGERS
  // ----------------------------------------------------
  const logEvent = async (action, previousValue = "None", updatedValue = "None", details = "") => {
    const user = currentUser || { name: "System", role: "System" };
    const newLog = {
      timestamp: new Date().toISOString(),
      userName: user.name,
      role: user.role,
      action,
      previousValue,
      updatedValue,
      details
    };
    const saved = await apiService.addLog(newLog);
    setLogs(prev => [saved, ...prev]);
  };

  const showToast = (title, body, type = 'info') => {
    const newToast = { id: Date.now(), title, body, type };
    setToasts(prev => [...prev, newToast]);

    // Auto remove toast
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4000);
  };

  const addNotification = (title, body, role = "Both") => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      role
    };

    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    localStorage.setItem("pms_notifications", JSON.stringify(updated));

    if (role === "Both" || role === activeRole) {
      showToast(title, body, role === "Admin" ? "info" : "success");
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.setItem("pms_notifications", JSON.stringify([]));
    showToast("Notifications Cleared", "System alerts folder cleared.", "success");
  };

  const markNotificationsRead = () => {
    const marked = notifications.map(n => ({ ...n, read: true }));
    setNotifications(marked);
    localStorage.setItem("pms_notifications", JSON.stringify(marked));
  };

  const updateBranding = (newBranding) => {
    setBranding(newBranding);
    localStorage.setItem("pms_branding", JSON.stringify(newBranding));
  };

  // ----------------------------------------------------
  // n8n AUTOMATION INTEGRATION
  // ----------------------------------------------------
  const triggerWebhook = (eventType, payloadData) => {
    if (!webhookUrl) {
      console.log(`[n8n Automation simulation] "${eventType}" Payload:`, payloadData);
      return;
    }

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      user: activeRole === "Admin" ? CONFIG.users.admin.name : CONFIG.users.employee.name,
      role: activeRole,
      data: payloadData
    };

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) {
          showToast("Webhook Post Success (n8n)", `Fired JSON payload for event type "${eventType}".`, "info");
          logEvent("Fired Automation Webhook", "None", "Success", `Sent JSON payload to webhook node: ${webhookUrl}`);
        } else {
          showToast("Webhook Status Alert", `n8n webhook endpoint returned code: ${res.status}`, "success");
        }
      })
      .catch(err => {
        console.error(err);
        showToast("Webhook Failure", "Connection failed. Check n8n webhook URL configuration.", "success");
      });
  };

  const handleManualWebhookTrigger = (eventKey) => {
    if (!webhookUrl) {
      showToast("Webhook Configuration Required", "Please configure a Webhook URL first inside settings or right sidebar!", "success");
      return;
    }
    const sampleReq = requests[Math.floor(Math.random() * requests.length)] || CONFIG.initialRequests[0];
    triggerWebhook(eventKey, sampleReq);
  };

  // ----------------------------------------------------
  // INTERACTIVE WHATSAPP SUPPLIER BOT CHAT
  // ----------------------------------------------------
  const initWhatsAppThread = (requestId, outgoingText) => {
    const req = requests.find(r => r.id === requestId);
    const supplier = suppliers.find(s => s.id === req.supplierId) || {};

    setChatThread({
      requestId,
      supplierName: supplier.companyName,
      whatsappNumber: supplier.whatsappNumber,
      messages: [
        { sender: "system", text: `WhatsApp channel opened with ${supplier.companyName} (${supplier.whatsappNumber})` },
        { sender: "admin", text: outgoingText }
      ],
      quickReplies: [
        { text: "Accepted", reply: "Thank you for the PO. We have accepted the order and are processing it." },
        { text: "Rejected", reply: "Apologies, we cannot fulfill this order at this moment. Order rejected." },
        { text: "Picked", reply: "Material has been picked and packed from our store." },
        { text: "Dispatched", reply: "The material has been dispatched. Here is the LR Copy Link: https://api.alagiri.com/receipt/LR-4421.png" },
        { text: "Delivered", reply: "Material delivered and handed over at site. Delivery confirmed." },
        { text: "Delayed", reply: "We regret to inform you that shipment is delayed by 3 days due to transport issues." }
      ]
    });
  };

  const handleSupplierChatReply = async (status, text) => {
    if (!chatThread) return;

    // Add reply bubble to chat window
    setChatThread(prev => ({
      ...prev,
      messages: [...prev.messages, { sender: "supplier", text }]
    }));

    let systemStatus = "";
    let remarks = `Received WhatsApp response: ${status}. Text: "${text}"`;
    let triggerEvent = "supplier.response";

    if (status === "Accepted") systemStatus = "Acknowledged";
    else if (status === "Rejected") systemStatus = "Rejected";
    else if (status === "Picked") systemStatus = "Picked";
    else if (status === "Dispatched") systemStatus = "In Transit";
    else if (status === "Delivered") systemStatus = "Delivered";
    else if (status === "Delayed") systemStatus = "Delayed";
    else systemStatus = "Pending";

    const req = requests.find(r => r.id === chatThread.requestId);
    const prevStatus = req.status;

    let lrCopyData = null;
    if (status === "Dispatched") {
      lrCopyData = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23cbd5e1'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23334155'>Supplier Whatsapp Receipt</text></svg>";
    }

    const updatedHistory = [...req.history, {
      status: systemStatus,
      updatedBy: "System (WhatsApp)",
      role: "Supplier",
      timestamp: new Date().toISOString(),
      remarks
    }];

    const updatedReq = {
      ...req,
      status: systemStatus,
      lrCopy: lrCopyData || req.lrCopy,
      history: updatedHistory
    };

    const saved = await apiService.updateRequest(chatThread.requestId, updatedReq);
    setRequests(requests.map(r => r.id === chatThread.requestId ? saved : r));

    logEvent("Supplier Response", prevStatus, systemStatus, `Supplier WhatsApp reply "${status}": ${text}`);
    addNotification("Supplier Response Received", `Supplier ${chatThread.supplierName || 'AB Company'} updated ${chatThread.requestId} status to ${systemStatus}.`, "Both");

    triggerWebhook(triggerEvent, saved);
  };

  // ----------------------------------------------------
  // VIEW ROUTER SWITCH
  // ----------------------------------------------------
  const renderActiveView = () => {
    const hashParts = currentHash.split('?');
    const path = hashParts[0];
    const params = {};
    if (hashParts[1]) {
      hashParts[1].split('&').forEach(p => {
        const parts = p.split('=');
        params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
      });
    }

    const navProps = {
      state: {
        requests,
        setRequests,
        suppliers,
        setSuppliers,
        logs,
        setLogs,
        branding,
        activeRole,
        notifications,
        clearNotifications,
        markNotificationsRead,
        updateBranding,
        users: CONFIG.users,
        logEvent,
        triggerWebhook,
        initWhatsAppThread,
        currentUser,
        setCurrentUser,
        showToast
      },
      navigateTo: (h) => { window.location.hash = h; },
      addNotification,
      openModal: () => setModalOpen(true),
      closeModal: () => setModalOpen(false),
      setModalContent: (content, title) => {
        setModalContent(content);
        setModalTitle(title);
      }
    };

    // Authentication Guard
    if (!currentUser) {
      return <LoginView onLogin={(user) => {
        setCurrentUser(user);
        setActiveRole(user.role);
        localStorage.setItem("pms_current_user", JSON.stringify(user));
        window.location.hash = "#home";
      }} />;
    }

    // Force Password Reset Guard
    if (currentUser.mustChangePassword) {
      return <ForceChangePasswordView key="force-change-password-view" state={navProps.state} user={currentUser} onPasswordChanged={(updatedUser) => {
        setCurrentUser(updatedUser);
        localStorage.setItem("pms_current_user", JSON.stringify(updatedUser));
        window.location.hash = "#home";
      }} />;
    }

    switch (path) {
      case '#home':
      default:
        return <HomeView {...navProps} />;
      case '#create-request':
        return <CreateRequestView {...navProps} />;
      case '#requested-orders':
        // Guard: Sub Admin must have approve_requests permission
        if (currentUser.role === 'Employee' || (currentUser.role === 'Sub Admin' && !currentUser.permissions?.approve_requests)) {
          window.location.hash = '#home';
          return null;
        }
        return <RequestedOrdersView {...navProps} />;
      case '#po-preview':
        return <PoPreviewView {...navProps} requestId={params.id} />;
      case '#live-orders':
        return <LiveOrdersView {...navProps} />;
      case '#pending-orders':
        return <PendingOrdersView {...navProps} />;
      case '#order-details':
        return <OrderDetailsView {...navProps} requestId={params.id} />;
      case '#settings':
        return <SettingsView {...navProps} />;
      case '#settings/suppliers':
        // Guard: Sub Admin must have manage_suppliers permission
        if (currentUser.role === 'Employee' || (currentUser.role === 'Sub Admin' && !currentUser.permissions?.manage_suppliers)) {
          window.location.hash = '#settings';
          return null;
        }
        return <SuppliersView {...navProps} />;
      case '#settings/notifications':
        return <NotificationPreferencesView {...navProps} />;
      case '#settings/logs':
        // Guard: Sub Admin must have view_logs permission
        if (currentUser.role === 'Employee' || (currentUser.role === 'Sub Admin' && !currentUser.permissions?.view_logs)) {
          window.location.hash = '#settings';
          return null;
        }
        return <AuditLogsView {...navProps} />;
      case '#settings/users':
        // Guard: Main Admin only
        if (currentUser.role !== 'Main Admin') {
          window.location.hash = '#settings';
          return null;
        }
        return <UserManagementView {...navProps} />;
      case '#settings/departments':
        // Guard: Main Admin only
        if (currentUser.role !== 'Main Admin') {
          window.location.hash = '#settings';
          return null;
        }
        return <DepartmentManagementView {...navProps} />;
      case '#order-history':
        return <OrderHistoryView {...navProps} />;
    }
  };

  // Render active bottom floating navigation tabs
  const renderBottomNavTabs = () => {
    const isAdmin = activeRole === "Main Admin" || activeRole === "Sub Admin";
    const path = currentHash.split('?')[0];

    const tabs = [
      { path: '#home', label: 'Home', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg> },
      { path: isAdmin ? '#requested-orders' : '#create-request', label: isAdmin ? 'Approvals' : 'Request', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg> },
      { path: '#order-history', label: 'History', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> },
      { path: '#settings', label: 'Settings', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> }
    ];

    return tabs.map(t => {
      const isTabActive = path === t.path;
      return (
        <a key={t.path} className={`nav-tab ${isTabActive ? 'active' : ''}`} onClick={() => { window.location.hash = t.path; }}>
          {t.icon}
          <span className="nav-tab-label">{t.label}</span>
        </a>
      );
    });
  };

  const handleRoleToggle = async (username) => {
    try {
      const uList = await apiService.getUsers();
      let targetUser = uList.find(u => u.username === username);
      if (!targetUser) {
        showToast("User Session Error", `User ${username} not found.`, "success");
        return;
      }

      setCurrentUser(targetUser);
      setActiveRole(targetUser.role);
      localStorage.setItem("pms_current_user", JSON.stringify(targetUser));
      showToast("User Session Toggled", `Switched active login session to: ${targetUser.name} (${targetUser.role})`, "info");
      window.location.hash = "#home";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="simulation-container">

      {/* APP MOBILE VIEWPORT CONTAINER */}
      <div className="app-frame-wrapper">
        <div className="device-frame">

          {/* Toast Notification Layers */}
          <div className="toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`toast ${t.type}`} style={{ position: 'relative', paddingRight: '28px' }}>
                <button
                  onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    lineHeight: '1',
                    padding: '2px'
                  }}
                  title="Dismiss"
                >
                  ✕
                </button>
                <div className="toast-title">{t.title}</div>
                <div className="toast-body">{t.body}</div>
                <div className="toast-meta">Just now</div>
              </div>
            ))}
          </div>

          {/* Core Routed Screen */}
          <main className="app-content">
            {renderActiveView()}
          </main>

          {/* Sticky Bottom floating navigation tab bar */}
          {currentUser && (
            <div className="bottom-nav-container">
              <nav className="bottom-nav">
                {renderBottomNavTabs()}
              </nav>
            </div>
          )}

          {/* MODAL SHEET OVERLAY */}
          <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={() => setModalOpen(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{modalTitle}</h3>
                <button className="modal-close" onClick={() => setModalOpen(false)}>
                  <Icons.Close />
                </button>
              </div>
              {modalContent}
            </div>
          </div>

          {/* Global Units Datalist */}
          <datalist id="units-list">
            <option value="pcs" />
            <option value="units" />
            <option value="kg" />
            <option value="g" />
            <option value="tons" />
            <option value="bags" />
            <option value="boxes" />
            <option value="cartons" />
            <option value="drums" />
            <option value="barrels" />
            <option value="meters" />
            <option value="feet" />
            <option value="inches" />
            <option value="liters" />
            <option value="gallons" />
            <option value="coils" />
            <option value="rolls" />
            <option value="packets" />
            <option value="bundles" />
            <option value="sheets" />
            <option value="cans" />
            <option value="sets" />
            <option value="pairs" />
            <option value="bottles" />
            <option value="tubes" />
          </datalist>

        </div>
      </div>
    </div>
  );
}
