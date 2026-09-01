import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, TrendingUp, AlertTriangle, Truck, Package, MapPin, Brain, Zap, Activity } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import Loader from '../components/Loader.jsx'
import { getAnalytics } from '../services/api.js'
import demoData from '../demo-data/demoData.json'

const CHART_COLORS = ['#8BC53D','#6EA030','#4A8C20','#A8D46A','#2E86AB','#D4A017','#C0392B','#8BC5A0'];
const RISK_COLORS = {low:'#20C997',moderate:'#F5A623',medium:'#F5A623',high:'#EF476F',critical:'#EF476F'};
const SEV_COLORS = {high:'#EF476F',medium:'#F5A623',low:'#20C997',critical:'#EF476F'};

export default function Analytics(){
  const {t}=useTranslation();
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [timeRange,setTimeRange]=useState('7d');
  useEffect(()=>{getAnalytics().then(r=>setData(r.data)).catch(()=>setData(null)).finally(()=>setLoading(false));},[]);
  const cd=useMemo(()=>{
    if(!data)return{};
    const{deliveryTrend=[],alertsBySeverity=[],routeStatusBreakdown=[]}=data;
    const now=new Date();
    const f=deliveryTrend.filter(d=>{const diff=now-new Date(d.date);
      if(timeRange==='1d')return diff<86400000;
      if(timeRange==='7d')return diff<604800000;
      if(timeRange==='30d')return diff<2592000000;
      return true;});
    return{deliveryTrend:f,alertsBySeverity,routeStatusBreakdown};
  },[data,timeRange]);
  const ibt=useMemo(()=>Object.entries((demoData.incidents||[]).reduce((a,i)=>{a[i.type]=(a[i.type]||0)+1;return a;},{})).map(([type,count])=>({type:type.replace(/_/g,' '),count})).sort((a,b)=>b.count-a.count),[]);
  const rd=useMemo(()=>Object.entries((demoData.roads||[]).concat(demoData.bridges||[]).reduce((a,r)=>{a[r.riskLevel]=(a[r.riskLevel]||0)+1;return a;},{})).map(([level,count])=>({name:level.charAt(0).toUpperCase()+level.slice(1),value:count,color:RISK_COLORS[level]||'#6EA030'})),[]);
  const vs=useMemo(()=>Object.entries((demoData.vehicles||[]).reduce((a,v)=>{a[v.status]=(a[v.status]||0)+1;return a;},{})).map(([status,count])=>({status:status.replace(/_/g,' '),count})),[]);
  const dbc=useMemo(()=>Object.entries((demoData.deliveries||[]).reduce((a,d)=>{a[d.cargoType]=(a[d.cargoType]||0)+1;return a;},{})).map(([cargo,count])=>({cargo:cargo.replace(/_/g,' '),count})),[]);
  const da=useMemo(()=>(demoData.districts||[]).slice(0,8).map(d=>({district:d.name?d.name.substring(0,10):'Unknown',score:d.accessibilityScore||75})),[]);
  const trs=[{id:'1d',label:'Today'},{id:'7d',label:'7 Days'},{id:'30d',label:'30 Days'},{id:'all',label:'All Time'}];
  const TT=({active,payload,label})=>active&&payload&&payload.length?(
    <div style={{background:'var(--card-bg)',padding:'10px 14px',borderRadius:10,border:'1px solid var(--border)'}}>
      <p style={{fontWeight:700,fontSize:13,marginBottom:4}}>{label}</p>
      {payload.map((p,i)=><p key={i} style={{fontSize:12,color:p.color}}>{p.name}: {p.value}</p>)}
    </div>):null;
  if(loading)return <Loader text='Crunching analytics...' />;
  if(!data)return<div className='card-gradient' style={{padding:48,textAlign:'center'}}><BarChart3 size={48} color='var(--text-secondary)' style={{marginBottom:16,opacity:0.5}}/><p style={{fontSize:16,fontWeight:600}}>No analytics data available</p></div>;
  const ib=(Icon,c)=>({width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--gradient-soft)'});
  const cc=(title,Icon,ic,ch)=>(
    <div className='card-gradient' style={{padding:20}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <div style={ib(null,ic)}><Icon size={16} color={ic}/></div>
        <h3 style={{fontSize:14,fontWeight:700}}>{title}</h3>
      </div>
      {ch}</div>);
  return (<div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
      <div><h1 style={{fontSize:26,fontWeight:800}}>Analytics</h1><p style={{fontSize:13,color:'var(--text-secondary)'}}>Comprehensive logistics intelligence and performance metrics</p></div>
      <div style={{display:'flex',gap:6,background:'var(--card-bg)',padding:4,borderRadius:12,border:'1px solid var(--border)'}}>
        {trs.map(tr=>(<button key={tr.id} onClick={()=>setTimeRange(tr.id)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:timeRange===tr.id?'var(--gradient)':'transparent',color:timeRange===tr.id?'#fff':'var(--text-secondary)',transition:'all 0.2s'}}>{tr.label}</button>))}
      </div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
      {[{Icon:TrendingUp,label:'Total Deliveries',value:(demoData.deliveries||[]).length,color:'var(--pink)'},{Icon:AlertTriangle,label:'Active Incidents',value:(demoData.incidents||[]).length,color:'var(--danger)'},{Icon:Truck,label:'Active Vehicles',value:(demoData.vehicles||[]).length,color:'var(--purple)'},{Icon:MapPin,label:'Districts Monitored',value:(demoData.districts||[]).length,color:'var(--success)'}].map((k,i)=>(
        <div key={i} className='card-warm' style={{background:'rgba(214,189,152,0.28)',border:'1px solid rgba(214,189,152,0.35)','padding':'16px 20px','display':'flex','alignItems':'center','gap':14}}>
          <div style={{width:42,height:42,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--gradient-soft)'}}><k.Icon size={20} color={k.color}/></div>
          <div><div style={{fontSize:22,fontWeight:800}}>{k.value}</div><div style={{fontSize:11,color:'var(--text-secondary)',fontWeight:600}}>{k.label}</div></div></div>))}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))',gap:20}}>      {cc('Deliveries Over Time',TrendingUp,'var(--pink)',<ResponsiveContainer width='100%' height={260}><AreaChart data={cd.deliveryTrend||[]}><defs><linearGradient id='gd' x1='0' y1='0' x2='0' y2='1'><stop offset='5%' stopColor='#8BC53D' stopOpacity={0.3}/><stop offset='95%' stopColor='#6EA030' stopOpacity={0.05}/></linearGradient></defs><CartesianGrid strokeDasharray='3 3' stroke='var(--border)'/><XAxis dataKey='date' stroke='var(--text-secondary)' tick={{fontSize:11}}/><YAxis stroke='var(--text-secondary)' tick={{fontSize:11}}/><Tooltip content={<TT/>}/><Area type='monotone' dataKey='deliveries' stroke='#8BC53D' strokeWidth={2} fill='url(#gd)'/></AreaChart></ResponsiveContainer>)}
      {cc('Alerts by Severity',AlertTriangle,'var(--danger)',<ResponsiveContainer width='100%' height={260}><PieChart><Pie data={cd.alertsBySeverity||[]} dataKey='count' nameKey='severity' cx='50%' cy='50%' innerRadius={60} outerRadius={95} paddingAngle={3} label={{fontSize:11,fontWeight:600}}>{(cd.alertsBySeverity||[]).map((e,i)=><Cell key={i} fill={SEV_COLORS[e.severity]||CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie></PieChart><Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:12}}/></ResponsiveContainer>)}
      {cc('Incidents by Type',Activity,'var(--purple)',<ResponsiveContainer width='100%' height={260}><BarChart data={ibt} layout='vertical'><CartesianGrid strokeDasharray='3 3' stroke='var(--border)'/><XAxis type='number' stroke='var(--text-secondary)' tick={{fontSize:11}}/><YAxis type='category' dataKey='type' stroke='var(--text-secondary)' tick={{fontSize:11}} width={100}/><Tooltip content={<TT/>}/><Bar dataKey='count' radius={[0,6,6,0]}>{ibt.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer>)}      {cc('Road Risk Distribution',Zap,'var(--warning)',<ResponsiveContainer width='100%' height={260}><PieChart><Pie data={rd} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={95} paddingAngle={3} label={{fontSize:11,fontWeight:600}}>{rd.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart><Tooltip content={<TT/>}/><Legend wrapperStyle={{fontSize:12}}/></ResponsiveContainer>)}
      {cc('Vehicle Status',Truck,'var(--pink)',<ResponsiveContainer width='100%' height={260}><BarChart data={vs}><CartesianGrid strokeDasharray='3 3' stroke='var(--border)'/><XAxis dataKey='status' stroke='var(--text-secondary)' tick={{fontSize:11}}/><YAxis stroke='var(--text-secondary)' tick={{fontSize:11}}/><Tooltip content={<TT/>}/><Bar dataKey='count' radius={[6,6,0,0]}>{vs.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer>)}
      {cc('Deliveries by Cargo Type',Package,'var(--purple)',<ResponsiveContainer width='100%' height={260}><BarChart data={dbc}><CartesianGrid strokeDasharray='3 3' stroke='var(--border)'/><XAxis dataKey='cargo' stroke='var(--text-secondary)' tick={{fontSize:11}}/><YAxis stroke='var(--text-secondary)' tick={{fontSize:11}}/><Tooltip content={<TT/>}/><Bar dataKey='count' radius={[6,6,0,0]}>{dbc.map((_,i)=><Cell key={i} fill={CHART_COLORS[(i+2)%CHART_COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer>)}
      {cc('Route Status Breakdown',MapPin,'var(--success)',<ResponsiveContainer width='100%' height={260}><BarChart data={cd.routeStatusBreakdown||[]}><CartesianGrid strokeDasharray='3 3' stroke='var(--border)'/><XAxis dataKey='status' stroke='var(--text-secondary)' tick={{fontSize:11}}/><YAxis stroke='var(--text-secondary)' tick={{fontSize:11}}/><Tooltip content={<TT/>}/><Bar dataKey='count' radius={[6,6,0,0]}>{(cd.routeStatusBreakdown||[]).map((_,i)=><Cell key={i} fill={CHART_COLORS[(i+4)%CHART_COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer>)}
      {cc('District Accessibility Score',Brain,'var(--pink)',<ResponsiveContainer width='100%' height={260}><RadarChart cx='50%' cy='50%' outerRadius={80} data={da}><PolarGrid stroke='var(--border)'/><PolarAngleAxis dataKey='district' tick={{fontSize:10}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:10}}/><Radar name='Score' dataKey='score' stroke='#8BC53D' fill='#8BC53D' fillOpacity={0.25} strokeWidth={2}/></RadarChart></ResponsiveContainer>)}
    </div></div>);
}