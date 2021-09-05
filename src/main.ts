import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import { App, CfnOutput, Construct, Stack, StackProps, Tags } from '@aws-cdk/core';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'VPC', { natGateways: 1 });
    const cluster = new eks.Cluster(this, 'EKSCluster', {
      version: eks.KubernetesVersion.V1_20,
      vpc,
      clusterName: 'eks-mg-lab-cluster',
      defaultCapacity: 0,
      defaultCapacityInstance: new ec2.InstanceType('t3.medium'),
    });
    const eksmgSG = new ec2.SecurityGroup(this, 'EKSManagementSG', {
      securityGroupName: 'EKSManagementSG',
      vpc,
    });
    // Need to Tag for svc load balancer.
    Tags.of(eksmgSG).add(`kubernetes.io/cluster/${cluster.clusterName}`, 'owned');
    cluster.connections.allowFrom(eksmgSG, ec2.Port.allTraffic(), 'Allow MG Node SG to access EKS Cluster');

    const userData = ec2.MultipartUserData.forLinux({ shebang: 'MIME-Version: 1.0' });
    userData.addCommands('Content-Type: multipart/mixed; boundary="//"', '', '--//');
    const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      userData,
      securityGroup: eksmgSG,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(30),
      }],
    });

    const eksmgRole = new iam.Role(this, 'EKSManagementRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `EKSManagementRoleCreateby${this.stackName}`,
    });

    Tags.of(lt).add('Name', 'MGCustomNG-T3Medium-SPOT');

    new eks.Nodegroup(this, 'NodeGroup', {
      nodegroupName: 'MGNodeGroupCustomSPOT',
      capacityType: eks.CapacityType.SPOT,
      instanceTypes: [new ec2.InstanceType('t3.medium')],
      cluster,
      nodeRole: eksmgRole,
      desiredSize: 1,
      launchTemplateSpec: {
        id: lt.launchTemplateId!,
        version: lt.versionNumber,
      },
    });

    eksmgRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'));
    eksmgRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'));
    eksmgRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'));
    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'eks-mg-lab', { env: devEnv });
app.synth();