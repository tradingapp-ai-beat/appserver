name: Deploy Node.js App to Azure

on: [push]

jobs:

  build-and-deploy:
    runs-on: ubuntu-latest

    steps:

    - uses: actions/checkout@v2

    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Login to Azure
      run: az login --service-principal -u ${{ secrets.AZURE_CLIENT_ID }} -p ${{ secrets.AZURE_CLIENT_SECRET }} --tenant ${{ secrets.AZURE_TENANT_ID }}

    - name: Setup Azure PowerShell
      uses: azure/powershell@v2
      with:
        azPSVersion: 'latest'

    - name: Run Azure PowerShell script
      run: |
        $ErrorActionPreference = 'Stop'
        $WarningPreference = 'SilentlyContinue'

        $servicePrincipalConnection = @{
            TenantId = "${{ secrets.AZURE_TENANT_ID }}"
            ApplicationId = "${{ secrets.AZURE_CLIENT_ID }}"
            Password = "${{ secrets.AZURE_CLIENT_SECRET }}"
        }
        Connect-AzAccount @servicePrincipalConnection

        # Your PowerShell script here
        Get-AzResourceGroup
      shell: pwsh

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'ApiServeraPP'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
