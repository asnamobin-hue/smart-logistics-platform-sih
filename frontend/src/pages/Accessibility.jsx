import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import Map from '../components/Map.jsx'
import Loader from '../components/Loader.jsx'
import { getDistrictSummary, getRoadSegments } from '../services/api.js'
import { NER_CENTER, NER_ZOOM } from '../utils/constants.js'

const statusMeta = {
  normal: { icon: ShieldCheck, color: 'var(--color-success)' },
  partial: { icon: ShieldQuestion, color: 'var(--color-warning)' },
  disrupted: { icon: ShieldAlert, color: 'var(--color-danger)' }
}

export default function Accessibility() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [roadSegments, setRoadSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    Promise.all([getDistrictSummary(), getRoadSegments()])
      .then(([summaryRes, roadsRes]) => {
        if (!mounted) return
        setSummary(summaryRes.data)
        setRoadSegments(roadsRes.data.data)
      })
      .catch(() => mounted && setError('Could not load accessibility data. Is the backend running?'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const highRiskSegments = roadSegments.filter((s) => s.isHighRiskCorridor)

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>{t('accessibility.title')}</h1>

      {loading && <Loader text={t('common.loading')} />}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {['normal', 'partial', 'disrupted'].map((status) => {
              const { icon: Icon, color } = statusMeta[status]
              return (
                <div key={status} className="card card-warm" style={{'background':'rgba(214,189,152,0.28)','border':'1px solid rgba(214,189,152,0.35)','display':'flex','alignItems':'center','gap':'12px'}}>
                  <Icon size={28} color={color} />
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 700 }}>
                      {summary.connectivityBreakdown[status] || 0}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {t(`accessibility.connectivity${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card" style={{ marginBottom: '20px', padding: 0, overflow: 'hidden' }}>
            <Map roadSegments={roadSegments} center={NER_CENTER} zoom={NER_ZOOM} height="480px" />
          </div>

          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '12px' }}>{t('accessibility.highRiskCorridors')} ({highRiskSegments.length})</h3>
            {highRiskSegments.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>No high-risk corridors currently flagged.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {highRiskSegments.map((seg) => (
                <div key={seg.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--color-surface-light)', borderRadius: 'var(--radius)'
                }}>
                  <div>
                    <strong>{seg.name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {seg.district?.name} · {seg.type} · {seg.riskFactors.join(', ') || 'general risk'}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                    color: seg.riskLevel === 'severe' ? 'var(--color-danger)' : 'var(--color-warning)'
                  }}>
                    {seg.riskLevel} · {seg.riskScore}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '12px' }}>Districts</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '6px' }}>District</th>
                  <th style={{ padding: '6px' }}>State</th>
                  <th style={{ padding: '6px' }}>Status</th>
                  <th style={{ padding: '6px' }}>Active Disruptions</th>
                </tr>
              </thead>
              <tbody>
                {summary.districts.map((d) => {
                  const { color } = statusMeta[d.connectivityStatus]
                  return (
                    <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '6px' }}>{d.name}</td>
                      <td style={{ padding: '6px' }}>{d.state}</td>
                      <td style={{ padding: '6px', color, fontWeight: 600, textTransform: 'capitalize' }}>{d.connectivityStatus}</td>
                      <td style={{ padding: '6px' }}>{d.activeDisruptions}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
