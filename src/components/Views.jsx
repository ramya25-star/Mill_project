import React, { useState, useEffect } from 'react';
import { apiService, hashPassword } from '../services/api';

// ----------------------------------------------------
// ICON CONSTANTS (Reusable clean SVG vectors)
// ----------------------------------------------------
export const Icons = {
  Home: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Document: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Clock: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Back: () => <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>,
  Mic: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  Close: () => <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Users: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bell: () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Warning: () => <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>,
  Eye: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeSlash: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  WhatsApp: () => <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366" style={{ marginRight: '6px' }}><path d="M12.012 2c-5.506 0-9.969 4.463-9.969 9.969 0 1.758.459 3.407 1.264 4.849L2.05 21.95l5.289-1.386a9.92 9.92 0 0 0 4.673 1.173c5.507 0 9.97-4.463 9.97-9.97S17.519 2 12.012 2zm0 17.067c-1.482 0-2.929-.398-4.186-1.155l-.3-.178-3.116.817.831-3.039-.196-.312a8.125 8.125 0 0 1-1.246-4.231c0-4.49 3.653-8.143 8.143-8.143 4.49 0 8.143 3.653 8.143 8.143 0 4.49-3.653 8.143-8.143 8.143zm4.463-6.109c-.245-.122-1.45-.714-1.674-.796-.225-.082-.388-.122-.551.122-.164.245-.633.796-.776.959-.143.163-.286.184-.531.061-.245-.122-1.033-.381-1.968-1.216-.728-.65-1.22-1.452-1.363-1.696-.143-.245-.015-.377.108-.499.11-.11.245-.286.368-.429.122-.143.163-.245.245-.408.082-.163.041-.306-.02-.429-.061-.122-.551-1.327-.756-1.817-.199-.48-.4-.413-.551-.421-.143-.007-.306-.007-.47-.007a.903.903 0 0 0-.653.306c-.225.245-.857.837-.857 2.041 0 1.204.877 2.367.999 2.531.122.163 1.726 2.637 4.183 3.698.585.253 1.042.404 1.397.517.587.186 1.122.16 1.545.097.47-.072 1.45-.592 1.654-1.163.204-.571.204-1.061.143-1.163-.061-.102-.225-.163-.47-.286z"/></svg>
};

// Helper format date
const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

// ----------------------------------------------------
// 1. HOME VIEW COMPONENT
// ----------------------------------------------------
export function HomeView({ state, navigateTo, openModal, closeModal, setModalContent }) {
  const [smartOpen, setSmartOpen] = useState(true);
  const user = state.currentUser;
  const isEmployee = user.role === "Employee";

  const userRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name) 
    : state.requests;

  const liveOrderStatuses = ["Approved", "Booked", "Acknowledged", "In Transit", "LR Copy Received", "Reached Warehouse"];
  const totalLiveCount = userRequests.filter(r => liveOrderStatuses.includes(r.status)).length;
  const pendingCount = userRequests.filter(r => r.status === "Pending").length;
  const delayedCount = userRequests.filter(r => ["Delayed", "No Response"].includes(r.status)).length;
  const completedCount = userRequests.filter(r => r.status === "Delivered").length;

  const hr = new Date().getHours();
  const greetingMsg = hr < 12 ? "Good Morning" : hr < 17 ? "Good Afternoon" : "Good Evening";

  let welcomeAlert = "";
  if (user.role === "Employee") {
    welcomeAlert = totalLiveCount > 0
      ? `You have ${totalLiveCount} active orders in progress.`
      : "No active orders. Create a request to get started.";
  } else {
    welcomeAlert = pendingCount > 0
      ? `You have ${pendingCount} pending approvals awaiting review.`
      : "All procurement requests have been processed.";
  }

  const smartRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name) 
    : state.requests;

  const sortedSmart = [...smartRequests]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const openNotifications = () => {
    const list = state.notifications.filter(n => n.role === "Both" || n.role === user.role);
    setModalContent(
      <div>
        <div style={{ maxHeight: '350px', overflowY: 'auto', margin: '-10px -24px 0 -24px' }}>
          {list.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications.</p>
          ) : (
            list.map(n => (
              <div key={n.id} style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: !n.read ? 'rgba(230,126,53,0.05)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <b style={{ color: 'var(--primary-orange)' }}>{n.title}</b>
                  <span>{new Date(n.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'pre-line', lineHeight: '1.4' }}>{n.body}</div>
              </div>
            ))
          )}
        </div>
        <button className="btn-dark" style={{ marginTop: '16px', marginBottom: 0, cursor: 'pointer' }} onClick={() => {
          state.clearNotifications();
          closeModal();
        }}>
          Clear All
        </button>
      </div>,
      "Notifications"
    );
    openModal();
    state.markNotificationsRead();
  };

  const hasUnread = state.notifications.some(n => !n.read && (n.role === "Both" || n.role === user.role));

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <h1>{state.branding.logoText}</h1>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="bell-btn" onClick={openNotifications} style={{ cursor: 'pointer' }}>
            {hasUnread && <span className="bell-badge"></span>}
            <Icons.Bell />
          </button>
          <button className="avatar-btn" onClick={() => navigateTo('#settings')} style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
            <UserAvatar user={user} size={40} />
          </button>
        </div>
      </header>

      <div className="greeting-container">
        <div className="greeting-text">{greetingMsg}, {user.name} 👋</div>
        <div className="greeting-user">{welcomeAlert}</div>
      </div>

      {/* Dynamic Colored Dashboard Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div className="stat-card blue-theme" onClick={() => navigateTo('#live-orders')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: 0, gap: '8px', cursor: 'pointer', padding: '16px', background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: 'var(--border-radius-md)' }}>
          <span style={{ fontSize: '20px' }}>🟦</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1', color: '#1e40af' }}>{totalLiveCount}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Orders</div>
          </div>
        </div>

        <div className="stat-card orange-theme" onClick={() => {
          if (user.role !== 'Employee') {
            navigateTo('#requested-orders');
          }
        }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: 0, gap: '8px', cursor: isEmployee ? 'default' : 'pointer', padding: '16px', background: '#fff7ed', border: '1.5px solid #ffedd5', borderRadius: 'var(--border-radius-md)' }}>
          <span style={{ fontSize: '20px' }}>🟧</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1', color: '#c2410c' }}>{pendingCount}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#ea580c', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {isEmployee ? 'My Pending' : 'Pending Approval'}
            </div>
          </div>
        </div>

        <div className="stat-card red-theme" onClick={() => navigateTo('#live-orders')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: 0, gap: '8px', cursor: 'pointer', padding: '16px', background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: 'var(--border-radius-md)' }}>
          <span style={{ fontSize: '20px' }}>🟥</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1', color: '#b91c1c' }}>{delayedCount}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delayed Orders</div>
          </div>
        </div>

        <div className="stat-card green-theme" onClick={() => navigateTo('#order-history')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: 0, gap: '8px', cursor: 'pointer', padding: '16px', background: '#f0fdf4', border: '1.5px solid #dcfce7', borderRadius: 'var(--border-radius-md)' }}>
          <span style={{ fontSize: '20px' }}>🟩</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1', color: '#15803d' }}>{completedCount}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Orders</div>
          </div>
        </div>
      </div>

      <button className="btn-dark" onClick={() => navigateTo('#create-request')} style={{ cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        Create Request
      </button>

      <div className={`collapsible-section ${smartOpen ? 'open' : ''}`}>
        <div className="collapsible-header" onClick={() => setSmartOpen(!smartOpen)} style={{ cursor: 'pointer' }}>
          <span className="collapsible-title">SMART VIEW</span>
          <div className="collapsible-icon-wrapper">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </div>
        <div className="collapsible-content" style={{ maxHeight: smartOpen ? '500px' : '0' }}>
          {sortedSmart.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No active requests found.
            </div>
          ) : (
            sortedSmart.map(req => (
              <div key={req.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigateTo(`#order-details?id=${req.id}`)}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{req.productName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {req.id} • {formatDate(req.date)} • Qty: {req.qty} {req.units}
                  </div>
                </div>
                <span className={`status-badge ${req.status.toLowerCase().replace(/ /g, '')}`}>{req.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="menu-card" onClick={() => navigateTo('#order-history')} style={{ cursor: 'pointer' }}>
        <span className="menu-card-title">Order history</span>
        <Icons.ChevronRight />
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. CREATE REQUEST VIEW COMPONENT
// ----------------------------------------------------
export function CreateRequestView({ state, navigateTo, addNotification }) {
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("");
  const [units, setUnits] = useState("pcs");
  const [suggestedSupplier, setSuggestedSupplier] = useState("");
  const [billTo, setBillTo] = useState(state.branding.billingLocations[0] || "");
  const [description, setDescription] = useState("");
  const [listening, setListening] = useState(false);
  const user = state.currentUser;
  const isEmployee = user.role === "Employee";

  const handleSubmit = async () => {
    const quantity = parseFloat(qty);
    if (!productName || isNaN(quantity) || quantity <= 0 || !units) {
      alert("Please fill in Product Name, Qty, and Units.");
      return;
    }

    const reqId = `REQ-${1000 + state.requests.length + 1}`;

    const newReq = {
      id: reqId,
      employeeName: user.name,
      department: user.department,
      date: new Date().toISOString(),
      productName,
      qty: quantity,
      units,
      suggestedSupplier: isEmployee ? "" : suggestedSupplier,
      billTo,
      description,
      status: "Pending",
      supplierId: "",
      poNumber: "",
      poDate: "",
      lrCopy: null,
      history: [
        {
          status: "Pending",
          updatedBy: user.name,
          role: user.role,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const saved = await apiService.createRequest(newReq);
    state.setRequests([saved, ...state.requests]);

    state.logEvent("Created Request", "None", "Pending", `Created request ${reqId} for ${productName}.`);

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    addNotification(
      "New Request Created",
      `Employee: ${user.name}\nDept: ${user.department}\nTime: ${timeStr}\nPriority: Normal\nRequest ID: ${reqId}`,
      "Admin"
    );

    // Simulated Hook trigger
    state.triggerWebhook("request.new", saved);

    navigateTo('#home');
  };

  const handleVoiceInput = (e) => {
    e.preventDefault();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setListening(true);
      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setDescription(prev => (prev ? prev + " " + text : text));
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognition.start();
    } else {
      setListening(true);
      // Fallback text simulation
      let phrases = [
        "Replacement parts for main paper pulper conveyor belt. Urgently needed for mill shutdown next week.",
        "Urgent requirement: Heavy-duty 6204 bearings for utility pump assembly. Site Duplex Unit 1.",
        "Lubricating grease high temperature rating. Expected delivery directly to Kraft Mill Unit 2 warehouse."
      ];
      let phrase = phrases[Math.floor(Math.random() * phrases.length)];
      let charIdx = 0;
      const interval = setInterval(() => {
        if (charIdx < phrase.length) {
          setDescription(prev => prev + phrase.charAt(charIdx));
          charIdx++;
        } else {
          clearInterval(interval);
          setListening(false);
        }
      }, 30);
    }
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#home')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '20px' }}>Create Request</h1>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        <div className="form-group">
          <label>Product name</label>
          <input type="text" className="form-control" placeholder="e.g. chain wheel" value={productName} onChange={e => setProductName(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Qty</label>
            <input type="number" className="form-control" placeholder="10" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Units</label>
            <input type="text" className="form-control" placeholder="pcs" list="units-list" value={units} onChange={e => setUnits(e.target.value)} />
          </div>
        </div>

        {/* Suggest supplier is hidden completely for employees */}
        {!isEmployee && (
          <div className="form-group">
            <label>Suggest supplier</label>
            <input type="text" className="form-control" placeholder="e.g. AB company" value={suggestedSupplier} onChange={e => setSuggestedSupplier(e.target.value)} />
          </div>
        )}

        <div className="form-group">
          <label>Bill to</label>
          <select className="form-control" value={billTo} onChange={e => setBillTo(e.target.value)}>
            {state.branding.billingLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Description</label>
          <div className="textarea-container">
            <textarea className="form-control" rows="4" placeholder="Enter specifications..." value={description} onChange={e => setDescription(e.target.value)}></textarea>
            <button className={`mic-btn ${listening ? 'listening' : ''}`} onClick={handleVoiceInput} style={{ cursor: 'pointer' }}>
              <Icons.Mic />
            </button>
          </div>
        </div>

        <button className="btn-dark" onClick={handleSubmit} style={{ marginTop: '10px', cursor: 'pointer' }}>
          Place Request
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. REQUESTED ORDERS VIEW (ADMIN APPROVALS)
// ----------------------------------------------------
export function RequestedOrdersView({ state, navigateTo, addNotification, openModal, closeModal, setModalContent }) {
  const pendingRequests = state.requests.filter(r => r.status === "Pending");
  
  // Custom local state for review card fields
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const data = {};
    pendingRequests.forEach(req => {
      const matchSupplier = state.suppliers.find(s => 
        s.companyName.toLowerCase() === req.suggestedSupplier.toLowerCase() || 
        s.products.toLowerCase().includes(req.productName.split(' ')[0].toLowerCase())
      );
      data[req.id] = {
        productName: req.productName,
        qty: req.qty,
        units: req.units,
        description: req.description,
        billTo: req.billTo,
        supplierId: matchSupplier ? matchSupplier.id : ""
      };
    });
    setFormData(data);
  }, [state.requests, state.suppliers]);

  const updateCardField = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleApprove = async (id) => {
    const cardData = formData[id];
    if (!cardData || !cardData.productName || !cardData.qty || !cardData.supplierId) {
      alert("Please ensure product name, quantity and supplier are filled.");
      return;
    }

    const req = state.requests.find(r => r.id === id);
    const user = state.currentUser;
    const updatedHistory = [...req.history, {
      status: "Approved",
      updatedBy: user.name,
      role: user.role,
      timestamp: new Date().toISOString()
    }];

    const updatedReq = {
      ...req,
      productName: cardData.productName,
      qty: parseFloat(cardData.qty),
      units: cardData.units,
      description: cardData.description,
      billTo: cardData.billTo,
      supplierId: cardData.supplierId,
      poNumber: `PO-${new Date().getFullYear()}-${100 + state.requests.length}`,
      poDate: new Date().toISOString(),
      status: "Approved",
      history: updatedHistory
    };

    const saved = await apiService.updateRequest(id, updatedReq);
    state.setRequests(state.requests.map(r => r.id === id ? saved : r));

    state.logEvent("Approved Request & Edited", "Pending", "Approved", `Admin approved ${id}. Assigned Supplier ID: ${cardData.supplierId}`);
    addNotification("Request Approved", `${cardData.productName} requested by ${req.employeeName} has been approved.`, "Both");

    navigateTo(`#po-preview?id=${id}`);
  };

  const handleReject = async (id) => {
    const reason = prompt("Rejection Reason:") || "Denied by management.";
    const req = state.requests.find(r => r.id === id);
    const user = state.currentUser;
    
    const updatedReq = {
      ...req,
      status: "Rejected",
      history: [...req.history, {
        status: "Rejected",
        updatedBy: user.name,
        role: user.role,
        timestamp: new Date().toISOString(),
        remarks: reason
      }]
    };

    const saved = await apiService.updateRequest(id, updatedReq);
    state.setRequests(state.requests.map(r => r.id === id ? saved : r));

    state.logEvent("Rejected Request", "Pending", "Rejected", `Admin rejected ${id}. Reason: ${reason}`);
    addNotification("Request Rejected", `Request ${id} rejected. Reason: ${reason}`, "Both");
    state.triggerWebhook("request.rejected", saved);
  };

  const openSupplierPicker = (requestId) => {
    const handleSelect = (supId) => {
      updateCardField(requestId, "supplierId", supId);
      closeModal();
    };

    setModalContent(
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', margin: '-10px -24px 0 -24px', padding: '10px 24px' }}>
        {state.suppliers.map(sup => (
          <div key={sup.id} className="live-order-card" style={{ padding: '12px', cursor: 'pointer', margin: '4px 0', border: formData[requestId]?.supplierId === sup.id ? '2.5px solid var(--primary-orange)' : '1.5px solid var(--border-color)', borderRadius: '8px', textAlign: 'left' }} onClick={() => handleSelect(sup.id)}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{sup.companyName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Contact: {sup.contactPerson} | WA: {sup.whatsappNumber}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', background: 'var(--bg-cream)', padding: '4px 8px', borderRadius: '4px' }}>
              Products: {sup.products}
            </div>
          </div>
        ))}
      </div>,
      "Select Supplier"
    );
    openModal();
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#home')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '20px' }}>Requested orders</h1>
        </div>
        <div className="header-right">
          <div style={{ background: '#e5dec9', fontSize: '12px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-main)' }}>
            {pendingRequests.length}
          </div>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        {pendingRequests.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Icons.Warning />
            <p style={{ fontWeight: 600, marginTop: '8px' }}>No pending approvals.</p>
          </div>
        ) : (
          pendingRequests.map((req, idx) => {
            const current = formData[req.id] || { productName: "", qty: "", units: "", description: "", billTo: "", supplierId: "" };
            return (
              <div key={req.id} className="requested-order-card">
                <div className="card-index">{idx + 1}</div>
                
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Product name</label>
                  <input type="text" className="form-control" value={current.productName} onChange={e => updateCardField(req.id, "productName", e.target.value)} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Qty</label>
                    <input type="number" className="form-control" value={current.qty} onChange={e => updateCardField(req.id, "qty", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Units</label>
                    <input type="text" className="form-control" list="units-list" value={current.units} onChange={e => updateCardField(req.id, "units", e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" rows="2" value={current.description} onChange={e => updateCardField(req.id, "description", e.target.value)}></textarea>
                </div>

                <div className="form-group">
                  <label>Bill to</label>
                  <select className="form-control" value={current.billTo} onChange={e => updateCardField(req.id, "billTo", e.target.value)}>
                    {state.branding.billingLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>

                {/* Mobile-friendly Supplier selection button instead of dropdown */}
                <div className="form-group">
                  <label>Select supplier</label>
                  <button type="button" className="form-control" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--card-bg)' }} onClick={() => openSupplierPicker(req.id)}>
                    <span style={{ color: current.supplierId ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {current.supplierId ? state.suppliers.find(s => s.id === current.supplierId)?.companyName : "-- Choose Supplier --"}
                    </span>
                    <Icons.ChevronRight />
                  </button>
                </div>

                <div className="card-actions-row">
                  <button className="btn-dark" style={{ backgroundColor: 'var(--status-red)', marginBottom: 0, padding: '10px', cursor: 'pointer' }} onClick={() => handleReject(req.id)}>Reject</button>
                  <button className="btn-orange" style={{ flex: 1.5, padding: '10px', cursor: 'pointer' }} onClick={() => handleApprove(req.id)}>Generate PO</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. PO PREVIEW VIEW COMPONENT
// ----------------------------------------------------
export function PoPreviewView({ state, navigateTo, requestId, addNotification }) {
  const req = state.requests.find(r => r.id === requestId);
  if (!req) return <p style={{ padding: '20px' }}>Order not found</p>;

  const supplier = state.suppliers.find(s => s.id === req.supplierId) || {};
  const branding = state.branding;

  const formattedMsg = `*PROCUREMENT ORDER: ${req.poNumber}*
Company: *${branding.companyName}*
Date: ${new Date(req.poDate).toLocaleDateString('en-GB')}
Delivery Location: *${req.billTo}*
----------------------------------------
*Material Required:* ${req.productName}
*Quantity:* ${req.qty} ${req.units}
*Details:* ${req.description || "N/A"}
----------------------------------------
*Instructions:* Please acknowledge receipt of this PO. Upload LR Copy once shipment is sent.`;

  const handleShareWhatsApp = async () => {
    const url = `https://api.whatsapp.com/send?phone=${supplier.whatsappNumber}&text=${encodeURIComponent(formattedMsg)}`;
    
    // Set status to Booked
    const updatedHistory = [...req.history, {
      status: "Booked",
      updatedBy: state.users.admin.name,
      role: "Admin",
      timestamp: new Date().toISOString(),
      remarks: "PO dispatched to WhatsApp."
    }];
    const updatedReq = { ...req, status: "Booked", history: updatedHistory };
    const saved = await apiService.updateRequest(requestId, updatedReq);
    state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

    state.logEvent("WhatsApp Message Sent", "Approved", "Booked", `Sent PO via WhatsApp to ${supplier.companyName}`);
    addNotification("Order Updated", `Order ${requestId} status changed to Booked`, "Both");
    state.triggerWebhook("status.changed", saved);

    // Initial WhatsApp Simulator thread
    state.initWhatsAppThread(requestId, formattedMsg);

    window.open(url, '_blank');
    navigateTo('#live-orders');
  };

  const handleShareMail = async () => {
    const url = `mailto:${supplier.email}?subject=Purchase Order Confirmation&body=${encodeURIComponent(formattedMsg)}`;

    const updatedHistory = [...req.history, {
      status: "Booked",
      updatedBy: state.users.admin.name,
      role: "Admin",
      timestamp: new Date().toISOString(),
      remarks: "PO dispatched via email."
    }];
    const updatedReq = { ...req, status: "Booked", history: updatedHistory };
    const saved = await apiService.updateRequest(requestId, updatedReq);
    state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

    state.logEvent("Email PO Sent", "Approved", "Booked", `Sent PO via email to ${supplier.email}`);
    addNotification("Order Updated", `Order ${requestId} status changed to Booked`, "Both");

    window.open(url, '_blank');
    navigateTo('#live-orders');
  };

  const handleShareBoth = async () => {
    const updatedHistory = [...req.history, {
      status: "Booked",
      updatedBy: state.users.admin.name,
      role: "Admin",
      timestamp: new Date().toISOString(),
      remarks: "PO dispatched via email and WhatsApp."
    }];
    const updatedReq = { ...req, status: "Booked", history: updatedHistory };
    const saved = await apiService.updateRequest(requestId, updatedReq);
    state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

    state.logEvent("PO Shared via WhatsApp & Email", "Approved", "Booked", `Dispatched PO to ${supplier.companyName}`);
    addNotification("Order Booked", `Order ${requestId} has been updated to Booked.`, "Both");
    
    state.initWhatsAppThread(requestId, formattedMsg);

    window.open(`mailto:${supplier.email}?subject=Purchase Order Confirmation&body=${encodeURIComponent(formattedMsg)}`, '_blank');
    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?phone=${supplier.whatsappNumber}&text=${encodeURIComponent(formattedMsg)}`, '_blank');
    }, 500);

    navigateTo('#live-orders');
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#requested-orders')}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>PO Preview</h1>
        </div>
      </header>

      <div>
        <div className="po-document">
          <div className="po-header-section">
            <div>
              <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--primary-orange)' }}>{branding.logoText} PO</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{branding.companyName}</div>
            </div>
            <div className="po-meta">
              <div className="po-title">PURCHASE ORDER</div>
              <div style={{ marginTop: '4px' }}><b>PO No:</b> {req.poNumber}</div>
              <div><b>Date:</b> {new Date(req.poDate).toLocaleDateString('en-GB')}</div>
            </div>
          </div>

          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <div>
              <b style={{ color: '#666' }}>Supplier:</b><br />
              <b>{supplier.companyName || "N/A"}</b><br />
              {supplier.address || ""}<br />
              Contact: {supplier.contactPerson || ""}<br />
              Ph: {supplier.phoneNumber || ""}
            </div>
            <div style={{ textAlign: 'right' }}>
              <b style={{ color: '#666' }}>Delivery Site:</b><br />
              <b>{req.billTo}</b><br />
              Expected delivery: 7 days
            </div>
          </div>

          <table className="po-table">
            <thead>
              <tr>
                <th style={{ fontSize: '10px' }}>Item</th>
                <th style={{ fontSize: '10px' }}>Qty</th>
                <th style={{ fontSize: '10px', textAlign: 'right' }}>Rate</th>
                <th style={{ fontSize: '10px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>{req.productName}</b>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{req.description}</div>
                </td>
                <td>{req.qty} {req.units}</td>
                <td style={{ textAlign: 'right' }}>$150.00</td>
                <td style={{ textAlign: 'right', fontWeight: '700' }}>${(req.qty * 150.00).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="po-signature">
            Authorized Signatory<br />
            <span style={{ fontWeight: 'bold', color: 'var(--primary-orange)' }}>{CONFIG.users.admin.name}</span>
          </div>
        </div>

        <button className="btn-dark" onClick={handleShareWhatsApp} style={{ backgroundColor: '#128c7e', marginBottom: '10px' }}>
          Share in Whatsapp
        </button>

        <button className="btn-dark" onClick={handleShareMail} style={{ backgroundColor: '#2a2726', marginBottom: '10px' }}>
          Share in Mail
        </button>

        <button className="btn-dark" onClick={handleShareBoth} style={{ backgroundColor: 'var(--primary-orange)', marginBottom: '20px' }}>
          Share in both
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. LIVE ORDERS VIEW COMPONENT
// ----------------------------------------------------
export function LiveOrdersView({ state, navigateTo }) {
  const user = state.currentUser;
  const isEmployee = user.role === "Employee";

  const liveOrderStatuses = ["Approved", "Booked", "Acknowledged", "Picked", "In Transit", "LR Copy Received", "Reached Warehouse"];
  
  const filteredRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name && liveOrderStatuses.includes(r.status)) 
    : state.requests.filter(r => liveOrderStatuses.includes(r.status));

  const sorted = [...filteredRequests].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#home')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '20px' }}>Live orders</h1>
        </div>
        <div className="header-right">
          <div style={{ background: '#e5dec9', fontSize: '12px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-main)' }}>
            {filteredRequests.length}
          </div>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active live orders found.
          </div>
        ) : (
          sorted.map(req => {
            const supplier = state.suppliers.find(s => s.id === req.supplierId) || { companyName: "Not Assigned" };
            return (
              <div key={req.id} className="live-order-card" onClick={() => navigateTo(`#order-details?id=${req.id}`)} style={{ cursor: 'pointer' }}>
                <div className="card-header-row">
                  <h3>{supplier.companyName}</h3>
                  <span className="badge-view-details">View Details</span>
                </div>
                
                <div className="card-product-line">
                  Product name - <b>{req.productName}</b> ({req.qty} {req.units})
                </div>

                <div className="card-status-line">
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{req.id}</span>
                  <span className={`status-badge ${req.status.toLowerCase().replace(/ /g, '')}`}>{req.status}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 6. ORDER DETAILS & TIMELINE COMPONENT
// ----------------------------------------------------
export function OrderDetailsView({ state, navigateTo, requestId, addNotification, openModal, setModalContent }) {
  const req = state.requests.find(r => r.id === requestId);
  if (!req) return <p style={{ padding: '20px' }}>Order not found</p>;

  const supplier = state.suppliers.find(s => s.id === req.supplierId) || { companyName: "Not Assigned" };
  const dateStr = new Date(req.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = new Date(req.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const trackingStages = ["Picked", "In Transit", "Reached Warehouse", "Delivered"];
  const currentStageIdx = trackingStages.indexOf(req.status);

  let progressWidth = 0;
  if (req.status === "Picked") progressWidth = 0;
  else if (req.status === "In Transit" || req.status === "LR Copy Received") progressWidth = 33;
  else if (req.status === "Reached Warehouse") progressWidth = 66;
  else if (req.status === "Delivered") progressWidth = 100;

  const handleStatusChange = async (newStatus, remarks = "") => {
    if (!newStatus) return;
    const prevStatus = req.status;

    const updatedHistory = [...req.history, {
      status: newStatus,
      updatedBy: state.currentUser.name,
      role: state.currentUser.role,
      timestamp: new Date().toISOString(),
      remarks: remarks || `Status changed from ${prevStatus} to ${newStatus}.`
    }];

    const updatedReq = {
      ...req,
      status: newStatus,
      history: updatedHistory
    };

    const saved = await apiService.updateRequest(requestId, updatedReq);
    state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

    state.logEvent("Status Changed Manually", prevStatus, newStatus, `Manual status override to: ${newStatus}`);
    addNotification("Status Updated", `Order ${requestId} status is now ${newStatus}.`, "Both");

    let eventKey = "request.updated";
    if (newStatus === "In Transit") eventKey = "request.transit";
    else if (newStatus === "Reached Warehouse") eventKey = "warehouse.arrival";
    else if (newStatus === "Delivered") eventKey = "request.delivered";

    state.triggerWebhook(eventKey, saved);
  };

  const handleLrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result;
      const updatedHistory = [...req.history, {
        status: "LR Copy Received",
        updatedBy: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: new Date().toISOString(),
        remarks: "Uploaded LR consignment copy."
      }];

      const updatedReq = {
        ...req,
        status: "LR Copy Received",
        lrCopy: base64data,
        history: updatedHistory
      };

      const saved = await apiService.updateRequest(requestId, updatedReq);
      state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

      state.logEvent("Uploaded LR Consignment", req.status, "LR Copy Received", `Uploaded copy for ${requestId}`);
      addNotification("LR Copy Received", `LR Copy has been uploaded for ${requestId}.`, "Both");
      state.triggerWebhook("lr.uploaded", saved);
    };
    reader.readAsDataURL(file);
  };

  const handleViewLr = () => {
    if (!req.lrCopy) return;
    setModalContent(
      <div style={{ textAlign: 'center' }}>
        {req.lrCopy.startsWith("data:image") ? (
          <img src={req.lrCopy} style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }} alt="LR Copy" />
        ) : (
          <iframe src={req.lrCopy} style={{ width: '100%', height: '350px', border: 'none' }} title="LR Document"></iframe>
        )}
      </div>,
      "LR Consignment Preview"
    );
    openModal();
  };

  const handleVerifyDeliver = () => {
    const remarks = prompt("Enter delivery verification remarks:") || "Physically verified and counted.";
    handleStatusChange("Delivered", remarks);
  };

  const hasEditPermission = state.currentUser.role === 'Main Admin' || (state.currentUser.role === 'Sub Admin' && state.currentUser.permissions?.edit_orders);

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#live-orders')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>Order details</h1>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', textAlign: 'left' }}>{supplier.companyName}</h3>
          <span className={`status-badge ${req.status.toLowerCase().replace(/ /g, '')}`}>{req.status}</span>
        </div>

        {req.poNumber && <div style={{ fontSize: '12px', marginBottom: '14px', textAlign: 'left' }}><b>PO Ref:</b> {req.poNumber} ({formatDate(req.poDate)})</div>}

        {req.lrCopy ? (
          <div className="lr-upload-box" style={{ borderStyle: 'solid', backgroundColor: '#f0fdf4', borderColor: 'var(--status-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={handleViewLr}>
            <div className="lr-text-primary" style={{ color: 'var(--status-green)' }}>LR Copy Attached</div>
            <span className="badge-view-lr" style={{ backgroundColor: 'var(--status-green)' }}>View LR</span>
          </div>
        ) : (
          <div className="lr-upload-box" style={{ cursor: 'pointer' }}>
            <div className="lr-text-primary">Upload LR Copy</div>
            <input type="file" accept="image/*,application/pdf" onChange={handleLrUpload} style={{ cursor: 'pointer' }} />
            <span className="badge-view-lr">Select File</span>
          </div>
        )}

        <div className="timeline-container">
          <h4 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logistics timeline</h4>
          <div className="timeline">
            <div className="timeline-progress-bar" style={{ width: `${progressWidth}%` }}></div>
            {trackingStages.map((stage, idx) => {
              let stateClass = "";
              if (idx < currentStageIdx) stateClass = "completed";
              else if (idx === currentStageIdx) stateClass = "active";
              else if (req.status === "Delivered") stateClass = "completed";

              return (
                <div key={stage} className={`timeline-step ${stateClass}`}>
                  <div className="timeline-dot">{idx + 1}</div>
                  <div className="timeline-label">{stage}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Description</label>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '12px', fontSize: '13px', lineHeight: '1.4', minHeight: '60px', textAlign: 'left' }}>
            {req.description || "No specifications provided."}
          </div>
        </div>

        {req.status === "Reached Warehouse" && (
          <button className="btn-dark" onClick={handleVerifyDeliver} style={{ backgroundColor: 'var(--status-green)', marginTop: '16px', cursor: 'pointer' }}>
            Verify & Mark Delivered
          </button>
        )}

        {hasEditPermission && (
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Change status</label>
            <select className="form-control" onChange={e => handleStatusChange(e.target.value)} defaultValue="" style={{ cursor: 'pointer' }}>
              <option value="" disabled>-- Choose New Status --</option>
              {["Approved", "Booked", "Acknowledged", "Picked", "In Transit", "Reached Warehouse", "Delivered"].map(s => (
                <option key={s} value={s} disabled={req.status === s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}


// ----------------------------------------------------
// Password Strength Validator Helper & UI Indicator Component
// ----------------------------------------------------
export const isPasswordStrong = (password) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?\":{}|<>]/.test(password)
  );
};

export function PasswordStrengthIndicator({ password }) {
  const rules = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", valid: /[a-z]/.test(password) },
    { label: "One number (0-9)", valid: /[0-9]/.test(password) },
    { label: "One special character (e.g. !@#$%^&*)", valid: /[!@#$%^&*(),.?\":{}|<>]/.test(password) }
  ];

  return (
    <div style={{ marginTop: '8px', fontSize: '11px', lineHeight: '1.4', background: '#f9f9f8', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', textAlign: 'left' }}>
      <div style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>Password Requirements:</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
        {rules.map((rule, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: rule.valid ? '#16a34a' : 'var(--text-muted)', transition: 'color 0.2s' }}>
            <span style={{ fontWeight: 'bold' }}>{rule.valid ? "✓" : "○"}</span>
            <span>{rule.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Change Password Form Component (with visibility toggles)
// ----------------------------------------------------
export function ChangePasswordForm({ user, apiService, closeModal }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleSavePassword = async (e) => {
    e.preventDefault();
    const form = e.target;
    const currentPass = form.elements.currentPass.value;

    if (!isPasswordStrong(newPass)) {
      alert("Please ensure your password meets all strength requirements.");
      return;
    }
    if (newPass !== confirmPass) {
      alert("New passwords do not match");
      return;
    }

    try {
      await apiService.changePassword(user.id, currentPass, newPass);
      alert("Password changed successfully!");
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSavePassword} style={{ textAlign: 'left' }}>
      <div className="form-group">
        <label>Current Password</label>
        <div style={{ position: 'relative' }}>
          <input type={showCurrent ? "text" : "password"} name="currentPass" className="form-control" required style={{ cursor: 'text', paddingRight: '40px' }} />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title={showCurrent ? "Hide password" : "Show password"}>
            {showCurrent ? <Icons.EyeSlash /> : <Icons.Eye />}
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <label>New Password</label>
        <div style={{ position: 'relative' }}>
          <input type={showNew ? "text" : "password"} name="newPass" value={newPass} onChange={e => setNewPass(e.target.value)} className="form-control" required style={{ cursor: 'text', paddingRight: '40px' }} />
          <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title={showNew ? "Hide password" : "Show password"}>
            {showNew ? <Icons.EyeSlash /> : <Icons.Eye />}
          </button>
        </div>
        <PasswordStrengthIndicator password={newPass} />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label>Confirm Password</label>
        <div style={{ position: 'relative' }}>
          <input type={showConfirm ? "text" : "password"} name="confirmPass" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="form-control" required style={{ cursor: 'text', paddingRight: '40px' }} />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title={showConfirm ? "Hide password" : "Show password"}>
            {showConfirm ? <Icons.EyeSlash /> : <Icons.Eye />}
          </button>
        </div>
      </div>
      <button type="submit" className="btn-dark" style={{ cursor: 'pointer' }}>Change Password</button>
    </form>
  );
}

// ----------------------------------------------------
// 7. SETTINGS MAIN VIEW COMPONENT
// ----------------------------------------------------
export function SettingsView({ state, navigateTo, openModal, closeModal, setModalContent }) {
  const user = state.currentUser;
  const isMainAdmin = user.role === "Main Admin";
  const isSubAdmin = user.role === "Sub Admin";

  const showSuppliers = isMainAdmin || (isSubAdmin && user.permissions?.manage_suppliers);
  const showLogs = isMainAdmin || (isSubAdmin && user.permissions?.view_logs);

  const openChangePasswordModal = () => {
    setModalContent(
      <ChangePasswordForm user={user} apiService={apiService} closeModal={closeModal} />,
      "Change Password"
    );
    openModal();
  };

  const handleSaveAvatar = async (updatedUser) => {
    await apiService.saveUser(updatedUser);
    state.setCurrentUser(updatedUser);
    alert("Avatar setting saved successfully!");
    closeModal();
  };

  const openAvatarModal = () => {
    setModalContent(
      <AvatarEditor user={user} onSave={handleSaveAvatar} onClose={closeModal} />,
      "Customize Avatar"
    );
    openModal();
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#home')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '20px' }}>Settings</h1>
        </div>
      </header>

      <div>
        <div className="stat-card" style={{ marginBottom: '24px', padding: '16px', cursor: 'pointer' }} onClick={openAvatarModal}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <UserAvatar user={user} size={48} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user.role} ({user.department})</div>
            </div>
          </div>
          <Icons.ChevronRight />
        </div>

        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px', paddingLeft: '4px', textAlign: 'left' }}>
          Account Settings
        </div>

        <div className="settings-menu">
          {showSuppliers && (
            <div className="settings-item" onClick={() => navigateTo('#settings/suppliers')} style={{ cursor: 'pointer' }}>
              <div className="settings-item-left">
                <Icons.Users />
                <span className="settings-title">Supplier Database</span>
              </div>
              <Icons.ChevronRight />
            </div>
          )}

          {isMainAdmin && (
            <div className="settings-item" onClick={() => navigateTo('#settings/users')} style={{ cursor: 'pointer' }}>
              <div className="settings-item-left">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: 'var(--primary-orange)' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                <span className="settings-title">User Management</span>
              </div>
              <Icons.ChevronRight />
            </div>
          )}

          <div className="settings-item" onClick={() => navigateTo('#settings/notifications')} style={{ cursor: 'pointer' }}>
            <div className="settings-item-left">
              <Icons.Bell />
              <span className="settings-title">Notification Preferences</span>
            </div>
            <Icons.ChevronRight />
          </div>

          {showLogs && (
            <div className="settings-item" onClick={() => navigateTo('#settings/logs')} style={{ cursor: 'pointer' }}>
              <div className="settings-item-left">
                <Icons.Document />
                <span className="settings-title">Audit Trail Logs</span>
              </div>
              <Icons.ChevronRight />
            </div>
          )}

          <div className="settings-item" onClick={openChangePasswordModal} style={{ cursor: 'pointer' }}>
            <div className="settings-item-left">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: 'var(--primary-orange)' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span className="settings-title">Change Password</span>
            </div>
            <Icons.ChevronRight />
          </div>

          <div className="settings-item" style={{ color: 'var(--status-red)', cursor: 'pointer' }} onClick={() => {
            state.setCurrentUser(null);
            localStorage.removeItem("pms_current_user");
            navigateTo('#home');
          }}>
            <div className="settings-item-left">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: 'var(--status-red)' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              <span className="settings-title" style={{ fontWeight: '700' }}>Log out</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 8. SUPPLIERS MANAGER SUB-VIEW COMPONENT
// ----------------------------------------------------
export function SuppliersView({ state, navigateTo, openModal, setModalContent, closeModal }) {
  const isAdmin = state.activeRole === "Admin";
  const [suppliers, setSuppliers] = useState(state.suppliers);

  useEffect(() => {
    setSuppliers(state.suppliers);
  }, [state.suppliers]);

  const handleSaveSupplier = async (supplierData, isEdit = false) => {
    if (isEdit) {
      const saved = await apiService.updateSupplier(supplierData.id, supplierData);
      state.setSuppliers(state.suppliers.map(s => s.id === supplierData.id ? saved : s));
    } else {
      const saved = await apiService.addSupplier(supplierData);
      state.setSuppliers([...state.suppliers, saved]);
    }
    closeModal();
  };

  const openAddDialog = () => {
    setModalContent(
      <SupplierForm onSave={handleSaveSupplier} />,
      "Add Supplier"
    );
    openModal();
  };

  const openEditDialog = (sup) => {
    setModalContent(
      <SupplierForm supplier={sup} onSave={handleSaveSupplier} />,
      "Edit Supplier"
    );
    openModal();
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#settings')}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>Suppliers</h1>
        </div>
        <div className="header-right">
          {isAdmin && <button className="btn-orange" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={openAddDialog}>Add New</button>}
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        {suppliers.map(sup => (
          <div key={sup.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '16px', marginBottom: '12px', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>{sup.companyName}</h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Contact: {sup.contactPerson}</div>
              </div>
              {isAdmin && <button className="badge-view-details" onClick={() => openEditDialog(sup)} style={{ backgroundColor: 'var(--primary-orange)' }}>Edit</button>}
            </div>
            <div style={{ fontSize: '12px', marginBottom: '6px', lineHeight: '1.4' }}>
              <b>WA:</b> {sup.whatsappNumber} &nbsp;&bull;&nbsp; <b>Email:</b> {sup.email}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-cream)', padding: '6px 10px', borderRadius: '4px', marginTop: '6px' }}>
              <b>Products:</b> {sup.products}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupplierForm({ supplier, onSave }) {
  const [company, setCompany] = useState(supplier ? supplier.companyName : "");
  const [contact, setContact] = useState(supplier ? supplier.contactPerson : "");
  const [phone, setPhone] = useState(supplier ? supplier.whatsappNumber : "");
  const [email, setEmail] = useState(supplier ? supplier.email : "");
  const [address, setAddress] = useState(supplier ? supplier.address : "");
  const [products, setProducts] = useState(supplier ? supplier.products : "");

  const handleSave = () => {
    if (!company || !contact || !phone) {
      alert("Please fill in Company name, Contact person, and phone.");
      return;
    }
    const data = {
      id: supplier ? supplier.id : `sup-${Date.now()}`,
      companyName: company,
      contactPerson: contact,
      whatsappNumber: phone,
      phoneNumber: phone,
      email,
      address,
      products,
      remarks: supplier ? supplier.remarks : ""
    };
    onSave(data, !!supplier);
  };

  return (
    <div>
      <div className="form-group">
        <label>Company Name</label>
        <input type="text" className="form-control" value={company} onChange={e => setCompany(e.target.value)} />
      </div>
      <div class="form-group">
        <label>Contact Person</label>
        <input type="text" className="form-control" value={contact} onChange={e => setContact(e.target.value)} />
      </div>
      <div class="form-group">
        <label>WhatsApp Number</label>
        <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div class="form-group">
        <label>Address</label>
        <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div class="form-group">
        <label>Products Supplied</label>
        <input type="text" className="form-control" value={products} onChange={e => setProducts(e.target.value)} />
      </div>
      <button className="btn-dark" onClick={handleSave} style={{ marginTop: '10px' }}>Save</button>
    </div>
  );
}

// ----------------------------------------------------
// 9. NOTIFICATION PREFERENCES VIEW COMPONENT
// ----------------------------------------------------
export function NotificationPreferencesView({ state, navigateTo }) {
  const [whatsapp, setWhatsapp] = useState(localStorage.getItem("pms_notif_pref_whatsapp") !== "false");
  const [appNotifs, setAppNotifs] = useState(localStorage.getItem("pms_notif_pref_app") !== "false");

  const handleToggle = (type) => {
    if (type === 'whatsapp') {
      const val = !whatsapp;
      setWhatsapp(val);
      localStorage.setItem("pms_notif_pref_whatsapp", val ? "true" : "false");
      state.logEvent("Toggled Notification Preferences", "WhatsApp Preference", val ? "Enabled" : "Disabled");
    } else {
      const val = !appNotifs;
      setAppNotifs(val);
      localStorage.setItem("pms_notif_pref_app", val ? "true" : "false");
      state.logEvent("Toggled Notification Preferences", "App Preference", val ? "Enabled" : "Disabled");
    }
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#settings')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>Preferences</h1>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.WhatsApp /> WhatsApp Alerts
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Receive automated alerts via WhatsApp.</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={whatsapp} onChange={() => handleToggle('whatsapp')} style={{ cursor: 'pointer' }} />
              <span className="slider round"></span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>🔔</span> App Push Toast
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Get real-time push toast alerts inside app.</div>
            </div>
            <label className="switch">
              <input type="checkbox" checked={appNotifs} onChange={() => handleToggle('app')} style={{ cursor: 'pointer' }} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 10. AUDIT TRAIL LOGS VIEW COMPONENT
// ----------------------------------------------------
export function AuditLogsView({ state, navigateTo }) {
  const [logs, setLogs] = useState(state.logs);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = query.toLowerCase();
    const filtered = state.logs.filter(log => 
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
    setLogs(filtered);
  }, [query, state.logs]);

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,User,Role,Action,Previous Value,Updated Value,Details\n";

    state.logs.forEach(log => {
      const row = [
        log.timestamp,
        `"${log.userName}"`,
        `"${log.role}"`,
        `"${log.action}"`,
        `"${log.previousValue}"`,
        `"${log.updatedValue}"`,
        `"${log.details ? log.details.replace(/"/g, '""') : ''}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Alagiri_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#settings')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>Audit Trail Logs</h1>
        </div>
        <div className="header-right">
          <button className="btn-orange" style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer' }} onClick={handleExport}>Export CSV</button>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        <div className="form-group">
          <input type="text" className="form-control" placeholder="Search logs..." value={query} onChange={e => setQuery(e.target.value)} style={{ cursor: 'text' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No logs found.</p>
          ) : (
            logs.map((log, idx) => {
              const timeStr = new Date(log.timestamp).toLocaleString('en-GB');
              return (
                <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '12px', fontSize: '12px', lineHeight: '1.4', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px' }}>
                    <span>{timeStr}</span>
                    <b>{log.userName} ({log.role})</b>
                  </div>
                  <div><b>Action:</b> {log.action}</div>
                  {log.previousValue !== "None" || log.updatedValue !== "None" ? (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.previousValue} &rarr; {log.updatedValue}
                    </div>
                  ) : null}
                  {log.details && <div style={{ fontSize: '11px', background: 'var(--bg-cream)', padding: '4px 8px', borderRadius: '4px', marginTop: '6px', color: '#555' }}>{log.details}</div>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 11. ORDER HISTORY VIEW COMPONENT
// ----------------------------------------------------
export function OrderHistoryView({ state, navigateTo }) {
  const user = state.currentUser;
  const isEmployee = user.role === "Employee";

  const historyStatuses = ["Delivered", "Rejected"];
  
  const filteredRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name && historyStatuses.includes(r.status)) 
    : state.requests.filter(r => historyStatuses.includes(r.status));

  const sorted = [...filteredRequests].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#home')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '20px' }}>Order history</h1>
        </div>
        <div className="header-right">
          <div style={{ background: '#e5dec9', fontSize: '12px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-main)' }}>
            {filteredRequests.length}
          </div>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No completed history found.
          </div>
        ) : (
          sorted.map(req => {
            const supplier = state.suppliers.find(s => s.id === req.supplierId) || { companyName: "Not Assigned" };
            return (
              <div key={req.id} className="live-order-card" onClick={() => navigateTo(`#order-details?id=${req.id}`)} style={{ cursor: 'pointer' }}>
                <div className="card-header-row">
                  <h3>{supplier.companyName}</h3>
                  <span className="badge-view-details">Details</span>
                </div>
                
                <div className="card-product-line">
                  Product name - <b>{req.productName}</b> ({req.qty} {req.units})
                </div>

                <div className="card-status-line">
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{req.id}</span>
                  <span className={`status-badge ${req.status.toLowerCase().replace(/ /g, '')}`}>{req.status}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 12. LOGIN VIEW COMPONENT
// ----------------------------------------------------
export function LoginView({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Registration (Sign In / Create Account) fields
  const [regUsername, setRegUsername] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regDepartment, setRegDepartment] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in both fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await apiService.authenticate(username, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regUsername || !regFullName || !regDepartment || !regPassword || !regConfirmPass) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isPasswordStrong(regPassword)) {
      setError("Please ensure your password meets all strength requirements.");
      return;
    }
    if (regPassword !== regConfirmPass) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Check if username already exists
      const users = await apiService.getUsers();
      const exists = users.some(u => u.username.toLowerCase() === regUsername.toLowerCase());
      if (exists) {
        throw new Error("Username already exists. Please choose another.");
      }

      // Hash password
      const passwordHash = await hashPassword(regPassword);

      // Create new user object - Force Employee role for security
      const newUser = {
        id: "usr-" + Math.random().toString(36).slice(-8),
        username: regUsername,
        name: regFullName,
        role: "Employee",
        department: regDepartment,
        passwordHash,
        enabled: true,
        mustChangePassword: false, 
        avatar: "",
        permissions: null
      };

      await apiService.saveUser(newUser);
      alert("Registration successful! Logging you in.");
      onLogin(newUser);
    } catch (err) {
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--primary-orange)', fontWeight: '800' }}>Alagiri</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Procurement & Logistics System</p>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
        
        {/* Toggle tabs for Log In vs Sign In (Register) */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border-color)', marginBottom: '20px' }}>
          <button type="button" onClick={() => { setIsRegistering(false); setError(""); }} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: !isRegistering ? '2px solid var(--primary-orange)' : 'none', fontWeight: !isRegistering ? '800' : '600', color: !isRegistering ? 'var(--primary-orange)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
            Log In
          </button>
          <button type="button" onClick={() => { setIsRegistering(true); setError(""); }} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: isRegistering ? '2px solid var(--primary-orange)' : 'none', fontWeight: isRegistering ? '800' : '600', color: isRegistering ? 'var(--primary-orange)' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
            Sign In (Register)
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'left' }}>
            ⚠️ {error}
          </div>
        )}

        {!isRegistering ? (
          /* LOG IN FORM */
          <form onSubmit={handleLoginSubmit} style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)' }}>Sign In to your account</h2>
            
            <div className="form-group">
              <label>Username</label>
              <input type="text" className="form-control" placeholder="Enter Username" value={username} onChange={e => setUsername(e.target.value)} required style={{ cursor: 'text' }} />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} className="form-control" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ cursor: 'text', paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <Icons.EyeSlash /> : <Icons.Eye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-orange" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>
        ) : (
          /* SIGN IN (REGISTRATION) FORM */
          <form onSubmit={handleRegisterSubmit} style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-main)' }}>Register New Account</h2>
            
            <div className="form-group">
              <label>Username</label>
              <input type="text" className="form-control" placeholder="e.g. johndoe" value={regUsername} onChange={e => setRegUsername(e.target.value)} required style={{ cursor: 'text' }} />
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-control" placeholder="e.g. John Doe" value={regFullName} onChange={e => setRegFullName(e.target.value)} required style={{ cursor: 'text' }} />
            </div>

            <div className="form-group">
              <label>Department</label>
              <input type="text" className="form-control" placeholder="e.g. Maintenance" value={regDepartment} onChange={e => setRegDepartment(e.target.value)} required style={{ cursor: 'text' }} />
            </div>



            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showRegPassword ? "text" : "password"} className="form-control" placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} required style={{ cursor: 'text', paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title={showRegPassword ? "Hide password" : "Show password"}>
                  {showRegPassword ? <Icons.EyeSlash /> : <Icons.Eye />}
                </button>
              </div>
              <PasswordStrengthIndicator password={regPassword} />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showRegConfirm ? "text" : "password"} className="form-control" placeholder="••••••••" value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} required style={{ cursor: 'text', paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowRegConfirm(!showRegConfirm)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title={showRegConfirm ? "Hide password" : "Show password"}>
                  {showRegConfirm ? <Icons.EyeSlash /> : <Icons.Eye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-orange" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>
              {loading ? "Registering..." : "Register (Sign In)"}
            </button>
          </form>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
        Version 2.0.0 • Secure Authentication
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 13. FORCE CHANGE PASSWORD VIEW
// ----------------------------------------------------
export function ForceChangePasswordView({ user, onPasswordChanged }) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordStrong(newPass)) {
      setError("Please ensure your password meets all strength requirements.");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const updatedUser = await apiService.forceChangePassword(user.id, newPass);
      alert("Password changed successfully! Welcome to Alagiri.");
      onPasswordChanged(updatedUser);
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--primary-orange)', fontWeight: '800' }}>Setup New Password</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>For security, you must update your temporary password on your first login.</p>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showNewPass ? "text" : "password"} className="form-control" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} required style={{ cursor: 'text', paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title={showNewPass ? "Hide password" : "Show password"}>
                {showNewPass ? <Icons.EyeSlash /> : <Icons.Eye />}
              </button>
            </div>
            <PasswordStrengthIndicator password={newPass} />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirmPass ? "text" : "password"} className="form-control" placeholder="••••••••" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required style={{ cursor: 'text', paddingRight: '40px' }} />
              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} title={showConfirmPass ? "Hide password" : "Show password"}>
                {showConfirmPass ? <Icons.EyeSlash /> : <Icons.Eye />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-orange" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '14px', cursor: 'pointer' }}>
            {loading ? "Updating..." : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 14. USER MANAGEMENT VIEW COMPONENT
// ----------------------------------------------------
export function UserManagementView({ state, navigateTo }) {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Form states
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Employee");
  const [department, setDepartment] = useState("Kraft Mill");
  const [permissions, setPermissions] = useState({
    approve_requests: false,
    manage_suppliers: false,
    view_logs: false,
    edit_orders: false
  });

  const loadUsers = async () => {
    const list = await apiService.getUsers();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleTogglePerm = (perm) => {
    setPermissions(prev => ({
      ...prev,
      [perm]: !prev[perm]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username || !name) {
      alert("Username and Full Name are required");
      return;
    }

    try {
      if (editUser) {
        // Edit User
        const updated = {
          ...editUser,
          name,
          role,
          department,
          permissions: role === "Sub Admin" ? permissions : {}
        };
        await apiService.saveUser(updated);
        state.logEvent("Edited User Account", editUser.username, username, `Main Admin updated user settings for ${username}.`);
      } else {
        // Create User
        const newUser = {
          id: `usr-${Date.now()}`,
          username,
          name,
          role,
          department,
          disabled: false,
          permissions: role === "Sub Admin" ? permissions : {}
        };
        const tempPassword = await apiService.createUser(newUser);
        alert(`User created successfully!\n\nTemporary Password: ${tempPassword}\n\nShare this secure password with the user. They will be forced to change it on their first login.`);
        state.logEvent("Created User Account", "None", username, `Main Admin created account for ${username} with role ${role}.`);
      }

      // Reset & Reload
      setShowAddForm(false);
      setEditUser(null);
      setUsername("");
      setName("");
      setRole("Employee");
      setDepartment("Kraft Mill");
      setPermissions({
        approve_requests: false,
        manage_suppliers: false,
        view_logs: false,
        edit_orders: false
      });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (u) => {
    setEditUser(u);
    setUsername(u.username);
    setName(u.name);
    setRole(u.role);
    setDepartment(u.department || "Kraft Mill");
    setPermissions(u.permissions || {
      approve_requests: false,
      manage_suppliers: false,
      view_logs: false,
      edit_orders: false
    });
    setShowAddForm(true);
  };

  const handleToggleDisable = async (u) => {
    if (u.role === "Main Admin") {
      alert("Main Admin cannot be disabled");
      return;
    }
    const updated = {
      ...u,
      disabled: !u.disabled
    };
    await apiService.saveUser(updated);
    state.logEvent(u.disabled ? "Enabled User Account" : "Disabled User Account", u.username, u.username, `Main Admin toggled account state.`);
    loadUsers();
  };

  const handleResetPassword = async (u) => {
    const confirmReset = window.confirm(`Are you sure you want to reset password for ${u.name}?`);
    if (!confirmReset) return;
    
    try {
      const tempPass = await apiService.resetUserPassword(u.id);
      alert(`Password reset successful!\n\nNew Temporary Password: ${tempPass}\n\nUser will be forced to change it on their next login.`);
      state.logEvent("Reset User Password", u.username, u.username, `Main Admin reset password for ${u.username}.`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#settings')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>User Management</h1>
        </div>
        <div className="header-right">
          <button className="btn-orange" style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }} onClick={() => {
            setEditUser(null);
            setUsername("");
            setName("");
            setRole("Employee");
            setDepartment("Kraft Mill");
            setPermissions({
              approve_requests: false,
              manage_suppliers: false,
              view_logs: false,
              edit_orders: false
            });
            setShowAddForm(true);
          }}>
            Add User
          </button>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        {showAddForm ? (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '20px', textAlign: 'left', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
              {editUser ? 'Edit User Details' : 'Create New Account'}
            </h3>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Username</label>
                <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} disabled={!!editUser} required style={{ cursor: editUser ? 'not-allowed' : 'text' }} />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required style={{ cursor: 'text' }} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-control" value={role} onChange={e => setRole(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="Employee">Employee</option>
                    <option value="Sub Admin">Sub Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input type="text" className="form-control" value={department} onChange={e => setDepartment(e.target.value)} style={{ cursor: 'text' }} />
                </div>
              </div>

              {role === "Sub Admin" && (
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Configurable Permissions</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input type="checkbox" checked={permissions.approve_requests} onChange={() => handleTogglePerm('approve_requests')} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                      <span>Can Approve Requests</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input type="checkbox" checked={permissions.manage_suppliers} onChange={() => handleTogglePerm('manage_suppliers')} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                      <span>Can Manage Suppliers</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input type="checkbox" checked={permissions.view_logs} onChange={() => handleTogglePerm('view_logs')} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                      <span>Can View Audit Logs</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input type="checkbox" checked={permissions.edit_orders} onChange={() => handleTogglePerm('edit_orders')} style={{ cursor: 'pointer', width: '18px', height: '18px' }} />
                      <span>Can Edit Order Timelines</span>
                    </label>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn-dark" style={{ flex: 1, backgroundColor: '#9ca3af', marginBottom: 0 }} onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn-orange" style={{ flex: 1.5 }}>Save Account</button>
              </div>
            </form>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.map(u => (
            <div key={u.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '16px', textAlign: 'left', opacity: u.disabled ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserAvatar user={u} size={40} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '14px' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{u.username} • {u.role} ({u.department || 'N/A'})</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="badge-view-details" onClick={() => handleEdit(u)} style={{ backgroundColor: 'var(--primary-orange)', cursor: 'pointer' }}>Edit</button>
                  {u.role !== "Main Admin" && (
                    <button className="badge-view-details" onClick={() => handleToggleDisable(u)} style={{ backgroundColor: u.disabled ? 'var(--status-green)' : 'var(--status-red)', cursor: 'pointer' }}>
                      {u.disabled ? 'Enable' : 'Disable'}
                    </button>
                  )}
                  <button className="badge-view-details" onClick={() => handleResetPassword(u)} style={{ backgroundColor: 'var(--text-main)', cursor: 'pointer' }}>Reset Pass</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 15. USER AVATAR HELPER COMPONENT
// ----------------------------------------------------
export function UserAvatar({ user, size = 40 }) {
  if (!user) return null;
  
  if (user.avatar && user.avatar.startsWith("data:")) {
    return (
      <img src={user.avatar} style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)' }} alt="Avatar" />
    );
  }

  // Get initials
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "U";

  // Color code fallback
  let bgColor = "#0d9488"; // default employee
  if (user.role === "Main Admin") {
    bgColor = "#7c3aed"; // purple
  } else if (user.role === "Sub Admin") {
    bgColor = "#2563eb"; // blue
  } else if (user.role === "Employee") {
    bgColor = "#0d9488"; // teal
  }

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: bgColor,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: `${size * 0.4}px`,
      border: '1.5px solid var(--border-color)',
      userSelect: 'none'
    }}>
      {initials}
    </div>
  );
}

// ----------------------------------------------------
// 16. AVATAR EDITOR DRAWER COMPONENT
// ----------------------------------------------------
export function AvatarEditor({ user, onSave, onClose }) {
  const [avatar, setAvatar] = useState(user.avatar || "");
  
  const presets = [
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ea580c'/><text x='50' y='60' font-size='30' text-anchor='middle' fill='white'>🤖</text></svg>",
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%230d9488'/><text x='50' y='60' font-size='30' text-anchor='middle' fill='white'>🦊</text></svg>",
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%232563eb'/><text x='50' y='60' font-size='30' text-anchor='middle' fill='white'>🦉</text></svg>",
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%237c3aed'/><text x='50' y='60' font-size='30' text-anchor='middle' fill='white'>🐯</text></svg>"
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({
      ...user,
      avatar
    });
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <UserAvatar user={{ ...user, avatar }} size={80} />
      </div>

      <div className="form-group">
        <label>Upload Custom Picture</label>
        <div className="lr-upload-box" style={{ cursor: 'pointer' }}>
          <div className="lr-text-primary">Choose Photo File</div>
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ cursor: 'pointer' }} />
          <span className="badge-view-lr">Browse</span>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label>Preset Avatars</label>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          {presets.map((p, idx) => (
            <img key={idx} src={p} style={{ width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', border: avatar === p ? '3px solid var(--primary-orange)' : '1px solid var(--border-color)', padding: '2px' }} onClick={() => setAvatar(p)} alt="Preset" />
          ))}
          <button type="button" className="btn-dark" style={{ width: '44px', height: '44px', borderRadius: '50%', padding: 0, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', border: '1px solid #d1d5db', color: '#374151', cursor: 'pointer' }} onClick={() => setAvatar("")}>
            Reset
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button className="btn-dark" style={{ flex: 1, backgroundColor: '#9ca3af', marginBottom: 0, cursor: 'pointer' }} onClick={onClose}>Cancel</button>
        <button className="btn-orange" style={{ flex: 1.5, cursor: 'pointer' }} onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 11. BRANDING & AUTOMATION PANEL VIEW COMPONENT
// ----------------------------------------------------
export function AutomationPanel({ state, navigateTo }) {
  const [appName, setAppName] = useState(state.branding.appName);
  const [logoText, setLogoText] = useState(state.branding.logoText);
  const [companyName, setCompanyName] = useState(state.branding.companyName);
  const [primaryColor, setPrimaryColor] = useState(state.branding.primaryColor);
  const [bgColor, setBgColor] = useState(state.branding.backgroundColor);
  const [apiBaseUrl, setApiBaseUrl] = useState(localStorage.getItem("pms_api_base_url") || "");

  const handleApplyBranding = () => {
    if (!appName || !logoText || !companyName) {
      alert("App name, Logo, and Company are required.");
      return;
    }

    const updated = {
      ...state.branding,
      appName,
      logoText,
      companyName,
      primaryColor,
      primaryColorHover: primaryColor,
      backgroundColor: bgColor
    };

    state.updateBranding(updated);
    localStorage.setItem("pms_api_base_url", apiBaseUrl);
    state.logEvent("Updated Branding & Webhook Settings", "Custom config", appName, `Branding updated: ${appName}. Webhook URL: ${apiBaseUrl}`);
    alert("Branding settings saved successfully.");
    navigateTo('#settings');
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#settings')}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>Branding & Automations</h1>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        <div className="form-group">
          <label>App Name Placeholder</label>
          <input type="text" className="form-control" value={appName} onChange={e => setAppName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Logo Text</label>
          <input type="text" className="form-control" value={logoText} onChange={e => setLogoText(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input type="text" className="form-control" value={companyName} onChange={e => setCompanyName(e.target.value)} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Primary Theme (HEX)</label>
            <input type="color" className="form-control" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ height: '44px', padding: '4px' }} />
          </div>
          <div className="form-group">
            <label>BG Color (HEX)</label>
            <input type="color" className="form-control" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ height: '44px', padding: '4px' }} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Connect Live API Base URL</label>
          <input type="text" className="form-control" placeholder="https://api.alagiri.com/v1" value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} />
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
            *Input your backend base API endpoint (e.g., Node.js / Python REST API). Leave empty to use simulated LocalStorage.
          </p>
        </div>

        <button className="btn-dark" onClick={handleApplyBranding} style={{ marginTop: '10px' }}>
          Apply Configuration
        </button>

        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', fontSize: '12px', lineHeight: '1.4', marginTop: '12px', textAlign: 'left' }}>
          <b>💡 System Note:</b> Setting a target API URL switches requests from simulated state storage to live endpoints.
        </div>
      </div>
    </div>
  );
}
