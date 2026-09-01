import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { LayoutDashboard, ShieldAlert, Route, AlertTriangle, BarChart3, Truck, Brain, Activity, Zap, TrendingUp, ArrowRight, CircleDot, MapPin } from 'lucide-react'
import demoData from '../demo-data/demoData.json'
function AnimatedNumber({ value }) {
  const [d, setD] = useState(0)
  useEffect(() => {
    if (!value || value === 0) { setD(0); return }
    let s = 0; const step = value / 50
    const t = setInterval(() => { s += step; if (s >= value) { setD(value); clearInterval(t) } else setD(Math.floor(s)) }, 16)
    return () => clearInterval(t)
  }, [value])
  return <span>{d}</span>
}
export default function Home() {
  const { t } = useTranslation(); const dd = demoData
  const n=(dd.districts||[]).filter(x=>x.connectivityStatus==='normal').length
  const b=(dd.roads||[]).filter(x=>x.status==='blocked').length
  const h=[...(dd.roads||[]),...(dd.bridges||[])].filter(x=>x.riskLevel==='high'||x.riskLevel==='severe').length
  const av=(dd.vehicles||[]).filter(x=>x.status==='in_transit').length
  const ac=(dd.incidents||[]).filter(x=>x.severity==='high').length
  const dl=(dd.vehicles||[]).filter(x=>x.status==='delayed').length
  const tot=(dd.districts||[]).length
  const segs=[...(dd.roads||[]),...(dd.bridges||[])]
  const safest=segs.reduce((a,x)=>(x.riskScore<(a?.riskScore??999)?x:a),null)
  const riskiest=segs.reduce((a,x)=>(x.riskScore>(a?.riskScore||0)?x:a),null)
  const avgRisk=segs.length?Math.round(segs.reduce((s,x)=>s+(x.riskScore||0),0)/segs.length):0
  const accessPct=tot?Math.round((n/tot)*100):0
  const fs2=[{to:'/dashboard',icon:LayoutDashboard,key:'dashboard',d:'Real-time NER logistics overview'},{to:'/accessibility',icon:ShieldAlert,key:'accessibility',d:'Road & bridge connectivity'},{to:'/routes',icon:Route,key:'routes',d:'AI-powered route optimization'},{to:'/alerts',icon:AlertTriangle,key:'alerts',d:'Live disruption alert center'},{to:'/districts',icon:MapPin,key:'districts',d:'District-wise connectivity status'},{to:'/analytics',icon:BarChart3,key:'analytics',d:'Logistics intelligence insights'}]
  const ks=[{l:'ACTIVE VEHICLES',v:av,ic:Truck,c:'var(--info)',bg:'rgba(77,163,255,0.12)'},{l:'DISTRICTS OK',v:n+'/'+tot,ic:ShieldAlert,c:'var(--success)',bg:'rgba(32,201,151,0.12)',t:1},{l:'BLOCKED ROADS',v:b,ic:AlertTriangle,c:'var(--danger)',bg:'rgba(239,71,111,0.12)'},{l:'HIGH-RISK',v:h,ic:Zap,c:'var(--warning)',bg:'rgba(245,166,35,0.12)'},{l:'CRITICAL ALERTS',v:ac,ic:Activity,c:'var(--pink)',bg:'rgba(139,197,61,0.12)'},{l:'DELAYED',v:dl,ic:TrendingUp,c:'var(--purple)',bg:'rgba(74,140,32,0.12)'}]
  return (<div>
    <div className='card-gradient' style={{padding:32,marginBottom:24,overflow:'hidden',position:'relative'}}>
      <div style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:'var(--gradient-soft)',filter:'blur(40px)',opacity:0.6}}/>
      <div style={{position:'relative',zIndex:1}}>
        <h1 style={{fontSize:28,fontWeight:800,letterSpacing:'-0.5px',lineHeight:1.2,marginBottom:8}}>AI-Based Smart Logistics &<br/>Accessibility Intelligence Platform</h1>
        <p style={{color:'var(--text-secondary)',marginBottom:16,maxWidth:600,fontSize:14}}>Real-time logistics monitoring, accessibility intelligence, route risk prediction and essential-supply tracking for the North Eastern Region.</p>
        <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--success)'}}><span className='status-dot animated' style={{background:'var(--success)'}}/> All systems operational</div>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--purple)'}}><Brain size={14}/> AI engine active</div>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-secondary)'}}><CircleDot size={14}/> Updated just now</div>
        </div>
        <p style={{fontSize:11,color:'var(--text-secondary)',fontStyle:'italic'}}>{t('home.poweredBy')} - SIH 26002</p>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:24}}>
      {ks.map((k,i)=>(<div key={i} className='kpi-card card-warm stagger-child' style={{background:'rgba(214,189,152,0.28)',borderColor:'rgba(214,189,152,0.35)'}}><div className='kpi-icon' style={{background:k.bg}}><k.ic size={20} color={k.c}/></div><div className='kpi-value' style={{color:k.c}}>{k.t?k.v:<AnimatedNumber value={k.v}/>}</div><div className='kpi-label'>{k.l}</div></div>))}
    </div>
    <div className='card-gradient' style={{padding:24,marginBottom:24}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--gradient)',boxShadow:'0 2px 12px rgba(139,197,61,0.3)'}}><Brain size={18} color='#fff'/></div>
        <div><h3 style={{fontSize:16,fontWeight:700}}>AI Intelligence</h3><div style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--success)'}}><span className='status-dot animated' style={{background:'var(--success)'}}/> Engine Active</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
        <div style={{textAlign:'center'}}><div style={{fontSize:28,fontWeight:800,color:'var(--success)'}}>{accessPct}%</div><div style={{fontSize:11,color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:600}}>Accessibility</div></div>
        <div style={{textAlign:'center'}}><div style={{fontSize:28,fontWeight:800,color:'var(--warning)'}}>{avgRisk}%</div><div style={{fontSize:11,color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:600}}>Avg. Route Risk</div></div>
        <div style={{textAlign:'center'}}><div style={{fontSize:28,fontWeight:800,color:'var(--info)'}}>{h}</div><div style={{fontSize:11,color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:600}}>High-Risk Segments</div></div>
      </div>
      <div style={{padding:'14px 18px',background:'var(--gradient-soft)',borderRadius:12,borderLeft:'3px solid var(--pink)',marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:'var(--pink)',marginBottom:4,letterSpacing:1}}>AI Recommendation</div>
        <p style={{fontSize:13,color:'var(--text)',lineHeight:1.5}}>{safest?.name || 'A low-risk corridor'} is currently the safest active route, while {riskiest?.name || 'a flagged segment'} carries the highest disruption risk (score {riskiest?.riskScore ?? 'N/A'}).</p>
      </div>
      <Link to='/routes' style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,fontWeight:700,color:'var(--pink)'}}>Try the AI Route Optimizer <ArrowRight size={14}/></Link>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
      {fs2.map(({to,icon:I,key,d:desc})=>(<Link key={to} to={to} className='card stagger-child' style={{display:'block',cursor:'pointer'}}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}><div style={{width:40,height:40,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--gradient-soft)'}}><I size={20} color='var(--pink)'/></div><div style={{fontWeight:700,fontSize:15}}>{t('nav.'+key)}</div></div><p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:10}}>{desc}</p><div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--pink)',fontWeight:600}}>Open <ArrowRight size={14}/></div></Link>))}
    </div>
  </div>)
}