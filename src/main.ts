import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import { App, CfnOutput, Construct, Stack, StackProps, Tags } from '@aws-cdk/core';
import { AL2MG } from '../src/al2-mg';
import { BRMG } from './br-mg';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'VPC', { natGateways: 1 });
    const cluster = new eks.Cluster(this, 'EKSCluster', {
      version: eks.KubernetesVersion.V1_21,
      vpc,
      clusterName: 'eks-mg-lab-cluster',
      defaultCapacity: 0,
      defaultCapacityInstance: new ec2.InstanceType('t3.medium'),
      albController: {
        version: eks.AlbControllerVersion.V2_3_0,
      },
    });
    const eksmgSG = new ec2.SecurityGroup(this, 'EKSManagementSG', {
      securityGroupName: 'EKSManagementSG',
      vpc,
    });
    // Need to Tag for svc load balancer.
    Tags.of(eksmgSG).add(`kubernetes.io/cluster/${cluster.clusterName}`, 'owned');
    cluster.connections.allowFrom(eksmgSG, ec2.Port.allTraffic(), 'Allow MG Node SG to access EKS Cluster');
    eksmgSG.connections.allowFrom(cluster.connections, ec2.Port.allTraffic(), 'Allow EKS Control Plane to to access Node');

    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
    new BRMG(this, 'BRMG', {
      cluster,
      eksmgSG,
      kubernetesVersion: '1.21',
    });
    new AL2MG(this, 'AL2MG', {
      cluster,
      eksmgSG,
      kubernetesVersion: '1.21',
    });

  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'eks-mg-lab', { env: devEnv });
app.synth();