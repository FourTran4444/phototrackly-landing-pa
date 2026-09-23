import { ImageResponse } from 'next/og';
export const alt = 'PhotoTrackly — One tool for the whole property media job. In development. Join free early access.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: '100%', height: '100%', background: '#f7f6f0', color: '#263e34', display: 'flex', flexDirection: 'column', padding: '70px 80px', justifyContent: 'space-between' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28 }}><span>PhotoTrackly</span><span style={{ fontSize: 18, color: '#627451' }}>IN DEVELOPMENT · US & AUSTRALIA</span></div><div style={{ display: 'flex', flexDirection: 'column', fontSize: 76, lineHeight: 1.06, letterSpacing: '-4px' }}><span>One tool for the whole</span><span>property media job.</span></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 21 }}><span>Orders → Schedule → Team → Production → Delivery</span><span style={{ background: '#263e34', color: '#fff', padding: '18px 25px', borderRadius: '6px' }}>Join early access</span></div></div>, size);
}
