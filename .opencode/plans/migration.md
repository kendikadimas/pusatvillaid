# Migrate Deployment from FTP to SCP (SSH)

## Changes to `.github/workflows/deploy.yml`

### Remove
Two `SamKirkland/FTP-Deploy-Action` steps (Backend + Frontend deploy)

### Add
Two `appleboy/scp-action@v0.1.7` steps using existing SSH secrets

### Diff
```diff
       - name: Deploy Backend to cPanel (api.pusatvillaid.com)
-        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
+        uses: appleboy/scp-action@v0.1.7
         with:
-          server: ${{ secrets.FTP_HOST }}
-          username: ${{ secrets.FTP_USERNAME }}
-          password: ${{ secrets.FTP_PASSWORD }}
-          local-dir: ./pusatvillaid/
-          server-dir: ${{ secrets.CPANEL_BACKEND_PATH }}
+          host: ${{ secrets.SSH_HOST }}
+          username: ${{ secrets.SSH_USERNAME }}
+          password: ${{ secrets.SSH_PASSWORD }}
+          port: ${{ secrets.SSH_PORT || '22' }}
+          source: "./pusatvillaid/"
+          target: ${{ secrets.CPANEL_BACKEND_PATH }}

       - name: Deploy Frontend to cPanel (www.pusatvillaid.com)
-        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
+        uses: appleboy/scp-action@v0.1.7
         with:
-          server: ${{ secrets.FTP_HOST }}
-          username: ${{ secrets.FTP_USERNAME }}
-          password: ${{ secrets.FTP_PASSWORD }}
-          local-dir: ./frontend/out/
-          server-dir: ${{ secrets.CPANEL_FRONTEND_PATH }}
+          host: ${{ secrets.SSH_HOST }}
+          username: ${{ secrets.SSH_USERNAME }}
+          password: ${{ secrets.SSH_PASSWORD }}
+          port: ${{ secrets.SSH_PORT || '22' }}
+          source: "./frontend/out/"
+          target: ${{ secrets.CPANEL_FRONTEND_PATH }}
```

### After deploy
Delete unused FTP secrets: `FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`

### Verify
Push to main/master → workflow runs → files should deploy via SCP (SSH, port 22)
