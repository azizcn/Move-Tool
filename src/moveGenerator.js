const sanitizeName = (name) => {
    // Boşlukları ve Sui'nin kullandığı çift iki nokta üst üste (::) işaretini alt çizgiye çevirir
    if (!name) return 'unknown';
    return name.replace(/::/g, '_').replace(/\s/g, '_');
};

const getFuncName = (label) => {
    // Fonksiyon isimlerini küçük harfe çevirir ve temizler
    return label.replace(/::/g, '_').replace(/\s/g, '_').toLowerCase();
};

/**
 * Move modül kodunu, verilen node ve edge verilerinden yola çıkarak üretir.
 * @param {string} moduleName - Modül adı (genellikle dosya adı).
 * @param {Array<Object>} nodes - Akış şemasındaki düğümler (struct'lar, fonksiyonlar, init).
 * @param {Array<Object>} edges - Akış şemasındaki bağlantılar.
 * @returns {string} Üretilen Move kodu.
 */
export const generateMoveCode = (moduleName, nodes, edges) => {
    const safeModuleName = sanitizeName(moduleName).toLowerCase().replace(/[^a-z0-9_]/g, '');

    const SKIPPED_IMPORTED_STRUCTS = ['TreasuryCap', 'Coin', 'UID', 'String', 'Url', 'Clock', 'Table', 'Bag', 'TxContext'];

    // YENİ KONTROL: NFT Mint Fonksiyonu Var mı?
    const hasNftMintFunction = nodes.some(n => 
        n.type === 'functionNode' && 
        n.data.label.includes('nft::mint')
    );

    // 1. ANA WITNESS İSMİNİ BUL
    let mainStructName = "MY_COIN";
    const initNode = nodes.find(n => n.type === 'initNode');
    const witnessEdge = initNode ? edges.find(e => e.target === initNode.id) : null;
    
    if (witnessEdge) {
        const sourceNode = nodes.find(n => n.id === witnessEdge.source);
        if (sourceNode && !sourceNode.data.isImported) {
            mainStructName = sanitizeName(sourceNode.data.label);
        }
    } else {
        const firstStruct = nodes.find(n => n.type === 'structNode' && !n.data.isImported);
        if (firstStruct) mainStructName = sanitizeName(firstStruct.data.label);
    }

    // Başlangıç Kodu ve Use Statement'ları (SADECE STANDART BOŞLUK KULLANILDI)
    let code = `module ${safeModuleName}::${safeModuleName} {\n`;
    code += `    use sui::object::{Self, UID};\n`;
    code += `    use sui::transfer;\n`;
    code += `    use sui::tx_context::{Self, TxContext};\n`;
    code += `    use sui::coin::{Self, TreasuryCap, Coin};\n`;
    code += `    use sui::url::{Self, Url};\n`;
    code += `    use std::option;\n`;
    code += `    use std::string::{Self, String};\n\n`; 

    // 2. STRUCT'LARI YAZ
    let witnessDefined = false;
    const structs = nodes.filter(n => n.type === 'structNode');
    structs.forEach(node => {
        const structName = sanitizeName(node.data.label);
        
        if (node.data.isImported || SKIPPED_IMPORTED_STRUCTS.includes(structName)) return;

        if (structName === mainStructName) witnessDefined = true;

        let hasString = '';
        
        if (structName === mainStructName) {
            hasString = ` has drop`;
        } else {
            const abilities = node.data.abilities || { key: true, store: true };
            const abilityKeys = Object.entries(abilities).filter(([_, val]) => val).map(([key]) => key);
            hasString = abilityKeys.length > 0 ? ` has ${abilityKeys.join(', ')}` : '';
        }
        
        code += `    struct ${structName}${hasString} {\n`;
        if (node.data.fields) {
            node.data.fields.forEach(field => {
                if (structName === mainStructName && field.name === 'id' && field.type === 'UID') {
                    return; 
                }
                code += `        ${field.name}: ${field.type},\n`;
            });
        }
        code += `    }\n\n`;
    });

    // 3. WITNESS YOKSA VEYA YANLIŞ TANIMLANDIYSA, TEMİZ HALİNİ EKLE
    if (!witnessDefined) {
        code += `    struct ${mainStructName} has drop {}\n\n`;
    }
    
    // SimpleNFT Struct'ı sadece NFT mint fonksiyonu varsa eklenir
    if (hasNftMintFunction) {
        code += `    struct SimpleNFT has key, store {\n`;
        code += `        id: UID,\n`;
        code += `        name: String,\n`;
        code += `        url: Url,\n`;
        code += `    }\n\n`;
    }

    // 4. INIT FONKSİYONU
    if (initNode) {
        const data = initNode.data;
        code += `    fun init(witness: ${mainStructName}, ctx: &mut TxContext) {\n`;
        code += `        let (treasury, metadata) = coin::create_currency(\n`;
        code += `            witness,\n`;
        code += `            ${data.coinDecimals || 9},\n`;
        code += `            b"${data.coinSymbol || 'SYM'}",\n`;
        code += `            b"${data.coinName || 'My Coin'}",\n`;
        code += `            b"${data.coinDescription || ''}",\n`;
        code += `            option::none(),\n`;
        code += `            ctx\n`;
        code += `        );\n`;
        code += `        transfer::public_freeze_object(metadata);\n`;
        code += `        transfer::public_transfer(treasury, tx_context::sender(ctx));\n`;
        code += `    }\n\n`;
    }

    // 5. FONKSİYONLAR
    const funcs = nodes.filter(n => n.type === 'functionNode');

    funcs.forEach(node => {
        let paramsList = [];
        
        if (node.data.params) {
            paramsList = node.data.params.map((p) => {
                let type = p.type;
                
                if (type.includes('TreasuryCap')) {
                    type = `&mut TreasuryCap<${mainStructName}>`; 
                } else if (type.includes('Coin<T>') || (type.includes('Coin') && !type.includes('<'))) {
                    type = `Coin<${mainStructName}>`; 
                } else if (type === 'T') {
                    type = `Coin<${mainStructName}>`;
                } else if (type === 'TxContext' || type === '&mut TxContext') {
                    type = `&mut TxContext`;
                }
                
                return `${p.name}: ${type}`;
            });
        }

        const funcName = getFuncName(node.data.label);
        const paramsStr = paramsList.join(", ");
        
        code += `    public entry fun ${funcName}(${paramsStr}) {\n`;
        
        if (funcName.includes('mint') && node.data.label.includes('coin::')) {
            code += `        let coin = coin::mint(cap, amount, ctx);\n`;
            code += `        transfer::public_transfer(coin, tx_context::sender(ctx));\n`;
        } 
        else if (funcName.includes('mint') && node.data.label.includes('nft::')) {
            if(paramsList.some(p => p.includes('TreasuryCap'))) {
                code += `        let _ = cap;\n`;
            }
            code += `        let nft = SimpleNFT { id: object::new(ctx), name: std::string::utf8(name), url: sui::url::new_unsafe_from_bytes(url) };\n`;
            code += `        transfer::public_transfer(nft, tx_context::sender(ctx));\n`;
        }
        else if (funcName === 'transfer_transfer' || node.data.label.includes('transfer::')) {
            code += `        transfer::public_transfer(obj, recipient);\n`;
        }
        else {
            code += `        // Mantık kodları...\n`;
        }

        code += `    }\n\n`;
    });

    code += `}`;
    return code;
};

// ... (generateMoveToml aynı kalır)
export const generateMoveToml = (packageName) => {
    const safeName = sanitizeName(packageName).toLowerCase().replace(/[^a-z0-9_]/g, '');
    return `[package]
name = "${safeName}"
version = "0.0.1"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
${safeName} = "0x0"
`;
};