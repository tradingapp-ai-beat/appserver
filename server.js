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
        node-version: '18.x'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Login to Azure
      run: az login --service-principal -u ${{ secrets.AZURE_CLIENT_ID }} -p ${{ secrets.AZURE_CLIENT_SECRET }} --tenant ${{ secrets.AZURE_TENANT_ID }}

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'ApiServeraPP'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .
