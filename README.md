# losReda

## Publicar para usuarios (sin subir el `.exe` al repo)

Este proyecto se sube a GitHub con el codigo fuente. El ejecutable de Windows se publica en **GitHub Releases**.

### 1) Build local del ejecutable

```bash
npm run build:exe
```

Se generan:

- `dist/tfg-app.exe`
- `dist/node_sqlite3.node`
- `dist/database.sqlite` (base precargada para arranque rapido)
- `dist/tfg-app-portable.zip` (recomendado para publicar)

### 2) Subir codigo al repo

Sube commits normalmente.  
`dist/` y `*.exe` estan ignorados en `.gitignore`, asi que no se suben al repositorio por error.

### 3) Publicar el `.exe` en GitHub Releases

1. Abre el repo en GitHub.
2. Entra en **Releases** -> **Draft a new release**.
3. Crea una etiqueta (ejemplo: `v1.0.0`).
4. Titulo sugerido: `v1.0.0 - Windows`.
5. Adjunta `dist/tfg-app-portable.zip` (recomendado)  
   o, si prefieres, adjunta **estos tres**: `dist/tfg-app.exe`, `dist/node_sqlite3.node` y `dist/database.sqlite`.
6. Publica el release.

### 4) Verificacion rapida

En el equipo donde se descarga, ejecutar:

```powershell
Test-NetConnection localhost -Port 4000
```

- `True` mientras la app esta abierta
- `False` cuando se ha cerrado
