import React,{useState,useEffect,useRef,useCallback,createContext,useContext}from"react";
import {createSupabaseClient,IS_PRODUCTION,T}from"./supabaseClient.js";

const DEMO_MODE=!IS_PRODUCTION;

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
let _valueLists=[{id:"vl1",name:"Ja / Nein",items:["Ja","Nein"]},{id:"vl2",name:"Zahlungsart",items:["Bar","Überweisung","EC-Karte","Rechnung"]},{id:"vl3",name:"Status",items:["Offen","In Bearbeitung","Erledigt","Storniert"]}];
let _relations=[
  {id:"rel1",name:"Positionen",sourceField:"id",targetField:"kunde_id",targetTable:"positionen"},
  {id:"rel2",name:"Notizen",sourceField:"id",targetField:"kunde_id",targetTable:"notizen"}
];
let _notizen={
  k1:[{id:"n1",kunde_id:"k1",text:"Stammkunde seit 2020",datum:"2024-01-15"},{id:"n2",kunde_id:"k1",text:"Bevorzugt morgens",datum:"2024-03-10"}],
  k2:[{id:"n2",kunde_id:"k2",text:"Nur Lieferung",datum:"2024-02-20"}],
  k3:[]
};

const LABELS=["P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"];

const PART_TYPES=[
  {type:"title_header",label:"Titelkopf",color:"#c8b99a"},
  {type:"header",label:"Kopfzeile",color:"#b0a898"},
  {type:"subsummary_above",label:"Vorkopf",color:"#9ab0c8"},
  {type:"body",label:"Body",color:"#e8e4de"},
  {type:"subsummary_below",label:"Nachfuß",color:"#9ab0c8"},
  {type:"summary",label:"Gesamtergebnis",color:"#9ac8a0"},
  {type:"footer",label:"Fußzeile",color:"#b0a898"},
  {type:"title_footer",label:"Titelfuß",color:"#c8b99a"},
];

const PART_TYPE_MAP=Object.fromEntries(PART_TYPES.map(p=>[p.type,p]));

const DEFAULT_LAYOUT=[
  {id:"kopf",label:"Kopfbereich",visible:true,partType:"header"},
  {id:"adresse",label:"Adresse & Kontakt",visible:true,partType:"body"},
  {id:"bemerkungen_aktuell",label:"Bemerkungen aktuell",visible:true,partType:"body"},
  {id:"positionen",label:"Positionen",visible:true,partType:"body"},
  {id:"portal_positionen",label:"Portal: Positionen",visible:true,partType:"body",isPortal:true,portalConfig:{relationId:"rel1",rows:5,showScrollbar:true,allowNew:true,allowDelete:true,alternateRows:true,fields:[{key:"label",label:"Pos",width:50},{key:"art",label:"Bezeichnung",width:200},{key:"cm",label:"cm",width:60},{key:"anzahl",label:"Anz",width:60},{key:"preis",label:"Preis €",width:80}]}},
  {id:"custom_felder",label:"Benutzerdefinierte Felder (Builder)",visible:true,partType:"body"},
  {id:"rabatt",label:"Rabatt & Gutschein",visible:true,partType:"body"},
  {id:"transport",label:"Transport",visible:true,partType:"body"},
  {id:"duenger",label:"Dünger",visible:true,partType:"body"},
  {id:"zusatzposten",label:"Zusätzliche Posten",visible:true,partType:"body"},
  {id:"zeit",label:"Zeit Abholung",visible:true,partType:"body"},
  {id:"summen",label:"Summen",visible:true,partType:"summary"},
  {id:"restpflanzen",label:"Restpflanzen & Historisch",visible:true,partType:"body"},
  {id:"sonstiges",label:"Sonstiges",visible:true,partType:"footer"},
];
let _layoutConfig=[...DEFAULT_LAYOUT];
let _customPages=[];
let _labelConfig={};
let _layouts=[{id:"layout_main",name:"Stammblatt Standard",config:[...DEFAULT_LAYOUT],labelOverrides:{}}];

const KNOWN_FIELDS=[
  {key:"firma",label:"Firma"},{key:"vorname",label:"Vorname"},
  {key:"plz",label:"PLZ"},{key:"ort",label:"Ort"},
  {key:"strasse",label:"Straße"},{key:"telefon",label:"Telefon"},
  {key:"email",label:"E-Mail"},{key:"code",label:"Code"},
  {key:"jahr",label:"Jahr"},{key:"restbetrag",label:"Restbetrag"},
  {key:"bemerkungen_aktuell",label:"Bemerkungen aktuell"},
  {key:"total_aktuell",label:"Total aktuell"},{key:"total_vorjahr",label:"Total Vorjahr"},
  {key:"auslieferung_abholung",label:"Auslieferung/Abholung"},
  {key:"ausgeliefert_am",label:"Ausgeliefert am"},
  {key:"trans_txt",label:"Transport Text"},{key:"trans_preis",label:"Transport €"},
  {key:"duenger_txt",label:"Dünger Text"},{key:"duenger_preis",label:"Dünger €"},
  {key:"ortsteil",label:"Ortsteil"},{key:"lieferadresse",label:"Lieferadresse"},
  {key:"kdr",label:"Kdr"},{key:"abholung",label:"Abholung"},
  {key:"umtopfarbeiten",label:"Umtopfarbeiten"},{key:"vapiano_pflanzen",label:"Vapiano Pflanzen"},
  {key:"camelia",label:"Camelia"},{key:"zeit_abholung",label:"Zeit Abholung"},
  {key:"mail",label:"Mail"},{key:"ersatzpflanzen",label:"Ersatzpflanzen"},
  {key:"rabatt_txt",label:"Rabatt Text"},{key:"gutschein",label:"Gutschein"},
  {key:"transportdauer",label:"Transportdauer"},{key:"restpflanzen",label:"Restpflanzen"},
];

function snap(v){return Math.round(v/10)*10}

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

function mapGaertnereiKunde(g){
  const name=[g.vorname,g.nachname].filter(Boolean).join(" ");
  return{
    code:String(g.kundennummer||""),
    vorname:g.vorname||"",
    firma:g.nachname||name||"",
    email:g.email||"",
    ortsteil:g.ortsteil||"",
    jahr:String(YEAR),
    rabatt_xf:1,
  };
}

function positionenFromGaertnerei(g){
  const rows=[];
  for(let i=1;i<=12;i++){
    const art=g[`pflanze${i}`]||g[`pflanze_${i}`]||"";
    if(String(art).trim())rows.push({label:`P${i}`,sort_order:i-1,art:String(art).trim(),cm:null,preis:null,anzahl:null});
  }
  return rows;
}
const S={
  cell:{border:"1px solid #bbb",background:"#fff",padding:"2px 5px",fontSize:12,color:"#111",outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"},
  label:{fontSize:10,color:"#444",fontWeight:600,whiteSpace:"nowrap",paddingTop:2},
  green:{background:"#00cc00",color:"#fff",fontWeight:700},
  yellow:{background:"#ffff00",color:"#000"},
  cyan:{background:"#00ffff",color:"#000"},
  pink:{background:"#ff99cc",color:"#000"},
  red:{background:"#ff3333",color:"#fff",fontWeight:700},
  btnPrimary:{background:"#6366f1",color:"#fff",border:"none",borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:700},
  btnSecondary:{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer"},
  btnDanger:{background:"#fee2e2",color:"#b91c1c",border:"none",borderRadius:5,padding:"3px 8px",fontSize:12,cursor:"pointer"},
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

const LabelCtx=React.createContext({editMode:false,overrides:{},onChange:()=>{}});

function Inp({value,onChange,style={},type="text",rows,readOnly}){
  const base={...S.cell,...style};
  if(rows)return<textarea value={value||""}onChange={e=>onChange&&onChange(e.target.value)}rows={rows}style={{...base,resize:"vertical"}}readOnly={readOnly}/>;
  return<input type={type}value={value||""}onChange={e=>onChange&&onChange(e.target.value)}style={base}readOnly={readOnly}/>;
}
function Row({children}){return<div style={{display:"flex",alignItems:"flex-start",gap:4,marginBottom:3}}>{children}</div>}
function Lbl({t,ml}){
  const{editMode,overrides,onChange}=React.useContext(LabelCtx);
  const display=overrides[t]!==undefined?overrides[t]:t;
  if(editMode){
    return<input value={display}onChange={e=>onChange({...overrides,[t]:e.target.value})}
      title="Feldbezeichnung bearbeiten"
      style={{...S.label,marginLeft:ml,minWidth:30,paddingTop:1,paddingBottom:1,background:"#fef9c3",border:"1px solid #fbbf24",borderRadius:3,cursor:"text",width:Math.max(40,display.length*7+10)}}/>;
  }
  return<span style={{...S.label,marginLeft:ml,minWidth:"max-content",paddingTop:3}}>{display}</span>;
}

function LoginScreen({onLogin,externalError}){
  const[email,setEmail]=useState("");
  const[pw,setPw]=useState("");
  const[err,setErr]=useState("");
  const[busy,setBusy]=useState(false);
  const displayErr=err||externalError;
  const submit=async()=>{
    if(!email||!pw){setErr("Bitte E-Mail und Passwort eingeben.");return}
    setBusy(true);setErr("");
    try{await onLogin(email.trim(),pw)}
    catch(e){setErr(e?.message||"Anmeldung fehlgeschlagen");setPw("")}
    finally{setBusy(false)}
  };
  return(
    <div style={{minHeight:"100vh",background:"#052e16",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Arial,sans-serif"}}>
      <div style={{background:"#fff",borderRadius:16,padding:36,width:400,boxShadow:"0 24px 80px rgba(0,0,0,.5)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:36,marginBottom:8}}>🌿</div>
          <div style={{fontWeight:800,fontSize:22,color:"#052e16"}}>Botanikum Stammblatt</div>
          <div style={{fontSize:13,color:"#64748b",marginTop:4}}>Bitte anmelden</div>
        </div>
        <input type="email"value={email}onChange={e=>setEmail(e.target.value)}placeholder="E-Mail"onKeyDown={e=>e.key==="Enter"&&submit()}
          style={{width:"100%",padding:"12px 14px",border:"1px solid #d1d5db",borderRadius:9,fontSize:14,boxSizing:"border-box",marginBottom:12}}/>
        <input type="password"value={pw}onChange={e=>setPw(e.target.value)}placeholder="Passwort"onKeyDown={e=>e.key==="Enter"&&submit()}
          style={{width:"100%",padding:"12px 14px",border:"1px solid #d1d5db",borderRadius:9,fontSize:14,boxSizing:"border-box",marginBottom:12}}/>
        {displayErr&&<div style={{background:"#fee2e2",color:"#b91c1c",borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:12}}>{displayErr}</div>}
        <button onClick={submit}disabled={busy}style={{width:"100%",background:"#059669",color:"#fff",border:"none",borderRadius:9,padding:"12px",fontSize:15,cursor:"pointer",fontWeight:700}}>
          {busy?"Anmelden…":"Anmelden"}
        </button>
        <div style={{marginTop:16,background:"#f0fdf4",borderRadius:9,padding:"12px 14px",fontSize:12,color:"#374151"}}>
          Gleicher Login wie die Gärtnerei-App. SQL-Setup: <code style={{background:"#d1fae5",padding:"1px 5px",borderRadius:3}}>botanikum_supabase_setup.sql</code>
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
  {type:"radio",icon:"◉",label:"Radiobuttons"},
  {type:"checkbox_list",icon:"☑",label:"Checkboxliste"},
  {type:"dropdown_vl",icon:"▾",label:"Dropdown (Liste)"},
  {type:"listbox",icon:"≡",label:"Listenfeld"},
];

const DEFAULT_FMT={borderTop:true,borderBottom:true,borderLeft:true,borderRight:true,borderColor:"#bbbbbb",fillColor:"#ffffff",fontSize:12,fontBold:false,fontItalic:false,textAlign:"left",fontColor:"#111111"};
const VL_TYPES=["radio","checkbox_list","dropdown_vl","listbox"];

function CustomSectionEditor({section,onSave,onClose,valueLists}){
  const[fields,setFields]=useState(section.fields||[]);
  const[label,setLabel]=useState(section.label||"");
  const[openFmt,setOpenFmt]=useState({});
  const[openCond,setOpenCond]=useState({});
  const updF=(i,k,v)=>{const fs=[...fields];fs[i]={...fs[i],[k]:v};setFields(fs);};
  const updFmt=(i,k,v)=>{const fs=[...fields];fs[i]={...fs[i],fmt:{...DEFAULT_FMT,...(fs[i].fmt||{}),[k]:v}};setFields(fs);};
  const toggleFmt=(i)=>setOpenFmt(prev=>({...prev,[i]:!prev[i]}));
  const toggleCond=(i)=>setOpenCond(prev=>({...prev,[i]:!prev[i]}));
  const updCond=(i,k,v)=>{const fs=[...fields];fs[i]={...fs[i],condition:{...(fs[i].condition||{}),[k]:v}};setFields(fs);};
  const clearCond=(i)=>{const fs=[...fields];const{condition,...rest}=fs[i];fs[i]=rest;setFields(fs);};
  const vls=valueLists||[];
  const allFieldKeys=[...KNOWN_FIELDS.map(f=>({key:f.key,label:f.label})),...fields.map(f=>({key:f.field_id||f.id,label:f.label}))];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1300}}>
      <div style={{background:"#fff",borderRadius:14,width:660,maxHeight:"88vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:2,gap:8}}>
          <input value={label}onChange={e=>setLabel(e.target.value)}style={{fontWeight:700,fontSize:15,color:"#0f172a",border:"none",outline:"none",flex:1,background:"transparent"}}placeholder="Abschnitt-Bezeichnung"/>
          <button onClick={onClose}style={{background:"#f1f5f9",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:16,color:"#555"}}>×</button>
        </div>
        <div style={{padding:20}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14,paddingBottom:12,borderBottom:"1px solid #f1f5f9"}}>
            <span style={{fontSize:11,color:"#64748b",alignSelf:"center",marginRight:4}}>Feld hinzufügen:</span>
            {FIELD_TYPES.map(ft=>(
              <button key={ft.type}onClick={()=>{const fid=uid();setFields(prev=>[...prev,{id:fid,field_id:fid,type:ft.type,label:ft.label,formula:"",options:"",prefix:"",suffix:"",valueListId:"",fmt:{...DEFAULT_FMT}}]);}}
                style={{background:"#f8fafc",border:"1px dashed #cbd5e1",borderRadius:7,padding:"4px 10px",fontSize:12,cursor:"pointer",color:"#374151",display:"flex",alignItems:"center",gap:4}}>
                <span style={{color:"#6366f1",fontWeight:700}}>{ft.icon}</span>{ft.label}
              </button>
            ))}
          </div>
          {fields.length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:12,padding:"24px 0"}}>Noch keine Felder. Klicke oben auf einen Feldtyp.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {fields.map((f,i)=>{
              const fmt={...DEFAULT_FMT,...(f.fmt||{})};
              return(
                <div key={f.id||i}style={{background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",opacity:f.locked?0.6:1}}>
                    <span style={{fontSize:13,color:"#6366f1",fontWeight:700,width:20,textAlign:"center",flexShrink:0}}>{FIELD_TYPES.find(t=>t.type===f.type)?.icon}</span>
                    <input value={f.label||""}onChange={e=>updF(i,"label",e.target.value)}placeholder="Bezeichnung"readOnly={!!f.locked}style={{flex:1,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:12,fontWeight:600,background:f.locked?"#f1f5f9":"#fff"}}/>
                    {f.type==="formula"&&<input value={f.formula||""}onChange={e=>updF(i,"formula",e.target.value)}placeholder="z. B. PREIS_GESAMT * 0.1"readOnly={!!f.locked}style={{width:160,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11,fontFamily:"monospace"}}/>}
                    {f.type==="select"&&<input value={f.options||""}onChange={e=>updF(i,"options",e.target.value)}placeholder="A, B, C"readOnly={!!f.locked}style={{width:100,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11}}/>}
                    {VL_TYPES.includes(f.type)&&(
                      <select value={f.valueListId||""}onChange={e=>updF(i,"valueListId",e.target.value)}disabled={!!f.locked}style={{width:130,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11}}>
                        <option value="">– Werteliste –</option>
                        {vls.map(vl=><option key={vl.id}value={vl.id}>{vl.name}</option>)}
                      </select>
                    )}
                    {(f.type==="number"||f.type==="text")&&<>
                      <input value={f.prefix||""}onChange={e=>updF(i,"prefix",e.target.value)}placeholder="Präfix"readOnly={!!f.locked}style={{width:55,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11}}/>
                      <input value={f.suffix||""}onChange={e=>updF(i,"suffix",e.target.value)}placeholder="Suffix"readOnly={!!f.locked}style={{width:55,border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:11}}/>
                    </>}
                    <div style={{display:"flex",alignItems:"center",gap:3,flexShrink:0,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:5,padding:"2px 6px"}}>
                      <span style={{fontSize:9,color:"#94a3b8",fontWeight:700}}>X</span>
                      <input type="number"value={f.x!=null?f.x:""}onChange={e=>updF(i,"x",parseInt(e.target.value)||0)}placeholder="0"style={{width:44,border:"none",background:"transparent",fontSize:11,padding:"0 2px",outline:"none",textAlign:"right"}}/>
                      <span style={{fontSize:9,color:"#94a3b8",fontWeight:700,marginLeft:4}}>Y</span>
                      <input type="number"value={f.y!=null?f.y:""}onChange={e=>updF(i,"y",parseInt(e.target.value)||0)}placeholder="0"style={{width:44,border:"none",background:"transparent",fontSize:11,padding:"0 2px",outline:"none",textAlign:"right"}}/>
                    </div>
                    <button onClick={()=>updF(i,"locked",!f.locked)}title={f.locked?"Entsperren":"Sperren"}style={{background:f.locked?"#fef9c3":"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:12,cursor:"pointer",color:f.locked?"#b45309":"#94a3b8",flexShrink:0}}>{f.locked?"🔒":"🔓"}</button>
                    <button onClick={()=>toggleFmt(i)}title="Formatierung"style={{background:openFmt[i]?"#ede9fe":"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:12,cursor:"pointer",color:"#6366f1",flexShrink:0}}>⚙</button>
                    <button onClick={()=>toggleCond(i)}title="Bedingung"style={{background:openCond[i]?"#fef9c3":f.condition?.sourceField?"#fef08a":"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 7px",fontSize:12,cursor:"pointer",color:"#b45309",flexShrink:0,position:"relative"}}>
                      ⚡{f.condition?.sourceField&&<span style={{position:"absolute",top:0,right:0,width:6,height:6,borderRadius:"50%",background:"#f59e0b",transform:"translate(50%,-50%)"}}/>}
                    </button>
                    {!f.locked&&<button onClick={()=>setFields(fields.filter((_,j)=>j!==i))}style={{...S.btnDanger,flexShrink:0}}>×</button>}
                    {f.locked&&<span style={{fontSize:14,flexShrink:0,padding:"0 4px"}}>🔒</span>}
                  </div>
                  {openFmt[i]&&(
                    <div style={{borderTop:"1px solid #e2e8f0",background:"#fafafa",padding:"8px 12px",display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#666",fontWeight:700}}>Rahmen:</span>
                        {[["T","borderTop"],["B","borderBottom"],["L","borderLeft"],["R","borderRight"]].map(([lbl,k])=>(
                          <label key={k}style={{display:"flex",alignItems:"center",gap:2,fontSize:10,cursor:"pointer"}}>
                            <input type="checkbox"checked={fmt[k]}onChange={e=>updFmt(i,k,e.target.checked)}style={{width:12,height:12}}/>{lbl}
                          </label>
                        ))}
                        <input type="color"value={fmt.borderColor}onChange={e=>updFmt(i,"borderColor",e.target.value)}title="Rahmenfarbe"style={{width:22,height:20,border:"none",padding:0,cursor:"pointer"}}/>
                      </div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#666",fontWeight:700}}>Füllung:</span>
                        <input type="color"value={fmt.fillColor}onChange={e=>updFmt(i,"fillColor",e.target.value)}style={{width:22,height:20,border:"none",padding:0,cursor:"pointer"}}/>
                      </div>
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#666",fontWeight:700}}>Schrift:</span>
                        <input type="number"value={fmt.fontSize}min={8}max={24}onChange={e=>updFmt(i,"fontSize",parseInt(e.target.value)||12)}style={{width:42,border:"1px solid #e2e8f0",borderRadius:4,padding:"1px 4px",fontSize:11}}/>
                        <label style={{display:"flex",alignItems:"center",gap:2,fontSize:10,cursor:"pointer"}}><input type="checkbox"checked={fmt.fontBold}onChange={e=>updFmt(i,"fontBold",e.target.checked)}style={{width:12,height:12}}/>B</label>
                        <label style={{display:"flex",alignItems:"center",gap:2,fontSize:10,cursor:"pointer"}}><input type="checkbox"checked={fmt.fontItalic}onChange={e=>updFmt(i,"fontItalic",e.target.checked)}style={{width:12,height:12}}/><em>I</em></label>
                        <input type="color"value={fmt.fontColor}onChange={e=>updFmt(i,"fontColor",e.target.value)}title="Textfarbe"style={{width:22,height:20,border:"none",padding:0,cursor:"pointer"}}/>
                      </div>
                      <div style={{display:"flex",gap:2,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#666",fontWeight:700}}>Ausrichtung:</span>
                        {[["L","left"],["M","center"],["R","right"]].map(([lbl,val])=>(
                          <button key={val}onClick={()=>updFmt(i,"textAlign",val)}style={{background:fmt.textAlign===val?"#6366f1":"#f1f5f9",color:fmt.textAlign===val?"#fff":"#374151",border:"1px solid #e2e8f0",borderRadius:4,padding:"2px 7px",fontSize:11,cursor:"pointer",fontWeight:fmt.textAlign===val?700:400}}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {openCond[i]&&(
                    <div style={{borderTop:"1px solid #e2e8f0",background:"#fffbeb",padding:"8px 12px",display:"flex",flexWrap:"wrap",gap:8,alignItems:"flex-end"}}>
                      <div>
                        <div style={{fontSize:9,fontWeight:700,color:"#b45309",marginBottom:2}}>Feld anzeigen wenn:</div>
                        <select value={f.condition?.sourceField||""}onChange={e=>updCond(i,"sourceField",e.target.value)}style={{border:"1px solid #fbbf24",borderRadius:4,padding:"2px 5px",fontSize:11}}>
                          <option value="">– Quellfeld –</option>
                          {allFieldKeys.map(k=><option key={k.key}value={k.key}>{k.label}</option>)}
                        </select>
                      </div>
                      <select value={f.condition?.operator||"="}onChange={e=>updCond(i,"operator",e.target.value)}style={{border:"1px solid #fbbf24",borderRadius:4,padding:"2px 5px",fontSize:11}}>
                        {["=","≠",">","<","enthält","ist leer","ist nicht leer"].map(op=><option key={op}value={op}>{op}</option>)}
                      </select>
                      {!["ist leer","ist nicht leer"].includes(f.condition?.operator||"=")&&(
                        <input value={f.condition?.value||""}onChange={e=>updCond(i,"value",e.target.value)}placeholder="Wert"style={{width:80,border:"1px solid #fbbf24",borderRadius:4,padding:"2px 5px",fontSize:11}}/>
                      )}
                      <div>
                        <div style={{fontSize:9,fontWeight:700,color:"#b45309",marginBottom:2}}>Wenn FALSCH:</div>
                        <select value={f.condition?.action||"Ausblenden"}onChange={e=>updCond(i,"action",e.target.value)}style={{border:"1px solid #fbbf24",borderRadius:4,padding:"2px 5px",fontSize:11}}>
                          {["Ausblenden","Deaktivieren","Farbe ändern"].map(a=><option key={a}value={a}>{a}</option>)}
                        </select>
                      </div>
                      {f.condition?.action==="Farbe ändern"&&(
                        <div style={{display:"flex",alignItems:"center",gap:4}}>
                          <span style={{fontSize:10,color:"#b45309"}}>Farbe:</span>
                          <input type="color"value={f.condition?.color||"#ffe4e1"}onChange={e=>updCond(i,"color",e.target.value)}style={{width:28,height:22,border:"1px solid #fbbf24",padding:0,cursor:"pointer",borderRadius:3}}/>
                        </div>
                      )}
                      <button onClick={()=>clearCond(i)}style={{background:"#fee2e2",border:"none",borderRadius:4,padding:"2px 8px",fontSize:11,cursor:"pointer",color:"#b91c1c"}}>Bedingung löschen</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}>
            <button onClick={onClose}style={{...S.btnSecondary,borderRadius:8,padding:"8px 16px",fontSize:13}}>Abbrechen</button>
            <button onClick={()=>onSave({...section,label,fields})}style={{...S.btnPrimary,borderRadius:8,padding:"8px 18px",fontSize:13}}>✓ Speichern</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function evalCondition(cond,data,felder){
  if(!cond||!cond.sourceField)return true;
  const raw=data?.[cond.sourceField]??felder?.[cond.sourceField]??"";
  const val=String(raw);
  const cv=String(cond.value||"");
  switch(cond.operator){
    case"=":return val===cv;
    case"≠":return val!==cv;
    case">":return parseFloat(val)>parseFloat(cv);
    case"<":return parseFloat(val)<parseFloat(cv);
    case"enthält":return val.includes(cv);
    case"ist leer":return val.trim()==="";
    case"ist nicht leer":return val.trim()!=="";
    default:return true;
  }
}

function Portal({relation,kundeData,onKundeDataChange,config}){
  if(!kundeData)return null;
  const cfg={rows:4,showScrollbar:true,allowNew:true,allowDelete:true,alternateRows:true,fields:[],...(config||{})};
  const getRows=()=>{
    if(!relation)return[];
    if(relation.targetTable==="positionen")return kundeData.positionen||[];
    if(relation.targetTable==="notizen")return _notizen[kundeData.id]||[];
    return[];
  };
  const setRows=(rows)=>{
    if(!relation)return;
    if(relation.targetTable==="positionen"){onKundeDataChange&&onKundeDataChange({...kundeData,positionen:rows});}
    else if(relation.targetTable==="notizen"){_notizen[kundeData.id]=rows;}
  };
  const rows=getRows();
  const rowH=26;
  const visibleH=cfg.rows*rowH+2;
  const addRow=()=>{
    const id=uid();
    const newRow={id,kunde_id:kundeData.id};
    cfg.fields.forEach(f=>{newRow[f.key]="";});
    setRows([...rows,newRow]);
    onKundeDataChange&&onKundeDataChange({...kundeData,positionen:relation.targetTable==="positionen"?[...rows,newRow]:kundeData.positionen});
  };
  const delRow=(i)=>{
    const nr=rows.filter((_,j)=>j!==i);
    setRows(nr);
    if(relation.targetTable==="positionen")onKundeDataChange&&onKundeDataChange({...kundeData,positionen:nr});
  };
  const setCell=(i,k,v)=>{
    const nr=[...rows];nr[i]={...nr[i],[k]:v};
    setRows(nr);
    if(relation.targetTable==="positionen")onKundeDataChange&&onKundeDataChange({...kundeData,positionen:nr});
  };
  const totalW=cfg.fields.reduce((s,f)=>s+(f.width||80),0)+(cfg.allowDelete?26:0);
  return(
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",background:"#dde0ee",border:"1px solid #aab",borderBottom:"none"}}>
        {cfg.fields.map(f=>(
          <div key={f.key}style={{width:f.width||80,flexShrink:0,padding:"2px 5px",fontWeight:700,fontSize:10,borderRight:"1px solid #aab",background:"#d0d4e8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.label}</div>
        ))}
        {cfg.allowDelete&&<div style={{width:26,flexShrink:0,background:"#d0d4e8"}}/>}
        {cfg.showScrollbar&&<div style={{width:14,background:"#d0d4e8"}}/>}
      </div>
      <div style={{height:visibleH,overflowY:cfg.showScrollbar?"scroll":"hidden",border:"1px solid #aab",borderBottom:"none",boxSizing:"border-box"}}>
        {rows.map((row,i)=>(
          <div key={row.id||i}style={{display:"flex",height:rowH,background:cfg.alternateRows&&i%2===1?"#f0f4ff":"#fff",borderBottom:"1px solid #dde"}}>
            {cfg.fields.map(f=>(
              <div key={f.key}style={{width:f.width||80,flexShrink:0,borderRight:"1px solid #dde",overflow:"hidden"}}>
                <input value={row[f.key]??""}onChange={e=>setCell(i,f.key,e.target.value)}
                  style={{...S.cell,border:"none",background:"transparent",height:rowH-2,padding:"1px 4px",fontSize:11,width:"100%",boxSizing:"border-box"}}/>
              </div>
            ))}
            {cfg.allowDelete&&(
              <div style={{width:26,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <button onClick={()=>delRow(i)}style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:13,lineHeight:1,padding:0}}>×</button>
              </div>
            )}
          </div>
        ))}
        {rows.length===0&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#94a3b8",fontSize:11}}>Keine Einträge</div>}
      </div>
      <div style={{display:"flex",alignItems:"center",border:"1px solid #aab",background:"#edf0f8",padding:"2px 6px",gap:6}}>
        {cfg.allowNew&&<button onClick={addRow}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:3,padding:"1px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>+ Zeile</button>}
        <span style={{fontSize:10,color:"#666"}}>{rows.length} Einträge</span>
      </div>
    </div>
  );
}

function PortalEditor({section,onSave,onClose}){
  const[cfg,setCfg]=useState({...(section.portalConfig||{})});
  const upd=(k,v)=>setCfg(c=>({...c,[k]:v}));
  const updField=(i,k,v)=>{const fs=[...(cfg.fields||[])];fs[i]={...fs[i],[k]:v};setCfg(c=>({...c,fields:fs}));};
  const removeField=(i)=>{const fs=(cfg.fields||[]).filter((_,j)=>j!==i);setCfg(c=>({...c,fields:fs}));};
  const addField=()=>setCfg(c=>({...c,fields:[...(c.fields||[]),{key:"neues_feld_"+uid(),label:"Neu",width:80}]}));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1300}}>
      <div style={{background:"#fff",borderRadius:14,width:520,maxHeight:"88vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:2}}>
          <span style={{fontWeight:700,fontSize:15,color:"#0f172a",flex:1}}>⚙ Portal konfigurieren</span>
          <button onClick={onClose}style={{background:"#f1f5f9",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:16,color:"#555"}}>×</button>
        </div>
        <div style={{padding:20}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:3}}>Sichtbare Zeilen (1–20)</label>
              <input type="number"min={1}max={20}value={cfg.rows||4}onChange={e=>upd("rows",parseInt(e.target.value)||4)}style={{...S.cell}}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,paddingTop:14}}>
              {[["showScrollbar","Scrollbar"],["alternateRows","Wechselfarben"],["allowNew","Neue Zeilen erlauben"],["allowDelete","Löschen erlauben"]].map(([k,l])=>(
                <label key={k}style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}>
                  <input type="checkbox"checked={!!cfg[k]}onChange={e=>upd(k,e.target.checked)}style={{width:13,height:13}}/>{l}
                </label>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:8,textTransform:"uppercase",letterSpacing:".04em"}}>Spalten</div>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
            {(cfg.fields||[]).map((f,i)=>(
              <div key={i}style={{display:"flex",gap:6,alignItems:"center",background:"#f8fafc",borderRadius:7,padding:"5px 8px",border:"1px solid #e2e8f0"}}>
                <input value={f.key||""}onChange={e=>updField(i,"key",e.target.value)}placeholder="Feldschlüssel"style={{flex:1,...S.cell,fontSize:11,fontFamily:"monospace"}}/>
                <input value={f.label||""}onChange={e=>updField(i,"label",e.target.value)}placeholder="Spaltenname"style={{flex:1,...S.cell,fontSize:11}}/>
                <input type="number"value={f.width||80}onChange={e=>updField(i,"width",parseInt(e.target.value)||80)}placeholder="Breite"style={{width:60,...S.cell,fontSize:11}}/>
                <button onClick={()=>removeField(i)}style={{background:"#fee2e2",border:"none",borderRadius:5,padding:"2px 7px",fontSize:12,cursor:"pointer",color:"#b91c1c",flexShrink:0}}>×</button>
              </div>
            ))}
          </div>
          <button onClick={addField}style={{background:"#f5f3ff",border:"1px dashed #a5b4fc",borderRadius:7,padding:"5px 12px",fontSize:12,cursor:"pointer",color:"#6d28d9",fontWeight:600,marginBottom:16}}>+ Spalte hinzufügen</button>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button onClick={onClose}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>Abbrechen</button>
            <button onClick={()=>onSave({...section,portalConfig:cfg})}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:700}}>✓ Speichern</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldGrid({fields,renderField}){
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
      {fields.map(f=>(<div key={f.id||f.field_id}>{f.type!=="check"&&<div style={{...S.label,marginBottom:2}}>{f.label}</div>}{renderField(f)}</div>))}
    </div>
  );
}

function Stammblatt({data,schema,onChange,onSave,saving,formulaMap,onFormulaMapChange,layout,onLayoutChange,labelOverrides,onLabelOverrideChange,valueLists,activeLayoutName,onSaveLayoutProfile}){
  const[editMode,setEditMode]=useState(false);
  const[editingSection,setEditingSection]=useState(null);
  const[gridEnabled,setGridEnabled]=useState(false);
  const[snapEnabled,setSnapEnabled]=useState(false);
  const[showAlignDialog,setShowAlignDialog]=useState(false);
  const[showTabOrder,setShowTabOrder]=useState(false);
  const[tabOrder,setTabOrder]=useState(layout.tabOrder||[]);
  const[showPrint,setShowPrint]=useState(false);
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

  function getVLItems(vls,valueListId){return(vls||[]).find(v=>v.id===valueListId)?.items||[]}
  const renderField=(f)=>{
    const fid=f.field_id||f.id;
    const val=felder[fid]||"";
    const setVal=(v)=>onChange({...data,felder:{...felder,[fid]:v}});
    // Conditional field control
    if(f.condition&&f.condition.sourceField){
      const condMet=evalCondition(f.condition,data,felder);
      if(!condMet){
        if(f.condition.action==="Ausblenden")return null;
        if(f.condition.action==="Deaktivieren"){/* render below with disabled */}
        // "Farbe ändern" handled via fillColor override below
      }
    }
    const fmt={...DEFAULT_FMT,...(f.fmt||{})};
    // Apply condition color override
    const condActive=f.condition&&f.condition.sourceField&&!evalCondition(f.condition,data,felder);
    const fillOverride=(condActive&&f.condition.action==="Farbe ändern"&&f.condition.color)?f.condition.color:fmt.fillColor;
    const fmtStyle={
      fontSize:fmt.fontSize,
      fontWeight:fmt.fontBold?"bold":"normal",
      fontStyle:fmt.fontItalic?"italic":"normal",
      textAlign:fmt.textAlign,
      color:fmt.fontColor,
      background:fillOverride,
      borderTop:fmt.borderTop?`1px solid ${fmt.borderColor}`:"none",
      borderBottom:fmt.borderBottom?`1px solid ${fmt.borderColor}`:"none",
      borderLeft:fmt.borderLeft?`1px solid ${fmt.borderColor}`:"none",
      borderRight:fmt.borderRight?`1px solid ${fmt.borderColor}`:"none",
      opacity:(condActive&&f.condition.action==="Deaktivieren")?0.4:1,
    };
    const isDisabled=condActive&&f.condition.action==="Deaktivieren";
    const base={...S.cell,...fmtStyle};
    if(f.type==="formula"){
      const result=evalFormula(f.formula||"0",pos,felder);
      return<div style={{...base,background:"#ede9fe",color:"#5b21b6",fontWeight:700,fontFamily:"monospace",padding:"3px 6px"}}>{f.prefix||""}{result}{f.suffix||""}</div>;
    }
    if(f.type==="number")return<div style={{display:"flex",alignItems:"center",gap:3}}>{f.prefix&&<span style={{fontSize:11,color:"#666"}}>{f.prefix}</span>}<input type="number"value={val}onChange={e=>setVal(e.target.value)}style={base}disabled={isDisabled}/>{f.suffix&&<span style={{fontSize:11,color:"#666"}}>{f.suffix}</span>}</div>;
    if(f.type==="select")return<select value={val}onChange={e=>setVal(e.target.value)}style={base}disabled={isDisabled}><option value="">–</option>{(f.options||"").split(",").map(o=><option key={o.trim()}>{o.trim()}</option>)}</select>;
    if(f.type==="check")return<label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:fmt.fontSize||12,opacity:isDisabled?0.4:1}}><input type="checkbox"checked={!!val}onChange={e=>setVal(e.target.checked)}style={{width:14,height:14}}disabled={isDisabled}/><span>{f.label}</span></label>;
    if(f.type==="date")return<input type="date"value={val}onChange={e=>setVal(e.target.value)}style={base}disabled={isDisabled}/>;
    const vls=valueLists||[];
    if(f.type==="radio"){
      const items=getVLItems(vls,f.valueListId);
      return<div style={{...fmtStyle,padding:"2px 4px"}}>{items.map(it=><label key={it}style={{display:"flex",alignItems:"center",gap:4,fontSize:fmt.fontSize||12,cursor:"pointer",marginBottom:1}}><input type="radio"name={fid}value={it}checked={val===it}onChange={()=>setVal(it)}style={{width:13,height:13}}disabled={isDisabled}/>{it}</label>)}</div>;
    }
    if(f.type==="checkbox_list"){
      const items=getVLItems(vls,f.valueListId);
      const selected=(val||"").split(",").map(s=>s.trim()).filter(Boolean);
      const toggle=(it)=>{if(!isDisabled){const ns=selected.includes(it)?selected.filter(s=>s!==it):[...selected,it];setVal(ns.join(", "));}};
      return<div style={{...fmtStyle,padding:"2px 4px"}}>{items.map(it=><label key={it}style={{display:"flex",alignItems:"center",gap:4,fontSize:fmt.fontSize||12,cursor:"pointer",marginBottom:1}}><input type="checkbox"checked={selected.includes(it)}onChange={()=>toggle(it)}style={{width:13,height:13}}disabled={isDisabled}/>{it}</label>)}</div>;
    }
    if(f.type==="dropdown_vl"){
      const items=getVLItems(vls,f.valueListId);
      return<select value={val}onChange={e=>setVal(e.target.value)}style={base}disabled={isDisabled}><option value="">–</option>{items.map(it=><option key={it}value={it}>{it}</option>)}</select>;
    }
    if(f.type==="listbox"){
      const items=getVLItems(vls,f.valueListId);
      return<select multiple size={4}value={(val||"").split(",").map(s=>s.trim()).filter(Boolean)}onChange={e=>setVal(Array.from(e.target.selectedOptions).map(o=>o.value).join(", "))}style={{...base,height:"auto"}}disabled={isDisabled}>{items.map(it=><option key={it}value={it}>{it}</option>)}</select>;
    }
    return<input type="text"value={val}onChange={e=>setVal(e.target.value)}style={base}readOnly={isDisabled}/>;
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
          <FieldGrid fields={[...schema].sort((a,b)=>a.y-b.y||a.x-b.x)} renderField={renderField}/>
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
        if(s.isPortal){
          const rel=_relations.find(r=>r.id===s.portalConfig?.relationId);
          return<Portal relation={rel}kundeData={data}onKundeDataChange={onChange}config={s.portalConfig}/>;
        }
        if(!s.custom)return null;
        return(
          <div style={{marginBottom:6}}>
            {(s.fields||[]).length>0?(
              <div style={{background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:4,padding:"6px 8px"}}>
                <FieldGrid fields={s.fields||[]} renderField={renderField}/>
              </div>
            ):(
              editMode&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:11,padding:"10px",border:"2px dashed #e2e8f0",borderRadius:4}}>Leer — klicke "✎ Felder" um Felder hinzuzufügen</div>
            )}
          </div>
        );
    }
  };

  // Build a flat list of all field ids in layout order for tab-order
  const allFieldIds=(()=>{
    const ids=[];
    (layout||[]).forEach(s=>{(s.fields||[]).forEach(f=>{ids.push({id:f.field_id||f.id,label:f.label,section:s.label});});});
    return ids;
  })();
  const effectiveTabOrder=tabOrder.length>0?tabOrder:allFieldIds.map(f=>f.id);

  // Group colors for visual grouping
  const groupColors=["#6366f1","#059669","#f59e0b","#ec4899","#0891b2","#dc2626"];
  const groups=[...new Set((layout||[]).map(s=>s.group).filter(Boolean))];
  const groupColorMap=Object.fromEntries(groups.map((g,i)=>[g,groupColors[i%groupColors.length]]));

  return(
    <LabelCtx.Provider value={{editMode,overrides:labelOverrides||{},onChange:onLabelOverrideChange}}>
    <div style={{background:"#f5f5f0",padding:"10px 14px",fontFamily:"Arial,sans-serif",minWidth:860,fontSize:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,background:"#e0e0d8",padding:"3px 8px",border:"1px solid #ccc",flexWrap:"wrap"}}>
        <span style={S.label}>Erstellungszeit</span>
        <input value={TODAY}readOnly style={{...S.cell,width:100}}/>
        <span style={S.label}>{new Date().toTimeString().slice(0,8)}</span>
        {activeLayoutName&&<span style={{fontSize:10,color:"#666",background:"#f0ede8",border:"1px solid #ccc",borderRadius:3,padding:"1px 6px",marginLeft:4}}>{activeLayoutName}</span>}
        <div style={{flex:1}}/>
        {saving&&<span style={{fontSize:11,color:"#059669",fontWeight:700}}>Speichern…</span>}
        {editMode&&<button onClick={()=>setGridEnabled(g=>!g)}style={{background:gridEnabled?"#6366f1":"#f1f5f9",color:gridEnabled?"#fff":"#374151",border:"1px solid #e2e8f0",borderRadius:5,padding:"2px 9px",fontSize:11,cursor:"pointer",fontWeight:gridEnabled?700:400}}>&#9638; Raster</button>}
        {editMode&&<button onClick={()=>setSnapEnabled(g=>!g)}style={{background:snapEnabled?"#6366f1":"#f1f5f9",color:snapEnabled?"#fff":"#374151",border:"1px solid #e2e8f0",borderRadius:5,padding:"2px 9px",fontSize:11,cursor:"pointer",fontWeight:snapEnabled?700:400}}>&#8857; Einrasten</button>}
        {editMode&&<button onClick={()=>setShowAlignDialog(true)}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:5,padding:"2px 9px",fontSize:11,cursor:"pointer"}}>Ausrichten</button>}
        {editMode&&<button onClick={()=>setShowTabOrder(true)}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:5,padding:"2px 9px",fontSize:11,cursor:"pointer"}}>Tab-Reihenfolge</button>}
        {editMode&&onSaveLayoutProfile&&<button onClick={onSaveLayoutProfile}style={{background:"#0891b2",color:"#fff",border:"none",borderRadius:5,padding:"2px 9px",fontSize:11,cursor:"pointer",fontWeight:700}}>Layout speichern</button>}
        <button onClick={()=>setShowPrint(true)}style={{background:"#475569",color:"#fff",border:"none",borderRadius:6,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700}}>🖨 Drucken</button>
        <button onClick={()=>setEditMode(m=>!m)}style={{background:editMode?"#f59e0b":"#475569",color:"#fff",border:"none",borderRadius:6,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700}}>
          {editMode?"✓ Fertig":"✏ Layout"}
        </button>
        <button onClick={onSave}style={{background:"#059669",color:"#fff",border:"none",borderRadius:6,padding:"3px 14px",fontSize:12,cursor:"pointer",fontWeight:700}}>Speichern</button>
      </div>
      {/* Layout-gesteuerte Abschnitte */}
      <div style={{position:"relative",
        backgroundImage:gridEnabled?"radial-gradient(circle,#aaa 1px,transparent 1px)":"none",
        backgroundSize:"8px 8px",backgroundPosition:"0 0"}}>
      {(layout||[]).map((s,idx)=>{
        const isLocked=!!s.locked;
        const grpColor=s.group?groupColorMap[s.group]:null;
        return(
        <div key={s.id} style={{marginBottom:editMode?3:0,outline:editMode?"2px dashed #6366f144":"none",borderRadius:editMode?4:0,
          borderLeft:grpColor?`4px solid ${grpColor}`:"none",paddingLeft:grpColor&&!editMode?4:0,
          position:"relative"}}>
          {grpColor&&editMode&&<div style={{position:"absolute",left:-2,top:0,bottom:0,width:4,background:grpColor,borderRadius:2,opacity:.7}}/>}
          {editMode&&(
            <div style={{display:"flex",alignItems:"center",gap:3,background:isLocked?"#334155":"#1e293b",padding:"2px 8px",borderRadius:"4px 4px 0 0",userSelect:"none",opacity:isLocked?.75:1}}>
              {s.custom&&!isLocked
                ?<input value={s.label}onChange={e=>{const l=[...layout];l[idx]={...l[idx],label:e.target.value};onLayoutChange(l);}}
                   style={{background:"transparent",border:"none",color:"#e2e8f0",fontSize:11,fontWeight:700,flex:1,outline:"none"}}/>
                :<span style={{fontSize:11,color:isLocked?"#94a3b8":"#94a3b8",flex:1}}>{s.label}{isLocked&&" 🔒"}</span>
              }
              {s.group&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:grpColor+"33",color:grpColor,border:`1px solid ${grpColor}66`,flexShrink:0}}>{s.group}</span>}
              {(()=>{const pt=PART_TYPE_MAP[s.partType||"body"]||PART_TYPE_MAP.body;return pt?(
                <span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:3,background:pt.color+"44",color:pt.color,border:`1px solid ${pt.color}88`,flexShrink:0,letterSpacing:".03em"}}>{pt.label}</span>
              ):null;})()}
              {!isLocked&&(s.isPortal
                ?<button onClick={()=>setEditingSection(idx)}style={{background:"#0891b2",border:"none",color:"#fff",borderRadius:3,padding:"1px 8px",fontSize:10,cursor:"pointer",fontWeight:700}}>⚙ Portal</button>
                :<button onClick={()=>setEditingSection(idx)}style={{background:"#6366f1",border:"none",color:"#fff",borderRadius:3,padding:"1px 8px",fontSize:10,cursor:"pointer",fontWeight:700}}>✎ Felder</button>
              )}
              <button onClick={()=>toggleVisible(idx)}title={s.visible?"Ausblenden":"Einblenden"}style={{background:"none",border:"none",color:s.visible?"#4ade80":"#f87171",cursor:"pointer",fontSize:12,padding:"0 4px"}}>{s.visible?"●":"○"}</button>
              <button onClick={()=>{const l=[...layout];l[idx]={...l[idx],locked:!isLocked};onLayoutChange(l);}}title={isLocked?"Entsperren":"Sperren"}style={{background:"none",border:"none",color:isLocked?"#fbbf24":"#64748b",cursor:"pointer",fontSize:12,padding:"0 2px"}}>{isLocked?"🔒":"🔓"}</button>
              {!isLocked&&<button onClick={()=>moveUp(idx)}disabled={idx===0}style={{background:"none",border:"none",color:idx===0?"#334155":"#94a3b8",cursor:idx===0?"default":"pointer",fontSize:13,padding:"0 2px"}}>↑</button>}
              {!isLocked&&<button onClick={()=>moveDown(idx)}disabled={idx===layout.length-1}style={{background:"none",border:"none",color:idx===layout.length-1?"#334155":"#94a3b8",cursor:idx===layout.length-1?"default":"pointer",fontSize:13,padding:"0 2px"}}>↓</button>}
              {!isLocked&&<button onClick={()=>{const g=prompt("Gruppenname (leer = keine Gruppe):",s.group||"");if(g!==null){const l=[...layout];l[idx]={...l[idx],group:g.trim()||null};onLayoutChange(l);}}}title="Gruppe"style={{background:"none",border:"none",color:"#a5b4fc",cursor:"pointer",fontSize:10,padding:"0 2px"}}>⊞</button>}
              {!isLocked&&s.custom&&<button onClick={()=>deleteSection(idx)}style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:13,padding:"0 2px"}}>🗑</button>}
            </div>
          )}
          {(s.visible||editMode)&&(
            <div style={{opacity:s.visible?1:.3,pointerEvents:s.visible?"auto":"none"}}>
              {sectionContent(s,idx)}
              {!s.custom&&(s.fields||[]).length>0&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,background:"#fafafa",border:"1px solid #e2e8f0",borderRadius:4,padding:"6px 8px",marginTop:4}}>
                  {(s.fields||[]).map((f,fi)=>{
                    const tIdx=effectiveTabOrder.indexOf(f.field_id||f.id);
                    return(
                      <div key={f.id||f.field_id}style={{position:"relative"}}>
                        {editMode&&tIdx>=0&&<span style={{position:"absolute",top:0,right:0,fontSize:9,background:"#6366f1",color:"#fff",borderRadius:"0 0 0 4px",padding:"0 4px",zIndex:1}}>{tIdx+1}</span>}
                        {f.type!=="check"&&<div style={{...S.label,marginBottom:2}}>{f.label}</div>}
                        {renderField(f)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        );
      })}
      </div>

      {editMode&&(
        <button onClick={addCustomSection}style={{width:"100%",background:"#f8fafc",border:"2px dashed #6366f1",borderRadius:8,padding:"8px",fontSize:12,cursor:"pointer",color:"#6366f1",fontWeight:700,marginTop:6}}>
          + Neuen Abschnitt hinzufügen
        </button>
      )}
      {editingSection!==null&&(
        layout[editingSection]?.isPortal
          ?<PortalEditor section={layout[editingSection]}onSave={(updated)=>saveSection(editingSection,updated)}onClose={()=>setEditingSection(null)}/>
          :<CustomSectionEditor section={layout[editingSection]}onSave={(updated)=>saveSection(editingSection,updated)}onClose={()=>setEditingSection(null)}valueLists={valueLists}/>
      )}

      {/* Ausrichten Dialog */}
      {showAlignDialog&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1400}}>
          <div style={{background:"#fff",borderRadius:13,width:420,boxShadow:"0 16px 48px rgba(0,0,0,.3)"}}>
            <div style={{display:"flex",alignItems:"center",padding:"13px 18px",borderBottom:"1px solid #f1f5f9"}}>
              <span style={{fontWeight:700,fontSize:14,flex:1}}>Objekte ausrichten</span>
              <button onClick={()=>setShowAlignDialog(false)}style={{background:"#f1f5f9",border:"none",borderRadius:7,width:27,height:27,cursor:"pointer",fontSize:15,color:"#555"}}>×</button>
            </div>
            <div style={{padding:18}}>
              <div style={{fontSize:11,color:"#64748b",background:"#fef9c3",border:"1px solid #fbbf24",borderRadius:7,padding:"7px 11px",marginBottom:14}}>
                Mehrere Felder markieren zum Ausrichten
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:7,textTransform:"uppercase",letterSpacing:".04em"}}>Horizontal</div>
                <div style={{display:"flex",gap:7}}>
                  {[["⬛◻◻","Linksbündig"],["◻⬛◻","Zentriert"],["◻◻⬛","Rechtsbündig"],["◻|◻|◻","Gleiche Abstände"]].map(([ic,lb])=>(
                    <button key={lb}style={{flex:1,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,padding:"8px 4px",fontSize:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:"#374151"}}>
                      <span style={{fontSize:14}}>{ic}</span>{lb}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:7,textTransform:"uppercase",letterSpacing:".04em"}}>Vertikal</div>
                <div style={{display:"flex",gap:7}}>
                  {[["⬛▪▪","Oben"],["▪⬛▪","Mitte"],["▪▪⬛","Unten"],["▪—▪—▪","Gleiche Abstände"]].map(([ic,lb])=>(
                    <button key={lb}style={{flex:1,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,padding:"8px 4px",fontSize:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:"#374151"}}>
                      <span style={{fontSize:14}}>{ic}</span>{lb}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <button onClick={()=>setShowAlignDialog(false)}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer"}}>Schließen</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab-Reihenfolge Dialog */}
      {showTabOrder&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1400}}>
          <div style={{background:"#fff",borderRadius:13,width:480,maxHeight:"82vh",overflow:"auto",boxShadow:"0 16px 48px rgba(0,0,0,.3)"}}>
            <div style={{display:"flex",alignItems:"center",padding:"13px 18px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:2}}>
              <span style={{fontWeight:700,fontSize:14,flex:1}}>Tab-Reihenfolge festlegen</span>
              <button onClick={()=>setShowTabOrder(false)}style={{background:"#f1f5f9",border:"none",borderRadius:7,width:27,height:27,cursor:"pointer",fontSize:15,color:"#555"}}>×</button>
            </div>
            <div style={{padding:18}}>
              {allFieldIds.length===0&&<div style={{textAlign:"center",color:"#94a3b8",fontSize:12,padding:"24px 0"}}>Keine Felder in den Abschnitten gefunden.</div>}
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {effectiveTabOrder.map((fid,i)=>{
                  const fi=allFieldIds.find(f=>f.id===fid);
                  if(!fi)return null;
                  const isIncluded=!tabOrder.includes(fid+"__excl");
                  return(
                    <div key={fid}style={{display:"flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 10px"}}>
                      <span style={{width:22,height:22,background:"#6366f1",color:"#fff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:"#0f172a"}}>{fi.label}</div>
                        <div style={{fontSize:10,color:"#94a3b8"}}>{fi.section}</div>
                      </div>
                      <label style={{display:"flex",alignItems:"center",gap:4,fontSize:11,cursor:"pointer",color:"#374151"}}>
                        <input type="checkbox"checked={isIncluded}onChange={e=>{
                          const excl=fid+"__excl";
                          setTabOrder(prev=>e.target.checked?prev.filter(x=>x!==excl):[...prev.filter(x=>x!==excl),excl]);
                        }}style={{width:13,height:13}}/>inkl.
                      </label>
                      <button disabled={i===0}onClick={()=>{const o=[...effectiveTabOrder];[o[i-1],o[i]]=[o[i],o[i-1]];setTabOrder(o);}}style={{background:"none",border:"none",cursor:i===0?"default":"pointer",color:i===0?"#cbd5e1":"#6366f1",fontSize:14,padding:"0 2px"}}>↑</button>
                      <button disabled={i===effectiveTabOrder.length-1}onClick={()=>{const o=[...effectiveTabOrder];[o[i+1],o[i]]=[o[i],o[i+1]];setTabOrder(o);}}style={{background:"none",border:"none",cursor:i===effectiveTabOrder.length-1?"default":"pointer",color:i===effectiveTabOrder.length-1?"#cbd5e1":"#6366f1",fontSize:14,padding:"0 2px"}}>↓</button>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
                <button onClick={()=>setTabOrder([])}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 14px",fontSize:12,cursor:"pointer"}}>Standard wiederherstellen</button>
                <button onClick={()=>setShowTabOrder(false)}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer",fontWeight:700}}>✓ Übernehmen</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrint&&(
        <>
          <style>{`@media print{body>*{display:none!important;}.print-preview-content{display:block!important;position:static!important;width:100%!important;max-width:none!important;}}`}</style>
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:9999,overflow:"auto",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0"}}>
            <div style={{display:"flex",gap:8,marginBottom:12,flexShrink:0}}>
              <button onClick={()=>window.print()}style={{background:"#059669",color:"#fff",border:"none",borderRadius:7,padding:"7px 18px",fontSize:13,cursor:"pointer",fontWeight:700}}>🖨 Drucken</button>
              <button onClick={()=>setShowPrint(false)}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #ccc",borderRadius:7,padding:"7px 16px",fontSize:13,cursor:"pointer"}}>Schließen</button>
            </div>
            <div className="print-preview-content"style={{width:794,background:"#fff",boxShadow:"0 8px 40px rgba(0,0,0,.5)",padding:"28px 32px",fontFamily:"Arial,sans-serif",fontSize:11,color:"#111"}}>
              {(()=>{
                const partOrder=["title_header","header","subsummary_above","body","subsummary_below","summary","footer","title_footer"];
                const partOrderMap=Object.fromEntries(partOrder.map((t,i)=>[t,i]));
                const sorted=[...layout].sort((a,b)=>(partOrderMap[a.partType||"body"]??99)-(partOrderMap[b.partType||"body"]??99));
                return sorted.filter(s=>s.visible).map((s,i)=>{
                  const pt=PART_TYPE_MAP[s.partType||"body"]||PART_TYPE_MAP.body;
                  const isRepeat=["header","footer","title_header","title_footer"].includes(s.partType);
                  const isSub=["subsummary_above","subsummary_below"].includes(s.partType);
                  const isSummary=s.partType==="summary";
                  return(
                    <div key={s.id}style={{marginBottom:10,pageBreakInside:"avoid"}}>
                      {i>0&&pt&&<div style={{borderTop:"1px dashed #ccc",marginBottom:6,paddingTop:4,fontSize:9,color:"#aaa",letterSpacing:".04em",textTransform:"uppercase"}}>{pt.label}</div>}
                      {isRepeat&&<div style={{fontSize:9,color:"#999",fontStyle:"italic",marginBottom:4,textAlign:"center"}}>— wiederholt auf jeder Seite —</div>}
                      {isSub&&<div style={{fontSize:9,color:"#999",fontStyle:"italic",textAlign:"center",padding:"4px",background:"#f0f4ff",borderRadius:3,marginBottom:4}}>— gruppiert nach Feld —</div>}
                      {isSummary?(
                        <div style={{background:"#f0fff0",border:"1px solid #99cc99",padding:"6px 10px",borderRadius:3}}>
                          <div style={{fontWeight:700,fontSize:11,marginBottom:3}}>Zusammenfassung</div>
                          <div style={{display:"flex",gap:16,fontSize:11}}>
                            <span>Endsumme netto: <strong>{fmt2((sumPreis/rabattFak)+transPreis+duengerP+zusatzSumme)} €</strong></span>
                            <span>Gesamt (inkl. 19%): <strong>{fmt2(endsumme)} €</strong></span>
                          </div>
                        </div>
                      ):(
                        <div style={{fontSize:11}}>
                          <strong style={{fontSize:10,color:"#555"}}>{s.label}</strong>
                          <div style={{marginTop:2,paddingLeft:4,color:"#333"}}>
                            {s.id==="adresse"&&<span>{data.firma||data.vorname} · {data.strasse} · {data.plz} {data.ort}</span>}
                            {s.id==="kopf"&&<span>Jahr: {data.jahr} | Code: {data.code} | {data.auslieferung_abholung?"Lieferdatum: "+data.auslieferung_abholung:""}</span>}
                            {s.id==="bemerkungen_aktuell"&&<span>{data.bemerkungen_aktuell}</span>}
                            {s.id==="positionen"&&<span>{pos.filter(p=>p.art).map(p=>`${p.label}: ${p.art} (${p.cm}cm, ${p.anzahl}x, ${fmt2(p.preis)}€)`).join(" | ")}</span>}
                            {s.id==="transport"&&<span>{data.trans_txt} {data.trans_preis?fmt2(data.trans_preis)+" €":""}</span>}
                            {s.id==="duenger"&&<span>{data.duenger_txt} {data.duenger_preis?fmt2(data.duenger_preis)+" €":""}</span>}
                            {s.id==="rabatt"&&<span>{data.rabatt_txt} {data.gutschein?"| Gutschein: "+data.gutschein:""}</span>}
                            {s.id==="sonstiges"&&<span>{data.camelia} {data.vapiano_pflanzen}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}
    </div>
    </LabelCtx.Provider>
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

function ValueListManager({valueLists,onChange,onClose}){
  const[lists,setLists]=useState(valueLists||[]);
  const[editId,setEditId]=useState(null);
  const[draftName,setDraftName]=useState("");
  const[draftItems,setDraftItems]=useState("");

  const openEdit=(vl)=>{setEditId(vl.id);setDraftName(vl.name);setDraftItems(vl.items.join("\n"));};
  const openNew=()=>{const id="vl_"+uid();setLists(prev=>[...prev,{id,name:"Neue Liste",items:[]}]);setEditId(id);setDraftName("Neue Liste");setDraftItems("");};
  const saveEdit=()=>{
    const items=draftItems.split("\n").map(s=>s.trim()).filter(Boolean);
    const updated=lists.map(vl=>vl.id===editId?{...vl,name:draftName,items}:vl);
    setLists(updated);onChange(updated);setEditId(null);
  };
  const deleteList=(id)=>{const updated=lists.filter(vl=>vl.id!==id);setLists(updated);onChange(updated);if(editId===id)setEditId(null);};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1300}}>
      <div style={{background:"#fff",borderRadius:14,width:620,maxHeight:"88vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
        <div style={{display:"flex",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:2,gap:8}}>
          <span style={{fontWeight:700,fontSize:15,color:"#0f172a",flex:1}}>Wertelisten verwalten</span>
          <button onClick={onClose}style={{background:"#f1f5f9",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:16,color:"#555"}}>×</button>
        </div>
        <div style={{padding:20,display:"flex",gap:14}}>
          {/* List of value lists */}
          <div style={{width:200,flexShrink:0}}>
            <div style={{fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>Listen ({lists.length})</div>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
              {lists.map(vl=>(
                <div key={vl.id}style={{display:"flex",alignItems:"center",gap:4,background:editId===vl.id?"#ede9fe":"#f8fafc",border:`1px solid ${editId===vl.id?"#a5b4fc":"#e2e8f0"}`,borderRadius:7,padding:"5px 9px",cursor:"pointer"}}
                  onClick={()=>openEdit(vl)}>
                  <div style={{flex:1,overflow:"hidden"}}>
                    <div style={{fontSize:12,fontWeight:600,color:editId===vl.id?"#4f46e5":"#374151",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vl.name}</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>{vl.items.length} Einträge</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteList(vl.id)}}style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:13,padding:"0 2px",flexShrink:0}}>×</button>
                </div>
              ))}
              {lists.length===0&&<div style={{fontSize:11,color:"#94a3b8",textAlign:"center",padding:"12px 0"}}>Keine Listen</div>}
            </div>
            <button onClick={openNew}style={{width:"100%",background:"#f5f3ff",border:"1px dashed #a5b4fc",borderRadius:7,padding:"6px",fontSize:12,cursor:"pointer",color:"#6d28d9",fontWeight:600}}>+ Neue Liste</button>
          </div>
          {/* Editor */}
          <div style={{flex:1}}>
            {editId?(()=>{
              return(
                <div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:3}}>Listenname</label>
                    <input value={draftName}onChange={e=>setDraftName(e.target.value)}style={{...S.cell,fontWeight:600,fontSize:13}}/>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:11,fontWeight:700,color:"#555",display:"block",marginBottom:3}}>Einträge (ein Eintrag pro Zeile)</label>
                    <textarea value={draftItems}onChange={e=>setDraftItems(e.target.value)}rows={10}
                      placeholder={"Ja\nNein\nVielleicht"}
                      style={{...S.cell,resize:"vertical",fontFamily:"inherit",lineHeight:1.7}}/>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>
                      {draftItems.split("\n").filter(s=>s.trim()).length} Einträge
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button onClick={()=>setEditId(null)}style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,padding:"7px 14px",fontSize:13,cursor:"pointer"}}>Abbrechen</button>
                    <button onClick={saveEdit}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:13,cursor:"pointer",fontWeight:700}}>✓ Speichern</button>
                  </div>
                </div>
              );
            })():(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",minHeight:200,color:"#94a3b8",fontSize:12,flexDirection:"column",gap:8}}>
                <div style={{fontSize:28}}>📋</div>
                <div>Liste auswählen oder neue erstellen</div>
              </div>
            )}
          </div>
        </div>
      </div>
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

function CanvasPage({page,kundeData,onUpdate,onKundeChange}){
  const[editMode,setEditMode]=useState(false);
  const[fields,setFields]=useState(page.fields||[]);
  const[showPalette,setShowPalette]=useState(false);
  const[dragId,setDragId]=useState(null);
  const[dragPos,setDragPos]=useState(null);
  const fieldsRef=useRef(fields);
  useEffect(()=>{const fs=page.fields||[];fieldsRef.current=fs;setFields(fs);},[page.id]);

  const commit=(fs)=>{fieldsRef.current=fs;setFields([...fs]);onUpdate({...page,fields:fs});};
  const startDrag=(e,id)=>{
    if(!editMode)return;
    e.preventDefault();
    const f=fieldsRef.current.find(f=>f.id===id);
    if(!f)return;
    const origX=f.x,origY=f.y,sx=e.clientX,sy=e.clientY;
    setDragId(id);setDragPos({x:origX,y:origY});
    const onMove=(ev)=>{
      setDragPos({x:snap(Math.max(0,origX+(ev.clientX-sx))),y:snap(Math.max(0,origY+(ev.clientY-sy)))});
    };
    const onUp=(ev)=>{
      const x=snap(Math.max(0,origX+(ev.clientX-sx))),y=snap(Math.max(0,origY+(ev.clientY-sy)));
      commit(fieldsRef.current.map(f=>f.id===id?{...f,x,y}:f));
      setDragId(null);setDragPos(null);
      document.removeEventListener("mousemove",onMove);
      document.removeEventListener("mouseup",onUp);
    };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };
  const startResize=(e,id)=>{
    if(!editMode)return;
    e.preventDefault();e.stopPropagation();
    const f=fieldsRef.current.find(f=>f.id===id);
    if(!f)return;
    const origW=f.w,sx=e.clientX;
    const onMove=(ev)=>{
      const w=snap(Math.max(80,origW+(ev.clientX-sx)));
      setFields(fieldsRef.current.map(f=>f.id===id?{...f,w}:f));
    };
    const onUp=(ev)=>{
      const w=snap(Math.max(80,origW+(ev.clientX-sx)));
      commit(fieldsRef.current.map(f=>f.id===id?{...f,w}:f));
      document.removeEventListener("mousemove",onMove);
      document.removeEventListener("mouseup",onUp);
    };
    document.addEventListener("mousemove",onMove);
    document.addEventListener("mouseup",onUp);
  };
  const getFieldPos=(f)=>dragId===f.id&&dragPos?dragPos:{x:f.x,y:f.y};
  const getVal=(f)=>{
    if(f.type==="bound"&&f.fieldKey)return kundeData?.[f.fieldKey]??"";
    if(f.type==="formula")return evalFormula(f.formula||"0",kundeData?.positionen||[],kundeData?.felder||{});
    return kundeData?.felder?.[f.id]??"";
  };
  const setVal=(f,v)=>{
    if(!onKundeChange)return;
    if(f.type==="bound"&&f.fieldKey)onKundeChange({...kundeData,[f.fieldKey]:v});
    else onKundeChange({...kundeData,felder:{...(kundeData?.felder||{}),[f.id]:v}});
  };
  const addField=(kf)=>{
    const id=uid();
    const existing=fieldsRef.current;
    const yOff=existing.length>0?Math.max(...existing.map(f=>f.y+(f.h||50)))+10:20;
    const nf={id,type:kf.type,label:kf.label,fieldKey:kf.key||null,x:20,y:Math.min(yOff,600),w:200,h:50,formula:kf.formula||"",options:kf.options||""};
    commit([...existing,nf]);
    setShowPalette(false);
  };
  const renderFieldInput=(f)=>{
    const val=getVal(f);
    const base={...S.cell,width:"100%",boxSizing:"border-box"};
    if(f.type==="formula")return<div style={{...base,background:"#ede9fe",color:"#5b21b6",fontWeight:700,fontFamily:"monospace",padding:"3px 6px",minHeight:22}}>{val}</div>;
    if(f.type==="check")return<label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer",padding:"2px 0"}}><input type="checkbox"checked={!!val}onChange={e=>setVal(f,e.target.checked)}style={{width:14,height:14}}/><span>{f.label}</span></label>;
    if(f.type==="select")return<select value={val}onChange={e=>setVal(f,e.target.value)}style={base}><option value="">–</option>{(f.options||"").split(",").map(o=><option key={o.trim()}value={o.trim()}>{o.trim()}</option>)}</select>;
    if(f.type==="date"||f.fieldKey==="auslieferung_abholung"||f.fieldKey==="ausgeliefert_am")return<input type="date"value={val}onChange={e=>setVal(f,e.target.value)}style={base}/>;
    if(f.type==="number")return<input type="number"value={val}onChange={e=>setVal(f,e.target.value)}style={{...base,textAlign:"right"}}/>;
    const isMemo=f.type==="bound"&&f.fieldKey?.startsWith("bemerkungen");
    if(isMemo)return<textarea value={val}onChange={e=>setVal(f,e.target.value)}rows={3}style={{...base,resize:"vertical"}}/>;
    return<input type="text"value={val}onChange={e=>setVal(f,e.target.value)}style={base}/>;
  };
  const canvasH=Math.max(500,fields.length>0?Math.max(...fields.map(f=>f.y+(f.h||50)+50)):300);
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"3px 10px",background:"#e0e0d8",borderBottom:"1px solid #ccc",flexShrink:0}}>
        <span style={{fontWeight:700,fontSize:13,color:"#333"}}>{page.name}</span>
        <div style={{flex:1}}/>
        {editMode&&<button onClick={()=>setShowPalette(true)}style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:5,padding:"2px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>+ Feld hinzufügen</button>}
        {editMode&&<span style={{fontSize:10,color:"#94a3b8"}}>Blau = ziehen · ◀▶ = Breite</span>}
        <button onClick={()=>setEditMode(m=>!m)}style={{background:editMode?"#f59e0b":"#475569",color:"#fff",border:"none",borderRadius:6,padding:"3px 12px",fontSize:11,cursor:"pointer",fontWeight:700}}>
          {editMode?"✓ Fertig":"✏ Bearbeiten"}
        </button>
      </div>
      <div style={{flex:1,overflow:"auto",padding:16,background:"#e0ddd8"}}>
        <div style={{position:"relative",width:860,minHeight:canvasH,background:"#fff",border:"1px solid #bbb",
          backgroundImage:editMode?"radial-gradient(circle,#bbb 1px,transparent 1px)":"none",backgroundSize:"10px 10px"}}>
          {fields.map(f=>{
            const{x,y}=getFieldPos(f);
            return(
              <div key={f.id}style={{position:"absolute",left:x,top:y,width:f.w,userSelect:"none",
                zIndex:dragId===f.id?100:1,boxShadow:dragId===f.id?"0 8px 24px rgba(0,0,0,.25)":"none"}}>
                {editMode&&(
                  <div onMouseDown={e=>startDrag(e,f.id)}
                    style={{background:"#6366f1",color:"#fff",fontSize:9,padding:"2px 5px",cursor:"grab",
                      display:"flex",justifyContent:"space-between",alignItems:"center",
                      borderRadius:"3px 3px 0 0",userSelect:"none"}}>
                    <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,fontWeight:700}}>{f.label}</span>
                    <button onMouseDown={e=>e.stopPropagation()}onClick={()=>commit(fieldsRef.current.filter(ff=>ff.id!==f.id))}
                      style={{background:"none",border:"none",color:"#fca5a5",cursor:"pointer",fontSize:12,lineHeight:1,padding:"0 2px",flexShrink:0}}>×</button>
                  </div>
                )}
                {!editMode&&f.type!=="check"&&<div style={{...S.label,marginBottom:1}}>{f.label}</div>}
                <div style={{position:"relative"}}>
                  {renderFieldInput(f)}
                  {editMode&&<div onMouseDown={e=>startResize(e,f.id)}
                    style={{position:"absolute",right:0,top:0,bottom:0,width:6,cursor:"ew-resize",background:"rgba(99,102,241,.3)",borderRadius:"0 2px 2px 0"}}/>}
                </div>
              </div>
            );
          })}
          {fields.length===0&&editMode&&(
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:13,pointerEvents:"none",flexDirection:"column",gap:8}}>
              <div style={{fontSize:32}}>🖼</div>
              <div>Klicke "+ Feld hinzufügen" um Felder auf der Seite zu platzieren</div>
            </div>
          )}
        </div>
      </div>
      {showPalette&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200}}>
          <div style={{background:"#fff",borderRadius:14,width:580,maxHeight:"82vh",overflow:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.3)"}}>
            <div style={{display:"flex",alignItems:"center",padding:"14px 20px",borderBottom:"1px solid #f1f5f9",position:"sticky",top:0,background:"#fff",zIndex:2}}>
              <span style={{fontWeight:700,fontSize:15,flex:1}}>Feld auf Seite legen</span>
              <button onClick={()=>setShowPalette(false)}style={{background:"#f1f5f9",border:"none",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:16,color:"#555"}}>×</button>
            </div>
            <div style={{padding:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Bestehende Felder (Kundendaten)</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:20}}>
                {KNOWN_FIELDS.map(kf=>(
                  <button key={kf.key}onClick={()=>addField({...kf,type:"bound"})}
                    style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"#0369a1",fontWeight:500}}>
                    {kf.label}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:8,textTransform:"uppercase",letterSpacing:".05em"}}>Neue eigene Felder</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {FIELD_TYPES.map(ft=>(
                  <button key={ft.type}onClick={()=>addField({label:ft.label,type:ft.type,key:null})}
                    style={{background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"#6d28d9",display:"flex",alignItems:"center",gap:4,fontWeight:500}}>
                    <span style={{fontWeight:700}}>{ft.icon}</span>{ft.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App(){
  const sbRef=useRef(null);
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
  const[customPages,setCustomPages]=useState([]);
  const[page,setPage]=useState("stammblatt");
  const[err,setErr]=useState(null);
  const[labelOverrides,setLabelOverrides]=useState({});
  const[valueLists,setValueLists]=useState([..._valueLists]);
  const[layouts,setLayouts]=useState([..._layouts]);
  const[activeLayoutId,setActiveLayoutId]=useState("layout_main");
  const[editingLayoutName,setEditingLayoutName]=useState(null);
  const[importing,setImporting]=useState(false);

  const loadKunde=useCallback(async(id,c)=>{
    setLoading(true);
    try{
      if(DEMO_MODE){
        const pos=_positionen[id]||[];
        const filled=LABELS.map(l=>pos.find(pp=>pp.label===l)||{label:l,art:"",cm:"",preis:"",anzahl:""});
        const base=_kunden.find(k=>k.id===id)||{};
        setActiveData({...base,positionen:filled,felder:{}});
        setActiveId(id);
        return;
      }
      const client=c||sbRef.current;
      const[kRes,p,f]=await Promise.all([
        client.from(T.kunden).select("*").eq("id",id).single(),
        client.from(T.positionen).select("*").eq("kunde_id",id).order("sort_order"),
        client.from(T.kunden_felder).select("*").eq("kunde_id",id),
      ]);
      if(kRes.error)throw kRes.error;
      if(p.error)throw p.error;
      const felder={};
      (f.data||[]).forEach(r=>{felder[r.feld_id]=r.wert});
      const pos=p.data||[];
      const filled=LABELS.map(l=>pos.find(pp=>pp.label===l)||{label:l,art:"",cm:"",preis:"",anzahl:""});
      setActiveData({...kRes.data,positionen:filled,felder});
      setActiveId(id);
    }catch(e){setErr(e.message)}
    finally{setLoading(false)}
  },[]);

  const loadAppData=useCallback(async()=>{
    setConnected(true);setLoading(true);
    try{
      if(DEMO_MODE){
        makeSb();
        setKunden(_kunden);
        setSchema(_schema);
        setFormulaMap({..._posFormulaMap});
        setLayout([..._layoutConfig]);
        setTouren(_touren);
        setCustomPages([..._customPages]);
        if(_kunden.length){setActiveId(_kunden[0].id);await loadKunde(_kunden[0].id);}
        return;
      }
      const c=sbRef.current;
      const[k,s,t]=await Promise.all([
        c.from(T.kunden).select("*").order("created_at"),
        c.from(T.formular_felder).select("*").order("sort_order"),
        c.from(T.touren).select("*, tour_kunden(kunde_id)").order("datum"),
      ]);
      if(k.error)throw k.error;
      setKunden(k.data||[]);
      setSchema(s.data||[]);
      setTouren((t.data||[]).map(tt=>({...tt,kundenIds:(tt.tour_kunden||[]).map(r=>r.kunde_id)})));
      if(k.data?.length){setActiveId(k.data[0].id);await loadKunde(k.data[0].id,c)}
    }catch(e){
      const msg=e?.message||String(e);
      setErr(msg.includes("stammblatt")||msg.includes("relation")||msg.includes("schema cache")
        ? "Datenbank-Tabellen fehlen. Bitte botanikum_supabase_setup.sql in Supabase ausführen."
        : msg);
      setConnected(false);
    }
    finally{setLoading(false)}
  },[loadKunde]);

  const handleLogin=useCallback(async(email,password)=>{
    const{error}=await sbRef.current.auth.signInWithPassword({email,password});
    if(error)throw error;
    await loadAppData();
  },[loadAppData]);

  const handleLogout=async()=>{
    if(!DEMO_MODE&&sbRef.current)await sbRef.current.auth.signOut();
    location.reload();
  };

  useEffect(()=>{
    if(IS_PRODUCTION){
      sbRef.current=createSupabaseClient();
      sbRef.current.auth.getSession().then(({data:{session}})=>{if(session)loadAppData()});
    }else if(DEMO_MODE){
      loadAppData();
    }
  },[loadAppData]);

  const saveKunde=async()=>{
    if(!activeData)return;
    setSaving(true);setErr(null);
    try{
      const{positionen,felder,...rest}=activeData;
      if(DEMO_MODE){
        if(!rest.id)rest.id=uid();
        const idx=_kunden.findIndex(k=>k.id===rest.id);
        if(idx>=0)_kunden[idx]={..._kunden[idx],...rest};else _kunden.push(rest);
        _positionen[rest.id]=positionen.filter(p=>p.art||p.cm||p.preis);
        setKunden([..._kunden]);
        setActiveId(rest.id);
        return;
      }
      const c=sbRef.current;
      const id=rest.id;
      if(id){
        const{error}=await c.from(T.kunden).update(rest).eq("id",id);
        if(error)throw error;
      }else{
        const{data,error}=await c.from(T.kunden).insert(rest).select().single();
        if(error)throw error;
        rest.id=data.id;
        setKunden(prev=>[...prev,data]);
        setActiveId(data.id);
      }
      await Promise.all([
        (async()=>{
          await c.from(T.positionen).delete().eq("kunde_id",rest.id);
          const rows=positionen.filter(p=>p.art||p.cm||p.preis).map((p,i)=>({kunde_id:rest.id,label:p.label,sort_order:i,art:p.art||null,anzahl:p.anzahl||null,cm:p.cm?parseFloat(p.cm):null,preis:p.preis?parseFloat(p.preis):null}));
          if(rows.length){const{error}=await c.from(T.positionen).insert(rows);if(error)throw error}
        })(),
        (async()=>{
          const rows=Object.entries(felder||{}).filter(([,v])=>v!==undefined&&v!=="").map(([feld_id,wert])=>({kunde_id:rest.id,feld_id,wert:String(wert)}));
          if(rows.length){const{error}=await c.from(T.kunden_felder).upsert(rows,{onConflict:"kunde_id,feld_id"});if(error)throw error}
        })(),
      ]);
      setKunden(prev=>prev.map(k=>k.id===rest.id?{...k,...rest}:k));
    }catch(e){setErr("Fehler: "+e.message)}
    finally{setSaving(false)}
  };

  const newKunde=async()=>{
    const neu={jahr:String(YEAR),firma:"",vorname:"Neuer Kunde",plz:"",ort:"",strasse:"",telefon:"",email:"",code:"",rabatt_xf:1};
    if(DEMO_MODE){
      neu.id=uid();
      _kunden.push(neu);
      _positionen[neu.id]=[];
      const positionen=LABELS.map(l=>({label:l,art:"",cm:"",preis:"",anzahl:""}));
      setKunden([..._kunden]);
      setActiveData({...neu,positionen,felder:{}});
      setActiveId(neu.id);
      return;
    }
    const{data,error}=await sbRef.current.from(T.kunden).insert(neu).select().single();
    if(error){setErr(error.message);return}
    const positionen=LABELS.map(l=>({label:l,art:"",cm:"",preis:"",anzahl:""}));
    setKunden(prev=>[...prev,data]);
    setActiveData({...data,positionen,felder:{}});
    setActiveId(data.id);
  };

  const deleteKunde=async(id)=>{
    if(!confirm("Datensatz wirklich löschen?"))return;
    if(DEMO_MODE){
      _kunden=_kunden.filter(k=>k.id!==id);
      delete _positionen[id];
      setKunden([..._kunden]);
      if(activeId===id){setActiveData(null);setActiveId(null)}
      return;
    }
    const{error}=await sbRef.current.from(T.kunden).delete().eq("id",id);
    if(error){setErr(error.message);return}
    setKunden(prev=>prev.filter(k=>k.id!==id));
    if(activeId===id){setActiveData(null);setActiveId(null)}
  };

  const saveSchemaToDb=async(fields)=>{
    if(DEMO_MODE){_schema=fields;setSchema(fields);return}
    const c=sbRef.current;
    await c.from(T.formular_felder).delete().neq("sort_order",-1);
    if(fields.length){const{error}=await c.from(T.formular_felder).insert(fields.map((f,i)=>({...f,sort_order:i})));if(error)throw error}
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

  const handleLabelOverrideChange=(overrides)=>{
    _labelConfig=overrides;
    setLabelOverrides({...overrides});
  };

  const switchLayout=(lid)=>{
    const lp=layouts.find(l=>l.id===lid);
    if(!lp)return;
    setActiveLayoutId(lid);
    handleLayoutChange([...lp.config]);
    handleLabelOverrideChange({...(lp.labelOverrides||{})});
  };

  const saveCurrentLayoutProfile=()=>{
    const updated=layouts.map(lp=>lp.id===activeLayoutId?{...lp,config:[...layout],labelOverrides:{...labelOverrides}}:lp);
    _layouts=updated;
    setLayouts(updated);
  };

  const duplicateLayout=(lid)=>{
    const src=layouts.find(l=>l.id===lid);
    if(!src)return;
    const newId="layout_"+uid();
    const copy={...src,id:newId,name:src.name+" (Kopie)",config:[...src.config],labelOverrides:{...(src.labelOverrides||{})}};
    const updated=[...layouts,copy];
    _layouts=updated;
    setLayouts(updated);
  };

  const deleteLayout=(lid)=>{
    if(layouts.length<=1){alert("Das letzte Layout kann nicht gelöscht werden.");return;}
    if(!confirm("Layout wirklich löschen?"))return;
    const updated=layouts.filter(l=>l.id!==lid);
    _layouts=updated;
    setLayouts(updated);
    if(activeLayoutId===lid)switchLayout(updated[0].id);
  };

  const renameLayout=(lid,name)=>{
    const updated=layouts.map(l=>l.id===lid?{...l,name}:l);
    _layouts=updated;
    setLayouts(updated);
  };

  const addNewLayout=()=>{
    const src=layouts.find(l=>l.id===activeLayoutId)||layouts[0];
    const newId="layout_"+uid();
    const copy={...src,id:newId,name:"Neues Layout",config:[...src.config],labelOverrides:{...(src.labelOverrides||{})}};
    const updated=[...layouts,copy];
    _layouts=updated;
    setLayouts(updated);
    setEditingLayoutName(newId);
    switchLayout(newId);
  };

  const addCustomPage=()=>{
    const id="cp_"+uid();
    const np={id,name:"Neue Seite",fields:[]};
    _customPages=[..._customPages,np];
    setCustomPages([..._customPages]);
    setPage(id);
  };

  const updateCustomPage=(updated)=>{
    _customPages=_customPages.map(p=>p.id===updated.id?updated:p);
    setCustomPages([..._customPages]);
  };

  const deleteCustomPage=(id)=>{
    _customPages=_customPages.filter(p=>p.id!==id);
    setCustomPages([..._customPages]);
    if(page===id)setPage("stammblatt");
  };

  const renameCustomPage=(id,name)=>{
    _customPages=_customPages.map(p=>p.id===id?{...p,name}:p);
    setCustomPages([..._customPages]);
  };

  const handleValueListChange=(lists)=>{
    _valueLists=[...lists];
    setValueLists([...lists]);
  };

  const importFromGaertnerei=async()=>{
    if(DEMO_MODE){alert("Import nur mit Supabase-Verbindung verfügbar.");return}
    if(!confirm("Kunden aus der Gärtnerei-App importieren?\n\nBereits vorhandene Kunden (gleiche Kundennummer) werden übersprungen."))return;
    setImporting(true);setErr(null);
    try{
      const c=sbRef.current;
      const{data:gaertnerei,error:e1}=await c.from(T.gaertnerei_kunden).select("*");
      if(e1)throw e1;
      const{data:existing,error:e2}=await c.from(T.kunden).select("code");
      if(e2)throw e2;
      const existingCodes=new Set((existing||[]).map(k=>k.code).filter(Boolean));
      let imported=0,skipped=0;
      for(const g of gaertnerei||[]){
        const code=String(g.kundennummer||"");
        if(!code){skipped++;continue}
        if(existingCodes.has(code)){skipped++;continue}
        const{data:inserted,error:e3}=await c.from(T.kunden).insert(mapGaertnereiKunde(g)).select().single();
        if(e3)throw e3;
        const pos=positionenFromGaertnerei(g);
        if(pos.length){
          const{error:e4}=await c.from(T.positionen).insert(pos.map(p=>({...p,kunde_id:inserted.id})));
          if(e4)throw e4;
        }
        existingCodes.add(code);
        imported++;
      }
      await loadAppData();
      alert(`Import fertig: ${imported} neu importiert, ${skipped} übersprungen.`);
    }catch(e){setErr("Import fehlgeschlagen: "+(e?.message||String(e)))}
    finally{setImporting(false)}
  };

  const saveTour=async(tour)=>{
    if(DEMO_MODE){
      const saved={...tour,id:tour.id||uid()};
      const idx=_touren.findIndex(t=>t.id===saved.id);
      if(idx>=0)_touren[idx]=saved;else _touren.push(saved);
      return saved;
    }
    const c=sbRef.current;
    const{kundenIds,tour_kunden,...t}=tour;
    const{data,error}=await c.from(T.touren).upsert(t,{onConflict:"id"}).select().single();
    if(error)throw error;
    await c.from(T.tour_kunden).delete().eq("tour_id",data.id);
    if(kundenIds?.length){const rows=kundenIds.map((kid,i)=>({tour_id:data.id,kunde_id:kid,sort_order:i}));await c.from(T.tour_kunden).insert(rows)}
    return data;
  };

  if(!connected)return IS_PRODUCTION?<LoginScreen onLogin={handleLogin}externalError={err}/>:null;

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"Arial,sans-serif",background:"#2a2a2a",overflow:"hidden"}}>
      <div style={{width:200,background:"#1a1a2e",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"12px 12px 8px",borderBottom:"1px solid #333"}}>
          <div style={{fontWeight:800,fontSize:14,color:"#00cc00",letterSpacing:"-.01em"}}>🌿 Botanikum</div>
          <div style={{fontSize:10,color:DEMO_MODE?"#fbbf24":"#4ade80",marginTop:1}}>{DEMO_MODE?"● Demo-Modus (lokal)":"● Supabase verbunden"}</div>
          {!DEMO_MODE&&<button onClick={handleLogout}style={{marginTop:6,background:"rgba(255,255,255,.1)",border:"none",color:"#888",borderRadius:4,padding:"3px 8px",fontSize:10,cursor:"pointer",width:"100%"}}>Abmelden</button>}
        </div>
        <div style={{padding:"6px 8px",borderBottom:"1px solid #333",display:"flex",flexDirection:"column",gap:2}}>
          {[["stammblatt","📋","Stammblätter"],["touren","🚐","Touren"]].map(([id,ic,l])=>(
            <button key={id}onClick={()=>setPage(id)}style={{background:page===id?"rgba(0,204,0,.2)":"transparent",color:page===id?"#4ade80":"#888",border:"none",borderRadius:6,padding:"7px 10px",fontSize:12,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:7,fontWeight:page===id?700:400}}>
              <span>{ic}</span>{l}
            </button>
          ))}
          {customPages.map(cp=>(
            <div key={cp.id}style={{display:"flex",alignItems:"center",gap:2}}>
              <button onClick={()=>setPage(cp.id)}style={{background:page===cp.id?"rgba(99,102,241,.25)":"transparent",color:page===cp.id?"#a5b4fc":"#888",border:"none",borderRadius:6,padding:"5px 8px",fontSize:11,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:5,fontWeight:page===cp.id?700:400,flex:1,overflow:"hidden"}}>
                <span>🖼</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cp.name}</span>
              </button>
              <button onClick={()=>deleteCustomPage(cp.id)}title="Seite löschen"style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:11,padding:"2px 4px",flexShrink:0}}>×</button>
            </div>
          ))}
          <button onClick={addCustomPage}style={{background:"transparent",color:"#555",border:"1px dashed #444",borderRadius:6,padding:"4px 8px",fontSize:10,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:5,marginTop:2}}>
            <span>+</span>Neue Seite
          </button>
        </div>
        <div style={{padding:"6px 6px",overflowY:"auto",borderBottom:"1px solid #333"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"3px 6px 4px"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#a5b4fc",textTransform:"uppercase",letterSpacing:".08em"}}>Layouts ({layouts.length})</div>
            <button onClick={addNewLayout}title="Neues Layout"style={{background:"none",border:"none",color:"#a5b4fc",cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>➕</button>
          </div>
          {layouts.map(lp=>(
            <div key={lp.id}style={{display:"flex",alignItems:"center",gap:2,borderRadius:5,background:activeLayoutId===lp.id?"rgba(99,102,241,.22)":"transparent",borderLeft:activeLayoutId===lp.id?"3px solid #6366f1":"3px solid transparent",paddingLeft:2,marginBottom:1}}>
              {editingLayoutName===lp.id
                ?<input autoFocus value={lp.name}onChange={e=>renameLayout(lp.id,e.target.value)}onBlur={()=>setEditingLayoutName(null)}onKeyDown={e=>e.key==="Enter"&&setEditingLayoutName(null)}
                    style={{flex:1,background:"#1e1e3a",border:"1px solid #6366f1",borderRadius:4,color:"#e2e8f0",fontSize:11,padding:"2px 5px",outline:"none"}}/>
                :<button onClick={()=>switchLayout(lp.id)}style={{flex:1,background:"none",border:"none",color:activeLayoutId===lp.id?"#a5b4fc":"#666",cursor:"pointer",fontSize:11,textAlign:"left",padding:"4px 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:activeLayoutId===lp.id?700:400}}>{lp.name}</button>
              }
              <button onClick={()=>setEditingLayoutName(lp.id)}title="Umbenennen"style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:10,padding:"0 2px",flexShrink:0}}>✎</button>
              <button onClick={()=>duplicateLayout(lp.id)}title="Duplizieren"style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:11,padding:"0 2px",flexShrink:0}}>⧉</button>
              {layouts.length>1&&<button onClick={()=>deleteLayout(lp.id)}title="Löschen"style={{background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:11,padding:"0 2px",flexShrink:0}}>×</button>}
            </div>
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
          {!DEMO_MODE&&<button onClick={importFromGaertnerei}disabled={importing}style={{background:"rgba(5,150,105,.25)",color:"#4ade80",border:"1px solid rgba(5,150,105,.4)",borderRadius:6,padding:"5px",fontSize:11,cursor:importing?"wait":"pointer"}}>
            {importing?"⏳ Import…":"📥 Aus Gärtnerei importieren"}
          </button>}
          <button onClick={()=>setModal("builder")}style={{background:"rgba(99,102,241,.25)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,.3)",borderRadius:6,padding:"5px",fontSize:11,cursor:"pointer"}}>⚙ Felder-Builder</button>
          <button onClick={()=>setModal("valuelists")}style={{background:"rgba(99,102,241,.15)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,.25)",borderRadius:6,padding:"5px",fontSize:11,cursor:"pointer"}}>📋 Wertelisten</button>
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
        <div style={{background:"#d4d0c8",borderBottom:"1px solid #888",padding:"0 10px",display:"flex",alignItems:"flex-end",flexShrink:0,gap:2}}>
          {page==="stammblatt"&&<div style={{background:"#f0ede8",border:"1px solid #888",borderBottom:"none",padding:"4px 16px",fontSize:12,fontWeight:700}}>STAM</div>}
          {page==="touren"&&<div style={{background:"#f0ede8",border:"1px solid #888",borderBottom:"none",padding:"4px 16px",fontSize:12,fontWeight:700}}>TOUR</div>}
          {customPages.map(cp=>(
            <div key={cp.id}style={{display:"flex",alignItems:"center",gap:0}}>
              <div style={{background:page===cp.id?"#f0ede8":"#ddd",border:"1px solid #888",borderBottom:page===cp.id?"none":"1px solid #888",padding:"4px 6px",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                {page===cp.id
                  ?<input value={cp.name}onChange={e=>renameCustomPage(cp.id,e.target.value)}
                      style={{background:"transparent",border:"none",fontWeight:700,fontSize:12,outline:"none",width:Math.max(40,cp.name.length*8)}}/>
                  :<span onClick={()=>setPage(cp.id)}style={{cursor:"pointer"}}>{cp.name}</span>
                }
              </div>
            </div>
          ))}
        </div>
        <div style={{flex:1,overflow:page.startsWith("cp_")?"hidden":"auto",background:"#e0ddd8",padding:page.startsWith("cp_")?"0":"8px 10px",display:page.startsWith("cp_")?"flex":"block",flexDirection:"column"}}>
          {loading?(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#555",fontSize:14}}>Lade…</div>
          ):page==="stammblatt"?(
            activeData?(
              <Stammblatt data={activeData}schema={schema}onChange={setActiveData}onSave={saveKunde}saving={saving}formulaMap={formulaMap}onFormulaMapChange={handleFormulaMapChange}layout={layout}onLayoutChange={handleLayoutChange}labelOverrides={labelOverrides}onLabelOverrideChange={handleLabelOverrideChange}valueLists={valueLists}activeLayoutName={layouts.find(l=>l.id===activeLayoutId)?.name}onSaveLayoutProfile={saveCurrentLayoutProfile}/>
            ):(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#888"}}>Datensatz auswählen oder + Neu</div>
            )
          ):page==="touren"?(
            <Tourenplanung kunden={kunden}touren={touren}setTouren={setTouren}onSaveTour={saveTour}/>
          ):page.startsWith("cp_")?(()=>{
            const cp=customPages.find(p=>p.id===page);
            return cp?(
              <CanvasPage page={cp}kundeData={activeData}onUpdate={updateCustomPage}onKundeChange={setActiveData}/>
            ):(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#888"}}>Seite nicht gefunden</div>
            );
          })():(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#888"}}>Unbekannte Seite</div>
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
      {modal==="valuelists"&&(
        <ValueListManager valueLists={valueLists}onChange={handleValueListChange}onClose={()=>setModal(null)}/>
      )}
    </div>
  );
}
