const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const credential = new DefaultAzureCredential();
    const client = new SecretClient("https://agentsecrets.vault.azure.net/", credential);
    const getResult = await client.getSecret("BuildkiteAgentToken");

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}