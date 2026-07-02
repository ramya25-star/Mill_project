import React, { useState, useEffect } from 'react';
import { apiService, hashPassword } from '../services/api';
import { CONFIG } from '../config';

// ----------------------------------------------------
// ICON CONSTANTS (Reusable clean SVG vectors)
// ----------------------------------------------------
export const Icons = {
  Home: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 20} height={p?.size || p?.height || 20} fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  Document: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 20} height={p?.size || p?.height || 20} fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Clock: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 20} height={p?.size || p?.height || 20} fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Settings: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 20} height={p?.size || p?.height || 20} fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Back: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 24} height={p?.size || p?.height || 24} fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 20} height={p?.size || p?.height || 20} fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
  Mic: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 18} height={p?.size || p?.height || 18} fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  Close: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 24} height={p?.size || p?.height || 24} fill="none" stroke="currentColor" strokeWidth="2.5" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Users: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 20} height={p?.size || p?.height || 20} fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Bell: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 20} height={p?.size || p?.height || 20} fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Warning: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 48} height={p?.size || p?.height || 48} fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>,
  Eye: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 18} height={p?.size || p?.height || 18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeSlash: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 18} height={p?.size || p?.height || 18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  WhatsApp: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 18} height={p?.size || p?.height || 18} fill="#25D366" style={{ marginRight: '6px' }} {...p}><path d="M12.012 2c-5.506 0-9.969 4.463-9.969 9.969 0 1.758.459 3.407 1.264 4.849L2.05 21.95l5.289-1.386a9.92 9.92 0 0 0 4.673 1.173c5.507 0 9.97-4.463 9.97-9.97S17.519 2 12.012 2zm0 17.067c-1.482 0-2.929-.398-4.186-1.155l-.3-.178-3.116.817.831-3.039-.196-.312a8.125 8.125 0 0 1-1.246-4.231c0-4.49 3.653-8.143 8.143-8.143 4.49 0 8.143 3.653 8.143 8.143 0 4.49-3.653 8.143-8.143 8.143zm4.463-6.109c-.245-.122-1.45-.714-1.674-.796-.225-.082-.388-.122-.551.122-.164.245-.633.796-.776.959-.143.163-.286.184-.531.061-.245-.122-1.033-.381-1.968-1.216-.728-.65-1.22-1.452-1.363-1.696-.143-.245-.015-.377.108-.499.11-.11.245-.286.368-.429.122-.143.163-.245.245-.408.082-.163.041-.306-.02-.429-.061-.122-.551-1.327-.756-1.817-.199-.48-.4-.413-.551-.421-.143-.007-.306-.007-.47-.007a.903.903 0 0 0-.653.306c-.225.245-.857.837-.857 2.041 0 1.204.877 2.367.999 2.531.122.163 1.726 2.637 4.183 3.698.585.253 1.042.404 1.397.517.587.186 1.122.16 1.545.097.47-.072 1.45-.592 1.654-1.163.204-.571.204-1.061.143-1.163-.061-.102-.225-.163-.47-.286z"/></svg>,
  Edit: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 12} height={p?.size || p?.height || 12} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Key: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 12} height={p?.size || p?.height || 12} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Power: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 12} height={p?.size || p?.height || 12} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  Check: (p) => <svg viewBox="0 0 24 24" width={p?.size || p?.width || 12} height={p?.size || p?.height || 12} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>
};

// Helper format date
const formatDate = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

// ----------------------------------------------------
// 1. HOME VIEW COMPONENT
// ----------------------------------------------------
export function HomeView({ state, navigateTo, openModal, closeModal, setModalContent }) {
  const [smartOpen, setSmartOpen] = useState(false);
  const user = state.currentUser;
  const isEmployee = user.role === "Employee";

  const userRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name) 
    : state.requests;

  const isOlderThan14Days = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const diffTime = new Date() - date;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 14;
  };

  const pendingCount = userRequests.filter(r => r.status === "Pending").length;
  const noResponseCount = userRequests.filter(r => r.status === "No Response").length;
  const acknowledgedCount = userRequests.filter(r => r.status === "Acknowledged").length;
  const bookedCount = userRequests.filter(r => r.status === "Booked").length;
  const receivedCount = userRequests.filter(r => r.status === "Received" && !isOlderThan14Days(r.actualDeliveryDate)).length;

  const totalLiveCount = noResponseCount + acknowledgedCount + bookedCount + receivedCount;

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
      <header className="app-header" style={{ marginBottom: '24px' }}>
        <div className="header-left">
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>Dashboard</h1>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="bell-btn" onClick={openNotifications} style={{ cursor: 'pointer', border: 'none', background: 'none' }}>
            {hasUnread && <span className="bell-badge"></span>}
            <Icons.Bell />
          </button>
          <button className="avatar-btn" onClick={() => navigateTo('#settings')} style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}>
            <UserAvatar user={user} size={40} />
          </button>
        </div>
      </header>

      {/* 1. Requested Orders Card */}
      <div 
        className="stat-card" 
        onClick={() => navigateTo(isEmployee ? '#pending-orders' : '#requested-orders')} 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer', 
          padding: '24px', 
          background: '#ffffff', 
          border: '1px solid var(--border-color)', 
          borderRadius: '16px', 
          marginBottom: '16px', 
          width: '100%', 
          boxSizing: 'border-box',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.2' }}>
            Requested<br />orders
          </div>
        </div>
        <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>{pendingCount}</div>
      </div>

      {/* 2. Live Orders Card */}
      <div 
        className="stat-card" 
        onClick={() => navigateTo('#live-orders')} 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer', 
          padding: '24px', 
          background: '#ffffff', 
          border: '1px solid var(--border-color)', 
          borderRadius: '16px', 
          marginBottom: '16px', 
          width: '100%', 
          boxSizing: 'border-box',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Live Orders</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#ef4444', color: '#ffffff', minWidth: '36px', height: '36px', borderRadius: '6px', fontSize: '15px', fontWeight: '800', padding: '0 8px', boxSizing: 'border-box' }}>{noResponseCount}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f97316', color: '#ffffff', minWidth: '36px', height: '36px', borderRadius: '6px', fontSize: '15px', fontWeight: '800', padding: '0 8px', boxSizing: 'border-box' }}>{acknowledgedCount}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#2563eb', color: '#ffffff', minWidth: '36px', height: '36px', borderRadius: '6px', fontSize: '15px', fontWeight: '800', padding: '0 8px', boxSizing: 'border-box' }}>{bookedCount}</span>
        </div>
      </div>

      {/* 3. Create Request Button */}
      <button 
        className="btn-dark" 
        onClick={() => navigateTo('#create-request')} 
        style={{ 
          width: '100%', 
          height: '56px', 
          borderRadius: '16px', 
          backgroundColor: '#2a2726', 
          color: '#ffffff', 
          fontSize: '18px', 
          fontWeight: '700', 
          border: 'none', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '24px', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
        }}
      >
        Create Request
      </button>

      {/* 4. Smart View Card */}
      <div 
        className={`smart-view-container ${smartOpen ? 'expanded' : ''}`} 
        style={{ 
          marginBottom: '16px', 
          borderRadius: '16px', 
          border: '1.5px solid #ffd8a8', 
          overflow: 'hidden' 
        }}
      >
        <div 
          onClick={() => setSmartOpen(!smartOpen)} 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '16px 20px', 
            cursor: 'pointer',
            background: '#ffffff'
          }}
        >
          <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-main)', letterSpacing: '0.5px' }}>SMART VIEW</span>
          <div 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-orange)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transform: smartOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="3"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        
        <div 
          style={{ 
            maxHeight: smartOpen ? '320px' : '0px', 
            overflow: 'hidden', 
            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            background: '#ffffff',
            borderTop: smartOpen ? '1.5px solid #f6f5f4' : 'none'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div 
              onClick={() => navigateTo('#live-orders?filter=acknowledged')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderBottom: '1.5px solid #f6f5f4' }}
            >
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Acknowledged</span>
              <span style={{ background: '#f5efe9', color: '#2a2726', fontWeight: '800', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
                {acknowledgedCount}
              </span>
            </div>

            <div 
              onClick={() => navigateTo('#live-orders?filter=noresponse')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderBottom: '1.5px solid #f6f5f4' }}
            >
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Not Acknowledged</span>
              <span style={{ background: '#f5efe9', color: '#2a2726', fontWeight: '800', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
                {noResponseCount}
              </span>
            </div>

            <div 
              onClick={() => navigateTo('#live-orders?filter=booked')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', borderBottom: '1.5px solid #f6f5f4' }}
            >
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Booked</span>
              <span style={{ background: '#f5efe9', color: '#2a2726', fontWeight: '800', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
                {bookedCount}
              </span>
            </div>

            <div 
              onClick={() => navigateTo('#live-orders?filter=received')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Recieved</span>
              <span style={{ background: '#f5efe9', color: '#2a2726', fontWeight: '800', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
                {receivedCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Order History Card */}
      <div 
        className="menu-card" 
        onClick={() => navigateTo('#order-history')} 
        style={{ 
          cursor: 'pointer', 
          marginTop: '16px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 24px', 
          background: '#ffffff', 
          border: '1px solid var(--border-color)', 
          borderRadius: '16px', 
          width: '100%', 
          boxSizing: 'border-box'
        }}
      >
        <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Order history</span>
        <Icons.ChevronRight />
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. CREATE REQUEST VIEW COMPONENT
// ----------------------------------------------------
export function CreateRequestView({ state, navigateTo, addNotification, openModal, closeModal, setModalContent }) {
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("");
  const [units, setUnits] = useState("Pieces");
  const [suggestedSupplier, setSuggestedSupplier] = useState("");
  const [suggestedSupplierPhone, setSuggestedSupplierPhone] = useState("");
  const [suggestedSupplierEmail, setSuggestedSupplierEmail] = useState("");
  const [suggestedSupplierRemarks, setSuggestedSupplierRemarks] = useState("");
  const [billTo, setBillTo] = useState(state.branding.billingLocations[0] || "");
  const [description, setDescription] = useState("");
  const [listening, setListening] = useState(false);
  const [errors, setErrors] = useState({});

  const validateField = (field, value) => {
    let err = "";
    if (field === "productName") {
      if (!value.trim()) {
        err = "Product Name is required.";
      }
    } else if (field === "qty") {
      const parsed = parseFloat(value);
      if (!value) {
        err = "Quantity is required.";
      } else if (isNaN(parsed) || parsed <= 0) {
        err = "Quantity must be a positive number.";
      }
    } else if (field === "units") {
      if (!value) {
        err = "Units is required.";
      }
    } else if (field === "suggestedSupplierEmail") {
      if (value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          err = "Invalid email format.";
        }
      }
    } else if (field === "suggestedSupplierPhone") {
      if (value.trim()) {
        let stripped = value.trim();
        if (stripped.startsWith("+91")) {
          stripped = stripped.substring(3);
        } else if (stripped.startsWith("+")) {
          stripped = stripped.substring(1);
        }
        if (!/^\d+$/.test(stripped)) {
          err = "Phone number must contain numbers only.";
        }
      }
    }
    setErrors(prev => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  // New Date, Priority and Document attachments states
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileName, setAttachedFileName] = useState("");

  // Live Webcam state variables
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);

  useEffect(() => {
    if (showWebcamModal && webcamStream) {
      const timer = setTimeout(() => {
        const video = document.getElementById("webcam-video-feed");
        if (video) {
          video.srcObject = webcamStream;
          video.play().catch(e => console.error("Webcam play error:", e));
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showWebcamModal, webcamStream]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setWebcamStream(stream);
      setShowWebcamModal(true);
      state.showToast("Camera Active", "Live camera initialized successfully.", "success");
    } catch (err) {
      console.warn("Webcam blocked or unavailable, falling back to file picker:", err);
      // Fallback: click standard camera file input
      const fallback = document.getElementById("camera-fallback-input");
      if (fallback) fallback.click();
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setShowWebcamModal(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById("webcam-video-feed");
    if (!video) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 800;
      canvas.height = video.videoHeight || 600;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setAttachedFile(dataUrl);
      setAttachedFileName(`Camera_Capture_${Date.now()}.jpg`);
      state.showToast("Capture Success", "Document screenshot captured successfully.", "success");
      stopWebcam();
    } catch (err) {
      state.showToast("Capture Error", "Failed to capture snapshot.", "success");
    }
  };

  const compressAndReadImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressAndReadImage(file);
      setAttachedFile(compressed);
      setAttachedFileName(file.name || `Camera_${Date.now()}.jpg`);
      state.showToast("Camera Success", "Document photo captured successfully.", "success");
    } catch (err) {
      state.showToast("Camera Error", "Failed to capture document photo.", "success");
    }
  };

  const handleImageFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ["pdf", "xls", "xlsx", "doc", "docx", "jpg", "jpeg", "png"];
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      state.showToast("Security Block", "Unauthorized file format. Only PDF, Word, Excel, and image formats are allowed.", "success");
      e.target.value = ""; // Clear input
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile(reader.result);
      setAttachedFileName(file.name);
      state.showToast("Upload Success", `${file.name} attached successfully.`, "success");
    };
    reader.readAsDataURL(file);
  };

  const handleBillToChange = (val) => {
    if (val === "ADD_NEW") {
      let newLoc = "";
      setModalContent(
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '13px', marginBottom: '12px' }}>Enter the name of the new delivery/billing location:</p>
          <div className="form-group">
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Warehouse 3 - Chennai" 
              onChange={e => { newLoc = e.target.value; }} 
              style={{ cursor: 'text' }}
            />
          </div>
          <button 
            className="btn-orange" 
            onClick={() => {
              if (newLoc.trim()) {
                const updatedLocations = [...state.branding.billingLocations, newLoc.trim()];
                state.updateBranding({
                  ...state.branding,
                  billingLocations: updatedLocations
                });
                setBillTo(newLoc.trim());
              }
              closeModal();
            }} 
            style={{ width: '100%', cursor: 'pointer' }}
          >
            Add Location
          </button>
        </div>,
        "Add New Location"
      );
      openModal();
    } else {
      setBillTo(val);
    }
  };
  const user = state.currentUser;
  const isEmployee = user.role === "Employee";

  const handleSubmit = async () => {
    const newErrors = {};
    if (!productName.trim()) newErrors.productName = "Product Name is required.";
    const quantity = parseFloat(qty);
    if (!qty) newErrors.qty = "Quantity is required.";
    else if (isNaN(quantity) || quantity <= 0) newErrors.qty = "Quantity must be a positive number.";
    if (!units) newErrors.units = "Units is required.";

    if (isEmployee) {
      if (suggestedSupplierEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(suggestedSupplierEmail.trim())) {
          newErrors.suggestedSupplierEmail = "Invalid email format.";
        }
      }
      if (suggestedSupplierPhone.trim()) {
        let stripped = suggestedSupplierPhone.trim();
        if (stripped.startsWith("+91")) {
          stripped = stripped.substring(3);
        } else if (stripped.startsWith("+")) {
          stripped = stripped.substring(1);
        }
        if (!/^\d+$/.test(stripped)) {
          newErrors.suggestedSupplierPhone = "Phone number must contain numbers only.";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      state.showToast("Validation Error", "Please resolve all validation errors before submitting.", "success");
      return;
    }

    const reqId = `REQ-${1000 + state.requests.length + 1}`;

    const newReq = {
      id: reqId,
      employeeName: user.name,
      department: user.department || "General",
      date: new Date().toISOString(),
      createdDate: new Date().toLocaleDateString('en-GB'),
      createdTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      productName,
      qty: quantity,
      units,
      suggestedSupplier: suggestedSupplier || "",
      suggestedSupplierPhone: isEmployee ? suggestedSupplierPhone : "",
      suggestedSupplierEmail: isEmployee ? suggestedSupplierEmail : "",
      suggestedSupplierRemarks: isEmployee ? suggestedSupplierRemarks : "",
      billTo,
      description,
      status: "Pending",
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: priority || "Normal",
      image: attachedFile || null,
      imageName: attachedFileName || "",
      supplierId: "",
      poNumber: "",
      poDate: "",
      lrCopy: null,
      history: [
        {
          status: "Pending",
          updatedBy: user.name,
          role: user.role,
          timestamp: new Date().toISOString(),
          remarks: "Initial request placed."
        }
      ]
    };

    const saved = await apiService.createRequest(newReq);
    state.setRequests([saved, ...state.requests]);

    state.logEvent("Created Request", "None", "Pending", `Created request ${reqId} for ${productName}.`);

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    addNotification(
      "New Request Created",
      `Employee: ${user.name}\nDept: ${user.department || "General"}\nTime: ${timeStr}\nPriority: ${priority}\nRequest ID: ${reqId}`,
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
          <input type="text" className="form-control" placeholder="e.g. chain wheel" value={productName} onChange={e => { setProductName(e.target.value); validateField("productName", e.target.value); }} style={{ border: errors.productName ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)', cursor: 'text' }} />
          {errors.productName && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.productName}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Qty</label>
            <input type="number" className="form-control" placeholder="10" value={qty} onChange={e => { setQty(e.target.value); validateField("qty", e.target.value); }} style={{ border: errors.qty ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)', cursor: 'text' }} />
            {errors.qty && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.qty}</div>}
          </div>
          <div className="form-group">
            <label>Units</label>
            <select className="form-control" value={units} onChange={e => { setUnits(e.target.value); validateField("units", e.target.value); }} style={{ cursor: 'pointer', border: errors.units ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }}>
              <option value="Pieces">Pieces</option>
              <option value="Kg">Kg</option>
              <option value="Litre">Litre</option>
              <option value="Box">Box</option>
              <option value="Meter">Meter</option>
              <option value="Nos">Nos</option>
              <option value="Feet">Feet</option>
            </select>
            {errors.units && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.units}</div>}
          </div>
        </div>

        {isEmployee ? (
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '12px', marginBottom: '16px', background: 'var(--card-bg)', textAlign: 'left' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '800', marginBottom: '10px', textTransform: 'uppercase', color: 'var(--primary-orange)', letterSpacing: '0.5px' }}>Suggest Supplier (Optional)</h4>
            <div className="form-group">
              <label>Supplier Name</label>
              <select className="form-control" value={suggestedSupplier} onChange={e => {
                const name = e.target.value;
                setSuggestedSupplier(name);
                const s = state.suppliers.find(sup => sup.companyName === name);
                if (s) {
                  setSuggestedSupplierPhone(s.whatsappNumber || s.phoneNumber || "");
                  setSuggestedSupplierEmail(s.email || "");
                } else {
                  setSuggestedSupplierPhone("");
                  setSuggestedSupplierEmail("");
                }
              }} style={{ cursor: 'pointer' }}>
                <option value="">-- Choose Supplier (Optional) --</option>
                {state.suppliers.map(sup => (
                  <option key={sup.id} value={sup.companyName}>{sup.companyName}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="text" className="form-control" placeholder="e.g. +91 9988776655" value={suggestedSupplierPhone} onChange={e => { setSuggestedSupplierPhone(e.target.value); validateField("suggestedSupplierPhone", e.target.value); }} style={{ border: errors.suggestedSupplierPhone ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)', cursor: 'text' }} />
                {errors.suggestedSupplierPhone && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.suggestedSupplierPhone}</div>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" placeholder="e.g. sales@abco.com" value={suggestedSupplierEmail} onChange={e => { setSuggestedSupplierEmail(e.target.value); validateField("suggestedSupplierEmail", e.target.value); }} style={{ border: errors.suggestedSupplierEmail ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)', cursor: 'text' }} />
                {errors.suggestedSupplierEmail && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.suggestedSupplierEmail}</div>}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0, marginTop: '8px' }}>
              <label>Remarks</label>
              <input type="text" className="form-control" placeholder="e.g. Recommended for pulper parts" value={suggestedSupplierRemarks} onChange={e => setSuggestedSupplierRemarks(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label>Suggest supplier</label>
            <select className="form-control" value={suggestedSupplier} onChange={e => setSuggestedSupplier(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">-- Choose Supplier (Optional) --</option>
              {state.suppliers.map(sup => (
                <option key={sup.id} value={sup.companyName}>{sup.companyName}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Bill to</label>
          <select className="form-control" value={billTo} onChange={e => handleBillToChange(e.target.value)} style={{ cursor: 'pointer' }}>
            {state.branding.billingLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            <option value="ADD_NEW">+ (Add New Location)</option>
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

        <div className="form-row" style={{ marginTop: '16px' }}>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" className="form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ cursor: 'pointer' }} />
          </div>
          <div className="form-group">
            <label>Importance</label>
            <select className="form-control" value={priority} onChange={e => setPriority(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px', textAlign: 'left' }}>
          <label>Attachment Document</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              type="button"
              className="btn-outlined-icon-edit" 
              onClick={startWebcam}
              style={{ backgroundColor: 'transparent', color: 'var(--primary-orange)', border: '1px solid var(--primary-orange)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', boxSizing: 'border-box' }}
            >
              📸 Scan Document
            </button>
            <input id="camera-fallback-input" type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} style={{ display: 'none' }} />
            
            <label 
              className="btn-outlined-icon-key" 
              style={{ backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--text-main)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', boxSizing: 'border-box' }}
            >
              📁 Upload Document
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*" onChange={handleImageFileSelect} style={{ display: 'none' }} />
            </label>
          </div>

          {attachedFile && (
            <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f9f9f8', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', position: 'relative' }}>
              <span style={{ fontSize: '20px' }}>📄</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachedFileName || "Attached Document"}</span>
              <button 
                type="button" 
                onClick={() => { setAttachedFile(null); setAttachedFileName(""); }} 
                style={{ marginLeft: '10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--status-red)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', padding: 0 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <button className="btn-dark" onClick={handleSubmit} style={{ marginTop: '10px', cursor: 'pointer' }}>
          Place Request
        </button>
      </div>

      {showWebcamModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', boxSizing: 'border-box', fontFamily: 'var(--font-family)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ color: '#fff', margin: 0, fontSize: '16px', fontWeight: '800', letterSpacing: '0.3px' }}>Scan Document</h4>
            <button onClick={stopWebcam} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '4px', lineHeight: '1' }}>✕</button>
          </div>

          {/* Video Container with overlay document frame */}
          <div style={{ position: 'relative', flex: 1, margin: '20px 0', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <video id="webcam-video-feed" playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
            
            {/* Document scanning overlay frame */}
            <div style={{ position: 'absolute', inset: '10%', border: '2.5px dashed var(--primary-orange)', borderRadius: '12px', pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Align Document in Frame
              </div>
            </div>
          </div>

          {/* Shutter controls */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingBottom: '10px' }}>
            <button 
              onClick={capturePhoto} 
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '4px solid var(--primary-orange)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                padding: 0
              }}
              title="Capture Scan"
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--primary-orange)', transition: 'transform 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px' }}>📷</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// SUPPLIER PICKER SUB-COMPONENT (WITH SEARCH & HIGHLIGHTING)
// ----------------------------------------------------
export function SupplierPicker({ suppliers, currentSupplierId, onSelect, productName }) {
  const [query, setQuery] = useState("");

  const getSortedSuppliers = () => {
    const queryTerm = (productName || "").toLowerCase().trim();
    return [...suppliers].sort((a, b) => {
      const aProducts = (a.products || "").toLowerCase();
      const bProducts = (b.products || "").toLowerCase();
      
      const aMatches = queryTerm && (aProducts.includes(queryTerm) || queryTerm.split(' ').some(w => w.length > 2 && aProducts.includes(w)));
      const bMatches = queryTerm && (bProducts.includes(queryTerm) || queryTerm.split(' ').some(w => w.length > 2 && bProducts.includes(w)));
      
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;

      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      if (bRating !== aRating) return bRating - aRating;

      const getTimestamp = (id) => {
        if (!id) return 0;
        const parts = id.split('-');
        if (parts.length > 1) {
          const ts = parseInt(parts[1]);
          if (!isNaN(ts) && ts > 100000) return ts;
        }
        return 0;
      };
      const aTs = getTimestamp(a.id);
      const bTs = getTimestamp(b.id);
      if (aTs !== bTs) return bTs - aTs;
      return a.companyName.localeCompare(b.companyName);
    });
  };

  const sorted = getSortedSuppliers();
  const newestSupplier = sorted.find(s => {
    if (!s.id) return false;
    const parts = s.id.split('-');
    return parts.length > 1 && !isNaN(parseInt(parts[1])) && parseInt(parts[1]) > 100000;
  }) || sorted[0];

  const filtered = sorted.filter(sup => 
    sup.companyName.toLowerCase().includes(query.toLowerCase()) ||
    (sup.products && sup.products.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 0' }}>
      <div className="form-group" style={{ marginBottom: '8px' }}>
        <input 
          type="text" 
          placeholder="Search supplier by name or products..." 
          className="form-control"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ cursor: 'text' }}
          autoFocus
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', margin: '0 -24px', padding: '4px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            No matching suppliers found.
          </div>
        ) : (
          filtered.map(sup => {
            const isNewest = newestSupplier && newestSupplier.id === sup.id;
            const queryTerm = (productName || "").toLowerCase().trim();
            const aProducts = (sup.products || "").toLowerCase();
            const isRecommended = queryTerm && (aProducts.includes(queryTerm) || queryTerm.split(' ').some(w => w.length > 2 && aProducts.includes(w)));
            return (
              <div 
                key={sup.id} 
                className="live-order-card" 
                style={{ 
                  padding: '12px', 
                  cursor: 'pointer', 
                  margin: '4px 0', 
                  border: currentSupplierId === sup.id ? '2.5px solid var(--primary-orange)' : '1.5px solid var(--border-color)', 
                  borderRadius: '8px', 
                  textAlign: 'left' 
                }} 
                onClick={() => onSelect(sup.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sup.companyName}
                    {isRecommended && (
                      <span style={{ background: '#ffedd5', color: '#ea580c', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ffd8a8' }}>
                        ★ Recommended
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'inline-flex' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ color: i < (sup.rating || 5) ? '#fbbf24' : '#d1d5db', fontSize: '13px' }}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Contact: {sup.contactPerson} | WA: {sup.whatsappNumber}</div>
                {sup.products && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', background: '#f9f9f8', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    Products: {sup.products}
                  </div>
                )}
              </div>
            );
          })
        )}
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
  const [ignoredSuggestions, setIgnoredSuggestions] = useState({});

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

  const handleApprovalBillToChange = (reqId, val) => {
    if (val === "ADD_NEW") {
      let newLoc = "";
      setModalContent(
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '13px', marginBottom: '12px' }}>Enter the name of the new delivery/billing location:</p>
          <div className="form-group">
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Warehouse 3 - Chennai" 
              onChange={e => { newLoc = e.target.value; }} 
              style={{ cursor: 'text' }}
            />
          </div>
          <button 
            className="btn-orange" 
            onClick={() => {
              if (newLoc.trim()) {
                const updatedLocations = [...state.branding.billingLocations, newLoc.trim()];
                state.updateBranding({
                  ...state.branding,
                  billingLocations: updatedLocations
                });
                updateCardField(reqId, "billTo", newLoc.trim());
              }
              closeModal();
            }} 
            style={{ width: '100%', cursor: 'pointer' }}
          >
            Add Location
          </button>
        </div>,
        "Add New Location"
      );
      openModal();
    } else {
      updateCardField(reqId, "billTo", val);
    }
  };

  const handleApprove = async (id) => {
    try {
      const cardData = formData[id];
      if (!cardData || !cardData.productName || !cardData.qty || !cardData.supplierId || !cardData.billTo) {
        state.showToast("Validation Error", "Please ensure product name, quantity, supplier, and billing location are filled.", "success");
        return;
      }

      const req = state.requests.find(r => r.id === id);
      if (!req) {
        state.showToast("Not Found", "Request not found in database.", "success");
        return;
      }

      const user = state.currentUser;
      const updatedHistory = [...req.history, {
        status: "No Response",
        updatedBy: user.name,
        role: user.role,
        timestamp: new Date().toISOString(),
        remarks: "Approved and PO generated (Order Placed)."
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
        status: "No Response",
        history: updatedHistory
      };

      const saved = await apiService.updateRequest(id, updatedReq);
      if (!saved) {
        throw new Error("Failed to update database. API returned empty response.");
      }
      state.setRequests(state.requests.map(r => r.id === id ? saved : r));

      state.logEvent("Approved Request & Edited", "Pending", "No Response", `Admin approved ${id}. Assigned Supplier ID: ${cardData.supplierId}`);
      addNotification("Request Approved", `${cardData.productName} requested by ${req.employeeName} has been approved.`, "Both");

      navigateTo(`#po-preview?id=${id}`);
    } catch (err) {
      setModalContent(
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--status-red)', fontWeight: 'bold' }}>PO Approval Failure</p>
          <p>{err.message || "An unexpected error occurred during PO generation."}</p>
          <button className="btn-dark" onClick={closeModal} style={{ cursor: 'pointer' }}>Close</button>
        </div>,
        "Execution Error"
      );
      openModal();
    }
  };

  const handleReject = (id) => {
    let reason = "Denied by management.";
    setModalContent(
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontSize: '13px', marginBottom: '12px' }}>Enter rejection reason:</p>
        <div className="form-group">
          <input 
            type="text" 
            className="form-control" 
            defaultValue={reason} 
            onChange={e => { reason = e.target.value; }} 
            style={{ cursor: 'text' }}
          />
        </div>
        <button 
          className="btn-orange" 
          onClick={async () => {
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
                remarks: reason || "Denied by management."
              }]
            };

            const saved = await apiService.updateRequest(id, updatedReq);
            state.setRequests(state.requests.map(r => r.id === id ? saved : r));

            state.logEvent("Rejected Request", "Pending", "Rejected", `Admin rejected ${id}. Reason: ${reason}`);
            addNotification("Request Rejected", `Request ${id} rejected. Reason: ${reason}`, "Both");
            state.triggerWebhook("request.rejected", saved);
            
            closeModal();
          }} 
          style={{ width: '100%', cursor: 'pointer' }}
        >
          Confirm Reject
        </button>
      </div>,
      "Reject Request"
    );
    openModal();
  };

  const openSupplierPicker = (requestId) => {
    const handleSelect = (supId) => {
      updateCardField(requestId, "supplierId", supId);
      closeModal();
    };

    setModalContent(
      <SupplierPicker 
        suppliers={state.suppliers} 
        currentSupplierId={formData[requestId]?.supplierId} 
        onSelect={handleSelect} 
        productName={formData[requestId]?.productName}
      />,
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
                  <select className="form-control" value={current.billTo} onChange={e => handleApprovalBillToChange(req.id, e.target.value)} style={{ cursor: 'pointer' }}>
                    {state.branding.billingLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    <option value="ADD_NEW">+ (Add New Location)</option>
                  </select>
                </div>

                {req.suggestedSupplier && !ignoredSuggestions[req.id] && (
                  <div style={{ background: 'var(--bg-cream)', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '11px', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '850', color: 'var(--primary-orange)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '6px' }}>Suggested Supplier Details:</div>
                    <div><b>Name:</b> {req.suggestedSupplier}</div>
                    {req.suggestedSupplierPhone && <div><b>Phone:</b> {req.suggestedSupplierPhone}</div>}
                    {req.suggestedSupplierEmail && <div><b>Email:</b> {req.suggestedSupplierEmail}</div>}
                    {req.suggestedSupplierRemarks && <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}><b>Remarks:</b> "{req.suggestedSupplierRemarks}"</div>}
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button 
                        type="button" 
                        className="btn-orange" 
                        onClick={() => {
                          const match = state.suppliers.find(s => s.companyName.toLowerCase() === req.suggestedSupplier.toLowerCase());
                          if (match) {
                            updateCardField(req.id, "supplierId", match.id);
                            setIgnoredSuggestions(prev => ({ ...prev, [req.id]: true }));
                            state.showToast("Supplier Approved", `Auto-populated with ${match.companyName}`, "info");
                          } else {
                            state.showToast("Supplier Match Failed", `No registered supplier matching "${req.suggestedSupplier}"`, "success");
                          }
                        }}
                        style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', flex: 1, height: '32px' }}
                      >
                        ✓ Approve suggested
                      </button>
                      <button 
                        type="button" 
                        className="btn-dark" 
                        onClick={() => {
                          setIgnoredSuggestions(prev => ({ ...prev, [req.id]: true }));
                          state.showToast("Suggestion Rejected", "You can manually select the supplier.", "info");
                        }}
                        style={{ padding: '6px 12px', fontSize: '11px', cursor: 'pointer', flex: 1, height: '32px', backgroundColor: 'var(--text-muted)' }}
                      >
                        ✕ Reject suggested
                      </button>
                    </div>
                  </div>
                )}

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
    const url = `https://api.whatsapp.com/send?phone=${supplier.whatsappNumber || ""}&text=${encodeURIComponent(formattedMsg)}`;
    
    // Set status to No Response (Order Placed)
    const updatedHistory = [...req.history, {
      status: "No Response",
      updatedBy: state.currentUser.name,
      role: state.currentUser.role || "Admin",
      timestamp: new Date().toISOString(),
      remarks: "PO dispatched to WhatsApp."
    }];
    const updatedReq = { ...req, status: "No Response", history: updatedHistory };
    const saved = await apiService.updateRequest(requestId, updatedReq);
    state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

    state.logEvent("WhatsApp Message Sent", "No Response", "No Response", `Sent PO via WhatsApp to ${supplier.companyName || "supplier"}`);
    addNotification("Order Placed", `Order ${requestId} status is now No Response (Awaiting Supplier Acknowledgment)`, "Both");
    state.triggerWebhook("status.changed", saved);

    // Initial WhatsApp Simulator thread
    state.initWhatsAppThread(requestId, formattedMsg);

    window.open(url, '_blank');
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

        <button className="btn-orange" onClick={handleShareWhatsApp} style={{ marginBottom: '20px', width: '100%', cursor: 'pointer' }}>
          Share via WhatsApp
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4B. PENDING ORDERS VIEW COMPONENT
// ----------------------------------------------------
export function PendingOrdersView({ state, navigateTo }) {
  const user = state.currentUser;
  const isEmployee = user.role === "Employee";

  const filteredRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name && r.status === "Pending") 
    : state.requests.filter(r => r.status === "Pending");

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
          <h1 style={{ fontSize: '20px' }}>Pending Orders</h1>
        </div>
        <div className="header-right">
          <div style={{ background: '#ffedd5', fontSize: '12px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', color: '#ea580c' }}>
            {filteredRequests.length}
          </div>
        </div>
      </header>

      <div style={{ paddingTop: '10px' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No pending orders found.
          </div>
        ) : (
          sorted.map(req => {
            return (
              <div key={req.id} className="live-order-card" onClick={() => navigateTo(`#order-details?id=${req.id}`)} style={{ cursor: 'pointer' }}>
                <div className="card-header-row">
                  <h3>{req.productName}</h3>
                  <span className="badge-view-details">Details</span>
                </div>
                
                <div className="card-product-line">
                  Qty - <b>{req.qty} {req.units}</b>
                </div>

                <div className="card-status-line">
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{req.id}</span>
                  <span className="status-badge pending">{req.status}</span>
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
// 5. LIVE ORDERS VIEW COMPONENT
// ----------------------------------------------------
export function LiveOrdersView({ state, navigateTo }) {
  const user = state.currentUser;
  const isEmployee = user.role === "Employee";

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || "");
  const filterParam = urlParams.get('filter');

  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const isWithin14Days = (dateIso) => {
    if (!dateIso) return true;
    return (new Date() - new Date(dateIso)) <= fourteenDaysMs;
  };

  const [activeTab, setActiveTab] = useState(() => {
    if (filterParam) {
      const normalized = filterParam.toLowerCase().replace(/ /g, '');
      if (normalized === 'noresponse') return 'No Response';
      if (normalized === 'acknowledged') return 'Acknowledged';
      if (normalized === 'booked') return 'Booked';
      if (normalized === 'received') return 'Received';
    }
    return 'No Response';
  });

  // Track hash changes to update activeTab if navigated via smart view
  useEffect(() => {
    const handleHashChange = () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || "");
      const f = params.get('filter');
      if (f) {
        const normalized = f.toLowerCase().replace(/ /g, '');
        if (normalized === 'noresponse') setActiveTab('No Response');
        if (normalized === 'acknowledged') setActiveTab('Acknowledged');
        if (normalized === 'booked') setActiveTab('Booked');
        if (normalized === 'received') setActiveTab('Received');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  let filteredRequests = isEmployee 
    ? state.requests.filter(r => r.employeeName === user.name) 
    : state.requests;

  if (activeTab === "Received") {
    filteredRequests = filteredRequests.filter(r => r.status === "Received" && isWithin14Days(r.actualDeliveryDate));
  } else {
    filteredRequests = filteredRequests.filter(r => r.status === activeTab);
  }

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
        {/* Tab Filters */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', background: 'var(--card-bg)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
          {["No Response", "Acknowledged", "Booked", "Received"].map(tab => {
            const isActive = activeTab === tab;
            let count = 0;
            if (tab === "Received") {
              count = isEmployee 
                ? state.requests.filter(r => r.employeeName === user.name && r.status === "Received" && isWithin14Days(r.actualDeliveryDate)).length
                : state.requests.filter(r => r.status === "Received" && isWithin14Days(r.actualDeliveryDate)).length;
            } else {
              count = isEmployee
                ? state.requests.filter(r => r.employeeName === user.name && r.status === tab).length
                : state.requests.filter(r => r.status === tab).length;
            }
            
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 2px',
                  fontSize: '11px',
                  fontWeight: '800',
                  border: 'none',
                  background: isActive ? 'var(--primary-orange)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-main)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <span>{tab}</span>
                <span style={{ fontSize: '10px', background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--bg-cream)', color: isActive ? '#fff' : 'var(--text-muted)', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {sorted.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            No active orders in "{activeTab}" stage.
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-badge ${req.status.toLowerCase().replace(/ /g, '')}`}>{req.status}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function OrderDetailsView({ state, navigateTo, requestId, addNotification, openModal, closeModal, setModalContent }) {
  const req = state.requests.find(r => r.id === requestId);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofFileName, setProofFileName] = useState("");

  if (!req) return <p style={{ padding: '20px' }}>Order not found</p>;

  const supplier = state.suppliers.find(s => s.id === req.supplierId) || { companyName: "Not Assigned" };
  const dateStr = new Date(req.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = new Date(req.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleProofCamera = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setProofFile(reader.result);
        setProofFileName(file.name || `Proof_Camera_${Date.now()}.jpg`);
        state.showToast("Proof Captured", "Camera image attached.", "success");
        renderVerifyReceivedModal(reader.result, file.name || `Proof_Camera_${Date.now()}.jpg`);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      state.showToast("Camera Error", "Failed to capture image.", "success");
    }
  };

  const handleProofGallery = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setProofFile(reader.result);
        setProofFileName(file.name);
        state.showToast("Proof Uploaded", `${file.name} attached.`, "success");
        renderVerifyReceivedModal(reader.result, file.name);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      state.showToast("Upload Error", "Failed to read image file.", "success");
    }
  };

  const getLogisticsStatus = (r) => {
    const sequence = ["No Response", "Acknowledged", "Booked", "Received"];
    if (sequence.includes(r.status)) return r.status;
    if (r.history) {
      for (let i = r.history.length - 1; i >= 0; i--) {
        if (sequence.includes(r.history[i].status)) {
          return r.history[i].status;
        }
      }
    }
    return "No Response";
  };

  const logisticsStatus = getLogisticsStatus(req);
  const trackingStages = ["Order Placed", "Acknowledged", "Booked", "Received"];

  let progressWidth = 0;
  if (logisticsStatus === "No Response") progressWidth = 0;
  else if (logisticsStatus === "Acknowledged") progressWidth = 33;
  else if (logisticsStatus === "Booked") progressWidth = 66;
  else if (logisticsStatus === "Received") progressWidth = 100;

  const getTimelineDate = (statusName) => {
    if (statusName === "No Response") {
      return req.date;
    }
    const entry = req.history && req.history.find(h => h.status === statusName);
    return entry ? entry.timestamp : null;
  };

  const handleStatusChange = async (newStatus, remarks = "", proofOfReceipt = null, proofOfReceiptName = "") => {
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
      history: updatedHistory,
      proofOfReceipt: proofOfReceipt || req.proofOfReceipt || null,
      proofOfReceiptName: proofOfReceiptName || req.proofOfReceiptName || ""
    };

    if (newStatus === "Received") {
      updatedReq.actualDeliveryDate = new Date().toISOString();
    }

    const saved = await apiService.updateRequest(requestId, updatedReq);
    state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

    state.logEvent("Status Changed Manually", prevStatus, newStatus, `Manual status override to: ${newStatus}`);
    addNotification("Status Updated", `Order ${requestId} status is now ${newStatus}.`, "Both");

    let eventKey = "request.updated";
    if (newStatus === "Booked") eventKey = "request.transit";
    else if (newStatus === "Received") eventKey = "request.delivered";

    state.triggerWebhook(eventKey, saved);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ["pdf", "xls", "xlsx", "doc", "docx", "jpg", "jpeg", "png"];
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      state.showToast("Security Alert", "Unauthorized file type. Only PDF, Word, Excel, and image formats are allowed.", "success");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result;
      const updatedHistory = [...req.history, {
        status: "Booked",
        updatedBy: state.currentUser.name,
        role: state.currentUser.role,
        timestamp: new Date().toISOString(),
        remarks: `Uploaded LR consignment copy: ${selectedFileName}`
      }];

      const updatedReq = {
        ...req,
        status: "Booked",
        lrCopy: base64data,
        lrFileName: selectedFileName,
        history: updatedHistory
      };

      const saved = await apiService.updateRequest(requestId, updatedReq);
      state.setRequests(state.requests.map(r => r.id === requestId ? saved : r));

      state.logEvent("Uploaded LR Consignment", req.status, "Booked", `Uploaded copy ${selectedFileName} for ${requestId}`);
      addNotification("Order Booked", `LR Copy ${selectedFileName} has been uploaded. Status is now Booked.`, "Both");
      state.triggerWebhook("status.changed", saved);

      setSelectedFile(null);
      setSelectedFileName("");
    };
    reader.readAsDataURL(selectedFile);
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

  const renderVerifyReceivedModal = (currentProof = null, currentProofName = "") => {
    let remarks = "Physically verified and stacked in store.";
    
    setModalContent(
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontSize: '13px', marginBottom: '12px' }}>Enter verification remarks:</p>
        <div className="form-group">
          <input 
            type="text" 
            className="form-control" 
            defaultValue={remarks} 
            onChange={e => { remarks = e.target.value; }} 
            style={{ cursor: 'text' }}
          />
        </div>
        
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Proof of Receipt</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              type="button"
              className="btn-outlined-icon-edit" 
              onClick={() => document.getElementById("proof-camera-input")?.click()}
              style={{ backgroundColor: 'transparent', color: 'var(--primary-orange)', border: '1px solid var(--primary-orange)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', boxSizing: 'border-box' }}
            >
              📸 Camera
            </button>
            <input id="proof-camera-input" type="file" accept="image/*" capture="environment" onChange={handleProofCamera} style={{ display: 'none' }} />
            
            <button 
              type="button"
              className="btn-outlined-icon-key" 
              onClick={() => document.getElementById("proof-gallery-input")?.click()}
              style={{ backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--text-main)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', boxSizing: 'border-box' }}
            >
              📁 Gallery
            </button>
            <input id="proof-gallery-input" type="file" accept="image/*" onChange={handleProofGallery} style={{ display: 'none' }} />
          </div>

          {currentProof && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#f9f9f8', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--status-green)' }}>✓ Proof Attached ({currentProofName})</span>
              <img src={currentProof} style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '6px', objectFit: 'contain', border: '1px solid var(--border-color)' }} alt="Proof preview" />
            </div>
          )}
        </div>

        <button 
          className="btn-orange" 
          onClick={() => {
            handleStatusChange("Received", remarks || "Physically verified and stacked in store.", currentProof, currentProofName);
            closeModal();
          }} 
          style={{ width: '100%', cursor: 'pointer', marginTop: '14px' }}
        >
          Confirm Received
        </button>
      </div>,
      "Verify & Mark Received"
    );
  };

  const handleVerifyReceived = () => {
    setProofFile(null);
    setProofFileName("");
    renderVerifyReceivedModal(null, "");
    openModal();
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
        <div style={{ background: 'var(--dark-charcoal)', color: '#ffffff', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#a0978d', letterSpacing: '0.5px' }}>Current Order Status</div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '4px', color: '#ffffff' }}>{req.status}</div>
          </div>
          <span className={`status-badge ${req.status.toLowerCase().replace(/ /g, '')}`} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 'bold' }}>{req.status}</span>
        </div>

        <div className="timeline-container" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div className="timeline">
            {(() => {
              const trackingStageColors = {
                "Order Placed": "#ef4444",
                "Acknowledged": "#f97316",
                "Booked": "#3b82f6",
                "Received": "#10b981"
              };
              const currentStageColor = trackingStageColors[
                logisticsStatus === "No Response" ? "Order Placed" : logisticsStatus
              ] || "#ef4444";
              
              return (
                <>
                  <div style={{ position: 'absolute', top: '15px', left: '20px', right: '20px', height: '4px', zIndex: 2 }}>
                    <div style={{ width: `${progressWidth}%`, height: '100%', backgroundColor: currentStageColor, transition: 'width 0.4s ease' }}></div>
                  </div>
                  {trackingStages.map((stage, idx) => {
                    const isActive = stage === (logisticsStatus === "No Response" ? "Order Placed" : logisticsStatus);
                    const isCompleted = trackingStages.indexOf(logisticsStatus === "No Response" ? "Order Placed" : logisticsStatus) >= idx;
                    const stageColor = trackingStageColors[stage] || "var(--status-green)";
                    
                    return (
                      <div key={stage} className={`timeline-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                        <div 
                          className="timeline-dot"
                          style={{
                            backgroundColor: isCompleted ? stageColor : 'var(--card-bg)',
                            borderColor: isCompleted ? stageColor : 'var(--border-color)',
                            color: isCompleted ? '#ffffff' : 'var(--text-muted)',
                            boxShadow: isActive ? `0 0 0 4px ${stageColor}40` : 'none'
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div className="timeline-label">{stage}</div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', textAlign: 'left', color: 'var(--text-main)' }}>Supplier: {supplier.companyName}</h3>
        </div>

        {req.poNumber && <div style={{ fontSize: '12px', marginBottom: '14px', textAlign: 'left' }}><b>PO Ref:</b> {req.poNumber} ({formatDate(req.poDate)})</div>}

        {req.proofOfReceipt && (
          <div style={{ background: '#f0fdf4', border: '1.5px solid #dcfce7', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
            <div style={{ fontWeight: '850', color: 'var(--status-green)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              ✓ Proof of Receipt Attached:
            </div>
            <img src={req.proofOfReceipt} style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'contain' }} alt="Proof of Receipt" />
          </div>
        )}

        {req.lrCopy ? (
          <div className="lr-upload-box" style={{ borderStyle: 'solid', backgroundColor: '#f0fdf4', borderColor: 'var(--status-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={handleViewLr}>
            <div className="lr-text-primary" style={{ color: 'var(--status-green)' }}>
              LR Copy Attached {req.lrFileName ? `(${req.lrFileName})` : ''}
            </div>
            <span className="badge-view-lr" style={{ backgroundColor: 'var(--status-green)' }}>View LR</span>
          </div>
        ) : (
          <div style={{ marginBottom: '14px' }}>
            <label className="lr-upload-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
              <div className="lr-text-primary">
                {selectedFileName ? `Selected: ${selectedFileName}` : "Upload LR Copy"}
              </div>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              <span className="badge-view-lr">Select File</span>
            </label>
            {selectedFile && (
              <button 
                onClick={handleUploadSubmit} 
                className="btn-orange" 
                style={{ marginTop: '8px', padding: '8px 16px', fontSize: '12px', width: 'auto', cursor: 'pointer' }}
              >
                Upload LR Document
              </button>
            )}
          </div>
        )}

        <div className="timeline-container" style={{ textAlign: 'left', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logistics timeline</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--border-color)', marginLeft: '12px' }}>
            {[
              { label: "Order Placed On", status: "No Response" },
              { label: "Acknowledged On", status: "Acknowledged" },
              { label: "Booked On", status: "Booked" },
              { label: "Received On", status: "Received" }
            ].map((stage, idx) => {
              const date = getTimelineDate(stage.status);
              const isCompleted = !!date;
              const isCurrent = req.status === stage.status;
              
              const stageColors = {
                "No Response": "#ef4444",
                "Acknowledged": "#f97316",
                "Booked": "#3b82f6",
                "Received": "#10b981"
              };
              const dotColor = stageColors[stage.status] || "var(--status-green)";
              
              return (
                <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-35px', 
                    top: '2px', 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: isCompleted ? dotColor : 'var(--text-muted)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: isCurrent ? `3.5px solid ${dotColor}` : '3px solid #ffffff',
                    boxShadow: isCurrent ? `0 0 8px ${dotColor}` : 'none',
                    zIndex: 2
                  }}>
                    {isCompleted ? <Icons.Check style={{ width: '10px', height: '10px' }} /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }}></div>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: isCompleted ? 'var(--text-main)' : 'var(--text-muted)' }}>{stage.label}</span>
                    {isCompleted && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
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

        {req.status === "Booked" && (
          <button className="btn-orange" onClick={handleVerifyReceived} style={{ marginTop: '16px', cursor: 'pointer', width: '100%' }}>
            Verify & Mark Received
          </button>
        )}

        {hasEditPermission && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Change status</label>
              <select className="form-control" onChange={e => handleStatusChange(e.target.value)} defaultValue="" style={{ cursor: 'pointer' }}>
                <option value="" disabled>-- Choose New Status --</option>
                {["No Response", "Acknowledged", "Booked", "Received", "Rejected", "Cancelled"].map(s => {
                  const sequence = ["No Response", "Acknowledged", "Booked", "Received"];
                  let currentIdx = sequence.indexOf(req.status);
                  if (currentIdx === -1 && req.history) {
                    for (let i = req.history.length - 1; i >= 0; i--) {
                      const histStatus = req.history[i].status;
                      const idx = sequence.indexOf(histStatus);
                      if (idx !== -1) {
                        currentIdx = idx;
                        break;
                      }
                    }
                  }
                  const targetIdx = sequence.indexOf(s);

                  let disabled = false;
                  let optionLabel = s;

                  if (targetIdx !== -1 && currentIdx !== -1) {
                    if (targetIdx <= currentIdx) {
                      optionLabel = `${s} (Completed)`;
                      disabled = true;
                    } else if (targetIdx > currentIdx + 1) {
                      disabled = true;
                    } else if (targetIdx === currentIdx + 1) {
                      optionLabel = `${s} (Next Stage)`;
                    }
                  } else if (s === "Rejected" || s === "Cancelled") {
                    disabled = req.status === "Received";
                  } else {
                    disabled = true;
                  }

                  const optionStyle = (targetIdx !== -1 && targetIdx <= currentIdx)
                    ? { color: '#9ca3af', textDecoration: 'line-through' }
                    : disabled ? { color: '#d1d5db' } : {};

                  return (
                    <option key={s} value={s} disabled={disabled} style={optionStyle}>
                      {optionLabel}
                    </option>
                  );
                })}
              </select>
            </div>
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
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  
  const [currentError, setCurrentError] = useState("");
  const [newError, setNewError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  
  const [success, setSuccess] = useState("");

  const handleFocus = (field) => {
    if (field === 'current') {
      setShowNew(false);
      setShowConfirm(false);
    } else if (field === 'new') {
      setShowCurrent(false);
      setShowConfirm(false);
    } else if (field === 'confirm') {
      setShowCurrent(false);
      setShowNew(false);
    }
  };

  const handleBlur = (e) => {
    const target = e.relatedTarget;
    if (!target || !['currentPass', 'newPass', 'confirmPass'].includes(target.name)) {
      setTimeout(() => {
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
      }, 100);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setCurrentError("");
    setNewError("");
    setConfirmError("");
    setSuccess("");

    let hasError = false;

    if (!isPasswordStrong(newPass)) {
      setNewError("Please ensure your password meets all strength requirements.");
      hasError = true;
    }
    if (newPass !== confirmPass) {
      setConfirmError("New passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    // Mask passwords immediately on submission
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);

    try {
      await apiService.changePassword(user.id, currentPass, newPass);
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      setCurrentError(err.message || "Incorrect current password.");
    }
  };

  return (
    <form onSubmit={handleSavePassword} style={{ textAlign: 'left' }}>
      {success && <div style={{ color: 'var(--status-green)', fontSize: '12px', marginBottom: '10px' }}>✓ {success}</div>}
      <div className="form-group">
        <label>Current Password</label>
        <div style={{ position: 'relative' }}>
          <input 
            type={showCurrent ? "text" : "password"} 
            name="currentPass" 
            value={currentPass}
            onChange={e => { setCurrentPass(e.target.value); setCurrentError(""); }}
            onFocus={() => handleFocus('current')}
            onBlur={handleBlur}
            className="form-control" 
            required 
            style={{ cursor: 'text', paddingRight: '40px', border: currentError ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} 
          />
          <button 
            type="button" 
            onClick={() => setShowCurrent(!showCurrent)} 
            onMouseDown={e => e.preventDefault()}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} 
            title={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <Icons.EyeSlash /> : <Icons.Eye />}
          </button>
        </div>
        {currentError && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>⚠️ {currentError}</div>}
      </div>
      
      <div className="form-group">
        <label>New Password</label>
        <div style={{ position: 'relative' }}>
          <input 
            type={showNew ? "text" : "password"} 
            name="newPass" 
            value={newPass} 
            onChange={e => { setNewPass(e.target.value); if (isPasswordStrong(e.target.value)) setNewError(""); }} 
            onFocus={() => handleFocus('new')}
            onBlur={handleBlur}
            className="form-control" 
            required 
            style={{ cursor: 'text', paddingRight: '40px', border: newError ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} 
          />
          <button 
            type="button" 
            onClick={() => setShowNew(!showNew)} 
            onMouseDown={e => e.preventDefault()}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} 
            title={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <Icons.EyeSlash /> : <Icons.Eye />}
          </button>
        </div>
        {newError && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>⚠️ {newError}</div>}
        <PasswordStrengthIndicator password={newPass} />
      </div>

      <div className="form-group" style={{ marginBottom: '20px' }}>
        <label>Confirm Password</label>
        <div style={{ position: 'relative' }}>
          <input 
            type={showConfirm ? "text" : "password"} 
            name="confirmPass" 
            value={confirmPass} 
            onChange={e => { setConfirmPass(e.target.value); if (e.target.value === newPass) setConfirmError(""); }} 
            onFocus={() => handleFocus('confirm')}
            onBlur={handleBlur}
            className="form-control" 
            required 
            style={{ cursor: 'text', paddingRight: '40px', border: confirmError ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} 
          />
          <button 
            type="button" 
            onClick={() => setShowConfirm(!showConfirm)} 
            onMouseDown={e => e.preventDefault()}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} 
            title={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <Icons.EyeSlash /> : <Icons.Eye />}
          </button>
        </div>
        {confirmError && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>⚠️ {confirmError}</div>}
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
      <ChangePasswordForm key="change-password-form" user={user} apiService={apiService} closeModal={closeModal} />,
      "Change Password"
    );
    openModal();
  };

  const handleSaveAvatar = async (updatedUser) => {
    await apiService.saveUser(updatedUser);
    state.setCurrentUser(updatedUser);
    state.showToast("Avatar Settings Saved", "Your avatar customization was updated successfully.", "success");
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user.role}</div>
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
  const isAdmin = state.activeRole === "Main Admin" || state.activeRole === "Sub Admin";
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
            {sup.gst && <div style={{ fontSize: '12px', marginBottom: '6px' }}><b>GST No:</b> {sup.gst}</div>}
            <div style={{ fontSize: '12px', marginBottom: '6px' }}><b>Rating:</b> {"⭐".repeat(sup.rating || 5)}</div>
            {sup.remarks && <div style={{ fontSize: '12px', marginBottom: '6px', fontStyle: 'italic', color: 'var(--text-muted)' }}><b>Remarks:</b> {sup.remarks}</div>}
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
  
  // New Supplier details
  const [gst, setGst] = useState(supplier ? (supplier.gst || "") : "");
  const [rating, setRating] = useState(supplier ? (supplier.rating || 5) : 5);
  const [remarks, setRemarks] = useState(supplier ? (supplier.remarks || "") : "");
  const [validationError, setValidationError] = useState("");

  const handleSave = () => {
    if (!company || !contact || !phone || !products.trim()) {
      setValidationError("Please fill in Company name, Contact person, WhatsApp number, and Products Supplied.");
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
      gst,
      rating: parseInt(rating),
      remarks
    };
    onSave(data, !!supplier);
  };

  return (
    <div style={{ textAlign: 'left' }}>
      {validationError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
          ⚠️ {validationError}
        </div>
      )}

      <div className="form-group">
        <label>Company Name</label>
        <input type="text" className="form-control" placeholder="Company Name" value={company} onChange={e => setCompany(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Contact Person</label>
        <input type="text" className="form-control" placeholder="Contact Person" value={contact} onChange={e => setContact(e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>WhatsApp Number</label>
          <input type="text" className="form-control" placeholder="WhatsApp Number" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="form-group">
          <label>GST Number (Optional)</label>
          <input type="text" className="form-control" placeholder="GST Number" value={gst} onChange={e => setGst(e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Email (Optional)</label>
          <input type="email" className="form-control" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Rating (1-5 Stars)</label>
          <select className="form-control" value={rating} onChange={e => setRating(e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Address (Optional)</label>
        <input type="text" className="form-control" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Products Supplied</label>
        <input type="text" className="form-control" placeholder="Products Supplied (e.g. bearings, valves)" value={products} onChange={e => setProducts(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Supplier Remarks (Optional)</label>
        <textarea className="form-control" rows="2" placeholder="Supplier Remarks (e.g. fast shipping)" value={remarks} onChange={e => setRemarks(e.target.value)} style={{ resize: 'vertical' }}></textarea>
      </div>
      <button className="btn-dark" onClick={handleSave} style={{ marginTop: '10px', width: '100%', cursor: 'pointer' }}>Save Supplier</button>
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
    let csvContent = "Timestamp,User,Role,Action,Previous Value,Updated Value,Details\n";

    // Export current filtered search results
    logs.forEach(log => {
      const row = [
        log.timestamp,
        `"${log.userName.replace(/"/g, '""')}"`,
        `"${log.role.replace(/"/g, '""')}"`,
        `"${log.action.replace(/"/g, '""')}"`,
        `"${log.previousValue.replace(/"/g, '""')}"`,
        `"${log.updatedValue.replace(/"/g, '""')}"`,
        `"${log.details ? log.details.replace(/"/g, '""') : ''}"`
      ].join(",");
      csvContent += row + "\n";
    });

    // Create Blob with UTF-8 BOM for universal mobile and desktop compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Alagiri_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const isWithin14Days = (dateIso) => {
    if (!dateIso) return true;
    return (new Date() - new Date(dateIso)) <= fourteenDaysMs;
  };

  const filteredRequests = state.requests.filter(r => {
    if (isEmployee && r.employeeName !== user.name) return false;
    
    // Include Received if more than 14 days ago
    if (r.status === "Received" && !isWithin14Days(r.actualDeliveryDate)) {
      return true;
    }
    return r.status === "Rejected" || r.status === "Cancelled";
  });

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-badge ${req.status.toLowerCase().replace(/ /g, '')}`}>{req.status}</span>
                  </div>
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
  // Login fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--primary-orange)', fontWeight: '800' }}>Alagiri</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Procurement & Logistics System</p>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'left' }}>
            ⚠️ {error}
          </div>
        )}

        {/* LOG IN FORM */}
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
    </div>
  </div>
  );
}

// ----------------------------------------------------
// 13. FORCE CHANGE PASSWORD VIEW
// ----------------------------------------------------
export function ForceChangePasswordView({ state, user, onPasswordChanged }) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [newError, setNewError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleFocus = (field) => {
    if (field === 'new') {
      setShowConfirmPass(false);
    } else if (field === 'confirm') {
      setShowNewPass(false);
    }
  };

  const handleBlur = (e) => {
    const target = e.relatedTarget;
    if (!target || !['newPass', 'confirmPass'].includes(target.name)) {
      setTimeout(() => {
        setShowNewPass(false);
        setShowConfirmPass(false);
      }, 100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNewError("");
    setConfirmError("");
    
    let hasError = false;

    if (!isPasswordStrong(newPass)) {
      setNewError("Please ensure your password meets all strength requirements.");
      hasError = true;
    }
    if (newPass !== confirmPass) {
      setConfirmError("Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    // Mask passwords immediately on submission
    setShowNewPass(false);
    setShowConfirmPass(false);

    setLoading(true);
    try {
      const updatedUser = await apiService.forceChangePassword(user.id, newPass);
      if (state && state.showToast) {
        state.showToast("Password Updated", "Password changed successfully! Welcome to Alagiri.", "success");
      }
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
              <input 
                type={showNewPass ? "text" : "password"} 
                name="newPass"
                className="form-control" 
                placeholder="••••••••" 
                value={newPass} 
                onChange={e => { setNewPass(e.target.value); if (isPasswordStrong(e.target.value)) setNewError(""); }} 
                onFocus={() => handleFocus('new')}
                onBlur={handleBlur}
                required 
                style={{ cursor: 'text', paddingRight: '40px', border: newError ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} 
              />
              <button 
                type="button" 
                onClick={() => setShowNewPass(!showNewPass)} 
                onMouseDown={e => e.preventDefault()}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} 
                title={showNewPass ? "Hide password" : "Show password"}
              >
                {showNewPass ? <Icons.EyeSlash /> : <Icons.Eye />}
              </button>
            </div>
            {newError && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>⚠️ {newError}</div>}
            <PasswordStrengthIndicator password={newPass} />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPass ? "text" : "password"} 
                name="confirmPass"
                className="form-control" 
                placeholder="••••••••" 
                value={confirmPass} 
                onChange={e => { setConfirmPass(e.target.value); if (e.target.value === newPass) setConfirmError(""); }} 
                onFocus={() => handleFocus('confirm')}
                onBlur={handleBlur}
                required 
                style={{ cursor: 'text', paddingRight: '40px', border: confirmError ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} 
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPass(!showConfirmPass)} 
                onMouseDown={e => e.preventDefault()}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }} 
                title={showConfirmPass ? "Hide password" : "Show password"}
              >
                {showConfirmPass ? <Icons.EyeSlash /> : <Icons.Eye />}
              </button>
            </div>
            {confirmError && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>⚠️ {confirmError}</div>}
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
export function UserManagementView({ state, navigateTo, openModal, closeModal, setModalContent }) {
  const [users, setUsers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Form states
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Employee");
  const [department, setDepartment] = useState("Kraft Mill");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [permissions, setPermissions] = useState({
    approve_requests: false,
    manage_suppliers: false,
    view_logs: false,
    edit_orders: false
  });

  const [errors, setErrors] = useState({});

  const validateUserField = (field, value) => {
    let err = "";
    if (field === "name") {
      if (!value.trim()) {
        err = "Full Name is required.";
      } else {
        const nameRegex = /^[a-zA-Z\s.\-']+$/;
        if (!nameRegex.test(value.trim())) {
          err = "Full Name contains invalid characters.";
        }
      }
    } else if (field === "email") {
      if (!value.trim()) {
        err = "Email address is required.";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          err = "Invalid email format.";
        } else {
          const duplicateEmail = users.some(u => u.email?.toLowerCase() === value.trim().toLowerCase() && u.id !== (editUser ? editUser.id : ''));
          if (duplicateEmail) {
            err = "Email address is already in use by another user.";
          }
        }
      }
    } else if (field === "phone") {
      if (!value.trim()) {
        err = "Phone number is required.";
      } else {
        const phoneRegex = /^(?:\+91)?\d{10}$/;
        if (!phoneRegex.test(value.trim())) {
          err = "Invalid Indian mobile number (must be a 10-digit number, optionally starting with +91).";
        }
      }
    }
    setErrors(prev => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const [activeDepts, setActiveDepts] = useState([]);

  const loadUsersAndDepts = async () => {
    const list = await apiService.getUsers();
    setUsers(list);
    const depts = await apiService.getDepartments();
    const active = depts.filter(d => !d.disabled);
    setActiveDepts(active);
  };

  useEffect(() => {
    loadUsersAndDepts();
  }, []);

  const handleTogglePerm = (perm) => {
    setPermissions(prev => ({
      ...prev,
      [perm]: !prev[perm]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Full Name is required.";
    else {
      const nameRegex = /^[a-zA-Z\s.\-']+$/;
      if (!nameRegex.test(name.trim())) {
        newErrors.name = "Full Name contains invalid characters.";
      }
    }

    if (!email.trim()) newErrors.email = "Email address is required.";
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Invalid email format.";
      } else {
        const duplicateEmail = users.some(u => u.email?.toLowerCase() === email.trim().toLowerCase() && u.id !== (editUser ? editUser.id : ''));
        if (duplicateEmail) {
          newErrors.email = "Email address is already in use by another user.";
        }
      }
    }

    if (!phone.trim()) newErrors.phone = "Phone number is required.";
    else {
      const phoneRegex = /^(?:\+91)?\d{10}$/;
      if (!phoneRegex.test(phone.trim())) {
        newErrors.phone = "Invalid Indian mobile number (must be a 10-digit number, optionally starting with +91).";
      }
    }

    if (!username.trim() && !editUser) {
      newErrors.username = "Username is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      state.showToast("Validation Error", "Please resolve all validation errors before saving.", "success");
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
          email,
          phone,
          permissions: role === "Sub Admin" ? permissions : {}
        };
        await apiService.saveUser(updated);
        state.logEvent("Edited User Account", editUser.username, username, `Main Admin updated user settings for ${username}.`);
        
        setModalContent(
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--status-green)', fontWeight: 'bold' }}>✓ Success</p>
            <p>User details updated successfully.</p>
            <button className="btn-dark" onClick={closeModal} style={{ cursor: 'pointer' }}>Close</button>
          </div>,
          "User Updated"
        );
        openModal();
      } else {
        // Create User
        const newUser = {
          id: `usr-${Date.now()}`,
          username,
          name,
          role,
          department,
          email,
          phone,
          disabled: false,
          permissions: role === "Sub Admin" ? permissions : {}
        };
        const tempPassword = await apiService.createUser(newUser);
        
        // Show in-app modal instead of browser alert()
        setModalContent(
          <div style={{ textAlign: 'left' }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ color: '#16a34a', margin: 0, fontSize: '15px', fontWeight: 'bold' }}>✓ User Created Successfully!</h4>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)' }}>
              Please share these temporary credentials with the employee. They will be forced to change their password upon their first login.
            </p>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', margin: '14px 0' }}>
              <div style={{ marginBottom: '8px' }}><b>Username:</b> {username}</div>
              <div style={{ marginBottom: '8px' }}><b>Temporary Password:</b> <code style={{ fontSize: '14px', background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#dc2626', fontWeight: 'bold' }}>{tempPassword}</code></div>
            </div>
            <button className="btn-dark" onClick={closeModal} style={{ width: '100%', cursor: 'pointer' }}>Close</button>
          </div>,
          "Temporary Credentials"
        );
        openModal();

        state.logEvent("Created User Account", "None", username, `Main Admin created account for ${username} with role ${role}.`);
      }

      // Reset & Reload
      setErrors({});
      setShowAddForm(false);
      setEditUser(null);
      setUsername("");
      setName("");
      setEmail("");
      setPhone("");
      setRole("Employee");
      setDepartment(activeDepts.length > 0 ? activeDepts[0].name : "");
      setPermissions({
        approve_requests: false,
        manage_suppliers: false,
        view_logs: false,
        edit_orders: false
      });
      loadUsersAndDepts();
    } catch (err) {
      setModalContent(
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--status-red)', fontWeight: 'bold' }}>Error</p>
          <p>{err.message || "Failed to save user account."}</p>
          <button className="btn-dark" onClick={closeModal} style={{ cursor: 'pointer' }}>Close</button>
        </div>,
        "Error"
      );
      openModal();
    }
  };

  const handleEdit = (u) => {
    setErrors({});
    setEditUser(u);
    setUsername(u.username);
    setName(u.name);
    setRole(u.role);
    setDepartment(u.department || (activeDepts.length > 0 ? activeDepts[0].name : ""));
    setEmail(u.email || "");
    setPhone(u.phone || "");
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
      setModalContent(
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--status-red)', fontWeight: 'bold' }}>Constraint</p>
          <p>Main Admin cannot be disabled.</p>
          <button className="btn-dark" onClick={closeModal} style={{ cursor: 'pointer' }}>Close</button>
        </div>,
        "Constraint Alert"
      );
      openModal();
      return;
    }
    const updated = {
      ...u,
      disabled: !u.disabled
    };
    await apiService.saveUser(updated);
    state.logEvent(u.disabled ? "Enabled User Account" : "Disabled User Account", u.username, u.username, `Main Admin toggled account state.`);
    loadUsersAndDepts();
  };

  const handleResetPassword = (u) => {
    let customPassword = "";

    const handleConfirmReset = async () => {
      if (!customPassword.trim()) {
        state.showToast("Validation Error", "Please enter a valid password.", "success");
        return;
      }
      try {
        await apiService.resetUserPassword(u.id, customPassword);
        state.logEvent("Reset User Password", u.username, u.username, `Main Admin reset password for ${u.username}.`);
        
        state.showToast("Success", `Password for ${u.name} has been reset successfully. They will be required to change it on their next login.`, "success");
        closeModal();
      } catch (err) {
        state.showToast("Error", err.message || "Failed to reset password.", "success");
      }
    };

    setModalContent(
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontSize: '13px', marginBottom: '16px' }}>
          Enter the new custom password for <b>{u.name}</b>. This will force them to change it on their next login.
        </p>
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label>New Password</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Enter custom password..." 
            onChange={e => { customPassword = e.target.value; }} 
            style={{ cursor: 'text' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-dark" 
            style={{ flex: 1, backgroundColor: '#9ca3af', marginBottom: 0, cursor: 'pointer' }} 
            onClick={closeModal}
          >
            Cancel
          </button>
          <button 
            className="btn-orange" 
            style={{ flex: 1.5, cursor: 'pointer' }}
            onClick={handleConfirmReset}
          >
            Reset Password
          </button>
        </div>
      </div>,
      "Reset Password"
    );
    openModal();
  };

  const renderUserForm = () => {
    return (
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} disabled={!!editUser} required style={{ cursor: editUser ? 'not-allowed' : 'text', border: errors.username ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} />
          {errors.username && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.username}</div>}
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input type="text" className="form-control" value={name} onChange={e => { setName(e.target.value); validateUserField("name", e.target.value); }} required style={{ cursor: 'text', border: errors.name ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} />
          {errors.name && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.name}</div>}
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" className="form-control" placeholder="e.g. employee@company.com" value={email} onChange={e => { setEmail(e.target.value); validateUserField("email", e.target.value); }} required style={{ cursor: 'text', border: errors.email ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} />
          {errors.email && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.email}</div>}
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" className="form-control" placeholder="e.g. 9876543210 or +919876543210" value={phone} onChange={e => { setPhone(e.target.value); validateUserField("phone", e.target.value); }} required style={{ cursor: 'text', border: errors.phone ? '1.5px solid var(--status-red)' : '1px solid var(--border-color)' }} />
          {errors.phone && <div style={{ color: 'var(--status-red)', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>{errors.phone}</div>}
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
            <select className="form-control" value={department} onChange={e => setDepartment(e.target.value)} style={{ cursor: 'pointer' }}>
              {activeDepts.map(d => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
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
          <button type="button" className="btn-dark" style={{ flex: 1, backgroundColor: '#9ca3af', marginBottom: 0 }} onClick={() => { setShowAddForm(false); setEditUser(null); }}>Cancel</button>
          <button type="submit" className="btn-orange" style={{ flex: 1.5 }}>Save Account</button>
        </div>
      </form>
    );
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
            setErrors({});
            setEditUser(null);
            setUsername("");
            setName("");
            setRole("Employee");
            setDepartment(activeDepts.length > 0 ? activeDepts[0].name : "");
            setEmail("");
            setPhone("");
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
        {showAddForm && !editUser ? (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '20px', textAlign: 'left', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
              Create New Account
            </h3>
            {renderUserForm()}
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.filter(u => u.role !== "Main Admin").map(u => {
            const isEditingThisUser = editUser && editUser.id === u.id;
            return (
              <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '16px', textAlign: 'left', opacity: u.disabled ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <UserAvatar user={u} size={40} />
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '14px' }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{u.username} • {u.role} ({u.department || 'N/A'})</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                      <button 
                        className="btn-outlined-icon-edit"
                        onClick={() => handleEdit(u)} 
                        style={{ 
                          backgroundColor: 'transparent', 
                          color: 'var(--primary-orange)', 
                          border: '1px solid var(--primary-orange)', 
                          borderRadius: '6px', 
                          padding: '4px 8px', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          cursor: 'pointer', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          height: '26px', 
                          transition: 'all 0.2s' 
                        }}
                        title="Edit User Details"
                      >
                        <Icons.Edit />
                        <span>Edit</span>
                      </button>
                      {u.role !== "Main Admin" && (
                        <button 
                          className={u.disabled ? "btn-outlined-icon-power-green" : "btn-outlined-icon-power-red"}
                          onClick={() => handleToggleDisable(u)} 
                          style={{ 
                            backgroundColor: 'transparent', 
                            color: u.disabled ? 'var(--status-green)' : 'var(--status-red)', 
                            border: u.disabled ? '1px solid var(--status-green)' : '1px solid var(--status-red)', 
                            borderRadius: '6px', 
                            padding: '4px 8px', 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            height: '26px', 
                            transition: 'all 0.2s' 
                          }}
                          title={u.disabled ? "Enable Account" : "Disable Account"}
                        >
                          <Icons.Power />
                          <span>{u.disabled ? 'Enable' : 'Disable'}</span>
                        </button>
                      )}
                      <button 
                        className="btn-outlined-icon-key"
                        onClick={() => handleResetPassword(u)} 
                        style={{ 
                          backgroundColor: 'transparent', 
                          color: 'var(--text-main)', 
                          border: '1px solid var(--text-main)', 
                          borderRadius: '6px', 
                          padding: '4px 8px', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          cursor: 'pointer', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          height: '26px', 
                          transition: 'all 0.2s' 
                        }}
                        title="Reset Password"
                      >
                        <Icons.Key />
                        <span>Reset Pass</span>
                      </button>
                    </div>
                  </div>
                </div>

                {isEditingThisUser && (
                  <div style={{ background: 'var(--card-bg)', border: '2px solid var(--primary-orange)', borderRadius: 'var(--border-radius-md)', padding: '20px', textAlign: 'left', marginTop: '-4px', marginBottom: '12px', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px', color: 'var(--primary-orange)' }}>
                      Edit User Details: {u.name}
                    </h3>
                    {renderUserForm()}
                  </div>
                )}
              </div>
            );
          })}
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
      <img src={user.avatar} style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)', flexShrink: 0 }} alt="Avatar" />
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
      userSelect: 'none',
      flexShrink: 0
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
      state.showToast("Required Fields", "App name, Logo, and Company are required.", "success");
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
    state.showToast("Success", "Branding settings saved successfully.", "success");
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

// ----------------------------------------------------
// DEPARTMENT MANAGEMENT VIEW COMPONENT
// ----------------------------------------------------
export function DepartmentManagementView({ state, navigateTo, openModal, closeModal, setModalContent }) {
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [editingDept, setEditingDept] = useState(null);

  const loadDepartments = async () => {
    const list = await apiService.getDepartments();
    setDepartments(list);
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await apiService.addDepartment(newDeptName);
      setNewDeptName("");
      loadDepartments();
      state.showToast("Success", "Department added successfully.", "success");
    } catch (err) {
      state.showToast("Error", err.message, "success");
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!editingDept || !renameValue.trim()) return;
    try {
      await apiService.renameDepartment(editingDept.name, renameValue);
      setEditingDept(null);
      setRenameValue("");
      loadDepartments();
      state.showToast("Success", "Department renamed successfully.", "success");
    } catch (err) {
      state.showToast("Error", err.message, "success");
    }
  };

  const handleToggleDisable = async (dept) => {
    try {
      await apiService.toggleDepartmentDisabled(dept.name);
      loadDepartments();
      state.showToast("Success", dept.disabled ? "Department enabled." : "Department disabled.", "success");
    } catch (err) {
      state.showToast("Error", err.message, "success");
    }
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigateTo('#settings')} style={{ cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h1 style={{ fontSize: '18px' }}>Departments</h1>
        </div>
      </header>

      <div style={{ paddingTop: '10px', textAlign: 'left', paddingBottom: '80px' }}>
        {/* Add Form */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '16px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>Add New Department</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Finance" 
              value={newDeptName} 
              onChange={e => setNewDeptName(e.target.value)} 
              required 
              style={{ cursor: 'text', flex: 1 }} 
            />
            <button type="submit" className="btn-orange" style={{ width: 'auto', padding: '0 16px' }}>Add</button>
          </form>
        </div>

        {/* Rename Modal replacement overlay */}
        {editingDept && (
          <div style={{ background: 'var(--card-bg)', border: '2px solid var(--primary-orange)', borderRadius: 'var(--border-radius-md)', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>Rename: {editingDept.name}</h3>
            <form onSubmit={handleRenameSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-control" 
                value={renameValue} 
                onChange={e => setRenameValue(e.target.value)} 
                required 
                style={{ cursor: 'text', flex: 1 }} 
              />
              <button type="button" className="btn-dark" onClick={() => setEditingDept(null)} style={{ width: 'auto', padding: '0 12px', marginBottom: 0 }}>Cancel</button>
              <button type="submit" className="btn-orange" style={{ width: 'auto', padding: '0 16px' }}>Save</button>
            </form>
          </div>
        )}

        {/* List of Departments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {departments.map((dept, idx) => (
            <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: dept.disabled ? 0.6 : 1 }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{dept.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: {dept.disabled ? '🔴 Disabled' : '🟢 Active'}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  className="btn-outlined-icon-edit"
                  onClick={() => { setEditingDept(dept); setRenameValue(dept.name); }}
                  style={{ backgroundColor: 'transparent', color: 'var(--primary-orange)', border: '1px solid var(--primary-orange)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '26px' }}
                >
                  Rename
                </button>
                <button 
                  className={dept.disabled ? "btn-outlined-icon-power-green" : "btn-outlined-icon-power-red"}
                  onClick={() => handleToggleDisable(dept)}
                  style={{ backgroundColor: 'transparent', color: dept.disabled ? 'var(--status-green)' : 'var(--status-red)', border: dept.disabled ? '1px solid var(--status-green)' : '1px solid var(--status-red)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', height: '26px' }}
                >
                  {dept.disabled ? 'Enable' : 'Disable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
