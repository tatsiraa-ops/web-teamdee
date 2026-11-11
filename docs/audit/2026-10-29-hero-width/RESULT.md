# Hero width aligned with service cards

Changed hero max content width from 1360px to 1160px, matching the 1240px shared wrap minus its two 40px desktop gutters. Narrow screens now match the same 40px/tablet and 20px/mobile edges. Shifted the right garment slightly inward to avoid clipping.

Measured browser edges match exactly at 375, 768, 1024 and 1440px; no horizontal document overflow. Desktop screenshot reviewed. WordPress build/export succeeded (48 pages). CSS-only change; no additional unit tests needed. No commit or push.
