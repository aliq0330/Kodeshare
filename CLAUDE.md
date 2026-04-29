# Kodeshare — Claude Code Talimatları

## Git İş Akışı

Geliştirme feature branch'te yapılır **ve her push'tan sonra main'e de taşınır**.

### Her değişiklikte yapılacaklar:
1. Değişiklikleri aktif feature branch'e commit et ve push yap
2. Hemen ardından main'e merge yap ve push yap:
   ```bash
   BRANCH=$(git rev-parse --abbrev-ref HEAD)
   git checkout main
   git pull origin main --rebase
   git merge "$BRANCH"
   git push origin main
   git checkout "$BRANCH"
   ```

Bu adım **zorunludur** — feature branch'e push yetmez, main de güncel kalmalıdır.
