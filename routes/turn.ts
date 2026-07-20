import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Free TURN/STUN configuration
const getIceServers = () => {
  const stunServers = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302'
  ];

  // Open Relay TURN (free, no signup)
  const turnServers = [
    {
      urls: ['turn:openrelay.metered.ca:80?transport=udp'],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: ['turn:openrelay.metered.ca:443?transport=tcp'],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: ['turns:openrelay.metered.ca:5349?transport=tcp'],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];

  return [
    ...stunServers.map(url => ({ urls: [url] })),
    ...turnServers
  ];
};

router.get('/config', requireAuth, async (req: any, res: Response) => {
  try {
    res.json({
      iceServers: getIceServers(),
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('TURN config error:', error);
    res.status(500).json({ 
      error: 'Failed to get TURN config',
      fallback: {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          { urls: ['stun:stun1.l.google.com:19302'] }
        ]
      }
    });
  }
});

export default router;