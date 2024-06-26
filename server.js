name: Deploy Node.js App and Run PowerShell Script

on: [push]

jobs:

  build-and-deploy:
    runs-on: ubuntu-latest

    steps:

    - uses: actions/checkout@v2

    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Login to Azure
      run: az login --service-principal -u ${{ secrets.AZURE_CLIENT_ID }} -p ${{ secrets.AZURE_CLIENT_SECRET }} --tenant ${{ secrets.AZURE_TENANT_ID }}

    - name: Azure PowerShell script
      uses: azure/powershell@v2
      with:
        azPSVersion: 'latest'
        inlineScript: |
          Get-AzContext
          Get-AzResourceGroup

    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'ApiServeraPP'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
