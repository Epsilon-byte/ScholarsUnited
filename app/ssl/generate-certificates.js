// Script to generate self-signed SSL certificates for development
const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

// Ensure the ssl directory exists
const sslDir = path.join(__dirname);
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Generate a self-signed certificate
const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'GB' },
  { name: 'organizationName', value: 'Scholars United' },
  { name: 'organizationalUnitName', value: 'Development' }
];

console.log('Generating self-signed SSL certificates...');

const pems = selfsigned.generate(attrs, {
  keySize: 2048,
  days: 365,
  algorithm: 'sha256'
});

// Save the certificate and key
fs.writeFileSync(path.join(sslDir, 'server.key'), pems.private);
fs.writeFileSync(path.join(sslDir, 'server.crt'), pems.cert);

console.log('SSL certificates generated successfully!');
console.log('- Private key saved to: server.key');
console.log('- Certificate saved to: server.crt');
console.log('\nThese certificates are self-signed and should only be used in development environments.');
