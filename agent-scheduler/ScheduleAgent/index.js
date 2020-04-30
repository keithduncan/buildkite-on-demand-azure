import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let msiToken = await msRestNodeAuth.loginWithAppServiceMSI();

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}