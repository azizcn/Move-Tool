import React from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer, useReactFlow } from 'reactflow';

export default function ButtonEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, selected }) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const onEdgeClick = (evt) => { evt.stopPropagation(); setEdges((edges) => edges.filter((edge) => edge.id !== id)); };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {selected && (<EdgeLabelRenderer><div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }} className="nodrag nopan"><button onClick={onEdgeClick} style={{ width: '24px', height: '24px', background: '#ef4444', color: 'white', border: '2px solid white', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button></div></EdgeLabelRenderer>)}
    </>
  );
}