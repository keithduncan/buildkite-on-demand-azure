const Identity = require('@azure/identity');
const RestNodeAuth = require("@azure/ms-rest-nodeauth");
const Keyvault = require("@azure/keyvault-secrets");
const { ContainerInstanceManagementClient } = require("@azure/arm-containerinstance");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');
    console.log(`fn=main env=${JSON.stringify(process.env)}`);
    console.log(`fn=main AZURE_SUBSCRIPTION_ID=${process.env['AZURE_SUBSCRIPTION_ID']}`);
    
    const vaultCreds = new Identity.DefaultAzureCredential();
    const keyvaultClient = new Keyvault.SecretClient('https://agentsecrets.vault.azure.net/', vaultCreds);
    const agentSecret = await keyvaultClient.getSecret('BuildkiteAgentToken');
    console.log(`fn=main agentSecret=${agentSecret}`);

    const armCreds = await RestNodeAuth.loginWithAppServiceMSI();
    console.log(`${JSON.stringify(armCreds)}`);
    // TODO this should come from env?
    const subscriptionId = "14a5eabe-fd4d-41d2-9326-2647e6bfde09";
    const containerClient = new ContainerInstanceManagementClient(armCreds, subscriptionId);
    const resourceGroup = await containerClient.containerGroups.listByResourceGroup("buildkite-on-demand-test");
    console.log(`fn=main resourceGroup=${JSON.stringify(resourceGroup)}`);

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}