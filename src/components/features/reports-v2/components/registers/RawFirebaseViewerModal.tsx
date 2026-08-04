import React from 'react';

export interface RawFirebaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  collectionName: string;
  rawJson: any;
}

export const RawFirebaseViewerModal: React.FC<RawFirebaseViewerModalProps> = ({
  isOpen, onClose, documentId, collectionName, rawJson
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg-app)', width: 800, borderRadius: 12, border: '1px solid var(--border-main)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '12px 12px 0 0' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>🔍</span>
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--color-warning)' }}>Raw Firebase Document</h3>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
              Collection: <span style={{ color: 'var(--text-main)' }}>{collectionName}</span> | Document ID: <span style={{ color: 'var(--text-main)' }}>{documentId}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--text-muted)' }}>✖</button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: '#1e1e1e' }}>
          <pre style={{ 
            margin: 0, color: '#d4d4d4', fontFamily: 'Consolas, monospace', fontSize: 13, 
            whiteSpace: 'pre-wrap', wordBreak: 'break-all'
          }}>
            {JSON.stringify(rawJson, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-main)', background: 'var(--bg-card)', borderRadius: '0 0 12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            ⚠️ This is the direct representation of the operational record in Google Firestore.
          </span>
          <button onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(rawJson, null, 2));
            alert('Copied to clipboard!');
          }} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-main)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
            📋 Copy JSON
          </button>
        </div>
      </div>
    </div>
  );
};
