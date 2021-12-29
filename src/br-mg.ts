import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import * as ssm from '@aws-cdk/aws-ssm';
import { Construct, Stack, Tags } from '@aws-cdk/core';

export interface BRMGProps {
  cluster: eks.Cluster;
  eksmgSG: ec2.SecurityGroup;
  kubernetesVersion: string;
}

export class BRMG extends Construct {
  constructor(scope: Construct, id: string, props: BRMGProps) {
    super(scope, id);
    const stack = Stack.of(this);
    const machineImage = new BottleRocketImage({
      kubernetesVersion: props.kubernetesVersion,
    });
    const userData = ec2.UserData.custom('');
    userData.addCommands(...[
      '[settings.kubernetes]',
      `api-server="${props.cluster.clusterEndpoint}"`,
      `cluster-certificate="${props.cluster.clusterCertificateAuthorityData}"`,
      `cluster-name="${props.cluster.clusterName}"`,
    ]);
    const lt = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      userData,
      securityGroup: props.eksmgSG,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(30),
      },
      {
        deviceName: '/dev/xvdb',
        volume: ec2.BlockDeviceVolume.ebs(30),
      }],
      machineImage,
    });

    const eksmgRole = new iam.Role(this, 'EKSBRManagementRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `EKSBRManagementRoleCreateby${stack.stackName}`,
    });

    Tags.of(lt).add('Name', 'MGNodeGroupCustomBRSPOT');

    new eks.Nodegroup(this, 'NodeGroup', {
      nodegroupName: 'MGNodeGroupCustomBRSPOT',
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

/**
 * Properties for BottleRocketImage
 */
export interface BottleRocketImageProps {
  /**
   * The Kubernetes version to use
   */
  readonly kubernetesVersion: string;
}

/**
 * Construct an Bottlerocket image from the latest AMI published in SSM
 */
export class BottleRocketImage implements ec2.IMachineImage {
  private readonly kubernetesVersion: string;

  private readonly amiParameterName: string;

  /**
   * Constructs a new instance of the BottleRocketImage class.
   */
  public constructor(props: BottleRocketImageProps) {
    this.kubernetesVersion = props.kubernetesVersion;

    // set the SSM parameter name
    this.amiParameterName = `/aws/service/bottlerocket/aws-k8s-${this.kubernetesVersion}/x86_64/latest/image_id`;
  }

  /**
   * Return the correct image
   */
  public getImage(scope: Construct): ec2.MachineImageConfig {
    const ami = ssm.StringParameter.valueForStringParameter(scope, this.amiParameterName);
    return {
      imageId: ami,
      osType: ec2.OperatingSystemType.LINUX,
      userData: ec2.UserData.custom(''),
    };
  }
}