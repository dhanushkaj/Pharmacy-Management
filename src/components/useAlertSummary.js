import { useEffect, useState, useContext } from 'react';
import { api } from '../utill/api';
import { AuthContext } from './AuthContext';

export default function useAlertSummary() {
  const { token } = useContext(AuthContext);
  const [summary, setSummary] = useState({ totalActive: 0, criticalCount: 0, warningCount: 0, infoCount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchSummary() {
      setLoading(true);
      try {
        const data = await api('/api/alerts/summary', { token });
        if (mounted && data) setSummary(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
    const interval = setInterval(fetchSummary, 60000); // refresh every 60s
    return () => { mounted = false; clearInterval(interval); };
  }, [token]);

  return { ...summary, loading };
}
