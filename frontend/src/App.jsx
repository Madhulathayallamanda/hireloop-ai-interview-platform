import { useState, useEffect, useRef } from 'react';
import { authAPI, sessionAPI, questionAPI, userAPI, evaluateAPI } from './api';

// ─── Design Tokens ────────────────────────────────────────
const C = {
  bg: '#05090F', panel: '#0A1020', card: '#0E1628',
  border: '#182540', borderHover: '#2A4070',
  cyan: '#00D4FF', cyanDim: '#0099BB', cyanGlow: 'rgba(0,212,255,0.12)',
  green: '#00E5A0', red: '#FF4D6A', yellow: '#FFB830', purple: '#A855F7',
  text: '#DDE8F8', muted: '#5A6E90', dim: '#2A3A55',
};

const ROLES = [
  { id: 'swe', label: 'Software Engineer', icon: '⚡' },
  { id: 'pm',  label: 'Product Manager',   icon: '🎯' },
  { id: 'ds',  label: 'Data Scientist',     icon: '📊' },
  { id: 'ml',  label: 'ML Engineer',        icon: '🧠' },
  { id: 'design', label: 'UX Designer',     icon: '✦' },
  { id: 'devops', label: 'DevOps / SRE',    icon: '⚙️' },
];
const COMPANIES = ['Google','Meta','Amazon','Apple','Microsoft','Stripe','Airbnb','Netflix','OpenAI','Figma'];

// ─── Local question bank (fallback when DB is empty) ─────
const LOCAL_QUESTIONS = {
  swe: {
    Behavioral: ['Tell me about a time you delivered under extreme time pressure.','Describe a disagreement with your tech lead.','Walk me through a critical production incident you resolved.'],
    Technical:  ['Design a URL shortener like bit.ly. Scale to 10M users.','Implement a distributed rate limiter for 100K req/sec.','Design a distributed cache with consistency guarantees.'],
    Coding:     ['Implement an LRU Cache with O(1) get and put.','Find two numbers in array that sum to target.','Serialize and deserialize a binary tree.'],
  },
  pm: { Behavioral: ['Tell me about a product you shipped that failed.','Describe a time you said no to a key stakeholder.'], Technical: ['How would you improve Google Maps?','How would you measure success of a new onboarding flow?'], Coding: [] },
  ds: { Behavioral: ['Tell me when your analysis drove a major business decision.'], Technical: ['Explain bias-variance tradeoff with a concrete example.','Build a churn prediction model.'], Coding: [] },
  ml: { Behavioral: ['Walk me through the most complex ML system you built.'], Technical: ['Explain the transformer architecture.','Reduce inference latency of a 70B LLM by 10x.'], Coding: [] },
  design: { Behavioral: ['Walk me through pushing back on engineering constraints.'], Technical: ['Redesign the e-commerce checkout flow.'], Coding: [] },
  devops: { Behavioral: ['Walk me through a major outage you resolved.'], Technical: ['Design a zero-downtime deployment pipeline for 50 microservices.'], Coding: [] },
};

// ─── UI Primitives ────────────────────────────────────────
function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, full, style: sx }) {
  const [hov, setHov] = useState(false);
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '14px 32px' : '10px 20px';
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;
  const styles = {
    primary: { background: hov ? `linear-gradient(135deg,${C.cyanDim},#7c3aed)` : `linear-gradient(135deg,${C.cyan},${C.purple})`, color: '#000', boxShadow: hov ? `0 0 28px ${C.cyanGlow}` : 'none' },
    ghost:   { background: hov ? C.card : 'transparent', color: C.text, border: `1px solid ${hov ? C.borderHover : C.border}` },
    danger:  { background: hov ? '#cc3355' : C.red + '22', color: C.red, border: `1px solid ${C.red}44` },
  };
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={!disabled ? onClick : undefined}
      style={{ padding: pad, borderRadius: 8, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.18s', fontFamily: 'inherit', fontSize: fs, opacity: disabled ? 0.45 : 1, width: full ? '100%' : undefined, ...styles[variant], ...sx }}
    >{children}</button>
  );
}

function Chip({ children, color = C.cyan }) {
  return <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 99, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', background: `${color}18`, color, border: `1px solid ${color}35`, textTransform: 'uppercase' }}>{children}</span>;
}

function Input({ label, type = 'text', value, onChange, placeholder, error }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: C.bg, border: `1px solid ${f ? C.cyan : error ? C.red : C.border}`, color: C.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'all 0.15s' }} />
      {error && <div style={{ color: C.red, fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function Card({ children, style: sx }) {
  return <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, ...sx }}>{children}</div>;
}

function Bar({ value, max = 10, color = C.cyan, h = 4 }) {
  return (
    <div style={{ height: h, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min((value / max) * 100, 100)}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
    </div>
  );
}

function ScoreRing({ score, size = 72 }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r, fill = (score / 10) * circ;
  const color = score >= 8 ? C.green : score >= 6 ? C.cyan : score >= 4 ? C.yellow : C.red;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={circ - fill} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 5px ${color})` }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%', fill: color, fontSize: size * 0.22, fontWeight: 800, fontFamily: 'monospace' }}>
        {score}
      </text>
    </svg>
  );
}

function MiniChart({ data, color = C.cyan, height = 48 }) {
  if (!data || data.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim, fontSize: 12 }}>No data yet</div>;
  const max = Math.max(...data, 1), w = 200, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
      <polygon fill={`${color}20`} points={`0,${h} ${pts} ${w},${h}`} />
    </svg>
  );
}

function AIAvatar({ speaking }) {
  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      {speaking && [0,1].map(i => (
        <div key={i} style={{ position: 'absolute', inset: -6-i*4, borderRadius: '50%', border: `1px solid ${C.cyan}`, animation: `ping 1.8s ease-out ${i*0.3}s infinite`, opacity: 0.3 }} />
      ))}
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1a2744,#0d1a33)', border: `2px solid ${speaking ? C.cyan : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, transition: 'all 0.3s' }}>🤖</div>
    </div>
  );
}

function TypedText({ text, speed = 14, onDone }) {
  const [d, setD] = useState(''), [done, setDone] = useState(false);
  useEffect(() => {
    setD(''); setDone(false); let i = 0;
    const iv = setInterval(() => { i++; setD(text.slice(0,i)); if(i>=text.length){clearInterval(iv);setDone(true);onDone?.();} }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{d}{!done && <span style={{ color: C.cyan, animation: 'blink 0.8s infinite' }}>▋</span>}</span>;
}

// ─── AUTH SCREEN ──────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState(''), [email, setEmail] = useState('alex@dev.io'), [pw, setPw] = useState('pass123');
  const [err, setErr] = useState(''), [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      const res = mode === 'login'
        ? await authAPI.login(email, pw)
        : await authAPI.register(name, email, pw);
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (e) {
      setErr(e.response?.data?.error || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, ${C.cyanGlow} 0%, transparent 60%)`, pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg,${C.cyan},${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>⚡</div>
          <h1 style={{ color: C.text, fontSize: 26, fontWeight: 900, fontFamily: 'Georgia,serif', marginBottom: 4 }}>HIRELOOP</h1>
          <p style={{ color: C.muted, fontSize: 13 }}>AI-Powered Mock Interview Platform</p>
        </div>
        <Card>
          <div style={{ display: 'flex', marginBottom: 20, background: C.bg, borderRadius: 8, padding: 3 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: mode===m ? C.card : 'transparent', color: mode===m ? C.text : C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
          {mode === 'register' && <Input label="Full Name" value={name} onChange={setName} placeholder="Alex Johnson" />}
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
          <Input label="Password" type="password" value={pw} onChange={setPw} placeholder="••••••••" error={err} />
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 14 }}>
            Demo: <span style={{ color: C.cyan, cursor: 'pointer' }} onClick={() => { setEmail('alex@dev.io'); setPw('pass123'); }}>alex@dev.io / pass123</span>
            {' · '}
            <span style={{ color: C.purple, cursor: 'pointer' }} onClick={() => { setEmail('admin@intrvw.ai'); setPw('admin123'); }}>admin / admin123</span>
          </div>
          <Btn onClick={submit} disabled={loading} size="lg" full>{loading ? 'Authenticating…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}</Btn>
        </Card>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────
function Dashboard({ user, onStart, onAdmin }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionAPI.getAll().then(r => { setSessions(r.data.sessions); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const avg = sessions.length ? +(sessions.reduce((s,x) => s + x.avgScore, 0) / sessions.length).toFixed(1) : '—';
  const best = sessions.length ? Math.max(...sessions.map(s => s.avgScore)).toFixed(1) : '—';

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: C.text, fontSize: 24, fontWeight: 900, margin: 0, fontFamily: 'Georgia,serif' }}>Welcome back, <span style={{ color: C.cyan }}>{user.name.split(' ')[0]}</span></h2>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{sessions.length} sessions · Avg: <span style={{ color: avg >= 7 ? C.green : C.yellow }}>{avg}</span></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {user.role === 'admin' && <Btn onClick={onAdmin} variant="ghost" size="sm">🛡 Admin</Btn>}
          <Btn onClick={onStart} size="sm">+ New Interview</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Sessions', value: sessions.length, icon: '🎯', color: C.cyan },
          { label: 'Avg Score', value: avg, icon: '📊', color: avg >= 7 ? C.green : C.yellow },
          { label: 'Best Score', value: best, icon: '🏆', color: C.green },
          { label: 'Answered', value: sessions.reduce((s,x) => s + (x.answers?.length||0), 0), icon: '❓', color: C.purple },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 26, fontWeight: 900, fontFamily: 'monospace' }}>{s.value}</div>
              </div>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 24 }}>
        <Card>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📈 Score Trend</div>
          <MiniChart data={sessions.map(s => s.avgScore)} height={56} />
        </Card>
        <Card>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🎯 By Role</div>
          {['swe','pm','ml'].map(r => {
            const rs = sessions.filter(s => s.role === r);
            const a = rs.length ? +(rs.reduce((a,x) => a+x.avgScore,0)/rs.length).toFixed(1) : null;
            return (
              <div key={r} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: C.text, fontSize: 12 }}>{ROLES.find(x=>x.id===r)?.label}</span>
                  <span style={{ color: a ? C.cyan : C.dim, fontSize: 12, fontFamily: 'monospace' }}>{a || '—'}</span>
                </div>
                <Bar value={a || 0} color={a >= 7.5 ? C.green : C.cyan} />
              </div>
            );
          })}
        </Card>
      </div>

      <Card>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🕐 Recent Sessions</div>
        {loading ? <div style={{ color: C.muted, textAlign: 'center', padding: '24px 0' }}>Loading…</div>
        : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
            <div style={{ color: C.muted, fontSize: 14 }}>No sessions yet. Start your first interview!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...sessions].reverse().slice(0,6).map(s => (
              <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: C.panel, borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ fontSize: 20 }}>{ROLES.find(r=>r.id===s.role)?.icon}</div>
                  <div>
                    <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{ROLES.find(r=>r.id===s.role)?.label} · {s.company}</div>
                    <div style={{ color: C.muted, fontSize: 11 }}>{s.createdAt?.slice(0,10)} · {s.type} · {s.level}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Chip color={s.avgScore>=8?C.green:s.avgScore>=6.5?C.cyan:C.yellow}>{s.avgScore}/10</Chip>
                  <Chip color={s.status==='completed'?C.green:C.yellow}>{s.status}</Chip>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── SETUP ────────────────────────────────────────────────
function Setup({ onBegin }) {
  const [role, setRole] = useState(null), [company, setCompany] = useState(null), [type, setType] = useState(null), [level, setLevel] = useState(null);
  const TogBtn = ({ val, sel, onSel, color=C.cyan }) => (
    <button onClick={() => onSel(val)} style={{ padding: '9px 14px', borderRadius: 8, border: `1px solid ${sel?color:C.border}`, background: sel?`${color}18`:C.card, color: sel?color:C.text, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>{val}</button>
  );
  const Sec = ({ label, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
  return (
    <div style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ color: C.text, fontSize: 22, fontWeight: 900, marginBottom: 24, fontFamily: 'Georgia,serif' }}>Configure Interview</h2>
      <Sec label="1 · Target Role">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ROLES.map(r => <button key={r.id} onClick={()=>setRole(r.id)} style={{ padding:'9px 14px',borderRadius:8,border:`1px solid ${role===r.id?C.cyan:C.border}`,background:role===r.id?`${C.cyan}18`:C.card,color:role===r.id?C.cyan:C.text,cursor:'pointer',fontSize:13,fontWeight:600,transition:'all 0.15s',display:'flex',alignItems:'center',gap:6 }}><span>{r.icon}</span>{r.label}</button>)}
        </div>
      </Sec>
      <Sec label="2 · Target Company">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COMPANIES.map(c => <TogBtn key={c} val={c} sel={company===c} onSel={setCompany} color={C.purple} />)}
        </div>
      </Sec>
      <Sec label="3 · Interview Type">
        <div style={{ display: 'flex', gap: 8 }}>
          {['Behavioral','Technical','Mixed'].map(t => <TogBtn key={t} val={t} sel={type===t} onSel={setType} color={C.green} />)}
        </div>
      </Sec>
      <Sec label="4 · Seniority Level">
        <div style={{ display: 'flex', gap: 8 }}>
          {['Entry','Mid','Senior','Staff'].map(l => <TogBtn key={l} val={l} sel={level===l} onSel={setLevel} color={C.yellow} />)}
        </div>
      </Sec>
      <Btn onClick={() => (role&&company&&type&&level) && onBegin({role,company,type,level})} disabled={!role||!company||!type||!level} size="lg" full>
        {role&&company&&type&&level ? 'Begin Interview →' : 'Select all options to continue'}
      </Btn>
    </div>
  );
}

// ─── INTERVIEW ────────────────────────────────────────────
function Interview({ config, user, onFinish }) {
  const { role, company, type, level } = config;
  const bank = LOCAL_QUESTIONS[role] || LOCAL_QUESTIONS.swe;
  const allQ = [
    ...(type!=='Technical' ? bank.Behavioral||[] : []),
    ...(type!=='Behavioral' ? bank.Technical||[] : []),
    ...(type!=='Behavioral' ? bank.Coding||[] : []),
  ].slice(0,5);
  const totalQ = allQ.length || 3;

  const [phase, setPhase] = useState('intro');
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [timer, setTimer] = useState(0), [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(), timerRef = useRef();

  useEffect(() => {
    sessionAPI.create({ role, company, type, level }).then(r => setSessionId(r.data.session._id)).catch(()=>{});
    setTyping(true);
    setTimeout(() => {
      setMsgs([{ role:'ai', text:`Welcome! I'm your AI interviewer for today's ${level}-level ${ROLES.find(r=>r.id===role)?.label} interview tailored for ${company}. We'll cover ${totalQ} questions with AI evaluation after each. Start when ready.` }]);
      setTyping(false);
    }, 700);
  }, []);

  useEffect(() => {
    if (phase==='question') {
      setTyping(true); setAnswer(''); setFeedback(null);
      setTimeout(() => {
        const q = allQ[qIdx] || 'Tell me about your most impactful project.';
        setMsgs(m => [...m, { role:'ai', text:`Question ${qIdx+1} of ${totalQ}: ${q}` }]);
        setTyping(false); setRunning(true); setTimer(0);
      }, 500);
    }
  }, [phase, qIdx]);

  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setTimer(t=>t+1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs,feedback,typing,evaluating]);

  const submit = async () => {
    if (!answer.trim()) return;
    setRunning(false);
    setMsgs(m => [...m, { role:'user', text:answer }]);
    setEvaluating(true);
    try {
      const res = await evaluateAPI.evaluate(allQ[qIdx]||'', answer);
      const fb = res.data;
      setFeedback(fb);
      const newFB = { q:allQ[qIdx], a:answer, fb, time:timer };
      setAllFeedbacks(prev => [...prev, newFB]);
      if (sessionId) {
        sessionAPI.update(sessionId, { answer:{ question:allQ[qIdx], answer, score:fb.score, verdict:fb.verdict, strengths:fb.strengths, improvements:fb.improvements, criteria:fb.criteria, timeTaken:timer } }).catch(()=>{});
      }
      setMsgs(m => [...m, { role:'ai', text: fb.verdict==='Strong' ? 'Solid response. Review the breakdown below.' : 'Thanks. Check the analysis to sharpen your answer.' }]);
    } catch { setFeedback({ score:5, verdict:'Good', criteria:[], strengths:[], improvements:['Could not connect to AI evaluator — check backend.'], tip:'Ensure your backend server is running on port 5000.' }); }
    setEvaluating(false);
  };

  const next = () => {
    if (qIdx+1 >= totalQ) {
      if (sessionId) sessionAPI.update(sessionId, { status:'completed', duration: allFeedbacks.reduce((s,f)=>s+f.time,0) }).catch(()=>{});
      onFinish(allFeedbacks);
    } else setQIdx(i=>i+1);
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'12px 20px', borderBottom:`1px solid ${C.border}`, background:C.panel, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Chip>{ROLES.find(r=>r.id===role)?.label}</Chip>
          <Chip color={C.purple}>{company}</Chip>
          <Chip color={C.green}>{level}</Chip>
          <Chip color={C.yellow}>{type}</Chip>
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center' }}>
          {phase==='question' && <span style={{ fontFamily:'monospace', fontSize:16, fontWeight:800, color:timer>120?C.red:timer>90?C.yellow:C.cyan }}>{fmt(timer)}</span>}
          <span style={{ color:C.muted, fontSize:12 }}>{phase==='question'?`Q${qIdx+1}/${totalQ}`:'–'}</span>
        </div>
      </div>
      {phase==='question' && <div style={{ height:3, background:C.border }}><div style={{ height:'100%', width:`${(qIdx/totalQ)*100}%`, background:C.cyan, transition:'width 0.5s' }} /></div>}

      <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:14 }}>
        {msgs.map((m,i) => (
          <div key={i} style={{ display:'flex', gap:10, flexDirection:m.role==='user'?'row-reverse':'row', alignItems:'flex-start' }}>
            {m.role==='ai' ? <AIAvatar speaking={false}/> : (
              <div style={{ width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${C.purple},${C.cyan})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#000',flexShrink:0 }}>{user.avatar||user.name?.slice(0,2).toUpperCase()}</div>
            )}
            <div style={{ maxWidth:'72%', padding:'11px 15px', borderRadius:m.role==='ai'?'4px 12px 12px 12px':'12px 4px 12px 12px', background:m.role==='ai'?C.card:`${C.purple}25`, border:`1px solid ${m.role==='ai'?C.border:C.purple+'40'}`, color:C.text, fontSize:14, lineHeight:1.6 }}>
              {i===msgs.length-1&&m.role==='ai' ? <TypedText text={m.text}/> : m.text}
            </div>
          </div>
        ))}
        {(typing||evaluating) && (
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <AIAvatar speaking/>
            <div style={{ padding:'11px 16px', borderRadius:'4px 12px 12px 12px', background:C.card, border:`1px solid ${C.border}`, display:'flex', gap:5, alignItems:'center' }}>
              {evaluating && <span style={{ color:C.muted, fontSize:12, marginRight:6 }}>AI evaluating</span>}
              {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:'50%',background:evaluating?C.green:C.cyan,animation:`bounce 1.2s ease ${i*0.15}s infinite` }}/>)}
            </div>
          </div>
        )}
        {feedback && (
          <Card style={{ border:`1px solid ${C.cyan}40`, boxShadow:`0 0 20px ${C.cyanGlow}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ color:C.text, fontWeight:800, fontSize:15 }}>🤖 AI Evaluation</div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Chip color={feedback.verdict==='Strong'?C.green:feedback.verdict==='Good'?C.cyan:C.yellow}>{feedback.verdict}</Chip>
                <ScoreRing score={feedback.score} size={60}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              {(feedback.criteria||[]).map((c,i)=>(
                <div key={i} style={{ padding:'8px 12px', borderRadius:8, background:C.bg, border:`1px solid ${c.passed?C.green+'30':C.border}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ color:C.muted, fontSize:11 }}>{c.name}</span>
                    <span style={{ color:c.passed?C.green:C.yellow, fontSize:11, fontFamily:'monospace' }}>{c.score}/10</span>
                  </div>
                  <Bar value={c.score} color={c.passed?C.green:C.yellow}/>
                </div>
              ))}
            </div>
            {feedback.strengths?.length>0 && (
              <div style={{ marginBottom:10 }}>
                <div style={{ color:C.green, fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>✓ Strengths</div>
                {feedback.strengths.map((s,i)=><div key={i} style={{ color:C.text, fontSize:13, paddingLeft:12, borderLeft:`2px solid ${C.green}`, marginBottom:4 }}>{s}</div>)}
              </div>
            )}
            {feedback.improvements?.length>0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ color:C.yellow, fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>↑ Improve</div>
                {feedback.improvements.map((s,i)=><div key={i} style={{ color:C.text, fontSize:13, paddingLeft:12, borderLeft:`2px solid ${C.yellow}`, marginBottom:4 }}>{s}</div>)}
              </div>
            )}
            {feedback.tip && <div style={{ padding:'9px 13px', borderRadius:8, background:`${C.cyan}10`, border:`1px solid ${C.cyan}20`, color:C.cyan, fontSize:12, marginBottom:14 }}>💡 {feedback.tip}</div>}
            <Btn onClick={next} size="lg" full>{qIdx+1>=totalQ?'Finish & See Report →':'Next Question →'}</Btn>
          </Card>
        )}
      </div>

      {phase!=='intro'&&!feedback&&!evaluating && (
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}`, background:C.panel }}>
          <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type your answer… (aim for 150–250 words)" rows={3}
            style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, lineHeight:1.6, padding:'10px 14px', resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
            <span style={{ color:C.muted, fontSize:12 }}>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
            <Btn onClick={submit} disabled={!answer.trim()}>Submit for AI Evaluation →</Btn>
          </div>
        </div>
      )}
      {phase==='intro'&&!typing&&msgs.length>0 && (
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${C.border}` }}>
          <Btn onClick={()=>setPhase('question')} size="lg" full>I'm Ready — Start Interview →</Btn>
        </div>
      )}
    </div>
  );
}

// ─── RESULTS ──────────────────────────────────────────────
function Results({ feedbacks, config, user, onDashboard }) {
  const avg = feedbacks.length ? +(feedbacks.reduce((s,f)=>s+f.fb.score,0)/feedbacks.length).toFixed(1) : 0;
  const strong = feedbacks.filter(f=>f.fb.verdict==='Strong').length;
  const totalTime = feedbacks.reduce((s,f)=>s+f.time,0);
  const verdict = avg>=8?'Interview Ready 🚀':avg>=6.5?'Good Progress 📈':'Keep Practicing 💪';
  const vColor = avg>=8?C.green:avg>=6.5?C.cyan:C.yellow;
  return (
    <div style={{ padding:'32px 24px', maxWidth:760, margin:'0 auto' }}>
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{ fontSize:52, marginBottom:10 }}>🎯</div>
        <h2 style={{ color:C.text, fontSize:28, fontWeight:900, margin:'0 0 6px', fontFamily:'Georgia,serif' }}>Session Complete</h2>
        <div style={{ color:vColor, fontSize:16, fontWeight:700 }}>{verdict}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[{label:'Avg Score',value:`${avg}/10`,color:vColor},{label:'Strong',value:`${strong}/${feedbacks.length}`,color:C.green},{label:'Questions',value:feedbacks.length,color:C.cyan},{label:'Time',value:`${Math.round(totalTime/60)}m`,color:C.purple}].map(s=>(
          <Card key={s.label} style={{ textAlign:'center' }}>
            <div style={{ color:s.color, fontSize:24, fontWeight:900, fontFamily:'monospace' }}>{s.value}</div>
            <div style={{ color:C.muted, fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{s.label}</div>
          </Card>
        ))}
      </div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ color:C.text, fontWeight:700, fontSize:14, marginBottom:14 }}>📊 Skill Breakdown</div>
        {['Structure (STAR)','Specific Metrics','Answer Depth','Clarity & Impact'].map((crit,ci)=>{
          const scores = feedbacks.map(f=>f.fb.criteria?.[ci]?.score||5);
          const a2 = +(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
          return (
            <div key={crit} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:C.text, fontSize:13 }}>{crit}</span>
                <span style={{ color:a2>=7?C.green:C.yellow, fontSize:13, fontFamily:'monospace' }}>{a2}/10</span>
              </div>
              <Bar value={a2} color={a2>=7.5?C.green:a2>=5?C.cyan:C.yellow} h={5}/>
            </div>
          );
        })}
      </Card>
      <Card style={{ marginBottom:20 }}>
        <div style={{ color:C.text, fontWeight:700, fontSize:14, marginBottom:14 }}>Question-by-Question</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {feedbacks.map((f,i)=>(
            <div key={i} style={{ padding:'12px 14px', background:C.panel, borderRadius:8, border:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>Q{i+1}: {(f.q||'').slice(0,65)}…</div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <Chip color={f.fb.verdict==='Strong'?C.green:f.fb.verdict==='Good'?C.cyan:C.yellow}>{f.fb.verdict}</Chip>
                  <span style={{ color:C.cyan, fontFamily:'monospace', fontSize:13, fontWeight:800 }}>{f.fb.score}/10</span>
                </div>
              </div>
              <Bar value={f.fb.score} color={f.fb.verdict==='Strong'?C.green:f.fb.verdict==='Good'?C.cyan:C.yellow}/>
              {f.fb.improvements?.[0] && <div style={{ color:C.muted, fontSize:11, marginTop:6 }}>↑ {f.fb.improvements[0]}</div>}
            </div>
          ))}
        </div>
      </Card>
      <Btn onClick={onDashboard} size="lg" full>← Back to Dashboard</Btn>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────
function Admin({ onBack }) {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    userAPI.getStats().then(r=>setStats(r.data)).catch(()=>{});
    userAPI.getAll().then(r=>setUsers(r.data.users)).catch(()=>{});
    sessionAPI.getAllAdmin().then(r=>setSessions(r.data.sessions)).catch(()=>{});
    questionAPI.getAll().then(r=>setQuestions(r.data.questions)).catch(()=>{});
  }, []);

  return (
    <div style={{ padding:'28px 24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h2 style={{ color:C.text, fontSize:22, fontWeight:900, margin:0, fontFamily:'Georgia,serif' }}>🛡 Admin Panel</h2>
          <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>Platform management · Role-based access</p>
        </div>
        <Btn onClick={onBack} variant="ghost" size="sm">← Back</Btn>
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:24, background:C.panel, padding:4, borderRadius:10, width:'fit-content' }}>
        {['overview','users','questions','sessions'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'7px 16px', borderRadius:7, border:'none', background:tab===t?C.card:'transparent', color:tab===t?C.text:C.muted, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'capitalize', transition:'all 0.15s' }}>{t}</button>
        ))}
      </div>

      {tab==='overview' && stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {[{l:'Users',v:stats.totalUsers,c:C.cyan},{l:'Sessions',v:stats.totalSessions,c:C.green},{l:'Avg Score',v:stats.avgScore,c:C.yellow},{l:'Questions',v:stats.totalQuestions,c:C.purple}].map(s=>(
            <Card key={s.l} style={{ textAlign:'center' }}>
              <div style={{ color:s.c, fontSize:28, fontWeight:900, fontFamily:'monospace' }}>{s.v}</div>
              <div style={{ color:C.muted, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:4 }}>{s.l}</div>
            </Card>
          ))}
        </div>
      )}

      {tab==='users' && (
        <Card>
          <div style={{ color:C.text, fontWeight:700, fontSize:14, marginBottom:14 }}>User Management ({users.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {users.map(u=>(
              <div key={u._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:C.panel, borderRadius:8, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${C.purple},${C.cyan})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#000' }}>{u.avatar}</div>
                  <div>
                    <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{u.name}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>{u.email} · {u.createdAt?.slice(0,10)}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Chip color={u.role==='admin'?C.red:C.green}>{u.role}</Chip>
                  <span style={{ color:C.muted, fontSize:12 }}>{u.totalSessions} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab==='questions' && (
        <Card>
          <div style={{ color:C.text, fontWeight:700, fontSize:14, marginBottom:14 }}>Question Bank ({questions.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {questions.map(q=>(
              <div key={q._id} style={{ padding:'12px 14px', background:C.panel, borderRadius:8, border:`1px solid ${C.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div style={{ color:C.text, fontSize:13, flex:1, marginRight:12 }}>{q.text}</div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <Chip color={q.difficulty==='Hard'?C.red:C.yellow}>{q.difficulty}</Chip>
                    <Chip color={C.cyan}>{q.category}</Chip>
                  </div>
                </div>
                <div style={{ color:C.muted, fontSize:11 }}>{q.role.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab==='sessions' && (
        <Card>
          <div style={{ color:C.text, fontWeight:700, fontSize:14, marginBottom:14 }}>All Sessions ({sessions.length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {sessions.map(s=>(
              <div key={s._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:C.panel, borderRadius:8, border:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{ROLES.find(r=>r.id===s.role)?.label} · {s.company}</div>
                  <div style={{ color:C.muted, fontSize:11 }}>{s.createdAt?.slice(0,10)} · {s.type} · {s.level} · {typeof s.userId==='object'?s.userId?.name:'user'}</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <Chip color={s.avgScore>=8?C.green:s.avgScore>=6.5?C.cyan:C.yellow}>{s.avgScore}/10</Chip>
                  <Chip color={s.status==='completed'?C.green:C.yellow}>{s.status}</Chip>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────
function Layout({ user, page, onNav, onLogout, children }) {
  const nav = [
    { id:'dashboard', icon:'⊞', label:'Dashboard' },
    { id:'interview', icon:'🎙', label:'New Interview' },
  ];
  if (user.role === 'admin') nav.push({ id:'admin', icon:'🛡', label:'Admin' });
  return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex' }}>
      <aside style={{ width:210, background:C.panel, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', flexShrink:0 }}>
        <div style={{ padding:'18px 16px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${C.cyan},${C.purple})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>⚡</div>
            <span style={{ color:C.text, fontWeight:900, fontSize:13, fontFamily:'monospace' }}>INTRVW<span style={{ color:C.cyan }}>.AI</span></span>
          </div>
        </div>
        <nav style={{ flex:1, padding:'10px 8px' }}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>onNav(n.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, border:'none', background:page===n.id?`${C.cyan}14`:'transparent', color:page===n.id?C.cyan:C.muted, fontWeight:600, fontSize:13, cursor:'pointer', marginBottom:2, transition:'all 0.15s', textAlign:'left' }}>
              <span style={{ fontSize:15 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ width:30,height:30,borderRadius:'50%',background:`linear-gradient(135deg,${C.purple},${C.cyan})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,color:'#000' }}>{user.avatar||user.name?.slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{ color:C.text, fontSize:12, fontWeight:700 }}>{user.name?.split(' ')[0]}</div>
                <div style={{ color:C.muted, fontSize:10 }}>{user.role}</div>
              </div>
            </div>
            <button onClick={onLogout} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer', fontSize:16 }} title="Sign out">⏏</button>
          </div>
        </div>
      </aside>
      <main style={{ flex:1, overflowY:'auto' }}>{children}</main>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [config, setConfig] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me().then(r => { setUser(r.data.user); setLoading(false); }).catch(() => { localStorage.removeItem('token'); setLoading(false); });
    } else setLoading(false);
  }, []);

  const logout = () => { localStorage.removeItem('token'); setUser(null); setPage('dashboard'); };
  const navigate = (p) => { setPage(p); if(p!=='results') { setConfig(null); setFeedbacks([]); } };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:C.cyan, fontFamily:'monospace', fontSize:16 }}>Loading HIRELOOP…</div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={setUser} />;

  const fullscreen = ['interview-session','results'].includes(page);

  const content = (() => {
    if (page==='dashboard')       return <Dashboard user={user} onStart={()=>setPage('setup')} onAdmin={()=>setPage('admin')}/>;
    if (page==='interview'||page==='setup') return <Setup onBegin={cfg=>{setConfig(cfg);setPage('interview-session');}}/>;
    if (page==='interview-session'&&config) return <Interview config={config} user={user} onFinish={fb=>{setFeedbacks(fb);setPage('results');}}/>;
    if (page==='results')         return <Results feedbacks={feedbacks} config={config} user={user} onDashboard={()=>navigate('dashboard')}/>;
    if (page==='admin')           return <Admin onBack={()=>setPage('dashboard')}/>;
    return <Dashboard user={user} onStart={()=>setPage('setup')} onAdmin={()=>setPage('admin')}/>;
  })();

  return (
    <>
      <style>{`*{margin:0;padding:0;box-sizing:border-box;}body{background:${C.bg};font-family:system-ui,-apple-system,sans-serif;}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:99px}textarea::placeholder,input::placeholder{color:${C.dim}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes ping{0%{transform:scale(1);opacity:.4}100%{transform:scale(2);opacity:0}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
      {fullscreen
        ? content
        : <Layout user={user} page={page} onNav={navigate} onLogout={logout}>{content}</Layout>
      }
    </>
  );
}
