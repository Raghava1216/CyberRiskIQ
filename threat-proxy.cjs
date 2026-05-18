const http  = require('http');
const https = require('https');

const PORT = 3001;

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'CyberRiskIQ/1.0' } }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u    = new URL(url);
    const req  = https.request({
      hostname: u.hostname,
      path:     u.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent':     'CyberRiskIQ/1.0',
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch(e) { reject(new Error('Bad JSON: ' + raw.slice(0,100))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fetchURLhaus() {
  const raw  = await get('https://urlhaus-api.abuse.ch/v1/urls/recent/limit/40/');
  const json = JSON.parse(raw);
  if (!json.urls) return [];
  return json.urls.slice(0, 30).map((u, i) => ({
    id:         'urlhaus-' + (u.id || i),
    title:      'Malware URL: ' + (u.url_host || (u.url || '').slice(0, 50)),
    category:   (u.tags || []).includes('ransomware') ? 'Ransomware' : 'Malware',
    severity:   u.url_status === 'online' ? 'High' : 'Medium',
    status:     u.url_status === 'online' ? 'Active' : 'Investigating',
    confidence: u.url_status === 'online' ? 82 : 60,
    source:     'URLhaus · abuse.ch',
    ioc_type:   'URL',
    ioc_value:  u.url || '',
    first_seen: u.date_added || new Date().toISOString(),
    last_seen:  u.date_added || new Date().toISOString(),
    tags:       u.tags || ['urlhaus'],
    reporter:   'URLhaus Community',
  }));
}

async function fetchThreatFox() {
  const json = await post('https://threatfox-api.abuse.ch/api/v1/', {
    query: 'get_iocs', days: 3,
  });
  if (json.query_status !== 'ok' || !Array.isArray(json.data)) return [];
  return json.data.slice(0, 20).map((ioc) => {
    const conf = ioc.confidence_level || 70;
    const typeMap = {
      'ip:port': 'IP', domain: 'Domain',
      url: 'URL', sha256_hash: 'Hash', md5_hash: 'Hash',
    };
    return {
      id:         'threatfox-' + ioc.id,
      title:      (ioc.malware_printable || 'Unknown Malware') + ' IOC',
      category:   ioc.threat_type === 'botnet_cc' ? 'Botnet' : 'Malware',
      severity:   conf >= 80 ? 'Critical' : conf >= 60 ? 'High' : 'Medium',
      status:     'Active',
      confidence: conf,
      source:     'ThreatFox · abuse.ch',
      ioc_type:   typeMap[ioc.ioc_type] || 'IOC',
      ioc_value:  ioc.ioc || '',
      first_seen: ioc.first_seen  || new Date().toISOString(),
      last_seen:  ioc.last_seen   || new Date().toISOString(),
      tags:       ioc.tags || [],
      reporter:   ioc.reporter || 'ThreatFox Community',
    };
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.url !== '/threat-feeds') { res.writeHead(404); res.end('{}'); return; }

  try {
    console.log('Fetching live feeds...');
    const [urlhaus, threatfox] = await Promise.allSettled([
      fetchURLhaus(),
      fetchThreatFox(),
    ]);

    const data = [
      ...(urlhaus.status   === 'fulfilled' ? urlhaus.value   : []),
      ...(threatfox.status === 'fulfilled' ? threatfox.value : []),
    ];

    // deduplicate
    const seen = new Set();
    const unique = data.filter(t => {
      if (seen.has(t.ioc_value)) return false;
      seen.add(t.ioc_value);
      return true;
    });

    console.log('Returning ' + unique.length + ' threats');
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: unique }));
  } catch (err) {
    console.error('Error:', err.message);
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: err.message, data: [] }));
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port 3001 is already in use. Kill that process first:');
    console.error('  Windows: netstat -ano | findstr :3001  then  taskkill /PID <pid> /F');
    console.error('  Mac/Linux: lsof -ti:3001 | xargs kill');
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Threat Feed Proxy running at http://localhost:' + PORT + '/threat-feeds');
});