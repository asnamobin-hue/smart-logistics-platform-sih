import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Navigation, ArrowRight, Brain, CheckCircle, AlertTriangle, Clock, Gauge, Shield, Zap, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { getRoutes, getRouteSuggestions, createRoute, optimizeRoute } from '../services/api'
import Loader from '../components/Loader'

export default function RoutePlanning() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAlt, setShowAlt] = useState(null);
  const [form, setForm] = useState({ origin: '', destination: '', cargo: 'medicine', priority: 'high' });
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState(null);

  useEffect(() => {
    Promise.all([getRoutes(), getRouteSuggestions()]).then(([rRes, rsRes]) => {
      setRoutes(Array.isArray(rRes.data) ? rRes.data : rRes.data.data || []);
      setSuggestions(Array.isArray(rsRes.data) ? rsRes.data : rsRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const riskColors = { low: 'var(--success)', moderate: 'var(--warning)', medium: 'var(--warning)', high: 'var(--danger)' };
  const riskBg = { low: 'rgba(32,201,151,0.1)', moderate: 'rgba(245,166,35,0.1)', medium: 'rgba(245,166,35,0.1)', high: 'rgba(239,71,111,0.1)' };
  const priorityColors = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--info)', low: 'var(--text-secondary)' };

  if (loading) return <Loader text='Loading routes...' />
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.3px' }}>Route Planning</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI-powered route optimization for NER corridors</p>
        </div>
      </div>

      {/* AI Route Optimizer Form — always visible */}
      {showForm && (
        <div className='card-gradient' style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient)' }}><Brain size={18} color='#fff' /></div>
            <div><h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Route Optimizer</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Intelligent route analysis considering weather, traffic, and accessibility</p></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div><label className='form-label'>Origin</label><input className='form-input' placeholder='e.g. Guwahati' value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} /></div>
            <div><label className='form-label'>Destination</label><input className='form-input' placeholder='e.g. Imphal' value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} /></div>
            <div><label className='form-label'>Cargo Type</label>
              <select className='form-select' value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})}>
                <option value='medicine'>Medicine</option><option value='food_supplies'>Food Supplies</option><option value='agricultural'>Agricultural</option><option value='construction'>Construction</option>
              </select></div>
            <div><label className='form-label'>Priority</label>
              <select className='form-select' value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value='critical'>Critical</option><option value='high'>High</option><option value='medium'>Medium</option><option value='low'>Low</option>
              </select></div>
          </div>
          <button
            className='btn btn-primary'
            disabled={!form.origin || !form.destination || optimizing}
            onClick={() => {
              if (!form.origin || !form.destination) return
              setOptimizing(true)
              optimizeRoute(form)
                .then((res) => setOptimizedResult(res.data))
                .catch(console.error)
                .finally(() => setOptimizing(false))
            }}
          ><Zap size={16} /> {optimizing ? 'Analyzing…' : 'Find Optimal Route'}</button>
        </div>
      )}

      {/* Result of the AI optimizer run above */}
      {optimizedResult && (
        <div className='card-gradient' style={{ padding: 24, marginBottom: 24, border: '2px solid var(--pink)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <MapPin size={16} color='var(--success)' />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{optimizedResult.from.name}</span>
                <ArrowRight size={16} color='var(--pink)' />
                <MapPin size={16} color='var(--danger)' />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{optimizedResult.to.name}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Just generated by the AI Route Optimizer</p>
            </div>
            <span className='badge badge-purple'>AI Optimized</span>
          </div>
          <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 14, marginBottom: 16, border: '2px solid rgba(32,201,151,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckCircle size={18} color='var(--success)' />
              <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--success)', letterSpacing: 1 }}>RECOMMENDED ROUTE</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>{optimizedResult.recommended.name}</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>DISTANCE</div><div style={{ fontWeight: 800, fontSize: 18 }}>{optimizedResult.recommended.distance} <span style={{ fontSize: 12, fontWeight: 400 }}>km</span></div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>ETA</div><div style={{ fontWeight: 800, fontSize: 18 }}>{optimizedResult.recommended.eta}h 00m</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>RISK LEVEL</div><span style={{ padding: '4px 12px', borderRadius: 8, background: riskBg[optimizedResult.recommended.riskLevel] || riskBg.moderate, color: riskColors[optimizedResult.recommended.riskLevel] || riskColors.moderate, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>{optimizedResult.recommended.riskLevel}</span></div>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--gradient-soft)', borderRadius: 10, borderLeft: '3px solid var(--pink)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--pink)', letterSpacing: 1, marginBottom: 4 }}><Brain size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> AI Reason</div>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{optimizedResult.recommended.reason}</p>
            </div>
          </div>
          {optimizedResult.alternatives?.map((alt, idx) => (
            <div key={idx} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={14} color='var(--warning)' />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>ALTERNATIVE {idx + 1}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{alt.name}</div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
                <div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>DISTANCE</div><div style={{ fontWeight: 700 }}>{alt.distance} km</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ETA</div><div style={{ fontWeight: 700 }}>{alt.eta}h 00m</div></div>
                <div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>RISK</div><span style={{ padding: '2px 8px', borderRadius: 6, background: riskBg[alt.riskLevel] || riskBg.moderate, color: riskColors[alt.riskLevel] || riskColors.moderate, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{alt.riskLevel}</span></div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{alt.reason}</div>
            </div>
          ))}
        </div>
      )}
      {/* AI Route Recommendations */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={20} color='var(--pink)' /> AI Route Recommendations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {suggestions.map((rs) => (
              <div key={rs.id} className='card-gradient' style={{ padding: 24, overflow: 'hidden' }}>
                {/* Route Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <MapPin size={16} color='var(--success)' />
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{rs.from.name}</span>
                      <ArrowRight size={16} color='var(--pink)' />
                      <MapPin size={16} color='var(--danger)' />
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{rs.to.name}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 0 }}>AI-optimized corridor analysis</p>
                  </div>
                  <span className='badge badge-purple'>AI Optimized</span>
                </div>

                {/* Recommended Route */}
                <div style={{ padding: 20, background: 'var(--bg-secondary)', borderRadius: 14, marginBottom: 16, border: '2px solid rgba(32,201,151,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <CheckCircle size={18} color='var(--success)' />
                    <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--success)', letterSpacing: 1 }}>RECOMMENDED ROUTE</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>{rs.recommended.name}</div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>DISTANCE</div><div style={{ fontWeight: 800, fontSize: 18 }}>{rs.recommended.distance} <span style={{ fontSize: 12, fontWeight: 400 }}>km</span></div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>ETA</div><div style={{ fontWeight: 800, fontSize: 18 }}>{rs.recommended.eta}h 00m</div></div>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>RISK LEVEL</div><span style={{ padding: '4px 12px', borderRadius: 8, background: riskBg[rs.recommended.riskLevel] || riskBg.moderate, color: riskColors[rs.recommended.riskLevel] || riskColors.moderate, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>{rs.recommended.riskLevel}</span></div>
                  </div>
                  {/* AI Reason */}
                  <div style={{ padding: '12px 16px', background: 'var(--gradient-soft)', borderRadius: 10, borderLeft: '3px solid var(--pink)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--pink)', letterSpacing: 1, marginBottom: 4 }}><Brain size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> AI Reason</div>
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{rs.recommended.reason}</p>
                  </div>
                </div>
                {/* Alternative Routes Toggle */}
                {rs.alternatives && rs.alternatives.length > 0 && (
                  <div>
                    <button onClick={() => setShowAlt(showAlt === rs.id ? null : rs.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', padding: '8px 0' }}>
                      {showAlt === rs.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {rs.alternatives.length} Alternative Route{rs.alternatives.length > 1 ? 's' : ''}
                    </button>
                    {showAlt === rs.id && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        {rs.alternatives.map((alt, idx) => (
                          <div key={idx} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <AlertTriangle size={14} color='var(--warning)' />
                              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1 }}>ALTERNATIVE {idx + 1}</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{alt.name}</div>
                            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 10 }}>
                              <div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>DISTANCE</div><div style={{ fontWeight: 700 }}>{alt.distance} km</div></div>
                              <div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>ETA</div><div style={{ fontWeight: 700 }}>{alt.eta}h 00m</div></div>
                              <div><div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>RISK</div><span style={{ padding: '2px 8px', borderRadius: 6, background: riskBg[alt.riskLevel] || riskBg.moderate, color: riskColors[alt.riskLevel] || riskColors.moderate, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{alt.riskLevel}</span></div>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{alt.reason}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Existing Routes Table */}
      {routes.length > 0 && (
        <div className='card-gradient' style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Navigation size={20} color='var(--purple)' /> Route History
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Origin</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Destination</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Risk</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>Distance</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)' }}>ETA</th>
              </tr></thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px' }}>{r.origin}</td>
                    <td style={{ padding: '10px 12px' }}>{r.destination}</td>
                    <td style={{ padding: '10px 12px' }}><span className='badge badge-success'>{r.status}</span></td>
                    <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: 6, background: riskBg[r.riskLevel] || riskBg.moderate, color: riskColors[r.riskLevel] || riskColors.moderate, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{r.riskLevel || 'moderate'}</span></td>
                    <td style={{ padding: '10px 12px' }}>{r.distance ? r.distance + ' km' : 'N/A'}</td>
                    <td style={{ padding: '10px 12px' }}>{r.estimatedTime ? r.estimatedTime + 'h' : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && routes.length === 0 && suggestions.length === 0 && (
        <div className='card-gradient' style={{ padding: 48, textAlign: 'center' }}>
          <Navigation size={48} color='var(--text-secondary)' style={{ marginBottom: 16, opacity: 0.5 }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No routes available</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Create a new route to get started with AI-optimized navigation.</p>
        </div>
      )}
    </div>
  )
}