# App Store prep checklist — Kora (iOS)

## Privacy Nutrition Labels (App Privacy)

Declare as applicable:

| Data | Used for | Linked to user? | Tracking? |
| --- | --- | --- | --- |
| Photos / Camera | Product scan, contributions | No (on-device / your backend) | No |
| Product interaction (scans, history) | App functionality | Optional when signed in | No |
| Contact info (email) | Account | Yes | No |
| Purchases | Premium | Yes (Apple / RC) | No |
| Crash / diagnostics (if added later) | Analytics | Prefer anonymized | No |

Do **not** claim “no data collected” if Supabase Auth / OFF network calls / RC are live.

## Info.plist / Expo usage strings

Already in `app.json`:

- Camera: barcode + visual recognition  
- Photo library: packaging contributions  

Confirm final Spanish copy before submit.

## Account deletion (Guideline 5.1.1)

- In-app: Perfil → Cuenta → **Eliminar cuenta**  
- Signs out locally; RPC `request_account_deletion` when migration 004 applied  
- Support URL / privacy policy must describe deletion timeline  

## Sign in with Apple

Required if other social/email login is offered on iOS. Capability + Supabase Apple provider.

## IAP

- Products: `kora_premium_monthly` / `kora_premium_yearly`  
- Restore purchases button present  
- Never unlock Premium without StoreKit confirmation  

## Review notes for Apple

- Demo account (email/password) if Auth enabled  
- Sandbox IAP instructions  
- Explain visual AI needs network; no invented products  

## Before submit

- [ ] Privacy policy URL  
- [ ] Support URL  
- [ ] Screenshots ES (iPhone)  
- [ ] EAS production build  
- [ ] SQL 001–005 applied  
- [ ] Edge vision deployed **or** OpenAI configured  
