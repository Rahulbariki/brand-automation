import base64
import hashlib

def generate_logo_image(prompt: str) -> str:
    seed = ''.join(c for c in prompt if c.isalnum()).lower() or "startup"
    h = hashlib.md5(seed.encode()).hexdigest()
    
    # Generate 3 harmonious colors
    h1, h2, h3 = h[:6], h[6:12], h[12:18]
    
    # Premium deep SaaS palettes
    palettes = [
        ["#4F46E5", "#EC4899", "#8B5CF6"], # Indigo/Pink/Purple
        ["#0EA5E9", "#3B82F6", "#2563EB"], # Ocean Blues
        ["#10B981", "#3B82F6", "#06B6D4"], # Emerald/Blue/Cyan
        ["#F59E0B", "#EF4444", "#DC2626"], # Sunset Amber/Red
        ["#8B5CF6", "#C026D3", "#D946EF"], # Violet/Fuchsia
        ["#0F172A", "#334155", "#64748B"], # Slate Modern
        ["#000000", "#434343", "#111111"], # Apple Dark
        ["#FF416C", "#FF4B2B", "#FF416C"], # Vibrant Red 
    ]
    
    idx = int(h[:4], 16) % len(palettes)
    c1, c2, c3 = palettes[idx]
    
    # Select geometric shape logic based on hash byte
    shape_type = int(h[4:6], 16) % 3
    
    initial = prompt[0].upper() if prompt else "A"
    
    if shape_type == 0:
        # Infinity / Overlapping Rings
        center_shape = f'''
        <circle cx="200" cy="256" r="80" fill="none" stroke="url(#glass)" stroke-width="40" />
        <circle cx="312" cy="256" r="80" fill="none" stroke="url(#glass)" stroke-width="40" opacity="0.8" />
        <circle cx="256" cy="256" r="40" fill="#ffffff" opacity="0.9" />
        '''
    elif shape_type == 1:
        # 3D Origami Pyramid
        center_shape = f'''
        <path d="M160 320 L256 140 L352 320 Z" fill="url(#glass)" />
        <path d="M200 350 L256 220 L312 350 Z" fill="#ffffff" opacity="0.95" />
        <path d="M256 140 L256 350 L352 320 Z" fill="#000000" opacity="0.15" />
        '''
    else:
        # Glowing Hexagon Core
        center_shape = f'''
        <polygon points="256,120 376,190 376,322 256,392 136,322 136,190" fill="url(#glass)" />
        <polygon points="256,160 336,206 336,306 256,352 176,306 176,206" fill="#ffffff" opacity="0.9" filter="url(#glow)"/>
        '''

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}" />
      <stop offset="100%" stop-color="{c2}" />
    </linearGradient>
    <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="25" stdDeviation="30" flood-color="{c3}" flood-opacity="0.6"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="512" height="512" fill="transparent" />
  
  <!-- Container App Icon bounds -->
  <g filter="url(#shadow)">
    <rect x="60" y="60" width="392" height="392" rx="100" fill="url(#bg-grad)" />
  </g>
  
  <!-- Abstract Geometry -->
  {center_shape}
</svg>'''
    
    encoded = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{encoded}"

if __name__ == "__main__":
    url = generate_logo_image("TechNova AI")
    svg = base64.b64decode(url.split(",")[1]).decode("utf-8")
    with open("test_python_svg.html", "w") as f:
        f.write(f"<html><body style='background:#f0f0f0; padding:100px; text-align:center;'><img src='{url}' width='256' height='256' /></body></html>")
