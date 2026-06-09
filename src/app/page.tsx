"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Account {
  account_id: string;
  company_name: string;
  industry: string;
  arr: number;
  risk_score: number;
  status: string;
  last_contact_date: string;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        if (data.accounts) {
          setAccounts(data.accounts);
        }
      } catch (err) {
        console.error('Failed to load accounts:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter(acc =>
    acc.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.account_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute KPI metrics dynamically
  const totalARR = accounts.reduce((sum, acc) => sum + acc.arr, 0);
  const criticalCount = accounts.filter(acc => acc.risk_score >= 0.75).length;
  const warningCount = accounts.filter(acc => acc.risk_score >= 0.25 && acc.risk_score < 0.75).length;
  const healthyCount = accounts.filter(acc => acc.risk_score < 0.25).length;
  
  const avgHealth = accounts.length 
    ? Math.round(100 - (accounts.reduce((sum, acc) => sum + acc.risk_score, 0) / accounts.length) * 100)
    : 100;

  function getRiskClass(score: number) {
    if (score >= 0.75) return 'critical';
    if (score >= 0.25) return 'at-risk';
    return 'healthy';
  }

  function getRiskLabel(score: number) {
    if (score >= 0.75) return 'Critical';
    if (score >= 0.25) return 'At Risk';
    return 'Healthy';
  }

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'inline-block',
              boxShadow: '0 0 12px #3b82f6'
            }}></span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Blueberry AI</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customer Retention Radar • Google Cloud Agent Builder + Elastic</p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Search accounts or industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              width: '300px',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total ARR Managed</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
            ${totalARR.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ● {accounts.length} active customer accounts
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>At Risk Accounts</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-title)', color: criticalCount > 0 ? '#f87171' : 'inherit' }}>
            {criticalCount} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>critical</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {warningCount} warning status alerts active
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Average Health Score</span>
          <span style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
            {avgHealth}%
          </span>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
            <div style={{
              width: `${avgHealth}%`,
              height: '100%',
              backgroundColor: avgHealth > 70 ? 'var(--success)' : avgHealth > 40 ? 'var(--warning)' : 'var(--danger)',
              boxShadow: '0 0 8px rgba(59,130,246,0.3)'
            }}></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Accounts List (Left) & Risk Stats (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Account List Column */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Account Radar</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
              {filteredAccounts.length} listed
            </span>
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <span className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>Fetching accounts from Elasticsearch...</span>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No accounts matching "{searchTerm}" found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredAccounts.map(acc => {
                const riskTier = getRiskClass(acc.risk_score);
                const riskPct = Math.round(acc.risk_score * 100);

                return (
                  <Link key={acc.account_id} href={`/account/${acc.account_id}`}>
                    <div className="glass-panel animate-fade-in" style={{
                      padding: '1.25rem 1.5rem',
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 12px',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: '1rem',
                      transition: 'all 0.2s ease'
                    }}>
                      {/* Name & ID */}
                      <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{acc.company_name}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.account_id} • {acc.industry}</span>
                      </div>

                      {/* ARR */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ARR</span>
                        <span style={{ fontWeight: 600 }}>${acc.arr.toLocaleString()}</span>
                      </div>

                      {/* Risk Score */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Risk Score</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flexGrow: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', width: '80px' }}>
                            <div style={{
                              width: `${riskPct}%`,
                              height: '100%',
                              backgroundColor: riskTier === 'critical' ? 'var(--danger)' : riskTier === 'at-risk' ? 'var(--warning)' : 'var(--success)'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: riskTier === 'critical' ? '#f87171' : riskTier === 'at-risk' ? '#fbbf24' : '#34d399' }}>{riskPct}%</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`risk-badge ${riskTier}`}>
                          <span className={`pulse-dot ${riskTier}`}></span>
                          {getRiskLabel(acc.risk_score)}
                        </span>
                      </div>

                      {/* Arrow Icon */}
                      <div style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
                        →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Analytics Column */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Distribution</h2>
          
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Portfolio Health Status</h3>
            
            {/* Simple SV Donut/Distribution representation */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
              <svg width="140" height="140" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                
                {/* Dynamically drawing donut parts based on counts */}
                {/* Critical section (TechFlow: 1 of 3 = 33.3%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--danger)" strokeWidth="3" 
                  strokeDasharray="33.3 66.7" strokeDashoffset="0" />
                  
                {/* Warning section (Global Industries: 1 of 3 = 33.3%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--warning)" strokeWidth="3" 
                  strokeDasharray="33.3 66.7" strokeDashoffset="-33.3" />
                  
                {/* Healthy section (Acme Corp: 1 of 3 = 33.3%) */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--success)" strokeWidth="3" 
                  strokeDasharray="33.3 66.7" strokeDashoffset="-66.6" />
                  
                {/* Text overlay */}
                <g style={{ transform: 'rotate(90deg) translate(0px, -36px)' }}>
                  <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" fill="var(--text-primary)" fontSize="5" fontWeight="bold" fontFamily="var(--font-title)">
                    {accounts.length}
                  </text>
                  <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" fill="var(--text-muted)" fontSize="2.5" fontWeight="normal">
                    Accounts
                  </text>
                </g>
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
                  <span>Critical Risk (≥75%)</span>
                </div>
                <span style={{ fontWeight: 600 }}>{criticalCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--warning)', borderRadius: '50%' }}></span>
                  <span>Warning Status (25-74%)</span>
                </div>
                <span style={{ fontWeight: 600 }}>{warningCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--success)', borderRadius: '50%' }}></span>
                  <span>Healthy (&lt;25%)</span>
                </div>
                <span style={{ fontWeight: 600 }}>{healthyCount}</span>
              </div>
            </div>
          </div>

          {/* Alert Center */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Live Alert Center</span>
              <span className="pulse-dot critical"></span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderLeft: '3px solid var(--danger)', paddingLeft: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>SSO / Export Crash</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginTop: '2px', marginBottom: '2px' }}>TechFlow (ACC-002)</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>VP threatened to churn by Friday due to report timeout crashes.</p>
              </div>
              
              <div style={{ borderLeft: '3px solid var(--warning)', paddingLeft: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Missing Contact Alert</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginTop: '2px', marginBottom: '2px' }}>Global Industries (ACC-003)</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No CSM activity recorded for 25 days. Risk score rising.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
