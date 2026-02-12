'use client';
import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// --- CONFIGURATION ---
const STRIPE_URL = "https://buy.stripe.com/aFa00cfmNb4N3jJarU63K00";
// *** I ADDED YOUR CORRECT BRAIN URL BELOW ***
const BACKEND_URL = "https://stucco-brain-519807068007.us-central1.run.app/process-takeoff";

export default function StuccoGov() {
    const [visitorId, setVisitorId] = useState('');
    const [status, setStatus] = useState('loading');
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const init = async () => {
            const fp = await FingerprintJS.load();
            const { visitorId } = await fp.get();
            setVisitorId(visitorId);
            try {
                const res = await fetch(`/api/gatekeeper?id=${visitorId}`);
                const data = await res.json();
                // Artificial delay so you see the loading spinner
                setTimeout(() => {
                    setStatus(data.allowed ? 'allowed' : 'locked');
                }, 1000);
            } catch (e) { setStatus('allowed'); }
        };
        init();
    }, []);

    const handleUpload = async (e) => {
        if (!e.target.files[0]) return;
        setProcessing(true);

        const formData = new FormData();
        formData.append('file', e.target.files[0]);

        try {
            const res = await fetch(BACKEND_URL, { method: 'POST', body: formData });
            const data = await res.json();

            if (data.success) {
                setResult(data);
                await fetch('/api/lock-user', {
                    method: 'POST',
                    body: JSON.stringify({ id: visitorId })
                });
                setStatus('locked');
            } else {
                alert("Error: " + (data.error || "Could not read plan."));
            }
        } catch (err) {
            alert("System Busy. Please upload a clear PDF.");
        }
        setProcessing(false);
    };

    return (
        <div style={{ fontFamily: 'sans-serif', background: '#f0f0f0', minHeight: '100vh' }}>
            <div style={{ background: '#1b1b1b', color: 'white', padding: '5px 20px', fontSize: '12px', fontWeight: 'bold' }}>
                🇺🇸 OFFICIAL ESTIMATING STANDARD
            </div>
            <div style={{ background: 'white', borderBottom: '4px solid #005ea2', padding: '20px' }}>
                <h1 style={{ color: '#003366', margin: 0 }}>National Stucco & Paint Estimator</h1>
            </div>

            <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>

                {/* LOADING STATE (Fixes White Screen) */}
                {status === 'loading' && (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                        <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #ccc', borderTop: '3px solid #005ea2', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '15px' }}></div>
                        <h3>Verifying Device Eligibility...</h3>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {status === 'locked' && !result && (
                    <div style={{ padding: '40px', border: '2px dashed #d63e3e', background: '#fff1f1', textAlign: 'center' }}>
                        <h2 style={{ color: '#b50909' }}>Free Audit Limit Reached</h2>
                        <p>This device has already processed a complimentary plan audit.</p>
                        <a href={STRIPE_URL} style={{ display: 'inline-block', background: '#005ea2', color: 'white', padding: '15px 30px', textDecoration: 'none', fontWeight: 'bold', borderRadius: '5px' }}>
                            Upgrade to Professional ($49/mo)
                        </a>
                    </div>
                )}

                {status === 'allowed' && !processing && !result && (
                    <div style={{ background: 'white', padding: '40px', border: '1px solid #ccc', borderRadius: '5px' }}>
                        <h2>Start New Audit</h2>
                        <p>Upload PDF Plan. AI detects scale automatically.</p>
                        <input type="file" onChange={handleUpload} accept=".pdf" style={{ fontSize: '16px' }} />
                    </div>
                )}

                {processing && (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #005ea2', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
                        <h3 style={{ color: '#003366' }}>Processing Geometry...</h3>
                        <p>Identifying walls, windows, and scale...</p>
                    </div>
                )}

                {result && (
                    <div style={{ background: 'white', padding: '20px', marginTop: '20px', borderTop: '4px solid #2e8540' }}>
                        <h2>Audit Complete</h2>
                        <img src={result.image_url} alt="Result" style={{ maxWidth: '100%', border: '1px solid #ccc', marginBottom: '20px' }} />
                        <div style={{ fontSize: '18px', lineHeight: '1.6' }}>
                            <div><strong>Net Stucco:</strong> {result.net_sqyd} SY</div>
                            <div><strong>Net Paint:</strong> {result.net_sqft} SF</div>
                        </div>
                        <a href={STRIPE_URL} style={{ display: 'block', width: '100%', background: '#2e8540', color: 'white', textAlign: 'center', padding: '15px', marginTop: '20px', textDecoration: 'none', fontWeight: 'bold' }}>
                            UNLOCK FULL REPORT ($49)
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}