import React, { useState, useEffect } from 'react';
import './App.css';
import { CONFIG } from './config';
import { apiService } from './services/api';
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
  AutomationPanel,
  Icons
} from './components/Views';

export default function App() {
  // ----------------------------------------------------
  // GLOBAL STATE
  // ----------------------------------------------------
  const [requests, setRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [branding, setBranding] = useState(CONFIG.branding);
  const [activeRole, setActiveRole] = useState("Employee");
  const [notifications, setNotifications] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [toasts, setToasts] = useState([]);
  
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
        const reqs = await apiService.getRequests();
        const sups = await apiService.getSuppliers();
        const auditLogs = await apiService.getLogs();
        
        setRequests(reqs);
        setSuppliers(sups);
        setLogs(auditLogs);

        // Load custom branding if configured in local storage
        const savedBranding = localStorage.getItem("pms_branding");
        if (savedBranding) {
          setBranding(JSON.parse(savedBranding));
        }

        // Active role
        const role = localStorage.getItem("pms_active_role") || "Employee";
        setActiveRole(role);

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

  // ----------------------------------------------------
  // EVENT TRAIL LOGGER & WEBHOOK TRIGGERS
  // ----------------------------------------------------
  const logEvent = async (action, previousValue = "None", updatedValue = "None", details = "") => {
    const user = activeRole === "Admin" ? CONFIG.users.admin : CONFIG.users.employee;
    const newLog = {
      timestamp: new Date().toISOString(),
      userName: user.name,
      role: activeRole,
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
      alert("Please configure a Webhook URL first inside settings or right sidebar!");
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
        { text: "Material Sent", reply: "The material has been dispatched. Here is the LR Copy Link: https://api.alagiri.com/receipt/LR-4421.png" },
        { text: "Delayed", reply: "We regret to inform you that shipment is delayed by 3 days due to transport issues." },
        { text: "Out of Stock", reply: "Apologies, this item is currently out of stock. Lead time is 15 days." },
        { text: "Need Clarification", reply: "Please clarify the dimension specifications for pulley sprocket bearings." }
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
    else if (status === "Material Sent") systemStatus = "In Transit";
    else if (status === "Delayed") systemStatus = "No Response";
    else if (status === "Out of Stock") systemStatus = "Rejected";
    else if (status === "Need Clarification") systemStatus = "Pending";

    const req = requests.find(r => r.id === chatThread.requestId);
    const prevStatus = req.status;

    let lrCopyData = null;
    if (status === "Material Sent") {
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
    addNotification("Supplier Response Received", `Supplier AB Company updated ${chatThread.requestId} status to ${systemStatus}.`, "Both");

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
        initWhatsAppThread
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

    switch (path) {
      case '#home':
      default:
        return <HomeView {...navProps} />;
      case '#create-request':
        return <CreateRequestView {...navProps} />;
      case '#requested-orders':
        return <RequestedOrdersView {...navProps} />;
      case '#po-preview':
        return <PoPreviewView {...navProps} requestId={params.id} />;
      case '#live-orders':
        return <LiveOrdersView {...navProps} />;
      case '#order-details':
        return <OrderDetailsView {...navProps} requestId={params.id} />;
      case '#settings':
        return <SettingsView {...navProps} />;
      case '#settings/suppliers':
        return <SuppliersView {...navProps} />;
      case '#settings/notifications':
        return <NotificationPreferencesView {...navProps} />;
      case '#settings/logs':
        return <AuditLogsView {...navProps} />;
      case '#settings/automation':
        return <AutomationPanel {...navProps} />;
    }
  };

  // Render active bottom floating navigation tabs
  const renderBottomNavTabs = () => {
    const isAdmin = activeRole === "Admin";
    const path = currentHash.split('?')[0];

    const tabs = [
      { path: '#home', label: 'Home', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
      { path: isAdmin ? '#requested-orders' : '#create-request', label: isAdmin ? 'Approvals' : 'Request', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
      { path: '#live-orders', label: 'Orders', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
      { path: '#settings', label: 'Settings', icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
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

  const handleRoleToggle = (role) => {
    setActiveRole(role);
    localStorage.setItem("pms_active_role", role);
    showToast("Role Toggled", `Active role switched to: ${role === 'Admin' ? 'Johnson (Admin)' : 'John (Employee)'}`, "info");
    // Force routing to home on role switch
    window.location.hash = "#home";
  };

  return (
    <div className="simulation-container">
      
      {/* APP MOBILE VIEWPORT CONTAINER */}
      <div className="app-frame-wrapper">
        <div className="device-frame">
          
          {/* Toast Notification Layers */}
          <div className="toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`toast ${t.type}`}>
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
          <div className="bottom-nav-container">
            <nav className="bottom-nav">
              {renderBottomNavTabs()}
            </nav>
          </div>
        </div>
      </div>

      {/* Floating Developer Tools FAB */}
      <button className="floating-dev-toggle" onClick={() => setDevConsoleOpen(true)} title="Developer Tools">
        ⚙️
      </button>

      {/* DEVELOPER SIMULATION CONSOLE BOTTOM DRAWER */}
      <div className={`dev-console-overlay ${devConsoleOpen ? 'open' : ''}`} onClick={() => setDevConsoleOpen(false)}>
        <div className="dev-console-sheet" onClick={e => e.stopPropagation()}>
          <div className="dev-console-header">
            <h3>⚙️ Developer Simulation Console</h3>
            <button className="dev-console-close" onClick={() => setDevConsoleOpen(false)}>✕</button>
          </div>

          <div className="dev-console-content">
            
            {/* Active Testing Role */}
            <div className="simulator-card">
              <h3>👥 Active Testing Role</h3>
              <div className="role-toggle-group">
                <button className={`role-btn ${activeRole === 'Employee' ? 'active' : ''}`} onClick={() => handleRoleToggle('Employee')}>
                  👷 John (Employee)
                </button>
                <button className={`role-btn ${activeRole === 'Admin' ? 'active' : ''}`} onClick={() => handleRoleToggle('Admin')}>
                  👨‍💼 Johnson (Admin)
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#a89f95', marginTop: '8px', lineHeight: '1.3', textAlign: 'left' }}>
                Toggling roles switches routes and permissions inside the app.
              </p>
            </div>

            {/* WhatsApp Supplier Bot */}
            <div className="simulator-card">
              <h3>💬 WhatsApp Supplier Bot</h3>
              <div className="chat-container">
                <div className="chat-messages" style={{ textAlign: 'left' }}>
                  {chatThread ? (
                    chatThread.messages.map((msg, idx) => (
                      <div key={idx} className={`chat-msg ${msg.sender}`}>
                        {msg.sender === 'system' ? (
                          msg.text
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }} />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="chat-msg system">
                      WhatsApp simulation idle. Select a supplier and generate a PO in the app to activate.
                    </div>
                  )}
                </div>

                <div className="chat-inputs">
                  <div className="chat-quick-replies">
                    {chatThread && chatThread.quickReplies.map(chip => (
                      <button key={chip.text} className="reply-chip" onClick={() => handleSupplierChatReply(chip.text, chip.reply)}>
                        {chip.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '11px', color: '#a89f95', marginTop: '8px', lineHeight: '1.3', textAlign: 'left' }}>
                Click a status chip to simulate a WhatsApp reply from the supplier.
              </p>
            </div>

            {/* n8n Automation Webhooks */}
            <div className="simulator-card">
              <h3>⚙️ n8n Automation Webhooks</h3>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label htmlFor="sim-webhook-url" style={{ fontSize: '11px', color: '#e5dec9' }}>Target Webhook Endpoint URL</label>
                <input type="text" id="sim-webhook-url" className="form-control" style={{ backgroundColor: '#1a1918', borderColor: '#474341', color: '#fff', padding: '6px 10px', fontSize: '12px' }} value={webhookUrl} onChange={e => { setWebhookUrl(e.target.value); localStorage.setItem("pms_webhook_url", e.target.value); }} placeholder="https://primary-n8n.domain.com/webhook/..." />
              </div>

              <div className="webhook-row">
                <span>Trigger: <b>New Request</b></span>
                <button className="webhook-btn" onClick={() => handleManualWebhookTrigger("request.new")}>Fire Webhook</button>
              </div>
              <div className="webhook-row">
                <span>Trigger: <b>Approved PO</b></span>
                <button className="webhook-btn" onClick={() => handleManualWebhookTrigger("request.approved")}>Fire Webhook</button>
              </div>
              <div className="webhook-row">
                <span>Trigger: <b>LR Received</b></span>
                <button className="webhook-btn" onClick={() => handleManualWebhookTrigger("lr.uploaded")}>Fire Webhook</button>
              </div>
              <div className="webhook-row">
                <span>Trigger: <b>Reached Warehouse</b></span>
                <button className="webhook-btn" onClick={() => handleManualWebhookTrigger("warehouse.arrival")}>Fire Webhook</button>
              </div>
              <p style={{ fontSize: '11px', color: '#a89f95', marginTop: '8px', lineHeight: '1.3', textAlign: 'left' }}>
                Sends simulated JSON payloads to your webhook URL.
              </p>
            </div>

            {/* Audit Logs */}
            <div className="simulator-card">
              <h3>📜 Audit Trail Logs</h3>
              <div className="log-list">
                {logs.length === 0 ? (
                  <div style={{ color: '#777', textAlign: 'center' }}>Logs empty</div>
                ) : (
                  logs.slice(0, 10).map((log, idx) => {
                    const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false });
                    return (
                      <div key={idx} className="log-item" style={{ textAlign: 'left' }}>
                        <span className="log-time">[{time}]</span>&nbsp;
                        <span className="log-user">{log.userName} ({log.role}):</span>&nbsp;
                        <span className="log-action">{log.action}</span>
                        <div style={{ color: '#8c8276', paddingLeft: '10px' }}>{log.details}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

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

    </div>
  );
}
