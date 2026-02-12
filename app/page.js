'use client';
import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

// --- CONFIGURATION ---
const STRIPE_URL = "https://buy.stripe.com/aFa00cfmNb4N3jJarU63K00";
const BACKEND_URL = "https://stucco-brain-519807068007.us-central1.run.app/process-takeoff";

export default function StuccoGov() {
    const [visitorId, setVisitorId] = useState('');
    const [status, setStatus] = useState('loading');
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [processMsg, setProcessMsg] = useState('Initializing AI...');

    useEffect(() => {
        const init = async () => {
            const fp = await FingerprintJS.load();
            const { visitorId } = await fp.get();
            setVisitorId(visitorId);
            try {
                const res = await fetch(`/api/gatekeeper?id=${visitorId}`);
                const data = await res.json();
                setTimeout(() => {
                    setStatus(data.allowed ? 'allowed' : 'locked');
                }, 1000);
            } catch (e) { setStatus('allowed'); }
        };
        init();
    }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setProcessing(true);
        setProcessMsg("Uploading blueprint set...");

        const formData = new FormData();
        formData.append('file', file);

        // Update message after a few seconds to show "deep" work
        setTimeout(() => setProcessMsg("Scanning all pages for elevations..."), 3000);
        setTimeout(() => setProcessMsg("Identifying wall geometry and scale..."), 8000);

        try {
            const res = await fetch(BACKEND_URL, { method: 'POST', body: formData });
            const data = await res.json();

            if (data.success) {
                setResult(data);
                // Lock the user AFTER showing the result so they don't get a blank screen
                await fetch('/api/lock-user', {
                    method: 'POST',
                    body: JSON.stringify({ id: visitorId })
                });
                setStatus('locked');
            } else {
                alert("Error: " + (data.error || "Could not read plan."));
            }
        } catch (err) {
            alert("System Busy. Large blueprints take longer to process. Please wait 30 seconds and try again.");
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

                {/* VERIFYING DEVICE */}
                {status === 'loading' && (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                        <div className="spinner"></div>
                        <h3>Verifying Eligibility...</h3>
                    </div>
                )}

                {/* LOCKED STATE (BUT SHOW RESULT IF JUST FINISHED) */}
                {status === 'locked' && !result && (
                    <div style={{ padding: '40px', border: '2px dashed #d63e3e', background: '#fff1f1', textAlign: 'center' }}>
                        <h2 style={{ color: '#b50909' }}>Free Audit Limit Reached</h2>
                        <p>This device has already processed a complimentary plan audit.</p>
                        <a href={STRIPE_URL} style={{ display: 'inline-block', background: '#005ea2', color: 'white', padding: '15px 30px', textDecoration: 'none', fontWeight: 'bold', borderRadius: '5px' }}>
                            Upgrade to Professional ($49/mo)
                        </a>
                    </div>
                )}

                {/* UPLOAD FORM */}
                {status === 'allowed' && !processing && !result && (
                    <div style={{ background: 'white', padding: '40px', border: '1px solid #ccc', borderRadius: '5px' }}>
                        <h2>Start New Audit</h2>
                        <p>Drop a full PDF blueprint set. AI scans all pages automatically.</p>
                        <input type="file" onChange={handleUpload} accept=".pdf" style={{ fontSize: '16px' }} />
                    </div>
                )}

                {/* PROCESSING SPINNER */}
                {processing && (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <div className="spinner-large"></div>
                        <h3 style={{ color: '#003366' }}>{processMsg}</h3>
                        <p>Large files (like Scott Ave) may take up to 60 seconds.</p>
                    </div>
                )}

                {/* RESULTS VIEW */}
                {result && (
                    <div style={{ background: 'white', padding: '20px', marginTop: '20px', borderTop: '4px solid #2e8540' }}>
                        <h2 style={{ color: '#2e8540' }}>✓ Audit Complete</h2>
                        <img src={result.image_url} alt="Result" style={{ maxWidth: '100%', border: '1px solid #ccc', marginBottom: '20px', borderRadius: '4px' }} />
                        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '5px', fontSize: '18px', border: '1px solid #eee' }}>
                            <div style={{ marginBottom: '10px' }}><strong>Net Stucco:</strong> <span style={{ color: '#2e8540' }}>{result.net_sqyd} SY</span></div>
                            <div><strong>Net Paint:</strong> <span style={{ color: '#2e8540' }}>{result.net_sqft} SF</span></div>
                        </div>
                        <a href={STRIPE_URL} style={{ display: 'block', width: '100%', background: '#2e8540', color: 'white', textAlign: 'center', padding: '15px', marginTop: '20px', textDecoration: 'none', fontWeight: 'bold', borderRadius: '5px' }}>
                            DOWNLOAD FULL ITEMIZATION ($49)
                        </a>
                    </div>
                )}
            </div>

            <style>{`
                .spinner { display: inline-block; width: 30px; height: 30px; border: 3px solid #ccc; border-top: 3px solid #005ea2; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
                .spinner-large { display: inline-block; width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #005ea2; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}