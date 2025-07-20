import QRCode from 'qrcode';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { roomId, playerName } = req.body;
    
    // 生成房间链接
    const roomUrl = `https://shuyan-dad.vercel.app/multiplayer.html?room=${roomId}&player=${encodeURIComponent(playerName)}`;
    
    // 生成二维码
    const qrCodeDataUrl = await QRCode.toDataURL(roomUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      roomUrl: roomUrl,
      roomId: roomId
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
} 