# Kodeshare — Claude Code Talimatları

## Git İş Akışı

Geliştirme feature branch'te yapılır **ve her push'tan sonra main'e de taşınır**.

### Her değişiklikte yapılacaklar:
1. Değişiklikleri `claude/version-history-features-ypL7y` branch'ine commit et ve push yap
2. Hemen ardından main'e fast-forward merge yap ve push yap:
   ```bash
   git checkout main
   git merge claude/version-history-features-ypL7y --ff-only
   git push origin main
   git checkout claude/version-history-features-ypL7y
   ```

Bu adım **zorunludur** — feature branch'e push yetmez, main de güncel kalmalıdır.
