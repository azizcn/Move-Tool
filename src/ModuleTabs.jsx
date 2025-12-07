import React, { useState } from 'react';
import suiLogo from './assets/sui-logo.svg'; 

export default function ModuleTabs({ modules, activeModuleId, onSwitch, onAdd, onRename, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [tempName, setTempName] = useState("");

  const handleDoubleClick = (id, name) => {
    // if (id === 'mod-1') return; // <-- KALDIRILDI: İlk modülün düzenlenmesini artık engellemiyoruz
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
    <div className="app-header" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src={suiLogo} alt="Sui Move Logo" style={{ width: '32px', height: '32px' }} />
        <span className="app-title" style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          Move Skratch
        </span>
      </div>

      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', overflowX: 'auto', paddingBottom: '5px' }}>
        {modules.map((mod) => (
          <div 
            key={mod.id}
            onClick={() => onSwitch(mod.id)}
            onDoubleClick={() => handleDoubleClick(mod.id, mod.name)}
            // 💥 KRİTİK DÜZELTME: Metin kopyalamayı engellemek için onMouseDown eklendi 💥
            onMouseDown={(e) => {
                // Tarayıcının metin seçme (kopyalama) davranışını engeller.
                // Bu, onDoubleClick'in düzgün çalışması için şarttır.
                e.preventDefault(); 
            }}
            className={`tab-item ${mod.id === activeModuleId ? 'active' : ''}`}
            style={{
              padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '16px' }}>📦</span>
            {editingId === mod.id ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, mod.id)}
                onBlur={() => {
                    // onBlur'da kaydetme işlemini de yapabiliriz
                    if (tempName.trim()) onRename(mod.id, tempName.trim());
                    setEditingId(null);
                }}
                autoFocus
                style={{ border: 'none', background: 'transparent', color: 'inherit', fontWeight: 'inherit', outline: 'none', width: '80px' }}
              />
            ) : (
              <span>{mod.name}</span>
            )}
            {modules.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(mod.id); }}
                className="tab-close-btn"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px', opacity: 0.7, padding: '0 4px', marginLeft: '5px' }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button className="add-tab-btn" onClick={onAdd} style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>+</button>
      </div>
    </div>
  );
}