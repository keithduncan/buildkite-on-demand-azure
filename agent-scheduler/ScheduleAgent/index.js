import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";

module.exports = async function (context, req) {
    const options = {
        msiEndpoint: "http://127.0.0.1:41741/MSI/token/";
      }
       
      msRestNodeAuth.loginWithAppServiceMSI(options).then((msiTokenRes) => {
        console.log(msiTokenRes);
      }).catch((err) => {
        console.log(err);
      });
      

    context.log('JavaScript HTTP trigger function processed a request.');

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}