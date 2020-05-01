const Identity = require('@azure/identity');
const RestNodeAuth = require("@azure/ms-rest-nodeauth");
const Keyvault = require("@azure/keyvault-secrets");
const { ContainerInstanceManagementClient } = require("@azure/arm-containerinstance");

function getAgentQueryRule(rule, agentQueryRules) {
    let taskDefinition = agentQueryRules.filter(query_rule => {
            return query_rule.startsWith(`${rule}=`);
        })
        .map(query_rule => {
            return query_rule.split("=")[1];
        })
        .shift();
    
    return taskDefinition;
}

module.exports = async function (context, req) {
    console.log(`fn=main body=${JSON.stringify(req.body)}`);
    console.log(`fn=main env=${JSON.stringify(process.env)}`);

    let job = req.body.job;

    let queue = getAgentQueryRule("queue", job.agent_query_rules);
    let expectedQueue = process.env.BUILDKITE_QUEUE || "azure";
    if (queue != expectedQueue) {
        console.log(`fn=main at=job_ignored`);

        return {
            statusCode: 400,
            body: JSON.stringify({
                message: `ignoring this job, the agent query rules specify queue='${queue}' which doesn't match '${expectedQueue}'`,
            }),
        };
    }

    console.log("fn=main at=job_accepted");

    // TODO put the subscription in the env using ARM
    console.log(`fn=main AZURE_SUBSCRIPTION_ID=${process.env['AZURE_SUBSCRIPTION_ID']}`);
    const subscriptionId = "14a5eabe-fd4d-41d2-9326-2647e6bfde09";
    
    const vaultCreds = new Identity.DefaultAzureCredential();
    const keyvaultClient = new Keyvault.SecretClient('https://agentsecrets.vault.azure.net/', vaultCreds);
    const agentSecret = await keyvaultClient.getSecret('BuildkiteAgentToken');
    console.log(`fn=main agentSecret=${JSON.stringify(agentSecret)}`);

    const armCreds = await RestNodeAuth.loginWithAppServiceMSI();
    console.log(`fn=main armCreds=${JSON.stringify(armCreds)}`);
    const containerClient = new ContainerInstanceManagementClient(armCreds, subscriptionId);

    const resourceGroup = "buildkite-on-demand-test";

    const resourceGroupContents = await containerClient.containerGroups.listByResourceGroup(resourceGroup);
    console.log(`fn=main resourceGroupContents=${JSON.stringify(resourceGroupContents)}`);

    const jobId = job.uuid || job.id;

    const image = getAgentQueryRule("image", job.agent_query_rules) || "keithduncan/buildkite-base";
    const cpu = parseInt(getAgentQueryRule("cpu", job.agent_query_rules) || "1");
    const memory = parseInt(getAgentQueryRule("memory", job.agent_query_rules) || "1");

    const containerGroup = jobId;
    const container = await containerClient.containerGroups.createOrUpdate(resourceGroup, containerGroup, { 
        location: 'australiaeast',
        name: "agent",
        containers: [{
            name: "agent",
            environmentVariables: [{
                name: 'BUILDKITE_AGENT_TOKEN', 
                value: agentSecret.value,
            }, {
                name: "BUILDKITE_AGENT_ACQUIRE_JOB",
                value: jobId,
            }],
            image: image,
            command: [
                "/buildkite/bin/buildkite-agent",
                "start",
                "--disconnect-after-job",
                "--disconnect-after-idle-timeout=10"
            ],
            resources: {
                limits: null,
                requests: {
                    cpu: cpu,
                    memoryInGB: memory
                }
            },
            volumeMounts: [{
                name: "agent",
                mountPath: "/buildkite",
            }]
        }, {
            name: "agent-init",
            image: "keithduncan/buildkite-sidecar",
            command: [
                "echo hello",
            ],
        }],
        restartPolicy: "Never",
        volumes: [{
            name: "agent",
            emptyDir: {}
        }],
        osType: 'Linux'
    });
    console.log(`fn=main container=${JSON.stringify(container)}`);

    const name = (req.query.name || (req.body && req.body.name));
    const responseMessage = name
        ? "Hello, " + name + ". This HTTP triggered function executed successfully."
        : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}