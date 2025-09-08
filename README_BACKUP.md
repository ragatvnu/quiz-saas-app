Backup & Restore for your Vite/React project
===============================================

Quick options
-------------
1) **Git (recommended):**
   - One-time setup:
     ```bash
     ./git_remote_setup.sh git@github.com:YOURNAME/puzzlepacks-studio.git
     ```
   - Later backups:
     ```bash
     git add -A && git commit -m "backup: $(date +'%Y-%m-%d %H:%M')" && git push
     ```

2) **Tar archive (local/offline):**
   ```bash
   ./backup_project.sh             # creates backups/project-backup-YYYY-mm-dd_HH-MM-SS.tgz
   ```

3) **Verify a backup can be restored:**
   ```bash
   ./restore_test.sh backups/project-backup-*.tgz
   ```

What gets excluded
------------------
- `node_modules`, build outputs (`dist`, `.next`, etc.), caches, `.git`—they are re-creatable.
- Your source (`src/**`), HTML entries, config, assets, and lockfiles are included.

Tips
----
- Keep `package-lock.json` / `pnpm-lock.yaml` or `yarn.lock` in the backup for reproducible installs.
- If you use environment variables, store a non-secret template as `.env.example` (exclude real `.env` via .gitignore).
- For automated backups, add a cron job that runs `backup_project.sh` daily/weekly.
- To back up PDFs/exports, keep them in a folder like `exports/` and *include* that folder in backups by removing it from .gitignore.

Windows
-------
- In PowerShell, you can use Git as usual.
- For archives, 7-Zip works, or run these scripts from WSL.

Restore checklist
-----------------
1. Extract the `.tgz` to a new folder
2. Run `npm ci` (or `pnpm install` / `yarn install`)
3. `npm run dev` or `npm run build`
