import { Api, RDS, StackContext } from 'sst/constructs';

export function VirtualOfficeStack({ stack }: StackContext) {
  const cluster = new RDS(stack, 'Cluster', {
    engine: 'postgresql11.13',
    defaultDatabaseName: 'VirtualOfficeDB',
    migrations: 'services/migrations',
    scaling: {
      autoPause: true,
      minCapacity: 'ACU_1',
      maxCapacity: 'ACU_1',
    },
  });

  const api = new Api(stack, 'Api', {
    defaults: {
      function: {
        bind: [cluster],
      },
    },
    routes: {
      'POST /': 'packages/functions/src/lambda.handler',
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
    SecretArn: cluster.secretArn,
    ClusterIdentifier: cluster.clusterIdentifier,
  });
}
