import React, { memo } from 'react';
import { Handle, Position, useReactFlow, useStore } from 'reactflow';

const cleanType = (type) => (!type ? '' : type.replace('&', '').replace('mut', '').replace(' ', '').trim());

const FunctionNode = ({ id, data, selected }) => {
  const { setNodes, getNode } = useReactFlow();
  const connectionState = useStore((state) => ({ nodeId: state.connectionNodeId, handleId: state.connectionHandleId }));

  const isHandleCompatible = (paramType) => {
    if (!connectionState.nodeId || !connectionState.handleId || connectionState.nodeId === id) return false;
    const sourceNode = getNode(connectionState.nodeId);
    if (!sourceNode) return false;
    let sourceType = 'unknown';
    if (connectionState.handleId === 'obj-main') sourceType = sourceNode.data.label;
    else if (connectionState.handleId.startsWith('field-')) { const fieldIndex = parseInt(connectionState.handleId.split('-')[1]); if (sourceNode.data.fields) sourceType = sourceNode.data.fields[fieldIndex].type; }
    else if (connectionState.handleId === 'return-val') return true; 
    const cleanSource = cleanType(sourceType); const cleanParam = cleanType(paramType);
    return cleanParam === 'T' || cleanSource === cleanParam;
  };

  const onDelete = (evt) => { evt.stopPropagation(); if (confirm(`"${data.customTitle || data.label}" siliniyor?`)) setNodes((nodes) => nodes.filter((n) => n.id !== id)); };

  // --- BAŞLIK MANTIĞI ---
  const displayTitle = data.customTitle || data.label;
  const subTitle = data.customTitle ? data.label : 'public entry fun';

  return (
    <div style={{ position: 'relative', background: '#fff', border: selected ? '2px solid #8b5cf6' : '1px solid #333', borderRadius: '12px', minWidth: '220px', boxShadow: selected ? '0 0 10px rgba(139, 92, 246, 0.5)' : '0 4px 6px rgba(0,0,0,0.2)', fontFamily: 'monospace' }}>
      {selected && <button onClick={onDelete} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', background: '#ef4444', color: 'white', border: '2px solid white', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', zIndex: 10 }}>×</button>}
      
      <div style={{ background: '#8b5cf6', color: 'white', padding: '8px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', textAlign: 'center', position: 'relative' }}>
        {/* BÜYÜK TÜRKÇE BAŞLIK */}
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{displayTitle}</div>
        <span style={{ fontSize: '10px', opacity: 0.9, display: 'block', marginTop: '2px' }}>{subTitle}</span>
        
        <Handle type="source" position={Position.Right} id="return-val" style={{ background: '#fff', width: '12px', height: '12px', right: '-6px', top: '50%', border: '2px solid #8b5cf6' }} title="Çıktı" />
      </div>

      <div style={{ padding: '10px', background: '#faf5ff' }}>
        {data.params && data.params.map((param, index) => {
          const isCompatible = isHandleCompatible(param.type);
          const isConnecting = !!connectionState.nodeId;
          let handleStyle = { background: '#d946ef', left: '-16px' };
          if (isConnecting) handleStyle = isCompatible ? { background: '#10b981', width: '16px', height: '16px', left: '-18px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 10px #10b981', zIndex: 20 } : { background: '#e5e7eb', opacity: 0.3, left: '-16px' };
          
          return (
            <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', background: '#fff', padding: '4px 8px', border: '1px solid #e9d5ff', borderRadius: '4px', position: 'relative', opacity: (isConnecting && !isCompatible) ? 0.4 : 1 }}>
              <Handle type="target" position={Position.Left} id={`param-${index}`} style={handleStyle} />
              <span style={{ color: '#333', marginLeft: '5px' }}>{param.name}:</span><span style={{ color: '#d946ef', fontWeight: 'bold' }}>{param.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default memo(FunctionNode);