// Proxy to AviationStack — keeps API key server-side, fixes HTTPS mixed-content issue
const https = require('https');
const http = require('http');

const ACCESS_KEY = process.env.AVIATIONSTACK_KEY;

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { flight_iata, dep_iata, arr_iata, status, limit = 20 } = req.query;

  const params = new URLSearchParams({ access_key: ACCESS_KEY, limit });
  if (flight_iata) params.set('flight_iata', flight_iata.toUpperCase());
  if (dep_iata)    params.set('dep_iata', dep_iata.toUpperCase());
  if (arr_iata)    params.set('arr_iata', arr_iata.toUpperCase());
  if (status)      params.set('flight_status', status);

  try {
    const data = await fetch(`http://api.aviationstack.com/v1/flights?${params}`);
    if (data.error) return res.status(400).json({ error: data.error.info });
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
