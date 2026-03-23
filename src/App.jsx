// Pickt — Full Featured App
// Requires on Vercel (env vars):
//   GOOGLE_PLACES_KEY — Google Places API key
//   TMDB_KEY          — TMDB API key

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Firebase (hardcoded config, initialised once on load) ───────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBPOFutCgZE0AFLmfRXL-hSHxUf3vFb_AQ",
  authDomain: "pickt-6ca82.firebaseapp.com",
  projectId: "pickt-6ca82",
  storageBucket: "pickt-6ca82.firebasestorage.app",
  messagingSenderId: "155462045470",
  appId: "1:155462045470:web:fceef196f072c607cd030f",
  measurementId: "G-2TXWML1ZR0",
};

let _db = null;
let _fsDoc = null;
let _fsSetDoc = null;
let _fsUpdateDoc = null;
let _fsOnSnapshot = null;
let _fsGetDoc = null;
let _fsCollection = null;
let _fsQuery = null;
let _fsWhere = null;
let _fsGetDocs = null;
let _fsDeleteDoc = null;

async function initFirebase() {
  if (_db) return _db;
  try {
    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, setDoc, updateDoc, onSnapshot, getDoc, collection, query, where, getDocs, deleteDoc } =
      await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    _db = getFirestore(app);
    _fsDoc = doc; _fsSetDoc = setDoc; _fsUpdateDoc = updateDoc;
    _fsOnSnapshot = onSnapshot; _fsGetDoc = getDoc;
    _fsCollection = collection; _fsQuery = query; _fsWhere = where;
    _fsGetDocs = getDocs; _fsDeleteDoc = deleteDoc;
    return _db;
  } catch (e) {
    console.error("Firebase init failed:", e);
    return null;
  }
}

// Kick off Firebase init immediately on module load
initFirebase();

// ─── Theme ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#0a0a0f", card: "#18181f", border: "#252530",
  accent: "#ff5f6d", accentDim: "rgba(255,95,109,0.15)",
  gold: "#ffc658", goldDim: "rgba(255,198,88,0.15)",
  green: "#4ade80", greenDim: "rgba(74,222,128,0.12)",
  red: "#f87171", redDim: "rgba(248,113,113,0.12)",
  text: "#f0f0f8", muted: "#5a5a72", faint: "#2a2a38",
};

const STREAMING_PLATFORMS = [
  { id: "8",   label: "Netflix",    emoji: "🔴" },
  { id: "15",  label: "Hulu",       emoji: "🟢" },
  { id: "337", label: "Disney+",    emoji: "🔵" },
  { id: "9",   label: "Prime",      emoji: "🔷" },
  { id: "350", label: "Apple TV+",  emoji: "⬜" },
  { id: "384", label: "Max",        emoji: "🟣" },
  { id: "386", label: "Peacock",    emoji: "🟠" },
  { id: "531", label: "Paramount+", emoji: "💙" },
];

const RATINGS = ["G", "PG", "PG-13", "R", "NR"];
const RADIUS_OPTIONS = [
  { value: 1000, label: "1 km" }, { value: 2000, label: "2 km" },
  { value: 5000, label: "5 km" }, { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
];

// Base URL for API calls — empty on Vercel (relative), set to Vercel deployment URL on GitHub Pages
const API_BASE = import.meta.env.VITE_API_BASE || "";

const ls = {
  get: (k, fb = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── CSS ─────────────────────────────────────────────────────────────────────
const FONT_URL = "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap";
const CSS = `
@import url('${FONT_URL}');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{height:100%;}
body{height:100%;background:${T.bg};color:${T.text};font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;}
.app{max-width:430px;margin:0 auto;height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden;}
.screen{flex:1;display:flex;flex-direction:column;padding:20px 18px env(safe-area-inset-bottom,24px);gap:16px;overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.screen::-webkit-scrollbar{display:none;}
.screen-swipe{padding-bottom:max(env(safe-area-inset-bottom,16px),16px);}
.logo{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;letter-spacing:-1px;}
.logo em{color:${T.accent};font-style:normal;}
.tagline{color:${T.muted};font-size:13px;font-weight:300;}

.btn{padding:15px 22px;border-radius:14px;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;border:none;cursor:pointer;transition:all .18s;width:100%;}
.btn-primary{background:${T.accent};color:#fff;}
.btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px);}
.btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-secondary{background:${T.card};color:${T.text};border:1.5px solid ${T.border};}
.btn-secondary:hover{border-color:${T.accent};}
.btn-sm{padding:9px 16px;font-size:13px;border-radius:10px;width:auto;}

.input{background:${T.card};border:1.5px solid ${T.border};border-radius:12px;padding:13px 15px;color:${T.text};font-family:'DM Sans',sans-serif;font-size:15px;width:100%;outline:none;transition:border-color .2s;}
.input:focus{border-color:${T.accent};}
.input::placeholder{color:${T.muted};}

.label{font-size:11px;font-weight:700;letter-spacing:1.8px;color:${T.muted};text-transform:uppercase;}
.surface-card{background:${T.card};border:1.5px solid ${T.border};border-radius:16px;padding:16px;}

.pill{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:100px;font-size:12px;font-weight:500;background:${T.card};border:1.5px solid ${T.border};cursor:pointer;transition:all .15s;white-space:nowrap;}
.pill:hover{border-color:${T.accent};}
.pill.on{background:${T.accentDim};border-color:${T.accent};color:${T.accent};}
.pill.gold-on{background:${T.goldDim};border-color:${T.gold};color:${T.gold};}

.room-code{font-family:'Syne',sans-serif;font-size:36px;font-weight:800;letter-spacing:8px;color:${T.gold};}

.card-stack{position:relative;width:100%;height:100%;}
.swipe-card{position:absolute;inset:0;background:${T.card};border-radius:24px;border:1.5px solid ${T.border};display:flex;flex-direction:column;align-items:center;overflow:hidden;cursor:grab;user-select:none;touch-action:none;}
.swipe-card:active{cursor:grabbing;}
.swipe-card.back1{transform:scale(.95) translateY(12px);filter:brightness(.65);pointer-events:none;z-index:0;}
.swipe-card.back2{transform:scale(.90) translateY(24px);filter:brightness(.4);pointer-events:none;z-index:-1;}
.card-img{width:100%;height:420px;object-fit:contain;background:#000;flex-shrink:0;border-bottom:1px solid ${T.border};}
.card-body{display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px;text-align:center;flex:1;width:100%;min-height:0;overflow-y:auto;scrollbar-width:none;justify-content:flex-start;}
.card-body::-webkit-scrollbar{display:none;}
.card-emoji{font-size:52px;line-height:1;margin-top:auto;margin-bottom:10px;}
.card-name{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;line-height:1.2;width:100%;word-wrap:break-word;overflow-wrap:break-word;}
.card-detail{color:${T.muted};font-size:14px;line-height:1.4;margin-bottom:4px;}
.vote-overlay{position:absolute;inset:0;border-radius:24px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:36px;font-weight:800;letter-spacing:3px;opacity:0;pointer-events:none;border:4px solid transparent;}
.vote-overlay.yes{background:rgba(74,222,128,.18);color:${T.green};border-color:${T.green};}
.vote-overlay.no{background:rgba(248,113,113,.18);color:${T.red};border-color:${T.red};}

.action-row{display:flex;gap:14px;justify-content:center;padding:6px 0;}
.action-btn{border-radius:50%;border:none;font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;box-shadow:0 4px 20px rgba(0,0,0,.4);}
.action-btn.nope{width:62px;height:62px;background:${T.redDim};border:2px solid ${T.red};}
.action-btn.star{width:48px;height:48px;font-size:18px;background:${T.goldDim};border:2px solid ${T.gold};}
.action-btn.yep{width:62px;height:62px;background:${T.greenDim};border:2px solid ${T.green};}
.action-btn:hover{transform:scale(1.1);}
.action-btn:active{transform:scale(.95);}

.prog-wrap{background:${T.faint};border-radius:100px;height:3px;overflow:hidden;}
.prog-bar{height:100%;background:linear-gradient(90deg,${T.accent},${T.gold});border-radius:100px;transition:width .3s;}

.member-chip{background:${T.card};border:1.5px solid ${T.border};border-radius:100px;padding:6px 13px;font-size:13px;display:flex;align-items:center;gap:6px;}
.dot{width:8px;height:8px;border-radius:50%;}

/* Results */
.result-row{background:${T.card};border-radius:14px;padding:13px 15px;display:flex;align-items:center;gap:12px;border:1.5px solid ${T.border};transition:all .3s;}
.result-row.winner{border-color:${T.gold};background:${T.goldDim};}
.result-bar-bg{flex:1;background:${T.faint};border-radius:100px;height:5px;overflow:hidden;}
.result-bar{height:100%;border-radius:100px;transition:width .7s .1s;background:linear-gradient(90deg,${T.accent},${T.gold});}

/* Waiting / Done screen */
.waiting-screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:24px;}
.waiting-members{display:flex;flex-direction:column;gap:8px;width:100%;max-width:300px;}
.waiting-member{display:flex;align-items:center;gap:10px;background:${T.card};border:1.5px solid ${T.border};border-radius:12px;padding:10px 14px;transition:border-color .3s;}
.waiting-member.done{border-color:${T.green};}
.waiting-member.waiting{border-color:${T.border};}
.member-status{font-size:14px;line-height:1;}
.member-name{font-size:14px;font-weight:500;flex:1;text-align:left;}
.member-progress{font-size:12px;color:${T.muted};}

/* Platforms */
.platform-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.platform-btn{background:${T.card};border:1.5px solid ${T.border};border-radius:12px;padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;transition:all .15s;font-size:11px;color:${T.muted};}
.platform-btn.on{border-color:${T.accent};background:${T.accentDim};color:${T.text};}

.nav-back{background:none;border:none;color:${T.muted};font-size:20px;cursor:pointer;padding:4px 0;align-self:flex-start;line-height:1;}
.tabs{display:flex;gap:6px;}
.tab{flex:1;padding:10px;border-radius:10px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;border:1.5px solid ${T.border};background:transparent;color:${T.muted};cursor:pointer;transition:all .15s;}
.tab.on{background:${T.accent};color:#fff;border-color:${T.accent};}

.nearby-bar{display:flex;align-items:center;gap:8px;padding:10px 14px;background:${T.greenDim};border:1.5px solid rgba(74,222,128,.3);border-radius:12px;font-size:13px;color:${T.green};}
.pulse{width:8px;height:8px;border-radius:50%;background:${T.green};flex-shrink:0;animation:pulse 1.5s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(1.5);}}

.spinner{width:28px;height:28px;border:3px solid ${T.faint};border-top-color:${T.accent};border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;}
@keyframes spin{to{transform:rotate(360deg);}}

.key-status{font-size:11px;padding:4px 8px;border-radius:6px;font-weight:600;}
.key-ok{background:${T.greenDim};color:${T.green};}
.key-missing{background:${T.redDim};color:${T.red};}

@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
.fade-up{animation:fadeUp .3s ease both;}

@keyframes popIn{from{opacity:0;transform:scale(.92);}to{opacity:1;transform:scale(1);}}
.pop-in{animation:popIn .4s cubic-bezier(.34,1.56,.64,1) both;}

.warn{color:${T.gold};font-size:12px;background:${T.goldDim};border:1px solid rgba(255,198,88,.3);border-radius:8px;padding:8px 12px;line-height:1.5;}
.err{color:${T.red};font-size:12px;background:${T.redDim};border:1px solid rgba(248,113,113,.3);border-radius:8px;padding:8px 12px;}

/* Live badge */
.live-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:${T.greenDim};border:1px solid rgba(74,222,128,.3);border-radius:100px;font-size:11px;font-weight:700;color:${T.green};letter-spacing:.5px;}
`;

// ─── PicktLogo ────────────────────────────────────────────────────────────────
// Minimal geometric icon: a rounded square with a thumb-up silhouette
// whose upward stem doubles as a checkmark stroke.
function PicktLogo({ size = 28 }) {
  const iconSize = size * 1.35;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.38 }}>
      {/* Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Rounded square background */}
        <rect width="36" height="36" rx="10" fill="#ff5f6d" />
        {/* Geometric thumbs-up: palm base */}
        <rect x="9" y="19" width="6" height="10" rx="2" fill="white" />
        {/* Thumb body */}
        <path
          d="M16 20.5 C16 18 17.5 15 19.5 13 L21 11.5 C21.8 10.6 23.2 11.2 23.2 12.4 L23.2 15 L25.5 15 C26.6 15 27.4 16.1 27.1 17.2 L25.6 23.2 C25.4 24 24.7 24.5 23.9 24.5 L17 24.5 C16.4 24.5 16 24.1 16 23.5 Z"
          fill="white"
        />
        {/* Checkmark tick overlay on thumb */}
        <polyline
          points="17.5,20 19.5,22.2 24,17"
          stroke="#ff5f6d"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Wordmark */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "-0.5px",
        lineHeight: 1,
        color: "#f0f0f8",
        display: "flex",
        alignItems: "baseline",
        gap: 0,
      }}>
        pick<span style={{ color: "#ff5f6d" }}>t</span>
      </div>
    </div>
  );
}

// ─── SwipeCard ────────────────────────────────────────────────────────────────
function SwipeCard({ item, onVote, stackIndex, onStar, starred }) {
  const startX = useRef(null);
  const curX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const isTop = stackIndex === 0;

  const onStart = x => { startX.current = x; setDragging(true); };
  const onMove = x => {
    if (!dragging || startX.current === null) return;
    curX.current = x - startX.current;
    setOffset(curX.current);
  };
  const onEnd = () => {
    setDragging(false);
    if (Math.abs(curX.current) > 90) onVote(curX.current > 0 ? "yes" : "no");
    setOffset(0); curX.current = 0; startX.current = null;
  };

  const cls = stackIndex === 1 ? "back1" : stackIndex === 2 ? "back2" : "";
  const yesOp = Math.max(0, Math.min(1, offset / 70));
  const noOp  = Math.max(0, Math.min(1, -offset / 70));

  return (
    <div
      className={`swipe-card ${cls}`}
      style={isTop ? {
        transform: `translateX(${offset}px) rotate(${offset * 0.07}deg)`,
        transition: dragging ? "none" : "transform .3s",
        zIndex: 10,
        boxShadow: "0 20px 60px rgba(0,0,0,.6)",
      } : {}}
      onMouseDown={isTop ? e => onStart(e.clientX) : undefined}
      onMouseMove={isTop ? e => onMove(e.clientX) : undefined}
      onMouseUp={isTop ? onEnd : undefined}
      onMouseLeave={isTop ? onEnd : undefined}
      onTouchStart={isTop ? e => onStart(e.touches[0].clientX) : undefined}
      onTouchMove={isTop ? e => onMove(e.touches[0].clientX) : undefined}
      onTouchEnd={isTop ? onEnd : undefined}
    >
      {item.image && (
        <img src={item.image} alt={item.name} className="card-img" draggable={false}
          onError={e => { e.target.style.display = "none"; }} />
      )}
      <div className="vote-overlay yes" style={{ opacity: yesOp }}>YES ✓</div>
      <div className="vote-overlay no"  style={{ opacity: noOp }}>NOPE ✗</div>
      <div className="card-body">
        {!item.image && <div className="card-emoji">{item.emoji || "🍽️"}</div>}
        <div className="card-name">{item.name}</div>
        <div className="card-detail">{item.detail}</div>
        {(item.tags || []).length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
            {item.tags.slice(0, 3).map((t, i) => (
              <span key={i} className="pill" style={{ fontSize: 11, padding: "3px 8px", cursor: "default" }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      {isTop && (
        <button
          onClick={e => { e.stopPropagation(); onStar(item); }}
          style={{ position: "absolute", top: 12, right: 12, zIndex: 20, background: "rgba(0,0,0,.5)", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
        >{starred ? "⭐" : "☆"}</button>
      )}
    </div>
  );
}

// ─── Thumb ────────────────────────────────────────────────────────────────────
function Thumb({ item }) {
  return (
    <div style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: T.faint, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {item.image
        ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display="none"; }} />
        : <span style={{ fontSize: 20 }}>{item.emoji || "🍽️"}</span>}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Firebase ready state — auto-initialises, no user config needed
  const [fbReady, setFbReady] = useState(false);

  // Navigation
  const [screen, setScreen] = useState("home");

  // Identity
  const [userName, setUserName] = useState(() => ls.get("gs_name", ""));
  const userId = useRef(ls.get("gs_uid", null) || (() => {
    const id = Math.random().toString(36).substr(2, 10);
    ls.set("gs_uid", id); return id;
  })());

  // Preferences
  const [radius,    setRadius]    = useState(() => ls.get("gs_radius", 5000));
  const [platforms, setPlatforms] = useState(() => ls.get("gs_platforms", []));
  const [ratings,   setRatings]   = useState(() => ls.get("gs_ratings", ["G","PG","PG-13","R"]));
  const [starred,   setStarred]   = useState(() => ls.get("gs_starred", []));
  const [savedCustoms, setSavedCustoms] = useState(() => ls.get("gs_customs", []));

  // Session
  const [role,     setRole]     = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  // (nearby feature removed — was a non-functional placeholder)
  const [category, setCategory] = useState("food");
  const [itemCount, setItemCount] = useState(20); // how many API items to pull; -1 = infinite
  const [options,  setOptions]  = useState([]);
  const optionsRef = useRef([]); // always-current options for async handlers
  const [cardIndex,setCardIndex]= useState(0);
  const [voteHistory, setVoteHistory] = useState([]); // [{optId, vote}] for undo
  const [myVotes,  setMyVotes]  = useState({});   // this user's votes { optId: 0|1 }
  const [sessionCustoms,   setSessionCustoms]   = useState([]);
  const [loadedCustomIds,  setLoadedCustomIds]  = useState([]);
  const [customInput,      setCustomInput]      = useState("");
  const [swipeCustomInput, setSwipeCustomInput] = useState(""); // mid-swipe add item
  const [showSwipeAdd,     setShowSwipeAdd]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [loadErr,  setLoadErr]  = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  // Firebase / sync state
  const [roomMembers,  setRoomMembers]  = useState({});  // { uid: { name, done, voteCount } }
  const [groupVotes,   setGroupVotes]   = useState({});  // { optId: totalVotes }
  const [allDone,      setAllDone]      = useState(false);
  const [roundEnded,   setRoundEnded]   = useState(false); // host force-ended for everyone
  const roomRef = useRef(null);
  const nextPageTokenRef = useRef(""); // Google Places pagination cursor
  const moviePageRef = useRef(1);      // TMDB page cursor

  // Persist prefs
  useEffect(() => { ls.set("gs_name", userName); }, [userName]);
  useEffect(() => { ls.set("gs_platforms", platforms); }, [platforms]);
  useEffect(() => { ls.set("gs_ratings", ratings); }, [ratings]);
  useEffect(() => { ls.set("gs_starred", starred); }, [starred]);
  useEffect(() => { ls.set("gs_customs", savedCustoms); }, [savedCustoms]);

  const saveRadius = r => { setRadius(r); ls.set("gs_radius", r); };



  // ── Firebase helpers ──────────────────────────────────────────────────────
  // Auto-init Firebase on mount
  useEffect(() => {
    initFirebase().then(db => { if (db) setFbReady(true); });
  }, []);

  // Keep optionsRef in sync so async handlers always see latest options
  useEffect(() => { optionsRef.current = options; }, [options]);

  // Subscribe to room once roomCode is set
  useEffect(() => {
    if (!roomCode || !fbReady || !_db) return;
    const roomDocRef = _fsDoc(_db, "rooms", roomCode);
    roomRef.current = roomDocRef;

    const unsubscribe = _fsOnSnapshot(roomDocRef, snapshot => {
      const data = snapshot.data();
      if (!data) return;

      // Update members
      if (data.members) setRoomMembers(data.members);

      // Aggregate votes from all members
      if (data.members) {
        const totals = {};
        Object.values(data.members).forEach(m => {
          if (m.votes) {
            Object.entries(m.votes).forEach(([optId, v]) => {
              totals[optId] = (totals[optId] || 0) + (v || 0);
            });
          }
        });
        setGroupVotes(totals);

        // Check if everyone is done
        const memberList = Object.values(data.members);
        if (memberList.length > 1 && memberList.every(m => m.done)) {
          setAllDone(true);
        }
      }

      // Host ended round for everyone
      if (data.roundEnded) {
        setRoundEnded(true);
        // We handle the screen transition in a separate useEffect to avoid stale state issues
      }

      // Sync options list; always accept if incoming is longer
      if (data.options) {
        setOptions(prev => data.options.length >= prev.length ? data.options : prev);
      }
    });

    return () => unsubscribe();
  }, [roomCode, fbReady]);

  // Handle forced end of round
  useEffect(() => {
    if (roundEnded && (screen === "swipe" || screen === "lobby" || screen === "more")) {
      setScreen("waiting");
    }
  }, [roundEnded, screen]);

  // Passive database cleanup (deletes rooms > 1hr old when a new room is created)
  const cleanupOldRooms = async (db) => {
    if (!_fsQuery || !_fsCollection || !_fsGetDocs || !_fsDeleteDoc) return;
    try {
      const oneHourAgo = Date.now() - 3600000;
      const q = _fsQuery(_fsCollection(db, "rooms"), _fsWhere("createdAt", "<", oneHourAgo));
      const snapshot = await _fsGetDocs(q);
      snapshot.forEach(docSnap => {
        _fsDeleteDoc(docSnap.ref);
      });
    } catch (e) { console.warn("Cleanup failed:", e); }
  };

  // ── API fetchers (call Vercel proxy functions — keys stay server-side) ───────
  const fetchRestaurants = async (pagetoken = "") => {
    const loc = await new Promise((res, rej) =>
      navigator.geolocation
        ? navigator.geolocation.getCurrentPosition(
            p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => rej("Location access denied"))
        : rej("Geolocation not supported")
    );
    const params = new URLSearchParams({ lat: loc.lat, lng: loc.lng, radius });
    if (pagetoken) params.set("pagetoken", pagetoken);
    const r = await fetch(`${API_BASE}/api/restaurants?${params}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    if (!d.results?.length) throw new Error("No restaurants found — try a larger radius");
    // Store the next-page cursor for subsequent Load More calls
    nextPageTokenRef.current = d.nextPageToken || "";
    return d.results.map(p => ({
      id: p.id, name: p.name, emoji: "🍽️",
      image: p.photoRef ? `${API_BASE}/api/place-photo?ref=${encodeURIComponent(p.photoRef)}&maxwidth=400` : null,
      detail: `${p.vicinity} · ${p.rating ? p.rating + "★" : "No rating"}`,
      tags: [p.priceLevel ? "$".repeat(p.priceLevel) : "$$", ...(p.types?.slice(0,2).map(t=>t.replace(/_/g," ")) || [])],
      category: "food",
    }));
  };

  const fetchMovies = async (page) => {
    const p = page || (Math.ceil(Math.random() * 10));
    const params = new URLSearchParams({
      ratings: ratings.join("|"),
      page: String(p),
      ...(platforms.length ? { providers: platforms.join("|") } : {}),
    });
    const r = await fetch(`${API_BASE}/api/movies?${params}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    if (!d.results?.length) throw new Error("No movies found — try different filters");
    return d.results.map(m => ({
      id: m.id, name: m.name, emoji: "🎬",
      image: m.posterPath ? `https://image.tmdb.org/t/p/w400${m.posterPath}` : null,
      detail: `${m.year || "—"} · ${m.rating ? m.rating + "★" : ""}`,
      tags: ["Movie"], category: "movies",
    }));
  };

  // ── Session start ─────────────────────────────────────────────────────────
  const startSession = async () => {
    setLoading(true); setLoadErr("");
    // Reset pagination cursors for this new session
    nextPageTokenRef.current = "";
    moviePageRef.current = 1;

    let fetched = [];
    try {
      if (category === "food") fetched = await fetchRestaurants();
      else if (category === "movies") fetched = await fetchMovies(1);
      // "custom" category: no API fetch — user-supplied items only
    } catch(e) { setLoadErr(e.message); }

    // Passive cleanup
    const db = await initFirebase();
    if (db) cleanupOldRooms(db);

    const customs = sessionCustoms.map(c => ({ ...c, category }));

    // Inject starred items of this category that aren't already in the fetched list
    const starredForCategory = starred
      .filter(s => s.category === category && !fetched.find(f => f.id === s.id))
      .map(s => ({ ...s, fromStarred: true }));

    const all = [...starredForCategory, ...fetched, ...customs];
    setOptions(all);
    setVoteHistory([]);

    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    setRoomCode(code);
    setRole("host");
    setMyVotes({});
    setGroupVotes({});
    setRoomMembers({});
    setAllDone(false);
    setCardIndex(0);

    // Write room to Firestore
    if (db) {
      await _fsSetDoc(_fsDoc(db, "rooms", code), {
        createdAt: Date.now(),
        category,
        options: all,
        roundEnded: false, // Explicitly init roundEnded flag
        members: {
          [userId.current]: {
            name: userName || "Host",
            done: false,
            voteCount: 0,
            votes: {},
          }
        }
      });
    }

    setLoading(false);
    setScreen("lobby");
  };

  // ── Load more items (host only) ────────────────────────────────────────────
  // Returns the number of new items added
  const handleLoadMore = async () => {
    setLoadingMore(true);
    let fetched = [];
    try {
      if (category === "food") {
        // Pass the stored pagetoken so Google returns the next page of results
        fetched = await fetchRestaurants(nextPageTokenRef.current);
      } else if (category === "movies") {
        // Increment the page cursor so TMDB returns a different set
        moviePageRef.current += 1;
        fetched = await fetchMovies(moviePageRef.current);
      }
    } catch(e) { setLoadingMore(false); return 0; }
    // Use ref to get truly current options (avoids stale closure)
    const current = optionsRef.current;
    const newItems = fetched.filter(f => !current.find(o => o.id === f.id));
    const updated = [...current, ...newItems];
    setOptions(updated);
    if (fbReady && _db && roomCode) {
      await _fsUpdateDoc(_fsDoc(_db, "rooms", roomCode), { options: updated });
    }
    setLoadingMore(false);
    return newItems.length;
  };

  // ── Host: end round for everyone ──────────────────────────────────────────
  const handleEndRound = async () => {
    setRoundEnded(true);
    if (fbReady && _db && roomCode) {
      await _fsUpdateDoc(_fsDoc(_db, "rooms", roomCode), { roundEnded: true });
    }
    setScreen("waiting");
  };

  const joinSession = async () => {
    if (joinCode.length < 4) return;
    
    const code = joinCode.toUpperCase();
    setRoomCode(code);
    setRole("guest");
    setMyVotes({});
    setGroupVotes({});
    setAllDone(false);
    setCardIndex(0);

    // Register as member in Firestore
    const db = await initFirebase();
    if (db) {
      await _fsUpdateDoc(_fsDoc(db, "rooms", code), {
        [`members.${userId.current}`]: {
          name: userName || "Guest",
          done: false,
          voteCount: 0,
          votes: {},
        },
      });
    }
    setScreen("lobby");
  };

  // ── Voting ────────────────────────────────────────────────────────────────
  const handleVote = async dir => {
    const opt = options[cardIndex];
    const vote = dir === "yes" ? 1 : 0;
    const newVotes = { ...myVotes, [opt.id]: vote };
    setMyVotes(newVotes);
    setVoteHistory(h => [...h, { optId: opt.id, prevVote: myVotes[opt.id] }]);

    const nextIndex = cardIndex + 1;
    const isLast = nextIndex >= options.length;
    // Infinite mode: host chose "until I say stop" OR round was force-ended externally
    const goToMore = isLast && itemCount === -1 && category !== "custom" && !roundEnded;
    const done = isLast && !goToMore;

    // Write vote to Firestore
    if (fbReady && _db && roomCode) {
      await _fsUpdateDoc(_fsDoc(_db, "rooms", roomCode), {
        [`members.${userId.current}.votes`]: newVotes,
        [`members.${userId.current}.voteCount`]: nextIndex,
        [`members.${userId.current}.done`]: done,
      });
    }

    if (goToMore) setScreen("more");
    else if (done) setScreen("waiting");
    else setCardIndex(nextIndex);
  };

  // ── Undo last vote ────────────────────────────────────────────────────────
  const handleUndo = async () => {
    if (voteHistory.length === 0 || cardIndex === 0) return;
    const last = voteHistory[voteHistory.length - 1];
    const newHistory = voteHistory.slice(0, -1);
    const newVotes = { ...myVotes };
    if (last.prevVote === undefined) delete newVotes[last.optId];
    else newVotes[last.optId] = last.prevVote;
    const prevIndex = cardIndex - 1;
    setVoteHistory(newHistory);
    setMyVotes(newVotes);
    setCardIndex(prevIndex);
    if (fbReady && _db && roomCode) {
      await _fsUpdateDoc(_fsDoc(_db, "rooms", roomCode), {
        [`members.${userId.current}.votes`]: newVotes,
        [`members.${userId.current}.voteCount`]: prevIndex,
        [`members.${userId.current}.done`]: false,
      });
    }
  };

  // ── Skip remaining ────────────────────────────────────────────────────────
  const handleSkipRemaining = async () => {
    if (fbReady && _db && roomCode) {
      await _fsUpdateDoc(_fsDoc(_db, "rooms", roomCode), {
        [`members.${userId.current}.voteCount`]: options.length,
        [`members.${userId.current}.done`]: true,
      });
    }
    setScreen("waiting");
  };

  // ── Stars ─────────────────────────────────────────────────────────────────
  const toggleStar = item => setStarred(prev =>
    prev.find(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [{ ...item, starredAt: Date.now() }, ...prev]
  );
  const isStarred = item => starred.some(s => s.id === item?.id);

  // ── Custom options ────────────────────────────────────────────────────────
  const addCustom = () => {
    if (!customInput.trim()) return;
    const catEmoji = category==="food"?"🍽️":category==="movies"?"🎬":"✨";
    const opt = { id: `custom_${Date.now()}`, name: customInput.trim(), emoji: catEmoji, detail:"Custom option", tags:["Custom"], category };
    setSessionCustoms(c => [...c, opt]);
    setCustomInput("");
  };

  // Add a custom item mid-session (lobby or swipe screen) — syncs to all via Firestore
  const addCustomDuringSession = async (text) => {
    const val = (text || customInput).trim();
    if (!val) return;
    const catEmoji = category==="food"?"🍽️":category==="movies"?"🎬":"✨";
    const opt = { id: `custom_${Date.now()}`, name: val, emoji: catEmoji, detail:"Added by member", tags:["Custom"], category };
    const current = optionsRef.current;
    const updated = [...current, opt];
    setOptions(updated);
    setCustomInput("");
    setSwipeCustomInput("");
    if (fbReady && _db && roomCode) {
      await _fsUpdateDoc(_fsDoc(_db, "rooms", roomCode), { options: updated });
    }
  };

  const saveCustom = opt => setSavedCustoms(prev => prev.find(o=>o.name===opt.name) ? prev : [opt,...prev]);
  const toggleLoadSaved = opt => {
    if (loadedCustomIds.includes(opt.id)) {
      setLoadedCustomIds(ids => ids.filter(i=>i!==opt.id));
      setSessionCustoms(c => c.filter(o=>o.id!==opt.id));
    } else {
      setLoadedCustomIds(ids=>[...ids,opt.id]);
      setSessionCustoms(c=>[...c,{...opt}]);
    }
  };

  // ── Derived results (sorted by group votes descending) ────────────────────
  const sortedResults = [...options]
    .map(o => ({ ...o, score: groupVotes[o.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...sortedResults.map(o => o.score), 1);
  const totalMembers = Object.keys(roomMembers).length;
  const doneMembers  = Object.values(roomMembers).filter(m => m.done).length;

  const resetSession = () => {
    setScreen("home"); setOptions([]); setCardIndex(0);
    setMyVotes({}); setGroupVotes({}); setRoomMembers({});
    setRoomCode(""); setJoinCode(""); setAllDone(false);
    setSessionCustoms([]); setLoadedCustomIds([]);
    setVoteHistory([]); setRoundEnded(false);
  };

  const leaveSession = () => {
    setScreen("home"); setOptions([]); setCardIndex(0);
    setMyVotes({}); setGroupVotes({}); setRoomMembers({});
    setRoomCode(""); setJoinCode(""); setAllDone(false);
    setSessionCustoms([]); setLoadedCustomIds([]);
    setVoteHistory([]); setRoundEnded(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">

        {/* ══ HOME ══════════════════════════════════════════════════════════ */}
        {screen === "home" && (
          <div className="screen fade-up" style={{ justifyContent: "space-between", paddingTop: 52 }}>
            <div>
              <PicktLogo size={32} />
              <div className="tagline" style={{ marginTop: 6 }}>stop arguing. start swiping.</div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 84, filter: "drop-shadow(0 8px 32px rgba(255,95,109,.35))", lineHeight: 1, textAlign: "center" }}>🍕🎬</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => setScreen("create")}>Create a Room</button>
              <button className="btn btn-secondary" onClick={() => setScreen("join")}>Join a Room</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setScreen("starred")}>⭐ Starred ({starred.length})</button>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setScreen("settings")}>⚙️ Settings</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ CREATE ════════════════════════════════════════════════════════ */}
        {screen === "create" && (
          <div className="screen fade-up">
            <button className="nav-back" onClick={() => setScreen("home")}>←</button>
            <div><div className="logo">new room</div><div className="tagline" style={{ marginTop: 4 }}>configure your session</div></div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="label">Your name</div>
              <input className="input" placeholder="e.g. Alex" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="label">Category</div>
              <div className="tabs">
                <button className={`tab ${category==="food"?"on":""}`} onClick={() => setCategory("food")}>🍽️ Food</button>
                <button className={`tab ${category==="movies"?"on":""}`} onClick={() => setCategory("movies")}>🎬 Movies</button>
                <button className={`tab ${category==="custom"?"on":""}`} onClick={() => setCategory("custom")}>✏️ Build Your Own</button>
              </div>
              {category === "custom" && (
                <div className="warn" style={{ fontSize: 12 }}>✨ You'll add your own items below. Everyone in the room votes on your list!</div>
              )}
            </div>

            {(category === "food" || category === "movies") && (
              <div className="surface-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="label">How many options to pull?</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[10, 20, 30, 50].map(n => (
                    <span key={n} className={`pill ${itemCount === n ? "on" : ""}`} onClick={() => setItemCount(n)}>{n}</span>
                  ))}
                  <span className={`pill ${itemCount === -1 ? "gold-on" : ""}`} onClick={() => setItemCount(-1)}>♾️ Until I say stop</span>
                </div>
                {itemCount === -1 && <div style={{ color: T.muted, fontSize: 12 }}>New cards keep loading after each batch — you control when to end.</div>}
              </div>
            )}

            {category === "food" && (
              <div className="surface-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="label">Search radius</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {RADIUS_OPTIONS.map(r => (
                    <span key={r.value} className={`pill ${radius===r.value?"on":""}`} onClick={() => saveRadius(r.value)}>{r.label}</span>
                  ))}
                </div>
                <div style={{ color: T.muted, fontSize: 12 }}>✓ Saved for future sessions</div>
              </div>
            )}

            {category === "movies" && (
              <div className="surface-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>Streaming platforms</div>
                  <div className="platform-grid">
                    {STREAMING_PLATFORMS.map(p => (
                      <div key={p.id} className={`platform-btn ${platforms.includes(p.id)?"on":""}`}
                        onClick={() => setPlatforms(prev => prev.includes(p.id) ? prev.filter(x=>x!==p.id) : [...prev,p.id])}>
                        <span style={{ fontSize: 22 }}>{p.emoji}</span><span>{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>Acceptable ratings</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {RATINGS.map(r => (
                      <span key={r} className={`pill ${ratings.includes(r)?"on":""}`}
                        onClick={() => setRatings(prev => prev.includes(r) ? prev.filter(x=>x!==r) : [...prev,r])}>{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="label">Custom options</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" style={{ flex: 1 }} placeholder={category==="food"?"e.g. Thai Kitchen":"e.g. Interstellar"}
                  value={customInput} onChange={e => setCustomInput(e.target.value)} onKeyDown={e => e.key==="Enter" && addCustom()} />
                <button className="btn btn-primary btn-sm" style={{ width: 46, padding: 0, fontSize: 22 }} onClick={addCustom}>+</button>
              </div>
              {sessionCustoms.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sessionCustoms.map(o => (
                    <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, background: T.faint, borderRadius: 12, padding: "10px 14px" }}>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{o.emoji} {o.name}</span>
                      <button style={{ background: T.goldDim, border: `1px solid ${T.gold}`, borderRadius: 8, padding: "5px 10px", color: T.gold, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
                        onClick={() => saveCustom(o)}>💾 Save</button>
                      <button style={{ background: T.redDim, border: `1px solid ${T.red}`, borderRadius: 8, padding: "5px 10px", color: T.red, fontSize: 12, cursor: "pointer" }}
                        onClick={() => setSessionCustoms(c => c.filter(x => x.id !== o.id))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {savedCustoms.filter(o => o.category === category).length > 0 && (
                <div>
                  <div className="label" style={{ marginBottom: 6 }}>Load saved options</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {savedCustoms.filter(o => o.category === category).map(o => (
                      <span key={o.id} className={`pill ${loadedCustomIds.includes(o.id)?"gold-on":""}`} onClick={() => toggleLoadSaved(o)}>
                        {loadedCustomIds.includes(o.id) ? "✓ " : ""}{o.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {loadErr && <div className="err">{loadErr}</div>}
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={startSession} disabled={loading || (category === "custom" && sessionCustoms.length === 0)}>
              {loading ? "Loading options…" : category === "custom" ? "Let's make a decision! →" : "Create Room →"}
            </button>
            {category === "custom" && sessionCustoms.length === 0 && (
              <div style={{ color: T.muted, fontSize: 12, textAlign: "center" }}>Add at least one item above to get started</div>
            )}
            {loading && <div className="spinner" style={{ marginTop: -8 }} />}
          </div>
        )}

        {/* ══ JOIN ══════════════════════════════════════════════════════════ */}
        {screen === "join" && (
          <div className="screen fade-up">
            <button className="nav-back" onClick={() => setScreen("home")}>←</button>
            <div><div className="logo">join room</div><div className="tagline" style={{ marginTop: 4 }}>enter your friend's code</div></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="label">Room code</div>
              <input className="input" placeholder="XXXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                style={{ textTransform: "uppercase", letterSpacing: 6, fontSize: 22, textAlign: "center" }} maxLength={6} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="label">Your name</div>
              <input className="input" placeholder="e.g. Jamie" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
            {loadErr && <div className="err">{loadErr}</div>}
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={joinSession} disabled={joinCode.length < 4}>
              Join Room →
            </button>
          </div>
        )}

        {/* ══ LOBBY ═════════════════════════════════════════════════════════ */}
        {screen === "lobby" && (
          <div className="screen fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="logo">lobby</div>
              <span className="pill on">{role==="host"?"👑 Host":"🙋 Guest"}</span>
            </div>
            <div className="surface-card" style={{ textAlign: "center" }}>
              <div className="label">Room Code</div>
              <div className="room-code" style={{ marginTop: 6 }}>{roomCode}</div>
              <div style={{ color: T.muted, fontSize: 12, marginTop: 4 }}>Share with your group</div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Members ({totalMembers})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.values(roomMembers).map((m, i) => (
                  <div key={i} className="member-chip"><div className="dot" style={{ background: T.green }} />{m.name}</div>
                ))}
                {totalMembers === 0 && <div className="member-chip"><div className="dot" style={{ background: T.green }} />{userName || "You"} 👑</div>}
                <div className="member-chip" style={{ opacity: .35, borderStyle: "dashed" }}>+ waiting…</div>
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Session</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="pill">{category==="food"?"🍽️ Food":category==="movies"?"🎬 Movies":"✨ Custom"}</span>
                <span className="pill">{options.length} options</span>
                {category==="food" && <span className="pill">{RADIUS_OPTIONS.find(r=>r.value===radius)?.label}</span>}
              </div>
            </div>
            {options.length === 0 && !loading && (
              <div className="warn">No options loaded. Add custom options or check API keys in Settings.</div>
            )}
            {/* Any member can suggest items that sync to everyone */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="label">Suggest an item for the group</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" style={{ flex: 1 }} placeholder="Add to everyone's list…"
                  value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && addCustomDuringSession()} />
                <button className="btn btn-primary btn-sm" style={{ width: 46, padding: 0, fontSize: 22 }} onClick={addCustomDuringSession}>+</button>
              </div>
              <div style={{ color: T.muted, fontSize: 12 }}>Items you add here will appear on everyone's swipe deck 🎉</div>
            </div>
            <div style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => setScreen("swipe")} disabled={options.length === 0}>
              {role==="host" ? "Let's make a decision! →" : "I'm Ready →"}
            </button>
          </div>
        )}

        {/* ══ SWIPE ═════════════════════════════════════════════════════════ */}
        {screen === "swipe" && (
          <div className="screen fade-up" style={{ gap: 10, overflow: "hidden", paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <PicktLogo size={20} />
              <span className="pill">{cardIndex + 1} / {options.length}</span>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: 12, padding: "7px 12px" }}
                onClick={handleSkipRemaining}>Skip remaining →</button>
            </div>
            <div className="prog-wrap"><div className="prog-bar" style={{ width: `${(cardIndex / options.length) * 100}%` }} /></div>
            <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
              <div className="card-stack">
                {[0,1,2].map(off => {
                  const idx = cardIndex + off;
                  if (idx >= options.length) return null;
                  return <SwipeCard key={options[idx].id} item={options[idx]} onVote={off===0 ? handleVote : undefined}
                    stackIndex={off} onStar={toggleStar} starred={isStarred(options[idx])} />;
                })}
              </div>
            </div>
            <div style={{ color: T.muted, fontSize: 12, textAlign: "center" }}>← skip &nbsp;·&nbsp; ☆ star &nbsp;·&nbsp; vote →</div>
            <div className="action-row">
              <button className="action-btn nope" onClick={() => handleVote("no")}>✗</button>
              <button className="action-btn star" onClick={() => options[cardIndex] && toggleStar(options[cardIndex])}>{isStarred(options[cardIndex])?"⭐":"☆"}</button>
              <button className="action-btn yep"  onClick={() => handleVote("yes")}>✓</button>
            </div>
            {/* Mid-swipe add item */}
            {showSwipeAdd ? (
              <div style={{ display: "flex", gap: 8, animation: "fadeUp .2s ease both" }}>
                <input className="input" style={{ flex: 1, fontSize: 14, padding: "10px 13px" }}
                  placeholder="Add item for everyone…"
                  value={swipeCustomInput} onChange={e => setSwipeCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { addCustomDuringSession(swipeCustomInput); setShowSwipeAdd(false); } }}
                  autoFocus />
                <button className="btn btn-primary btn-sm" style={{ padding: "0 14px", fontSize: 20 }}
                  onClick={() => { addCustomDuringSession(swipeCustomInput); setShowSwipeAdd(false); }}>+</button>
                <button style={{ background: "none", border: "none", color: T.muted, fontSize: 20, cursor: "pointer", padding: "0 4px" }}
                  onClick={() => setShowSwipeAdd(false)}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 2 }}>
                <button
                  onClick={handleUndo}
                  disabled={voteHistory.length === 0}
                  style={{ background: "none", border: `1.5px solid ${voteHistory.length > 0 ? T.border : T.faint}`, borderRadius: 10, padding: "7px 14px", color: voteHistory.length > 0 ? T.muted : T.faint, fontSize: 13, cursor: voteHistory.length > 0 ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}
                >↩ Undo</button>
                <button
                  onClick={() => setShowSwipeAdd(true)}
                  style={{ background: "none", border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "7px 14px", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}
                >+ Add item</button>
                <button
                  onClick={leaveSession}
                  style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: 0.7 }}
                >🚪 Leave</button>
              </div>
            )}
          </div>
        )}

        {/* ══ MORE? ══════════════════════════════════════════════════════════ */}
        {screen === "more" && (
          <div className="screen fade-up" style={{ justifyContent: "center", gap: 20, textAlign: "center" }}>
            <div style={{ fontSize: 56 }}>🔄</div>
            <div>
              <div style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>You've seen everything!</div>
              <div style={{ color: T.muted, fontSize: 14, lineHeight: 1.6 }}>Want to keep going? Load another batch, or wrap it up and see the results.</div>
            </div>
            {role === "host" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                <button className="btn btn-primary" onClick={async () => {
                  const n = await handleLoadMore();
                  if (n > 0) { setCardIndex(optionsRef.current.length - n); setScreen("swipe"); }
                  else setScreen("swipe");
                }} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "🔄 Load more options"}
                </button>
                <button className="btn btn-secondary" onClick={handleEndRound}>🏁 End for everyone</button>
                <button style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer" }} onClick={() => setScreen("results")}>See results early →</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                <div className="warn">Waiting for the host to load more or end the round.</div>
                <button className="btn btn-secondary" onClick={() => setScreen("waiting")}>Go to waiting room →</button>
                <button style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer" }} onClick={() => setScreen("results")}>See results early →</button>
              </div>
            )}
          </div>
        )}

        {/* ══ WAITING ═══════════════════════════════════════════════════════ */}
        {screen === "waiting" && (
          <div className="screen fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="logo" style={{ fontSize: 20 }}>waiting…</div>
              <span className="live-badge"><div className="pulse" />LIVE</span>
            </div>

            <div className="surface-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
              <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>You're done!</div>
              <div style={{ color: T.muted, fontSize: 13 }}>Waiting for the rest of the group…</div>
            </div>

            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                Group progress — {doneMembers} / {totalMembers || 1} done
              </div>
              <div className="waiting-members">
                {Object.entries(roomMembers).length > 0
                  ? Object.entries(roomMembers).map(([uid, m]) => (
                    <div key={uid} className={`waiting-member ${m.done ? "done" : "waiting"}`}>
                      <div className="member-status">{m.done ? "✅" : "⏳"}</div>
                      <div className="member-name">{m.name}{uid === userId.current ? " (you)" : ""}</div>
                      <div className="member-progress">{m.done ? "Done" : `${m.voteCount || 0} / ${options.length}`}</div>
                    </div>
                  ))
                  : (
                    <div className="waiting-member done">
                      <div className="member-status">✅</div>
                      <div className="member-name">{userName || "You"} (you)</div>
                      <div className="member-progress">Done</div>
                    </div>
                  )
                }
              </div>
            </div>

            {/* Live preview of top picks so far */}
            {sortedResults.filter(o => o.score > 0).length > 0 && (
              <div>
                <div className="label" style={{ marginBottom: 8 }}>Top picks so far</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sortedResults.filter(o => o.score > 0).slice(0, 3).map((o, i) => (
                    <div key={o.id} className={`result-row ${i===0?"winner":""}`} style={{ animation: `fadeUp .3s ${i*0.1}s both` }}>
                      <Thumb item={o} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
                          <span style={{ color: i===0 ? T.gold : T.muted, fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 4 }}>{o.score} vote{o.score!==1?"s":""}</span>
                        </div>
                        <div className="result-bar-bg"><div className="result-bar" style={{ width: `${(o.score/maxScore)*100}%` }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ flex: 1 }} />
            <button
              className={`btn ${(allDone || roundEnded) ? "btn-primary pop-in" : "btn-secondary"}`}
              onClick={() => setScreen("results")}
            >
              {(allDone || roundEnded) ? "🎊 Everyone's done — See Results!" : "See Results Early →"}
            </button>
            {role === "host" && (
              <button className="btn btn-secondary" onClick={handleEndRound}>🏁 End round for everyone</button>
            )}
            <button onClick={leaveSession} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", textAlign: "center", paddingBottom: 4 }}>🚪 Leave decision</button>
          </div>
        )}

        {/* ══ RESULTS ═══════════════════════════════════════════════════════ */}
        {screen === "results" && (
          <div className="screen fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="logo">results</div>
                <div className="tagline" style={{ marginTop: 4 }}>sorted by group votes</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, color: T.gold }}>{doneMembers}<span style={{ fontSize: 14, color: T.muted, fontWeight: 400 }}>/{totalMembers || 1}</span></div>
                <div style={{ color: T.muted, fontSize: 11 }}>members done</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, overflowY: "auto" }}>
              {sortedResults.map((o, i) => (
                <div key={o.id} className={`result-row ${i===0 && o.score > 0 ? "winner" : ""}`}
                  style={{ animation: `fadeUp .25s ${i*0.05}s both` }}>
                  <Thumb item={o} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
                      <span style={{ color: i===0 && o.score>0 ? T.gold : T.muted, fontSize: 13, fontWeight: 700, flexShrink: 0, marginLeft: 4 }}>
                        {o.score} vote{o.score!==1?"s":""}
                      </span>
                    </div>
                    <div className="result-bar-bg">
                      <div className="result-bar" style={{ width: `${(o.score/maxScore)*100}%` }} />
                    </div>
                  </div>
                  <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, flexShrink:0 }}
                    onClick={() => toggleStar(o)}>{isStarred(o)?"⭐":"☆"}</button>
                  {i===0 && o.score>0 && <span>🏆</span>}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Back to swiping if cards remain */}
              {cardIndex < options.length && options.length > 0 && (
                <button className="btn btn-secondary" onClick={() => setScreen("swipe")}>← Back to swiping</button>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setScreen("starred")}>⭐ Starred</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={resetSession}>New Decision ✨</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ STARRED ═══════════════════════════════════════════════════════ */}
        {screen === "starred" && (
          <div className="screen fade-up">
            <button className="nav-back" onClick={() => setScreen("home")}>←</button>
            <div><div className="logo">starred</div><div className="tagline" style={{ marginTop: 4 }}>your saved favourites</div></div>
            {starred.length === 0
              ? <div style={{ color: T.muted, textAlign: "center", marginTop: 48, fontSize: 14 }}>No starred items yet.<br/>Tap ☆ while swiping to save favourites.</div>
              : starred.map(o => (
                <div key={o.id} className="result-row">
                  <Thumb item={o} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.name}</div>
                    <div style={{ color: T.muted, fontSize: 12 }}>{o.detail}</div>
                  </div>
                  <span className="pill" style={{ fontSize: 11 }}>{o.category==="food"?"🍽️":"🎬"}</span>
                  <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:18 }} onClick={() => toggleStar(o)}>⭐</button>
                </div>
              ))
            }
          </div>
        )}

        {/* ══ SETTINGS ══════════════════════════════════════════════════════ */}
        {screen === "settings" && (
          <div className="screen fade-up">
            <button className="nav-back" onClick={() => setScreen("home")}>←</button>
            <div><div className="logo">settings</div><div className="tagline" style={{ marginTop: 4 }}>saved data & preferences</div></div>

            <div className="surface-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="label">Saved Custom Options ({savedCustoms.length})</div>
              {savedCustoms.length === 0
                ? <div style={{ color: T.muted, fontSize: 13 }}>None yet. Tap 💾 next to a custom option when creating a room.</div>
                : <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {savedCustoms.map(o => (
                      <span key={o.id} className="pill" style={{ display:"flex", gap:4, alignItems:"center" }}>
                        {o.name} <span style={{ opacity:.5, cursor:"pointer" }} onClick={() => setSavedCustoms(c=>c.filter(x=>x.id!==o.id))}>✕</span>
                      </span>
                    ))}
                  </div>
              }
            </div>

            <div className="surface-card">
              <div className="label" style={{ marginBottom: 10 }}>Data</div>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                if (confirm("Clear all starred items and saved custom options?")) { setStarred([]); setSavedCustoms([]); }
              }}>Clear starred & saved options</button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
