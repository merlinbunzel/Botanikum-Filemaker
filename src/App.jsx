import{useState,useEffect,useRef,useCallback}from"react";

const DEMO_MODE=true;

// ── DUMMY IN-MEMORY STORE ──────────────────────────────────────
let _kunden=[
  {id:"k1",firma:"Gasthaus Zur Linde",vorname:"Maria",plz:"80331",ort:"München",strasse:"Ludwigstr. 12",telefon:"089 123456",email:"info@linde.de",code:"LIN-01",jahr:"2026",rabatt_xf:1,restbetrag:"450,00",zugesagt:true,abholung:"Abholung",umtopfarbeiten:"erledigt",osteria:"",vapiano:"350,00",total_aktuell:"1200",total_vorjahr:"980",alte_cm:"",kdr:"3",neukunde:false,auslieferung_abholung:"2026-04-10",ausgeliefert_am:"",ersatzpflanzen:"",ortsteil:"Maxvorstadt",lieferadresse:"",mail:"Newsletter",bemerkungen_aktuell:"Olivenbaum war sehr gut, nächstes Jahr 2 Stück",bemerkungen_2022:"Erstkunde 2022",bemerkungen_2023:"Zufrieden",bemerkungen_2024:"Lieferung verzögert",bemerkungen_2025:"Stammkunde",restpflanzen:"",restpflanzen_info:"",trans_txt:"Kleintransporter",trans_preis:85,duenger_txt:"Langzeitdünger",duenger_preis:12,zeit_abholung:"",rabatt_txt:"Stammkunde 5%",gutschein:"",transportdauer:"ca. 30 min",camelia:"",vapiano_pflanzen:""},
  {id:"k2",firma:"Vapiano GmbH",vorname:"Thomas",plz:"10115",ort:"Berlin",strasse:"Unter den Linden 5",telefon:"030 654321",email:"thomas@vapiano.de",code:"VAP-02",jahr:"2026",rabatt_xf:1.05,restbetrag:"",zugesagt:false,abholung:"",umtopfarbeiten:"",osteria:"",vapiano:"",total_aktuell:"850",total_vorjahr:"720",alte_cm:"",kdr:"2",neukunde:false,auslieferung_abholung:"2026-05-01",ausgeliefert_am:"",ersatzpflanzen:"",ortsteil:"Mitte",lieferadresse:"Hintereingang Küche",mail:"",bemerkungen_aktuell:"Bitte morgens liefern",bemerkungen_2022:"",bemerkungen_2023:"Neukunde",bemerkungen_2024:"",bemerkungen_2025:"",restpflanzen:"",restpflanzen_info:"",trans_txt:"",trans_preis:0,duenger_txt:"",duenger_preis:0,zeit_abholung:"",rabatt_txt:"",gutschein:"",transportdauer:"",camelia:"",vapiano_pflanzen:"Ficus, Olive"},
  {id:"k3",firma:"",vorname:"Anna Müller",plz:"22303",ort:"Hamburg",strasse:"Eppendorfer Weg 88",telefon:"040 998877",email:"anna.mueller@gmail.com",code:"MUE-03",jahr:"2026",rabatt_xf:1,restbetrag:"",zugesagt:true,abholung:"",umtopfarbeiten:"",osteria:"",vapiano:"",total_aktuell:"320",total_vorjahr:"",alte_cm:"",kdr:"1",neukunde:true,auslieferung_abholung:"",ausgeliefert_am:"",ersatzpflanzen:"",ortsteil:"Eppendorf",lieferadresse:"",mail:"",bemerkungen_aktuell:"Neukunde – Balkon bepflanzen",bemerkungen_2022:"",bemerkungen_2023:"",bemerkungen_2024:"",bemerkungen_2025:"",restpflanzen:"",restpflanzen_info:"",trans_txt:"",trans_preis:0,duenger_txt:"",duenger_preis:0,zeit_abholung:"10:00",rabatt_txt:"",gutschein:"",transportdauer:"",camelia:"",vapiano_pflanzen:""},
];
let _positionen={
  k1:[{id:"p1",kunde_id:"k1",label:"P1",sort_order:0,art:"Olivenbaum Arbequina",cm:180,preis:320,anzahl:1},{id:"p2",kunde_id:"k1",label:"P2",sort_order:1,art:"Lavendel Hidcote",cm:40,preis:18,anzahl:3},{id:"p3",kunde_id:"k1",label:"P3",sort_order:2,art:"Rosmarin aufrecht",cm:60,preis:22,anzahl:2}],
  k2:[{id:"p4",kunde_id:"k2",label:"P1",sort_order:0,art:"Ficus benjamina",cm:200,preis:280,anzahl:1},{id:"p5",kunde_id:"k2",label:"P2",sort_order:1,art:"Yukka Palme",cm:150,preis:190,anzahl:1}],
  k3:[{id:"p6",kunde_id:"k3",label:"P1",sort_order:0,art:"Geranien gemischt",cm:30,preis:12,anzahl:5}],
};
let _touren=[
  {id:"t1",name:"Tour A",fahrer:"Karl",datum:"2026-04-10",farbe:"#10b981",kundenIds:["k1"]},
  {id:"t2",name:"Tour B",fahrer:"Lisa",datum:"2026-05-01",farbe:"#6366f1",kundenIds:["k2"]},
];
let _schema=[];
let _posFormulaMap={};

const LABELS=["P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];

const DEFAULT_LAYOUT=[
  {id:"kopf",label:"Kopfbereich",visible:true},
  {id:"adresse",label:"Adresse & Kontakt",visible:true},
  {id:"bemerkungen_aktuell",label:"Bemerkungen aktuell",visible:true},
  {id:"positionen",label:"Positionen",visible:true},
  {id:"custom_felder",label:"Benutzerdefinierte Felder (Builder)",visible:true},
  {id:"rabatt",label:"Rabatt & Gutschein",visible:true},
  {id:"transport",label:"Transport",visible:true},
  {id:"duenger",label:"Dünger",visible:true},
  {id:"zusatzposten",label:"Zusätzliche Posten",visible:true},
  {id:"zeit",label:"Zeit Abholung",visible:true},
  {id:"summen",label:"Summen",visible:true},
  {id:"restpflanzen",label:"Restpflanzen & Historisch",visible:true},
  {id:"sonstiges",label:"Sonstiges",visible:true},
];
let _layoutConfig=[...DEFAULT_LAYOUT];

function makeSb(){
  return{
    from:(table)=>({
      select:()=>({
        order:()=>Promise.resolve({data:table==="kunden"?_kunden:table==="touren"?_touren.map(t=>({...t,tour_kunden:(t.kundenIds||[]).map(id=>({kunde_id:id}))})):table==="formular_felder"?_schema:[],error:null}),
        eq:(k,v)=>({order:()=>Promise.resolve({data:(table==="positionen"?(_positionen[v]||[]):table==="kunden_felder"?[]:table==="touren"?_touren:[]),error:null}),limit:()=>Promise.resolve({data:[],error:null})}),
        limit:()=>Promise.resolve({data:[],error:null}),
        neq:()=>Promise.resolve({data:[],error:null}),
      }),
      upsert:(row)=>({select:()=>({single:()=>{
        if(table==="kunden"){const idx=_kunden.findIndex(k=>k.id===row.id);if(idx>=0)_kunden[idx]={..._kunden[idx],...row};else _kunden.push(row);return Promise.resolve({data:row,error:null});}
        if(table==="touren"){const idx=_touren.findIndex(t=>t.id===row.id);if(idx>=0)_touren[idx]={..._touren[idx],...row};else _touren.push(row);return Promise.resolve({data:row,error:null});}
        return Promise.resolve({data:row,error:null});
      }})}),
      insert:(rows)=>({
        select:()=>({single:()=>{
          const row=Array.isArray(rows)?rows[0]:rows;
          row.id=row.id||uid();
          if(table==="kunden")_kunden.push(row);
          if(table==="touren")_touren.push(row);
          if(table==="positionen"){const kid=(Array.isArray(rows)?rows[0]:rows).kunde_id;_positionen[kid]=[...(_positionen[kid]||[]),...(Array.isArray(rows)?rows:[rows])];}
          if(table==="formular_felder")_schema=[..._schema,...(Array.isArray(rows)?rows:[rows])];
          return Promise.resolve({data:row,error:null});
        }}),
        then:(fn)=>{
          if(table==="positionen"){const kid=(Array.isArray(rows)?rows[0]:rows).kunde_id;_positionen[kid]=[...(_positionen[kid]||[]),...(Array.isArray(rows)?rows:[rows])];}
          if(table==="formular_felder")_schema=[..._schema,...(Array.isArray(rows)?rows:[rows])];
          if(table==="tour_kunden"){/* handled inline */}
          return fn({error:null});
        },
        catch:()=>Promise.resolve({error:null}),
      }),
      delete:()=>({
        eq:(k,v)=>{
          if(table==="kunden")_kunden=_kunden.filter(r=>r[k]!==v);
          if(table==="positionen")_positionen[v]=[];
          if(table==="touren")_touren=_touren.filter(r=>r[k]!==v);
          if(table==="tour_kunden")_touren=_touren.map(t=>t.id===v?{...t,kundenIds:[]}:t);
          if(table==="kunden_felder"){/* no-op */}
          return Promise.resolve({error:null});
        },
        neq:()=>{if(table==="formular_felder")_schema=[];return Promise.resolve({error:null});},
      }),
      update:(row)=>({eq:(k,v)=>{
        if(table==="kunden"){const idx=_kunden.findIndex(r=>r[k]===v);if(idx>=0)_kunden[idx]={..._kunden[idx],...row};}
        return Promise.resolve({error:null});
      }}),
    }),
  };
}

const sb=makeSb();
const YEAR=new Date().getFullYear();
const TODAY=new Date().toISOString().split("T")[0];
function fmt2(n){return isNaN(n)||n===null?"0,00":Number(n).toFixed(2).replace(".",",")}
function uid(){return Math.random().toString(36).slice(2,10)}
const S={
  cell:{border:"1px solid #bbb",background:"#fff",padding:"2px 5px",fontSize:12,color:"#111",outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"},
  label:{fontSize:10,color:"#444",fontWeight:600,whiteSpace:"nowrap",paddingTop:2},
  green:{background:"#00cc00",color:"#fff",fontWeight:700},
  yellow:{background:"#ffff00",color:"#000"},
  cyan:{background:"#00ffff",color:"#000"},
  pink:{background:"#ff99cc",color:"#000"},
  red:{background:"#ff3333",color:"#fff",fontWeight:700},
};

function evalFormula(formula,positionen,felder){
  try{
    const ctx={};
    Object.entries(felder||{}).forEach(([k,v])=>{ctx[k]=parseFloat(v)||0});
    ctx.ANZAHL_GESAMT=(positionen||[]).reduce((s,p)=>s+(parseFloat(p.anzahl)||0),0);
    ctx.PREIS_GESAMT=(positionen||[]).reduce((s,p)=>s+(parseFloat(p.preis)||0),0);
    ctx.ARTEN_ANZAHL=(positionen||[]).filter(p=>p.art).length;
    let expr=formula
      .replace(/SUM\(([^)]+)\)/gi,(_,a)=>a.split(",").map(x=>ctx[x.trim()]||0).reduce((s,v)=>s+v,0))
      .replace(/AVG\(([^)]+)\)/gi,(_,a)=>{const vs=a.split(",").map(x=>ctx[x.trim()]||0);return vs.reduce((s,v)=>s+v,0)/vs.length})
      .replace(/[A-Z_][A-Z0-9_]*/g,m=>ctx[m]!==undefined?ctx[m]:m);
    const r=new Function(`"use strict";return(${expr})`)();
    return isFinite(r)?Math.round(r*100)/100:"Fehler";
  }catch{return"Fehler"}
}

function Inp({value,onChange,style={},type="text",rows,readOnly}){
  const base={...S.cell,...style};
  if(rows)return<textarea value={value||""}onChange={e=>onChange&&onChange(e.target.value)}rows={rows}style={{...base,resize:"vertical"}}readOnly={readOnly}/>;
  return<input type={type}value={value||""}onChange={e=>onChange&&onChange(e.target.value)}style={base}readOnly={readOnly}/>;
}
function Row({children}){return<div style={{display:"flex",alignItems:"flex-start",gap:4,marginBottom:3}}>{children}</div>}
function Lbl({t,ml}){return<span style={{...S.label,marginLeft:ml,minWidth:"max-content",paddingTop:3}}>{t}</span>}

function SetupScreen({onConnect}){
  const[url,setUrl]=useState("");
  const[key,setKey]=useState("");
  const[err,setErr]=useState("");
  const[busy,setBusy]=useState(false);
  const connect=async()=>{
    if(DEMO_MODE){onConnect("demo","demo");return}
    if(!url||!key){setErr("Bitte beide Felder ausfüllen.");return}
    setBusy(true);setErr("");
    try{onConnect(url.trim(),key.trim())}
    catch(e){setErr("Verbindung fehlgeschlagen: "+(e?.message||String(e)))}
    finally{setBusy(false)}
  };
  return(
    <div style={{minHeight:"100vh",background:"#052e16",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Arial,sans-serif"}}>
      <div style={{background:"#fff",borderRadius:16,padding:36,width:480,boxShadow:"0 24px 80px rgba(0,0,0,.5)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:36,marginBottom:8}}>🌿</div>
          <div style={{fontWeight:800,fontSize:22,color:"#052e16"}}>Botanikum Stammblatt</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:4}}>Supabase Verbindung einrichten</div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>Supabase Project URL</label>
          <input value={url}onChange={e=>setUrl(e.target.value)}placeholder="https://xxxx.supabase.co"style={{width:"100%",padding:"10px 12px",border:"1px solid #d1d5db",borderRadius:9,fontSize:14,boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:4}}>Anon/Public Key</label>
          <input value={key}onChange={e=>setKey(e.target.value)}placeholder="eyJhbG..."style={{width:"100%",padding:"10px 12px",border:"1px solid #d1d5db",borderRadius:9,fontSize:14,boxSizing:"border-box",fontFamily:"monospace"}}/>
        </div>
        {err&&<div style={{background:"#fee2e2",color:"#b91c1c",borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:12}}>{err}</div>}
        <button onClick={connect}disabled={busy}style={{width:"100%",background:"#059669",color:"#fff",border:"none",borderRadius:9,padding:"12px",fontSize:15,cursor:"pointer",fontWeight:700}}>
          {busy?"Verbinde…":"Verbinden & starten"}
        </button>
        <div style={{marginTop:16,background:"#f0fdf4",borderRadius:9,padding:"12px 14px",fontSize:12,color:"#374151"}}>
          <strong>SQL-Setup noch nicht ausgeführt?</strong><br/>
          Lade zuerst <code style={{background:"#d1fae5",padding:"1px 5px",borderRadius:3}}>botanikum_supabase_setup.sql</code> in den Supabase SQL-Editor hoch.
        </div>
      </div>
    </div>
  );
}

function calcPosPreis(p, formel) {
  if (!formel || !formel.trim()) return null;
  try {
    const anzahl = parseFloat(p.anzahl) || 0;
    const cm = parseFloat(p.cm) || 0;
    // eslint-disable-next-line no-new-func
    const r = new Function("anzahl","cm",`"use strict";return(${formel})`)(anzahl, cm);
    return isFinite(r) ? Math.round(r * 100) / 100 : null;
  } catch { return null; }
}

function PositionenEditor({positionen, onChange, formulaMap={}, onFormulaMapChange}){
  const [showFormulas, setShowFormulas] = useState(false);
  const [draftMap, setDraftMap] = useState({});

  const openFormulas = () => { setDraftMap({...formulaMap}); setShowFormulas(true); };
  const saveFormulas = () => {
    onFormulaMapChange(draftMap);
    // Recalculate all prices with new formulas
    const updated = positionen.map(p => {
      const r = calcPosPreis(p, draftMap[p.label]);
      return r !== null ? {...p, preis: r} : p;
    });
    onChange(updated);
    setShowFormulas(false);
  };

  const setPos = (i, k, v) => {
    const copy = [...positionen];
    const updated = {...copy[i], [k]: v};
    if (k === "anzahl" || k === "cm") {
      const r = calcPosPreis({...updated, [k]: v}, formulaMap[updated.label]);
      if (r !== null) updated.preis = r;
    }
    copy[i] = updated;
    onChange(copy);
  };

  const sumCm = positionen.reduce((s,p)=>s+(parseFloat(p.cm)||0),0);
  const sumPreis = positionen.reduce((s,p)=>s+(parseFloat(p.preis)||0),0);

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",gap:0,background:"#ddd",border:"1px solid #999",borderBottom:"none",alignItems:"stretch"}}>
        {[["Pos",.4],["Pflanzenart / Beschreibung",4],["Anzahl",1],["cm",1],["€-Preis",1]].map(([h,f])=>(
          <div key={h} style={{flex:f,padding:"3px 6px",fontWeight:700,fontSize:10,borderRight:"1px solid #999",background:"#e8e8e0"}}>{h}</div>
        ))}
        <div style={{padding:"1px 5px",background:"#e8e8e0",display:"flex",alignItems:"center"}}>
          <button onClick={openFormulas}
            style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:4,padding:"1px 8px",fontSize:10,cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>
            ⚙ Formeln
          </button>
        </div>
      </div>

      {/* Rows */}
      {positionen.map((p,i)=>{
        const hasFormel = !!formulaMap[p.label];
        const preisAuto = hasFormel ? calcPosPreis(p, formulaMap[p.label]) : null;
        return(
          <div key={i} style={{display:"flex",gap:0,border:"1px solid #ccc",borderTop:"none",background:i%2===0?"#fff":"#f9f9f0"}}>
            <div style={{flex:.4,padding:"1px 5px",borderRight:"1px solid #ccc",fontSize:11,fontWeight:700,color:"#555",display:"flex",alignItems:"center",minWidth:26}}>{p.label}</div>
            <div style={{flex:4,borderRight:"1px solid #ccc"}}>
              <input value={p.art||""} onChange={e=>setPos(i,"art",e.target.value)} style={{...S.cell,border:"none",background:"transparent"}}/>
            </div>
            <div style={{flex:1,borderRight:"1px solid #ccc"}}>
              <input type="number" value={p.anzahl||""} onChange={e=>setPos(i,"anzahl",e.target.value)} style={{...S.cell,border:"none",background:"transparent",textAlign:"right"}}/>
            </div>
            <div style={{flex:1,borderRight:"1px solid #ccc"}}>
              <input type="number" value={p.cm||""} onChange={e=>setPos(i,"cm",e.target.value)} style={{...S.cell,border:"none",background:"transparent",textAlign:"right"}}/>
            </div>
            <div style={{flex:1,borderRight:"1px solid #ccc",position:"relative"}}>
              {hasFormel ? (
                <div style={{...S.cell,border:"none",background:"#ede9fe",color:"#5b21b6",fontWeight:700,fontFamily:"monospace",textAlign:"right",padding:"2px 5px",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3}}>
                  <span style={{fontSize:9,color:"#a78bfa"}}>ƒ</span>
                  {preisAuto !== null ? fmt2(preisAuto) : "–"}
                </div>
              ) : (
                <input type="number" value={p.preis||""} onChange={e=>setPos(i,"preis",e.target.value)} style={{...S.cell,border:"none",background:"transparent",textAlign:"right"}}/>
              )}
            </div>
          </div>
        );
      })}

      {/* Summenzeile */}
      <div style={{display:"flex",border:"1px solid #ccc",borderTop:"none",background:"#e8e8d0",fontWeight:700,fontSize:11}}>
        <div style={{flex:.4,padding:"3px 5px",borderRight:"1px solid #ccc"}}/>
        <div style={{flex:4,padding:"3px 8px",borderRight:"1px solid #ccc"}}>Summe</div>
        <div style={{flex:1,padding:"3px 6px",borderRight:"1px solid #ccc"}}/>
        <div style={{flex:1,padding:"3px 6px",borderRight:"1px solid #ccc",textAlign:"right"}}>{sumCm} cm</div>
        <div style={{flex:1,padding:"3px 6px",textAlign:"right"}}>{fmt2(sumPreis)} €</div>
      </div>

      {/* Formel-Editor Modal */}
      {showFormulas && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200}}>
          <div style={{background:"#fff",borderRadius:14,width:560,maxHeight:"85vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:2}}>
              <span style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>⚙ Positions-Formeln bearbeiten</span>
              <button onClick={()=>setShowFormulas(false)} style={{background:"#f1f5f9",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:16,color:"#555"}}>×</button>
            </div>
            <div style={{padding:20}}>
              <div style={{fontSize:12,color:"#64748b",marginBottom:14,background:"#f8fafc",borderRadius:8,padding:"10px 14px",lineHeight:1.7}}>
                <strong>Verfügbare Variablen:</strong> <code style={{background:"#ede9fe",padding:"1px 5px",borderRadius:3}}>anzahl</code> · <code style={{background:"#ede9fe",padding:"1px 5px",borderRadius:3}}>cm</code><br/>
                <strong>Beispiele:</strong> <code>anzahl * 15</code> · <code>cm * 2.5</code> · <code>anzahl * cm * 0.1</code><br/>
                <span style={{fontSize:11,color:"#94a3b8"}}>Leer lassen = Preis manuell eingeben</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {LABELS.map(lbl=>(
                  <div key={lbl} style={{background:"#f8fafc",borderRadius:8,padding:"8px 10px",border:"1px solid #e2e8f0"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:12,color:"#374151",minWidth:28}}>{lbl}</span>
                      {draftMap[lbl] && (
                        <span style={{fontSize:10,background:"#ede9fe",color:"#6366f1",borderRadius:3,padding:"0 5px"}}>ƒ aktiv</span>
                      )}
                    </div>
                    <input
                      value={draftMap[lbl]||""}
                      onChange={e=>setDraftMap(m=>({...m,[lbl]:e.target.value}))}
                      placeholder="z. B. anzahl * 15"
                      style={{...S.cell,fontFamily:"monospace",fontSize:12}}
                    />
                    {draftMap[lbl] && (
                      <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>
                        Vorschau (Anzahl=2, cm=100): <strong style={{color:"#6366f1"}}>
                          {(()=>{try{return fmt2(new Function("anzahl","cm",`"use strict";return(${draftMap[lbl]})`)(2,100))}catch{return"Fehler"}})()}
                        </strong> €
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}>
                <button onClick={()=>setShowFormulas(false)} style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>Abbrechen</button>
                <button onClick={saveFormulas} style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:700}}>✓ Übernehmen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const FIELD_TYPES=[
  {type:"text",icon:"T",label:"Textfeld"},
  {type:"number",icon:"#",label:"Zahlenfeld"},
  {type:"formula",icon:"ƒ",label:"Formelfeld"},
  {type:"select",icon:"▾",label:"Auswahl"},
  {type:"date",icon:"📅",label:"Datum"},
  {type:"check",icon:"☑",label:"Checkbox"},
];

function CustomSectionEditor({section,onSave,onClose}){
  const[fields,setFields]=useState(section.fields||[]);
  const[label,setLabel]=useState(section.label||"");
  const updF=(i,k,v)=>{const fs=[...fields];fs[i]={...fs[i],[k]:v};setFields(fs);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1300}}>
      <div style={{background:"#fff",borderRadius:14,width:600,maxHeight:"85vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:2,gap:8}}>
          <input value={label}onChange={e=>setLabel(e.target.value)}style={{fontWeight:700,fontSize:15,color:"#0f172a",border:"none",outline:"none",flex:1,background:"transparent"}}placeholder="Abschnitt-Bezeichnung"/>
          <button onClick={onClose}style={{background:"#f1f5f9",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:16,color:"#555"}}>×</button>
        </div>
        <div style={{padding:20}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14,paddingBottom:12,borderBottom:"1px solid #f1f5f9"}}>
            <span style={{fontSize:11,color:"#64748b",alignSelf:"center",marginRight:4}}>Feld hinzufügen:</span>
            {FIELD_TYPES.map(ft=>(
              <button key={ft.type}onClick={()=>{const fid=uid();setFields(prev=>[...prev,{id:fid,field_id:fid,type:ft.type,label:ft.label,formula:"",options:"",prefix:"",suffix:""}]);}}
                style={{background:"#f8fafc",border:"1px dashed #cbd5e1",borderRadius:7,padding:"4px 10px",fontSize:12,cursor:"pointer",color:"#374151",display:"flex",alignItems:"center",gap:4}}>
                <span style={{color:"#6366f1",fontWeight:700}}>{ft.icon}</span>{ft.label}
              </button>
            ))}
          </div>
          {fields.length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:12,padding:"24px 0"}}>Noch keine Felder. Klicke oben auf einen Feldtyp.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {fields.map((f,i)=>(
              <div key={f.id||i}style={{display:"flex",alignItems:"center",gap:6,background:"#f8fafc",borderRadius:8,padding:"7px 10px",border:"1px solid #e2e8f0"}}>
                <span style={{fontSize:13,color:"#6366f1",fontWeight:700,width:20,textAlign:"center",flexShrink:0}}>{FIELD_TYPES.find(t=>t.type===f.type)?.icon}</span>
                <input value={f.label||""}onChange={e=>updF(i,"label",e.target.value)}placeholder="Bezeichnung"style={{flex:1,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:12,fontWeight:600}}/>
                {f.type==="formula"&&<input value={f.formula||""}onChange={e=>updF(i,"formula",e.target.value)}placeholder="z. B. PREIS_GESAMT * 0.1"style={{width:160,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11,fontFamily:"monospace"}}/>}
                {f.type==="select"&&<input value={f.options||""}onChange={e=>updF(i,"options",e.target.value)}placeholder="A, B, C"style={{width:100,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11}}/>}
                {(f.type==="number"||f.type==="text")&&<>
                  <input value={f.prefix||""}onChange={e=>updF(i,"prefix",e.target.value)}placeholder="Präfix"style={{width:55,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11}}/>
                  <input value={f.suffix||""}onChange={e=>updF(i,"suffix",e.target.value)}placeholder="Suffix"style={{width:55,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11}}/>
                </>}
                <button onClick={()=>setFields(fields.filter((_,j)=>j!==i))}style={{background:"#fee2e2",border:"none",borderRadius:5,padding:"3px 8px",fontSize:12,cursor:"pointer",color:"#b91c1c",flexShrink:0}}>×</button>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}>
            <button onClick={onClose}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>Abbrechen</button>
            <button onClick={()=>onSave({...section,label,fields})}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:700}}>✓ Speichern</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stammblatt({data,schema,onChange,onSave,saving,formulaMap,onFormulaMapChange,layout,onLayoutChange}){
  const[editMode,setEditMode]=useState(false);
  const[editingSection,setEditingSection]=useState(null);
  const set=(k,v)=>onChange({...data,[k]:v});
  const setPos=(pos)=>onChange({...data,positionen:pos});
  const setZusatz=(zusatzposten)=>onChange({...data,zusatzposten});
  const pos=data.positionen||[];
  const felder=data.felder||{};
  const zusatz=data.zusatzposten||[];
  const rabattFak=parseFloat(data.rabatt_xf)||1;
  const sumPreis=pos.reduce((s,p)=>s+(parseFloat(p.preis)||0),0);
  const transPreis=parseFloat(data.trans_preis)||0;
  const duengerP=parseFloat(data.duenger_preis)||0;
  const zusatzSumme=zusatz.filter(z=>z.aktiv).reduce((s,z)=>s+(parseFloat(z.preis)||0),0);
  const endsummeO=(sumPreis/rabattFak)+transPreis+duengerP+zusatzSumme;
  const endsumme=endsummeO*1.19;

  const addZusatz=()=>setZusatz([...zusatz,{id:uid(),label:"Neuer Posten",preis:0,aktiv:true}]);
  const setZ=(i,k,v)=>{const z=[...zusatz];z[i]={...z[i],[k]:v};setZusatz(z);};
  const delZ=(i)=>setZusatz(zusatz.filter((_,j)=>j!==i));

  const moveUp=(idx)=>{if(idx===0)return;const l=[...layout];[l[idx-1],l[idx]]=[l[idx],l[idx-1]];onLayoutChange(l);};
  const moveDown=(idx)=>{if(idx===layout.length-1)return;const l=[...layout];[l[idx+1],l[idx]]=[l[idx],l[idx+1]];onLayoutChange(l);};
  const toggleVisible=(idx)=>{const l=[...layout];l[idx]={...l[idx],visible:!l[idx].visible};onLayoutChange(l);};
  const deleteSection=(idx)=>onLayoutChange(layout.filter((_,i)=>i!==idx));
  const addCustomSection=()=>{const id="custom_"+uid();onLayoutChange([...layout,{id,label:"Neuer Abschnitt",visible:true,fields:[],custom:true}]);};
  const saveSection=(idx,updated)=>{const l=[...layout];l[idx]=updated;onLayoutChange(l);setEditingSection(null);};

  const renderField=(f)=>{
    const fid=f.field_id||f.id;
    const val=felder[fid]||"";
    const setVal=(v)=>onChange({...data,felder:{...felder,[fid]:v}});
    const base={...S.cell};
    if(f.type==="formula"){
      const result=evalFormula(f.formula||"0",pos,felder);
      return<div style={{...base,background:"#ede9fe",color:"#5b21b6",fontWeight:700,fontFamily:"monospace",padding:"3px 6px"}}>{f.prefix||""}{result}{f.suffix||""}</div>;
    }
    if(f.type==="number")return<div style={{display:"flex",alignItems:"center",gap:3}}>{f.prefix&&<span style={{fontSize:11,color:"#666"}}>{f.prefix}</span>}<input type="number"value={val}onChange={e=>setVal(e.target.value)}style={base}/>{f.suffix&&<span style={{fontSize:11,color:"#666"}}>{f.suffix}</span>}</div>;
    if(f.type==="select")return<select value={val}onChange={e=>setVal(e.target.value)}style={base}><option value="">–</option>{(f.options||"").split(",").map(o=><option key={o.trim()}>{o.trim()}</option>)}</select>;
    if(f.type==="check")return<label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12}}><input type="checkbox"checked={!!val}onChange={e=>setVal(e.target.checked)}style={{width:14,height:14}}/><span>{f.label}</span></label>;
    if(f.type==="date")return<input type="date"value={val}onChange={e=>setVal(e.target.value)}style={base}/>;
    return<input type="text"value={val}onChange={e=>setVal(e.target.value)}style={base}/>;
  };

  const sectionContent=(s,idx)=>{
    switch(s.id){
      case"kopf":return(
        <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{background:"#cc0000",border:"2px solid #990000",padding:"4px 8px"}}>
            <input value={data.jahr||YEAR}onChange={e=>set("jahr",e.target.value)}style={{background:"#cc0000",border:"none",color:"#fff",fontWeight:800,fontSize:20,width:60,outline:"none",textAlign:"center"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3,flex:1}}>
            <Row><Lbl t="Restbetrag"/><Inp value={data.restbetrag}onChange={v=>set("restbetrag",v)}style={{width:80}}/><Lbl t="Code"ml={8}/><Inp value={data.code}onChange={v=>set("code",v)}style={{width:90}}/><Lbl t="zugesagt"ml={8}/><input type="checkbox"checked={!!data.zugesagt}onChange={e=>set("zugesagt",e.target.checked)}style={{width:16,height:16,marginTop:3}}/></Row>
            <Row><Lbl t="Auslieferung/Abholung"/><Inp value={data.auslieferung_abholung}onChange={v=>set("auslieferung_abholung",v)}type="date"style={{width:130}}/><Inp value={data.abholung}onChange={v=>set("abholung",v)}style={{...S.yellow,width:80}}/><Lbl t="Umtopfarbeiten"ml={8}/><Inp value={data.umtopfarbeiten}onChange={v=>set("umtopfarbeiten",v)}style={{...S.green,width:100}}/></Row>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3,marginLeft:"auto"}}>
            <Row><Lbl t="Osteria"/><Inp value={data.osteria}onChange={v=>set("osteria",v)}style={{...S.green,width:110}}/></Row>
            <Row><Lbl t="Vapiano"/><Inp value={data.vapiano}onChange={v=>set("vapiano",v)}style={{...S.green,width:110}}/></Row>
            <Row><span style={{...S.label}}>TOTAL {YEAR}</span><Inp value={data.total_aktuell}onChange={v=>set("total_aktuell",v)}style={{...S.yellow,width:60,textAlign:"center"}}/></Row>
          </div>
        </div>
      );
      case"adresse":return(
        <div style={{display:"flex",gap:0,marginBottom:4,border:"1px solid #bbb",background:"#fff"}}>
          <div style={{flex:2,padding:"5px 8px",borderRight:"1px solid #ccc"}}>
            <Row><Lbl t="Firma"/><Inp value={data.firma}onChange={v=>set("firma",v)}/></Row>
            <Row><Lbl t="Vorname"/><Inp value={data.vorname}onChange={v=>set("vorname",v)}style={{width:140}}/></Row>
            <Row><Lbl t="PLZ"/><Inp value={data.plz}onChange={v=>set("plz",v)}style={{width:55}}/><Lbl t="Ort"ml={4}/><Inp value={data.ort}onChange={v=>set("ort",v)}style={{width:110}}/></Row>
            <Row><Lbl t="Straße"/><Inp value={data.strasse}onChange={v=>set("strasse",v)}/></Row>
            <Row><Lbl t="Telefon"/><Inp value={data.telefon}onChange={v=>set("telefon",v)}rows={2}/></Row>
          </div>
          <div style={{flex:2,padding:"5px 8px",borderRight:"1px solid #ccc"}}>
            <Row><Lbl t="Ortsteil"/><Inp value={data.ortsteil}onChange={v=>set("ortsteil",v)}style={{width:55}}/><Lbl t="E-Mail"ml={8}/><Inp value={data.email}onChange={v=>set("email",v)}style={{width:200}}/></Row>
            <Row><Lbl t="Lieferadresse"/></Row>
            <Inp value={data.lieferadresse}onChange={v=>set("lieferadresse",v)}rows={2}/>
            <div style={{marginTop:4,display:"flex",gap:8,alignItems:"center"}}>
              <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,cursor:"pointer"}}><input type="checkbox"checked={!!data.neukunde}onChange={e=>set("neukunde",e.target.checked)}style={{width:14,height:14}}/>Neukunde</label>
              <Lbl t="Mail"ml={6}/><Inp value={data.mail}onChange={v=>set("mail",v)}style={{width:80}}/>
            </div>
          </div>
          <div style={{flex:2,padding:"5px 8px"}}>
            <Row><Lbl t="ausgeliefert am"/><Inp value={data.ausgeliefert_am}onChange={v=>set("ausgeliefert_am",v)}type="date"style={{width:120}}/><Lbl t="Ersatz"ml={6}/><Inp value={data.ersatzpflanzen}onChange={v=>set("ersatzpflanzen",v)}style={{...S.pink,width:80}}/></Row>
            <Row><Lbl t="Kdr"/><Inp value={data.kdr}onChange={v=>set("kdr",v)}style={{...S.yellow,width:55}}/></Row>
            <Row><button style={{...S.green,border:"none",borderRadius:3,padding:"3px 10px",cursor:"pointer",fontSize:12,fontWeight:700}}>S</button><button style={{background:"#ff8800",color:"#fff",border:"none",borderRadius:3,padding:"3px 10px",cursor:"pointer",fontSize:12,marginLeft:4}}>N</button><Lbl t="TOTAL 2025"ml={10}/><Inp value={data.total_vorjahr}onChange={v=>set("total_vorjahr",v)}style={{...S.yellow,width:55,textAlign:"center"}}/><Lbl t="ALTE CM"ml={6}/><Inp value={data.alte_cm}onChange={v=>set("alte_cm",v)}style={{width:55}}/></Row>
          </div>
        </div>
      );
      case"bemerkungen_aktuell":return(
        <div style={{marginBottom:6}}>
          <div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:2}}>Bemerkungen {YEAR}</div>
          <Inp value={data.bemerkungen_aktuell}onChange={v=>set("bemerkungen_aktuell",v)}rows={3}style={{background:"#e8ffe8",border:"1px solid #99cc99"}}/>
        </div>
      );
      case"positionen":return<div style={{marginBottom:6}}><PositionenEditor positionen={pos}onChange={setPos}formulaMap={formulaMap}onFormulaMapChange={onFormulaMapChange}/></div>;
      case"custom_felder":return schema.length>0?(
        <div style={{marginBottom:8,background:"#f0f0ff",border:"1px solid #ccccff",padding:"6px 8px",borderRadius:4}}>
          <div style={{fontSize:10,fontWeight:700,color:"#4444aa",marginBottom:6}}>Benutzerdefinierte Felder (Builder)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {[...schema].sort((a,b)=>a.y-b.y||a.x-b.x).map(f=>(
              <div key={f.field_id||f.id}>{f.type!=="check"&&<div style={{...S.label,marginBottom:2}}>{f.label}</div>}{renderField(f)}</div>
            ))}
          </div>
        </div>
      ):null;
      case"rabatt":return(
        <>
          <Row><Lbl t="Rabatt TXT"/><Inp value={data.rabatt_txt}onChange={v=>set("rabatt_txt",v)}style={{flex:1,minWidth:140}}/><Lbl t="Rabatt xf"ml={8}/><Inp value={data.rabatt_xf}onChange={v=>set("rabatt_xf",v)}type="number"style={{...S.pink,width:65}}/><span style={{fontSize:12,fontWeight:700,marginLeft:4,paddingTop:3}}>{fmt2(sumPreis*(1-1/rabattFak))} €</span></Row>
          <Row><Lbl t="Gutschein"/><Inp value={data.gutschein}onChange={v=>set("gutschein",v)}style={{flex:1}}/></Row>
        </>
      );
      case"transport":return(
        <div style={{display:"flex",gap:6,marginBottom:3,alignItems:"center",background:"#fff3e0",padding:"4px 6px",border:"1px solid #f0c060"}}>
          <Lbl t="Transport"/><Inp value={data.trans_txt}onChange={v=>set("trans_txt",v)}style={{flex:1}}/>
          <Inp value={data.trans_preis}onChange={v=>set("trans_preis",v)}type="number"style={{width:80,textAlign:"right"}}/>
          <span style={{fontSize:12,fontWeight:700}}>€</span>
        </div>
      );
      case"duenger":return(
        <div style={{display:"flex",gap:6,marginBottom:3,alignItems:"center",background:"#f0fff0",padding:"4px 6px",border:"1px solid #99cc99"}}>
          <Inp value={data.duenger_txt}onChange={v=>set("duenger_txt",v)}style={{flex:1}}/>
          <Inp value={data.duenger_preis}onChange={v=>set("duenger_preis",v)}type="number"style={{width:80,textAlign:"right"}}/>
          <span style={{fontSize:12,fontWeight:700}}>€</span>
        </div>
      );
      case"zusatzposten":return(
        <div style={{marginBottom:3}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#f0f4ff",border:"1px solid #c7d2fe",borderBottom:zusatz.length?"none":"1px solid #c7d2fe",padding:"3px 8px"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#4338ca",flex:1}}>Zusätzliche Posten</span>
            <button onClick={addZusatz}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:4,padding:"1px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>+ Posten</button>
          </div>
          {zusatz.map((z,i)=>(
            <div key={z.id||i}style={{display:"flex",gap:0,border:"1px solid #c7d2fe",borderTop:"none",alignItems:"center",background:z.aktiv?"#f5f3ff":"#fafafa"}}>
              <div style={{padding:"2px 6px",borderRight:"1px solid #c7d2fe",display:"flex",alignItems:"center"}}><input type="checkbox"checked={!!z.aktiv}onChange={e=>setZ(i,"aktiv",e.target.checked)}style={{width:14,height:14,cursor:"pointer"}}title="Zur Endsumme"/></div>
              <div style={{flex:1,borderRight:"1px solid #c7d2fe"}}><input value={z.label||""}onChange={e=>setZ(i,"label",e.target.value)}style={{...S.cell,border:"none",background:"transparent",color:z.aktiv?"#3730a3":"#888",fontWeight:z.aktiv?600:400}}/></div>
              <div style={{width:90,borderRight:"1px solid #c7d2fe",display:"flex",alignItems:"center"}}><input type="number"value={z.preis||""}onChange={e=>setZ(i,"preis",e.target.value)}style={{...S.cell,border:"none",background:"transparent",textAlign:"right",color:z.aktiv?"#3730a3":"#888",fontWeight:z.aktiv?700:400}}/><span style={{fontSize:11,color:"#888",paddingRight:4,flexShrink:0}}>€</span></div>
              <div style={{padding:"2px 5px"}}><button onClick={()=>delZ(i)}style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:14,lineHeight:1}}>×</button></div>
            </div>
          ))}
          {zusatz.length>0&&<div style={{display:"flex",border:"1px solid #c7d2fe",borderTop:"none",background:"#e0e7ff",fontWeight:700,fontSize:11,padding:"3px 8px",justifyContent:"space-between"}}><span style={{color:"#4338ca"}}>Zusatzposten Summe</span><span style={{color:"#4338ca"}}>{fmt2(zusatzSumme)} €</span></div>}
        </div>
      );
      case"zeit":return<Row style={{marginBottom:3}}><Lbl t="Zeit Abholung"/><Inp value={data.zeit_abholung}onChange={v=>set("zeit_abholung",v)}style={{...S.yellow,width:130}}/></Row>;
      case"summen":return(
        <div style={{display:"flex",gap:10,marginBottom:8,marginTop:6}}>
          <div style={{flex:1,border:"1px solid #ccc",background:"#fff",padding:"7px 10px"}}>
            {[["Drittelsumme",fmt2(endsumme/3)],["Zweidrittel",fmt2(endsumme*2/3)]].map(([l,v])=>(
              <div key={l}style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600}}>{l}</span>
                <span style={{fontSize:13,fontWeight:800,color:"#cc0000",background:"#ffe0e0",padding:"1px 8px",border:"1px solid #ffaaaa"}}>{v} €</span>
              </div>
            ))}
          </div>
          <div style={{flex:2,border:"1px solid #ccc",background:"#fff",padding:"7px 10px"}}>
            {[["Endsumme o. MwSt",fmt2(endsummeO),"#e8ffe8","#99cc99"],["Gesamtendsumme (inkl. 19%)",fmt2(endsumme),"#fff3e0","#f0c060"]].map(([l,v,bg,bc])=>(
              <div key={l}style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600}}>{l}</span>
                <span style={{fontSize:13,fontWeight:800,color:"#006600",background:bg,padding:"1px 10px",border:`1px solid ${bc}`}}>{v} €</span>
              </div>
            ))}
          </div>
          <div style={{flex:1,border:"1px solid #ccc",background:"#fff",padding:"7px 10px"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:3}}>Transportdauer</div>
            <Inp value={data.transportdauer}onChange={v=>set("transportdauer",v)}rows={2}/>
          </div>
        </div>
      );
      case"restpflanzen":return(
        <div style={{display:"flex",gap:10,marginBottom:6}}>
          <div style={{flex:2,border:"1px solid #ccc",padding:"6px 8px",background:"#fffef0"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#666",marginBottom:3}}>Restpflanzen</div>
            <Inp value={data.restpflanzen}onChange={v=>set("restpflanzen",v)}rows={2}style={{background:"#fffff0"}}/>
            <Row><Lbl t="Info"/><Inp value={data.restpflanzen_info}onChange={v=>set("restpflanzen_info",v)}/></Row>
          </div>
          <div style={{flex:3}}>
            {[["Bemerkungen 2022","bemerkungen_2022","#e0f7ff"],["Bemerkungen 2023","bemerkungen_2023","#ccffff"],["Bemerkungen 2024","bemerkungen_2024","#ffccff"],["Bemerkungen 2025","bemerkungen_2025","#ccffff"]].map(([l,k,bg])=>(
              <div key={k}style={{marginBottom:4}}>
                <div style={{fontSize:10,fontWeight:700,color:"#555",marginBottom:1}}>{l}</div>
                <Inp value={data[k]}onChange={v=>set(k,v)}rows={2}style={{background:bg,border:"1px solid #ccc"}}/>
              </div>
            ))}
          </div>
        </div>
      );
      case"sonstiges":return(
        <Row><Lbl t="Camelia"/><Inp value={data.camelia}onChange={v=>set("camelia",v)}style={{width:130}}/><Lbl t="Vapiano Pflanzen"ml={10}/><Inp value={data.vapiano_pflanzen}onChange={v=>set("vapiano_pflanzen",v)}style={{...S.green,flex:1}}/></Row>
      );
      default:
        if(!s.custom)return null;
        return(
          <div style={{marginBottom:6}}>
            {(s.fields||[]).length>0?(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:4,padding:"6px 8px"}}>
                {(s.fields||[]).map(f=>(
                  <div key={f.id||f.field_id}>{f.type!=="check"&&<div style={{...S.label,marginBottom:2}}>{f.label}</div>}{renderField(f)}</div>
                ))}
              </div>
            ):(
              editMode&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:11,padding:"10px",border:"2px dashed #e2e8f0",borderRadius:4}}>Leer — klicke "✎ Felder" um Felder hinzuzufügen</div>
            )}
          </div>
        );
    }
  };

  return(
    <div style={{background:"#f5f5f0",padding:"10px 14px",fontFamily:"Arial,sans-serif",minWidth:860,fontSize:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,background:"#e0e0d8",padding:"3px 8px",border:"1px solid #ccc"}}>
        <span style={S.label}>Erstellungszeit</span>
        <input value={TODAY}readOnly style={{...S.cell,width:100}}/>
        <span style={S.label}>{new Date().toTimeString().slice(0,8)}</span>
        <div style={{flex:1}}/>
        {saving&&<span style={{fontSize:11,color:"#059669",fontWeight:700}}>💾 Speichern…</span>}
        <button onClick={()=>setEditMode(m=>!m)}style={{background:editMode?"#f59e0b":"#475569",color:"#fff",border:"none",borderRadius:6,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700}}>
          {editMode?"✓ Fertig":"✏ Layout"}
        </button>
        <button onClick={onSave}style={{background:"#059669",color:"#fff",border:"none",borderRadius:6,padding:"3px 14px",fontSize:12,cursor:"pointer",fontWeight:700}}>Speichern</button>
      </div>
      {/* Layout-gesteuerte Abschnitte */}
      {(layout||[]).map((s,idx)=>(
        <div key={s.id} style={{marginBottom:editMode?3:0,outline:editMode?"2px dashed #6366f144":"none",borderRadius:editMode?4:0}}>
          {editMode&&(
            <div style={{display:"flex",alignItems:"center",gap:3,background:"#1e293b",padding:"2px 8px",borderRadius:"4px 4px 0 0",userSelect:"none"}}>
              {s.custom
                ?<input value={s.label}onChange={e=>{const l=[...layout];l[idx]={...l[idx],label:e.target.value};onLayoutChange(l);}}
                   style={{background:"transparent",border:"none",color:"#e2e8f0",fontSize:11,fontWeight:700,flex:1,outline:"none"}}/>
                :<span style={{fontSize:11,color:"#94a3b8",flex:1}}>{s.label}</span>
              }
              {s.custom&&<button onClick={()=>setEditingSection(idx)}style={{background:"#6366f1",border:"none",color:"#fff",borderRadius:3,padding:"1px 8px",fontSize:10,cursor:"pointer",fontWeight:700}}>✎ Felder</button>}
              <button onClick={()=>toggleVisible(idx)}title={s.visible?"Ausblenden":"Einblenden"}style={{background:"none",border:"none",color:s.visible?"#4ade80":"#f87171",cursor:"pointer",fontSize:12,padding:"0 4px"}}>{s.visible?"●":"○"}</button>
              <button onClick={()=>moveUp(idx)}disabled={idx===0}style={{background:"none",border:"none",color:idx===0?"#334155":"#94a3b8",cursor:idx===0?"default":"pointer",fontSize:13,padding:"0 2px"}}>↑</button>
              <button onClick={()=>moveDown(idx)}disabled={idx===layout.length-1}style={{background:"none",border:"none",color:idx===layout.length-1?"#334155":"#94a3b8",cursor:idx===layout.length-1?"default":"pointer",fontSize:13,padding:"0 2px"}}>↓</button>
              {s.custom&&<button onClick={()=>deleteSection(idx)}style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:13,padding:"0 2px"}}>🗑</button>}
            </div>
          )}
          {(s.visible||editMode)&&(
            <div style={{opacity:s.visible?1:.3,pointerEvents:s.visible?"auto":"none"}}>
              {sectionContent(s,idx)}
            </div>
          )}
        </div>
      ))}

      {editMode&&(
        <button onClick={addCustomSection}style={{width:"100%",background:"#f8fafc",border:"2px dashed #6366f1",borderRadius:8,padding:"8px",fontSize:12,cursor:"pointer",color:"#6366f1",fontWeight:700,marginTop:6}}>
          + Neuen Abschnitt hinzufügen
        </button>
      )}
      {editingSection!==null&&(
        <CustomSectionEditor section={layout[editingSection]}onSave={(updated)=>saveSection(editingSection,updated)}onClose={()=>setEditingSection(null)}/>
      )}
    </div>
  );
}

function FormularBuilder({schema,setSchema,onClose,onSave}){
  const[dragging,setDragging]=useState(null);
  const[dragOver,setDragOver]=useState(null);
  const[editF,setEditF]=useState(null);
  const[saving,setSaving]=useState(false);
  const COLS=3,ROWS=6;
  const cells=[];
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)cells.push({x:c,y:r});
  const fieldAt=(x,y)=>schema.find(f=>f.x===x&&f.y===y);
  const handleDrop=(e,x,y)=>{
    e.preventDefault();
    if(!dragging)return;
    if(dragging.startsWith("new:")){
      const type=dragging.replace("new:","");
      if(fieldAt(x,y))return;
      const fid=uid();
      setSchema(prev=>[...prev,{id:fid,field_id:fid,type,label:FIELD_TYPES.find(t=>t.type===type)?.label||"Feld",x,y,formula:"",options:"",prefix:"",suffix:""}]);
    }else{
      const ex=fieldAt(x,y),drag=schema.find(f=>f.field_id===dragging||f.id===dragging);
      if(!drag)return;
      setSchema(prev=>prev.map(f=>{
        if((f.field_id||f.id)===dragging)return{...f,x,y};
        if(ex&&(f.field_id||f.id)===(ex.field_id||ex.id))return{...f,x:drag.x,y:drag.y};
        return f;
      }));
    }
    setDragging(null);setDragOver(null);
  };
  const save=async()=>{
    setSaving(true);
    try{await onSave(schema);onClose()}
    finally{setSaving(false)}
  };
  return(
    <div style={{display:"flex",gap:16}}>
      <div style={{width:145,flexShrink:0}}>
        <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Feldtypen</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {FIELD_TYPES.map(ft=>(
            <div key={ft.type}draggable onDragStart={e=>{setDragging(`new:${ft.type}`);e.dataTransfer.effectAllowed="copy"}}
              style={{display:"flex",alignItems:"center",gap:7,padding:"6px 10px",background:"#f8fafc",border:"1px dashed #cbd5e1",borderRadius:7,cursor:"grab",fontSize:12,color:"#374151"}}>
              <span style={{fontSize:14,color:"#6366f1",fontWeight:700,width:18,textAlign:"center"}}>{ft.icon}</span>{ft.label}
            </div>
          ))}
        </div>
        <div style={{marginTop:14,fontSize:10,color:"#666",lineHeight:1.6}}>
          <strong>Variablen für Formeln:</strong><br/>
          {["ANZAHL_GESAMT","PREIS_GESAMT","ARTEN_ANZAHL"].map(v=>(
            <code key={v}style={{display:"block",background:"#ede9fe",borderRadius:3,padding:"1px 4px",marginTop:2,fontSize:10}}>{v}</code>
          ))}
        </div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Layout (Doppelklick = bearbeiten)</div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},1fr)`,gap:7,background:"#f8fafc",borderRadius:10,padding:9,border:"1px solid #e2e8f0"}}>
          {cells.map(({x,y})=>{
            const f=fieldAt(x,y),isOver=dragOver===`${x},${y}`;
            return(
              <div key={`${x},${y}`}
                style={{minHeight:54,border:`2px dashed ${isOver?"#6366f1":"#e2e8f0"}`,borderRadius:8,background:isOver?"#ede9fe":"#fff",position:"relative",transition:"all .1s"}}
                onDragOver={e=>{e.preventDefault();setDragOver(`${x},${y}`)}}
                onDrop={e=>handleDrop(e,x,y)}onDragLeave={()=>setDragOver(null)}>
                {f?(
                  <div draggable onDragStart={e=>{setDragging(f.field_id||f.id);e.dataTransfer.effectAllowed="move"}}
                    onDoubleClick={()=>setEditF({...f})}
                    style={{padding:"7px 9px",cursor:"grab",opacity:dragging===(f.field_id||f.id)?.35:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <span style={{fontSize:9,fontWeight:700,color:"#6366f1",textTransform:"uppercase",letterSpacing:".05em"}}>{f.label}</span>
                      <div style={{display:"flex",gap:2}}>
                        <button onClick={e=>{e.stopPropagation();setEditF({...f})}}style={{background:"#ede9fe",border:"none",borderRadius:3,padding:"1px 5px",fontSize:10,cursor:"pointer",color:"#6366f1"}}>✎</button>
                        <button onClick={()=>setSchema(prev=>prev.filter(ff=>(ff.field_id||ff.id)!==(f.field_id||f.id)))}style={{background:"#fee2e2",border:"none",borderRadius:3,padding:"1px 5px",fontSize:10,cursor:"pointer",color:"#b91c1c"}}>×</button>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:"#94a3b8",fontFamily:f.type==="formula"?"monospace":"inherit"}}>
                      {f.type==="formula"?`=${f.formula||"?"}`:f.type==="select"?f.options||"…":f.type==="check"?"☐":f.type==="number"?`${f.prefix||""}0${f.suffix||""}`:f.type}
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:54,color:"#d1d5db",fontSize:10}}>Leer</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
          <button onClick={onClose}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>Abbrechen</button>
          <button onClick={save}disabled={saving}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:700}}>
            {saving?"Speichern…":"💾 In Supabase speichern"}
          </button>
        </div>
      </div>
      {editF&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100}}>
          <div style={{background:"#fff",borderRadius:13,padding:24,width:360,boxShadow:"0 16px 48px rgba(0,0,0,.25)"}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Feld bearbeiten</div>
            {[["label","Bezeichnung"],["prefix","Präfix"],["suffix","Suffix"]].map(([k,l])=>(
              <div key={k}style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:3}}>{l}</label>
                <input value={editF[k]||""}onChange={e=>setEditF({...editF,[k]:e.target.value})}style={{...S.cell}}/>
              </div>
            ))}
            {editF.type==="formula"&&(
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:3}}>Formel</label>
                <input value={editF.formula||""}onChange={e=>setEditF({...editF,formula:e.target.value})}placeholder="ANZAHL_GESAMT * 12.5"style={{...S.cell,fontFamily:"monospace"}}/>
                <div style={{fontSize:10,color:"#888",marginTop:3}}>+−×÷, SUM(a,b), AVG(a,b), Feld-IDs</div>
              </div>
            )}
            {editF.type==="select"&&(
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:3}}>Optionen (Komma)</label>
                <input value={editF.options||""}onChange={e=>setEditF({...editF,options:e.target.value})}placeholder="Klein, Mittel, Groß"style={{...S.cell}}/>
              </div>
            )}
            <div style={{fontSize:10,color:"#94a3b8",marginBottom:12}}>Feld-ID: <code style={{background:"#f1f5f9",padding:"1px 5px",borderRadius:3}}>{editF.field_id||editF.id}</code></div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setSchema(prev=>prev.map(f=>(f.field_id||f.id)===(editF.field_id||editF.id)?editF:f));setEditF(null)}}
                style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:7,padding:"7px 16px",fontSize:13,cursor:"pointer",fontWeight:700}}>OK</button>
              <button onClick={()=>setEditF(null)}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:7,padding:"7px 12px",fontSize:13,cursor:"pointer"}}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({title,onClose,wide,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#fff",borderRadius:14,width:wide?"min(980px,97vw)":"min(600px,95vw)",maxHeight:"93vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:2}}>
          <span style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{title}</span>
          <button onClick={onClose}style={{background:"#f1f5f9",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:16,color:"#555"}}>×</button>
        </div>
        <div style={{padding:20}}>{children}</div>
      </div>
    </div>
  );
}

function Tourenplanung({kunden,touren,setTouren,onSaveTour}){
  const[drag,setDrag]=useState(null);
  const unassigned=kunden.filter(k=>!touren.some(t=>t.kundenIds?.includes(k.id)));
  const assign=(kid,tid)=>{
    setTouren(prev=>prev.map(t=>{
      const without={...t,kundenIds:(t.kundenIds||[]).filter(id=>id!==kid)};
      if(t.id===tid)return{...without,kundenIds:[...(without.kundenIds||[]),kid]};
      return without;
    }));
  };
  const remove=(kid,tid)=>setTouren(prev=>prev.map(t=>t.id===tid?{...t,kundenIds:(t.kundenIds||[]).filter(id=>id!==kid)}:t));
  const addTour=async()=>{
    const cols=["#10b981","#6366f1","#f59e0b","#ec4899","#0891b2"];
    const neu={name:`Tour ${String.fromCharCode(65+touren.length)}`,fahrer:"",datum:TODAY,farbe:cols[touren.length%cols.length],kundenIds:[]};
    try{const saved=await onSaveTour(neu);setTouren(prev=>[...prev,{...neu,...saved}])}
    catch(e){console.error(e)}
  };
  const upd=(id,k,v)=>setTouren(prev=>prev.map(t=>t.id===id?{...t,[k]:v}:t));
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontWeight:800,fontSize:18,color:"#0f172a"}}>Tourenplanung</div>
          <div style={{fontSize:12,color:"#64748b"}}>{kunden.length} Kunden · {touren.length} Touren</div>
        </div>
        <button onClick={addTour}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer",fontWeight:700}}>+ Tour</button>
      </div>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8}}>
        <div style={{width:210,flexShrink:0}}
          onDragOver={e=>e.preventDefault()}
          onDrop={()=>{if(drag){touren.forEach(t=>{if((t.kundenIds||[]).includes(drag))remove(drag,t.id)});setDrag(null)}}}>
          <div style={{fontWeight:700,fontSize:11,color:"#64748b",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,padding:"5px 10px",marginBottom:6}}>
            Nicht zugewiesen ({unassigned.length})
          </div>
          {unassigned.map(k=>(
            <div key={k.id}draggable onDragStart={()=>setDrag(k.id)}
              style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 9px",marginBottom:4,cursor:"grab",fontSize:12}}>
              <div style={{fontWeight:600,color:"#374151"}}>{k.firma||k.vorname||"?"}</div>
              <div style={{fontSize:10,color:"#94a3b8"}}>{k.strasse}, {k.plz} {k.ort}</div>
            </div>
          ))}
          {unassigned.length===0&&<div style={{textAlign:"center",fontSize:11,color:"#94a3b8",padding:"16px 0"}}>Alle zugewiesen ✓</div>}
        </div>
        {touren.map(t=>{
          const tk=(t.kundenIds||[]).map(id=>kunden.find(k=>k.id===id)).filter(Boolean);
          return(
            <div key={t.id}style={{width:230,flexShrink:0}}>
              <div style={{background:t.farbe+"18",border:`1px solid ${t.farbe}55`,borderRadius:9,padding:"7px 9px",marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:t.farbe,flexShrink:0}}/>
                  <input value={t.name}onChange={e=>upd(t.id,"name",e.target.value)}style={{flex:1,background:"transparent",border:"none",fontWeight:700,fontSize:13,color:"#0f172a",outline:"none"}}/>
                  <button onClick={()=>setTouren(prev=>prev.filter(tt=>tt.id!==t.id))}style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:13}}>×</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                  <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:600}}>FAHRER</div>
                    <input value={t.fahrer||""}onChange={e=>upd(t.id,"fahrer",e.target.value)}style={{...S.cell,fontSize:11}}/></div>
                  <div><div style={{fontSize:9,color:"#94a3b8",fontWeight:600}}>DATUM</div>
                    <input type="date"value={t.datum||""}onChange={e=>upd(t.id,"datum",e.target.value)}style={{...S.cell,fontSize:11}}/></div>
                </div>
                <div style={{fontSize:11,color:t.farbe,fontWeight:600,marginTop:4}}>{tk.length} Kunden</div>
              </div>
              <div style={{minHeight:50,border:`2px dashed ${t.farbe}66`,borderRadius:8,padding:5}}
                onDragOver={e=>e.preventDefault()}
                onDrop={()=>{if(drag){assign(drag,t.id);setDrag(null)}}}>
                {tk.map((k,idx)=>(
                  <div key={k.id}style={{background:"#fff",border:`1px solid ${t.farbe}44`,borderRadius:6,padding:"4px 7px",marginBottom:3,fontSize:11,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <span style={{background:t.farbe+"22",color:t.farbe,borderRadius:3,padding:"0 4px",fontSize:9,fontWeight:700,marginRight:4}}>{idx+1}</span>
                      <span style={{fontWeight:600}}>{k.firma||k.vorname||"?"}</span>
                      <div style={{fontSize:10,color:"#94a3b8",paddingLeft:16}}>{k.strasse}</div>
                    </div>
                    <button onClick={()=>remove(k.id,t.id)}style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:11}}>×</button>
                  </div>
                ))}
                {tk.length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:10,padding:"12px 0"}}>Hier ablegen</div>}
              </div>
              <button onClick={()=>onSaveTour(t)}style={{marginTop:5,width:"100%",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px",fontSize:11,cursor:"pointer",color:"#374151"}}>💾 Tour speichern</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App(){
  const[connected,setConnected]=useState(false);
  const[kunden,setKunden]=useState([]);
  const[touren,setTouren]=useState([]);
  const[schema,setSchema]=useState([]);
  const[activeId,setActiveId]=useState(null);
  const[activeData,setActiveData]=useState(null);
  const[loading,setLoading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[modal,setModal]=useState(null);
  const[formulaMap,setFormulaMap]=useState({});
  const[layout,setLayout]=useState([...DEFAULT_LAYOUT]);
  const[page,setPage]=useState("stammblatt");
  const[err,setErr]=useState(null);
  const sbRef=useRef(sb);

  const onConnect=useCallback(async()=>{
    sbRef.current=makeSb();
    setConnected(true);setLoading(true);
    try{
      setKunden(_kunden);
      setSchema(_schema);
      setFormulaMap({..._posFormulaMap});
      setLayout([..._layoutConfig]);
      setTouren(_touren);
      if(_kunden.length){setActiveId(_kunden[0].id);loadKunde(_kunden[0].id);}
    }catch(e){setErr(e.message)}
    finally{setLoading(false)}
  },[]);

  useEffect(()=>{if(DEMO_MODE)onConnect();},[]);

  const loadKunde=async(id)=>{
    setLoading(true);
    try{
      const pos=_positionen[id]||[];
      const filled=LABELS.map(l=>pos.find(pp=>pp.label===l)||{label:l,art:"",cm:"",preis:"",anzahl:""});
      const base=_kunden.find(k=>k.id===id)||{};
      setActiveData({...base,positionen:filled,felder:{}});
      setActiveId(id);
    }catch(e){setErr(e.message)}
    finally{setLoading(false)}
  };

  const saveKunde=async()=>{
    if(!activeData)return;
    setSaving(true);setErr(null);
    try{
      const{positionen,felder,...rest}=activeData;
      if(!rest.id)rest.id=uid();
      const idx=_kunden.findIndex(k=>k.id===rest.id);
      if(idx>=0)_kunden[idx]={..._kunden[idx],...rest};else _kunden.push(rest);
      _positionen[rest.id]=positionen.filter(p=>p.art||p.cm||p.preis);
      setKunden([..._kunden]);
      setActiveId(rest.id);
    }catch(e){setErr("Fehler: "+e.message)}
    finally{setSaving(false)}
  };

  const newKunde=async()=>{
    const neu={id:uid(),jahr:String(YEAR),firma:"",vorname:"Neuer Kunde",plz:"",ort:"",strasse:"",telefon:"",email:"",code:"",rabatt_xf:1};
    _kunden.push(neu);
    _positionen[neu.id]=[];
    const positionen=LABELS.map(l=>({label:l,art:"",cm:"",preis:"",anzahl:""}));
    setKunden([..._kunden]);
    setActiveData({...neu,positionen,felder:{}});
    setActiveId(neu.id);
  };

  const deleteKunde=async(id)=>{
    if(!confirm("Datensatz wirklich löschen?"))return;
    _kunden=_kunden.filter(k=>k.id!==id);
    delete _positionen[id];
    setKunden([..._kunden]);
    if(activeId===id){setActiveData(null);setActiveId(null)}
  };

  const saveSchemaToDb=async(fields)=>{
    _schema=fields;
    setSchema(fields);
  };

  const handleFormulaMapChange=(map)=>{
    _posFormulaMap=map;
    setFormulaMap({...map});
  };

  const handleLayoutChange=(l)=>{
    _layoutConfig=l;
    setLayout([...l]);
  };

  const saveTour=async(tour)=>{
    const saved={...tour,id:tour.id||uid()};
    const idx=_touren.findIndex(t=>t.id===saved.id);
    if(idx>=0)_touren[idx]=saved;else _touren.push(saved);
    return saved;
  };

  if(!connected)return<SetupScreen onConnect={onConnect}/>;

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"Arial,sans-serif",background:"#2a2a2a",overflow:"hidden"}}>
      <div style={{width:200,background:"#1a1a2e",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"12px 12px 8px",borderBottom:"1px solid #333"}}>
          <div style={{fontWeight:800,fontSize:14,color:"#00cc00",letterSpacing:"-.01em"}}>🌿 Botanikum</div>
          <div style={{fontSize:10,color:"#fbbf24",marginTop:1}}>● Demo-Modus (kein Supabase)</div>
        </div>
        <div style={{padding:"6px 8px",borderBottom:"1px solid #333",display:"flex",flexDirection:"column",gap:2}}>
          {[["stammblatt","📋","Stammblätter"],["touren","🚐","Touren"]].map(([id,ic,l])=>(
            <button key={id}onClick={()=>setPage(id)}style={{background:page===id?"rgba(0,204,0,.2)":"transparent",color:page===id?"#4ade80":"#888",border:"none",borderRadius:6,padding:"7px 10px",fontSize:12,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:7,fontWeight:page===id?700:400}}>
              <span>{ic}</span>{l}
            </button>
          ))}
        </div>
        <div style={{padding:"6px 6px",flex:1,overflowY:"auto"}}>
          <div style={{fontSize:9,fontWeight:700,color:"#4ade80",textTransform:"uppercase",letterSpacing:".08em",padding:"4px 6px"}}>Datensätze ({kunden.length})</div>
          {kunden.map(k=>(
            <div key={k.id}onClick={()=>loadKunde(k.id)}
              style={{padding:"6px 8px",cursor:"pointer",borderRadius:6,background:activeId===k.id?"rgba(0,204,0,.2)":"transparent",borderLeft:activeId===k.id?"3px solid #00cc00":"3px solid transparent",marginBottom:1}}>
              <div style={{fontSize:11,fontWeight:600,color:activeId===k.id?"#4ade80":"#bbb",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k.firma||k.vorname||"–"}</div>
              <div style={{fontSize:9,color:"#555"}}>{k.plz} {k.ort}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"8px",borderTop:"1px solid #333",display:"flex",flexDirection:"column",gap:5}}>
          <button onClick={newKunde}style={{background:"#00cc00",color:"#fff",border:"none",borderRadius:6,padding:"7px",fontSize:12,cursor:"pointer",fontWeight:700}}>+ Neu</button>
          <button onClick={()=>setModal("builder")}style={{background:"rgba(99,102,241,.25)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,.3)",borderRadius:6,padding:"5px",fontSize:11,cursor:"pointer"}}>⚙ Felder-Builder</button>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{background:"#c0c0b8",borderBottom:"2px solid #888",padding:"3px 10px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {["Datei","Bearbeiten","Modus","Format","Script"].map(m=>(
            <button key={m}style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,padding:"2px 6px"}}>{m}</button>
          ))}
          <div style={{flex:1}}/>
          {err&&<span style={{fontSize:11,color:"#cc0000",background:"#ffe0e0",padding:"2px 8px",borderRadius:4}}>⚠ {err}</span>}
          <span style={{fontSize:11,background:"#fff",border:"1px solid #888",padding:"2px 8px"}}>Datensätze: {kunden.length}</span>
        </div>
        <div style={{background:"#d4d0c8",borderBottom:"1px solid #888",padding:"0 10px",display:"flex",alignItems:"flex-end",flexShrink:0}}>
          <div style={{background:"#f0ede8",border:"1px solid #888",borderBottom:"none",padding:"4px 16px",fontSize:12,fontWeight:700}}>STAM</div>
        </div>
        <div style={{flex:1,overflow:"auto",background:"#e0ddd8",padding:"8px 10px"}}>
          {loading?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#555",fontSize:14}}>Lade…</div>
          ):page==="stammblatt"?(
            activeData?(
              <Stammblatt data={activeData}schema={schema}onChange={setActiveData}onSave={saveKunde}saving={saving}formulaMap={formulaMap}onFormulaMapChange={handleFormulaMapChange}layout={layout}onLayoutChange={handleLayoutChange}/>
            ):(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#888"}}>Datensatz auswählen oder + Neu</div>
            )
          ):(
            <Tourenplanung kunden={kunden}touren={touren}setTouren={setTouren}onSaveTour={saveTour}/>
          )}
        </div>
        <div style={{background:"#c0c0b8",borderTop:"1px solid #888",padding:"2px 10px",display:"flex",alignItems:"center",gap:10,fontSize:11,flexShrink:0}}>
          <div style={{display:"flex",gap:2}}>
            {["◀◀","◀","▶","▶▶"].map((b,i)=>(
              <button key={i}onClick={()=>{
                const idx=kunden.findIndex(k=>k.id===activeId);
                const next=i<2?Math.max(0,idx+(i===0?-kunden.length:-1)):Math.min(kunden.length-1,idx+(i===3?kunden.length:1));
                if(kunden[next])loadKunde(kunden[next].id);
              }}style={{background:"#ddd",border:"1px solid #888",padding:"1px 7px",cursor:"pointer",fontSize:11}}>{b}</button>
            ))}
          </div>
          <span>Datensatz {kunden.findIndex(k=>k.id===activeId)+1} von {kunden.length}</span>
          {activeData&&<button onClick={()=>deleteKunde(activeId)}style={{marginLeft:"auto",background:"#cc0000",color:"#fff",border:"none",borderRadius:4,padding:"2px 10px",fontSize:10,cursor:"pointer"}}>Löschen</button>}
        </div>
      </div>
      {modal==="builder"&&(
        <Modal title="⚙ Formular-Builder"onClose={()=>setModal(null)}wide>
          <FormularBuilder schema={schema}setSchema={setSchema}onClose={()=>setModal(null)}onSave={saveSchemaToDb}/>
        </Modal>
      )}
    </div>
  );
}
