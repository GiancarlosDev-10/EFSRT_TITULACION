# Plantillas de correo de Supabase Auth

Se pegan a mano en el panel: **Authentication → Emails → Templates**.
El enlace usa `token_hash` (no `ConfirmationURL`), así que funciona aunque el
correo se abra en otro navegador o dispositivo; `/auth/callback` lo verifica con
`verifyOtp` (`src/modules/auth/retorno.ts`).

| Plantilla del panel | Asunto | Archivo |
|---|---|---|
| Confirm signup | Confirma tu correo para ingresar a EFSRT Seguimiento | `confirmar-correo.html` |
| Magic Link | Tu enlace para ingresar a EFSRT Seguimiento | `enlace-ingreso.html` |

Primer ingreso de un correo → "Confirm signup"; los siguientes → "Magic Link".
