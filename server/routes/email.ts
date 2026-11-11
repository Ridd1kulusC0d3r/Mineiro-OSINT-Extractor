import crypto from 'crypto';
import dns from 'dns/promises';
import { Router } from 'express';
import { requireJsonBody } from '../errors';

export function emailRouter(): Router {
  const router = Router();

  // Email reconnaissance endpoint (MX records, Gravatar, Provider heuristics)
  router.post('/api/osint/email-recon', requireJsonBody, async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [username, domain] = cleanEmail.split('@');

    // Calculate Gravatar MD5 hash
    const hash = crypto.createHash('md5').update(cleanEmail).digest('hex');

    // Check MX records via DNS
    let mxRecordsFound = false;
    let mxServers: string[] = [];
    try {
      const records = await dns.resolveMx(domain);
      if (records && records.length > 0) {
        mxRecordsFound = true;
        mxServers = records.map(r => r.exchange);
      }
    } catch (e) {
      mxRecordsFound = false;
    }

    // Check Gravatar existence
    let gravatarExists = false;
    let gravatarAvatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=256`;
    try {
      const gravatarRes = await fetch(gravatarAvatarUrl, { method: 'HEAD' });
      if (gravatarRes.status === 200) {
        gravatarExists = true;
      }
    } catch {
      gravatarExists = false;
    }

    // Disposable domain checks
    const disposableDomains = [
      'mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com',
      'trashmail.com', 'sharklasers.com', 'yopmail.com', 'getairmail.com'
    ];
    const isDisposable = disposableDomains.some(d => domain.includes(d));

    // Common provider checks
    const commonProviders = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'proton.me', 'protonmail.com', 'icloud.com'];
    const isCommonProvider = commonProviders.includes(domain);

    // Footprint hints based on domain and provider
    const associatedFootprint: string[] = [];
    if (mxRecordsFound) {
      if (mxServers.some(s => s.includes('google') || s.includes('l.google.com'))) {
        associatedFootprint.push('Google Workspace / Gmail Infrastructure');
      }
      if (mxServers.some(s => s.includes('outlook') || s.includes('protection.outlook.com'))) {
        associatedFootprint.push('Microsoft 365 / Exchange Online');
      }
      if (mxServers.some(s => s.includes('protonmail') || s.includes('proton.me'))) {
        associatedFootprint.push('ProtonMail End-to-End Encrypted Service');
      }
    }

    if (gravatarExists) {
      associatedFootprint.push('Automattic / Gravatar Verified Profile');
    }

    return res.json({
      email: cleanEmail,
      username,
      domain,
      isValidSyntax: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail),
      isDisposable,
      isCommonProvider,
      mxRecordsFound,
      mxServers,
      gravatarExists,
      gravatarAvatarUrl: gravatarExists ? gravatarAvatarUrl : undefined,
      hash,
      associatedFootprint,
    });
  });

  return router;
}
