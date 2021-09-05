import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { MyStack } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  const stack = new MyStack(app, 'test');

  expect(stack).toHaveResource('AWS::EKS::Nodegroup', {
    ClusterName: {
      Ref: 'EKSClusterE11008B6',
    },
    NodeRole: {
      'Fn::GetAtt': [
        'EKSManagementRoleECCFF6AE',
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
        Ref: 'LaunchTemplate04EC5460',
      },
      Version: {
        'Fn::GetAtt': [
          'LaunchTemplate04EC5460',
          'LatestVersionNumber',
        ],
      },
    },
    NodegroupName: 'MGNodeGroupCustomSPOT',
    ScalingConfig: {
      DesiredSize: 1,
      MaxSize: 1,
      MinSize: 1,
    },
  });
  expect(stack).toHaveResourceLike('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            {
              Key: 'Name',
              Value: 'MGCustomNG-T3Medium-SPOT',
            },
          ],
        },
        {
          ResourceType: 'volume',
          Tags: [
            {
              Key: 'Name',
              Value: 'MGCustomNG-T3Medium-SPOT',
            },
          ],
        },
      ],
      UserData: {
        'Fn::Base64': 'MIME-Version: 1.0\nContent-Type: multipart/mixed; boundary="//"\n\n--//',
      },
    },
  });


});