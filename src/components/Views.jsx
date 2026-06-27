import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

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
  Warning: () => <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
};

// Helper format date
const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

// ----------------------------------------------------
// 1. HOME VIEW COMPONENT
// ----------------------------------------------------
export function HomeView({ state, navigateTo, openModal, setModalContent }) {
  const [smartOpen, setSmartOpen] = useState(true);
  const isEmployee = state.activeRole === "Employee";
  const user = isEmployee ? state.users.employee : state.users.admin;

  const pendingCount = state.requests.filter(r => r.status === "Pending").length;
  const approvedCount = state.requests.filter(r => ["Approved", "Booked", "Acknowledged"].includes(r.status)).length;
  const transitCount = state.requests.filter(r => ["In Transit", "LR Copy Received"].includes(r.status)).length;
  const warehouseCount = state.requests.filter(r => r.status === "Reached Warehouse").length;
  const rejectedCount = state.requests.filter(r => r.status === "Rejected").length;

  const hr = new Date().getHours();
  const greetingMsg = hr < 12 ? "Good Morning" : hr < 17 ? "Good Afternoon" : "Good Evening";

  let welcomeAlert = "";
  if (state.activeRole === "Admin") {
    welcomeAlert = pendingCount > 0 
      ? `You have ${pendingCount} pending approvals today.`
      : "Operations are running smoothly.";
  } else {
    welcomeAlert = warehouseCount > 0
      ? `${warehouseCount} deliveries reached the warehouse.`
      : "No pending deliveries awaiting verification.";
  }

  const smartRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name) 
    : state.requests;

  const sortedSmart = [...smartRequests]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const openNotifications = () => {
    const list = state.notifications.filter(n => n.role === "Both" || n.role === state.activeRole);
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
        <button className="btn-dark" style={{ marginTop: '16px', marginBottom: 0 }} onClick={() => {
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

  const hasUnread = state.notifications.some(n => !n.read && (n.role === "Both" || n.role === state.activeRole));

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <h1>{state.branding.logoText}</h1>
        </div>
        <div className="header-right">
          <button className="bell-btn" onClick={openNotifications}>
            {hasUnread && <span className="bell-badge"></span>}
            <Icons.Bell />
          </button>
          <button className="avatar-btn" onClick={() => navigateTo('#settings')}>
            <img src={user.avatar} alt="Avatar" />
          </button>
        </div>
      </header>

      <div className="greeting-container">
        <div className="greeting-text">{greetingMsg}, {user.name} 👋</div>
        <div className="greeting-user">
          {state.activeRole === "Admin" ? (
            pendingCount > 0 ? (
              <span>You have <span style={{ color: 'var(--primary-orange)', fontWeight: '700' }}>{pendingCount} pending approvals</span> today.</span>
            ) : "Operations are running smoothly."
          ) : (
            warehouseCount > 0 ? (
              <span><span style={{ color: 'var(--status-green)', fontWeight: '700' }}>{warehouseCount} deliveries</span> reached the warehouse.</span>
            ) : "No pending deliveries awaiting verification."
          )}
        </div>
      </div>

      <div className="stat-card" onClick={() => navigateTo('#live-orders')}>
        <div className="stat-label">Requested<br />orders</div>
        <div className="stat-value">{state.requests.length}</div>
      </div>

      <div className="stat-card" onClick={() => navigateTo('#live-orders')}>
        <div className="stat-label">Live Orders</div>
        <div className="stat-block">
          <div className="stat-pill red" title="Pending / Rejected">{pendingCount + rejectedCount}</div>
          <div className="stat-pill orange" title="Approved / Booked">{approvedCount}</div>
          <div className="stat-pill blue" title="In Transit / Reached Warehouse">{transitCount + warehouseCount}</div>
        </div>
      </div>

      <button className="btn-dark" onClick={() => navigateTo('#create-request')}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        Create Request
      </button>

      <div className={`collapsible-section ${smartOpen ? 'open' : ''}`}>
        <div className="collapsible-header" onClick={() => setSmartOpen(!smartOpen)}>
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

      <div className="menu-card" onClick={() => navigateTo('#live-orders')}>
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

  const handleSubmit = async () => {
    const quantity = parseFloat(qty);
    if (!productName || isNaN(quantity) || quantity <= 0 || !units) {
      alert("Please fill in Product Name, Qty, and Units.");
      return;
    }

    const reqId = `REQ-${1000 + state.requests.length + 1}`;
    const user = state.activeRole === "Admin" ? state.users.admin : state.users.employee;

    const newReq = {
      id: reqId,
      employeeName: user.name,
      department: user.department,
      date: new Date().toISOString(),
      productName,
      qty: quantity,
      units,
      suggestedSupplier,
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
          role: state.activeRole,
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
          <button className="back-btn" onClick={() => navigateTo('#home')}>
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
            <datalist id="units-list">
              <option value="pcs" />
              <option value="units" />
              <option value="kg" />
              <option value="meters" />
              <option value="drums" />
            </datalist>
          </div>
        </div>

        <div className="form-group">
          <label>Suggest supplier</label>
          <input type="text" className="form-control" placeholder="e.g. AB company" value={suggestedSupplier} onChange={e => setSuggestedSupplier(e.target.value)} />
        </div>

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
            <button className={`mic-btn ${listening ? 'listening' : ''}`} onClick={handleVoiceInput}>
              <Icons.Mic />
            </button>
          </div>
        </div>

        <button className="btn-dark" onClick={handleSubmit} style={{ marginTop: '10px' }}>
          Place Request
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. REQUESTED ORDERS VIEW (ADMIN APPROVALS)
// ----------------------------------------------------
export function RequestedOrdersView({ state, navigateTo, addNotification }) {
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
    const updatedHistory = [...req.history, {
      status: "Approved",
      updatedBy: state.users.admin.name,
      role: "Admin",
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
    
    const updatedReq = {
      ...req,
      status: "Rejected",
      history: [...req.history, {
        status: "Rejected",
        updatedBy: state.users.admin.name,
        role: "Admin",
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

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#home')}>
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
                    <input type="text" className="form-control" value={current.units} onChange={e => updateCardField(req.id, "units", e.target.value)} />
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

                <div className="form-group">
                  <label>Select supplier</label>
                  <select className="form-control" value={current.supplierId} onChange={e => updateCardField(req.id, "supplierId", e.target.value)}>
                    <option value="">-- Choose Supplier --</option>
                    {state.suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.companyName} ({sup.contactPerson})</option>
                    ))}
                  </select>
                </div>

                <div className="card-actions-row">
                  <button className="btn-dark" style={{ backgroundColor: 'var(--status-red)', marginBottom: 0, padding: '10px' }} onClick={() => handleReject(req.id)}>Reject</button>
                  <button className="btn-orange" style={{ flex: 1.5, padding: '10px' }} onClick={() => handleApprove(req.id)}>Generate PO</button>
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
  const isEmployee = state.activeRole === "Employee";
  const user = isEmployee ? state.users.employee : state.users.admin;

  const filteredRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name) 
    : state.requests;

  const sorted = [...filteredRequests].sort((a, b) => {
    const activeOrder = ["Approved", "Booked", "Acknowledged", "In Transit", "LR Copy Received", "Reached Warehouse"];
    const aActive = activeOrder.includes(a.status);
    const bActive = activeOrder.includes(b.status);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#home')}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '20px' }}>Live orders</h1>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No orders found.
          </div>
        ) : (
          sorted.map(req => {
            const supplier = state.suppliers.find(s => s.id === req.supplierId) || { companyName: "Not Assigned" };
            return (
              <div key={req.id} className="live-order-card" onClick={() => navigateTo(`#order-details?id=${req.id}`)}>
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

    const updatedReq = {
      ...req,
      status: newStatus,
      history: [...req.history, {
        status: newStatus,
        updatedBy: state.activeRole === "Admin" ? state.users.admin.name : state.users.employee.name,
        role: state.activeRole,
        timestamp: new Date().toISOString(),
        remarks: remarks || `Status changed from ${prevStatus} to ${newStatus}.`
      }]
    };

    const saved = await apiService.updateRequest(requestId, updatedReq);
    state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

    state.logEvent("Status Changed", prevStatus, newStatus, `Order ${requestId} status updated: ${remarks}`);

    if (newStatus === "Reached Warehouse") {
      addNotification(
        "Warehouse Arrival",
        `Material for ${requestId} (${req.productName}) has reached the warehouse and is awaiting verification.`,
        "Employee"
      );
      state.triggerWebhook("warehouse.arrival", saved);
    } else {
      addNotification("Order Updated", `Order ${requestId} status changed to ${newStatus}`, "Both");
    }

    state.triggerWebhook("status.changed", saved);
  };

  const handleLrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      const prevStatus = req.status;

      const updatedReq = {
        ...req,
        lrCopy: dataUrl,
        status: "LR Copy Received",
        history: [...req.history, {
          status: "LR Copy Received",
          updatedBy: state.activeRole === "Admin" ? state.users.admin.name : state.users.employee.name,
          role: state.activeRole,
          timestamp: new Date().toISOString(),
          remarks: `Uploaded LR document copy: ${file.name}`
        }]
      };

      const saved = await apiService.updateRequest(requestId, updatedReq);
      state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

      state.logEvent("LR Uploaded", prevStatus, "LR Copy Received", `Attached LR copy ${file.name} to ${requestId}`);
      addNotification("LR Received", `LR Copy document uploaded for ${requestId}.`, "Both");
      state.triggerWebhook("lr.uploaded", saved);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyDeliver = () => {
    const remarks = prompt("Enter verification remarks:") || "Physically verified and counted. Fits specification.";
    handleStatusChange("Delivered", remarks);
  };

  const handleViewLr = () => {
    setModalContent(
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <img src={req.lrCopy} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid #ccc' }} alt="LR copy attachment" />
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>Order ID: {req.id}</div>
      </div>,
      "LR Copy Document"
    );
    openModal();
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#live-orders')}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '20px' }}>Order Details</h1>
        </div>
      </header>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'left' }}>
        {dateStr} &nbsp;&bull;&nbsp; {timeStr}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', textAlign: 'left' }}>{req.productName}</h2>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>{req.qty} {req.units}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontWeight: '700', color: 'var(--primary-orange)' }}>{supplier.companyName}</div>
          <span className={`status-badge ${req.status.toLowerCase().replace(/ /g, '')}`}>{req.status}</span>
        </div>

        {req.poNumber && <div style={{ fontSize: '12px', marginBottom: '14px', textAlign: 'left' }}><b>PO Ref:</b> {req.poNumber} ({formatDate(req.poDate)})</div>}

        {req.lrCopy ? (
          <div className="lr-upload-box" style={{ borderStyle: 'solid', backgroundColor: '#f0fdf4', borderColor: 'var(--status-green)' }}>
            <div className="lr-text-primary" style={{ color: 'var(--status-green)' }}>LR Copy Attached</div>
            <span className="badge-view-lr" onClick={handleViewLr} style={{ backgroundColor: 'var(--status-green)' }}>View LR</span>
          </div>
        ) : (
          <div className="lr-upload-box">
            <div className="lr-text-primary">Upload LR Copy</div>
            <input type="file" accept="image/*,application/pdf" onChange={handleLrUpload} />
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
          <button className="btn-dark" onClick={handleVerifyDeliver} style={{ backgroundColor: 'var(--status-green)', marginTop: '16px' }}>
            Verify & Mark Delivered
          </button>
        )}

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Change status</label>
          <select className="form-control" onChange={e => handleStatusChange(e.target.value)} defaultValue="">
            <option value="" disabled>-- Choose New Status --</option>
            {["Approved", "Booked", "Acknowledged", "Picked", "In Transit", "Reached Warehouse", "Delivered"].map(s => (
              <option key={s} value={s} disabled={req.status === s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 7. SETTINGS MAIN VIEW COMPONENT
// ----------------------------------------------------
export function SettingsView({ state, navigateTo }) {
  const isEmployee = state.activeRole === "Employee";
  const user = isEmployee ? state.users.employee : state.users.admin;

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#home')}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '20px' }}>Settings</h1>
        </div>
      </header>

      <div>
        <div className="stat-card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src={user.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e5dec9', border: '1px solid var(--border-color)' }} alt="profile" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user.role} ({user.department})</div>
            </div>
          </div>
          <Icons.ChevronRight />
        </div>

        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px', paddingLeft: '4px', textAlign: 'left' }}>
          Other Settings
        </div>

        <div className="settings-menu">
          <div className="settings-item" onClick={() => navigateTo('#settings/suppliers')}>
            <div className="settings-item-left">
              <Icons.Users />
              <span className="settings-title">Supplier Database</span>
            </div>
            <Icons.ChevronRight />
          </div>

          <div className="settings-item" onClick={() => navigateTo('#settings/notifications')}>
            <div className="settings-item-left">
              <Icons.Bell />
              <span className="settings-title">Notification Preferences</span>
            </div>
            <Icons.ChevronRight />
          </div>

          {!isEmployee && (
            <>
              <div className="settings-item" onClick={() => navigateTo('#settings/logs')}>
                <div className="settings-item-left">
                  <Icons.Document />
                  <span className="settings-title">Audit Trail Logs</span>
                </div>
                <Icons.ChevronRight />
              </div>

              <div className="settings-item" onClick={() => navigateTo('#settings/automation')}>
                <div className="settings-item-left">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: 'var(--primary-orange)' }}><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
                  <span className="settings-title">Branding & Automations</span>
                </div>
                <Icons.ChevronRight />
              </div>
            </>
          )}

          <div className="settings-item" onClick={() => alert("Simulation profiles are read-only.")}>
            <div className="settings-item-left">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: 'var(--primary-orange)' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <span className="settings-title">Change Password</span>
            </div>
            <Icons.ChevronRight />
          </div>

          <div className="settings-item" style={{ color: 'var(--status-red)' }} onClick={() => alert("Mock user session logged out.")}>
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
          <button className="back-btn" onClick={() => navigateTo('#settings')}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>Preferences</h1>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>☑ WhatsApp Enabled</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Receive automated alerts via WhatsApp.</div>
            </div>
            <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary-orange)' }} checked={whatsapp} onChange={() => handleToggle('whatsapp')} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>☑ App Notifications Enabled</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Get real-time push toast alerts inside app.</div>
            </div>
            <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: 'var(--primary-orange)' }} checked={appNotifs} onChange={() => handleToggle('app')} />
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
          <button className="back-btn" onClick={() => navigateTo('#settings')}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>Audit Trail Logs</h1>
        </div>
        <div className="header-right">
          <button className="btn-orange" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={handleExport}>Export CSV</button>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        <div className="form-group">
          <input type="text" className="form-control" placeholder="Search logs..." value={query} onChange={e => setQuery(e.target.value)} />
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
