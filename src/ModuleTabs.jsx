import React, { useState } from 'react';
// --- YENİ LOGOYU İÇE AKTAR ---
import suiLogo from './assets/sui-logo.svg'; 

export default function ModuleTabs({ modules, activeModuleId, onSwitch, onAdd, onRename, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");

  const handleDoubleClick = (id, name) => {
    if (id === 'mod-1') return; // Ana modül adı değişmez
    setEditingId(id);
    setTempName(name);
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      if (tempName.trim()) onRename(id, tempName.trim());
      setEditingId(null);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      
      {/* --- LOGO KISMI DEĞİŞTİ --- */}
      <div style={{ display: 'flex', alignItems: 'center', color: '#334155', fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
        {/* SVG Dosyasını Göster */}
        <img src={suiLogo} alt="Sui Move Logo" style={{ height: '32px', marginRight: '10px' }} />
        <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Move Sketch
        </span>
      </div>

      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', overflowX: 'auto', paddingBottom: '5px' }}>
        {modules.map((mod) => (
          <div 
            key={mod.id}
            onClick={() => onSwitch(mod.id)}
            onDoubleClick={() => handleDoubleClick(mod.id, mod.name)}
            style={{
              padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
              background: mod.id === activeModuleId ? '#3b82f6' : '#e2e8f0',
              color: mod.id === activeModuleId ? 'white' : '#64748b',
              border: mod.id === activeModuleId ? '2px solid #3b82f6' : '2px solid transparent',
              boxShadow: mod.id === activeModuleId ? '0 2px 6px rgba(59,130,246,0.3)' : 'none'
            }}
          >
            <span style={{ fontSize: '16px' }}>📦</span>
            {editingId === mod.id ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, mod.id)}
                onBlur={() => setEditingId(null)}
                autoFocus
                style={{ border: 'none', background: 'transparent', color: 'inherit', fontWeight: 'inherit', outline: 'none', width: '80px' }}
              />
            ) : (
              <span>{mod.name}</span>
            )}
            {modules.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(mod.id); }}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px', opacity: 0.7, padding: '0 4px' }}
                onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.7}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button onClick={onAdd} style={{ background: '#e2e8f0', border: '2px dashed #cbd5e1', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={(e) => {e.target.style.background='#cbd5e1'; e.target.style.borderColor='#94a3b8'}} onMouseLeave={(e) => {e.target.style.background='#e2e8f0'; e.target.style.borderColor='#cbd5e1'}}>+</button>
      </div>
    </div>
  );
}