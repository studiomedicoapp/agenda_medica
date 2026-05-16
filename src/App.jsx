import { useState, useEffect, useCallback } from "react";
import { SCHEDULE, MONTH_NAMES, fmtFull, fmtShort } from "./schedule";
import {
  verifyPatient, getSessions, ensureSessions,
  getAllSessions, getAllBookings, getAllPatients,
  createBooking, cancelBooking, adminCancelBooking,
  toggleSession, togglePatient, importPatients,
} from "./db";
import {
  loginWithEmail, loginWithGoogle, logoutStaff,
  watchAuth, getStaffProfile
} from "./auth";

const C = {
  purple: "167,139,250",
  cyan:   "103,232,249",
  green:  "52,211,153",
  red:    "239,68,68",
};

function Glass({ children, style, onClick, radius=20, padding, variant="base", hue }) {
  const v = {
    base:   { bg:"rgba(255,255,255,0.09)", border:"rgba(255,255,255,0.17)", spec:"rgba(255,255,255,0.5)"  },
    dark:   { bg:"rgba(0,0,0,0.25)",       border:"rgba(255,255,255,0.09)", spec:"rgba(255,255,255,0.28)" },
    active: { bg:hue?`rgba(${hue},0.20)`:"rgba(255,255,255,0.16)", border:hue?`rgba(${hue},0.48)`:"rgba(255,255,255,0.38)", spec:"rgba(255,255,255,0.65)" },
    accent: { bg:hue?`rgba(${hue},0.11)`:"rgba(255,255,255,0.08)", border:hue?`rgba(${hue},0.30)`:"rgba(255,255,255,0.18)", spec:"rgba(255,255,255,0.42)" },
    green:  { bg:"rgba(52,211,153,0.15)",  border:"rgba(52,211,153,0.38)", spec:"rgba(255,255,255,0.55)" },
    red:    { bg:"rgba(239,68,68,0.13)",   border:"rgba(239,68,68,0.30)",  spec:"rgba(255,255,255,0.42)" },
  }[variant] || {};
  return (
    <div onClick={onClick} style={{
      position:"relative", overflow:"hidden",
      backdropFilter:"blur(20px) saturate(160%)", WebkitBackdropFilter:"blur(20px) saturate(160%)",
      background:v.bg, borderRadius:radius, border:`1px solid ${v.border}`,
      boxShadow:"0 2px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
      cursor:onClick?"pointer":undefined, transition:"opacity 0.15s, transform 0.15s",
      ...(padding?{padding}:{}), ...style,
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:v.spec,pointerEvents:"none",zIndex:3}}/>
      <div style={{position:"absolute",top:0,left:0,bottom:0,width:1,background:`linear-gradient(to bottom,${v.spec},transparent 55%)`,pointerEvents:"none",zIndex:3}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(150deg,rgba(255,255,255,0.055) 0%,transparent 50%)",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"relative",zIndex:2}}>{children}</div>
    </div>
  );
}

function Av({ initials, size=40 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`linear-gradient(145deg,rgba(${C.purple},0.9),rgba(${C.purple},0.5))`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.32, fontWeight:700, color:"#fff",
      boxShadow:`0 0 0 2px rgba(${C.purple},0.28), 0 4px 12px rgba(0,0,0,0.3)`,
    }}>{initials}</div>
  );
}

function Spinner({ size=24 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      border:`2px solid rgba(255,255,255,0.1)`,
      borderTopColor:`rgba(${C.purple},0.9)`,
      animation:"spin 0.7s linear infinite",
      flexShrink:0,
    }}/>
  );
}

function Toast({ msg, ok, visible }) {
  return (
    <div style={{
      position:"fixed", bottom:80, left:"50%",
      transform:`translateX(-50%) translateY(${visible?0:12}px)`,
      opacity:visible?1:0, transition:"opacity 0.3s, transform 0.3s",
      zIndex:9999, pointerEvents:"none", whiteSpace:"nowrap",
    }}>
      <Glass variant={ok?"green":"red"} radius={100} padding="10px 20px">
        <span style={{fontSize:13,fontWeight:600,color:"#fff"}}>{msg}</span>
      </Glass>
    </div>
  );
}

function Label({ children, style }) {
  return <div style={{fontSize:10,letterSpacing:2.5,color:"rgba(255,255,255,0.32)",textTransform:"uppercase",...style}}>{children}</div>;
}

function Input({ label, ...props }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {label && <Label>{label}</Label>}
      <input style={{
        width:"100%", background:"rgba(255,255,255,0.07)",
        border:"1px solid rgba(255,255,255,0.14)", borderRadius:12,
        padding:"12px 14px", color:"#fff", fontSize:15, outline:"none",
        fontFamily:"inherit", WebkitAppearance:"none", letterSpacing:0.2,
      }} {...props}/>
    </div>
  );
}

function Btn({ children, onClick, variant="primary", loading, disabled, style }) {
  const bg = {
    primary: `rgba(${C.purple},0.28)`,
    secondary: "rgba(255,255,255,0.07)",
    danger: `rgba(${C.red},0.18)`,
    success: `rgba(${C.green},0.18)`,
  }[variant];
  const border = {
    primary: `rgba(${C.purple},0.45)`,
    secondary: "rgba(255,255,255,0.12)",
    danger: `rgba(${C.red},0.35)`,
    success: `rgba(${C.green},0.38)`,
  }[variant];
  const color = {
    primary: "#fff",
    secondary: "rgba(255,255,255,0.55)",
    danger: `rgba(${C.red},0.9)`,
    success: "#fff",
  }[variant];

  return (
    <button onClick={!loading&&!disabled?onClick:undefined} style={{
      width:"100%", padding:"13px", borderRadius:12, border:`1px solid ${border}`,
      background:bg, color, fontSize:14, fontWeight:600, cursor:loading||disabled?"not-allowed":"pointer",
      opacity:disabled?0.4:1, transition:"opacity 0.15s",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      fontFamily:"inherit", letterSpacing:0.2, ...style,
    }}>
      {loading && <Spinner size={16}/>}
      {children}
    </button>
  );
}

function MiniCalendar({ sessions, onSelectDate, selectedDate }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear]   = useState(today.getFullYear());

  const availableDates = new Set(sessions.filter(s=>s.attiva&&s.bookedSlots.length<s.allSlots.length).map(s=>s.data));
  const fullDates      = new Set(sessions.filter(s=>s.attiva&&s.bookedSlots.length>=s.allSlots.length).map(s=>s.data));
  const todayStr       = today.toISOString().split("T")[0];

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const offset      = firstDay===0?6:firstDay-1;

  const cells = [];
  for (let i=0;i<offset;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(d);

  const prev = () => { if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
  const next = () => { if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };

  return (
    <Glass variant="base" radius={20}>
      <div style={{padding:"16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div onClick={prev} style={{cursor:"pointer",padding:"4px 12px",color:"rgba(255,255,255,0.45)",fontSize:20,userSelect:"none",lineHeight:1}}>‹</div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",letterSpacing:0.3}}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>
          <div onClick={next} style={{cursor:"pointer",padding:"4px 12px",color:"rgba(255,255,255,0.45)",fontSize:20,userSelect:"none",lineHeight:1}}>›</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
          {["L","M","M","G","V","S","D"].map((d,i)=>(
            <div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.25)",padding:"3px 0",letterSpacing:0.5}}>{d}</div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map((day,i)=>{
            if(!day) return <div key={i}/>;
            const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isAvail = availableDates.has(dateStr);
            const isFull  = fullDates.has(dateStr);
            const isSel   = selectedDate===dateStr;
            const isPast  = dateStr<todayStr;
            const isToday = dateStr===todayStr;
            const clickable = isAvail&&!isPast;
            return (
              <div key={i} onClick={clickable?()=>onSelectDate(dateStr):undefined} style={{
                textAlign:"center", padding:"7px 0", borderRadius:10,
                cursor:clickable?"pointer":"default",
                background:isSel?`rgba(${C.purple},0.32)`:"transparent",
                border:isSel?`1px solid rgba(${C.purple},0.55)`:isToday?"1px solid rgba(255,255,255,0.18)":"1px solid transparent",
                opacity:isPast?0.2:1, transition:"background 0.15s",
              }}>
                <div style={{
                  fontSize:13, fontWeight:isSel?700:isAvail?500:400,
                  color:isSel?"#fff":isFull?`rgba(${C.red},0.55)`:isAvail&&!isPast?`rgba(${C.cyan},0.85)`:"rgba(255,255,255,0.28)",
                }}>{day}</div>
                {isAvail&&!isPast&&(
                  <div style={{width:3,height:3,borderRadius:"50%",margin:"2px auto 0",background:isSel?"rgba(255,255,255,0.8)":`rgba(${C.cyan},0.65)`}}/>
                )}
                {isFull&&!isPast&&(
                  <div style={{width:3,height:3,borderRadius:"50%",margin:"2px auto 0",background:`rgba(${C.red},0.6)`}}/>
                )}
              </div>
            );
          })}
        </div>

        <div style={{display:"flex",gap:14,marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          {[{c:C.cyan,l:"Disponibile"},{c:C.red,l:"Completo"},{c:C.purple,l:"Selezionato"}].map(x=>(
            <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:`rgba(${x.c},0.75)`}}/>
              <span style={{fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:0.3}}>{x.l}</span>
            </div>
          ))}
        </div>
      </div>
    </Glass>
  );
}

function VerificaView({ onSuccess, showToast }) {
  const [mode, setMode]   = useState("cf");
  const [cf, setCf]       = useState("");
  const [form, setForm]   = useState({ nome:"", cognome:"", dataNascita:"" });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async () => {
    setLoading(true);
    try {
      const payload = mode==="cf"
        ? { codiceFiscale: cf }
        : { nome: form.nome, cognome: form.cognome, dataNascita: form.dataNascita };
      const paz = await verifyPatient(payload);
      if (!paz) showToast("Non risulti registrato presso lo studio.", false);
      else onSuccess(paz);
    } catch(e) {
      showToast("Errore di connessione. Riprova.", false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:22,animation:"fadeIn 0.3s ease"}}>
      <div style={{paddingTop:8}}>
        <Label style={{marginBottom:10,color:`rgba(${C.purple},0.65)`}}>Studio Medico</Label>
        <h1 style={{fontSize:30,fontWeight:800,color:"#fff",letterSpacing:-1,margin:0,lineHeight:1.1}}>
          Portale Prenotazioni
        </h1>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.38)",marginTop:10,lineHeight:1.6}}>
          Inserisci i tuoi dati per accedere al calendario delle visite.
        </p>
      </div>

      <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:12,padding:3,border:"1px solid rgba(255,255,255,0.09)"}}>
        {[["cf","Codice Fiscale"],["nome","Nome e Data"]].map(([k,l])=>(
          <div key={k} onClick={()=>setMode(k)} style={{
            flex:1, textAlign:"center", padding:"11px 0", borderRadius:9, cursor:"pointer",
            background:mode===k?"rgba(255,255,255,0.12)":"transparent",
            transition:"background 0.2s", fontSize:14,
            fontWeight:mode===k?600:400,
            color:mode===k?"#fff":"rgba(255,255,255,0.38)",
          }}>{l}</div>
        ))}
      </div>

      <Glass variant="base" radius={20}>
        <div style={{padding:"20px 18px",display:"flex",flexDirection:"column",gap:14}}>
          {mode==="cf"
            ? <Input label="Codice Fiscale" placeholder="RSSMRA80A01H501U"
                value={cf} onChange={e=>setCf(e.target.value.toUpperCase())} maxLength={16}
                onKeyDown={e=>e.key==="Enter"&&submit()}/>
            : <>
                <div style={{display:"flex",gap:10}}>
                  <Input label="Nome" placeholder="Mario" value={form.nome} onChange={set("nome")}/>
                  <Input label="Cognome" placeholder="Rossi" value={form.cognome} onChange={set("cognome")}/>
                </div>
                <Input label="Data di nascita" type="date" value={form.dataNascita} onChange={set("dataNascita")}/>
              </>
          }
          <Btn onClick={submit} loading={loading} disabled={!cf&&!(form.nome&&form.cognome&&form.dataNascita)}>
            Accedi al calendario
          </Btn>
        </div>
      </Glass>

      <p style={{textAlign:"center",fontSize:12,color:"rgba(255,255,255,0.2)"}}>
        L'accesso è riservato ai pazienti registrati presso lo studio.
      </p>
    </div>
  );
}

function SessioniView({ paziente, onLogout, showToast }) {
  const [sessions, setSessions] = useState([]);
  const [myBooking, setMyBooking] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selDate, setSelDate]   = useState(null);
  const [selOra, setSelOra]     = useState(null);
  const [conferma, setConferma] = useState(false);
  const [booking, setBooking]   = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      await ensureSessions();
      const [sess, booking] = await Promise.all([
        getSessions(),
        import("./db").then(m => m.getMyBooking(paziente.id)),
      ]);
      setSessions(sess);
      setMyBooking(booking);
    } catch(e) {
      showToast("Errore di caricamento.", false);
    } finally {
      setLoading(false);
    }
  }, [paziente.id]);

  useEffect(() => { load(); }, [load]);

  const selSession = sessions.find(s=>s.data===selDate);
  const slotsByHour = {};
  if (selSession) {
    selSession.allSlots.forEach(ora=>{
      const h = ora.split(":")[0];
      if(!slotsByHour[h]) slotsByHour[h]=[];
      slotsByHour[h].push(ora);
    });
  }

  const handleBook = async () => {
    setBooking(true);
    try {
      await createBooking(paziente, selSession.id, selSession.data, selOra);
      showToast("Prenotazione confermata.", true);
      await load();
      setSelDate(null); setSelOra(null); setConferma(false);
    } catch(e) {
      showToast(e.message||"Errore durante la prenotazione.", false);
      setConferma(false);
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(myBooking.id, paziente.id);
      showToast("Prenotazione cancellata.", true);
      setMyBooking(null);
      setConfirmCancel(false);
      await load();
    } catch(e) {
      showToast(e.message||"Errore durante la cancellazione.", false);
    } finally {
      setCancelling(false);
    }
  };

  const freeCount = s => s.allSlots.filter(o=>!s.bookedSlots.includes(o)).length;

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",gap:20,animation:"fadeIn 0.3s ease"}}>
      <Glass variant="base" radius={18} padding="14px 16px">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Av initials={`${paziente.nome[0]}${paziente.cognome[0]}`}/>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{paziente.nome} {paziente.cognome}</div>
          </div>
        </div>
      </Glass>
      <div style={{display:"flex",justifyContent:"center",padding:"40px 0"}}><Spinner size={32}/></div>
    </div>
  );

  if (myBooking) return (
    <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn 0.3s ease"}}>
      <Glass variant="base" radius={18} padding="13px 16px">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Av initials={`${paziente.nome[0]}${paziente.cognome[0]}`}/>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{paziente.nome} {paziente.cognome}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.36)",marginTop:2,letterSpacing:0.5}}>{paziente.codiceFiscale}</div>
          </div>
          <div onClick={onLogout} style={{fontSize:12,color:"rgba(255,255,255,0.35)",cursor:"pointer",padding:"4px 8px"}}>Esci</div>
        </div>
      </Glass>

      <Glass variant="green" radius={20}>
        <div style={{padding:"26px 20px"}}>
          <Label style={{marginBottom:10,color:`rgba(${C.green},0.65)`}}>Prenotazione confermata</Label>
          <div style={{fontSize:18,fontWeight:700,color:"#fff",textTransform:"capitalize",marginBottom:4}}>{fmtFull(myBooking.data)}</div>
          <div style={{fontSize:38,fontWeight:800,color:"#fff",letterSpacing:1,marginBottom:20}}>{myBooking.ora}</div>
          <div style={{height:1,background:"rgba(255,255,255,0.08)",marginBottom:14}}/>
          <div style={{marginTop:12,padding:"7px 11px",background:"rgba(0,0,0,0.15)",borderRadius:8,fontSize:10,color:"rgba(255,255,255,0.28)",fontFamily:"monospace",letterSpacing:0.5}}>
            {myBooking.id}
          </div>
        </div>
      </Glass>

      {!confirmCancel
        ? <div onClick={()=>setConfirmCancel(true)} style={{textAlign:"center",fontSize:13,color:`rgba(${C.red},0.55)`,cursor:"pointer",padding:"8px 0"}}>
            Cancella prenotazione
          </div>
        : <Glass variant="red" radius={18}>
            <div style={{padding:"16px"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Cancellare la prenotazione?</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.42)",marginBottom:14}}>Sarà possibile riprenotare in un altro giorno.</div>
              <div style={{display:"flex",gap:10}}>
                <Btn variant="secondary" onClick={()=>setConfirmCancel(false)} style={{borderRadius:10}}>No</Btn>
                <Btn variant="danger" onClick={handleCancel} loading={cancelling} style={{borderRadius:10,color:"#fff",borderColor:`rgba(${C.red},0.4)`}}>Sì, cancella</Btn>
              </div>
            </div>
          </Glass>
      }
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeIn 0.3s ease"}}>
      <Glass variant="base" radius={18} padding="13px 16px">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Av initials={`${paziente.nome[0]}${paziente.cognome[0]}`}/>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{paziente.nome} {paziente.cognome}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.36)",marginTop:2}}>{selDate?"Scegli l'orario":"Scegli una data"}</div>
          </div>
          <div onClick={onLogout} style={{fontSize:12,color:"rgba(255,255,255,0.35)",cursor:"pointer",padding:"4px 8px"}}>Esci</div>
        </div>
      </Glass>

      {!selDate ? (
        <>
          <Label style={{paddingLeft:2}}>Seleziona una data</Label>
          <MiniCalendar sessions={sessions} onSelectDate={setSelDate} selectedDate={selDate}/>

          <Label style={{paddingLeft:2,marginTop:4}}>Prossime disponibilità</Label>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {sessions.filter(s=>s.attiva).slice(0,5).map(s=>{
              const free = freeCount(s);
              const full = free===0;
              return (
                <Glass key={s.id} variant={full?"dark":"base"} radius={16}
                  onClick={full?undefined:()=>setSelDate(s.data)}
                  style={{opacity:full?0.4:1,cursor:full?"not-allowed":"pointer"}}>
                  <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:"#fff",textTransform:"capitalize"}}>{fmtFull(s.data)}</div>
                      <div style={{fontSize:12,color:`rgba(${C.cyan},0.7)`,marginTop:2}}>
                        {SCHEDULE[s.dow]?.start}:00 – {SCHEDULE[s.dow]?.start+SCHEDULE[s.dow]?.hours}:00
                      </div>
                    </div>
                    <div style={{
                      fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:100,
                      background:full?`rgba(${C.red},0.12)`:`rgba(${C.green},0.12)`,
                      color:full?`rgba(${C.red},0.75)`:`rgba(${C.green},0.85)`,
                      border:full?`1px solid rgba(${C.red},0.22)`:`1px solid rgba(${C.green},0.28)`,
                    }}>
                      {full?"Completo":`${free} disponibili`}
                    </div>
                  </div>
                </Glass>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div onClick={()=>{setSelDate(null);setSelOra(null);setConferma(false);}}
              style={{fontSize:13,color:`rgba(${C.cyan},0.75)`,cursor:"pointer",padding:"4px 0"}}>
              ← Indietro
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:"#fff",textTransform:"capitalize"}}>{fmtFull(selDate)}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>
                {selSession&&`${SCHEDULE[selSession.dow]?.start}:00 – ${SCHEDULE[selSession.dow]?.start+SCHEDULE[selSession.dow]?.hours}:00`}
              </div>
            </div>
          </div>

          <Label style={{paddingLeft:2}}>Orario disponibile</Label>

          {Object.entries(slotsByHour).map(([h,oras])=>(
            <Glass key={h} variant="base" radius={18}>
              <div style={{padding:"14px 14px 12px"}}>
                <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.35)",letterSpacing:1,marginBottom:12}}>
                  {h}:00 — {parseInt(h)+1}:00
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {oras.map(ora=>{
                    const booked = selSession?.bookedSlots.includes(ora);
                    const isSel  = selOra===ora;
                    return (
                      <Glass key={ora}
                        variant={booked?"dark":isSel?"active":"accent"}
                        hue={isSel?C.purple:C.cyan}
                        radius={10} padding="12px 0"
                        onClick={booked?undefined:()=>{setSelOra(ora);setConferma(false);}}
                        style={{textAlign:"center",opacity:booked?0.28:1,cursor:booked?"not-allowed":"pointer"}}>
                        <div style={{fontSize:16,fontWeight:700,color:booked?"rgba(255,255,255,0.25)":"#fff",letterSpacing:0.5}}>{ora}</div>
                        {booked&&<div style={{fontSize:9,color:`rgba(${C.red},0.55)`,marginTop:3,letterSpacing:0.8}}>OCCUPATO</div>}
                      </Glass>
                    );
                  })}
                </div>
              </div>
            </Glass>
          ))}

          {selOra && !conferma && (
            <Btn onClick={()=>setConferma(true)}>Prenota per le {selOra}</Btn>
          )}

          {conferma && selOra && (
            <Glass variant="base" radius={18}>
              <div style={{padding:"18px 16px"}}>
                <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:6}}>Conferma prenotazione</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:4,textTransform:"capitalize"}}>{fmtFull(selDate)}</div>
                <div style={{fontSize:22,fontWeight:700,color:`rgba(${C.cyan},0.9)`,marginBottom:18,letterSpacing:1}}>{selOra}</div>
                <div style={{display:"flex",gap:10}}>
                  <Btn variant="secondary" onClick={()=>setConferma(false)} style={{borderRadius:10}}>Annulla</Btn>
                  <Btn variant="success" onClick={handleBook} loading={booking} style={{borderRadius:10,color:"#fff",borderColor:`rgba(${C.green},0.4)`}}>Conferma</Btn>
                </div>
              </div>
            </Glass>
          )}
        </>
      )}
    </div>
  );
}

function AdminLoginView({ onLogin, onBack, showToast }) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const finishLogin = async (user) => {
    const staff = await getStaffProfile(user.uid);
    if (!staff) {
      await logoutStaff();
      showToast("Account non autorizzato.", false);
      return;
    }
    onLogin();
  };

  const submitEmail = async () => {
    if (!email || !password) {
      showToast("Inserisci email e password.", false);
      return;
    }
    setLoading(true);
    try {
      const cred = await loginWithEmail(email.trim(), password);
      await finishLogin(cred.user);
    } catch (e) {
      showToast("Accesso non riuscito.", false);
    } finally {
      setLoading(false);
    }
  };

  const submitGoogle = async () => {
    setLoading(true);
    try {
      const cred = await loginWithGoogle();
      await finishLogin(cred.user);
    } catch (e) {
      showToast("Accesso Google non riuscito.", false);
      setLoading(false);
    }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:22,animation:"fadeIn 0.3s ease"}}>
      <div style={{paddingTop:8}}>
        <Label style={{marginBottom:8}}>Accesso riservato</Label>
        <h2 style={{fontSize:26,fontWeight:800,color:"#fff",margin:0}}>Segreteria</h2>
      </div>
      <Glass variant="base" radius={20}>
        <div style={{padding:"20px 18px",display:"flex",flexDirection:"column",gap:14}}>
          <Input label="Email" type="email" placeholder="email@example.com"
            value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&submitEmail()}/>
          <Input label="Password" type="password" placeholder="••••••••••"
            value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&submitEmail()}/>
          <Btn onClick={submitEmail} loading={loading} disabled={!email||!password}>
            {loading?"Accesso…":"Accedi con email"}
          </Btn>
          <div style={{height:1,background:"rgba(255,255,255,0.06)"}}/>
          <Btn onClick={submitGoogle} loading={loading} variant="secondary" style={{opacity:loading?0.5:1,cursor:loading?"not-allowed":"pointer"}}>
            Continua con Google
          </Btn>
        </div>
      </Glass>
      <div onClick={onBack} style={{textAlign:"center",fontSize:13,color:"rgba(255,255,255,0.28)",cursor:"pointer"}}>
        Torna al portale pazienti
      </div>
    </div>
  );
}

function AdminView({ onLogout, showToast }) {
  const [tab, setTab]           = useState("agenda");
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    try {
      await ensureSessions();
      const [sess, books, pats] = await Promise.all([
        getAllSessions(), getAllBookings(), getAllPatients()
      ]);
      setSessions(sess); setBookings(books); setPatients(pats);
    } catch(e) {
      showToast("Errore di caricamento.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const todayStr = new Date().toISOString().split("T")[0];
  const upcoming = sessions.filter(s=>s.attiva&&s.data>=todayStr).sort((a,b)=>a.data.localeCompare(b.data));
  const totalFree = upcoming.reduce((acc,s)=>acc+(s.allSlots.filter(o=>!s.bookedSlots.includes(o)).length),0);

  const handleCancelBooking = async id => {
    try {
      await adminCancelBooking(id);
      showToast("Prenotazione cancellata.", true);
      await load();
    } catch(e) { showToast("Errore.", false); }
  };

  const handleToggleSession = async (id, current) => {
    try {
      await toggleSession(id, !current);
      await load();
    } catch(e) { showToast("Errore.", false); }
  };

  const handleTogglePatient = async (id, current) => {
    try {
      await togglePatient(id, !current);
      await load();
    } catch(e) { showToast("Errore.", false); }
  };

  const handleImportExcel = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type:"array", cellDates:true });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:"" });
      const norm = r => Object.fromEntries(Object.entries(r).map(([k,v])=>[k.toLowerCase().replace(/\s/g,""),v]));
      const patients = rows.map(norm).filter(r=>r.nome&&r.cognome).map(r=>({
        codiceFiscale: String(r.codicefiscale||"").toUpperCase().trim(),
        nome: String(r.nome).trim(),
        cognome: String(r.cognome).trim(),
        dataNascita: r.datanascita ? new Date(r.datanascita).toISOString().split("T")[0] : "",
        email: String(r.email||"").toLowerCase().trim(),
        telefono: String(r.telefono||"").trim(),
        abilitato: true,
      }));
      await importPatients(patients);
      showToast(`${patients.length} pazienti importati.`, true);
      await load();
    } catch(err) {
      showToast("Errore durante l'importazione.", false);
      console.error(err);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const filteredBookings = bookings.filter(b=>
    !search||`${b.nome} ${b.cognome} ${b.codiceFiscale} ${b.ora} ${b.data}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPatients = patients.filter(p=>
    !search||`${p.nome} ${p.cognome} ${p.codiceFiscale}`.toLowerCase().includes(search.toLowerCase())
  );

  const inp = {
    width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
    borderRadius:12, padding:"10px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"inherit",
  };

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>Segreteria</div>
        <div onClick={onLogout} style={{fontSize:12,color:"rgba(255,255,255,0.35)",cursor:"pointer"}}>Esci</div>
      </div>
      <div style={{display:"flex",justifyContent:"center",padding:"60px 0"}}><Spinner size={32}/></div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,animation:"fadeIn 0.3s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <Label style={{marginBottom:4}}>Pannello di controllo</Label>
          <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>Segreteria</div>
        </div>
        <div onClick={onLogout} style={{fontSize:12,color:"rgba(255,255,255,0.32)",cursor:"pointer",padding:"4px 8px"}}>Esci</div>
      </div>

      <div style={{display:"flex",gap:8}}>
        {[
          {l:"Sessioni",    v:upcoming.length,  c:C.purple},
          {l:"Prenotazioni",v:bookings.length,  c:C.cyan},
          {l:"Posti liberi",v:totalFree,        c:C.green},
        ].map(s=>(
          <Glass key={s.l} variant="base" radius={14} style={{flex:1,padding:"12px 6px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{s.v}</div>
            <div style={{fontSize:9,color:`rgba(${s.c},0.65)`,textTransform:"uppercase",letterSpacing:1,marginTop:3}}>{s.l}</div>
          </Glass>
        ))}
      </div>

      <div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:12,padding:3,border:"1px solid rgba(255,255,255,0.08)"}}>
        {[["agenda","Agenda"],["prenotazioni","Prenotazioni"],["sessioni","Sessioni"],["pazienti","Pazienti"]].map(([k,l])=>(
          <div key={k} onClick={()=>{setTab(k);setSearch("");}} style={{
            flex:1, textAlign:"center", padding:"9px 2px", borderRadius:9, cursor:"pointer",
            background:tab===k?"rgba(255,255,255,0.11)":"transparent",
            transition:"background 0.2s", fontSize:11, fontWeight:tab===k?600:400,
            color:tab===k?"#fff":"rgba(255,255,255,0.32)", letterSpacing:0.2,
          }}>{l}</div>
        ))}
      </div>

      {tab==="agenda" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {upcoming.length===0
            ? <div style={{textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,0.28)",fontSize:14}}>Nessuna sessione programmata.</div>
            : upcoming.map(s=>{
              const dayBookings = bookings.filter(b=>b.sessioneId===s.id).sort((a,b)=>a.ora.localeCompare(b.ora));
              const free = s.allSlots.filter(o=>!s.bookedSlots.includes(o)).length;
              return (
                <Glass key={s.id} variant="base" radius={18}>
                  <div style={{padding:"14px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#fff",textTransform:"capitalize"}}>{fmtFull(s.data)}</div>
                        <div style={{fontSize:11,color:`rgba(${C.cyan},0.65)`,marginTop:2}}>
                          {SCHEDULE[s.dow]?.start}:00–{SCHEDULE[s.dow]?.start+SCHEDULE[s.dow]?.hours}:00
                        </div>
                      </div>
                      <div style={{
                        fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:100,
                        background:free===0?`rgba(${C.red},0.12)`:`rgba(${C.green},0.12)`,
                        color:free===0?`rgba(${C.red},0.75)`:`rgba(${C.green},0.85)`,
                        border:free===0?`1px solid rgba(${C.red},0.22)`:`1px solid rgba(${C.green},0.28)`,
                      }}>{free===0?"Completo":`${free} liberi`}</div>
                    </div>
                    <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,0.07)",overflow:"hidden",marginBottom:10}}>
                      <div style={{height:"100%",borderRadius:2,background:`rgba(${C.cyan},0.5)`,
                        width:`${Math.round((s.bookedSlots.length/s.allSlots.length)*100)}%`,transition:"width 0.5s"}}/>
                    </div>
                    {dayBookings.length===0
                      ? <div style={{fontSize:12,color:"rgba(255,255,255,0.22)",padding:"4px 0"}}>Nessuna prenotazione.</div>
                      : dayBookings.map(b=>(
                        <div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                          <div style={{fontSize:13,fontWeight:700,color:`rgba(${C.cyan},0.85)`,minWidth:44,letterSpacing:0.5,flexShrink:0}}>{b.ora}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              {b.cognome} {b.nome}
                            </div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:1,fontFamily:"monospace",letterSpacing:0.5}}>{b.codiceFiscale}</div>
                          </div>
                          <div onClick={()=>handleCancelBooking(b.id)} style={{fontSize:11,color:`rgba(${C.red},0.55)`,cursor:"pointer",padding:"4px 8px",flexShrink:0}}>
                            Cancella
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </Glass>
              );
            })
          }
        </div>
      )}

      {tab==="prenotazioni" && (
        <Glass variant="base" radius={18}>
          <div style={{padding:"14px"}}>
            <Label style={{marginBottom:12}}>{bookings.length} prenotazioni attive</Label>
            <input style={{...inp,marginBottom:12}} placeholder="Cerca nome, codice fiscale, orario..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
            {filteredBookings.length===0
              ? <div style={{textAlign:"center",padding:"20px 0",color:"rgba(255,255,255,0.28)",fontSize:13}}>Nessun risultato.</div>
              : filteredBookings.map(b=>(
                <div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <div style={{fontSize:13,fontWeight:700,color:`rgba(${C.cyan},0.85)`,minWidth:44,letterSpacing:0.5,flexShrink:0}}>{b.ora}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {b.cognome} {b.nome}
                    </div>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",marginTop:1}}>{fmtShort(b.data)} · {b.codiceFiscale}</div>
                  </div>
                  <div onClick={()=>handleCancelBooking(b.id)} style={{fontSize:11,color:`rgba(${C.red},0.55)`,cursor:"pointer",padding:"4px 8px",flexShrink:0}}>
                    Cancella
                  </div>
                </div>
              ))
            }
          </div>
        </Glass>
      )}

      {tab==="sessioni" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <Glass variant="dark" radius={14} padding="12px 14px"
            style={{borderLeft:`3px solid rgba(${C.cyan},0.35)`}}>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.42)",lineHeight:1.6}}>
              Le sessioni vengono generate automaticamente dal calendario settimanale.
              Disattiva un giorno in caso di chiusura straordinaria.
            </div>
          </Glass>
          {sessions.map(s=>{
            const booked = s.bookedSlots.length;
            const free   = s.allSlots.length - booked;
            return (
              <Glass key={s.id} variant="base" radius={16}>
                <div style={{padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:s.attiva?"#fff":"rgba(255,255,255,0.35)",textTransform:"capitalize"}}>
                        {fmtFull(s.data)}
                      </div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.32)",marginTop:2}}>
                        {SCHEDULE[s.dow]?.start}:00–{SCHEDULE[s.dow]?.start+SCHEDULE[s.dow]?.hours}:00 · {s.allSlots.length} slot
                      </div>
                    </div>
                    <div onClick={()=>handleToggleSession(s.id,s.attiva)} style={{
                      fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:100,cursor:"pointer",
                      background:s.attiva?`rgba(${C.green},0.13)`:"rgba(255,255,255,0.06)",
                      color:s.attiva?`rgba(${C.green},0.85)`:"rgba(255,255,255,0.35)",
                      border:s.attiva?`1px solid rgba(${C.green},0.28)`:"1px solid rgba(255,255,255,0.1)",
                    }}>{s.attiva?"Attiva":"Disattiva"}</div>
                  </div>
                  <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,0.07)",overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:2,background:`rgba(${C.cyan},0.5)`,
                      width:`${Math.round((booked/s.allSlots.length)*100)}%`,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:4,letterSpacing:0.3}}>
                    {booked} prenotati · {free} disponibili
                  </div>
                </div>
              </Glass>
            );
          })}
        </div>
      )}

      {tab==="pazienti" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Glass variant="dark" radius={16} padding="14px 16px"
            style={{borderLeft:`3px solid rgba(${C.purple},0.4)`}}>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.42)",marginBottom:10,lineHeight:1.6}}>
              Carica il file Excel con i pazienti abilitati.<br/>
              Colonne: CodiceFiscale · Nome · Cognome · DataNascita · Email · Telefono
            </div>
            <label style={{
              display:"block",textAlign:"center",padding:"11px",borderRadius:10,cursor:"pointer",
              background:`rgba(${C.purple},0.15)`,border:`1px solid rgba(${C.purple},0.3)`,
              fontSize:13,fontWeight:600,color:"#fff",opacity:importing?0.6:1,
            }}>
              {importing?"Importazione in corso…":"Carica file Excel (.xlsx)"}
              <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{display:"none"}}/>
            </label>
          </Glass>

          <Glass variant="base" radius={18}>
            <div style={{padding:"14px"}}>
              <Label style={{marginBottom:12}}>{patients.length} pazienti registrati</Label>
              <input style={{...inp,marginBottom:12}} placeholder="Cerca nome o codice fiscale..."
                value={search} onChange={e=>setSearch(e.target.value)}/>
              <div style={{maxHeight:380,overflowY:"auto"}}>
                {filteredPatients.length===0
                  ? <div style={{textAlign:"center",padding:"20px 0",color:"rgba(255,255,255,0.28)",fontSize:13}}>
                      {patients.length===0?"Nessun paziente. Carica il file Excel.":"Nessun risultato."}
                    </div>
                  : filteredPatients.map(p=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <Av initials={`${p.nome[0]}${p.cognome[0]}`} size={32}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:p.abilitato?"#fff":"rgba(255,255,255,0.32)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {p.cognome} {p.nome}
                        </div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:1,fontFamily:"monospace",letterSpacing:0.5}}>{p.codiceFiscale||"—"}</div>
                      </div>
                      <div onClick={()=>handleTogglePatient(p.id,p.abilitato)} style={{
                        fontSize:11,fontWeight:600,padding:"4px 10px",borderRadius:100,cursor:"pointer",flexShrink:0,
                        background:p.abilitato?`rgba(${C.green},0.12)`:"rgba(255,255,255,0.06)",
                        color:p.abilitato?`rgba(${C.green},0.8)`:"rgba(255,255,255,0.32)",
                        border:p.abilitato?`1px solid rgba(${C.green},0.25)`:"1px solid rgba(255,255,255,0.08)",
                      }}>{p.abilitato?"Attivo":"Off"}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </Glass>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView]         = useState("verifica");
  const [paziente, setPaziente] = useState(null);
  const [staff, setStaff]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast]       = useState({ msg:"", ok:true, visible:false });

  const showToast = useCallback((msg, ok=true) => {
    setToast({ msg, ok, visible:true });
    setTimeout(()=>setToast(p=>({...p,visible:false})), 3200);
  }, []);

  const logout = async () => { 
    if (view === "admin") {
      try {
        await logoutStaff();
      } catch(e) {
        console.error(e);
      }
    }
    setPaziente(null);
    setStaff(null);
    setView("verifica");
  };

  useEffect(() => {
    const unsubscribe = watchAuth(async (user) => {
      if (user) {
        const profile = await getStaffProfile(user.uid);
        if (profile) {
          setStaff(profile);
          setView("admin");
        } else {
          await logoutStaff();
          setStaff(null);
          setView("verifica");
        }
      } else {
        setStaff(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight:"100vh", position:"relative", overflowX:"hidden",
      background:"linear-gradient(155deg,#080818 0%,#0b0e22 50%,#061420 100%)",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator { filter:invert(1);opacity:0.35; }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        button { font-family:inherit; }
      `}</style>

      <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",width:"65vw",height:"65vw",maxWidth:420,maxHeight:420,borderRadius:"50%",top:"-10%",left:"-14%",background:"radial-gradient(circle,rgba(109,40,217,0.3) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",width:"55vw",height:"55vw",maxWidth:360,maxHeight:360,borderRadius:"50%",bottom:"-8%",right:"-10%",background:"radial-gradient(circle,rgba(6,182,212,0.22) 0%,transparent 70%)"}}/>
      </div>

      <div style={{position:"relative",zIndex:10,maxWidth:480,margin:"0 auto",padding:"24px 18px 90px",minHeight:"100vh"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28,paddingTop:4}}>
          <div style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.38)",letterSpacing:0.3}}>
            Studio Medico
          </div>
          {!["admin","adminLogin"].includes(view) && (
            <div onClick={()=>setView("adminLogin")}
              style={{fontSize:12,color:"rgba(255,255,255,0.28)",cursor:"pointer",padding:"4px 8px"}}>
              Segreteria
            </div>
          )}
        </div>

        {view==="verifica"   && <VerificaView onSuccess={p=>{setPaziente(p);setView("sessioni");}} showToast={showToast}/>}
        {view==="sessioni"   && <SessioniView paziente={paziente} onLogout={logout} showToast={showToast}/>}
        {view==="adminLogin" && <AdminLoginView onLogin={()=>setView("admin")} onBack={()=>setView("verifica")} showToast={showToast}/>}
        {view==="admin"      && <AdminView onLogout={logout} showToast={showToast}/>}
      </div>

      <Toast {...toast}/>
    </div>
  );
}
