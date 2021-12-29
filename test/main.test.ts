import * as assertions from '@aws-cdk/assertions';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import { Stack, App } from '@aws-cdk/core';
import { AL2MG } from '../src/al2-mg';
import { BRMG } from '../src/br-mg';

test('Testing bottle rocket', () => {
  const app = new App();
  const stack = new Stack(app, 'test');
  const vpc = new ec2.Vpc(stack, 'VPC', { natGateways: 1 });
  const cluster = new eks.Cluster(stack, 'EKSCluster', {
    version: eks.KubernetesVersion.V1_21,
    vpc,
    clusterName: 'eks-mg-lab-cluster',
    defaultCapacity: 0,
    defaultCapacityInstance: new ec2.InstanceType('t3.medium'),
    albController: {
      version: eks.AlbControllerVersion.V2_3_0,
    },
  });
  const eksmgSG = new ec2.SecurityGroup(stack, 'EKSManagementSG', {
    securityGroupName: 'EKSManagementSG',
    vpc,
  });
  new BRMG(stack, 'BRMG', {
    cluster,
    eksmgSG,
    kubernetesVersion: '1.21',
  });

  // get nodegroup.
  assertions.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Nodegroup',
    assertions.Match.objectLike({
      ClusterName: {
        Ref: 'EKSClusterE11008B6',
      },
      NodeRole: {
        'Fn::GetAtt': [
          'BRMGEKSBRManagementRoleEC62791C',
          'Arn',
        ],
      },
      Subnets: [
        {
          Ref: 'VPCPrivateSubnet1Subnet8BCA10E0',
        },
        {
          Ref: 'VPCPrivateSubnet2SubnetCFCDAA7A',
        },
      ],
      CapacityType: 'SPOT',
      ForceUpdateEnabled: true,
      InstanceTypes: [
        't3.medium',
      ],
      LaunchTemplate: {
        Id: {
          Ref: 'BRMGLaunchTemplate6B1A3B76',
        },
        Version: {
          'Fn::GetAtt': [
            'BRMGLaunchTemplate6B1A3B76',
            'LatestVersionNumber',
          ],
        },
      },
      NodegroupName: 'MGNodeGroupCustomBRSPOT',
      ScalingConfig: {
        DesiredSize: 1,
        MaxSize: 1,
        MinSize: 1,
      },
    }));
  // get LaunchTemplate for bottle rocket.
  assertions.Template.fromStack(stack).hasResourceProperties('AWS::EC2::LaunchTemplate',
    assertions.Match.objectLike({
      LaunchTemplateData: {
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              {
                Key: 'Name',
                Value: 'MGNodeGroupCustomBRSPOT',
              },
            ],
          },
          {
            ResourceType: 'volume',
            Tags: [
              {
                Key: 'Name',
                Value: 'MGNodeGroupCustomBRSPOT',
              },
            ],
          },
        ],
        UserData: {
          'Fn::Base64': {
            'Fn::Join': [
              '',
              [
                '\n[settings.kubernetes]\napi-server="',
                {
                  'Fn::GetAtt': [
                    'EKSClusterE11008B6',
                    'Endpoint',
                  ],
                },
                '"\ncluster-certificate="',
                {
                  'Fn::GetAtt': [
                    'EKSClusterE11008B6',
                    'CertificateAuthorityData',
                  ],
                },
                '"\ncluster-name="',
                {
                  Ref: 'EKSClusterE11008B6',
                },
                '"',
              ],
            ],
          },
        },
      },
    }));
});

test('Testing amazon linux 2', () => {
  const app = new App();
  const stack = new Stack(app, 'test');
  const vpc = new ec2.Vpc(stack, 'VPC', { natGateways: 1 });
  const cluster = new eks.Cluster(stack, 'EKSCluster', {
    version: eks.KubernetesVersion.V1_21,
    vpc,
    clusterName: 'eks-mg-lab-cluster',
    defaultCapacity: 0,
    defaultCapacityInstance: new ec2.InstanceType('t3.medium'),
    albController: {
      version: eks.AlbControllerVersion.V2_3_0,
    },
  });
  const eksmgSG = new ec2.SecurityGroup(stack, 'EKSManagementSG', {
    securityGroupName: 'EKSManagementSG',
    vpc,
  });
  new AL2MG(stack, 'AL2MG', {
    cluster,
    eksmgSG,
    kubernetesVersion: '1.21',
  });

  // get nodegroup.
  assertions.Template.fromStack(stack).hasResourceProperties('AWS::EKS::Nodegroup',
    assertions.Match.objectLike({
      ClusterName: {
        Ref: 'EKSClusterE11008B6',
      },
      NodeRole: {
        'Fn::GetAtt': [
          'AL2MGEKSAL2ManagementRole2A95328D',
          'Arn',
        ],
      },
      Subnets: [
        {
          Ref: 'VPCPrivateSubnet1Subnet8BCA10E0',
        },
        {
          Ref: 'VPCPrivateSubnet2SubnetCFCDAA7A',
        },
      ],
      CapacityType: 'SPOT',
      ForceUpdateEnabled: true,
      InstanceTypes: [
        't3.medium',
      ],
      LaunchTemplate: {
        Id: {
          Ref: 'AL2MGLaunchTemplate18ACDF46',
        },
        Version: {
          'Fn::GetAtt': [
            'AL2MGLaunchTemplate18ACDF46',
            'LatestVersionNumber',
          ],
        },
      },
      NodegroupName: 'MGNodeGroupCustomAL2SPOT',
      ScalingConfig: {
        DesiredSize: 1,
        MaxSize: 1,
        MinSize: 1,
      },
    }));
  // get LaunchTemplate for amazon linux 2.
  assertions.Template.fromStack(stack).hasResourceProperties('AWS::EC2::LaunchTemplate',
    assertions.Match.objectLike({
      LaunchTemplateData: {
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              {
                Key: 'Name',
                Value: 'MGNodeGroupCustomAL2SPOT',
              },
            ],
          },
          {
            ResourceType: 'volume',
            Tags: [
              {
                Key: 'Name',
                Value: 'MGNodeGroupCustomAL2SPOT',
              },
            ],
          },
        ],
        UserData: {
          'Fn::Base64': 'MIME-Version: 1.0\nContent-Type: multipart/mixed; boundary="//"\n\n--//',
        },
      },
    }));
});