import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import { Construct, Stack, Tags } from '@aws-cdk/core';

export interface AL2MGProps {
  cluster: eks.Cluster;
  eksmgSG: ec2.SecurityGroup;
  kubernetesVersion: string;
}

export class AL2MG extends Construct {
  constructor(scope: Construct, id: string, props: AL2MGProps) {
    super(scope, id);

    const stack = Stack.of(this);
    const userData = ec2.MultipartUserData.forLinux({ shebang: 'MIME-Version: 1.0' });
    userData.addCommands('Content-Type: multipart/mixed; boundary="//"', '', '--//');
    const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      userData,
      securityGroup: props.eksmgSG,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(30),
      }],
    });

    const eksmgRole = new iam.Role(this, 'EKSAL2ManagementRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `EKSAL2ManagementRoleCreateby${stack.stackName}`,
    });

    Tags.of(lt).add('Name', 'MGNodeGroupCustomAL2SPOT');

    new eks.Nodegroup(this, 'NodeGroup', {
      nodegroupName: 'MGNodeGroupCustomAL2SPOT',
      capacityType: eks.CapacityType.SPOT,
      instanceTypes: [new ec2.InstanceType('t3.medium')],
      cluster: props.cluster,
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
  }
}