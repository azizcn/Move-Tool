import React, { useState } from 'react';

export default function EditModal({ node, onSave, onDelete, onCancel }) {
  const isStruct = node.type === 'structNode';
  const title = isStruct ? 'Struct (Veri) Düzenle' : 'Fonksiyon (İşlem) Düzenle';
  
  // İsimler
  const [label, setLabel] = useState(node.data.label);
  const [customTitle, setCustomTitle] = useState(node.data.customTitle || node.data.label);

  // İçerik
  const [items, setItems] = useState(isStruct ? (node.data.fields || []) : (node.data.params || []));
  
  // ABİM DİKKAT: Imported ayarını ekrandan kaldırdık ama hafızada tutuyoruz.
  // Sidebar'dan gelen 'true' kalır, manuel eklenen 'false' kalır. Kimse bozamaz.
  const [isImported] = useState(node.data.isImported || false);

  const [abilities, setAbilities] = useState(node.data.abilities || { key: true, store: true, copy: false, drop: false });

  const toggleAbility = (key) => setAbilities(prev => ({ ...prev, [key]: !prev[key] }));
  const addItem = () => setItems([...items, { name: 'yeni', type: isStruct ? 'u64' : 'address' }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));
  const handleItemChange = (index, key, value) => { const newItems = [...items]; newItems[index][key] = value; setItems(newItems); };

  const handleSave = () => {
    const newData = { ...node.data, label, customTitle };
    if (isStruct) { 
        newData.fields = items; 
        newData.abilities = abilities; 
        newData.isImported = isImported; // Gizli ayarı koruyarak kaydediyoruz
    } else { 
        newData.params = items; 
    }
    onSave({ ...node, data: newData });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '450px', boxShadow: '0 20px 25px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: isStruct ? '#3b82f6' : '#8b5cf6', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{title}</h3>
        
        {/* --- İSİM GİRİŞLERİ --- */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 'bold', fontSize: '12px', color: '#64748b' }}>Görünen İsim (Türkçe)</label>
                <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Örn: Süper Kılıç" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px' }} />
            </div>
            <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 'bold', fontSize: '12px', color: '#64748b' }}>Kod İsmi (İngilizce)</label>
                <input type="text" value={label} onChange={(e) => setLabel(e.target.value.replace(/\s/g, '_'))} placeholder="Örn: SuperSword" style={{ width: '100%', padding: '8px', border: '1px solid #3b82f6', borderRadius: '5px', background: '#eff6ff', color: '#1e40af', fontFamily: 'monospace' }} />
            </div>
        </div>

        {/* --- HAZIR OBJE KUTUCUĞU GİTTİ! --- */}
        {/* Artık burada sarı kutu yok. Sidebar'dan gelen gridir, manuel gelen mavidir. Bitti. */}

        {/* --- YETENEKLER (Sadece Bizim Structlar İçin) --- */}
        {isStruct && !isImported && (
          <div style={{ marginBottom: '15px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '12px', color: '#64748b' }}>Yetenekler:</label>
            <div style={{ display: 'flex', gap: '15px' }}>{['key', 'store', 'copy', 'drop'].map((ab) => (<label key={ab} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}><input type="checkbox" checked={abilities[ab]} onChange={() => toggleAbility(ab)} /> {ab}</label>))}</div>
          </div>
        )}

        <div style={{ marginBottom: '5px', fontWeight: 'bold', fontSize: '12px', color: '#64748b' }}>
            {isStruct ? 'İçerik (Alanlar):' : 'Girdiler (Parametreler):'}
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '5px' }}>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
              <input type="text" value={item.name} onChange={(e) => handleItemChange(index, 'name', e.target.value)} style={{ flex: 1, padding: '5px', border: '1px solid #ddd', borderRadius: '3px' }} placeholder="isim" />
              <select value={item.type} onChange={(e) => handleItemChange(index, 'type', e.target.value)} style={{ flex: 1, padding: '5px', border: '1px solid #ddd', borderRadius: '3px' }}>
                <option value="u64">u64 (Sayı)</option><option value="address">address (Adres)</option><option value="vector<u8>">String (Yazı)</option><option value="bool">bool (D/Y)</option><option value="UID">UID (Kimlik)</option><option value="Coin<SUI>">Coin (Para)</option><option value="&mut TxContext">TxContext</option>
              </select>
              <button onClick={() => removeItem(index)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', width: '25px' }}>×</button>
            </div>
          ))}
          <button onClick={addItem} style={{ color: '#2563eb', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', padding: '5px' }}>+ Yeni Satır Ekle</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <button onClick={() => { if(confirm('Siliyorum?')) onDelete(node.id); }} style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Sil</button>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={onCancel} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>İptal</button><button onClick={handleSave} style={{ padding: '8px 16px', background: isStruct ? '#3b82f6' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Kaydet</button></div>
        </div>
      </div>
    </div>
  );
}