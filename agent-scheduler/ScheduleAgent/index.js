const { DefaultAzureCredential } = require("@azure/identity");
const RestNodeAuth = require("@azure/ms-rest-nodeauth");

const { SecretClient } = require("@azure/keyvault-secrets");
const { ContainerInstanceManagementClient } = require("@azure/arm-containerinstance");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    console.log(`${JSON.stringify(process.env)}`);

    const credential = new DefaultAzureCredential();
    console.log(`${JSON.stringify(credential)}`);

    const client = new SecretClient("https://agentsecrets.vault.azure.net/", credential);
    const getResult = await client.getSecret("BuildkiteAgentToken");
    console.log(`buildkite token: ${JSON.stringify(getResult)}`);
    // getResult.value

    // const options = {
    //     msiEndpoint: "http://127.0.0.1:41741/MSI/token/",
    // };
    // const msiTokenRes = await RestNodeAuth.loginWithAppServiceMSI(options);
    // console.log(`${msiTokenRes}`);

    const containerClient = new ContainerInstanceManagementClient(credential);

    const resourceGroup = await containerClient.listByResourceGroup("buildkite-on-demand-test");
    console.log(`${JSON.stringify(resourceGroup)}`);

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}