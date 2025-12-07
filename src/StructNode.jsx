import React, { memo } from 'react';
import { Handle, Position, useReactFlow, useStore } from 'reactflow';

const connectionSelector = (state) => state.connectionNodeId;

const StructNode = ({ id, data, selected }) => {
  const { setNodes } = useReactFlow();
  const connectionNodeId = useStore(connectionSelector);
  const isTarget = connectionNodeId && connectionNodeId !== id;

  // --- 1. ABILITY LİSTESİNİ TEMİZLE ---
  const abilities = data.abilities || { key: true, store: true };
  const enabledAbilities = Object.entries(abilities)
        .filter(([_, val]) => val)
        .map(([key]) => key);
  const abilityListText = enabledAbilities.length > 0 ? enabledAbilities.join(', ') : '';

  const isImported = data.isImported || false;
  const headerColor = isImported ? '#64748b' : '#3b82f6'; 
  
  // --- BAŞLIK MANTIĞI ---
  // Özel Türkçe başlık varsa onu büyük göster
  const displayTitle = data.customTitle || data.label;
  // Eğer Türkçe başlık varsa, label'ı küçük göster. Yoksa boş bırak.
  const subTitle = data.customTitle ? data.label : ''; 

  const onDelete = (evt) => { evt.stopPropagation(); if (confirm(`"${displayTitle}" siliniyor abim?`)) setNodes((nodes) => nodes.filter((n) => n.id !== id)); };

  return (
    
    <div style={{ position: 'relative', background: '#fff', border: selected ? `2px solid ${headerColor}` : `1px ${isImported ? 'dashed' : 'solid'} #333`, borderRadius: '8px', minWidth: '200px', boxShadow: isTarget ? '0 0 15px rgba(16, 185, 129, 0.6)' : (selected ? `0 0 10px ${headerColor}` : '0 4px 6px rgba(0,0,0,0.1)'), fontFamily: 'monospace', opacity: isImported ? 0.9 : 1, transition: 'box-shadow 0.2s' }}>
      
      {selected && <button onClick={onDelete} style={{ position: 'absolute', top: '-10px', right: '-10px', width: '24px', height: '24px', background: '#ef4444', color: 'white', border: '2px solid white', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', zIndex: 10 }}>×</button>}
      
      <div style={{ background: headerColor, color: 'white', padding: '8px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', textAlign: 'center', position: 'relative' }}>
        {/* BÜYÜK BAŞLIK */}
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{displayTitle}</div>
        {/* KÜÇÜK TEKNİK BAŞLIK (Sadece customTitle varsa label'ı gösterir) */}
        {subTitle && <div style={{ fontSize: '10px', opacity: 0.8, fontStyle: 'italic', marginTop: '2px' }}>{subTitle}</div>}
        
        <Handle type="source" position={Position.Right} id="obj-main" style={isTarget ? {} : { background: 'white', width: '10px', height: '10px', right: '-6px', top: '50%' }} />
      </div>

      <div style={{ padding: '10px', background: isImported ? '#f1f5f9' : '#f8fafc' }}>
        
        {/* 💥 KRİTİK DÜZELTME: ABILITIES'i ayrı bir satırda göster 💥 */}
        {abilityListText && !isImported && (
          <div style={{ 
                marginBottom: '10px', 
                padding: '4px', 
                background: '#e0f2f1', 
                borderRadius: '4px', 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: '#047857',
                border: '1px solid #10b981'
            }}>
            has {abilityListText}
          </div>
        )}
        
        {data.fields && data.fields.map((field, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px', position: 'relative' }}>
            <span style={{ color: '#334155' }}>{field.name}:</span><span style={{ color: isImported ? '#64748b' : '#059669', fontWeight: 'bold', marginRight: '10px' }}>{field.type}</span>
            <Handle type="source" position={Position.Right} id={`field-${index}`} style={isTarget ? {} : { background: isImported ? '#94a3b8' : '#059669', right: '-15px' }} />
          </div>
        ))}
      </div>
    </div>
  );
};
export default memo(StructNode);